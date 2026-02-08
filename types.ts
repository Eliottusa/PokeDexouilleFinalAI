export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  MYTHICAL = 'Mythical'
}

export interface PokemonStats {
  hp: number;
  maxHp?: number; // For battle state
  attack: number;
  defense: number;
  speed: number;
}

export interface Pokemon {
  id: string; // local unique ID
  apiId: number; // PokeAPI ID (or 0 for AI)
  name: string;
  types: string[];
  sprite: string; // Base64 string
  rarity: Rarity;
  stats: PokemonStats;
  isAiGenerated: boolean;
  acquiredAt: number;
  description?: string;
  isLegacy?: boolean;
  isArchived?: boolean;
}

export interface UserProfile {
  tokens: number;
  stardust: number;
  pokedexScore: number;
  xp: number;
  level: number;
  joinedAt: number;
  title: string;
  prestige: number;
}

export type ViewState = 'dashboard' | 'generator' | 'pokedex' | 'battle' | 'marketplace' | 'social';

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  effect: 'xp_boost' | 'token_boost' | 'stardust_boost' | 'shiny_boost';
  multiplier: number;
}

export interface GameState {
  user: UserProfile;
  inventory: Pokemon[];
  isLoading: boolean;
  activeView: ViewState;
  marketListings: MarketListing[];
  season: Season;
  social: SocialState;
  activeEvent?: GameEvent;
  theme: 'dark' | 'light';
}

export interface SocialState {
  trades: TradeOffer[];
  leaderboard: LeaderboardEntry[];
  guild: GuildState;
  rivalBattle?: RivalChallenge;
}

export interface TradeOffer {
  id: string;
  traderName: string;
  offeredPokemon: Pokemon;
  requestedType?: string; // e.g. 'fire'
  requestedRarity?: Rarity; // e.g. 'Rare'
  expiresAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  title: string;
  isRival: boolean;
  isUser: boolean;
}

export interface GuildState {
  name: string;
  level: number;
  contribution: number;
  totalProgress: number;
  currentGoal: number;
}

export interface RivalChallenge {
  trainerName: string;
  pokemon: Pokemon;
}

export interface GameContextType extends GameState {
  setView: (view: ViewState) => void;
  addPokemon: (pokemon: Pokemon) => Promise<void>;
  removePokemon: (id: string) => Promise<void>;
  updateTokens: (amount: number) => Promise<void>;
  updateStardust: (amount: number) => Promise<void>;
  addScore: (amount: number) => Promise<void>;
  gainXp: (amount: number) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshMarket: () => void;
  buyMarketItem: (listingId: string) => Promise<void>;
  // Social
  acceptTrade: (offerId: string, myPokemonId: string) => Promise<void>;
  contributeToGuild: (amount: number) => Promise<void>;
  startRivalBattle: (trainerName: string) => Promise<void>;
  clearRivalBattle: () => void;
  // Progression
  prestigeUser: () => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  toggleTheme: () => void;
}

export interface TurnLog {
  message: string;
  isPlayer: boolean;
}

export interface MarketListing {
  id: string;
  pokemon: Pokemon;
  price: number;
  currency: 'tokens' | 'stardust';
  sold: boolean;
}

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];