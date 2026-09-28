"""Transcribe work/voice.m4a with Whisper (word timestamps) -> work/whisper.json"""
import json, sys, whisper
model_name = sys.argv[1] if len(sys.argv) > 1 else "small"
m = whisper.load_model(model_name)
r = m.transcribe("work/voice.m4a", language="th", word_timestamps=True, fp16=False,
                 initial_prompt="ประกันมะเร็ง มี 2 แบบ เงินก้อน ค่ารักษา ระยะเริ่มต้น ระยะลุกลาม")
out = [{"start": s["start"], "end": s["end"], "text": s["text"],
        "words": [{"w": w["word"], "s": round(w["start"], 3), "e": round(w["end"], 3)} for w in s.get("words", [])]}
       for s in r["segments"]]
json.dump(out, open(f"work/whisper_{model_name}.json", "w"), ensure_ascii=False, indent=1)
for s in out:
    print(f'{s["start"]:6.2f}-{s["end"]:6.2f} {s["text"]}')
