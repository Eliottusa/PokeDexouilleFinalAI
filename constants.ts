import { Rarity } from './types';

export const COSTS = {
  SUMMON_STANDARD: 10,
  SUMMON_AI: 50,
  SUMMON_CUSTOM: 100,
  MARKET_REFRESH: 5,
  HEAL_COST: 2,
};

export const REWARDS = {
  SELL_COMMON: 2,
  SELL_RARE: 8,
  SELL_EPIC: 25,
  SELL_LEGENDARY: 100,
  SELL_MYTHICAL: 250,
  SCORE_NEW: 10,
  SCORE_SELL: 3,
  BATTLE_WIN_STARDUST: 15,
  BATTLE_WIN_XP: 50,
};

export const INITIAL_USER_STATE = {
  tokens: 100,
  stardust: 0,
  pokedexScore: 0,
  xp: 0,
  level: 1,
};

export const DB_NAME = 'pokegen-dex-db';
export const DB_VERSION = 1;
export const STORE_USER = 'user_profile';
export const STORE_INVENTORY = 'inventory';

export const RARITY_WEIGHTS = [
  { rarity: Rarity.COMMON, weight: 60 },
  { rarity: Rarity.RARE, weight: 25 },
  { rarity: Rarity.EPIC, weight: 10 },
  { rarity: Rarity.LEGENDARY, weight: 5 },
];

export const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-stone-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400 text-black',
  ice: 'bg-cyan-300 text-black',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-700',
  flying: 'bg-indigo-300 text-black',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-800',
  dragon: 'bg-indigo-600',
  dark: 'bg-slate-700',
  steel: 'bg-slate-400',
  fairy: 'bg-pink-300 text-black',
  unknown: 'bg-gray-500'
};

// Simple Type Chart: Attacker Type -> [Strong Against]
// If defender type is in array, damage x2.
// Weakness is inverse logic for simplicity in this MVP.
export const TYPE_CHART: Record<string, string[]> = {
  normal: [],
  fire: ['grass', 'ice', 'bug', 'steel'],
  water: ['fire', 'ground', 'rock'],
  grass: ['water', 'ground', 'rock'],
  electric: ['water', 'flying'],
  ice: ['grass', 'ground', 'flying', 'dragon'],
  fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
  poison: ['grass', 'fairy'],
  ground: ['fire', 'electric', 'poison', 'rock', 'steel'],
  flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'poison'],
  bug: ['grass', 'psychic', 'dark'],
  rock: ['fire', 'ice', 'flying', 'bug'],
  ghost: ['psychic', 'ghost'],
  dragon: ['dragon'],
  dark: ['psychic', 'ghost'],
  steel: ['ice', 'rock', 'fairy'],
  fairy: ['fighting', 'dragon', 'dark']
};

export const GENERATIONS = [
  { id: 1, name: 'Gen I', min: 1, max: 151 },
  { id: 2, name: 'Gen II', min: 152, max: 251 },
  { id: 3, name: 'Gen III', min: 252, max: 386 },
  { id: 4, name: 'Gen IV', min: 387, max: 493 },
  { id: 5, name: 'Gen V', min: 494, max: 649 },
  { id: 6, name: 'Gen VI', min: 650, max: 721 },
  { id: 7, name: 'Gen VII', min: 722, max: 809 },
  { id: 8, name: 'Gen VIII', min: 810, max: 905 },
  { id: 9, name: 'Gen IX', min: 906, max: 1025 },
];

export const TOTAL_POKEMON_COUNT = 1025;
