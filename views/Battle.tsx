import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Pokemon, TurnLog } from '../types';
import { fetchRandomPokemon } from '../services/pokeApi';
import { calculateDamage, getEnemyAction } from '../services/battleLogic';
import { TYPE_COLORS, REWARDS } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { Sword, Shield, Zap, Skull, Trophy, RefreshCw } from 'lucide-react';

const Battle: React.FC = () => {
  const { user, inventory, updateTokens, updateStardust, addScore } = useGame();
  
  // States
  const [phase, setPhase] = useState<'select' | 'combat' | 'result'>('select');
  const [playerMon, setPlayerMon] = useState<Pokemon | null>(null);
  const [enemyMon, setEnemyMon] = useState<Pokemon | null>(null);
  const [combatLog, setCombatLog] = useState<TurnLog[]>([]);
  const [turn, setTurn] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | null>(null);

  // Battle specific stats (current HP)
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);

  // Initialize Enemy
  useEffect(() => {
    if (phase === 'select' && !enemyMon) {
        fetchRandomPokemon().then(p => {
            // Buff enemy slightly based on user level to make it challenging
            p.stats.hp = Math.floor(p.stats.hp * 1.1);
            setEnemyMon(p);
        });
    }
  }, [phase, enemyMon]);

  const startBattle = (pokemon: Pokemon) => {
    setPlayerMon(pokemon);
    setPlayerHp(pokemon.stats.hp);
    setEnemyHp(enemyMon!.stats.hp);
    setPhase('combat');
    setCombatLog([{ message: `Battle started! ${pokemon.name} vs ${enemyMon!.name}`, isPlayer: true }]);
    setTurn(1);
    
    // Determine first turn based on speed
    if (enemyMon!.stats.speed > pokemon.stats.speed) {
        setIsPlayerTurn(false);
        setTimeout(executeEnemyTurn, 1000);
    } else {
        setIsPlayerTurn(true);
    }
  };

  const executeTurn = (action: 'attack' | 'special' | 'heal', moveType?: string) => {
    if (!playerMon || !enemyMon || isProcessing) return;
    setIsProcessing(true);

    // Player Action
    let logMsg = "";
    if (action === 'heal') {
        const healAmount = Math.floor(playerMon.stats.hp * 0.5);
        setPlayerHp(prev => Math.min(playerMon.stats.hp, prev + healAmount));
        logMsg = `${playerMon.name} healed for ${healAmount} HP!`;
    } else {
        const { damage, effectiveness } = calculateDamage(playerMon, enemyMon, moveType);
        setEnemyHp(prev => Math.max(0, prev - damage));
        logMsg = `${playerMon.name} used ${action === 'special' ? moveType : 'Attack'}! It dealt ${damage} damage.`;
        if (effectiveness === 'super') logMsg += " It's super effective!";
        if (effectiveness === 'weak') logMsg += " It's not very effective...";
    }
    
    setCombatLog(prev => [{ message: logMsg, isPlayer: true }, ...prev]);

    // Check Win
    if (enemyHp <= 0) { // Note: This check uses state which might not be updated immediately in this closure, 
                        // but useEffect handles the end condition. We double check below.
    }

    // Switch turn
    setTimeout(() => {
       setIsPlayerTurn(false);
       setTimeout(executeEnemyTurn, 1000);
    }, 1000);
  };

  const executeEnemyTurn = () => {
    if (!playerMon || !enemyMon) return;

    // Check if enemy is dead already (from previous state update)
    // We handle this in useEffect, but to be safe:
    if (enemyHp <= 0) return;

    const { action, moveType } = getEnemyAction(enemyMon, playerMon);
    const { damage, effectiveness } = calculateDamage(enemyMon, playerMon, moveType);

    setPlayerHp(prev => Math.max(0, prev - damage));
    
    let logMsg = `${enemyMon.name} used ${action === 'special' ? moveType : 'Attack'}! It dealt ${damage} damage.`;
    if (effectiveness === 'super') logMsg += " It's super effective!";
    if (effectiveness === 'weak') logMsg += " It's not very effective...";

    setCombatLog(prev => [{ message: logMsg, isPlayer: false }, ...prev]);
    
    setTimeout(() => {
        setIsPlayerTurn(true);
        setIsProcessing(false);
        setTurn(prev => prev + 1);
    }, 500);
  };

  // Watch for end conditions
  useEffect(() => {
    if (phase !== 'combat') return;

    if (enemyHp <= 0) {
        setBattleResult('win');
        setPhase('result');
        handleWin();
    } else if (playerHp <= 0) {
        setBattleResult('lose');
        setPhase('result');
    }
  }, [playerHp, enemyHp, phase]);

  const handleWin = async () => {
    await updateStardust(REWARDS.BATTLE_WIN_STARDUST);
    // XP is just score for now
    await addScore(50);
  };

  const resetBattle = () => {
    setPlayerMon(null);
    setEnemyMon(null);
    setPhase('select');
    setBattleResult(null);
    setCombatLog([]);
  };

  // Renders
  if (phase === 'select') {
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <h2 className="text-3xl font-bold text-white mb-4">Battle Arena</h2>
            <p className="text-slate-400 mb-4">Select your champion to fight.</p>
            
            {!enemyMon ? (
                <div className="text-center py-10"><div className="animate-spin text-4xl">⚙️</div> Preparing opponent...</div>
            ) : (
                <div className="bg-slate-800 p-4 rounded-xl border border-red-900/50 mb-6 flex items-center gap-4">
                    <div className="bg-red-500/10 p-2 rounded-full"><Sword className="text-red-500"/></div>
                    <div>
                        <p className="text-xs text-red-400 uppercase font-bold">Opponent Found</p>
                        <h3 className="text-xl font-bold text-white">{enemyMon.name} (HP: {enemyMon.stats.hp})</h3>
                        <div className="flex gap-1 mt-1">
                             {enemyMon.types.map(t => <span key={t} className={`px-2 py-0.5 rounded text-[10px] uppercase text-white ${TYPE_COLORS[t] || 'bg-gray-500'}`}>{t}</span>)}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map(p => (
                    <div key={p.id} onClick={() => startBattle(p)} className="cursor-pointer transform hover:scale-105 transition-all">
                        <div className="pointer-events-none">
                            <PokemonCard pokemon={p} readonly />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  if (phase === 'result') {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-zoom-in">
             <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                {battleResult === 'win' ? (
                    <>
                        <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Victory!</h2>
                        <p className="text-slate-400 mb-6">Your {playerMon?.name} defeated {enemyMon?.name}.</p>
                        
                        <div className="flex justify-center gap-4 mb-8">
                             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-500">Stardust</span>
                                <span className="text-xl font-bold text-purple-400">+{REWARDS.BATTLE_WIN_STARDUST}</span>
                             </div>
                             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-500">Score XP</span>
                                <span className="text-xl font-bold text-secondary">+{REWARDS.BATTLE_WIN_XP}</span>
                             </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Skull size={64} className="text-slate-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-300 mb-2">Defeat</h2>
                        <p className="text-slate-500 mb-6">Your {playerMon?.name} fainted. No rewards gained.</p>
                    </>
                )}
                
                <Button onClick={resetBattle} className="w-full">Return to Arena</Button>
             </div>
        </div>
    );
  }

  // Combat Phase
  return (
    <div className="max-w-4xl mx-auto pb-20">
        {/* Battle Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                <span className="text-slate-400 text-xs font-bold uppercase">Turn {turn}</span>
            </div>
            <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={resetBattle}>Flee Battle</Button>
        </div>

        {/* Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Player */}
            <div className="order-2 md:order-1 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                    <img src={playerMon?.sprite} className="w-32 h-32 object-contain drop-shadow-2xl animate-bounce-slow" />
                    <h3 className="text-xl font-bold text-white mt-4">{playerMon?.name}</h3>
                    
                    {/* HP Bar */}
                    <div className="w-full bg-slate-900 h-4 rounded-full mt-2 overflow-hidden border border-slate-600">
                        <div 
                            className={`h-full transition-all duration-500 ${playerHp < playerMon!.stats.hp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${(playerHp / playerMon!.stats.hp) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{playerHp} / {playerMon!.stats.hp} HP</span>
                </div>
            </div>

            {/* Enemy */}
            <div className="order-1 md:order-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center">
                    <img src={enemyMon?.sprite} className="w-32 h-32 object-contain drop-shadow-2xl" />
                    <h3 className="text-xl font-bold text-white mt-4">{enemyMon?.name}</h3>
                    
                    {/* HP Bar */}
                    <div className="w-full bg-slate-900 h-4 rounded-full mt-2 overflow-hidden border border-slate-600">
                         <div 
                            className={`h-full transition-all duration-500 ${enemyHp < enemyMon!.stats.hp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${(enemyHp / enemyMon!.stats.hp) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{enemyHp} / {enemyMon!.stats.hp} HP</span>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-6">
            {isPlayerTurn ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button onClick={() => executeTurn('attack')} className="h-14 flex flex-col items-center justify-center">
                        <span className="font-bold">Attack</span>
                        <span className="text-[10px] opacity-70">Normal Dmg</span>
                    </Button>
                    
                    {playerMon?.types.map(t => (
                        <Button key={t} onClick={() => executeTurn('special', t)} className={`h-14 flex flex-col items-center justify-center ${TYPE_COLORS[t] || 'bg-slate-600'} border-none`}>
                            <span className="font-bold capitalize">{t} Strike</span>
                            <span className="text-[10px] opacity-90">Special</span>
                        </Button>
                    ))}
                    
                    <Button variant="secondary" onClick={() => executeTurn('heal')} className="h-14 flex flex-col items-center justify-center">
                        <span className="font-bold">Heal</span>
                        <span className="text-[10px] opacity-70">50% HP</span>
                    </Button>
                </div>
            ) : (
                <div className="text-center py-4 text-slate-400 animate-pulse">
                    Enemy is thinking...
                </div>
            )}
        </div>

        {/* Log */}
        <div className="bg-slate-900 p-4 rounded-xl h-40 overflow-y-auto border border-slate-800 space-y-2">
            {combatLog.map((log, i) => (
                <div key={i} className={`text-sm ${log.isPlayer ? 'text-blue-300' : 'text-red-300'}`}>
                    <span className="opacity-50 text-xs mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log.message}
                </div>
            ))}
        </div>
    </div>
  );
};

export default Battle;