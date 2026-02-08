import { Rarity, Pokemon } from '../types';
import { RARITY_WEIGHTS } from '../constants';

const API_BASE = 'https://pokeapi.co/api/v2';

// Helper to determine rarity based on weights
const determineRarity = (): Rarity => {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const item of RARITY_WEIGHTS) {
    cumulative += item.weight;
    if (rand <= cumulative) return item.rarity;
  }
  return Rarity.COMMON;
};

// Convert image URL to Base64 for offline storage
const imageToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert image", error);
    return ''; // Return empty or placeholder if failed
  }
};

export const fetchRandomPokemon = async (): Promise<Pokemon> => {
  const randomId = Math.floor(Math.random() * 1025) + 1;
  
  try {
    const response = await fetch(`${API_BASE}/pokemon/${randomId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    
    // Process types
    const types = data.types.map((t: any) => t.type.name);
    
    // Process stats
    const stats = {
      hp: data.stats.find((s: any) => s.stat.name === 'hp')?.base_stat || 50,
      attack: data.stats.find((s: any) => s.stat.name === 'attack')?.base_stat || 50,
      defense: data.stats.find((s: any) => s.stat.name === 'defense')?.base_stat || 50,
      speed: data.stats.find((s: any) => s.stat.name === 'speed')?.base_stat || 50,
    };

    // Process image (Official Artwork or Sprite)
    const imageUrl = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
    const base64Image = await imageToBase64(imageUrl);

    const rarity = determineRarity();

    // Adjust stats based on rarity multiplier (simple logic)
    const multiplier = {
      [Rarity.COMMON]: 1,
      [Rarity.RARE]: 1.2,
      [Rarity.EPIC]: 1.5,
      [Rarity.LEGENDARY]: 2,
      [Rarity.MYTHICAL]: 2.5,
    }[rarity];

    const finalStats = {
      hp: Math.floor(stats.hp * multiplier),
      attack: Math.floor(stats.attack * multiplier),
      defense: Math.floor(stats.defense * multiplier),
      speed: Math.floor(stats.speed * multiplier),
    };

    return {
      id: `${data.id}-${Date.now()}`,
      apiId: data.id,
      name: data.name,
      types,
      sprite: base64Image,
      rarity,
      stats: finalStats,
      isAiGenerated: false,
      acquiredAt: Date.now(),
    };

  } catch (error) {
    console.error("Error fetching pokemon:", error);
    throw error;
  }
};