import React, { createContext, useContext, useEffect, useState } from 'react';
import { GameContextType, GameState, Pokemon, UserProfile, ViewState, MarketListing, Season, SEASONS, SocialState, RivalChallenge, GameEvent } from '../types';
import { getUserProfile, getInventory, saveUserProfile, addPokemonToInventory, removePokemonFromInventory } from '../services/db';
import { INITIAL_USER_STATE, COSTS, TRAINER_TITLES, XP_PER_LEVEL, SEASONAL_EVENTS, ITEMS } from '../constants';
import { generateMarketListings } from '../services/marketLogic';
import { generateMockLeaderboard, generateTradeOffers, initialGuildState } from '../services/socialService';
import { fetchEvolution, fetchRandomPokemon } from '../services/pokeApi';
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
  const [activeEvent, setActiveEvent] = useState<GameEvent | undefined>(undefined);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Social State
  const [social, setSocial] = useState<SocialState>({
    trades: [],
    leaderboard: [],
    guild: initialGuildState,
    rivalBattle: undefined
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [u, i] = await Promise.all([getUserProfile(), getInventory()]);
      setUser(prev => ({ ...prev, ...u })); // Merge to keep defaults
      setInventory(i);
      
      const month = new Date().getMonth();
      let currentSeason: Season = 'Spring';
      if (month >= 2 && month <= 4) currentSeason = 'Spring';
      else if (month >= 5 && month <= 7) currentSeason = 'Summer';
      else if (month >= 8 && month <= 10) currentSeason = 'Autumn';
      else currentSeason = 'Winter';
      setSeason(currentSeason);

      const events = SEASONAL_EVENTS[currentSeason];
      if (events && events.length > 0) {
        setActiveEvent(events[0]);
      }

      const initialListings = await generateMarketListings(3);
      setMarketListings(initialListings);

      const trades = await generateTradeOffers(3);
      const leaderboard = generateMockLeaderboard(u);
      setSocial(prev => ({ ...prev, trades, leaderboard }));

    } catch (e) {
      console.error("Failed to load initial data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
       setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    playSound('click');
  };

  const getMultipliers = (currentUser: UserProfile) => {
    const prestigeMult = 1 + (currentUser.prestige * 0.1);
    return { prestigeMult };
  };

  const updateTokens = async (amount: number) => {
    setUser(prev => {
        const { prestigeMult } = getMultipliers(prev);
        const eventMult = activeEvent?.effect === 'token_boost' && amount > 0 ? activeEvent.multiplier : 1;
        const adjustedAmount = amount > 0 ? Math.floor(amount * prestigeMult * eventMult) : amount;
        
        const newUser = { ...prev, tokens: prev.tokens + adjustedAmount };
        saveUserProfile(newUser).catch(console.error);
        return newUser;
    });
  };

  const updateStardust = async (amount: number) => {
    setUser(prev => {
        const { prestigeMult } = getMultipliers(prev);
        const eventMult = activeEvent?.effect === 'stardust_boost' && amount > 0 ? activeEvent.multiplier : 1;
        const adjustedAmount = amount > 0 ? Math.floor(amount * prestigeMult * eventMult) : amount;

        const newUser = { ...prev, stardust: Math.max(0, prev.stardust + adjustedAmount) };
        saveUserProfile(newUser).catch(console.error);
        return newUser;
    });
  };

  const addScore = async (amount: number) => {
    setUser(prev => {
        const newScore = prev.pokedexScore + amount;
        let newTitle = prev.title;
        const titleObj = [...TRAINER_TITLES].reverse().find(t => newScore >= t.threshold);
        if (titleObj && titleObj.title !== prev.title) {
            newTitle = titleObj.title;
        }
        const newUser = { ...prev, pokedexScore: newScore, title: newTitle };
        saveUserProfile(newUser).catch(console.error);
        return newUser;
    });
  };

  const gainXp = async (amount: number) => {
    setUser(prev => {
        const { prestigeMult } = getMultipliers(prev);
        const eventMult = activeEvent?.effect === 'xp_boost' ? activeEvent!.multiplier : 1;
        
        const adjustedAmount = Math.floor(amount * prestigeMult * eventMult);
        const newXp = prev.xp + adjustedAmount;
        const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1; 

        if (newLevel > prev.level) {
            playSound('success');
        }
        
        const newUser = { ...prev, xp: newXp, level: newLevel };
        saveUserProfile(newUser).catch(console.error);
        return newUser;
    });
  };

  const prestigeUser = async () => {
      setUser(prev => {
          if (prev.level < 50) return prev;
          const newUser: UserProfile = {
              ...prev,
              level: 1,
              xp: 0,
              prestige: prev.prestige + 1,
          };
          saveUserProfile(newUser).catch(console.error);
          playSound('evolve');
          return newUser;
      });
  };

  const addPokemon = async (pokemon: Pokemon) => {
    setInventory(prev => [pokemon, ...prev]);
    await addPokemonToInventory(pokemon);
    await addScore(10);
    playSound('success');
  };

  const updatePokemon = async (pokemon: Pokemon) => {
    setInventory(prev => prev.map(p => p.id === pokemon.id ? pokemon : p));
    await addPokemonToInventory(pokemon); // Put overwrites if key exists
  };

  const removePokemon = async (id: string) => {
    setInventory(prev => prev.filter(p => p.id !== id));
    await removePokemonFromInventory(id);
  };

  const toggleArchive = async (id: string) => {
      let updatedPokemon: Pokemon | undefined;
      setInventory(prev => prev.map(p => {
          if (p.id === id) {
              updatedPokemon = { ...p, isArchived: !p.isArchived };
              return updatedPokemon;
          }
          return p;
      }));
      if (updatedPokemon) {
          await addPokemonToInventory(updatedPokemon);
          playSound('click');
      }
  };

  const evolvePokemon = async (basePokemon: Pokemon): Promise<boolean> => {
    const copies = inventory.filter(p => p.apiId === basePokemon.apiId && !p.isArchived);
    if (copies.length < 3) return false;

    try {
        playSound('click');
        const evolvedForm = await fetchEvolution(basePokemon.apiId);
        
        if (evolvedForm) {
            const toRemove = copies.slice(0, 3);
            for (const p of toRemove) {
                await removePokemon(p.id);
            }
            if (basePokemon.isLegacy) {
                evolvedForm.isLegacy = true;
                evolvedForm.stats = {
                    hp: Math.floor(evolvedForm.stats.hp * 1.1),
                    attack: Math.floor(evolvedForm.stats.attack * 1.1),
                    defense: Math.floor(evolvedForm.stats.defense * 1.1),
                    speed: Math.floor(evolvedForm.stats.speed * 1.1),
                };
            }
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

  // Item Logic
  const buyItem = async (itemId: string, count: number = 1) => {
      const item = ITEMS[itemId];
      if (!item) return;
      const totalCost = item.price * count;
      
      if (user.tokens < totalCost) {
          playSound('error');
          return;
      }
      
      await updateTokens(-totalCost);
      setUser(prev => {
          const currentCount = prev.items?.[itemId] || 0;
          const newItems = { ...prev.items, [itemId]: currentCount + count };
          const newUser = { ...prev, items: newItems };
          saveUserProfile(newUser).catch(console.error);
          return newUser;
      });
      playSound('success');
  };

  const useItem = async (itemId: string, pokemonId: string): Promise<boolean> => {
      const item = ITEMS[itemId];
      if (!item || (user.items?.[itemId] || 0) <= 0) {
          playSound('error');
          return false;
      }

      // Logic handled in view, here we just deduct
      setUser(prev => {
          const currentCount = prev.items?.[itemId] || 0;
          if (currentCount <= 0) return prev;
          const newItems = { ...prev.items, [itemId]: currentCount - 1 };
          const newUser = { ...prev, items: newItems };
          saveUserProfile(newUser).catch(console.error);
          return newUser;
      });
      playSound('click');
      return true;
  };

  const acceptTrade = async (offerId: string, myPokemonId: string) => {
    const offer = social.trades.find(t => t.id === offerId);
    if (!offer) return;
    
    await removePokemon(myPokemonId);
    await addPokemon(offer.offeredPokemon);
    
    setSocial(prev => ({
        ...prev,
        trades: prev.trades.filter(t => t.id !== offerId)
    }));
  };

  const contributeToGuild = async (amount: number) => {
    if (user.stardust < amount) {
        playSound('error');
        return;
    }
    await updateStardust(-amount);
    
    setSocial(prev => {
        const newProg = prev.guild.totalProgress + amount;
        let newLevel = prev.guild.level;
        let newGoal = prev.guild.currentGoal;

        if (newProg >= prev.guild.currentGoal) {
            newLevel++;
            newGoal = Math.floor(newGoal * 1.5);
            playSound('success');
        } else {
            playSound('click');
        }

        return {
            ...prev,
            guild: {
                ...prev.guild,
                contribution: prev.guild.contribution + amount,
                totalProgress: newProg,
                level: newLevel,
                currentGoal: newGoal
            }
        };
    });
  };

  const startRivalBattle = async (trainerName: string) => {
    const rivalMon = await fetchRandomPokemon();
    rivalMon.stats.hp = Math.floor(rivalMon.stats.hp * 1.5);
    rivalMon.stats.attack = Math.floor(rivalMon.stats.attack * 1.2);
    
    setSocial(prev => ({
        ...prev,
        rivalBattle: {
            trainerName,
            pokemon: rivalMon
        }
    }));
    setView('battle');
  };

  const clearRivalBattle = () => {
    setSocial(prev => ({ ...prev, rivalBattle: undefined }));
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
    social,
    activeEvent,
    theme,
    setView,
    addPokemon,
    updatePokemon,
    removePokemon,
    updateTokens,
    updateStardust,
    addScore,
    gainXp,
    refreshData,
    refreshMarket,
    buyMarketItem,
    playAudio,
    evolvePokemon,
    acceptTrade,
    contributeToGuild,
    startRivalBattle,
    clearRivalBattle,
    prestigeUser,
    toggleArchive,
    toggleTheme,
    buyItem,
    useItem
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};