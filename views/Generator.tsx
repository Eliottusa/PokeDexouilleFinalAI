import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSTS } from '../constants';
import { fetchRandomPokemon } from '../services/pokeApi';
import { generateAiPokemon, generateFusionPokemon, generateEventPokemon } from '../services/geminiService';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { Pokemon } from '../types';
import { Dna, Sparkles, AlertCircle, Command, Zap, Snowflake, Sun, CloudRain, Leaf, Check, History } from 'lucide-react';

const Generator: React.FC = () => {
  const { user, inventory, updateTokens, addPokemon, updatePokemon, season, activeEvent, savePrompt } = useGame();
  const [generatedPokemon, setGeneratedPokemon] = useState<Pokemon | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'generating' | 'capturing' | 'revealed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'standard' | 'ai' | 'custom' | 'fusion' | 'event'>('standard');
  const [customPrompt, setCustomPrompt] = useState('');
  
  // Fusion State
  const [fusionParents, setFusionParents] = useState<[string | null, string | null]>([null, null]);
  const [showFusionSelector, setShowFusionSelector] = useState<0 | 1 | null>(null); // 0 for parent 1, 1 for parent 2

  // Nickname State
  const [customNickname, setCustomNickname] = useState('');

  const getCost = () => {
    if (mode === 'standard') return COSTS.SUMMON_STANDARD;
    if (mode === 'ai') return COSTS.SUMMON_AI;
    if (mode === 'fusion') return COSTS.SUMMON_FUSION;
    if (mode === 'event') return COSTS.SUMMON_EVENT;
    return COSTS.SUMMON_CUSTOM;
  };

  const handleSummon = async () => {
    const cost = getCost();

    if (user.tokens < cost) {
      setError(`Not enough tokens! You need ${cost}. Sell Pokémon to earn more.`);
      return;
    }

    if (mode === 'custom' && !customPrompt.trim()) {
      setError("Please enter a description for your custom Pokémon.");
      return;
    }

    if (mode === 'fusion' && (!fusionParents[0] || !fusionParents[1])) {
        setError("Please select two Pokémon to fuse.");
        return;
    }

    setIsGenerating(true);
    setAnimationPhase('generating');
    setError(null);
    setGeneratedPokemon(null);
    setCustomNickname('');

    try {
      // Deduct tokens first
      await updateTokens(-cost);

      let newPokemon: Pokemon;
      
      if (mode === 'standard') {
        newPokemon = await fetchRandomPokemon();
      } else if (mode === 'custom') {
        newPokemon = await generateAiPokemon(customPrompt);
        await savePrompt(customPrompt);
      } else if (mode === 'fusion') {
          const p1 = inventory.find(p => p.id === fusionParents[0]);
          const p2 = inventory.find(p => p.id === fusionParents[1]);
          if (!p1 || !p2) throw new Error("Parent pokemon not found");
          newPokemon = await generateFusionPokemon(p1, p2);
      } else if (mode === 'event') {
          newPokemon = await generateEventPokemon(season);
      } else {
        newPokemon = await generateAiPokemon();
      }
      
      // Legacy Chance (Only if Prestige > 0)
      if (user.prestige > 0 && Math.random() < 0.1) {
          newPokemon.isLegacy = true;
          newPokemon.stats = {
              hp: Math.floor(newPokemon.stats.hp * 1.2),
              attack: Math.floor(newPokemon.stats.attack * 1.2),
              defense: Math.floor(newPokemon.stats.defense * 1.2),
              speed: Math.floor(newPokemon.stats.speed * 1.2),
          };
      }

      // Simulate capture animation delay
      const delay = user.prestige > 2 ? 500 : 1500;
      
      setAnimationPhase('capturing');
      setTimeout(async () => {
         await addPokemon(newPokemon);
         setGeneratedPokemon(newPokemon);
         setAnimationPhase('revealed');
         setIsGenerating(false);
         // Reset selection
         if (mode === 'fusion') setFusionParents([null, null]);
      }, delay);
      
    } catch (err) {
      console.error(err);
      setError("Failed to summon Pokémon. Check connection or try again.");
      await updateTokens(cost); // Refund
      setIsGenerating(false);
      setAnimationPhase('idle');
    }
  };

  const handleNicknameSave = async (name: string) => {
      if (!generatedPokemon) return;
      const updated = { ...generatedPokemon, nickname: name };
      await updatePokemon(updated);
      setGeneratedPokemon(updated);
  };

  const SeasonIcon = {
    'Spring': Leaf,
    'Summer': Sun,
    'Autumn': CloudRain,
    'Winter': Snowflake
  }[season];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Genetic Lab</h2>
        <p className="text-slate-500 dark:text-slate-400">Synthesize new lifeforms using Tokens.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        <button 
            onClick={() => setMode('standard')}
            className={`flex-none w-32 flex flex-col items-center p-4 rounded-xl transition-all ${mode === 'standard' ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-primary shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
        >
            <Dna size={24} className="text-blue-400 mb-2" />
            <span className="font-bold text-slate-700 dark:text-white text-sm">Standard</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{COSTS.SUMMON_STANDARD} T</span>
        </button>

        <button 
            onClick={() => setMode('ai')}
            className={`flex-none w-32 flex flex-col items-center p-4 rounded-xl transition-all ${mode === 'ai' ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-pink-500 shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
        >
            <Sparkles size={24} className="text-pink-400 mb-2" />
            <span className="font-bold text-slate-700 dark:text-white text-sm">Random AI</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{COSTS.SUMMON_AI} T</span>
        </button>

        <button 
            onClick={() => setMode('custom')}
            className={`flex-none w-32 flex flex-col items-center p-4 rounded-xl transition-all ${mode === 'custom' ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-purple-500 shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
        >
            <Command size={24} className="text-purple-400 mb-2" />
            <span className="font-bold text-slate-700 dark:text-white text-sm">Custom AI</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{COSTS.SUMMON_CUSTOM} T</span>
        </button>

        <button 
            onClick={() => setMode('fusion')}
            className={`flex-none w-32 flex flex-col items-center p-4 rounded-xl transition-all ${mode === 'fusion' ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-orange-500 shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
        >
            <Zap size={24} className="text-orange-400 mb-2" />
            <span className="font-bold text-slate-700 dark:text-white text-sm">Fusion</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{COSTS.SUMMON_FUSION} T</span>
        </button>

        {activeEvent && (
            <button 
                onClick={() => setMode('event')}
                className={`flex-none w-32 flex flex-col items-center p-4 rounded-xl transition-all ${mode === 'event' ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-cyan-500 shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
            >
                <SeasonIcon size={24} className="text-cyan-400 mb-2" />
                <span className="font-bold text-slate-700 dark:text-white text-sm">{season} Event</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{COSTS.SUMMON_EVENT} T</span>
            </button>
        )}
      </div>

      {/* Action Area */}
      <div className="flex flex-col items-center justify-center py-4 min-h-[300px]">
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 w-full max-w-xl">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        {/* Custom Mode Input */}
        {mode === 'custom' && animationPhase === 'idle' && (
            <div className="w-full max-w-xl mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Describe your Genetic Code</label>
                    {(user.promptHistory?.length > 0) && (
                        <div className="relative group">
                            <button className="text-xs text-primary flex items-center gap-1 hover:underline">
                                <History size={12}/> History
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl hidden group-hover:block z-20 max-h-48 overflow-y-auto">
                                {user.promptHistory.map((p, i) => (
                                    <div key={i} onClick={() => setCustomPrompt(p)} className="p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer truncate border-b border-slate-100 dark:border-slate-700 last:border-0 text-slate-600 dark:text-slate-300">
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g., A mechanical dragon made of rusty gears that breathes steam..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[100px]"
                />
            </div>
        )}

        {/* Fusion Mode Input */}
        {mode === 'fusion' && animationPhase === 'idle' && (
            <div className="w-full max-w-xl mb-8">
                <div className="flex items-center justify-center gap-4">
                    {[0, 1].map((index) => {
                        const selectedId = fusionParents[index as 0 | 1];
                        const selectedMon = inventory.find(p => p.id === selectedId);
                        
                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div 
                                    onClick={() => setShowFusionSelector(index as 0 | 1)}
                                    className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${selectedMon ? 'border-orange-500 bg-orange-500/10' : 'border-slate-300 dark:border-slate-700'}`}
                                >
                                    {selectedMon ? (
                                        <img src={selectedMon.sprite} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <span className="text-4xl text-slate-300">+</span>
                                    )}
                                </div>
                                <span className="text-xs mt-2 text-slate-500 font-bold">{selectedMon ? selectedMon.name : `Parent ${index + 1}`}</span>
                            </div>
                        );
                    })}
                    <div className="text-orange-500 animate-pulse font-bold text-xl">=</div>
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-2 border-orange-500 bg-orange-500/5 flex items-center justify-center relative">
                        <Zap size={32} className="text-orange-400 opacity-50" />
                    </div>
                </div>
                
                <p className="text-center text-xs text-slate-500 mt-6">Select two distinct Pokémon to combine their traits.</p>
            </div>
        )}

        {/* Fusion Selector Modal */}
        {showFusionSelector !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[80vh] flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Select Parent {showFusionSelector + 1}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto flex-1 p-1">
                        {inventory.filter(p => !p.isArchived).map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => {
                                    const newParents = [...fusionParents] as [string | null, string | null];
                                    newParents[showFusionSelector] = p.id;
                                    setFusionParents(newParents);
                                    setShowFusionSelector(null);
                                }}
                                className={`p-2 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${fusionParents.includes(p.id) ? 'border-orange-500 bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'}`}
                            >
                                <img src={p.sprite} className="w-16 h-16 mx-auto object-contain" />
                                <p className="text-center text-xs font-bold truncate mt-1 dark:text-white">{p.name}</p>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" onClick={() => setShowFusionSelector(null)} className="mt-4">Cancel</Button>
                </div>
            </div>
        )}

        {/* Animation Container */}
        {(animationPhase === 'generating' || animationPhase === 'capturing') && (
             <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                 {/* Generating: Spin */}
                 {animationPhase === 'generating' && (
                     <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
                         mode === 'fusion' ? 'border-orange-500 border-r-orange-300 border-l-yellow-500' : 
                         mode === 'event' ? 'border-cyan-500 border-r-cyan-300 border-l-blue-500' :
                         'border-primary border-r-secondary border-l-purple-500'
                     }`}></div>
                 )}
                 {/* Capturing: Pulse/Ping */}
                 {animationPhase === 'capturing' && (
                     <>
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-50"></div>
                        <div className="relative w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                             <div className="w-8 h-8 bg-white rounded-full border-4 border-slate-900"></div>
                             <div className="absolute w-full h-2 bg-slate-900 top-1/2 -translate-y-1/2"></div>
                        </div>
                     </>
                 )}
             </div>
        )}

        {/* Idle State */}
        {animationPhase === 'idle' && (
            <div className="text-center space-y-4 w-full">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 relative`}>
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${
                        mode === 'fusion' ? 'bg-orange-500' : 
                        mode === 'event' ? 'bg-cyan-500' : 
                        mode !== 'standard' ? 'bg-pink-500' : 'bg-blue-500'
                    }`}></div>
                    <div className={`w-full h-full rounded-full border-4 flex items-center justify-center bg-white dark:bg-slate-800 z-10 ${
                        mode === 'fusion' ? 'border-orange-500' : 
                        mode === 'event' ? 'border-cyan-500' : 
                        mode !== 'standard' ? 'border-pink-500' : 'border-blue-500'
                    }`}>
                         {mode === 'event' ? <SeasonIcon size={40} className="text-cyan-500"/> : <span className="text-4xl text-slate-400">?</span>}
                    </div>
                </div>

                <Button 
                    onClick={handleSummon} 
                    className={`w-full sm:w-64 h-12 text-lg ${
                        mode === 'fusion' ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 border-none' :
                        mode === 'event' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-none' :
                        mode !== 'standard' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none' : ''
                    }`}
                >
                    {mode === 'fusion' ? 'Fuse DNA' : 'Summon'} ({getCost()} T)
                </Button>
                <p className="text-xs text-slate-500">
                    Current Balance: <span className={user.tokens < getCost() ? 'text-red-400' : 'text-accent'}>{user.tokens} Tokens</span>
                </p>
            </div>
        )}

        {/* Revealed State */}
        {animationPhase === 'revealed' && generatedPokemon && (
            <div className="w-full max-w-sm animate-[zoomIn_0.5s_ease-out]">
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Acquisition Successful!</h3>
                    <p className="text-green-500 dark:text-green-400 text-sm">New genetic data added to inventory.</p>
                </div>
                <PokemonCard pokemon={generatedPokemon} />
                
                {/* Nickname Selector */}
                {generatedPokemon.isAiGenerated && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mt-4 border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Give it a nickname?</label>
                        <div className="flex gap-2 flex-wrap mb-3">
                            {generatedPokemon.suggestedNicknames?.map(nick => (
                                <button 
                                    key={nick} 
                                    onClick={() => handleNicknameSave(nick)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${generatedPokemon.nickname === nick ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-primary'}`}
                                >
                                    {nick}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={customNickname}
                                onChange={(e) => setCustomNickname(e.target.value)}
                                placeholder="Or type custom..."
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1 text-xs"
                            />
                            <Button size="sm" onClick={() => handleNicknameSave(customNickname)} disabled={!customNickname}>Save</Button>
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-6">
                    <Button onClick={() => { setGeneratedPokemon(null); setAnimationPhase('idle'); }} variant="secondary">
                        Summon Another
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Generator;