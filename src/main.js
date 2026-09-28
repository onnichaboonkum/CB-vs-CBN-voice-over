// Builds the whole video as ONE paused GSAP timeline from timeline.json.
// render.mjs seeks it frame by frame (window.__seek), so every frame is deterministic.
import { C, PillTag, BrandMark, BigNumber, HighlightBlock, RoundCard, Chip, SplitScreen, HandArrow,
  Sparkle, GhostWord, Disclaimer, Subtitle } from "./components/components.js";
import { Icon } from "./components/icons.js";

const q = new URLSearchParams(location.search);
const SHOW_SUBS = q.get("subs") !== "0";
const T = await (await fetch("timeline.json", { cache: "no-store" })).json();
const S = Object.fromEntries(T.scenes.map((s) => [s.id, s]));
const stage = document.getElementById("stage");
const tl = gsap.timeline({ paused: true });
const GHOST_DARK = "rgba(244,247,247,.09)";

// ------------------------------------------------------------------ helpers
const el = (html, parent = stage) => {
  const t = document.createElement("template"); t.innerHTML = html.trim();
  const n = t.content.firstElementChild; parent.appendChild(n); return n;
};
const $ = (root, sel) => root.querySelector(sel);
const $$ = (root, sel) => [...root.querySelectorAll(sel)];
const at = (x, y, w, h, extra = "") =>
  `left:${x}px;top:${y}px;${w ? `width:${w}px;` : ""}${h ? `height:${h}px;` : ""}${extra}`;
const iconBox = (name, o, x, y, size, cls = "") =>
  `<div class="abs ${cls}" style="${at(x, y, size, size)}">${Icon(name, { sw: 4.5 * 200 / size, ...o })}</div>`;

