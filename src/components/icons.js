// Flat vector icons (viewBox 200x200). No emoji, no realistic people/anatomy.
// o = { s: stroke colour, f: fill colour, a: accent colour, sw: stroke width (viewBox units), cls }
const base = (o, inner, vb = "0 0 200 200") =>
  `<svg class="icon ${o.cls || ""}" viewBox="${vb}" fill="none" stroke="${o.s}" stroke-width="${o.sw || 6}"
    stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const baht = (x, y, size, color) =>
  `<text x="${x}" y="${y}" font-family="Plex Thai" font-weight="700" font-size="${size}" fill="${color}"
     stroke="none" text-anchor="middle" dominant-baseline="central">฿</text>`;

export const Icons = {
  // money envelope: body + band with ฿ + flap (.flap rotates open around the top edge)
  "money-envelope": (o) => base(o, `
    <g class="env-back"><path d="M22 66 Q20 62 26 60 L174 60 Q180 62 178 66 L178 168 Q178 174 172 174 L28 174 Q22 174 22 168 Z" fill="${o.f}"/></g>
    <g class="env-inside"></g>
    <g class="env-front">
      <path d="M22 70 L100 128 L178 70 L178 168 Q178 174 172 174 L28 174 Q22 174 22 168 Z" fill="${o.f}"/>
      <rect x="70" y="118" width="60" height="56" fill="${o.a}" stroke="none"/>
      ${baht(100, 147, 40, o.b || o.f)}
    </g>
    <g class="flap" style="transform-origin:100px 62px;transform-box:view-box">
      <path d="M24 62 L100 118 L176 62 Z" fill="${o.f}"/>
    </g>`),

  // hospital receipt: .paper scales from the top (unroll); zig-zag bottom, lines, + mark
  receipt: (o) => base(o, `
    <g class="paper" style="transform-origin:100px 10px;transform-box:view-box">
      <path d="M40 12 L160 12 L160 178 L148 188 L136 178 L124 188 L112 178 L100 188 L88 178 L76 188 L64 178 L52 188 L40 178 Z" fill="${o.f}"/>
      <path d="M92 30 h16 M100 22 v16" stroke-width="${(o.sw || 6) * 1.1}"/>
      <path class="rl" d="M58 58 H142"/><path class="rl" d="M58 82 H128"/><path class="rl" d="M58 106 H138"/>
      <path class="rl" d="M58 130 H118"/><path class="rl" d="M58 156 H100 M122 156 H142"/>
    </g>`),

  coin: (o) => base(o, `
    <circle cx="100" cy="100" r="80" fill="${o.f}"/>
    <circle cx="100" cy="100" r="60" stroke="${o.a}" stroke-width="${(o.sw || 6) * 0.8}"/>
    ${baht(100, 102, 78, o.a)}`),

  bill: (o) => base(o, `
    <rect x="12" y="52" width="176" height="96" rx="10" fill="${o.f}"/>
    <rect x="28" y="66" width="144" height="68" rx="6" stroke="${o.a}" stroke-width="${(o.sw || 6) * 0.7}"/>
    <circle cx="100" cy="100" r="22" stroke="${o.a}" stroke-width="${(o.sw || 6) * 0.7}"/>`),

  car: (o) => base(o, `
    <path d="M18 128 Q16 108 34 104 L58 100 L80 70 Q86 62 98 62 L136 62 Q148 62 154 72 L170 100 Q186 104 184 124 L184 134 Q184 140 178 140 L24 140 Q18 140 18 134 Z" fill="${o.f}"/>
    <path d="M88 76 L100 76 L100 100 L70 100 Z M112 76 L136 76 Q142 76 146 84 L154 100 L112 100 Z" fill="${o.a}" stroke-width="${(o.sw || 6) * 0.7}"/>
    <circle cx="56" cy="142" r="20" fill="${o.f}"/><circle cx="56" cy="142" r="6" fill="${o.s}"/>
    <circle cx="146" cy="142" r="20" fill="${o.f}"/><circle cx="146" cy="142" r="6" fill="${o.s}"/>`),

  "rice-bowl": (o) => base(o, `
    <path d="M150 34 L112 96 M170 44 L122 100" stroke-width="${(o.sw || 6) * 0.9}"/>
    <path d="M44 100 Q46 58 100 56 Q154 58 156 100 Z" fill="${o.f}"/>
    <path d="M70 80 l6 -3 M96 72 l6 2 M120 82 l6 -2 M84 92 l6 2 M110 94 l6 -3" stroke-width="${(o.sw || 6) * 0.8}"/>
    <path d="M26 100 L174 100 Q170 160 110 170 L90 170 Q30 160 26 100 Z" fill="${o.a}"/>
    <path d="M78 178 L122 178" />`),

  house: (o) => base(o, `
    <path d="M36 96 L100 38 L164 96" stroke-width="${(o.sw || 6) * 1.1}"/>
    <path d="M50 88 L50 168 Q50 174 56 174 L144 174 Q150 174 150 168 L150 88 L100 46 Z" fill="${o.f}"/>
    <path d="M86 174 L86 132 Q86 124 94 124 L106 124 Q114 124 114 132 L114 174" fill="${o.a}"/>
    <rect x="120" y="98" width="20" height="20" rx="3" fill="${o.a}" stroke-width="${(o.sw || 6) * 0.7}"/>
    <path d="M134 54 L134 36 L148 36 L148 68" fill="${o.f}"/>`),

  // heart with a speech tail + thought lines (psychologist / talking)
  "heart-speech": (o) => base(o, `
    <path d="M100 160 C60 130 26 108 26 74 C26 50 44 34 64 34 C80 34 92 42 100 56 C108 42 120 34 136 34 C156 34 174 50 174 74 C174 108 140 130 100 160 Z" fill="${o.f}"/>
    <path d="M70 142 L52 178 L94 154" fill="${o.f}"/>
    <path d="M70 80 H130 M78 104 H122" stroke="${o.a}" stroke-width="${(o.sw || 6) * 0.9}"/>`),

  // stretching figure as a flat silhouette (head circle + body shapes, no anatomy detail)
  stretching: (o) => base(o, `
    <circle cx="112" cy="40" r="17" fill="${o.s}" stroke="none"/>
    <path d="M104 62 Q96 96 98 118" stroke-width="${(o.sw || 6) * 3}"/>
    <path d="M102 70 L66 22" stroke-width="${(o.sw || 6) * 2}"/>
    <path d="M106 72 L150 52" stroke-width="${(o.sw || 6) * 2}"/>
    <path d="M98 118 L60 176 M98 118 L146 146 L172 146" stroke-width="${(o.sw || 6) * 2.2}"/>
    <path d="M30 186 H176" stroke="${o.a}" stroke-width="${(o.sw || 6) * 0.8}"/>`),

  // small awareness-style ribbon (flat fill, used at icon size only)
  ribbon: (o) => base(o, `
    <path d="M100 96 C84 76 72 58 76 40 C80 22 120 22 124 40 C128 58 116 76 100 96 Z" fill="none" stroke="${o.a}" stroke-width="${(o.sw || 6) * 3.2}"/>
    <path d="M92 104 L58 176 L80 170 L88 190 L112 124 Z M108 104 L142 176 L120 170 L112 190 L88 124 Z" fill="${o.a}" stroke="${o.a}" stroke-width="${(o.sw || 6) * 0.8}"/>`),

  // calendar with flippable page; numbers are HTML overlays (see scene S8)
  "calendar-flip": (o) => base(o, `
    <rect x="22" y="36" width="156" height="146" rx="16" fill="${o.f}"/>
    <path d="M22 76 L178 76" />
    <rect x="22" y="36" width="156" height="40" rx="16" fill="${o.a}" stroke="none"/>
    <path d="M22 60 L22 52 Q22 36 38 36 L162 36 Q178 36 178 52 L178 60" />
    <path d="M62 22 V50 M138 22 V50" stroke-width="${(o.sw || 6) * 1.3}"/>
    <g class="cal-page" style="transform-origin:100px 78px;transform-box:view-box">
      <rect x="28" y="80" width="144" height="96" rx="10" fill="${o.f}" stroke="none"/>
    </g>`),

  "folder-x": (o) => base(o, `
    <path d="M20 58 Q20 46 32 46 L78 46 L92 62 L168 62 Q180 62 180 74 L180 164 Q180 176 168 176 L32 176 Q20 176 20 164 Z" fill="${o.f}"/>
    <path d="M44 96 H150 M44 120 H132 M44 144 H118" stroke-width="${(o.sw || 6) * 0.8}"/>
    <g class="fx">
      <path class="draw x1" pathLength="1" d="M52 70 L150 172" stroke="${o.halo}" stroke-width="${(o.sw || 6) * 4.2}"/>
      <path class="draw x2" pathLength="1" d="M150 70 L52 172" stroke="${o.halo}" stroke-width="${(o.sw || 6) * 4.2}"/>
      <path class="draw x1" pathLength="1" d="M52 70 L150 172" stroke="${o.a}" stroke-width="${(o.sw || 6) * 2.4}"/>
      <path class="draw x2" pathLength="1" d="M150 70 L52 172" stroke="${o.a}" stroke-width="${(o.sw || 6) * 2.4}"/>
    </g>`),

  check: (o) => base(o, `<path class="draw" pathLength="1" d="M38 104 L82 148 L164 58" stroke-width="${o.sw || 18}"/>`),

  "check-circle": (o) => base(o, `
    <circle cx="100" cy="100" r="84" fill="${o.f}" stroke="none"/>
    <path class="draw" pathLength="1" d="M56 104 L88 136 L148 70" stroke="${o.a}" stroke-width="${o.sw || 18}"/>`),

  x: (o) => base(o, `<path d="M40 40 L160 160 M160 40 L40 160" stroke-width="${o.sw || 26}"/>`),

  hourglass: (o) => base(o, `
    <path d="M50 22 H150 M50 178 H150" stroke-width="${(o.sw || 6) * 1.4}"/>
    <path d="M62 24 Q62 78 100 100 Q138 78 138 24 Z M62 176 Q62 122 100 100 Q138 122 138 176 Z" fill="${o.f}"/>
    <path d="M78 176 Q84 140 100 132 Q116 140 122 176 Z" fill="${o.s}" stroke="none"/>`),

  bookmark: (o) => base(o, `
    <path d="M52 22 L148 22 Q156 22 156 30 L156 182 L100 142 L44 182 L44 30 Q44 22 52 22 Z" fill="${o.a}" stroke="${o.a}"/>
    <path d="M100 52 L108 76 L132 76 L112 90 L120 114 L100 100 L80 114 L88 90 L68 76 L92 76 Z" fill="${o.f}" stroke="none"/>`),

  "share-arrow": (o) => base(o, `
    <path d="M30 150 Q34 84 116 78 L116 44 L176 100 L116 156 L116 120 Q64 118 30 150 Z" fill="${o.f}"/>`),

  // insurance policy book: cover + spine + shield emblem (generic, no brand)
  "policy-book": (o) => base(o, `
    <path d="M40 20 L164 20 Q170 20 170 26 L170 180 L46 180 Q34 180 34 168 L34 30 Q34 20 40 20 Z" fill="${o.f}"/>
    <path d="M58 20 L58 180" />
    <path d="M114 50 L146 60 L146 88 Q146 116 114 130 Q82 116 82 88 L82 60 Z" fill="${o.a}" stroke="${o.s}"/>
    <path d="M100 88 L110 98 L130 76" stroke="${o.f}" stroke-width="${(o.sw || 6) * 1.1}"/>
    <path d="M84 150 H146 M84 164 H130" stroke-width="${(o.sw || 6) * 0.8}"/>`),
};

export const Icon = (name, o) => Icons[name](o);
