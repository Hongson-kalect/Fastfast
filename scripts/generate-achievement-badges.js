/**
 * Sinh huy hiệu thành tựu dạng SVG vào assets/achievements và bảng
 * require ở src/constants/achievementImages.ts.
 *
 * Mỗi nhóm thành tựu có một biểu tượng riêng; mỗi mốc được xếp vào 1 trong 6
 * cấp (đồng → bạc → vàng → vàng nguyệt quế → bạch kim → kim cương) theo vị trí
 * của nó trong nhóm, cấp càng cao càng nhiều trang trí.
 *
 * Chạy lại khi thêm/sửa mốc trong src/constants/achievements.ts:
 *   node scripts/generate-achievement-badges.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets", "achievements");
const MAP_FILE = path.join(ROOT, "src", "constants", "achievementImages.ts");

// Danh sách mốc phải khớp ACHIEVEMENTS (id mốc = `${group}_${target}`)
const GROUPS = {
  fasting_hours: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
  completed_fasts: [1, 3, 5, 10, 25, 50, 100, 200, 365, 500, 1000],
  active_days: [7, 30, 100, 200, 365, 730],
  habit: [10, 30, 50, 70, 100],
  longest_fast: [16, 18, 20, 24, 36, 48, 72],
  max_streak: [3, 7, 14, 30, 60, 100, 180, 365],
  total_shields: [1, 5, 10, 25, 50, 100],
  retain_circles: [1, 3, 5, 10, 25],
};

// Biểu tượng vẽ trong lưới 24×24
const GLYPHS = {
  fasting_hours: {
    stroke:
      "M6 3h12M6 21h12M7 3c0 6 10 6 10 9s-10 3-10 9M17 3c0 6-10 6-10 9s10 3 10 9",
    fill: "M9 18.5c1-1.5 5-1.5 6 0z",
  },
  completed_fasts: { stroke: "M4.5 12.5l5 5L19.5 7" },
  active_days: {
    stroke: "M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 11h18M8 3v5M16 3v5",
    fill: "M7 14h3v3H7z",
  },
  habit: {
    fill: "M12 2.5l2.4 7.1L21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z",
  },
  longest_fast: {
    fill: "M12 2.5c1.2 3.8 5.5 6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.4 1.3-4 2.7-5.1.2 1.8 1.1 2.8 2.1 3.2.2-3.7-.6-6.1.7-9.1z",
  },
  max_streak: { fill: "M13.5 2L4.5 14h7l-1 8 9-12h-7z" },
  total_shields: {
    fill: "M12 2.5l7.5 3v6c0 4.6-3.2 8.4-7.5 10-4.3-1.6-7.5-5.4-7.5-10v-6z",
  },
  retain_circles: {
    fill: "M12 3c3.2 4.2 6.2 7.4 6.2 10.8a6.2 6.2 0 0 1-12.4 0C5.8 10.4 8.8 7.2 12 3z",
  },
};

// Chất liệu theo cấp: [sáng, giữa, tối], màu điểm nhấn (ruy băng/lá)
const LEVELS = [
  null,
  { name: "bronze", tone: ["#F6CFA2", "#C98546", "#7A4319"], accent: null },
  { name: "silver", tone: ["#FFFFFF", "#C3CCD7", "#6E7B8B"], accent: null },
  { name: "gold", tone: ["#FFF4B8", "#F2C23A", "#A66A12"], accent: "#E04F4F" },
  { name: "gold", tone: ["#FFF4B8", "#F2C23A", "#A66A12"], accent: "#3B82F6", leaf: "#6DBE5A" },
  { name: "platinum", tone: ["#F2FEFF", "#9EE3EE", "#2F8197"], accent: "#7C3AED", leaf: "#5CB8CB" },
  { name: "diamond", tone: ["#FFE8FF", "#D59CFF", "#6A23C9"], accent: "#EC4899", leaf: "#F3B4FF" },
];

const levelOf = (index, count) =>
  count <= 1 ? 6 : Math.round(1 + (index * 5) / (count - 1));

const star = (cx, cy, r) => {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `<polygon points="${points.join(" ")}" fill="#FFE27A" stroke="#B7791F" stroke-width="0.8"/>`;
};

// Vòng nguyệt quế: lá xếp dọc cung tròn hai bên
const laurel = (color) => {
  const leaves = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const deg = 115 + i * 20; // từ dưới vòng lên trên
      const rad = (deg * Math.PI) / 180;
      const x = 64 + side * 52 * Math.sin(rad);
      const y = 64 - 52 * Math.cos(rad);
      const rotate = side * (deg - 90);
      leaves.push(
        `<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="7" ry="3.4" transform="rotate(${rotate.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})" fill="${color}" stroke="#00000022" stroke-width="0.6"/>`,
      );
    }
  }
  return leaves.join("");
};

const rays = (color) => {
  const parts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    const b = a + 0.12;
    const c = a - 0.12;
    parts.push(
      `<polygon points="64,64 ${(64 + 63 * Math.cos(b)).toFixed(1)},${(64 + 63 * Math.sin(b)).toFixed(1)} ${(64 + 63 * Math.cos(c)).toFixed(1)},${(64 + 63 * Math.sin(c)).toFixed(1)}" fill="${color}"/>`,
    );
  }
  return `<g opacity="0.45">${parts.join("")}</g>`;
};

const ribbon = (color) =>
  `<polygon points="44,84 58,92 50,122 44,114 36,118" fill="${color}"/>` +
  `<polygon points="84,84 70,92 78,122 84,114 92,118" fill="${color}"/>` +
  `<polygon points="44,84 58,92 50,122 44,114 36,118" fill="#00000022" transform="translate(1.5 0)"/>`;

const badge = (group, level) => {
  const { tone, accent, leaf } = LEVELS[level];
  const [light, mid, dark] = tone;
  const glyph = GLYPHS[group];
  const id = `${group}_${level}`;

  // Biểu tượng 24×24 phóng lên ~40px, đặt giữa mặt huy hiệu
  const glyphSvg = [
    glyph.fill && `<path d="${glyph.fill}" fill="${dark}"/>`,
    glyph.stroke &&
      `<path d="${glyph.stroke}" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ]
    .filter(Boolean)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
<defs>
<linearGradient id="rim_${id}" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${light}"/><stop offset="0.5" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/>
</linearGradient>
<radialGradient id="face_${id}" cx="0.4" cy="0.35" r="0.75">
<stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/>
</radialGradient>
</defs>
${level >= 6 ? rays(mid) : ""}
${level >= 3 ? ribbon(accent) : ""}
${level >= 4 ? laurel(leaf) : ""}
<circle cx="64" cy="64" r="42" fill="url(#rim_${id})"/>
${level >= 2 ? `<circle cx="64" cy="64" r="38.5" fill="none" stroke="${light}" stroke-width="1.6" opacity="0.8"/>` : ""}
<circle cx="64" cy="64" r="34" fill="url(#face_${id})" stroke="${dark}" stroke-opacity="0.35" stroke-width="1"/>
<ellipse cx="52" cy="46" rx="16" ry="9" fill="#FFFFFF" opacity="0.3" transform="rotate(-25 52 46)"/>
<g transform="translate(44 44) scale(1.666)">${glyphSvg}</g>
${level >= 5 ? star(64, 15, 9) + star(44, 21, 6) + star(84, 21, 6) : ""}
${level >= 6 ? star(26, 40, 4) + star(102, 40, 4) : ""}
</svg>
`;
};

fs.mkdirSync(OUT_DIR, { recursive: true });

const mapLines = [];
for (const [group, targets] of Object.entries(GROUPS)) {
  const written = new Set();
  targets.forEach((target, index) => {
    const level = levelOf(index, targets.length);
    const file = `${group}_${level}.svg`;
    if (!written.has(file)) {
      fs.writeFileSync(path.join(OUT_DIR, file), badge(group, level));
      written.add(file);
    }
    mapLines.push(`  ${group}_${target}: require("../../assets/achievements/${file}"),`);
  });
}

fs.writeFileSync(
  MAP_FILE,
  `// Tự sinh bởi scripts/generate-achievement-badges.js, đừng sửa tay.
// id mốc thành tựu → ảnh huy hiệu SVG
export const ACHIEVEMENT_IMAGES: Record<string, number> = {
${mapLines.join("\n")}
};
`,
);

console.log(`Đã sinh ${fs.readdirSync(OUT_DIR).length} huy hiệu, ${mapLines.length} mốc.`);
