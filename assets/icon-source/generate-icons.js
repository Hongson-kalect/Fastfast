// Sinh bộ icon app từ SVG (mẫu A: vòng giờ + tia chớp + vệt sáng đầu vòng).
// Chạy: npm i @resvg/resvg-js ở thư mục tạm, rồi
//   node assets/icon-source/generate-icons.js <đường dẫn @resvg/resvg-js> <thư mục xuất>
// và chép các file PNG vào assets/images.
const { Resvg } = require(process.argv[2]);
const fs = require("fs");
const out = process.argv[3];
const C = 512, R = 307, SW = 102, BG = "#0E1117", TRACK = "#1E2A3D";
const SWEEP = 270, N = 180;
const pt = (deg, r = R) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
const lerp = (a, b, t) => Math.round(a + (b - a) * t);
// Màu đặc đã trộn sẵn với màu track (không dùng alpha để các đoạn chồng nhau không lộ vạch)
const mix = (t) => {
  const track = [30, 42, 61], c1 = [56, 189, 248], w = [255, 255, 255];
  const k = Math.max(0, (t - 0.82) / 0.18);
  const c = [0, 1, 2].map((i) => c1[i] + (w[i] - c1[i]) * k);
  const op = 0.15 + 0.85 * Math.min(1, t / 0.8);
  return `rgb(${[0, 1, 2].map((i) => Math.round(track[i] + (c[i] - track[i]) * op)).join(",")})`;
};
const arc = (mono) => {
  if (mono) {
    const [x0, y0] = pt(0), [x1, y1] = pt(SWEEP);
    return `<path d="M${x0} ${y0} A${R} ${R} 0 1 1 ${x1} ${y1}" fill="none" stroke="#fff" stroke-width="${SW}" stroke-linecap="round"/>`;
  }
  let s = "";
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N, d0 = SWEEP * t0, d1 = Math.min(SWEEP, SWEEP * t1 + 0.6);
    const [x0, y0] = pt(d0), [x1, y1] = pt(d1);
    const t = (t0 + t1) / 2;
    s += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${mix(t)}" stroke-width="${SW}"/>`;
  }
  const [hx, hy] = pt(SWEEP);
  // Đầu vòng: chỏm tròn trắng + quầng sáng mềm (vệt sáng "signature")
  s += `<circle cx="${hx}" cy="${hy}" r="${SW * 0.95}" fill="#E0F2FE" opacity="0.35" filter="url(#glow)"/>`;
  s += `<circle cx="${hx}" cy="${hy}" r="${SW / 2}" fill="#FFFFFF"/>`;
  return s;
};
const bolt = (fill) => `<path d="M552.9 327.7 L399.4 552.9 H512 L471 716.8 L624.6 481.3 H512 Z" fill="${fill}" stroke="${fill}" stroke-width="14" stroke-linejoin="round"/>`;
const symbol = ({ mono = false, track = true } = {}) =>
  `${track && !mono ? `<circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${TRACK}" stroke-width="${SW}"/>` : ""}${arc(mono)}${bolt(mono ? "#fff" : "#F8FAFC")}`;
const svg = (inner, { bg, scale = 1, size = 1024 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024"><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter></defs>${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ""}<g transform="translate(${C} ${C}) scale(${scale}) translate(${-C} ${-C})">${inner}</g></svg>`;
const write = (name, s, w = 1024) => {
  fs.writeFileSync(`${out}/${name}.svg`, s);
  fs.writeFileSync(`${out}/${name}.png`, new Resvg(s, { fitTo: { mode: "width", value: w }, background: "rgba(0,0,0,0)" }).render().asPng());
};
write("icon", svg(symbol(), { bg: BG, scale: 0.78 }));
write("play-store-512", svg(symbol(), { bg: BG, scale: 0.78 }), 512);
write("android-icon-foreground", svg(symbol(), { scale: 0.66 }));
write("android-icon-background", svg("", { bg: BG }));
write("android-icon-monochrome", svg(symbol({ mono: true }), { scale: 0.66 }));
write("splash-icon", svg(symbol(), { scale: 0.95 }));
write("notification-icon", svg(symbol({ mono: true }), { scale: 0.92 }), 96);
