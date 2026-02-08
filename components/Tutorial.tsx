import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import Button from './Button';
import { Zap, List, Sword, ShoppingBag, ArrowRight, Check } from 'lucide-react';

const Tutorial: React.FC = () => {
  const { completeTutorial } = useGame();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to PokéGen Dex!",
      desc: "An AI-powered RPG where you collect, battle, and trade unique Pokémon.",
      icon: <span className="text-4xl">👋</span>
    },
    {
      title: "Genetic Lab",
      desc: "Use Tokens to summon standard Pokémon or generate completely unique ones using AI.",
      icon: <Zap size={48} className="text-accent" />
    },
    {
      title: "Pokédex Management",
      desc: "View your collection, evolve duplicates, and equip Relics to boost stats.",
      icon: <List size={48} className="text-primary" />
    },
    {
      title: "Battle Arena",
      desc: "Fight wild Pokémon or Rivals to earn XP and Stardust. Use strategy and type advantages!",
      icon: <Sword size={48} className="text-red-500" />
    },
    {
      title: "Marketplace",
      desc: "Buy items, relics, and rare Pokémon. Watch out for market trends!",
      icon: <ShoppingBag size={48} className="text-purple-500" />
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      completeTutorial();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800">
            <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
        </div>

        <div className="p-8 text-center flex flex-col items-center min-h-[300px]">
            <div className="mb-6 bg-slate-100 dark:bg-slate-800 p-6 rounded-full shadow-inner animate-bounce-slow">
                {steps[step].icon}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{steps[step].title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                {steps[step].desc}
            </p>

            <div className="mt-auto w-full">
                <Button onClick={handleNext} className="w-full flex items-center justify-center gap-2 py-3 text-lg">
                    {step === steps.length - 1 ? (
                        <>Get Started <Check size={20}/></>
                    ) : (
                        <>Next <ArrowRight size={20}/></>
                    )}
                </Button>
            </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-950 p-3 text-center">
            <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                    ></div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;