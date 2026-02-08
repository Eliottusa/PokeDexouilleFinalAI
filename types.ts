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
}

export interface UserProfile {
  tokens: number;
  stardust: number;
  pokedexScore: number;
  xp: number;
  level: number;
  joinedAt: number;
  title: string;
}

export type ViewState = 'dashboard' | 'generator' | 'pokedex' | 'battle' | 'marketplace';

export interface GameState {
  user: UserProfile;
  inventory: Pokemon[];
  isLoading: boolean;
  activeView: ViewState;
  marketListings: MarketListing[];
  season: Season;
}

export interface GameContextType extends GameState {
  setView: (view: ViewState) => void;
  addPokemon: (pokemon: Pokemon) => Promise<void>;
  removePokemon: (id: string) => Promise<void>;
  updateTokens: (amount: number) => Promise<void>;
  updateStardust: (amount: number) => Promise<void>;
  addScore: (amount: number) => Promise<void>;
  refreshData: () => Promise<void>;
  refreshMarket: () => void;
  buyMarketItem: (listingId: string) => Promise<void>;
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