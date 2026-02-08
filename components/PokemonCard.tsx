import React from 'react';
import { Pokemon, Rarity } from '../types';
import { TYPE_COLORS, REWARDS, STATUS_COLORS, RELICS } from '../constants';
import { Zap, Shield, Heart, Activity, Cpu, Star, Archive, RotateCcw, Smile } from 'lucide-react';
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
                    <span className="text-slate-800 dark:text-white font-mono">{value}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
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
  const { updateTokens, removePokemon, toggleArchive, unequipRelic } = useGame();

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

  const handleUnequip = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await unequipRelic(pokemon.id);
  };

  const rarityColor = {
    [Rarity.COMMON]: 'border-slate-300 dark:border-slate-600',
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
    <div className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border-2 ${pokemon.isLegacy ? 'border-yellow-400 ring-2 ring-yellow-400/50' : rarityColor} transition-transform hover:-translate-y-1 duration-300 flex flex-col h-full shadow-sm`}>
      <div className="relative bg-slate-100 dark:bg-slate-900 p-4 flex justify-center items-center h-40 group">
         {pokemon.isLegacy && (
            <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 z-10 shadow-lg">
                <Star size={10} fill="currentColor" /> LEGACY
            </div>
         )}
         {pokemon.isAiGenerated && (
            <div className={`absolute ${pokemon.isLegacy ? 'top-8' : 'top-2'} left-2 bg-pink-600 text-xs px-2 py-1 rounded text-white flex items-center gap-1 z-10`}>
                <Cpu size={12} /> AI
            </div>
         )}
         <div className="absolute top-2 right-2 text-xs font-bold uppercase tracking-wider px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 z-10">
            <span className={rarityText}>{pokemon.rarity}</span>
         </div>
         
         {/* Held Item Indicator */}
         {pokemon.heldItem && RELICS[pokemon.heldItem] && (
             <div 
                className="absolute bottom-2 left-2 z-10 bg-slate-800/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 border border-slate-600 cursor-help"
                title={RELICS[pokemon.heldItem].name}
                onClick={!readonly ? handleUnequip : undefined}
             >
                 <span>{RELICS[pokemon.heldItem].icon}</span>
                 {!readonly && <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</span>}
             </div>
         )}
         
         <img 
            src={pokemon.sprite} 
            alt={pokemon.name} 
            className={`h-32 w-32 object-contain drop-shadow-xl group-hover:scale-110 transition-transform duration-300 ${pokemon.status !== 'none' ? 'opacity-80 grayscale-[0.5]' : ''}`}
            loading="lazy"
         />
         
         {pokemon.status !== 'none' && (
             <div className={`absolute bottom-2 right-2 text-xs font-bold uppercase ${STATUS_COLORS[pokemon.status]}`}>
                 {pokemon.status}
             </div>
         )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
            <div className="overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white capitalize truncate">
                    {pokemon.nickname ? (
                        <>
                            {pokemon.nickname}
                            <span className="block text-[10px] text-slate-400 font-normal">({pokemon.name})</span>
                        </>
                    ) : pokemon.name}
                </h3>
            </div>
            <span className="text-slate-400 text-xs shrink-0">#{pokemon.apiId || 'AI'}</span>
        </div>

        <div className="flex gap-1 mb-3 flex-wrap">
            {pokemon.types.map(t => (
                <span key={t} className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${TYPE_COLORS[t] || 'bg-gray-500'} text-white`}>
                    {t}
                </span>
            ))}
        </div>

        {pokemon.description && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mb-3 line-clamp-2 min-h-[2rem]">
                "{pokemon.description}"
            </p>
        )}

        <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-500 dark:text-slate-400">
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                <Smile size={10} /> {pokemon.personality || 'Unknown'}
             </div>
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                <Heart size={10} className={pokemon.friendship > 50 ? 'text-pink-500' : 'text-slate-400'} /> {pokemon.friendship || 0}
             </div>
        </div>

        <div className="space-y-1 mb-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
            <StatBar label="HP" value={pokemon.stats.hp} color="bg-red-400" icon={Heart} />
            <StatBar label="ATK" value={pokemon.stats.attack} color="bg-yellow-400" icon={Zap} />
            <StatBar label="DEF" value={pokemon.stats.defense} color="bg-blue-400" icon={Shield} />
            <StatBar label="SPD" value={pokemon.stats.speed} color="bg-green-400" icon={Activity} />
        </div>

        {!readonly && (
            <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                 <Button 
                    variant="ghost" 
                    onClick={(e) => { e.stopPropagation(); toggleArchive(pokemon.id); }} 
                    className="w-full text-xs py-1 h-7 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center"
                    title={pokemon.isArchived ? "Unarchive" : "Archive"}
                >
                    {pokemon.isArchived ? <RotateCcw size={14}/> : <Archive size={14}/>}
                </Button>
                <Button 
                    variant="ghost" 
                    onClick={(e) => { e.stopPropagation(); handleSell(); }}
                    className="w-full text-xs py-1 h-7 border border-slate-300 dark:border-slate-700 hover:border-red-500 hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center"
                >
                    Release
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PokemonCard;