// 文章裡的圖片、影片、YouTube 位置。
//
// 1. 一段只有一張圖的 Markdown：![替代文字](/media/xxx.webp "圖說")
//    → <figure><img …><figcaption>圖說</figcaption></figure>
// 2. /media/ 底下的圖自動補 width／height（讀檔頭），加 loading="lazy"。
// 3. <video src="/media/…" poster="/media/…"> 照 poster 的大小補 width／height。
// 4. <div data-youtube="影片ID" data-title="說明"></div>
//    有 ID → 換成 YouTube 嵌入；沒 ID → 開發模式顯示佔位框，正式 build 直接拿掉。
import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const isDev = process.env.NODE_ENV !== 'production';
const sizeCache = new Map();

function readSize(file) {
  if (sizeCache.has(file)) return sizeCache.get(file);
  let size = null;
  try {
    const b = fs.readFileSync(file);
    size = sizeFromBuffer(b);
  } catch {
    size = null;
  }
  sizeCache.set(file, size);
  return size;
}

function sizeFromBuffer(b) {
  // WebP
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    }
  }
  // PNG
  if (b.readUInt32BE(0) === 0x89504e47) {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  return null;
}

function localFile(src) {
  if (typeof src !== 'string' || !src.startsWith('/')) return null;
  return path.join(PUBLIC_DIR, decodeURI(src.split('?')[0]));
}

function isBlankText(node) {
  return node.type === 'text' && node.value.trim() === '';
}

function el(tagName, properties, children = []) {
  return { type: 'element', tagName, properties, children };
}

function text(value) {
  return { type: 'text', value };
}

function decorateImg(node) {
  const p = node.properties;
  const file = localFile(p.src);
  if (file) {
    const size = readSize(file);
    if (size) {
      p.width = size.width;
      p.height = size.height;
    }
  }
  p.loading = 'lazy';
  p.decoding = 'async';
}

function decorateVideo(node) {
  const p = node.properties;
  const file = localFile(p.poster);
  if (file && p.width == null) {
    const size = readSize(file);
    if (size) {
      p.width = size.width;
      p.height = size.height;
    }
  }
  p.controls = true;
  p.playsInline = true;
  if (p.preload == null) p.preload = 'metadata';
}

function youtube(node) {
  const p = node.properties || {};
  const id = String(p.dataYoutube ?? '').trim();
  const title = String(p.dataTitle ?? '影片');
  if (id) {
    return el('figure', { className: ['media-embed'] }, [
      el('div', { className: ['embed-frame'] }, [
        el('iframe', {
          src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
          title,
          loading: 'lazy',
          allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowFullScreen: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
        }),
      ]),
      el('figcaption', {}, [text(title)]),
    ]);
  }
  if (!isDev) return null; // 正式 build：還沒上傳的位置直接拿掉
  return el('div', { className: ['embed-placeholder'] }, [
    el('strong', {}, [text('YouTube 影片位置（還沒上傳）')]),
    el('span', {}, [text(title)]),
  ]);
}

function walk(parent) {
  if (!parent.children) return;
  const out = [];
  for (const node of parent.children) {
    if (node.type !== 'element') {
      out.push(node);
      continue;
    }
    // YouTube 位置
    if (node.tagName === 'div' && node.properties && 'dataYoutube' in node.properties) {
      const replaced = youtube(node);
      if (replaced) out.push(replaced);
      continue;
    }
    // 只有一張圖的段落 → figure
    if (node.tagName === 'p') {
      const meaningful = node.children.filter((c) => !isBlankText(c));
      if (meaningful.length === 1 && meaningful[0].type === 'element' && meaningful[0].tagName === 'img') {
        const img = meaningful[0];
        const caption = img.properties.title;
        delete img.properties.title;
        decorateImg(img);
        const children = [img];
        if (caption) children.push(el('figcaption', {}, [text(String(caption))]));
        out.push(el('figure', { className: ['media'] }, children));
        continue;
      }
    }
    if (node.tagName === 'img') decorateImg(node);
    if (node.tagName === 'video') decorateVideo(node);
    walk(node);
    out.push(node);
  }
  parent.children = out;
}

export default function rehypeMedia() {
  return (tree) => {
    walk(tree);
  };
}
