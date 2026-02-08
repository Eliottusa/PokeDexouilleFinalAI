import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import PokemonCard from '../components/PokemonCard';
import Button from '../components/Button';
import { Search, Filter, BarChart2, PieChart, ArrowUpDown, Dna, Archive } from 'lucide-react';
import { Rarity } from '../types';
import { GENERATIONS, TOTAL_POKEMON_COUNT } from '../constants';

const Pokedex: React.FC = () => {
  const { inventory, evolvePokemon } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<number | 'all' | 'ai'>('all');
  const [sortMethod, setSortMethod] = useState<'date' | 'name' | 'id' | 'power'>('date');
  const [showStats, setShowStats] = useState(false);
  const [evolveMode, setEvolveMode] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [processingEvolution, setProcessingEvolution] = useState<string | null>(null);

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

      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.types.some(t => t.includes(searchTerm.toLowerCase()));
      const matchesRarity = rarityFilter === 'all' || p.rarity === rarityFilter;
      
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

      return matchesSearch && matchesRarity && matchesGen;
    });
  }, [inventory, searchTerm, rarityFilter, genFilter, evolveMode, evolutionCandidates, showArchive]);

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
      setProcessingEvolution(pokemon.id);
      const success = await evolvePokemon(pokemon);
      if (!success) {
          alert("Evolution failed! Either no evolution exists or a network error occurred.");
      }
      setProcessingEvolution(null);
  };

  return (
    <div className="space-y-6 animate-fade-in h-full pb-20">
      
      {/* Header & Stats Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{showArchive ? 'Vault' : 'Pokédex'}</h2>
            <p className="text-slate-500 dark:text-slate-400">{showArchive ? 'Archived Pokémon storage.' : 'Manage your active collection.'}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
            <button 
                onClick={() => { setShowArchive(!showArchive); setEvolveMode(false); }} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${showArchive ? 'bg-indigo-500/20 border-indigo-500 text-indigo-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
                <Archive size={16} />
                <span className="text-sm font-medium">{showArchive ? 'Back to Dex' : 'Vault'}</span>
            </button>
            {!showArchive && (
                <button 
                onClick={() => setEvolveMode(!evolveMode)} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${evolveMode ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                <Dna size={16} />
                <span className="text-sm font-medium">Evolution</span>
                </button>
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
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
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

      {/* Grid */}
      {sortedInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
            <p className="text-slate-500 text-lg">No Pokémon found.</p>
            {searchTerm || rarityFilter !== 'all' || genFilter !== 'all' ? (
                <button onClick={() => {setSearchTerm(''); setRarityFilter('all'); setGenFilter('all');}} className="text-primary hover:underline mt-2">Clear Filters</button>
            ) : (
                <p className="text-slate-500 text-sm mt-2">Go to the Lab to summon some!</p>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sortedInventory.map(pokemon => {
                const canEvolve = evolutionCandidates.has(pokemon.apiId);
                return (
                    <div key={pokemon.id} className="relative group">
                        <PokemonCard pokemon={pokemon} />
                        {evolveMode && !showArchive && canEvolve && (
                            <div className="absolute inset-0 bg-slate-900/80 rounded-xl flex items-center justify-center z-20 backdrop-blur-sm">
                                <Button 
                                    onClick={() => handleEvolve(pokemon)}
                                    isLoading={processingEvolution === pokemon.id}
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
      )}
    </div>
  );
};

export default Pokedex;