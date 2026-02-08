import { LeaderboardEntry, TradeOffer, GuildState, Rarity, Pokemon, UserProfile } from '../types';
import { fetchRandomPokemon } from './pokeApi';
import { TRAINER_TITLES } from '../constants';

const NPC_NAMES = ['Ace Trainer Joey', 'Leader Misty', 'Rival Gary', 'Collector Bill', 'Hiker Dave', 'Psychic Sabrina'];

export const generateMockLeaderboard = (userProfile: UserProfile): LeaderboardEntry[] => {
  const leaderboard: LeaderboardEntry[] = [];
  
  // Generate 9 NPCs
  for (let i = 0; i < 9; i++) {
    const score = Math.floor(Math.random() * 5000) + 500;
    const titleObj = [...TRAINER_TITLES].reverse().find(t => score >= t.threshold);
    
    leaderboard.push({
      rank: 0,
      name: NPC_NAMES[i % NPC_NAMES.length] + (Math.floor(Math.random() * 99)),
      score: score,
      title: titleObj?.title || 'Rookie',
      isRival: Math.random() > 0.7, // 30% chance to be challengeable
      isUser: false
    });
  }

  // Add User
  leaderboard.push({
    rank: 0,
    name: 'You',
    score: userProfile.pokedexScore,
    title: userProfile.title,
    isRival: false,
    isUser: true
  });

  // Sort and rank
  return leaderboard
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
};

export const generateTradeOffers = async (count: number = 3): Promise<TradeOffer[]> => {
  const offers: TradeOffer[] = [];
  const types = ['fire', 'water', 'grass', 'electric', 'psychic', 'dragon', 'steel', 'fairy'];
  const rarities = [Rarity.COMMON, Rarity.RARE, Rarity.EPIC];

  for (let i = 0; i < count; i++) {
    try {
      const pokemon = await fetchRandomPokemon();
      const wantType = types[Math.floor(Math.random() * types.length)];
      const wantRarity = rarities[Math.floor(Math.random() * rarities.length)];
      
      offers.push({
        id: `trade-${Date.now()}-${i}`,
        traderName: NPC_NAMES[i % NPC_NAMES.length],
        offeredPokemon: pokemon,
        requestedType: Math.random() > 0.5 ? wantType : undefined,
        requestedRarity: Math.random() > 0.5 ? wantRarity : undefined,
        expiresAt: Date.now() + 86400000 // 24h
      });
    } catch (e) {
      console.error("Failed to gen trade", e);
    }
  }
  return offers;
};

export const initialGuildState: GuildState = {
  name: "Starfall Vanguard",
  level: 3,
  contribution: 0,
  totalProgress: 1450,
  currentGoal: 2000
};