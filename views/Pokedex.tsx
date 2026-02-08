import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import PokemonCard from '../components/PokemonCard';
import Button from '../components/Button';
import { Search, Filter, BarChart2, PieChart, ArrowUpDown, Dna, Archive, Shield, X, Check, Heart, Info, Clock, Sword, Grid, List as ListIcon } from 'lucide-react';
import { Rarity, Pokemon } from '../types';
import { GENERATIONS, TOTAL_POKEMON_COUNT, RELICS, TYPE_COLORS, STATUS_COLORS } from '../constants';

const Pokedex: React.FC = () => {
  const { inventory, evolvePokemon, user, equipRelic, toggleFavorite } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<number | 'all' | 'ai'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [favFilter, setFavFilter] = useState(false);
  const [sortMethod, setSortMethod] = useState<'date' | 'name' | 'id' | 'power'>('date');
  
  const [showStats, setShowStats] = useState(false);
  const [evolveMode, setEvolveMode] = useState(false);
  const [equipMode, setEquipMode] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Modals
  const [selectedPokemonForEquip, setSelectedPokemonForEquip] = useState<string | null>(null);
  const [viewingPokemon, setViewingPokemon] = useState<Pokemon | null>(null);

  // Group by API ID to find duplicates (Exclude archived)
  const evolutionCandidates = useMemo(() => {
      const counts: Record<number, number> = {};
      inventory.filter(p => !p.isArchived).forEach(p => {
          if (p.apiId > 0) {
              counts[p.apiId] = (counts[p.apiId] || 0) + 1;
          }
      });
      return new Set(Object.keys(counts).filter(id => counts[Number(id)] >= 3).map(Number));
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => {
      // Archive Filter
      if (showArchive && !p.isArchived) return false;
      if (!showArchive && p.isArchived) return false;

      // Fav Filter
      if (favFilter && !p.isFavorite) return false;

      // Text Search
      const searchLower = searchTerm.toLowerCase();
      // Basic Search
      const matchesSearch = p.name.toLowerCase().includes(searchLower) || p.types.some(t => t.includes(searchLower));
      
      const matchesRarity = rarityFilter === 'all' || p.rarity === rarityFilter;
      
      // Type Filter
      const matchesType = typeFilter === 'all' || p.types.includes(typeFilter);

      let matchesGen = true;
      if (genFilter === 'ai') {
        matchesGen = p.apiId === 0;
      } else if (typeof genFilter === 'number') {
        const gen = GENERATIONS.find(g => g.id === genFilter);
        if (gen) {
          matchesGen = p.apiId >= gen.min && p.apiId <= gen.max;
        }
      }

      // If Evolve Mode is on, only show candidates
      if (evolveMode && !showArchive) {
          if (p.apiId === 0 || !evolutionCandidates.has(p.apiId)) return false;
      }

      return matchesSearch && matchesRarity && matchesGen && matchesType;
    });
  }, [inventory, searchTerm, rarityFilter, genFilter, typeFilter, favFilter, evolveMode, evolutionCandidates, showArchive]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalCaught = inventory.length;
    const uniqueIds = new Set(inventory.filter(p => p.apiId > 0).map(p => p.apiId));
    const uniqueCount = uniqueIds.size;
    const completionPercentage = (uniqueCount / TOTAL_POKEMON_COUNT) * 100;

    const rarityCounts = {
      [Rarity.COMMON]: 0,
      [Rarity.RARE]: 0,
      [Rarity.EPIC]: 0,
      [Rarity.LEGENDARY]: 0,
      [Rarity.MYTHICAL]: 0,
    };

    inventory.forEach(p => {
      if (rarityCounts[p.rarity] !== undefined) {
        rarityCounts[p.rarity]++;
      }
    });

    return { totalCaught, uniqueCount, completionPercentage, rarityCounts };
  }, [inventory]);

  // Sorting
  const sortedInventory = [...filteredInventory].sort((a, b) => {
      switch (sortMethod) {
          case 'name': return a.name.localeCompare(b.name);
          case 'id': return (a.apiId || 99999) - (b.apiId || 99999);
          case 'power': 
             const powerA = a.stats.attack + a.stats.defense + a.stats.hp + a.stats.speed;
             const powerB = b.stats.attack + b.stats.defense + b.stats.hp + b.stats.speed;
             return powerB - powerA;
          case 'date': 
          default: return b.acquiredAt - a.acquiredAt;
      }
  });

  const handleEvolve = async (pokemon: any) => {
      if (!confirm(`Evolve ${pokemon.name}? This will consume 3 copies to attempt to find the next evolution form.`)) return;
      setProcessingAction(pokemon.id);
      const success = await evolvePokemon(pokemon);
      if (!success) {
          alert("Evolution failed! Either no evolution exists or a network error occurred.");
      }
      setProcessingAction(null);
  };

  const handleEquip = async (relicId: string) => {
      if (!selectedPokemonForEquip) return;
      await equipRelic(selectedPokemonForEquip, relicId);
      setSelectedPokemonForEquip(null);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full pb-20 relative">
      
      {/* Header & Stats Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{showArchive ? 'Vault' : 'Pokédex'}</h2>
            <p className="text-slate-500 dark:text-slate-400">{showArchive ? 'Archived Pokémon storage.' : 'Manage your active collection.'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="bg-slate-200 dark:bg-slate-800 rounded-lg p-1 flex">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <Grid size={16}/>
                </button>
                <button 
                    onClick={() => setViewMode('compact')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    <ListIcon size={16}/>
                </button>
            </div>

            <button 
                onClick={() => { setShowArchive(!showArchive); setEvolveMode(false); setEquipMode(false); }} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${showArchive ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
                <Archive size={16} />
                <span className="text-sm font-medium">{showArchive ? 'Back to Dex' : 'Vault'}</span>
            </button>
            {!showArchive && (
                <>
                <button 
                    onClick={() => { setEvolveMode(!evolveMode); setEquipMode(false); }} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${evolveMode ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Dna size={16} />
                    <span className="text-sm font-medium">Evolution</span>
                </button>
                <button 
                    onClick={() => { setEquipMode(!equipMode); setEvolveMode(false); }} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${equipMode ? 'bg-purple-500/20 border-purple-500 text-purple-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                    <Shield size={16} />
                    <span className="text-sm font-medium">Equip</span>
                </button>
                </>
            )}
            <button 
            onClick={() => setShowStats(!showStats)} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${showStats ? 'bg-primary/20 border-primary text-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
            <BarChart2 size={16} />
            <span className="text-sm font-medium">Analytics</span>
            </button>
        </div>
      </div>

      {evolveMode && !showArchive && (
          <div className="bg-secondary/10 border border-secondary/50 p-4 rounded-xl text-secondary text-sm flex items-center gap-3">
              <Dna size={20} />
              <div>
                  <span className="font-bold">Evolution Protocol Active</span>
                  <p className="opacity-80">Pokémon with 3+ copies are highlighted. Click "Evolve" on a card to merge 3 copies into the next evolution stage.</p>
              </div>
          </div>
      )}

      {equipMode && !showArchive && (
          <div className="bg-purple-500/10 border border-purple-500/50 p-4 rounded-xl text-purple-500 text-sm flex items-center gap-3">
              <Shield size={20} />
              <div>
                  <span className="font-bold">Equipment Protocol Active</span>
                  <p className="opacity-80">Click on a Pokémon to equip a Relic from your inventory.</p>
              </div>
          </div>
      )}

      {/* Stats Panel */}
      {showStats && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-slide-in shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <PieChart size={16} /> Global Completion
              </h3>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-bold text-slate-800 dark:text-white">{stats.uniqueCount}</span>
                <span className="text-sm text-slate-500 mb-1.5">/ {TOTAL_POKEMON_COUNT} Unique Species</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-1000" 
                  style={{ width: `${stats.completionPercentage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Rarity Distribution</h3>
              <div className="space-y-2">
                {[Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL].map((rarity) => {
                   const count = stats.rarityCounts[rarity];
                   const max = Math.max(...Object.values(stats.rarityCounts), 1);
                   const percent = (count / max) * 100;
                   const colorClass = {
                      [Rarity.COMMON]: 'bg-slate-500',
                      [Rarity.RARE]: 'bg-blue-500',
                      [Rarity.EPIC]: 'bg-purple-500',
                      [Rarity.LEGENDARY]: 'bg-amber-500',
                      [Rarity.MYTHICAL]: 'bg-pink-500',
                   }[rarity];

                   return (
                     <div key={rarity} className="flex items-center gap-3 text-xs">
                        <span className={`w-20 text-right ${count > 0 ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{rarity}</span>
                        <div className="flex-1 bg-slate-200 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                           <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="w-8 font-mono text-slate-500">{count}</span>
                     </div>
                   );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-md">
          <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                  type="text" 
                  placeholder="Search Name or Type..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {/* Fav Filter */}
            <button 
                onClick={() => setFavFilter(!favFilter)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${favFilter ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'}`}
            >
                <Heart size={14} fill={favFilter ? "currentColor" : "none"}/>
            </button>

            {/* Sort Filter */}
            <div className="relative min-w-[140px]">
                <select 
                    value={sortMethod}
                    onChange={(e) => setSortMethod(e.target.value as any)}
                    className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                >
                    <option value="date">Date (Newest)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="id">ID (Asc)</option>
                    <option value="power">Combat Power</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Type Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer capitalize"
                >
                    <option value="all">All Types</option>
                    {Object.keys(TYPE_COLORS).filter(t => t !== 'unknown').map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Rarity Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                >
                    <option value="all">All Rarities</option>
                    <option value={Rarity.COMMON}>Common</option>
                    <option value={Rarity.RARE}>Rare</option>
                    <option value={Rarity.EPIC}>Epic</option>
                    <option value={Rarity.LEGENDARY}>Legendary</option>
                    <option value={Rarity.MYTHICAL}>Mythical</option>
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            {/* Gen Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={genFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGenFilter(val === 'all' || val === 'ai' ? val : Number(val));
                    }}
                    className="w-full appearance-none bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                >
                    <option value="all">All Gens</option>
                    {GENERATIONS.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    <option value="ai">AI / Custom</option>
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
      </div>

      {/* Content */}
      {sortedInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
            <p className="text-slate-500 text-lg">No Pokémon found.</p>
            {searchTerm || rarityFilter !== 'all' || genFilter !== 'all' ? (
                <button onClick={() => {setSearchTerm(''); setRarityFilter('all'); setGenFilter('all');}} className="text-primary hover:underline mt-2">Clear Filters</button>
            ) : (
                <p className="text-slate-500 text-sm mt-2">Go to the Lab to summon some!</p>
            )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sortedInventory.map(pokemon => {
                const canEvolve = evolutionCandidates.has(pokemon.apiId);
                return (
                    <div key={pokemon.id} className="relative group cursor-pointer" onClick={() => equipMode && setSelectedPokemonForEquip(pokemon.id)}>
                        <div className={equipMode && selectedPokemonForEquip === pokemon.id ? 'ring-2 ring-purple-500 rounded-xl' : ''}>
                          <PokemonCard 
                            pokemon={pokemon} 
                            onInfo={(!equipMode && !evolveMode) ? () => setViewingPokemon(pokemon) : undefined} 
                          />
                        </div>
                        
                        {evolveMode && !showArchive && canEvolve && (
                            <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm">
                                <Button 
                                    onClick={(e) => { e.stopPropagation(); handleEvolve(pokemon); }}
                                    isLoading={processingAction === pokemon.id}
                                    className="shadow-lg shadow-secondary/50 border border-secondary"
                                    variant="secondary"
                                >
                                    Evolve (3x)
                                </Button>
                            </div>
                        )}
                        {evolveMode && !showArchive && !canEvolve && (
                            <div className="absolute inset-0 bg-slate-950/80 rounded-xl z-20"></div>
                        )}
                    </div>
                );
            })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sortedInventory.map(pokemon => {
                const canEvolve = evolutionCandidates.has(pokemon.apiId);
                const cp = pokemon.stats.hp + pokemon.stats.attack + pokemon.stats.defense + pokemon.stats.speed;
                return (
                    <div 
                        key={pokemon.id}
                        onClick={() => {
                            if (equipMode) setSelectedPokemonForEquip(pokemon.id);
                            else if (!evolveMode) setViewingPokemon(pokemon);
                        }}
                        className={`flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary transition-all cursor-pointer ${equipMode && selectedPokemonForEquip === pokemon.id ? 'ring-2 ring-purple-500' : ''}`}
                    >
                        <img src={pokemon.sprite} className="w-10 h-10 object-contain" />
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-800 dark:text-white text-sm truncate">{pokemon.name}</span>
                                <span className={`text-[10px] font-bold uppercase ${pokemon.rarity === Rarity.LEGENDARY ? 'text-amber-500' : 'text-slate-500'}`}>{pokemon.rarity}</span>
                            </div>
                            <div className="flex gap-2 text-xs text-slate-500">
                                <span>CP {cp}</span>
                                <span>•</span>
                                <span className="capitalize">{pokemon.types.join('/')}</span>
                            </div>
                        </div>

                        {pokemon.heldItem && RELICS[pokemon.heldItem] && (
                            <span className="text-lg" title={RELICS[pokemon.heldItem].name}>{RELICS[pokemon.heldItem].icon}</span>
                        )}

                        {evolveMode && canEvolve && !showArchive && (
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={(e) => { e.stopPropagation(); handleEvolve(pokemon); }}
                                className="text-xs py-1 px-2 h-auto"
                            >
                                Evolve
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
      )}

      {/* Details Modal */}
      {viewingPokemon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="absolute top-0 left-0 w-full h-32 bg-slate-100 dark:bg-slate-800 z-0"></div>
                  <button onClick={() => setViewingPokemon(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/20 rounded-full text-white hover:bg-black/40"><X size={20}/></button>
                  
                  <div className="relative z-10 flex flex-col items-center pt-8 px-6 pb-6 overflow-y-auto">
                      <img src={viewingPokemon.sprite} className="w-48 h-48 object-contain drop-shadow-2xl animate-bounce-slow" />
                      
                      <div className="text-center mb-6">
                          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{viewingPokemon.nickname || viewingPokemon.name}</h2>
                          {viewingPokemon.nickname && <p className="text-sm text-slate-500">({viewingPokemon.name})</p>}
                          <div className="flex justify-center gap-2 mt-2">
                              {viewingPokemon.types.map(t => (
                                  <span key={t} className={`px-3 py-1 rounded-full text-xs font-bold uppercase text-white ${TYPE_COLORS[t] || 'bg-gray-500'}`}>
                                      {t}
                                  </span>
                              ))}
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                          {/* Stats */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><BarChart2 size={16}/> Combat Specs</h3>
                              <div className="space-y-2">
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">HP</span> <span className="font-mono">{viewingPokemon.stats.hp}</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Attack</span> <span className="font-mono">{viewingPokemon.stats.attack}</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Defense</span> <span className="font-mono">{viewingPokemon.stats.defense}</span></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Speed</span> <span className="font-mono">{viewingPokemon.stats.speed}</span></div>
                                  <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                                  <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span> <span className="font-bold text-accent">{viewingPokemon.stats.hp + viewingPokemon.stats.attack + viewingPokemon.stats.defense + viewingPokemon.stats.speed}</span></div>
                              </div>
                          </div>

                          {/* Info */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Info size={16}/> Data</h3>
                              <div className="space-y-2 text-sm">
                                  <div className="flex justify-between"><span className="text-slate-500">Species ID</span> <span className="font-mono">#{viewingPokemon.apiId}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Rarity</span> <span className={`capitalize font-bold ${viewingPokemon.rarity === Rarity.LEGENDARY ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{viewingPokemon.rarity}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Personality</span> <span className="capitalize">{viewingPokemon.personality}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Friendship</span> <span className="text-pink-500">{viewingPokemon.friendship}</span></div>
                                  <div className="flex justify-between"><span className="text-slate-500">Battles Won</span> <span className="text-green-500 font-bold">{viewingPokemon.battlesWon || 0}</span></div>
                              </div>
                          </div>
                      </div>

                      {/* History Log */}
                      <div className="w-full mt-6">
                          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2"><Clock size={16}/> Timeline</h3>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                              {viewingPokemon.history && viewingPokemon.history.length > 0 ? (
                                  <ul className="space-y-3">
                                      {[...viewingPokemon.history].reverse().map((entry, i) => (
                                          <li key={i} className="flex gap-3 text-xs text-slate-600 dark:text-slate-400">
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                                              {entry}
                                          </li>
                                      ))}
                                  </ul>
                              ) : (
                                  <p className="text-xs text-slate-500">No recorded history.</p>
                              )}
                          </div>
                      </div>
                      
                      <div className="w-full mt-6">
                          <Button onClick={() => toggleFavorite(viewingPokemon.id)} variant="ghost" className="w-full border border-slate-200 dark:border-slate-700">
                              <Heart className={viewingPokemon.isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"} size={20} />
                              <span className="ml-2">{viewingPokemon.isFavorite ? 'Unfavorite' : 'Add to Favorites'}</span>
                          </Button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Equip Modal Overlay */}
      {selectedPokemonForEquip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl relative">
                  <button onClick={() => setSelectedPokemonForEquip(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Shield className="text-purple-500"/> Equip Relic
                  </h3>
                  
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {Object.entries(user.relics || {}).filter(([_, count]) => count > 0).map(([relicId, count]) => {
                          const relic = RELICS[relicId];
                          return (
                              <button 
                                key={relicId}
                                onClick={() => handleEquip(relicId)}
                                className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-colors text-left group"
                              >
                                  <div className="text-2xl">{relic.icon}</div>
                                  <div className="flex-1">
                                      <div className="font-bold text-slate-800 dark:text-white">{relic.name}</div>
                                      <div className="text-xs text-slate-500">{relic.description}</div>
                                  </div>
                                  <div className="text-xs font-mono text-slate-400">x{count}</div>
                                  <div className="opacity-0 group-hover:opacity-100 text-purple-500"><Check size={20}/></div>
                              </button>
                          );
                      })}
                      {Object.values(user.relics || {}).every(c => c <= 0) && (
                          <div className="text-center py-8 text-slate-500">
                              <p className="mb-2">No relics in inventory.</p>
                              <Button variant="ghost" onClick={() => { setSelectedPokemonForEquip(null); }} >Go to Market</Button>
                          </div>
                      )}
                  </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default Pokedex;