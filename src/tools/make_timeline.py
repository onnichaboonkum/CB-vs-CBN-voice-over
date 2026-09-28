"""Bootstrap src/timeline.json from the ASR timing of the raw VO (work/voice.m4a).

Run ONCE (or with --force to regenerate). After that, edit src/timeline.json directly:
it is the single source of truth for scene times, on-screen text, subtitles, SFX cues and the
voice edit (which parts of the raw recording are kept).

All times written to timeline.json are in OUTPUT time (edited voice), except voiceEdit.keep,
which lists [srcStart, srcEnd] ranges of the raw recording.

Timing source: sherpa-onnx Thai zipformer token timestamps (work/asr_tokens.json) +
ffmpeg silencedetect speech boundaries. Text source: Pair's VO script (ASR is only used for timing).
"""
import json, os, sys

OUT = "src/timeline.json"
if os.path.exists(OUT) and "--force" not in sys.argv:
    sys.exit(f"{OUT} exists - edit it directly, or pass --force to regenerate (overwrites edits)")

# ---------------------------------------------------------------- 1. voice edit (source seconds)
# speech intervals from silencedetect (-45 dB, 0.3 s). Takes Pair marked "เอาใหม่ คัด" are dropped.
SPEECH = [
    (1.167, 2.867, "ประกันมะเร็ง มี 2 แบบ"),
    (3.619, 4.934, "และมันจ่ายไม่เหมือนกันเลย"),
    (6.278, 7.877, "แบบแรก ให้เป็นเงินก้อน"),
    (8.658, 9.464, "ตัวอย่างแผนหนึ่ง"),
    (9.997, 12.058, "เจอระยะเริ่มต้น รับก่อน 1 แสน"),
    (12.633, 13.274, "ถ้าวันหนึ่ง"),
    (13.788, 16.273, "กลายเป็นระยะลุกลาม ยังรับเงินก้อนได้อีก"),
    (17.549, 19.376, "เงินก้อนนี้ใช้อะไรก็ได้"),
    (20.390, 21.556, "ค่าเดินทางไปหาหมอ"),
    (22.276, 23.946, "ค่ากินอยู่ ช่วงที่ทำงานไม่ได้"),
    # 25.43-27.54 first take of "แบบที่สอง..." + 31.02 "เอาใหม่ คัด"  -> dropped
    (33.110, 35.085, "แบบที่สอง จ่ายเป็นค่ารักษา"),
    (35.828, 38.497, "อย่างแผนนี้ วงเงิน 2 ล้านต่อมะเร็งหนึ่งโรค"),
    (39.128, 40.745, "สูงสุดตลอดสัญญา 6 ล้าน"),
    # 41.32-44.01 first take of "ค่าห้อง..." + 45.17 "เอาใหม่ คัด" -> dropped
    (47.826, 49.082, "ค่าห้องวันละ 4,000"),
    (49.390, 50.572, "ที่เหลือจ่ายตามจริง"),
    (52.475, 53.937, "ที่หลายคนไม่รู้คือ"),
    (54.390, 56.791, "บางแผนดูแลไปถึงหลังรักษา"),
    (57.498, 59.410, "มีค่าปรึกษานักจิตวิทยา"),
    (60.053, 60.848, "ค่ากายภาพ"),
    (61.419, 62.464, "อย่างละ 20 ครั้ง"),
    # 63.36 "และ" + 64.52 "เอาใหม่ คัด" + 66.42 second take + 69.10 "เอาใหม่ คัด" -> dropped
    (71.239, 73.816, "และศัลยกรรมตกแต่งเต้านมหลังผ่าตัดด้วย"),
    (75.791, 76.361, "แต่ทั้ง 2 แบบ"),
    (76.877, 77.847, "มีเรื่องที่ต้องรู้"),
    (78.430, 80.477, "ต้องตรวจเจอหลังเริ่มคุ้มครอง 60 วัน"),
    (81.055, 85.271, "และมะเร็งที่เป็นมาก่อน รวมถึงกลับมาเป็นซ้ำจากอันเดิม ไม่คุ้มครอง"),
    (86.284, 86.578, "สรุป"),
    (87.183, 88.276, "เงินก้อนดูแลชีวิต"),
    (88.795, 89.947, "ค่ารักษาดูแลบิล"),
    (90.504, 92.445, "ลองเช็คเล่มที่บ้านดูว่าเป็นแบบไหน"),
    (93.209, 95.396, "เซฟไว้ แล้วส่งให้พ่อแม่เช็คด้วยนะ"),
]
LEAD_IN = 0.20      # silence before the first word
TAIL = 0.60         # clip ends 0.6 s after the last word
CAP_IN = 0.32       # max pause inside a scene (natural breath)
CAP_SCENE = 0.40    # max pause at a scene change (dead air > 0.4 s is cut)

