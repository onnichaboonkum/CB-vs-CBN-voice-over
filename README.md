# Prepare with Pair · ประกันมะเร็ง 2 แบบ (motion graphic 9:16)

วิดีโอ motion graphic 1080×1920 / 30 fps สร้างจากโค้ด (HTML/CSS/SVG + GSAP) แล้ว render เป็น MP4
ทับเสียงพากย์ `03-พากย์เสียง-ประกันมะเร็ง2แบบ.m4a` (ไฟล์ต้นฉบับไม่ถูกแก้ ใช้สำเนา `work/voice.m4a`)

## ไฟล์ผลลัพธ์ (`Output/`)

| ไฟล์ | คืออะไร |
|---|---|
| `pwp_cancer-2types_final.mp4` | ตัวเต็ม: เสียงพากย์ + SFX + BGM (มีซับ) |
| `pwp_cancer-2types_noBGM.mp4` | ไม่มี BGM (ไว้ใส่เพลงในแอป) |
| `pwp_cancer-2types_silent.mp4` | ภาพอย่างเดียว ไม่มีเสียง (ไว้ตัดใน CapCut) |
| `cover.png` / `cover_4x5.png` | ปก 1080×1920 จากฉาก S1 และ crop กลาง 1080×1350 |
| `frames/` | คีย์เฟรมฉากละ 1 รูป (10 รูป) |
| `guide_test/` + `safe-area-guide.png` | เฟรมทดสอบแบบมีเส้น safe area + overlay โปร่งใส |
| `voice_before.wav` / `voice_after.wav` | เสียงพากย์ก่อน/หลัง EQ ให้ฟังเทียบ (ตัด take ซ้ำแล้วทั้งคู่) |

## โครงสร้าง source

```
src/
  timeline.json        <- จุดเดียวที่ต้องแก้: เวลา, ข้อความบนจอ, ซับ, SFX, ช่วงเสียงที่เก็บ
  index.html style.css main.js
  components/          PillTag, BrandMark, BigNumber, HighlightBlock, RoundCard, Chip, SplitScreen,
                       HandArrow, Sparkle, GhostWord, Disclaimer, Subtitle + icons.js (SVG ทั้งหมด)
  fonts/ vendor/       ฟอนต์ Google Fonts (OFL) + gsap.min.js เก็บในเครื่อง render ได้แบบ offline
  tools/
    transcribe_sherpa.py  ถอดเสียง + timestamp ทีละคำ
    make_timeline.py      สร้าง timeline.json ครั้งแรกจากผลถอดเสียง
    build_audio.py        ตัดเสียง + EQ + SFX + BGM + ducking -> work/mix_*.wav
    qa.mjs                เช็ค safe area / ข้อความต้องห้าม
render.mjs             Playwright + Chromium seek GSAP ทีละเฟรม -> ffmpeg
assets/sfx, assets/bgm เสียงประกอบ (ตอนนี้เป็น placeholder ที่ generate เอง)
```

## ติดตั้งครั้งแรก

ต้องมี ffmpeg, Node 18+, Python 3.10+

```bash
npm install                      # gsap, playwright (+ ใช้ Chromium ที่มีในเครื่อง หรือ npx playwright install chromium)
pip install numpy soundfile      # สำหรับ build_audio.py
mkdir -p work && cp "03-พากย์เสียง-ประกันมะเร็ง2แบบ.m4a" "work/voice.m4a"
```

## แก้ข้อความ/เวลาแล้ว render ใหม่ (คำสั่งเดียว)

1. เปิด `src/timeline.json`
   - `scenes[].text` คือข้อความบนจอ, `scenes[].start/end/anchor` คือเวลาฉาก (วินาที, เวลาหลังตัดต่อ)
   - `scenes[].cues` คือจังหวะที่แต่ละ element เข้า (เช่น `"number": 8.643` = 100,000 เริ่มนับ)
   - `subtitles[]` คือซับ (`[[คำ]]` = keyword บนบล็อก Sangria)
   - `sfx[]` คือเวลาเสียงประกอบ, `voiceEdit.keep` คือช่วงของไฟล์เสียงดิบที่เก็บไว้
2. รัน

```bash
npm run all            # = python3 src/tools/build_audio.py && node render.mjs
```

ตัวเลือกอื่น:

```bash
node render.mjs --no-subs              # ไม่เผาซับลงภาพ
node render.mjs --stills               # เฉพาะคีย์เฟรม/ปก/ไกด์ (เร็ว)
node render.mjs --preview 3,12.5,40    # เซฟภาพ preview ที่เวลาที่กำหนด ลง work/preview/
node src/tools/qa.mjs                  # เช็คข้อความทั้งหมดอยู่ใน safe area
```

ถ้าเปลี่ยนเสียงพากย์ใหม่ทั้งไฟล์: ถอดเสียงใหม่ด้วย `src/tools/transcribe_sherpa.py` แก้ช่วงเสียงใน
`make_timeline.py` แล้วรัน `python3 src/tools/make_timeline.py --force` (จะเขียนทับ timeline.json)

## หมายเหตุเสียง

- ไฟล์ดิบมี take ซ้ำที่แพร์พูดว่า "เอาใหม่ คัด" 4 จุด (ประมาณวินาที 25–31, 41–46, 63–70) ตัด take แรกทิ้ง ใช้ take หลัง
- dead air ที่ยาวเกิน 0.4 วิ ถูกย่อเหลือ 0.32 วิ (ในฉาก) / 0.40 วิ (ตอนเปลี่ยนฉาก) คลิปจบหลังคำสุดท้าย 0.6 วิ
- EQ ใช้ filter chain ตาม brief (ไม่มี afftdn) ส่วน boost 3.2 kHz คำนวณจากสเปกตรัมอัตโนมัติ
- **SFX และ BGM ใน `assets/` เป็นเสียงชั่วคราว** ที่ generate ด้วยโค้ด (เครือข่ายของเครื่อง render เข้า Pixabay/Mixkit ไม่ได้)
  ถ้าจะเปลี่ยน ให้วางไฟล์ชื่อเดิมทับ (`card_swipe.wav`, `pop.wav`, `click.wav`, `whoosh.wav`,
  `bgm_placeholder_lofi_90bpm.wav`) แล้วรัน `npm run all`: ระบบจะปรับ SFX ให้ peak −18 dBFS และปรับ BGM ให้อยู่ราว 8% ของเสียงพูดเอง
