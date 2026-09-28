"""Offline ASR for timing. Whisper (openai-whisper) weights are blocked on this network, so we use
sherpa-onnx models from GitHub releases: Thai zipformer (token timestamps) + Whisper-medium (text check).
Usage: python3 src/tools/transcribe_sherpa.py <models_dir>   -> work/asr_tokens.json"""
import json, sys, numpy as np, soundfile as sf, sherpa_onnx
M = sys.argv[1]
audio, sr = sf.read("work/voice16k.wav", dtype="float32")
z = f"{M}/sherpa-onnx-zipformer-thai-2024-06-20"
rec = sherpa_onnx.OfflineRecognizer.from_transducer(
    encoder=f"{z}/encoder-epoch-12-avg-5.int8.onnx", decoder=f"{z}/decoder-epoch-12-avg-5.int8.onnx",
    joiner=f"{z}/joiner-epoch-12-avg-5.int8.onnx", tokens=f"{z}/tokens.txt", num_threads=4)
w = f"{M}/sherpa-onnx-whisper-medium"
wh = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{w}/medium-encoder.int8.onnx",
    decoder=f"{w}/medium-decoder.int8.onnx", tokens=f"{w}/medium-tokens.txt", language="th", num_threads=4)
# chunk on silences so each piece is short (whisper max 30 s)
chunks = json.load(open("work/chunks.json"))
out = []
for c0, c1 in chunks:
    seg = audio[int(c0*sr):int(c1*sr)]
    s = rec.create_stream(); s.accept_waveform(sr, seg); rec.decode_stream(s)
    s2 = wh.create_stream(); s2.accept_waveform(sr, seg); wh.decode_stream(s2)
    toks = [{"t": t, "s": round(c0 + ts, 3)} for t, ts in zip(s.result.tokens, s.result.timestamps)]
    out.append({"start": c0, "end": c1, "zipformer": s.result.text, "whisper": s2.result.text, "tokens": toks})
    print(f"{c0:6.2f}-{c1:6.2f} | {s.result.text} | {s2.result.text}", flush=True)
json.dump(out, open("work/asr_tokens.json", "w"), ensure_ascii=False, indent=1)
