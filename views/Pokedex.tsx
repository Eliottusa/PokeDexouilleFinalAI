import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import PokemonCard from '../components/PokemonCard';
import { Search, Filter, BarChart2, PieChart } from 'lucide-react';
import { Rarity } from '../types';
import { GENERATIONS, TOTAL_POKEMON_COUNT } from '../constants';

const Pokedex: React.FC = () => {
  const { inventory } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [genFilter, setGenFilter] = useState<number | 'all' | 'ai'>('all');
  const [showStats, setShowStats] = useState(true);

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => {
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

      return matchesSearch && matchesRarity && matchesGen;
    });
  }, [inventory, searchTerm, rarityFilter, genFilter]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalCaught = inventory.length;
    // Unique ID based on API ID (ignoring AI generation duplicates for purity, but counting unique AI IDs)
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

  // Sort by acquisition time (newest first)
  const sortedInventory = [...filteredInventory].sort((a, b) => b.acquiredAt - a.acquiredAt);

  return (
    <div className="space-y-6 animate-fade-in h-full pb-20">
      
      {/* Header & Stats Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Pokédex</h2>
            <p className="text-slate-400">Manage your collection.</p>
        </div>
        <button 
          onClick={() => setShowStats(!showStats)} 
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${showStats ? 'bg-primary/20 border-primary text-primary' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
        >
          <BarChart2 size={16} />
          <span className="text-sm font-medium">Analytics</span>
        </button>
      </div>

      {/* Stats Panel (Heatmap / Progress) */}
      {showStats && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Completion Progress */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                <PieChart size={16} /> Global Completion
              </h3>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-3xl font-bold text-white">{stats.uniqueCount}</span>
                <span className="text-sm text-slate-500 mb-1.5">/ {TOTAL_POKEMON_COUNT} Unique Species</span>
              </div>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-1000" 
                  style={{ width: `${stats.completionPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">0%</span>
                <span className="text-xs text-primary font-bold">{stats.completionPercentage.toFixed(1)}%</span>
                <span className="text-xs text-slate-500">100%</span>
              </div>
            </div>

            {/* Rarity Heatmap / Distribution */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Rarity Distribution</h3>
              <div className="space-y-2">
                {[Rarity.COMMON, Rarity.RARE, Rarity.EPIC, Rarity.LEGENDARY, Rarity.MYTHICAL].map((rarity) => {
                   const count = stats.rarityCounts[rarity];
                   const max = Math.max(...Object.values(stats.rarityCounts), 1); // Avoid div by zero
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
                        <span className={`w-20 text-right ${count > 0 ? 'text-white' : 'text-slate-600'}`}>{rarity}</span>
                        <div className="flex-1 bg-slate-900 h-2 rounded-full overflow-hidden">
                           <div className={`h-full ${colorClass}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <span className="w-8 font-mono text-slate-400">{count}</span>
                     </div>
                   );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700 sticky top-0 z-10 shadow-xl">
          {/* Search */}
          <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            {/* Rarity Filter */}
            <div className="relative min-w-[120px]">
                <select 
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
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
                    className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
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
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <p className="text-slate-500 text-lg">No Pokémon found.</p>
            {searchTerm || rarityFilter !== 'all' || genFilter !== 'all' ? (
                <button onClick={() => {setSearchTerm(''); setRarityFilter('all'); setGenFilter('all');}} className="text-primary hover:underline mt-2">Clear Filters</button>
            ) : (
                <p className="text-slate-600 text-sm mt-2">Go to the Lab to summon some!</p>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {sortedInventory.map(pokemon => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Pokedex;