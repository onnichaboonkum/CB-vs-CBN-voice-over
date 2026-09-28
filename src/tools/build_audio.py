"""Build all audio from src/timeline.json.

  work/voice.m4a  --(voiceEdit.keep)-->  Output/voice_before.wav   (edited, unprocessed)
                  --(EQ/comp chain)--->  Output/voice_after.wav    (what goes in the video)
  + SFX (assets/sfx, placeholders generated if missing, peak -18 dBFS)
  + BGM (assets/bgm, placeholder generated if missing, sidechain-ducked under the voice)
  ->  work/mix_final.wav, work/mix_noBGM.wav
"""
import json, os, subprocess, sys
import numpy as np
import soundfile as sf

SR = 48000
T = json.load(open("src/timeline.json"))
os.makedirs("work", exist_ok=True); os.makedirs("Output", exist_ok=True)
os.makedirs("assets/sfx", exist_ok=True); os.makedirs("assets/bgm", exist_ok=True)


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", *args], check=True)


def db(x):
    return 20 * np.log10(max(x, 1e-12))


# ------------------------------------------------------------------ 1. voice edit
src = T["voiceEdit"]["source"]
ff("-i", src, "-ac", "2", "-ar", str(SR), "-c:a", "pcm_f32le", "work/voice_src.wav")
raw, _ = sf.read("work/voice_src.wav", dtype="float32")
FADE = int(0.006 * SR)
parts = []
for a, b in T["voiceEdit"]["keep"]:
    seg = raw[int(round(a * SR)):int(round(b * SR))].copy()
    ramp = np.linspace(0, 1, FADE, dtype=np.float32)[:, None]
    seg[:FADE] *= ramp; seg[-FADE:] *= ramp[::-1]
    parts.append(seg)
edit = np.concatenate(parts)
total = int(round(T["duration"] * SR))
edit = np.pad(edit, ((0, max(0, total - len(edit))), (0, 0)))[:total]
sf.write("Output/voice_before.wav", edit, SR, subtype="PCM_24")

# ------------------------------------------------------------------ 2. spectrum check -> 3.2 kHz boost
mono = edit.mean(axis=1)
active = mono[np.abs(mono) > 10 ** (-40 / 20)] if np.any(np.abs(mono) > 10 ** (-40 / 20)) else mono
spec = np.abs(np.fft.rfft(active * np.hanning(len(active)))) ** 2
freqs = np.fft.rfftfreq(len(active), 1 / SR)
band = lambda lo, hi: spec[(freqs >= lo) & (freqs < hi)].sum()
low, pres = band(80, 500), band(2000, 4000)
diff = 10 * np.log10(low / pres)
# the bigger the low-vs-presence gap, the more 3.2 kHz lift (clamped to +3..+6 dB)
g32 = float(np.clip(3 + (diff - 12) / 4, 3, 6))
g32 = round(g32 * 2) / 2
print(f"[spectrum] energy 80-500 Hz vs 2-4 kHz: {diff:.1f} dB  -> 3.2 kHz boost {g32:+.1f} dB")

chain = ",".join([
    "highpass=f=90:poles=2",
    "equalizer=f=180:t=q:w=1.0:g=-2",
    "equalizer=f=280:t=q:w=1.0:g=-4",
    "equalizer=f=500:t=q:w=1.2:g=-2",
    "equalizer=f=1800:t=q:w=1.2:g=2",
    f"equalizer=f=3200:t=q:w=1.0:g={g32}",
    "highshelf=f=9000:g=3",
    "deesser=i=0.4",
    "acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=2",
    "loudnorm=I=-14:TP=-1.5:LRA=9",
    "alimiter=limit=0.84:level=false",
])
ff("-i", "Output/voice_before.wav", "-af", chain, "-ar", str(SR), "-c:a", "pcm_s24le", "Output/voice_after.wav")
voice, _ = sf.read("Output/voice_after.wav", dtype="float32")
voice = np.pad(voice, ((0, max(0, total - len(voice))), (0, 0)))[:total]

# ------------------------------------------------------------------ 3. SFX (placeholders if missing)
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR


