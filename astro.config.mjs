// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';
import rehypeMedia from './src/plugins/rehype-media.mjs';

// GitHub Pages 個人主站：https://karylcode.github.io（base 是 /）
export default defineConfig({
  site: 'https://karylcode.github.io',
  base: '/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  markdown: {
    processor: unified({
      // 先把 Markdown 裡的 HTML（video、YouTube 位置）解析成節點，rehype-media 才處理得到
      rehypePlugins: [rehypeRaw, rehypeMedia],
      smartypants: false,
    }),
  },
  devToolbar: {
    enabled: false,
  },
});
