import { Rarity, Pokemon, Personality } from '../types';
import { RARITY_WEIGHTS, PERSONALITIES } from '../constants';

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

const processPokemonData = async (data: any, rarityOverride?: Rarity): Promise<Pokemon> => {
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

    const rarity = rarityOverride || determineRarity();

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

    // Random Personality
    const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

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
      status: 'none',
      personality,
      friendship: 0
    };
};

export const fetchRandomPokemon = async (): Promise<Pokemon> => {
  const randomId = Math.floor(Math.random() * 1025) + 1;
  try {
    const response = await fetch(`${API_BASE}/pokemon/${randomId}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return processPokemonData(data);
  } catch (error) {
    console.error("Error fetching pokemon:", error);
    throw error;
  }
};

export const fetchPokemonById = async (id: number, rarity?: Rarity): Promise<Pokemon> => {
  try {
    const response = await fetch(`${API_BASE}/pokemon/${id}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return processPokemonData(data, rarity);
  } catch (error) {
    console.error("Error fetching pokemon by id:", error);
    throw error;
  }
};

export const fetchEvolution = async (currentApiId: number): Promise<Pokemon | null> => {
  try {
    // 1. Get Species
    const speciesRes = await fetch(`${API_BASE}/pokemon-species/${currentApiId}`);
    if (!speciesRes.ok) return null;
    const speciesData = await speciesRes.json();

    // 2. Get Evolution Chain
    const chainUrl = speciesData.evolution_chain?.url;
    if (!chainUrl) return null;
    
    const chainRes = await fetch(chainUrl);
    if (!chainRes.ok) return null;
    const chainData = await chainRes.json();

    // 3. Traverse Chain to find next evolution
    let currentStage = chainData.chain;
    
    // Recursive search for the current pokemon in the chain
    const findNextEvolution = (chain: any): any => {
      // API returns species name/url. ID is in URL.
      const idFromUrl = (url: string) => parseInt(url.split('/').filter(Boolean).pop() || '0');
      
      const chainId = idFromUrl(chain.species.url);

      if (chainId === currentApiId) {
        // Found current, return first evolution if exists
        if (chain.evolves_to && chain.evolves_to.length > 0) {
          return chain.evolves_to[0].species; // Simple: Pick first branch
        }
        return null; // No evolution
      }

      // Check children
      if (chain.evolves_to) {
        for (const child of chain.evolves_to) {
          const result = findNextEvolution(child);
          if (result) return result;
        }
      }
      return null;
    }

    const nextSpecies = findNextEvolution(currentStage);

    if (nextSpecies) {
      // 4. Fetch the evolved pokemon
      // Species name matches pokemon name usually, but safer to use ID if we extracted it, or name
      return await fetchPokemonById(parseInt(nextSpecies.url.split('/').filter(Boolean).pop() || '0'), Rarity.RARE); // Evolved forms are at least Rare
    }

    return null;

  } catch (e) {
    console.error("Evolution fetch failed", e);
    return null;
  }
};