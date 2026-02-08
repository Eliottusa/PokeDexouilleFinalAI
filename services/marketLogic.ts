import { MarketListing, Rarity } from '../types';
import { fetchRandomPokemon } from './pokeApi';

export const generateMarketListings = async (count: number = 3): Promise<MarketListing[]> => {
  const listings: MarketListing[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const pokemon = await fetchRandomPokemon();
      
      // Market logic: Higher rarity cost more
      let price = 50;
      let currency: 'tokens' | 'stardust' = 'tokens';

      switch (pokemon.rarity) {
        case Rarity.COMMON:
            price = 30;
            break;
        case Rarity.RARE:
            price = 80;
            break;
        case Rarity.EPIC:
            price = 200;
            break;
        case Rarity.LEGENDARY:
            price = 50;
            currency = 'stardust';
            break;
        case Rarity.MYTHICAL:
            price = 100;
            currency = 'stardust';
            break;
      }

      listings.push({
        id: `market-${Date.now()}-${i}`,
        pokemon,
        price,
        currency,
        sold: false
      });
    } catch (e) {
      console.error("Failed to generate market item", e);
    }
  }
  return listings;
};