# scene anchors = first word of each scene (source seconds)
SCENE_ANCHORS = {"S1": 1.167, "S2": 6.278, "S3": 8.658, "S4": 17.549, "S5": 33.110,
                 "S6": 35.828, "S7": 52.475, "S8": 75.791, "S9": 86.284, "S10": 93.209}
scene_starts = set(SCENE_ANCHORS.values())

keep = []
for i, (s, e, _) in enumerate(SPEECH):
    a = max(0.0, s - LEAD_IN) if i == 0 else None
    if i > 0:
        pe = SPEECH[i - 1][1]
        cap = CAP_SCENE if s in scene_starts else CAP_IN
        p = min(s - pe, cap)
        keep[-1][1] = round(pe + p / 2, 3)
        a = s - p / 2
    keep.append([round(a, 3), None])
keep[-1][1] = round(SPEECH[-1][1] + TAIL, 3)


def m(t):
    """source time -> output time"""
    off = 0.0
    for a, b in keep:
        if a - 1e-6 <= t <= b + 1e-6:
            return round(off + (t - a), 3)
        off += b - a
    # inside a removed region -> snap to next kept start
    off = 0.0
    for a, b in keep:
        if t < a:
            return round(off, 3)
        off += b - a
    return round(off, 3)


DUR = round(sum(b - a for a, b in keep), 3)
TOK = 0.04  # zipformer token stamps run ~40 ms early vs. the waveform onset

# ---------------------------------------------------------------- 2. scenes (text = exactly the approved table)
DISCLAIMER = ["ตัวอย่างจากสัญญาเพิ่มเติมคุ้มครองโรคมะเร็ง และมะเร็งหายห่วง ·",
              "ผลประโยชน์ขึ้นอยู่กับแผนที่เลือก เป็นไปตามเงื่อนไขกรมธรรม์"]


def cue(src):  # word start in source time (token stamp) -> output time
    return m(src + TOK)


scenes = [
    {"id": "S1", "name": "Hook", "bg": "split",
     "text": {"title": ["ประกันมะเร็ง", "2 แบบ"], "sub": "จ่ายไม่เหมือนกันเลย"},
     "cues": {"sub": cue(3.52)}},
    {"id": "S2", "name": "แบบที่ 1", "bg": "sangria",
     "text": {"pill": {"num": "1", "label": "แบบเงินก้อน"}, "title": "แบบเงินก้อน", "ghost": "Lump sum"},
     "cues": {"open": cue(7.34)}},
    {"id": "S3", "name": "ตัวเลข", "bg": "ice",
     "text": {"pill": {"num": "1", "label": "แบบเงินก้อน"}, "line1": "ระยะเริ่มต้น", "number": 100000,
              "line2": "ลุกลาม", "block": "ยังรับได้อีก"},
     "cues": {"line1": cue(9.98), "number": cue(11.54), "arrow": cue(14.01), "line2": cue(14.33),
              "block": cue(14.97)}},
    {"id": "S4", "name": "ใช้กับชีวิต", "bg": "ice",
     "text": {"pill": {"num": "1", "label": "แบบเงินก้อน"}, "title": ["ใช้ได้ทุกเรื่อง", "ของชีวิต"]},
     "cues": {"title": cue(18.41), "car": cue(20.33), "bowl": cue(22.34), "house": cue(22.98)}},
    {"id": "S5", "name": "แบบที่ 2", "bg": "rootbeer",
     "text": {"pill": {"num": "2", "label": "แบบจ่ายค่ารักษา"}, "title": "แบบจ่ายค่ารักษา", "ghost": "Bills"},
     "cues": {"receipt": cue(33.89), "check": cue(34.41)}},
    {"id": "S6", "name": "วงเงิน", "bg": "rootbeer",
     "text": {"pill": {"num": "2", "label": "แบบจ่ายค่ารักษา"},
              "cards": [{"pre": "", "num": 2, "fmt": "int", "post": "ล้าน / โรค"},
                        {"pre": "สูงสุด", "num": 6, "fmt": "int", "post": "ล้าน"},
                        {"pre": "ห้อง", "num": 4000, "fmt": "comma", "post": "/ วัน"}],
              "note": "ที่เหลือจ่ายตามจริง"},
     "cues": {"card1": cue(36.61), "card2": cue(39.07), "card3": cue(47.77), "note": cue(49.33)}},
    {"id": "S7", "name": "Aha หลังรักษา", "bg": "ice",
     "text": {"title": ["ดูแลถึง", "หลังรักษา"], "ghost": "After care",
              "chips": [{"icon": "heart-speech", "label": "จิตวิทยา", "detail": ["1,500", "×", "20", "ครั้ง"]},
                        {"icon": "stretching", "label": "กายภาพ", "detail": ["1,500", "×", "20", "ครั้ง"]},
                        {"icon": "ribbon", "label": "ตกแต่งเต้านม", "detail": ["ตามจ่ายจริง"]}]},
     "cues": {"title": cue(54.33), "highlight": cue(55.97), "chip1": cue(58.20), "chip2": cue(60.03),
              "count20": cue(61.72), "chip3": cue(71.22), "punch": cue(72.82)}},
    {"id": "S8", "name": "เรื่องที่ต้องรู้", "bg": "rootbeer",
     "text": {"title": "ต้องรู้ก่อน", "ghost": "60 days",
              "card1": {"head": "60 วัน", "sub": ["ต้องตรวจเจอหลัง", "เริ่มคุ้มครอง"]},
              "card2": {"head": ["เป็นมาก่อน", "ทำประกัน"], "sub": ["รวมถึงกลับมาเป็นซ้ำ", "จากอันเดิม"]}},
     "cues": {"title": cue(76.94), "card1": cue(78.37), "flip": cue(79.85), "card2": cue(81.00),
              "card2sub": cue(82.31), "x": cue(84.47)}},
    {"id": "S9", "name": "สรุป", "bg": "split",
     "text": {"left": ["เงินก้อน", "= ชีวิต"], "right": ["ค่ารักษา", "= บิล"]},
     "cues": {"left": cue(87.12), "right": cue(88.73), "checks": cue(90.44)}},
    {"id": "S10", "name": "CTA", "bg": "ice",
     "text": {"title": ["เซฟไว้", "เช็คเล่มที่บ้าน"], "sub": "ส่งให้พ่อแม่เช็คด้วยนะ"},
     "cues": {"sub": cue(94.07)}},
]
for i, sc in enumerate(scenes):
    sc["anchor"] = m(SCENE_ANCHORS[sc["id"]]) if i else 0.0
    sc["start"] = 0.0 if i == 0 else round(sc["anchor"] - 0.12, 3)
