import fs from "fs";
import path from "path";

const publicDir = path.join(process.cwd(), "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. netra-404.svg
const netraSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 130" width="600" height="130" fill="none">
  <rect width="600" height="130" fill="#FFFFFF"/>
  <!-- Left Emblem -->
  <g transform="translate(10, 5)">
    <svg viewBox="0 0 140 120" width="140" height="120" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 16 78 A 54 54 0 0 1 124 78" stroke-width="2.2" />
      <path d="M 22 78 A 48 48 0 0 1 118 78" stroke-width="1" stroke-dasharray="2 2" />

      <line x1="20" y1="74" x2="8" y2="72" stroke-width="1.8" />
      <circle cx="7" cy="72" r="2" fill="#000000" />
      <line x1="24" y1="60" x2="13" y2="54" stroke-width="1.8" />
      <circle cx="12" cy="53" r="2" fill="#000000" />
      <line x1="31" y1="46" x2="22" y2="38" stroke-width="1.8" />
      <circle cx="21" cy="37" r="2" fill="#000000" />
      <line x1="42" y1="34" x2="35" y2="24" stroke-width="1.8" />
      <circle cx="34" cy="23" r="2" fill="#000000" />
      <line x1="55" y1="26" x2="50" y2="15" stroke-width="1.8" />
      <circle cx="49" cy="14" r="2" fill="#000000" />
      <line x1="70" y1="24" x2="70" y2="10" stroke-width="2" />
      <circle cx="70" cy="9" r="2.2" fill="#000000" />
      <line x1="85" y1="26" x2="90" y2="15" stroke-width="1.8" />
      <circle cx="91" cy="14" r="2" fill="#000000" />
      <line x1="98" y1="34" x2="105" y2="24" stroke-width="1.8" />
      <circle cx="106" cy="23" r="2" fill="#000000" />
      <line x1="109" y1="46" x2="118" y2="38" stroke-width="1.8" />
      <circle cx="119" cy="37" r="2" fill="#000000" />
      <line x1="116" y1="60" x2="127" y2="54" stroke-width="1.8" />
      <circle cx="128" cy="53" r="2" fill="#000000" />
      <line x1="120" y1="74" x2="132" y2="72" stroke-width="1.8" />
      <circle cx="133" cy="72" r="2" fill="#000000" />

      <path d="M 45 42 C 43 47 45 53 49 56 C 44 55 40 50 41 45 C 41 43 43 41 45 42 Z" fill="#000000" stroke-width="0.5" />
      <path d="M 70 20 L 70 42" stroke-width="2.2" />
      <path d="M 68 20 L 70 14 L 72 20 Z" fill="#000000" />
      <path d="M 64 34 C 61 30 61 24 64 20" stroke-width="2" />
      <path d="M 63 20 L 64 16 L 66 20 Z" fill="#000000" />
      <path d="M 76 34 C 79 30 79 24 76 20" stroke-width="2" />
      <path d="M 74 20 L 76 16 L 77 20 Z" fill="#000000" />
      <path d="M 62 34 C 65 37 75 37 78 34" stroke-width="2" />

      <path d="M 64 39 L 76 39 L 66 48 L 74 48 L 64 39 Z" fill="none" stroke-width="1.8" />
      <line x1="63" y1="48" x2="77" y2="48" stroke-width="2" />

      <path d="M 52 75 C 60 55 80 55 88 75 C 80 95 60 95 52 75 Z" stroke-width="2.4" />
      <path d="M 50 71 C 60 51 80 51 90 71" stroke-width="1.6" />

      <circle cx="70" cy="75" r="10" stroke-width="1.8" />
      <circle cx="70" cy="75" r="6.5" stroke-width="1.8" />
      <circle cx="70" cy="75" r="3.2" fill="#000000" />

      <path d="M 70 98 C 68 103 68 107 70 109 C 72 107 72 103 70 98 Z" fill="#000000" stroke-width="1" />
      <line x1="70" y1="95" x2="70" y2="98" stroke-width="1.8" />
    </svg>
  </g>
  <!-- Right Text: NETRA 404 -->
  <text x="180" y="80" fill="#000000" font-size="56" font-weight="900" font-family="system-ui, -apple-system, sans-serif" letter-spacing="12">NETRA 404</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, "netra-404.svg"), netraSvg);
console.log("Assets written successfully");
