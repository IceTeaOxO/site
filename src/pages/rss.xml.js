import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('blog');
  const base = import.meta.env.BASE_URL;
  return rss({
    title: '個人首頁與部落格',
    description: '最新文章 RSS feed',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `${base}/blog/${post.id}/`,
    })),
  });
}
