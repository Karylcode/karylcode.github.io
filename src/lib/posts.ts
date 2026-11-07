import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'devlog'>;

/** 全部文章，新的在前。正式 build 不含草稿。 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('devlog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026.11.07（用 UTC 讀，避免時區把日期往前推一天） */
export function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

/** 11.07 */
export function shortDate(d: Date): string {
  return `${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function postUrl(post: Post): string {
  return `/devlog/${post.id}/`;
}
