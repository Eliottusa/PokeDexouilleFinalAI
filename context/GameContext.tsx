import React, { createContext, useContext, useEffect, useState } from 'react';
import { GameContextType, GameState, Pokemon, UserProfile, ViewState, MarketListing, Season, SEASONS } from '../types';
import { getUserProfile, getInventory, saveUserProfile, addPokemonToInventory, removePokemonFromInventory } from '../services/db';
import { INITIAL_USER_STATE, COSTS } from '../constants';
import { generateMarketListings } from '../services/marketLogic';

const GameContext = createContext<GameContextType | undefined>(undefined);

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
  
  // Transient state (not saved in IDB for MVP simplicity, could be added later)
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [season, setSeason] = useState<Season>('Spring');

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [u, i] = await Promise.all([getUserProfile(), getInventory()]);
      setUser(u);
      setInventory(i);
      
      // Initialize Season based on month
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) setSeason('Spring');
      else if (month >= 5 && month <= 7) setSeason('Summer');
      else if (month >= 8 && month <= 10) setSeason('Autumn');
      else setSeason('Winter');

      // Initial Market Gen
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

  const updateTokens = async (amount: number) => {
    const newUser = { ...user, tokens: user.tokens + amount };
    setUser(newUser);
    await saveUserProfile(newUser);
  };

  const updateStardust = async (amount: number) => {
    const newUser = { ...user, stardust: Math.max(0, user.stardust + amount) };
    setUser(newUser);
    await saveUserProfile(newUser);
  };

  const addScore = async (amount: number) => {
    const newUser = { ...user, pokedexScore: user.pokedexScore + amount };
    setUser(newUser);
    await saveUserProfile(newUser);
  };

  const addPokemon = async (pokemon: Pokemon) => {
    setInventory(prev => [pokemon, ...prev]);
    await addPokemonToInventory(pokemon);
    await addScore(10);
  };

  const removePokemon = async (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
    await removePokemonFromInventory(id);
    await addScore(3);
  };

  const setView = (view: ViewState) => {
    setActiveView(view);
  };

  const refreshMarket = async () => {
    if (user.tokens < COSTS.MARKET_REFRESH) return;
    await updateTokens(-COSTS.MARKET_REFRESH);
    const newListings = await generateMarketListings(3);
    setMarketListings(newListings);
  };

  const buyMarketItem = async (listingId: string) => {
    const listing = marketListings.find(l => l.id === listingId);
    if (!listing || listing.sold) return;

    if (listing.currency === 'tokens') {
        if (user.tokens < listing.price) return;
        await updateTokens(-listing.price);
    } else {
        if (user.stardust < listing.price) return;
        await updateStardust(-listing.price);
    }

    await addPokemon(listing.pokemon);
    setMarketListings(prev => prev.map(l => l.id === listingId ? { ...l, sold: true } : l));
  };

  const value: GameContextType = {
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
    buyMarketItem
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};