import React, { createContext, useContext, useEffect, useState } from 'react';
import { GameContextType, GameState, Pokemon, UserProfile, ViewState, MarketListing, Season, SEASONS } from '../types';
import { getUserProfile, getInventory, saveUserProfile, addPokemonToInventory, removePokemonFromInventory } from '../services/db';
import { INITIAL_USER_STATE, COSTS, TRAINER_TITLES } from '../constants';
import { generateMarketListings } from '../services/marketLogic';
import { fetchEvolution } from '../services/pokeApi';
import { playSound, SoundType } from '../services/soundService';

interface ExtendedGameContextType extends GameContextType {
  playAudio: (type: SoundType) => void;
  evolvePokemon: (pokemon: Pokemon) => Promise<boolean>;
}

const GameContext = createContext<ExtendedGameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>({ 
    ...INITIAL_USER_STATE, 
    joinedAt: Date.now() 
  });
  const [inventory, setInventory] = useState<Pokemon[]>([]);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Transient state
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [season, setSeason] = useState<Season>('Spring');

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [u, i] = await Promise.all([getUserProfile(), getInventory()]);
      setUser(u);
      setInventory(i);
      
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) setSeason('Spring');
      else if (month >= 5 && month <= 7) setSeason('Summer');
      else if (month >= 8 && month <= 10) setSeason('Autumn');
      else setSeason('Winter');

      const initialListings = await generateMarketListings(3);
      setMarketListings(initialListings);

    } catch (e) {
      console.error("Failed to load initial data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Use functional updates to prevent race conditions and stale closures
  const updateTokens = async (amount: number) => {
    setUser(prev => {
        const newUser = { ...prev, tokens: prev.tokens + amount };
        saveUserProfile(newUser).catch(console.error); // Save asynchronously
        return newUser;
    });
  };

  const updateStardust = async (amount: number) => {
    setUser(prev => {
        const newUser = { ...prev, stardust: Math.max(0, prev.stardust + amount) };
        saveUserProfile(newUser).catch(console.error);
        return newUser;
    });
  };

  const addScore = async (amount: number) => {
    setUser(prev => {
        const newScore = prev.pokedexScore + amount;
        
        // Determine Title
        let newTitle = prev.title;
        // Find the highest threshold met
        const titleObj = [...TRAINER_TITLES].reverse().find(t => newScore >= t.threshold);
        if (titleObj && titleObj.title !== prev.title) {
            newTitle = titleObj.title;
        }

        const newUser = { ...prev, pokedexScore: newScore, title: newTitle };
        saveUserProfile(newUser).catch(console.error);
        return newUser;
    });
  };

  const addPokemon = async (pokemon: Pokemon) => {
    setInventory(prev => [pokemon, ...prev]);
    await addPokemonToInventory(pokemon);
    await addScore(10);
    playSound('success');
  };

  const removePokemon = async (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
    await removePokemonFromInventory(id);
    // Score for selling is handled by addScore separately usually, but here we keep it consistent
  };

  const evolvePokemon = async (basePokemon: Pokemon): Promise<boolean> => {
    // 1. Check eligibility (3 copies)
    const copies = inventory.filter(p => p.apiId === basePokemon.apiId);
    if (copies.length < 3) return false;

    try {
        playSound('click');
        const evolvedForm = await fetchEvolution(basePokemon.apiId);
        
        if (evolvedForm) {
            // Remove 3 copies
            const toRemove = copies.slice(0, 3);
            for (const p of toRemove) {
                await removePokemon(p.id);
            }
            
            // Add new
            await addPokemon(evolvedForm);
            playSound('evolve');
            return true;
        } else {
            playSound('error');
            return false;
        }
    } catch (e) {
        console.error("Evolution failed", e);
        playSound('error');
        return false;
    }
  };

  const setView = (view: ViewState) => {
    setActiveView(view);
    playSound('click');
  };

  const refreshMarket = async () => {
    if (user.tokens < COSTS.MARKET_REFRESH) {
        playSound('error');
        return;
    }
    await updateTokens(-COSTS.MARKET_REFRESH);
    const newListings = await generateMarketListings(3);
    setMarketListings(newListings);
    playSound('click');
  };

  const buyMarketItem = async (listingId: string) => {
    const listing = marketListings.find(l => l.id === listingId);
    if (!listing || listing.sold) return;

    if (listing.currency === 'tokens') {
        if (user.tokens < listing.price) { playSound('error'); return; }
        await updateTokens(-listing.price);
    } else {
        if (user.stardust < listing.price) { playSound('error'); return; }
        await updateStardust(-listing.price);
    }

    await addPokemon(listing.pokemon);
    setMarketListings(prev => prev.map(l => l.id === listingId ? { ...l, sold: true } : l));
  };

  const playAudio = (type: SoundType) => {
      playSound(type);
  };

  const value: ExtendedGameContextType = {
    user,
    inventory,
    activeView,
    isLoading,
    marketListings,
    season,
    setView,
    addPokemon,
    removePokemon,
    updateTokens,
    updateStardust,
    addScore,
    refreshData,
    refreshMarket,
    buyMarketItem,
    playAudio,
    evolvePokemon
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};