"""Find stretches without a noticeable on-screen change in the rendered video.
A 'change' = a frame whose mean abs difference to the previous frame exceeds THRESH
(idle sparkle wobble alone stays below it). Prints the longest quiet gaps.
usage: python3 src/tools/motion_check.py Output/pwp_cancer-2types_silent.mp4"""
import subprocess, sys, json
import numpy as np

path = sys.argv[1]
W, H, THRESH = 108, 192, 0.25
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
active = np.where(d > THRESH)[0] + 1
times = active / 30.0
gaps = []
prev = 0.0
for t in list(times) + [len(fr) / 30.0]:
    if t - prev > 0.05:
        gaps.append((round(prev, 2), round(t, 2), round(t - prev, 2)))
    prev = t
gaps.sort(key=lambda g: -g[2])
print("longest gaps without a noticeable change (start, end, seconds):")
for g in gaps[:8]:
    print("  ", g)
json.dump({"max_gap": gaps[0][2] if gaps else 0, "gaps": gaps[:8]}, open("work/motion_report.json", "w"))