const textIn = (targets, t, stagger = 0.1) =>
  tl.fromTo(targets, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out", stagger }, t);
const popIn = (targets, t, from = 0.8, stagger = 0) =>
  tl.fromTo(targets, { scale: from, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(1.8)", stagger }, t);
const cardUp = (target, t) =>
  tl.fromTo(target, { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "back.out(1.4)" }, t);
const fmtNum = (v, f) => (f === "comma" ? Math.round(v).toLocaleString("en-US") : String(Math.round(v)));
const countUp = (node, t, dur = 0.6) => {
  const to = +node.dataset.to, f = node.dataset.fmt, o = { v: 0 };
  node.textContent = fmtNum(0, f);
  tl.fromTo(o, { v: 0 }, { v: to, duration: dur, ease: "power2.out", onUpdate: () => (node.textContent = fmtNum(o.v, f)) }, t);
};
const drawOn = (paths, t, dur = 0.4, stagger = 0) =>
  tl.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: dur, ease: "power2.inOut", stagger }, t);
const highlight = (hlNode, t) => {
  tl.fromTo($(hlNode, ".hl-bg"), { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, t);
  tl.fromTo($(hlNode, ".hl-tx"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.25, ease: "power3.out" }, t + 0.22);
  tl.set(hlNode, { autoAlpha: 1 }, t);
};
// idle loops are finite so the master timeline has a finite duration
const idleRock = (targets, t0, t1, deg = 8, period = 1.7) =>
  tl.fromTo(targets, { rotation: -deg }, { rotation: deg, duration: period, ease: "sine.inOut", yoyo: true,
    repeat: Math.max(1, Math.ceil((t1 - t0) / period)) }, t0);
const idleBob = (targets, t0, t1, dy = 10, period = 1.4) =>
  tl.to(targets, { y: `-=${dy}`, duration: period, ease: "sine.inOut", yoyo: true,
    repeat: Math.max(1, Math.ceil((t1 - t0) / period)), stagger: 0.25 }, t0);

// scene container (hidden outside its time range)
const scene = (id, bgClass) => el(`<section class="scene ${bgClass}" id="${id}"></section>`);
const showScene = (node, sc, keepAfter = 0.6) => {
  tl.set(node, { visibility: "visible" }, sc.start);
  tl.set(node, { visibility: "hidden" }, Math.min(sc.end + keepAfter, T.duration));
};

// vertical colour-block wipe (0.35 s) with a solid edge line
const wipeUp = (node, t, edgeColor) => {
  const edge = el(`<div class="edge" style="background:${edgeColor}"></div>`);
  tl.fromTo(node, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35, ease: "power2.inOut" }, t);
  tl.set(edge, { visibility: "visible" }, t);
  tl.fromTo(edge, { top: 1920 }, { top: -10, duration: 0.35, ease: "power2.inOut" }, t);
  tl.set(edge, { visibility: "hidden" }, t + 0.36);
};
const brand = (theme) => BrandMark(T.brand, theme);
const disc = (theme) => Disclaimer(T.disclaimer.lines, theme);

// ================================================================== S1 Hook (split)
{
  const sc = S.S1, x = sc.text, n = scene("S1", "");
  n.innerHTML = `
    ${SplitScreen({})}
    ${GhostWord({ text: "2", color: GHOST_DARK, cls: "s1-ghost", style: "left:0;right:0;text-align:center;top:330px;font-size:1500px" })}
    ${iconBox("money-envelope", { s: C.sg, f: C.wi, a: C.sg, b: C.wi }, 90, 900, 400, "s1-env")}
    ${iconBox("receipt", { s: C.rb, f: C.wi }, 600, 930, 330, "s1-rec")}
    ${Sparkle({ size: 70, color: C.wi, cls: "sp", style: at(470, 1250) })}
    ${Sparkle({ size: 50, color: C.wi, cls: "sp", style: at(930, 880) })}
    ${RoundCard({ cls: "s1-card", bg: C.ice, border: C.wi, shadow: C.wi,
      style: at(80, 380, 820, null, "padding:26px 48px 34px;"),
      html: `<div class="th h1 rb s1-l">${x.title[0]}</div>
        <div class="s1-l" style="display:flex;align-items:baseline;gap:22px;margin-top:-6px">
          <span class="bignum sg" style="font-size:200px">2</span><span class="th h1 rb">แบบ</span></div>
        <div class="th sub56 rb s1-sub" style="margin-top:10px">${x.sub}</div>` })}
    ${brand("dark")}`;
  showScene(n, sc);
  tl.fromTo($(n, ".s1-ghost"), { scale: 1.1, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "power2.out" }, 0);
  tl.fromTo($(n, ".s1-card"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power3.out" }, 0);
  textIn($$(n, ".s1-l"), 0.05, 0.1);
  popIn($(n, ".s1-env"), 0.3); popIn($(n, ".s1-rec"), 0.45);
  tl.fromTo($(n, ".s1-rec .paper"), { scaleY: 0.18 }, { scaleY: 1, duration: 0.8, ease: "power2.out" }, 0.5);
  textIn($(n, ".s1-sub"), Math.min(sc.cues.sub, 1.2));
  popIn($$(n, ".sp"), 0.9, 0.3, 0.2);
  idleRock($$(n, ".sp"), 1.4, sc.end);
  tl.to($(n, ".s1-env"), { y: -10, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 3 }, 1.4);
  tl.to($(n, ".s1-card"), { scale: 1.03, duration: 1.2, ease: "sine.inOut" }, sc.cues.sub);
}

// ================================================================== S2 แบบเงินก้อน (Sangria)
{
  const sc = S.S2, x = sc.text, n = scene("S2", "bg-sangria"), s1 = document.getElementById("S1");
  const coins = [[130, 600, 150, -14], [720, 560, 130, 10], [420, 560, 110, 0]];
  const bills = [[190, 740, 230, -12], [610, 720, 230, 14]];
  n.innerHTML = `
    ${GhostWord({ text: x.ghost.replace(" ", "<br>"), color: GHOST_DARK, cls: "s2-ghost", style: "left:-20px;top:560px;font-size:340px" })}
    ${PillTag({ ...x.pill, theme: "dark" })}
    <div class="abs th h1 wi s2-title" style="${at(80, 340, 0, 0, "font-size:120px")}">${x.title}</div>
    ${bills.map(([bx, by, s, r]) => iconBox("bill", { s: C.wi, f: C.wi, a: C.sg }, bx, by, s, `s2-fly" data-r="${r}`)).join("")}
    ${coins.map(([cx, cy, s, r]) => iconBox("coin", { s: C.wi, f: C.wi, a: C.sg }, cx, cy, s, `s2-fly s2-coin" data-r="${r}`)).join("")}
    ${iconBox("money-envelope", { s: C.sg, f: C.wi, a: C.sg, b: C.wi }, 250, 760, 580, "s2-env")}
    ${Sparkle({ size: 80, color: C.wi, cls: "sp", style: at(860, 480) })}
    ${brand("dark")}`;
  // split-screen expand: left (Sangria) half grows over the right half
  const t0 = sc.start;
  tl.to($(s1, ".split-l"), { width: 1080, duration: 0.4, ease: "power3.inOut" }, t0);
  tl.to($$(s1, ".split-div, .s1-card, .s1-env, .s1-rec, .sp, .s1-ghost, .brand"), { autoAlpha: 0, duration: 0.2 }, t0);
  tl.set(n, { visibility: "visible" }, t0 + 0.4);
  tl.set(n, { visibility: "hidden" }, sc.end + 0.6);
  tl.set(s1, { visibility: "hidden" }, t0 + 0.41);
  const a = sc.anchor;
  tl.fromTo($(n, ".s2-ghost"), { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" }, t0 + 0.4);
  textIn($(n, ".pill"), t0 + 0.4); textIn($(n, ".s2-title"), t0 + 0.45); tl.set($(n, ".brand"), { autoAlpha: 1 }, t0 + 0.4);
  popIn($(n, ".s2-env"), t0 + 0.5);
  const open = sc.cues.open;
  tl.fromTo($(n, ".s2-env .flap"), { scaleY: 1 }, { scaleY: -1, duration: 0.35, ease: "power2.inOut" }, open);
  $$(n, ".s2-fly").forEach((f, i) => {
    const bx = parseFloat(f.style.left), by = parseFloat(f.style.top), w = parseFloat(f.style.width);
    tl.fromTo(f, { x: 540 - (bx + w / 2), y: 1000 - (by + w / 2), scale: 0.3, autoAlpha: 0, rotation: 0 },
      { x: 0, y: 0, scale: 1, autoAlpha: 1, rotation: +f.dataset.r, duration: 0.6, ease: "power3.out" }, open + 0.15 + i * 0.08);
  });
  idleBob($$(n, ".s2-coin"), open + 0.9, sc.end + 0.4, 12);
  popIn($(n, ".sp"), a + 0.6); idleRock($(n, ".sp"), a + 1, sc.end);
}

// ================================================================== S3 ตัวเลข (Ice)
{
  const sc = S.S3, x = sc.text, n = scene("S3", "bg-ice");
  n.innerHTML = `
    ${PillTag({ ...x.pill, theme: "light" })}
    <div class="abs th rb s3-l1" style="${at(80, 350, 0, 0, "font-size:64px;font-weight:700")}">${x.line1}</div>
    <div class="abs s3-num" style="${at(80, 438)}">${BigNumber({ to: x.number, fmt: "comma", cls: "sg" }).replace('class="bignum', 'style="font-size:210px" class="bignum')}</div>
    ${Sparkle({ size: 90, color: C.sg, cls: "sp", style: at(880, 420) })}
    <div class="abs s3-arrow" style="${at(96, 690)}">${HandArrow({ w: 190, h: 210 })}</div>
    ${iconBox("money-envelope", { s: C.rb, f: C.wi, a: C.iceDeep, b: C.rb }, 540, 650, 300, "s3-env")}
    <div class="abs th rb s3-l2" style="${at(80, 906, 0, 0, "font-size:64px;font-weight:700")}">${x.line2}</div>
    <div class="abs th s3-block" style="${at(80, 1000, 0, 0, "font-size:104px;font-weight:700")}">${HighlightBlock({ text: x.block, bg: C.sg, color: C.wi })}</div>
    ${iconBox("coin", { s: C.rb, f: C.wi, a: C.sg }, 730, 1040, 140, "s3-coin")}
    ${brand("light")}${disc("light")}`;
  showScene(n, sc); wipeUp(n, sc.start, C.wi);
  const a = sc.anchor, c = sc.cues;
  textIn($(n, ".pill"), a); popIn($(n, ".s3-env"), a + 0.15);
  textIn($(n, ".s3-l1"), c.line1);
  const num = $(n, ".bignum");
  tl.fromTo($(n, ".s3-num"), { autoAlpha: 0, scale: 0.85, transformOrigin: "left center" }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, c.number);
  countUp(num, c.number, 0.6);
  popIn($(n, ".sp"), c.number + 0.7); idleRock($(n, ".sp"), c.number + 1.1, sc.end);
  tl.to($(n, ".s3-env"), { y: -14, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: 1 }, c.number + 0.9);
  tl.set($(n, ".s3-arrow"), { autoAlpha: 1 }, c.arrow);
  drawOn($$(n, ".s3-arrow .draw"), c.arrow, 0.4, 0.28);
  textIn($(n, ".s3-l2"), c.line2);
  tl.set($(n, ".s3-block"), { autoAlpha: 1 }, c.block);
  highlight($(n, ".hl"), c.block);
  popIn($(n, ".s3-coin"), c.block + 0.4);
  idleBob($(n, ".s3-coin"), c.block + 0.9, sc.end + 0.4, 10);
  tl.set([$(n, ".s3-arrow"), $(n, ".s3-block")], { autoAlpha: 0 }, 0);
}

// ================================================================== S4 ใช้กับชีวิต (Ice)
{
  const sc = S.S4, x = sc.text, n = scene("S4", "bg-ice");
  const o = { s: C.rb, f: C.wi, a: C.iceDeep };
  n.innerHTML = `
    ${PillTag({ ...x.pill, theme: "light" })}
    <div class="abs th h1 rb s4-t" style="${at(80, 340)}">${x.title[0]}</div>
    <div class="abs th h1 rb s4-t" style="${at(80, 486)}">${x.title[1]}</div>
    ${iconBox("car", o, 60, 690, 270, "s4-i s4-car")}
    ${iconBox("rice-bowl", o, 400, 680, 270, "s4-i s4-bowl")}
    ${iconBox("house", o, 730, 670, 280, "s4-i s4-house")}
    ${iconBox("money-envelope", { s: C.rb, f: C.wi, a: C.iceDeep, b: C.rb }, 380, 1000, 320, "s4-env")}
    ${Sparkle({ size: 70, color: C.sg, cls: "sp", style: at(900, 560) })}
    ${Sparkle({ size: 46, color: C.sg, cls: "sp", style: at(300, 1180) })}
    ${brand("light")}${disc("light")}`;
  showScene(n, sc); wipeUp(n, sc.start, C.rb);
  const a = sc.anchor, c = sc.cues;
  textIn($(n, ".pill"), a); textIn($$(n, ".s4-t"), a + 0.05, 0.12);
  popIn($(n, ".s4-env"), a + 0.3);
  tl.fromTo($(n, ".s4-env .flap"), { scaleY: 1 }, { scaleY: -1, duration: 0.35, ease: "power2.inOut" }, c.title);
  popIn($$(n, ".sp"), c.title + 0.2, 0.3, 0.15); idleRock($$(n, ".sp"), c.title + 0.7, sc.end);
  [["s4-car", c.car], ["s4-bowl", c.bowl], ["s4-house", c.house]].forEach(([cls, t]) => {
    const f = $(n, "." + cls), bx = parseFloat(f.style.left), by = parseFloat(f.style.top), w = parseFloat(f.style.width);
    tl.fromTo(f, { x: 540 - (bx + w / 2), y: 1130 - (by + w / 2), scale: 0.25, autoAlpha: 0 },
      { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.5)" }, t);
  });
  idleBob($$(n, ".s4-i"), c.house + 0.6, sc.end + 0.4, 8, 1.2);
}

// ================================================================== S5 แบบจ่ายค่ารักษา (Root Beer, card swipe from right)
{
  const sc = S.S5, x = sc.text, n = scene("S5", "bg-rootbeer");
  n.innerHTML = `
    <div class="abs" style="${at(0, 0, 10, 1920, `background:${C.wi};z-index:30`)}" id="s5-edge"></div>
    ${GhostWord({ text: x.ghost, color: GHOST_DARK, cls: "s5-ghost", style: "left:120px;top:760px;font-size:470px" })}
    ${PillTag({ ...x.pill, theme: "dark" })}
    <div class="abs th h1 wi s5-title" style="${at(80, 340)}">${x.title}</div>
    ${iconBox("receipt", { s: C.rb, f: C.wi }, 220, 600, 640, "s5-rec")}
    ${iconBox("check-circle", { f: C.wi, a: C.sg, sw: 20 }, 690, 1010, 190, "s5-check")}
    ${Sparkle({ size: 80, color: C.wi, cls: "sp", style: at(150, 690) })}
    ${Sparkle({ size: 50, color: C.wi, cls: "sp", style: at(880, 620) })}
    ${brand("dark")}${disc("dark")}`;
  const t0 = sc.start;
  tl.set(n, { visibility: "visible" }, t0);
  tl.set(n, { visibility: "hidden" }, sc.end + 0.6);
  tl.fromTo(n, { x: 1090 }, { x: 0, duration: 0.45, ease: "power3.inOut" }, t0);
  tl.to("#s5-edge", { autoAlpha: 0, duration: 0.2 }, t0 + 0.45);
  const a = sc.anchor, c = sc.cues;
  textIn($(n, ".pill"), a + 0.15); textIn($(n, ".s5-title"), a + 0.22);
  tl.fromTo($(n, ".s5-ghost"), { x: 80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" }, a + 0.2);
  tl.set($(n, ".s5-rec"), { autoAlpha: 1 }, c.receipt);
  tl.fromTo($(n, ".s5-rec .paper"), { scaleY: 0 }, { scaleY: 1, duration: 0.6, ease: "power2.out" }, c.receipt);
  tl.set($(n, ".s5-rec"), { autoAlpha: 0 }, 0);
  popIn($(n, ".s5-check"), c.check, 0.6);
  drawOn($(n, ".s5-check .draw"), c.check + 0.12, 0.35);
  popIn($$(n, ".sp"), c.check + 0.3, 0.3, 0.15); idleRock($$(n, ".sp"), c.check + 0.8, sc.end);
}

// ================================================================== S6 วงเงิน (Root Beer)
{
  const sc = S.S6, x = sc.text, n = scene("S6", "bg-rootbeer");
  const card = (cd, i) => RoundCard({ cls: `s6-card s6-c${i}`, bg: C.wi, border: C.wi, shadow: C.iceDeep,
    style: at(80, 400 + i * 245, 810, 205, "display:flex;align-items:center;gap:22px;padding:0 44px;"),
    html: `${cd.pre ? `<span class="th card-t rb" style="font-size:56px">${cd.pre}</span>` : ""}
      ${BigNumber({ to: cd.num, fmt: cd.fmt, cls: "rb" }).replace('class="bignum', 'style="font-size:150px;padding-top:10px" class="bignum')}
      <span class="th card-t rb" style="font-size:56px">${cd.post}</span>` });
  n.innerHTML = `
    ${PillTag({ ...x.pill, theme: "dark" })}
    ${x.cards.map(card).join("")}
    <div class="abs th sub56 wi s6-note" style="${at(80, 1150)}">${x.note}</div>
    ${iconBox("receipt", { s: C.wi, f: C.rb }, 690, 1090, 200, "s6-rec")}
    ${Sparkle({ size: 70, color: C.wi, cls: "sp", style: at(900, 360) })}
    ${brand("dark")}${disc("dark")}`;
  showScene(n, sc); wipeUp(n, sc.start, C.wi);
  const a = sc.anchor, c = sc.cues;
  textIn($(n, ".pill"), a);
  tl.set($(n, ".pill"), { autoAlpha: 1 }, a + 0.3);
  [c.card1, c.card2, c.card3].forEach((t, i) => {
    cardUp($(n, `.s6-c${i}`), t);
    countUp($(n, `.s6-c${i} .bignum`), t + 0.05, 0.6);
  });
  popIn($(n, ".sp"), c.card1 + 0.5); idleRock($(n, ".sp"), c.card1 + 1, sc.end);
  textIn($(n, ".s6-note"), c.note); popIn($(n, ".s6-rec"), c.note + 0.15);
  tl.to($(n, ".s6-rec"), { rotation: 6, duration: 0.7, ease: "sine.inOut", yoyo: true, repeat: 1 }, c.note + 0.6);
}

// ================================================================== S7 Aha หลังรักษา (Ice)
{
  const sc = S.S7, x = sc.text, n = scene("S7", "bg-ice");
  const icon = (name) => Icon(name, { s: C.rb, f: C.wi, a: name === "ribbon" ? C.sg : C.iceDeep, sw: 4.5 * 200 / 126 });
  const detail = (d) => d.length === 1
    ? `<span>${d[0]}</span>`
    : `${BigNumber({ to: +d[0].replace(/,/g, ""), fmt: "comma", cls: "serif s7-1500" })}<span>${d[1]}</span><span class="s7-20" style="display:flex;align-items:baseline;gap:12px">${
      BigNumber({ to: 20, fmt: "int", cls: "serif" }).replace('class="bignum', 'style="font-size:66px;color:#B23A48" class="bignum')}<span>${d[3]}</span></span>`;
  n.innerHTML = `
    ${GhostWord({ text: x.ghost.replace(" ", "<br>"), color: C.iceDeep, cls: "s7-ghost", style: "left:520px;top:390px;font-size:230px" })}
    <div class="abs th h1 rb s7-t1" style="${at(80, 330)}">${x.title[0]}</div>
    <div class="abs th s7-hl" style="${at(80, 478, 0, 0, "font-size:112px;font-weight:700")}">${HighlightBlock({ text: x.title[1], bg: C.sg, color: C.wi })}</div>
    ${Sparkle({ size: 80, color: C.sg, cls: "sp", style: at(640, 470) })}
    <div class="abs s7-chips" style="${at(0, 0, 1080, 1920, "transform-origin:490px 1010px")}">
      ${x.chips.map((ch, i) => Chip({ cls: `s7-c${i}`, icon: icon(ch.icon), label: ch.label, detail: detail(ch.detail) })).join("")}
    </div>
    ${brand("light")}${disc("light")}`;
  // position the chips (RoundCard owns the style attribute for colours/shadow)
  $$(n, ".chip").forEach((c, i) => { c.style.left = "110px"; c.style.top = `${712 + i * 204}px`; c.style.width = "760px"; c.style.height = "176px"; });
  showScene(n, sc); wipeUp(n, sc.start, C.rb);
  const a = sc.anchor, c = sc.cues;
  tl.fromTo($(n, ".s7-ghost"), { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out" }, a);
  popIn($(n, ".sp"), a + 0.5); idleRock($(n, ".sp"), a + 1, sc.end);
  textIn($(n, ".s7-t1"), c.title);
  tl.set($(n, ".s7-hl"), { autoAlpha: 0 }, 0); tl.set($(n, ".s7-hl"), { autoAlpha: 1 }, c.highlight);
  highlight($(n, ".s7-hl .hl"), c.highlight);
  [c.chip1, c.chip2, c.chip3].forEach((t, i) => popIn($(n, `.s7-c${i}`), t, 0.7));
  countUp($(n, ".s7-c0 .s7-1500"), c.chip1 + 0.05, 0.6); countUp($(n, ".s7-c1 .s7-1500"), c.chip2 + 0.05, 0.6);
  $$(n, ".s7-20").forEach((g) => tl.set(g, { autoAlpha: 0 }, 0));
  tl.fromTo($$(n, ".s7-20"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power3.out" }, c.count20);
  $$(n, ".s7-20 .bignum").forEach((b) => countUp(b, c.count20, 0.6));
  tl.fromTo($(n, ".s7-chips"), { scale: 1 }, { scale: 1.06, duration: 0.8, ease: "power2.out" }, c.punch);
}

// ================================================================== S8 เรื่องที่ต้องรู้ (Root Beer)
{
  const sc = S.S8, x = sc.text, n = scene("S8", "bg-rootbeer");
  n.innerHTML = `
    ${GhostWord({ text: x.ghost, color: GHOST_DARK, cls: "s8-ghost", style: "left:1100px;top:560px;font-size:210px;transform-origin:0 0;rotate:90deg" })}
    <div class="abs th h1 wi s8-title" style="${at(80, 340, 0, 0, "font-size:120px")}">${x.title}</div>
    ${RoundCard({ cls: "s8-c1", bg: C.wi, border: C.wi, shadow: C.iceDeep, style: at(80, 590, 810, 330),
      html: `
        <div class="abs s8-cal" style="${at(24, 50, 220, 220)}">${Icon("calendar-flip", { s: C.rb, f: C.wi, a: C.iceDeep, sw: 4.5 * 200 / 220 })}
          <div class="abs serif rb s8-calnum" style="${at(0, 108, 220, 0, "text-align:center;font-size:96px")}">1</div></div>
        <div class="abs s8-head1" style="${at(280, 38, 0, 0, "display:flex;align-items:center;gap:14px")}">
          <div style="width:74px;height:74px">${Icon("hourglass", { s: C.rb, f: C.wi, sw: 11 })}</div>
          ${BigNumber({ to: 60, fmt: "int", cls: "rb" }).replace('class="bignum', 'style="font-size:130px;padding-top:12px" class="bignum')}
          <span class="th rb" style="font-size:64px;font-weight:700">${x.card1.head.replace(/^\d+\s*/, "")}</span></div>
        <div class="abs th card-s rb s8-sub1" style="${at(284, 172)}">${x.card1.sub.join("<br>")}</div>` })}
    ${RoundCard({ cls: "s8-c2", bg: C.wi, border: C.wi, shadow: C.iceDeep, style: at(80, 962, 810, 330),
      html: `
        <div class="abs s8-folder" style="${at(24, 50, 220, 220)}">${Icon("folder-x", { s: C.rb, f: C.wi, a: C.sg, halo: C.wi, sw: 4.5 * 200 / 220 })}</div>
        <div class="abs s8-head2" style="${at(280, 26, 0, 0, "display:flex;align-items:flex-start;gap:16px")}">
          <div style="width:46px;height:46px;margin-top:24px">${Icon("x", { s: C.sg, sw: 30 })}</div>
          <div class="th card-t rb">${x.card2.head.join("<br>")}</div></div>
        <div class="abs th card-s rb s8-sub2" style="${at(284, 172)}">${x.card2.sub.join("<br>")}</div>` })}
    ${Sparkle({ size: 70, color: C.wi, cls: "sp", style: at(880, 470) })}
    ${brand("dark")}${disc("dark")}`;
  showScene(n, sc); wipeUp(n, sc.start, C.wi);
  const a = sc.anchor, c = sc.cues;
  tl.fromTo($(n, ".s8-ghost"), { x: 80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" }, a);
  popIn($(n, ".sp"), a + 0.3); idleRock($(n, ".sp"), a + 0.8, sc.end);
  textIn($(n, ".s8-title"), c.title);
  cardUp($(n, ".s8-c1"), c.card1); textIn($(n, ".s8-sub1"), c.card1 + 0.2);
  tl.set($(n, ".s8-head1"), { autoAlpha: 0 }, 0);
  // calendar flips page by page to 60 while the big 60 counts up
  const calNum = $(n, ".s8-calnum"), page = [$(n, ".s8-cal .cal-page"), calNum];
  const pages = ["1", "15", "30", "45", "60"], pg = { i: 0 };
  tl.fromTo(pg, { i: 0 }, { i: 4, duration: 0.64, ease: "none",
    onUpdate: () => (calNum.textContent = pages[Math.min(4, Math.round(pg.i))]) }, c.flip);
  for (let i = 0; i < 4; i++) {
    const t = c.flip + i * 0.16;
    tl.fromTo(page, { scaleY: 1 }, { scaleY: 0.05, duration: 0.08, ease: "power1.in", transformOrigin: "50% 0%", immediateRender: false }, t);
    tl.to(page, { scaleY: 1, duration: 0.08, ease: "power1.out" }, t + 0.08);
  }
  textIn($(n, ".s8-head1"), c.flip); countUp($(n, ".s8-head1 .bignum"), c.flip, 0.6);
  cardUp($(n, ".s8-c2"), c.card2);
  tl.set($(n, ".s8-sub2"), { autoAlpha: 0 }, 0); textIn($(n, ".s8-sub2"), c.card2sub);
  drawOn($$(n, ".s8-folder .x1"), c.x, 0.25); drawOn($$(n, ".s8-folder .x2"), c.x + 0.2, 0.25);
}

// ================================================================== S9 สรุป (split returns)
{
  const sc = S.S9, x = sc.text, n = scene("S9", "");
  const txt = (lines, left, cls) => `<div class="abs th wi ${cls}" style="${at(left, 640, 0, 0, "font-size:86px;font-weight:700;line-height:1.3")}">${
    lines.map((l) => `<div class="${cls}-l">${l}</div>`).join("")}</div>`;
  n.innerHTML = `
    ${SplitScreen({})}
    ${iconBox("money-envelope", { s: C.sg, f: C.wi, a: C.sg, b: C.wi }, 130, 350, 280, "s9-i s9-il")}
    ${iconBox("receipt", { s: C.rb, f: C.wi }, 620, 350, 280, "s9-i s9-ir")}
    ${txt(x.left, 80, "s9-left")}
    ${txt(x.right, 584, "s9-right")}
    ${iconBox("check-circle", { f: C.wi, a: C.sg, sw: 22 }, 180, 1000, 190, "s9-ck s9-ckl")}
    ${iconBox("check-circle", { f: C.wi, a: C.rb, sw: 22 }, 660, 1000, 190, "s9-ck s9-ckr")}
    ${brand("dark")}`;
  const t0 = sc.start;
  tl.set(n, { visibility: "visible" }, t0); tl.set(n, { visibility: "hidden" }, sc.end + 0.6);
  tl.fromTo($(n, ".split-l"), { x: -560 }, { x: 0, duration: 0.45, ease: "power3.inOut" }, t0);
  tl.fromTo($(n, ".split-r"), { x: 560 }, { x: 0, duration: 0.45, ease: "power3.inOut" }, t0);
  tl.fromTo($(n, ".split-div"), { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: "power2.out" }, t0 + 0.3);
  tl.fromTo($(n, ".brand"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, t0 + 0.3);
  const a = sc.anchor, c = sc.cues;
  popIn($$(n, ".s9-i"), a + 0.2, 0.8, 0.15);
  textIn($$(n, ".s9-left-l"), c.left, 0.12); textIn($$(n, ".s9-right-l"), c.right, 0.12);
  popIn($(n, ".s9-ckl"), c.checks, 0.6); drawOn($(n, ".s9-ckl .draw"), c.checks + 0.12, 0.35);
  popIn($(n, ".s9-ckr"), c.checks + 0.35, 0.6); drawOn($(n, ".s9-ckr .draw"), c.checks + 0.47, 0.35);
  idleBob($$(n, ".s9-i"), c.checks + 0.9, sc.end + 0.4, 8);
}

// ================================================================== S10 CTA (Ice)
{
  const sc = S.S10, x = sc.text, n = scene("S10", "bg-ice");
  n.innerHTML = `
    <div class="abs th s10-hl" style="${at(80, 330, 0, 0, "font-size:116px;font-weight:700")}">${HighlightBlock({ text: x.title[0], bg: C.sg, color: C.wi })}</div>
    <div class="abs th h1 rb s10-t2" style="${at(80, 516, 0, 0, "font-size:116px")}">${x.title[1]}</div>
    <div class="abs th sub56 rb s10-sub" style="${at(80, 700, 0, 0, "font-size:58px")}">${x.sub}</div>
    ${iconBox("policy-book", { s: C.rb, f: C.wi, a: C.iceDeep }, 80, 880, 380, "s10-book")}
    ${iconBox("bookmark", { s: C.sg, f: C.wi, a: C.sg }, 480, 930, 220, "s10-bm")}
    ${iconBox("share-arrow", { s: C.rb, f: C.wi }, 710, 940, 220, "s10-share")}
    ${Sparkle({ size: 80, color: C.sg, cls: "sp", style: at(600, 820) })}
    ${Sparkle({ size: 50, color: C.sg, cls: "sp", style: at(930, 1200) })}
    ${brand("light")}`;
  showScene(n, sc); wipeUp(n, sc.start, C.wi);
  const a = sc.anchor, c = sc.cues;
  tl.set($(n, ".s10-hl"), { autoAlpha: 0 }, 0); tl.set($(n, ".s10-hl"), { autoAlpha: 1 }, a);
  highlight($(n, ".s10-hl .hl"), a);
  textIn($(n, ".s10-t2"), a + 0.35);
  popIn($(n, ".s10-book"), a + 0.5);
  tl.fromTo($(n, ".s10-bm"), { y: -140, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "bounce.out" }, a + 0.75);
  textIn($(n, ".s10-sub"), c.sub);
  tl.fromTo($(n, ".s10-share"), { x: -60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: "back.out(1.6)" }, c.sub + 0.15);
  tl.to($(n, ".s10-share"), { x: 16, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 3 }, c.sub + 0.7);
  popIn($$(n, ".sp"), a + 0.9, 0.3, 0.2); idleRock($$(n, ".sp"), a + 1.3, sc.end);
  tl.to($(n, ".s10-book"), { rotation: -3, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: 2 }, c.sub + 0.3);
}

// ================================================================== subtitles
const subsBox = el(`<div id="subs"></div>`);
const onSangria = (t) => ["S1", "S2", "S9"].includes(T.scenes.filter((s) => s.start <= t + 0.05).pop().id);
if (SHOW_SUBS) {
  T.subtitles.forEach((s) => {
    const node = el(Subtitle(s.lines), subsBox);
    if (onSangria(s.start)) node.classList.add("on-sg");
    tl.set(node, { visibility: "visible" }, s.start);
    tl.fromTo(node, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.14, ease: "power2.out" }, s.start);
    tl.set(node, { visibility: "hidden" }, s.end);
  });
}

el(`<div id="grain"></div>`);
if (q.get("guide") === "1") {
  el(`<svg id="guide" viewBox="0 0 1080 1920" width="1080" height="1920">
    <rect x="0" y="0" width="1080" height="250" fill="rgba(255,0,80,.18)"/><rect x="0" y="1500" width="1080" height="420" fill="rgba(255,0,80,.18)"/>
    <rect x="0" y="250" width="80" height="1250" fill="rgba(255,0,80,.18)"/><rect x="900" y="250" width="180" height="1250" fill="rgba(255,0,80,.18)"/>
    <rect x="80" y="250" width="820" height="1250" fill="none" stroke="#00E0FF" stroke-width="3" stroke-dasharray="14 8"/>
    <rect x="80" y="1510" width="820" height="40" fill="none" stroke="#FFD400" stroke-width="2" stroke-dasharray="6 6"/>
    <line x1="0" y1="360" x2="1080" y2="360" stroke="#00E0FF" stroke-width="1" opacity=".6"/><line x1="0" y1="560" x2="1080" y2="560" stroke="#00E0FF" stroke-width="1" opacity=".6"/>
    <line x1="0" y1="620" x2="1080" y2="620" stroke="#00E0FF" stroke-width="1" opacity=".6"/><line x1="0" y1="1350" x2="1080" y2="1350" stroke="#00E0FF" stroke-width="1" opacity=".6"/>
    <line x1="0" y1="1380" x2="1080" y2="1380" stroke="#FFD400" stroke-width="1"/><line x1="0" y1="1480" x2="1080" y2="1480" stroke="#FFD400" stroke-width="1"/>
    <text x="90" y="240" fill="#00E0FF" font-size="24" font-family="monospace">SAFE x80-900 y250-1500 | subs y1380-1480 | disclaimer y1510-1550</text>
  </svg>`);
}

// the first frame must never be empty: make sure t=0 is rendered
tl.seek(0);
window.__duration = T.duration;
window.__fps = T.fps;
window.__seek = (t) => { tl.seek(t, false); };
// QA helper: boxes of all visible text nodes (for safe-area checks)
window.__textBoxes = () => {
  const out = [];
  const vis = (e) => { for (let p = e; p && p !== document.body; p = p.parentElement) {
    const cs = getComputedStyle(p); if (cs.visibility === "hidden" || +cs.opacity < 0.05 || cs.display === "none") return false; } return true; };
  document.querySelectorAll(".th, .bignum, .pill, .brand, .disclaimer, .sub-line, .card-t, .card-s, .chip-label, .chip-detail").forEach((e) => {
    if (!vis(e)) return; const r = e.getBoundingClientRect(); if (r.width < 1) return;
    out.push({ cls: e.className, text: e.textContent.trim().slice(0, 30), x0: r.left, y0: r.top, x1: r.right, y1: r.bottom,
      scene: e.closest("section")?.id || (e.closest("#subs") ? "subs" : "") });
  });
  return out;
};
await document.fonts.ready;
window.__ready = true;
if (q.has("t")) window.__seek(parseFloat(q.get("t")));
if (q.get("play") === "1") { tl.play(0); const a = new Audio("../work/mix_final.wav"); a.play().catch(() => {}); }
