export type GameSlug = 'rivals' | 'blue-lock-rivals' | 'fifa-super-soccer';
export type Tier = 'S' | 'A' | 'B' | 'C' | 'Watch';

export interface Game {
  slug: GameSlug;
  name: string;
  shortName: string;
  category: string;
  status: 'MVP tracked' | 'Watchlist';
  summary: string;
  robloxUrl?: string;
  primaryIntent: string;
  lastReviewed: string;
  evidence: string[];
  nextStep: string;
}

export interface TierItem {
  id: string;
  gameSlug: GameSlug;
  name: string;
  type: string;
  tier: Tier;
  role: string;
  strengths: string[];
  cautions: string[];
  metrics: {
    pressure: number;
    mobility: number;
    control: number;
    consistency: number;
  };
  sourceNote: string;
}

export interface CodeRecord {
  gameSlug: GameSlug;
  status: 'verified-active' | 'candidate' | 'expired' | 'none-found';
  code?: string;
  reward?: string;
  checkedAt: string;
  sourceLabel: string;
  sourceUrl?: string;
  notes: string;
}

export const games: Game[] = [
  {
    slug: 'rivals',
    name: 'RIVALS',
    shortName: 'RIVALS',
    category: 'Arena FPS',
    status: 'MVP tracked',
    summary:
      'A fast Roblox arena shooter where loadout choice, aim comfort, and map pressure decide most matchups.',
    primaryIntent: 'rivals tier list',
    lastReviewed: '2026-07-06',
    evidence: [
      'Roblox game page verification still needed before production data lock.',
      'Search result coverage is thin, so BloxTier starts with a conservative editorial loadout model.'
    ],
    nextStep: 'Verify the official Roblox experience URL and replace starter loadouts with in-game weapon names.'
  },
  {
    slug: 'blue-lock-rivals',
    name: 'Blue Lock: Rivals',
    shortName: 'Blue Lock',
    category: 'Anime soccer',
    status: 'MVP tracked',
    summary:
      'A soccer PvP experience where style choice, burst movement, and finishing reliability shape the meta.',
    primaryIntent: 'blue lock rivals tier list',
    lastReviewed: '2026-07-06',
    evidence: [
      'PC Gamer published a July 2026 codes guide, confirming active search demand.',
      'Public Blue Lock character references support the character/style vocabulary, not Roblox balance values.'
    ],
    nextStep: 'Cross-check current in-game style names and code redemption results from the live experience.'
  },
  {
    slug: 'fifa-super-soccer',
    name: 'FIFA Super Soccer',
    shortName: 'FIFA Soccer',
    category: 'Sports event',
    status: 'Watchlist',
    summary:
      'A FIFA/Gamefam Roblox soccer hub tied to World Cup 2026 activity, rewards, and team-based play.',
    primaryIntent: 'fifa super soccer codes',
    lastReviewed: '2026-07-06',
    evidence: [
      'June 2026 coverage describes FIFA Super Soccer as the event hub for FIFA World Cup content on Roblox.',
      'The original BloxTier plan keeps tournament tracking as a later phase because it needs ongoing schedule data.'
    ],
    nextStep: 'Keep codes and event notes live, then add standings only after a stable source is selected.'
  }
];

