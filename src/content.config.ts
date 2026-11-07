import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const devlog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/devlog' }),
  schema: z.object({
    title: z.string(),
    // 文章日期（這篇寫到哪一天）
    date: z.coerce.date(),
    // 涵蓋的期間，例如「9/30 – 10/1」；沒有就只顯示日期
    period: z.string().optional(),
    // 列表和文章開頭的一兩句摘要
    summary: z.string(),
    // 封面圖（放在 public/media/<slug>/ 底下，寫 /media/... 開頭的路徑）
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    // true = 草稿：npm run dev 看得到，npm run build 不會輸出
    draft: z.boolean().default(false),
  }),
});

export const collections = { devlog };
