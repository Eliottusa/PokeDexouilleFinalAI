import React, { createContext, useContext, useEffect, useState } from 'react';
import { GameContextType, GameState, Pokemon, UserProfile, ViewState, MarketListing, Season, SEASONS, SocialState, RivalChallenge, GameEvent } from '../types';
import { getUserProfile, getInventory, saveUserProfile, addPokemonToInventory, removePokemonFromInventory } from '../services/db';
import { INITIAL_USER_STATE, COSTS, TRAINER_TITLES, XP_PER_LEVEL, SEASONAL_EVENTS } from '../constants';
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
      setUser(u);
      setInventory(i);
      
      // Determine Season
      const month = new Date().getMonth();
      let currentSeason: Season = 'Spring';
      if (month >= 2 && month <= 4) currentSeason = 'Spring';
      else if (month >= 5 && month <= 7) currentSeason = 'Summer';
      else if (month >= 8 && month <= 10) currentSeason = 'Autumn';
      else currentSeason = 'Winter';
      setSeason(currentSeason);

      // Set Event
      const events = SEASONAL_EVENTS[currentSeason];
      if (events && events.length > 0) {
        setActiveEvent(events[0]);
      }

      const initialListings = await generateMarketListings(3);
      setMarketListings(initialListings);

      // Social Init
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
    // Check system preference for theme
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
  };

  const getMultipliers = (currentUser: UserProfile) => {
    const prestigeMult = 1 + (currentUser.prestige * 0.1); // +10% per prestige
    return { prestigeMult };
  };

  // Use functional updates to prevent race conditions and stale closures
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
              // Keep tokens/stardust/score/inventory
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
          // In a real app we might move to a different store, but here we just update the flag
          await addPokemonToInventory(updatedPokemon); // Overwrite
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
            // Preserve Legacy status if base was Legacy? For now, new summons are new.
            // Maybe give a small bonus chance for legacy if evolving legacy?
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

  // Social Actions
  const acceptTrade = async (offerId: string, myPokemonId: string) => {
    const offer = social.trades.find(t => t.id === offerId);
    if (!offer) return;
    
    // Process Trade
    await removePokemon(myPokemonId);
    await addPokemon(offer.offeredPokemon);
    
    // Remove Offer
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
            playSound('success'); // Level up sound
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
    // Generate a slightly stronger pokemon for the rival
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
    toggleTheme
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};