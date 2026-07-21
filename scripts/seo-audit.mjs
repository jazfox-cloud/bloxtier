import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const siteOrigin = 'https://bloxtier.com';

if (!existsSync(dist)) {
  console.error('dist/ is missing. Run npm run build first.');
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function routeFromFile(file) {
  const builtPath = `/${relative(dist, file).split(sep).join('/')}`;
  if (builtPath === '/index.html') return '/';
  if (builtPath.endsWith('/index.html')) return builtPath.slice(0, -'index.html'.length);
  if (builtPath === '/404.html') return '/404/';
  return builtPath;
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : undefined;
}

function decode(value = '') {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function stripTags(value = '') {
  return decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function meta(html, key, value) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (attr(tag, key)?.toLowerCase() === value.toLowerCase()) return decode(attr(tag, 'content') ?? '');
  }
  return '';
}

const htmlFiles = walk(dist).filter((file) => file.endsWith('.html'));
const pages = htmlFiles.map((file) => {
  const html = readFileSync(file, 'utf8');
  const route = routeFromFile(file);
  const title = stripTags(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  const description = meta(html, 'name', 'description');
  const robots = meta(html, 'name', 'robots');
  const canonicalTag = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0] ?? '';
  const canonical = decode(attr(canonicalTag, 'href') ?? '');
  const h1 = (html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? []).map(stripTags);
  const images = (html.match(/<img\b[^>]*>/gi) ?? []).map((tag) => ({
    src: decode(attr(tag, 'src') ?? ''),
    alt: attr(tag, 'alt'),
    tag
  }));
  const links = (html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []).map((tag) => ({
    href: decode(attr(tag, 'href') ?? ''),
    rel: (attr(tag, 'rel') ?? '').toLowerCase(),
    anchor: stripTags(tag),
    tag
  }));
  const jsonLd = (html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [])
    .map((tag) => tag.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, ''));
  return { file, route, html, title, description, robots, canonical, h1, images, links, jsonLd };
});

const formalPages = pages.filter((page) => page.route !== '/404/');
const formalRoutes = new Set(formalPages.map((page) => page.route));
const sitemapXml = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decode(match[1]));
const sitemapRoutes = new Set(sitemapUrls.map((url) => new URL(url).pathname));
const failures = [];

function fail(message) {
  failures.push(message);
}

for (const page of formalPages) {
  const expectedCanonical = new URL(page.route, siteOrigin).toString();
  if (page.canonical !== expectedCanonical) fail(`${page.route}: canonical is ${page.canonical || 'missing'}`);
  if (!page.title) fail(`${page.route}: title is missing`);
  if (!page.description) fail(`${page.route}: description is missing`);
  if (page.description.length < 110 || page.description.length > 160) {
    fail(`${page.route}: description length is ${page.description.length}`);
  }
  if (page.h1.length !== 1) fail(`${page.route}: expected 1 H1, found ${page.h1.length}`);
  if (/noindex/i.test(page.robots)) fail(`${page.route}: sitemap page is noindex`);
  for (const image of page.images) {
    if (image.alt === undefined) fail(`${page.route}: image ${image.src} has no alt attribute`);
  }
  for (const json of page.jsonLd) {
    try {
      JSON.parse(json);
    } catch {
      fail(`${page.route}: invalid JSON-LD`);
    }
  }
}

const descriptionOwners = new Map();
for (const page of formalPages) {
  const owners = descriptionOwners.get(page.description) ?? [];
  owners.push(page.route);
  descriptionOwners.set(page.description, owners);
}
for (const [description, owners] of descriptionOwners) {
  if (description && owners.length > 1) fail(`duplicate description: ${owners.join(', ')}`);
}

for (const route of formalRoutes) {
  if (!sitemapRoutes.has(route)) fail(`${route}: missing from sitemap`);
}
for (const route of sitemapRoutes) {
  if (!formalRoutes.has(route)) fail(`${route}: sitemap URL has no indexable HTML page`);
}
if (sitemapUrls.length !== sitemapRoutes.size) fail('sitemap contains duplicate URLs');
for (const url of sitemapUrls) {
  const parsed = new URL(url);
  if (parsed.origin !== siteOrigin || parsed.search || parsed.hash) fail(`invalid sitemap URL: ${url}`);
}

