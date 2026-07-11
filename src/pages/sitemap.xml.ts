import { games } from '@/lib/data';
import { site } from '@/lib/site';

const staticPaths = ['/', '/about/', '/privacy/'];
const gamePaths = games.flatMap((game) => [
  `/games/${game.slug}/`,
  `/codes/${game.slug}/`,
  `/tier-list/${game.slug}/`,
  `/compare/${game.slug}/`
]);

export function GET() {
  const urls = [...staticPaths, ...gamePaths]
    .map((path) => {
      const loc = new URL(path, site.url).toString();
      return `<url><loc>${loc}</loc><lastmod>${site.date}</lastmod></url>`;
    })
    .join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
