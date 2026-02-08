import React from 'react';
import { Pokemon, Rarity } from '../types';
import { TYPE_COLORS, REWARDS } from '../constants';
import { Zap, Shield, Heart, Activity, Cpu } from 'lucide-react';
import Button from './Button';
import { useGame } from '../context/GameContext';

interface PokemonCardProps {
  pokemon: Pokemon;
  readonly?: boolean;
}

const StatBar: React.FC<{ label: string; value: number; color: string; icon: React.ElementType }> = ({ label, value, color, icon: Icon }) => {
    // Cap visual bar at 150 for better distribution visibility, though values can go higher
    const percentage = Math.min(100, (value / 150) * 100);
    
    return (
        <div className="flex items-center gap-2 text-xs mb-1">
            <div className={`w-5 flex justify-center ${color.replace('bg-', 'text-')}`}>
                <Icon size={12} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between mb-0.5">
                    <span className="text-slate-400 font-bold text-[10px] uppercase">{label}</span>
                    <span className="text-white font-mono">{value}</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${color}`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

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
    <div className={`bg-slate-800 rounded-xl overflow-hidden border-2 ${rarityColor} transition-transform hover:-translate-y-1 duration-300 flex flex-col h-full`}>
      <div className="relative bg-slate-900 p-4 flex justify-center items-center h-40 group">
         {pokemon.isAiGenerated && (
            <div className="absolute top-2 left-2 bg-pink-600 text-xs px-2 py-1 rounded text-white flex items-center gap-1 z-10">
                <Cpu size={12} /> AI
            </div>
         )}
         <div className="absolute top-2 right-2 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-slate-800 rounded border border-slate-700 z-10">
            <span className={rarityText}>{pokemon.rarity}</span>
         </div>
         
         <img 
            src={pokemon.sprite} 
            alt={pokemon.name} 
            className="h-32 w-32 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
         />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-1">
            <h3 className="text-lg font-bold text-white capitalize truncate">{pokemon.name}</h3>
            <span className="text-slate-500 text-xs">#{pokemon.apiId || 'AI'}</span>
        </div>

        <div className="flex gap-1 mb-3 flex-wrap">
            {pokemon.types.map(t => (
                <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${TYPE_COLORS[t] || 'bg-gray-500'} text-white`}>
                    {t}
                </span>
            ))}
        </div>

        {pokemon.description && (
            <p className="text-[10px] text-slate-400 italic mb-3 line-clamp-2 min-h-[2rem]">
                "{pokemon.description}"
            </p>
        )}

        <div className="space-y-1 mb-3 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
            <StatBar label="HP" value={pokemon.stats.hp} color="bg-red-400" icon={Heart} />
            <StatBar label="ATK" value={pokemon.stats.attack} color="bg-yellow-400" icon={Zap} />
            <StatBar label="DEF" value={pokemon.stats.defense} color="bg-blue-400" icon={Shield} />
            <StatBar label="SPD" value={pokemon.stats.speed} color="bg-green-400" icon={Activity} />
        </div>

        {!readonly && (
            <div className="mt-auto pt-2">
                <Button variant="ghost" onClick={handleSell} className="w-full text-xs py-1 h-7 border border-slate-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center">
                    Release (+Tokens)
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PokemonCard;