export const tierItems: TierItem[] = [
  {
    id: 'precision-control',
    gameSlug: 'rivals',
    name: 'Precision Control Loadout',
    type: 'Loadout archetype',
    tier: 'S',
    role: 'Long sightline control',
    strengths: ['Rewards clean aim', 'Controls mid-map lanes', 'Strong in duel formats'],
    cautions: ['Weak if forced into chaotic close range', 'Needs map knowledge'],
    metrics: { pressure: 88, mobility: 62, control: 94, consistency: 82 },
    sourceNote: 'Editorial starter archetype pending official weapon verification.'
  },
  {
    id: 'rush-entry',
    gameSlug: 'rivals',
    name: 'Rush Entry Loadout',
    type: 'Loadout archetype',
    tier: 'A',
    role: 'Close range opener',
    strengths: ['Fast pressure', 'Punishes passive players', 'Good for small arenas'],
    cautions: ['Falls off on open maps', 'Can trade poorly against precise aim'],
    metrics: { pressure: 91, mobility: 86, control: 58, consistency: 70 },
    sourceNote: 'Editorial starter archetype pending official weapon verification.'
  },
  {
    id: 'balanced-flex',
    gameSlug: 'rivals',
    name: 'Balanced Flex Loadout',
    type: 'Loadout archetype',
    tier: 'A',
    role: 'Default ranked pick',
    strengths: ['Stable across maps', 'Easy to learn', 'Can swap tempo mid-round'],
    cautions: ['Rarely dominates a specialist matchup'],
    metrics: { pressure: 76, mobility: 74, control: 76, consistency: 86 },
    sourceNote: 'Editorial starter archetype pending official weapon verification.'
  },
  {
    id: 'kaiser',
    gameSlug: 'blue-lock-rivals',
    name: 'Kaiser',
    type: 'Style watchlist',
    tier: 'S',
    role: 'Finisher',
    strengths: ['High shot threat', 'Strong carry profile', 'Fits aggressive scorers'],
    cautions: ['Needs in-game rarity and balance verification'],
    metrics: { pressure: 96, mobility: 78, control: 82, consistency: 86 },
    sourceNote: 'Character vocabulary supported by public Blue Lock references; Roblox balance is editorial pending live checks.'
  },
  {
    id: 'rin',
    gameSlug: 'blue-lock-rivals',
    name: 'Rin',
    type: 'Style watchlist',
    tier: 'S',
    role: 'All-around striker',
    strengths: ['Reliable attack profile', 'Good matchup flexibility', 'Strong control identity'],
    cautions: ['Needs current in-game patch verification'],
    metrics: { pressure: 92, mobility: 82, control: 90, consistency: 88 },
    sourceNote: 'Character vocabulary supported by public Blue Lock references; Roblox balance is editorial pending live checks.'
  },
  {
    id: 'bachira',
    gameSlug: 'blue-lock-rivals',
    name: 'Bachira',
    type: 'Style watchlist',
    tier: 'A',
    role: 'Dribble creator',
    strengths: ['High mobility profile', 'Creates space', 'Good for playmakers'],
    cautions: ['Finishing value depends on player execution'],
    metrics: { pressure: 78, mobility: 95, control: 88, consistency: 76 },
    sourceNote: 'Character vocabulary supported by public Blue Lock references; Roblox balance is editorial pending live checks.'
  },
  {
    id: 'team-quest-focus',
    gameSlug: 'fifa-super-soccer',
    name: 'Quest Reward Route',
    type: 'Event route',
    tier: 'Watch',
    role: 'Reward path',
    strengths: ['Targets weekly rewards', 'Useful for event completion', 'Low mechanical barrier'],
    cautions: ['Depends on live event rotation and verified quest list'],
    metrics: { pressure: 52, mobility: 64, control: 70, consistency: 68 },
    sourceNote: 'Event hub is supported by June 2026 coverage; live reward details still need verification.'
  },
  {
    id: 'national-team-play',
    gameSlug: 'fifa-super-soccer',
    name: 'National Team Match Route',
    type: 'Event route',
    tier: 'Watch',
    role: 'Team play',
    strengths: ['Matches World Cup intent', 'Clear casual appeal', 'Good for guide expansion'],
    cautions: ['Not enough verified balance data for ranked tiers'],
    metrics: { pressure: 66, mobility: 70, control: 62, consistency: 64 },
    sourceNote: 'Event hub is supported by June 2026 coverage; live team data still needs verification.'
  }
];

export const codeRecords: CodeRecord[] = [
  {
    gameSlug: 'rivals',
    status: 'none-found',
    checkedAt: '2026-07-06',
    sourceLabel: 'BloxTier manual queue',
    notes: 'No verified active RIVALS codes are published on BloxTier yet. Add only codes confirmed in-game or by an official channel.'
  },
  {
    gameSlug: 'blue-lock-rivals',
    status: 'candidate',
    checkedAt: '2026-07-06',
    sourceLabel: 'PC Gamer July 2026 guide',
    sourceUrl: 'https://www.pcgamer.com/games/roblox/blue-lock-rivals-codes/',
    notes: 'Current search demand exists, but individual codes still need in-game redemption verification before being marked active.'
  },
  {
    gameSlug: 'fifa-super-soccer',
    status: 'none-found',
    checkedAt: '2026-07-06',
    sourceLabel: 'BloxTier manual queue',
    notes: 'No verified active FIFA Super Soccer codes are published on BloxTier yet. Event rewards should be tracked separately from redeemable codes.'
  }
];

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}

export function getTierItems(slug: string) {
  return tierItems.filter((item) => item.gameSlug === slug);
}

export function getCodeRecords(slug: string) {
  return codeRecords.filter((record) => record.gameSlug === slug);
}

export function tierClass(tier: Tier) {
  if (tier === 'S') return 'tier-s';
  if (tier === 'A') return 'tier-a';
  if (tier === 'B') return 'tier-b';
  if (tier === 'C') return 'tier-c';
  return 'tier-watch';
}