def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc; y[i] = acc
    return y


def noise_sweep(d, f0, f1, env_pow):
    t = t_(d); n = rng.standard_normal(len(t))
    # crude band-pass: difference of low-passes, cutoff swept by chunks
    out = np.zeros_like(n); step = 480
    for i in range(0, len(n), step):
        f = f0 + (f1 - f0) * (i / len(n))
        chunk = n[max(0, i - 2000):i + step]
        y = lp(chunk, f * 1.6) - lp(chunk, f * 0.6)
        out[i:i + step] = y[-len(n[i:i + step]):]
    env = np.sin(np.pi * t / d) ** env_pow
    return out * env


def gen_sfx():
    out = {}
    out["card_swipe.wav"] = noise_sweep(0.32, 900, 4200, 1.5)
    t = t_(0.14); f = 520 * np.exp(-t * 9)
    out["pop.wav"] = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * (1 - np.exp(-t * 900))
    t = t_(0.05); out["click.wav"] = (np.sin(2 * np.pi * 1850 * t) * 0.6 + rng.standard_normal(len(t)) * 0.25) * np.exp(-t * 140)
    out["whoosh.wav"] = noise_sweep(0.45, 300, 1800, 2.0)
    return out


made = []
for name, sig in gen_sfx().items():
    p = f"assets/sfx/{name}"
    if not os.path.exists(p):
        sf.write(p, np.stack([sig, sig], 1).astype(np.float32), SR, subtype="PCM_16"); made.append(p)
if made:
    print("[sfx] generated TEMPORARY placeholders:", ", ".join(made))

peak_target = 10 ** (T["audio"]["sfxPeakDb"] / 20)
sfx_track = np.zeros_like(voice)
for c in T["sfx"]:
    s, _sr = sf.read(f"assets/sfx/{c['file']}", dtype="float32", always_2d=True)
    if s.shape[1] == 1: s = np.repeat(s, 2, 1)
    s = s / (np.abs(s).max() + 1e-9) * peak_target
    i = int(c["t"] * SR); j = min(total, i + len(s))
    sfx_track[i:j] += s[:j - i]
sfx_track = np.clip(sfx_track, -peak_target, peak_target)   # overlaps can never exceed -18 dBFS

# ------------------------------------------------------------------ 4. BGM (placeholder lo-fi 90 BPM if missing)
BGM = "assets/bgm/bgm_placeholder_lofi_90bpm.wav"


def gen_bgm(seconds):
    bpm = 90; beat = 60 / bpm; n = int(seconds * SR); y = np.zeros(n)
    chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]  # Fmaj7 Em7 Dm7 Cmaj7
    hz = lambda m: 440 * 2 ** ((m - 69) / 12)
    bar = 4 * beat; t_bar = np.arange(int(bar * SR)) / SR
    for k in range(int(seconds / bar) + 1):
        ch = chords[k % 4]; i0 = int(k * bar * SR)
        for off in (0.0, 2.5 * beat):          # two soft stabs per bar (lazy e-piano)
            j0 = i0 + int(off * SR); tt = t_bar[:int(1.5 * beat * SR)]
            env = np.exp(-tt * 2.2) * (1 - np.exp(-tt * 60))
            s = sum(np.sin(2 * np.pi * hz(m) * tt * (1 + 0.0015 * r)) + 0.25 * np.sin(4 * np.pi * hz(m) * tt)
                    for r, m in zip((-1, 1, -1, 1), ch)) * env * 0.09
            j1 = min(n, j0 + len(s)); y[j0:j1] += s[:j1 - j0]
        bass = hz(ch[0] - 12); tb = t_bar
        s = np.sin(2 * np.pi * bass * tb) * np.exp(-tb * 0.9) * 0.16
        j1 = min(n, i0 + len(s)); y[i0:j1] += s[:j1 - i0]
        for b in range(4):                      # kick on 1 & 3, soft hat with swing
            jb = i0 + int(b * beat * SR); tk = np.arange(int(0.25 * SR)) / SR
            if b in (0, 2):
                k_ = np.sin(2 * np.pi * np.cumsum(50 + 60 * np.exp(-tk * 30)) / SR) * np.exp(-tk * 12) * 0.35
                j1 = min(n, jb + len(k_)); y[jb:j1] += k_[:j1 - jb]
            for h in (0.0, 0.58):
                jh = jb + int(h * beat * SR); th = np.arange(int(0.05 * SR)) / SR
                hh = rng.standard_normal(len(th)) * np.exp(-th * 90) * 0.035
                j1 = min(n, jh + len(hh)); y[jh:j1] += hh[:j1 - jh]
    y = lp(y, 3500)
    crackle = (rng.random(n) > 0.9994) * rng.standard_normal(n) * 0.05
    y = y + crackle + rng.standard_normal(n) * 0.002
    return np.stack([y, y], 1).astype(np.float32)


