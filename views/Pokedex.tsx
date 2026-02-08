import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';
import PokemonCard from '../components/PokemonCard';
import { Search, Filter } from 'lucide-react';
import { Rarity } from '../types';

const Pokedex: React.FC = () => {
  const { inventory } = useGame();
  const [searchTerm, setSearchTerm] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.types.some(t => t.includes(searchTerm.toLowerCase()));
      const matchesRarity = rarityFilter === 'all' || p.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [inventory, searchTerm, rarityFilter]);

  // Sort by acquisition time (newest first)
  const sortedInventory = [...filteredInventory].sort((a, b) => b.acquiredAt - a.acquiredAt);

  return (
    <div className="space-y-6 animate-fade-in h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Pokédex</h2>
            <p className="text-slate-400">Manage your collection ({inventory.length} total).</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search name or type..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:outline-none"
                />
            </div>
            <div className="relative">
                <select 
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-10 py-2 text-sm text-white focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
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
        </div>
      </div>

      {sortedInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <p className="text-slate-500 text-lg">No Pokémon found.</p>
            {searchTerm || rarityFilter !== 'all' ? (
                <button onClick={() => {setSearchTerm(''); setRarityFilter('all')}} className="text-primary hover:underline mt-2">Clear Filters</button>
            ) : (
                <p className="text-slate-600 text-sm mt-2">Go to the Lab to summon some!</p>
            )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {sortedInventory.map(pokemon => (
                <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
        </div>
      )}
    </div>
  );
};

export default Pokedex;