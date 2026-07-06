export const site = {
  name: 'BloxTier',
  domain: 'bloxtier.com',
  url: 'https://bloxtier.com',
  description:
    'Roblox competitive tier lists, code checks, and side-by-side compare tools for Rivals, Blue Lock: Rivals, and FIFA Super Soccer.',
  date: '2026-07-06'
};

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/tier-list/rivals', label: 'Tier Lists' },
  { href: '/compare/rivals', label: 'Compare' },
  { href: '/codes/blue-lock-rivals', label: 'Codes' }
];

export function canonical(path = '/') {
  return new URL(path, site.url).toString();
}
