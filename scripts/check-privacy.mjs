// 發文前的隱私自查：掃網站原始碼和 build 輸出，找不該公開的字樣。
// 用法：npm run build && npm run check-privacy
// 有找到就列出來並回傳 1（GitHub Actions 會因此停下、不部署）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCAN_DIRS = ['src', 'public', 'dist', '.github'];
const SCAN_FILES = ['astro.config.mjs', 'package.json', 'HOW-TO-POST.md'];
const TEXT_EXT = new Set(['.md', '.mdx', '.astro', '.ts', '.mjs', '.js', '.css', '.html', '.svg', '.json', '.xml', '.txt', '.yml', '.yaml']);

// [說明, 規則]（只放通用規則；具體的裝置名稱、資料夾名稱不寫在這裡，因為這個檔案會公開）
const RULES = [
  ['Windows 路徑', /\b[A-Za-z]:[\\/]/],
  ['使用者資料夾', /[\\/]Users[\\/]|AppData|Desktop[\\/]/i],
  ['email', /[\w.+-]+@[\w-]+\.[A-Za-z]{2,}/],
  // GitHub Actions 的 `id-token: write` 是部署 Pages 必要的權限名稱，不是金鑰
  ['金鑰字樣', /(?<!id-)token|api[_-]?key|secret|password|passwd/i],
  ['GitHub 帳號（只准 Karylcode）', /github\.com\/(?!Karylcode\b)[\w-]+/i],
];

// 本機私人清單：.privacy-words.local.txt（已在 .gitignore，不會上傳）
// 一行一個字，不分大小寫；# 開頭是註解。放裝置名稱、電腦名稱、私人資料夾名稱等。
const LOCAL_LIST = path.join(ROOT, '.privacy-words.local.txt');
if (fs.existsSync(LOCAL_LIST)) {
  const words = fs
    .readFileSync(LOCAL_LIST, 'utf8')
    .split(/\r?\n/)
    .map((w) => w.trim())
    .filter((w) => w && !w.startsWith('#'));
  for (const w of words) {
    const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 純英數的字前後不能接英數（避免撞到字型檔裡的亂碼，例如 U+5090、base64）
    const re = /^[A-Za-z0-9]+$/.test(w)
      ? new RegExp(`(?<![A-Za-z0-9+/])${esc}(?![A-Za-z0-9+/])`, 'i')
      : new RegExp(esc, 'i');
    RULES.push([`私人清單：${w}`, re]);
  }
} else {
  console.log('（沒有 .privacy-words.local.txt，只用通用規則。CI 上本來就沒有。）');
}

// 規則本身不掃
const SKIP = new Set([path.join('scripts', 'check-privacy.mjs')]);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (TEXT_EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
}

const files = [];
for (const d of SCAN_DIRS) walk(path.join(ROOT, d), files);
for (const f of SCAN_FILES) if (fs.existsSync(path.join(ROOT, f))) files.push(path.join(ROOT, f));

let hits = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (SKIP.has(rel)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [label, re] of RULES) {
      const m = line.match(re);
      if (m) {
        hits++;
        const at = Math.max(0, m.index - 30);
        console.log(`${rel}:${i + 1}  [${label}]  …${line.slice(at, m.index + m[0].length + 30).trim()}…`);
      }
    }
  });
}

// 媒體只准 webp（圖）和 mp4（短片）
const media = [];
(function walkMedia(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMedia(p);
    else media.push(p);
  }
})(path.join(ROOT, 'public', 'media'));
for (const m of media) {
  if (!['.webp', '.mp4'].includes(path.extname(m).toLowerCase())) {
    hits++;
    console.log(`${path.relative(ROOT, m)}  [媒體格式] 只放 .webp 和 .mp4`);
  }
}

console.log(`\n掃了 ${files.length} 個文字檔、${media.length} 個媒體檔，找到 ${hits} 處。`);
process.exit(hits ? 1 : 0);
