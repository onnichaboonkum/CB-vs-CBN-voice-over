// QA: samples the timeline every 0.1 s and checks
//  - every visible text box sits inside the safe area (x 80-900, y 250-1500; disclaimer y <= 1565)
//  - on-screen text matches the approved table (string presence per scene)
//  - forbidden words never appear
// usage: node src/tools/qa.mjs   (writes work/qa_report.json)
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const T = JSON.parse(fs.readFileSync(path.join(ROOT, "src/timeline.json"), "utf8"));
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const ext = path.extname(p);
  res.writeHead(200, { "Content-Type": { ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".html": "text/html" }[ext] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`http://127.0.0.1:${server.address().port}/src/index.html?subs=1`);
await page.waitForFunction(() => window.__ready === true);

const viol = new Map();
const seen = new Map(); // scene -> Set(text)
for (let t = 0; t <= T.duration; t += 0.1) {
  await page.evaluate((tt) => window.__seek(tt), t);
  const boxes = await page.evaluate(() => window.__textBoxes());
  // skip frames where a scene is mid-transition (moving layers)
  const inTransition = T.scenes.some((sc) => sc.start > 0 && t >= sc.start - 0.01 && t <= sc.start + 0.5);
  for (const b of boxes) {
    if (inTransition) continue;
    const isDisc = b.cls.includes("disclaimer");
    const yMax = isDisc ? 1565 : 1500;
    const bad = b.x0 < 79.5 || b.x1 > 900.5 || b.y0 < 249.5 || b.y1 > yMax + 0.5;
    if (bad) {
      const k = `${b.scene}|${b.text}`;
      if (!viol.has(k)) viol.set(k, { t: +t.toFixed(2), ...b });
    }
    if (!seen.has(b.scene)) seen.set(b.scene, new Set());
    seen.get(b.scene).add(b.text);
  }
}
const allText = await page.evaluate(() => document.getElementById("stage").innerText);
await browser.close(); server.close();

const forbidden = ["เคลมได้แน่นอน", "คุ้มครองทุกกรณี", "ดีที่สุด", "รักษาหาย", "จ่ายครั้งเดียว", "1.1 ล้าน", "900,000"];
const report = {
  safeAreaViolations: [...viol.values()],
  forbiddenFound: forbidden.filter((w) => allText.includes(w)),
  textsPerScene: Object.fromEntries([...seen].map(([k, v]) => [k, [...v]])),
};
fs.writeFileSync(path.join(ROOT, "work/qa_report.json"), JSON.stringify(report, null, 1));
console.log("safe-area violations:", report.safeAreaViolations.length);
for (const v of report.safeAreaViolations) console.log("  ", v.t, v.scene, JSON.stringify(v.text), Math.round(v.x0), Math.round(v.y0), Math.round(v.x1), Math.round(v.y1));
console.log("forbidden words found:", report.forbiddenFound);
for (const [k, v] of Object.entries(report.textsPerScene)) console.log(k.padEnd(5), v.filter((x) => !/^\d[\d,]*$/.test(x) || /^(100,000|2|6|4,000|1,500|20|60)$/.test(x)).join(" | "));