if not os.path.exists(BGM):
    sf.write(BGM, gen_bgm(64.0), SR, subtype="PCM_16")
    print("[bgm] generated TEMPORARY placeholder:", BGM)

# loop/trim BGM to length, fade out, normalise; then duck under the voice with sidechaincompress
b, _ = sf.read(BGM, dtype="float32", always_2d=True)
if b.shape[1] == 1: b = np.repeat(b, 2, 1)
reps = int(np.ceil(total / len(b))); b = np.tile(b, (reps, 1))[:total]
fo = int(1.5 * SR); b[-fo:] *= np.linspace(1, 0, fo)[:, None]
fi = int(0.3 * SR); b[:fi] *= np.linspace(0, 1, fi)[:, None]
# pre-duck level: bgmGainDb relative to the voice RMS during speech; the ducker then pulls it a few dB lower
sp_mask = np.abs(voice.mean(1)) > 10 ** (-35 / 20)
v_rms = np.sqrt(np.mean(voice[sp_mask] ** 2)); b_rms = np.sqrt(np.mean(b ** 2))
b *= v_rms * 10 ** (T["audio"]["bgmGainDb"] / 20) / b_rms
sf.write("work/bgm_len.wav", b, SR, subtype="FLOAT")
sf.write("work/sfx_track.wav", sfx_track, SR, subtype="FLOAT")
ff("-i", "work/bgm_len.wav", "-i", "Output/voice_after.wav", "-filter_complex",
   "[1]pan=stereo|c0=c0|c1=c1[k];[0][k]sidechaincompress=threshold=0.1:ratio=2:attack=30:release=400:makeup=1[d]",
   "-map", "[d]", "-c:a", "pcm_f32le", "work/bgm_ducked.wav")
bgm, _ = sf.read("work/bgm_ducked.wav", dtype="float32", always_2d=True)
bgm = np.pad(bgm, ((0, max(0, total - len(bgm))), (0, 0)))[:total]

# ------------------------------------------------------------------ 5. mixes
for name, parts_ in (("mix_final", (voice, sfx_track, bgm)), ("mix_noBGM", (voice, sfx_track))):
    mix = sum(parts_)
    pk = np.abs(mix).max()
    if pk > 0.89:                     # never clip: -1 dBFS ceiling
        mix *= 0.89 / pk
    sf.write(f"work/{name}.wav", mix.astype(np.float32), SR, subtype="FLOAT")
    print(f"[mix] {name}: peak {db(np.abs(mix).max()):.2f} dBFS")


def rms_db(x):
    return db(np.sqrt(np.mean(x ** 2)) + 1e-12)


speech = np.abs(voice.mean(1)) > 10 ** (-35 / 20)
print(f"[levels] voice peak {db(np.abs(voice).max()):.2f} dBFS | SFX peak {db(np.abs(sfx_track).max()):.2f} dBFS | "
      f"BGM rms under speech {rms_db(bgm[speech]) - rms_db(voice[speech]):.1f} dB rel. voice "
      f"({100 * 10 ** ((rms_db(bgm[speech]) - rms_db(voice[speech])) / 20):.1f} %)")
json.dump({"presence_gap_db": round(float(diff), 1), "boost_3k2_db": g32}, open("work/audio_report.json", "w"))
