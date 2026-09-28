// Reusable editorial components. Each returns an HTML string; animation hooks are CSS classes.
export const C = {
  ice: "#C6D4D6", iceDeep: "#AEBFC2", rb: "#6F4439", sg: "#B23A48", wi: "#F4F7F7",
};

// ① style pill: circled number is drawn (not a unicode glyph) so it never falls back to tofu
export const PillTag = ({ num, label, theme = "light" }) => `
  <div class="pill pill--${theme}"><span class="pill-num">${num}</span><span class="pill-label">${label}</span></div>`;

export const BrandMark = ({ pre, with: w, post }, theme = "light") => `
  <div class="brand brand--${theme}">${pre} <i>${w}</i> ${post}</div>`;

// number that counts up; main.js animates data-to
export const BigNumber = ({ to, fmt = "comma", cls = "" }) =>
  `<span class="bignum ${cls}" data-to="${to}" data-fmt="${fmt}">${fmt === "comma" ? Number(to).toLocaleString("en-US") : to}</span>`;

// colour block wipes left->right (.hl-bg scaleX) before the text (.hl-tx) comes up
export const HighlightBlock = ({ text, bg, color, cls = "" }) => `
  <span class="hl ${cls}"><span class="hl-bg" style="background:${bg}"></span><span class="hl-tx" style="color:${color}">${text}</span></span>`;

// rounded card with a hard offset shadow (no blur)
export const RoundCard = ({ html, bg = C.wi, border = "transparent", shadow = C.rb, cls = "", style = "" }) => `
  <div class="card ${cls}" style="background:${bg};border-color:${border};box-shadow:10px 10px 0 ${shadow};${style}">${html}</div>`;

export const Chip = ({ icon, label, detail, cls = "" }) => RoundCard({
  cls: `chip ${cls}`, border: C.rb, shadow: C.rb,
  html: `<div class="chip-icon">${icon}</div><div class="chip-text"><div class="chip-label">${label}</div><div class="chip-detail">${detail}</div></div>`,
});

// two halves with an 8 px White Ice divider (Sangria and Root Beer never touch)
export const SplitScreen = ({ left = "", right = "", cls = "" }) => `
  <div class="split ${cls}">
    <div class="split-l">${left}</div><div class="split-r">${right}</div><div class="split-div"></div>
  </div>`;

// hand-drawn arrow; draws itself via stroke-dashoffset (pathLength = 1)
export const HandArrow = ({ color = C.sg, w = 200, h = 220, cls = "", flip = false }) => `
  <svg class="handarrow ${cls}" width="${w}" height="${h}" viewBox="0 0 200 220" fill="none" stroke="${color}"
    stroke-width="9" stroke-linecap="round" stroke-linejoin="round" style="${flip ? "transform:scaleX(-1)" : ""}">
    <path class="draw" pathLength="1" d="M60 12 C 30 60, 40 110, 80 140 S 130 190, 118 204"/>
    <path class="draw head" pathLength="1" d="M84 186 L118 206 L140 172"/>
  </svg>`;

export const Sparkle = ({ size = 80, color = C.sg, cls = "", style = "" }) => `
  <svg class="sparkle ${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" style="${style}">
    <path d="M50 2 C54 36 64 46 98 50 C64 54 54 64 50 98 C46 64 36 54 2 50 C36 46 46 36 50 2 Z" fill="${color}"/>
  </svg>`;

export const GhostWord = ({ text, color, cls = "", style = "" }) =>
  `<div class="ghost ${cls}" style="color:${color};${style}">${text}</div>`;

export const Disclaimer = (lines, theme = "light") =>
  `<div class="disclaimer disclaimer--${theme}">${lines.map((l) => `<div>${l}</div>`).join("")}</div>`;

// subtitle phrase: [[keyword]] -> Sangria block (or White Ice block on Sangria backgrounds)
export const Subtitle = (lines) =>
  `<div class="sub"><div class="sub-plate">${lines.map((l) => `<div class="sub-line">${
    l.replace(/\[\[(.+?)\]\]/g, '<span class="kw">$1</span>')}</div>`).join("")}</div></div>`;
