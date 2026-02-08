import React from 'react';
import { Pokemon, Rarity } from '../types';
import { TYPE_COLORS, REWARDS } from '../constants';
import { Zap, Shield, Heart, Activity, Sparkles, Cpu } from 'lucide-react';
import Button from './Button';
import { useGame } from '../context/GameContext';

interface PokemonCardProps {
  pokemon: Pokemon;
  readonly?: boolean;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, readonly = false }) => {
  const { updateTokens, removePokemon } = useGame();

  const handleSell = async () => {
    let reward = REWARDS.SELL_COMMON;
    if (pokemon.rarity === Rarity.RARE) reward = REWARDS.SELL_RARE;
    if (pokemon.rarity === Rarity.EPIC) reward = REWARDS.SELL_EPIC;
    if (pokemon.rarity === Rarity.LEGENDARY) reward = REWARDS.SELL_LEGENDARY;
    if (pokemon.rarity === Rarity.MYTHICAL) reward = REWARDS.SELL_MYTHICAL;

    if (confirm(`Sell ${pokemon.name} for ${reward} tokens? This cannot be undone.`)) {
      await updateTokens(reward);
      await removePokemon(pokemon.id);
    }
  };

  const rarityColor = {
    [Rarity.COMMON]: 'border-slate-600',
    [Rarity.RARE]: 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)]',
    [Rarity.EPIC]: 'border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)]',
    [Rarity.LEGENDARY]: 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]',
    [Rarity.MYTHICAL]: 'border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.6)]',
  }[pokemon.rarity];

  const rarityText = {
    [Rarity.COMMON]: 'text-slate-400',
    [Rarity.RARE]: 'text-blue-400',
    [Rarity.EPIC]: 'text-purple-400',
    [Rarity.LEGENDARY]: 'text-amber-400',
    [Rarity.MYTHICAL]: 'text-pink-400',
  }[pokemon.rarity];

  return (
    <div className={`bg-slate-800 rounded-xl overflow-hidden border-2 ${rarityColor} transition-transform hover:-translate-y-1 duration-300 flex flex-col`}>
      <div className="relative bg-slate-900 p-4 flex justify-center items-center h-48 group">
         {pokemon.isAiGenerated && (
            <div className="absolute top-2 left-2 bg-pink-600 text-xs px-2 py-1 rounded text-white flex items-center gap-1">
                <Cpu size={12} /> AI
            </div>
         )}
         <div className="absolute top-2 right-2 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-slate-800 rounded border border-slate-700">
            <span className={rarityText}>{pokemon.rarity}</span>
         </div>
         
         <img 
            src={pokemon.sprite} 
            alt={pokemon.name} 
            className="h-40 w-40 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
         />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-white capitalize truncate">{pokemon.name}</h3>
            <span className="text-slate-500 text-xs">#{pokemon.apiId || 'AI'}</span>
        </div>

        <div className="flex gap-1 mb-3 flex-wrap">
            {pokemon.types.map(t => (
                <span key={t} className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${TYPE_COLORS[t] || 'bg-gray-500'} text-white`}>
                    {t}
                </span>
            ))}
        </div>

        {pokemon.description && (
            <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">
                "{pokemon.description}"
            </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mb-4">
            <div className="flex items-center gap-1"><Heart size={12} className="text-red-400"/> HP: {pokemon.stats.hp}</div>
            <div className="flex items-center gap-1"><Zap size={12} className="text-yellow-400"/> ATK: {pokemon.stats.attack}</div>
            <div className="flex items-center gap-1"><Shield size={12} className="text-blue-400"/> DEF: {pokemon.stats.defense}</div>
            <div className="flex items-center gap-1"><Activity size={12} className="text-green-400"/> SPD: {pokemon.stats.speed}</div>
        </div>

        {!readonly && (
            <div className="mt-auto">
                <Button variant="ghost" onClick={handleSell} className="w-full text-xs py-1 h-8 border border-slate-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500">
                    Release (+tokens)
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PokemonCard;