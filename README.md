# BloxTier

BloxTier is a static Roblox competitive tools site for `bloxtier.com`.

## MVP scope

- Home page with launch roster.
- Game profile pages for RIVALS, Blue Lock: Rivals, and FIFA Super Soccer.
- Codes pages that separate verified active codes from candidate source queues.
- Tier list pages with clearly labeled starter/editorial data.
- Compare pages for the same three games.
- About, privacy, robots.txt, and sitemap.xml.

## Stack

- Astro
- Tailwind CSS
- Static output for Cloudflare Pages

## Commands

```bash
npm install
npm run dev
npm run build
```

## Data policy

Do not publish fake active codes or official-looking stats.

- `verified-active` codes require in-game redemption or an official/developer source.
- `candidate` code records can point to third-party guides, but must not show as active.
- Tier and compare scores are editorial until a live game source, patch note, wiki, or tested in-game evidence is attached.

## Next plan

1. Verify official Roblox URLs for all three launch games.
2. Replace RIVALS starter archetypes with current in-game weapon/loadout names.
3. Verify Blue Lock: Rivals style names and redemption status from the live game.
4. Decide whether FIFA Super Soccer stays watchlist-only or gets event pages.
5. Commit and push to a GitHub repository.
6. Create a GitHub-backed Cloudflare Pages project for `bloxtier.com`.
7. Confirm Pages shows Git Provider = Yes, then verify `/`, `/robots.txt`, `/sitemap.xml`, `/tier-list/blue-lock-rivals`, and `/compare/rivals` in production.
8. Submit the sitemap to an independent Google Search Console property.
