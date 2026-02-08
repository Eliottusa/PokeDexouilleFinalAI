import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSTS } from '../constants';
import { fetchRandomPokemon } from '../services/pokeApi';
import { generateAiPokemon } from '../services/geminiService';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { Pokemon } from '../types';
import { Dna, Sparkles, AlertCircle, Command } from 'lucide-react';

const Generator: React.FC = () => {
  const { user, updateTokens, addPokemon } = useGame();
  const [generatedPokemon, setGeneratedPokemon] = useState<Pokemon | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'generating' | 'capturing' | 'revealed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'standard' | 'ai' | 'custom'>('standard');
  const [customPrompt, setCustomPrompt] = useState('');

  const getCost = () => {
    if (mode === 'standard') return COSTS.SUMMON_STANDARD;
    if (mode === 'ai') return COSTS.SUMMON_AI;
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

    setIsGenerating(true);
    setAnimationPhase('generating');
    setError(null);
    setGeneratedPokemon(null);

    try {
      // Deduct tokens first
      await updateTokens(-cost);

      let newPokemon: Pokemon;
      if (mode === 'standard') {
        newPokemon = await fetchRandomPokemon();
      } else {
        newPokemon = await generateAiPokemon(mode === 'custom' ? customPrompt : undefined);
      }
      
      // Simulate capture animation delay
      setAnimationPhase('capturing');
      setTimeout(async () => {
         await addPokemon(newPokemon);
         setGeneratedPokemon(newPokemon);
         setAnimationPhase('revealed');
         setIsGenerating(false);
      }, 1500);
      
    } catch (err) {
      console.error(err);
      setError("Failed to summon Pokémon. Check connection or try again.");
      await updateTokens(cost); // Refund
      setIsGenerating(false);
      setAnimationPhase('idle');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Genetic Lab</h2>
        <p className="text-slate-400">Synthesize new lifeforms using Tokens.</p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-800 p-2 rounded-xl border border-slate-700">
        <button 
            onClick={() => setMode('standard')}
            className={`flex flex-col items-center p-4 rounded-lg transition-all ${mode === 'standard' ? 'bg-slate-700 ring-2 ring-primary shadow-lg' : 'hover:bg-slate-750'}`}
        >
            <Dna size={24} className="text-blue-400 mb-2" />
            <span className="font-bold text-white text-sm">Standard</span>
            <span className="text-xs text-slate-400 mt-1">{COSTS.SUMMON_STANDARD} T</span>
        </button>

        <button 
            onClick={() => setMode('ai')}
            className={`flex flex-col items-center p-4 rounded-lg transition-all ${mode === 'ai' ? 'bg-slate-700 ring-2 ring-pink-500 shadow-lg' : 'hover:bg-slate-750'}`}
        >
            <Sparkles size={24} className="text-pink-400 mb-2" />
            <span className="font-bold text-white text-sm">Random AI</span>
            <span className="text-xs text-slate-400 mt-1">{COSTS.SUMMON_AI} T</span>
        </button>

        <button 
            onClick={() => setMode('custom')}
            className={`flex flex-col items-center p-4 rounded-lg transition-all ${mode === 'custom' ? 'bg-slate-700 ring-2 ring-purple-500 shadow-lg' : 'hover:bg-slate-750'}`}
        >
            <Command size={24} className="text-purple-400 mb-2" />
            <span className="font-bold text-white text-sm">Custom AI</span>
            <span className="text-xs text-slate-400 mt-1">{COSTS.SUMMON_CUSTOM} T</span>
        </button>
      </div>

      {/* Action Area */}
      <div className="flex flex-col items-center justify-center py-4 min-h-[300px]">
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 w-full">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        {mode === 'custom' && animationPhase === 'idle' && (
            <div className="w-full mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Describe your Genetic Code</label>
                <textarea 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g., A mechanical dragon made of rusty gears that breathes steam..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none min-h-[100px]"
                />
            </div>
        )}

        {/* Animation Container */}
        {(animationPhase === 'generating' || animationPhase === 'capturing') && (
             <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                 {/* Generating: Spin */}
                 {animationPhase === 'generating' && (
                     <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-secondary border-b-accent border-l-purple-500 animate-spin"></div>
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
                    <div className={`absolute inset-0 rounded-full blur-xl opacity-20 ${mode !== 'standard' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                    <div className={`w-full h-full rounded-full border-4 flex items-center justify-center bg-slate-800 z-10 ${mode !== 'standard' ? 'border-pink-500' : 'border-blue-500'}`}>
                         <span className="text-4xl">?</span>
                    </div>
                </div>

                <Button 
                    onClick={handleSummon} 
                    className={`w-full sm:w-64 h-12 text-lg ${mode !== 'standard' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-none' : ''}`}
                >
                    Summon ({getCost()} T)
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
                    <h3 className="text-2xl font-bold text-white mb-1">Acquisition Successful!</h3>
                    <p className="text-green-400 text-sm">New genetic data added to inventory.</p>
                </div>
                <PokemonCard pokemon={generatedPokemon} />
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