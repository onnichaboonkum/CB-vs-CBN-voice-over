// Deterministic renderer: Playwright/Chromium seeks the paused GSAP timeline frame by frame,
// PNG frames are piped into ffmpeg, then the audio mixes from build_audio.py are muxed in.
//
//   node render.mjs                 full render (video + keyframes + covers + guide)   [subtitles ON]
//   node render.mjs --no-subs       same, without burned-in subtitles
//   node render.mjs --stills        only keyframes / covers / safe-area guide (fast)
//   node render.mjs --preview 3.2,10,41   PNG previews into work/preview/
import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const SUBS = !args.includes("--no-subs");
const STILLS_ONLY = args.includes("--stills");
const PREVIEW = args.includes("--preview") ? args[args.indexOf("--preview") + 1].split(",").map(Number) : null;
const WORKERS = +(args.find((a) => a.startsWith("--workers="))?.split("=")[1] || 3);
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "Output");
const WORK = path.join(ROOT, "work");
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(WORK, { recursive: true });
const T = JSON.parse(fs.readFileSync(path.join(ROOT, "src/timeline.json"), "utf8"));
const FPS = T.fps, NFRAMES = Math.round(T.duration * FPS);

// ---------------------------------------------------------------- static server (fetch() needs http)
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".woff2": "font/woff2", ".wav": "audio/wav", ".png": "image/png", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}/src/index.html`;

const browser = await chromium.launch({
  args: ["--font-render-hinting=none", "--disable-gpu-vsync", "--hide-scrollbars"],
});
async function openPage(query = "") {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("[page error]", e.message));
  await page.goto(`${BASE}?subs=${SUBS ? 1 : 0}${query}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}
const shot = async (page, t, file) => {
  await page.evaluate((tt) => window.__seek(tt), t);
  return page.screenshot({ path: file, type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });
};
const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...a], { stdio: "inherit" });

// ---------------------------------------------------------------- previews
if (PREVIEW) {
  fs.mkdirSync(path.join(WORK, "preview"), { recursive: true });
  const page = await openPage(args.includes("--guide") ? "&guide=1" : "");
  for (const t of PREVIEW) await shot(page, t, path.join(WORK, "preview", `t${t.toFixed(2)}.png`));
  await browser.close(); server.close(); process.exit(0);
}

// ---------------------------------------------------------------- stills: keyframes, covers, guide
// keyframe = the moment each scene is fully built (just before it hands over)
const keyTime = (sc) => Math.max(sc.anchor + 0.8, sc.end - 0.25);
const slug = { S1: "hook", S2: "lumpsum", S3: "numbers", S4: "life", S5: "treatment", S6: "limits",
  S7: "aftercare", S8: "must-know", S9: "summary", S10: "cta" };
{
  fs.mkdirSync(path.join(OUT, "frames"), { recursive: true });
  fs.mkdirSync(path.join(OUT, "guide_test"), { recursive: true });
  const page = await openPage();
  for (const [i, sc] of T.scenes.entries()) {
    await shot(page, keyTime(sc), path.join(OUT, "frames", `${String(i + 1).padStart(2, "0")}_${sc.id}_${slug[sc.id]}.png`));
  }
  // cover: S1 fully built, no subtitle (clean thumbnail)
  const cp = await openPage();
  await cp.evaluate(() => { const s = document.getElementById("subs"); if (s) s.style.display = "none"; });
  await shot(cp, Math.min(2.9, T.scenes[1].start - 0.1), path.join(OUT, "cover.png"));
  ff(["-i", path.join(OUT, "cover.png"), "-vf", "crop=1080:1350:0:285", path.join(OUT, "cover_4x5.png")]);
  // safe-area overlay (transparent PNG) + one test set of keyframes with the guide on
  const gp = await openPage("&guide=1");
  for (const [i, sc] of T.scenes.entries()) {
    await shot(gp, keyTime(sc), path.join(OUT, "guide_test", `${String(i + 1).padStart(2, "0")}_${sc.id}_guide.png`));
  }
  await gp.evaluate(() => { document.getElementById("stage").style.background = "transparent";
    document.querySelectorAll("#stage > :not(#guide)").forEach((e) => (e.style.display = "none")); });
  await gp.screenshot({ path: path.join(OUT, "safe-area-guide.png"), omitBackground: true, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  console.log("stills done");
}
if (STILLS_ONLY) { await browser.close(); server.close(); process.exit(0); }

// ---------------------------------------------------------------- video frames (parallel workers -> segments)
const t0 = Date.now();
const per = Math.ceil(NFRAMES / WORKERS);
const segs = [];
await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
  const a = w * per, b = Math.min(NFRAMES, a + per);
  if (a >= b) return;
  const seg = path.join(WORK, `seg_${w}.mp4`); segs[w] = seg;
  const enc = spawn("ffmpeg", ["-hide_banner", "-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-profile:v", "high", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-r", String(FPS), seg],
    { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((r, j) => enc.on("close", (c) => (c ? j(new Error("ffmpeg " + c)) : r())));
  const page = await openPage();
  for (let f = a; f < b; f++) {
    await page.evaluate((tt) => window.__seek(tt), f / FPS);
    const buf = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });
    if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
    if (w === 0 && f % 60 === 0) process.stdout.write(`\r frame ${f}/${b} (worker 0)  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  enc.stdin.end(); await done; await page.close();
}));
console.log(`\nframes rendered in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
await browser.close(); server.close();

const list = path.join(WORK, "segs.txt");
fs.writeFileSync(list, segs.filter(Boolean).map((s) => `file '${s}'`).join("\n"));
const silentTmp = path.join(WORK, "video_silent.mp4");
ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", silentTmp]);

const name = (s) => path.join(OUT, `pwp_cancer-2types_${s}.mp4`);
const mux = (wav, out) => ff(["-i", silentTmp, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
  "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest", "-movflags", "+faststart", out]);
mux(path.join(WORK, "mix_final.wav"), name("final"));
mux(path.join(WORK, "mix_noBGM.wav"), name("noBGM"));
ff(["-i", silentTmp, "-c", "copy", "-an", "-movflags", "+faststart", name("silent")]);
for (const s of ["final", "noBGM", "silent"]) {
  const mb = fs.statSync(name(s)).size / 1e6;
  console.log(`${path.basename(name(s))}  ${mb.toFixed(1)} MB${mb > 50 ? "  (> 50 MB: use Git LFS)" : ""}`);
}