const errorPage = pages.find((page) => page.route === '/404/');
if (!errorPage) fail('404.html is missing');
if (errorPage && !/noindex/i.test(errorPage.robots)) fail('404.html is not noindex');
if (errorPage?.canonical) fail('404.html must not declare a canonical URL');
if (errorPage && meta(errorPage.html, 'property', 'og:url')) fail('404.html must not declare og:url');
if (sitemapRoutes.has('/404/')) fail('404 page is in sitemap');

const incoming = new Map([...formalRoutes].map((route) => [route, new Map()]));
const brokenLinks = [];
const redirectLinks = [];

for (const source of formalPages) {
  for (const link of source.links) {
    if (!link.href || link.href.startsWith('#') || /^(mailto|tel|javascript):/i.test(link.href)) continue;
    let target;
    try {
      target = new URL(link.href, new URL(source.route, siteOrigin));
    } catch {
      brokenLinks.push(`${source.route} -> ${link.href}`);
      continue;
    }
    if (target.origin !== siteOrigin) continue;
    const path = target.pathname;
    const isPageLike = !path.split('/').pop()?.includes('.');
    const normalizedPath = isPageLike && path !== '/' && !path.endsWith('/') ? `${path}/` : path;
    if (isPageLike && normalizedPath !== path) redirectLinks.push(`${source.route} -> ${path}`);
    if (!formalRoutes.has(normalizedPath) && normalizedPath !== '/' && normalizedPath !== '/sitemap.xml') {
      brokenLinks.push(`${source.route} -> ${path}`);
      continue;
    }
    if (source.route === normalizedPath || /(^|\s)nofollow(\s|$)/i.test(link.rel)) continue;
    if (incoming.has(normalizedPath)) {
      const anchors = incoming.get(normalizedPath).get(source.route) ?? new Set();
      anchors.add(link.anchor);
      incoming.get(normalizedPath).set(source.route, anchors);
    }
  }
}

for (const link of brokenLinks) fail(`broken internal link: ${link}`);
for (const link of redirectLinks) fail(`internal link points to redirect URL: ${link}`);

const resourceFailures = [];
for (const page of pages) {
  for (const image of page.images) {
    if (!image.src || /^(data:|https?:)/i.test(image.src)) continue;
    const resourcePath = new URL(image.src, siteOrigin).pathname.replace(/^\//, '');
    if (!existsSync(join(dist, resourcePath))) resourceFailures.push(`${page.route} -> ${image.src}`);
  }
}
for (const resource of resourceFailures) fail(`missing image resource: ${resource}`);

const inboundRows = [...incoming.entries()]
  .map(([route, sources]) => ({
    route,
    incoming: sources.size,
    sources: [...sources].map(([source, anchors]) => ({ source, anchors: [...anchors] }))
  }))
  .sort((a, b) => a.incoming - b.incoming || a.route.localeCompare(b.route));
const weakPages = inboundRows.filter((row) => row.route !== '/' && row.incoming <= 1);
const orphanPages = inboundRows.filter((row) => row.route !== '/' && row.incoming === 0);
const inboundByRoute = new Map(inboundRows.map((row) => [row.route, row]));
const imageCount = formalPages.reduce((sum, page) => sum + page.images.length, 0);
const emptyAltCount = formalPages.reduce((sum, page) => sum + page.images.filter((image) => image.alt === '').length, 0);

console.log(JSON.stringify({
  formalPageCount: formalPages.length,
  sitemapUrlCount: sitemapUrls.length,
  uniqueDescriptionCount: descriptionOwners.size,
  imageCount,
  missingAltCount: formalPages.reduce((sum, page) => sum + page.images.filter((image) => image.alt === undefined).length, 0),
  emptyDecorativeAltCount: emptyAltCount,
  brokenInternalLinkCount: brokenLinks.length,
  redirectInternalLinkCount: redirectLinks.length,
  orphanPageCount: orphanPages.length,
  weakPages,
  pages: formalPages.map(({ route, title, description, canonical, h1, images }) => ({
    route,
    title,
    description,
    descriptionLength: description.length,
    canonical,
    h1: h1[0] ?? '',
    imageCount: images.length,
    missingAltCount: images.filter((image) => image.alt === undefined).length,
    incomingLinkSourceCount: inboundByRoute.get(route)?.incoming ?? 0,
    incomingLinkSources: inboundByRoute.get(route)?.sources ?? []
  })),
  failures
}, null, 2));

if (failures.length) process.exitCode = 1;
