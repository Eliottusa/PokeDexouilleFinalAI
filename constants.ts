import { Rarity, GameEvent, Item, Personality, Relic } from './types';

export const COSTS = {
  SUMMON_STANDARD: 10,
  SUMMON_AI: 50,
  SUMMON_CUSTOM: 100,
  SUMMON_FUSION: 150,
  SUMMON_EVENT: 75,
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
  BATTLE_WIN_XP: 100,
  BATTLE_WIN_TOKENS: 20,
  BATTLE_LOSS_TOKENS: 10,
};

export const INITIAL_USER_STATE = {
  tokens: 1000,
  stardust: 0,
  pokedexScore: 0,
  xp: 0,
  level: 1,
  title: 'Rookie',
  prestige: 0,
  items: { 'potion': 3 },
  relics: {},
  transactions: [],
  promptHistory: []
};

export const LEVEL_CAP = 50;
export const XP_PER_LEVEL = 500; // Linear leveling for simplicity

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

export const PERSONALITIES: Personality[] = ['Brave', 'Calm', 'Jolly', 'Adamant', 'Timorous', 'Bold', 'Hasty'];

export const ITEMS: Record<string, Item> = {
  'potion': { id: 'potion', name: 'Potion', description: 'Restores 20 HP.', price: 50, effect: 'heal', value: 20, icon: '🧪' },
  'super_potion': { id: 'super_potion', name: 'Super Potion', description: 'Restores 50 HP.', price: 150, effect: 'heal', value: 50, icon: '🍷' },
  'hyper_potion': { id: 'hyper_potion', name: 'Hyper Potion', description: 'Restores 200 HP.', price: 400, effect: 'heal', value: 200, icon: '✨' },
  'full_heal': { id: 'full_heal', name: 'Full Heal', description: 'Cures all status conditions.', price: 100, effect: 'status_heal', value: 0, icon: '💊' },
  'x_attack': { id: 'x_attack', name: 'X Attack', description: 'Boosts Attack stage by 1 during battle.', price: 200, effect: 'boost', value: 1, stat: 'attack', icon: '⚔️' },
  'x_defense': { id: 'x_defense', name: 'X Defense', description: 'Boosts Defense stage by 1 during battle.', price: 200, effect: 'boost', value: 1, stat: 'defense', icon: '🛡️' },
  'x_speed': { id: 'x_speed', name: 'X Speed', description: 'Boosts Speed stage by 1 during battle.', price: 200, effect: 'boost', value: 1, stat: 'speed', icon: '👟' },
};

export const RELICS: Record<string, Relic> = {
  'muscle_band': { id: 'muscle_band', name: 'Muscle Band', description: 'Boosts Attack by 10%.', price: 200, currency: 'stardust', effect: 'stat_boost', value: 0.1, stat: 'attack', icon: '💪' },
  'leftovers': { id: 'leftovers', name: 'Leftovers', description: 'Restores HP at end of turn.', price: 500, currency: 'stardust', effect: 'heal_turn', value: 0.06, icon: '🍎' },
  'scope_lens': { id: 'scope_lens', name: 'Scope Lens', description: 'Increases critical hit ratio.', price: 300, currency: 'stardust', effect: 'crit_boost', value: 0.1, icon: '🔭' },
  'quick_claw': { id: 'quick_claw', name: 'Quick Claw', description: 'Boosts Speed by 10%.', price: 200, currency: 'stardust', effect: 'stat_boost', value: 0.1, stat: 'speed', icon: '⚡' },
  'iron_vest': { id: 'iron_vest', name: 'Iron Vest', description: 'Boosts Defense by 10%.', price: 200, currency: 'stardust', effect: 'stat_boost', value: 0.1, stat: 'defense', icon: '🛡️' },
};

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

export const STATUS_COLORS: Record<string, string> = {
  burn: 'text-red-500',
  poison: 'text-purple-500',
  paralysis: 'text-yellow-500',
  sleep: 'text-blue-300',
  freeze: 'text-cyan-300',
  none: 'hidden'
};

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

export const TRAINER_TITLES = [
  { threshold: 0, title: 'Rookie' },
  { threshold: 100, title: 'Bug Catcher' },
  { threshold: 500, title: 'Ace Trainer' },
  { threshold: 1000, title: 'Gym Leader' },
  { threshold: 2500, title: 'Elite Four' },
  { threshold: 5000, title: 'Champion' },
  { threshold: 10000, title: 'Pokémon Master' },
];

export const BATTLE_DIFFICULTIES = {
  EASY: { id: 'easy', label: 'Training', multiplier: 0.8, rewardMult: 0.5 },
  NORMAL: { id: 'normal', label: 'Standard', multiplier: 1.0, rewardMult: 1.0 },
  HARD: { id: 'hard', label: 'High Stakes', multiplier: 1.3, rewardMult: 2.0 },
  DOUBLE: { id: 'double', label: 'Double Battle', multiplier: 1.1, rewardMult: 1.5 },
};

export const SEASONAL_EVENTS: Record<string, GameEvent[]> = {
  'Spring': [
    { id: 'bloom', name: 'Spring Bloom', description: 'Nature thrives! XP gain increased by 50%.', effect: 'xp_boost', multiplier: 1.5 },
  ],
  'Summer': [
    { id: 'heatwave', name: 'Solar Flare', description: 'Intense heat! Token gain increased by 50%.', effect: 'token_boost', multiplier: 1.5 },
  ],
  'Autumn': [
    { id: 'harvest', name: 'Golden Harvest', description: 'Reap the rewards! Stardust gain increased by 50%.', effect: 'stardust_boost', multiplier: 1.5 },
  ],
  'Winter': [
    { id: 'blizzard', name: 'Deep Freeze', description: 'Hardened resolve! Battle rewards are boosted.', effect: 'xp_boost', multiplier: 1.2 },
  ]
};