for i, sc in enumerate(scenes):
    sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else DUR

# ---------------------------------------------------------------- 3. subtitles (VO script text, ASR timing)
# each: (source start, source end, lines). [[...]] marks a keyword -> Sangria block
SUBS = [
    (1.167, 2.867, ["ประกันมะเร็ง มี 2 แบบ"]),
    (3.619, 4.934, ["และมันจ่าย", "ไม่เหมือนกันเลย"]),
    (6.278, 7.877, ["แบบแรก", "ให้เป็น[[เงินก้อน]]"]),
    (8.658, 9.464, ["ตัวอย่างแผนหนึ่ง"]),
    (9.997, 12.058, ["เจอระยะเริ่มต้น", "รับก่อน 1 แสน"]),
    (12.633, 14.93, ["ถ้าวันหนึ่งกลายเป็น", "ระยะลุกลาม"]),
    (14.97 + TOK, 16.273, ["ยังรับ[[เงินก้อน]]ได้อีก"]),
    (17.549, 19.376, ["[[เงินก้อน]]นี้", "ใช้อะไรก็ได้"]),
    (20.390, 21.556, ["ค่าเดินทางไปหาหมอ"]),
    (22.276, 23.946, ["ค่ากินอยู่", "ช่วงที่ทำงานไม่ได้"]),
    (33.110, 35.085, ["แบบที่สอง", "จ่ายเป็น[[ค่ารักษา]]"]),
    (35.828, 37.45, ["อย่างแผนนี้", "วงเงิน 2 ล้าน"]),
    (37.49 + TOK, 38.497, ["ต่อมะเร็งหนึ่งโรค"]),
    (39.128, 40.745, ["สูงสุดตลอดสัญญา", "6 ล้าน"]),
    (47.826, 49.082, ["ค่าห้องวันละ 4,000"]),
    (49.390, 50.572, ["ที่เหลือจ่ายตามจริง"]),
    (52.475, 53.937, ["ที่หลายคนไม่รู้คือ"]),
    (54.390, 56.791, ["บางแผนดูแลไปถึง", "หลังรักษา"]),
    (57.498, 59.410, ["มีค่าปรึกษา", "นักจิตวิทยา"]),
    (60.053, 60.848, ["ค่ากายภาพ"]),
    (61.419, 62.464, ["อย่างละ [[20 ครั้ง]]"]),
    (71.239, 72.80, ["และศัลยกรรม", "ตกแต่งเต้านม"]),
    (72.82 + TOK, 73.816, ["หลังผ่าตัดด้วย"]),
    (75.791, 77.847, ["แต่ทั้ง 2 แบบ", "มีเรื่องที่ต้องรู้"]),
    (78.430, 80.477, ["ต้องตรวจเจอหลัง", "เริ่มคุ้มครอง [[60 วัน]]"]),
    (81.055, 82.28, ["และมะเร็ง", "ที่เป็นมาก่อน"]),
    (82.31 + TOK, 84.42, ["รวมถึงกลับมาเป็นซ้ำ", "จากอันเดิม"]),
    (84.47 + TOK, 85.271, ["ไม่คุ้มครอง"]),
    (86.284, 86.95, ["สรุป"]),
    (87.183, 88.276, ["[[เงินก้อน]]ดูแลชีวิต"]),
    (88.795, 89.947, ["[[ค่ารักษา]]ดูแลบิล"]),
    (90.504, 92.445, ["ลองเช็คเล่มที่บ้าน", "ดูว่าเป็นแบบไหน"]),
    (93.209, 95.396, ["เซฟไว้ แล้วส่งให้", "พ่อแม่เช็คด้วยนะ"]),
]
subs = []
for i, (s, e, lines) in enumerate(SUBS):
    a, b = m(s), m(e) + 0.25
    if i + 1 < len(SUBS):
        b = min(b, m(SUBS[i + 1][0]) - 0.02)
    subs.append({"start": a, "end": round(min(b, DUR), 3), "lines": lines})

# ---------------------------------------------------------------- 4. SFX cues
S = {sc["id"]: sc for sc in scenes}
sfx = [
    {"t": S["S2"]["start"], "file": "card_swipe.wav"},
    {"t": S["S3"]["start"], "file": "whoosh.wav"},
    {"t": S["S3"]["cues"]["number"], "file": "pop.wav"},
    {"t": S["S4"]["start"], "file": "whoosh.wav"},
    {"t": S["S4"]["cues"]["car"], "file": "click.wav"},
    {"t": S["S4"]["cues"]["bowl"], "file": "click.wav"},
    {"t": S["S4"]["cues"]["house"], "file": "click.wav"},
    {"t": S["S5"]["start"], "file": "card_swipe.wav"},
    {"t": S["S6"]["start"], "file": "whoosh.wav"},
    {"t": S["S6"]["cues"]["card1"], "file": "pop.wav"},
    {"t": S["S6"]["cues"]["card2"], "file": "pop.wav"},
    {"t": S["S6"]["cues"]["card3"], "file": "pop.wav"},
    {"t": S["S7"]["start"], "file": "whoosh.wav"},
    {"t": S["S7"]["cues"]["chip1"], "file": "click.wav"},
    {"t": S["S7"]["cues"]["chip2"], "file": "click.wav"},
    {"t": S["S7"]["cues"]["chip3"], "file": "click.wav"},
    {"t": S["S8"]["start"], "file": "whoosh.wav"},
    {"t": S["S8"]["cues"]["card1"], "file": "click.wav"},
    {"t": S["S8"]["cues"]["card2"], "file": "click.wav"},
    {"t": S["S9"]["start"], "file": "card_swipe.wav"},
    {"t": S["S10"]["start"], "file": "whoosh.wav"},
]

timeline = {
    "fps": 30, "width": 1080, "height": 1920, "duration": DUR,
    "brand": {"pre": "Prepare", "with": "with", "post": "Pair"},
    "disclaimer": {"lines": DISCLAIMER, "from": "S3", "to": "S8"},
    "scenes": scenes,
    "subtitles": subs,
    "subtitleKeywords": ["เงินก้อน", "ค่ารักษา", "20 ครั้ง", "60 วัน"],
    "sfx": sfx,
    "voiceEdit": {"source": "work/voice.m4a", "keep": keep,
                  "note": "[srcStart, srcEnd] ranges of the raw VO kept, in order. Retakes marked 'เอาใหม่ คัด' removed."},
    "audio": {"bgmGainDb": -18, "sfxPeakDb": -18},
}
json.dump(timeline, open(OUT, "w"), ensure_ascii=False, indent=1)
print("duration", DUR)
for sc in scenes:
    print(f'{sc["id"]:4s} {sc["start"]:6.2f} -> {sc["end"]:6.2f}  anchor {sc["anchor"]:6.2f}  cues {sc["cues"]}')
