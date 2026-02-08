import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Pokemon, TurnLog } from '../types';
import { fetchRandomPokemon } from '../services/pokeApi';
import { calculateDamage, getEnemyAction } from '../services/battleLogic';
import { TYPE_COLORS, REWARDS, BATTLE_DIFFICULTIES } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { Sword, Trophy, Skull, Gauge, Zap } from 'lucide-react';

const Battle: React.FC = () => {
  const { user, inventory, updateTokens, updateStardust, addScore, playAudio, social, clearRivalBattle } = useGame();
  
  // States
  const [phase, setPhase] = useState<'difficulty' | 'select' | 'combat' | 'result'>('difficulty');
  const [difficulty, setDifficulty] = useState(BATTLE_DIFFICULTIES.NORMAL);
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

  // Check for Rival Battle on Mount
  useEffect(() => {
    if (social.rivalBattle) {
        // Bypass difficulty selection for rival battles
        setDifficulty(BATTLE_DIFFICULTIES.HARD);
        setEnemyMon(social.rivalBattle.pokemon);
        setPhase('select');
    }
  }, [social.rivalBattle]);

  // Initialize Random Enemy (if not rival)
  useEffect(() => {
    if (phase === 'select' && !enemyMon) {
        fetchRandomPokemon().then(p => {
            // Apply Difficulty Multiplier to Stats
            p.stats.hp = Math.floor(p.stats.hp * difficulty.multiplier);
            p.stats.attack = Math.floor(p.stats.attack * difficulty.multiplier);
            p.stats.defense = Math.floor(p.stats.defense * difficulty.multiplier);
            p.stats.speed = Math.floor(p.stats.speed * difficulty.multiplier);
            setEnemyMon(p);
        });
    }
  }, [phase, enemyMon, difficulty]);

  const selectDifficulty = (diff: typeof BATTLE_DIFFICULTIES.NORMAL) => {
      setDifficulty(diff);
      setPhase('select');
  };

  const startBattle = (pokemon: Pokemon) => {
    setPlayerMon(pokemon);
    setPlayerHp(pokemon.stats.hp);
    setEnemyHp(enemyMon!.stats.hp);
    setPhase('combat');
    
    const opponentName = social.rivalBattle ? social.rivalBattle.trainerName : enemyMon!.name;
    const msg = social.rivalBattle 
        ? `RIVAL BATTLE! You are challenged by ${opponentName}!`
        : `Battle started! ${pokemon.name} vs ${enemyMon!.name} (${difficulty.label})`;

    setCombatLog([{ message: msg, isPlayer: true }]);
    setTurn(1);
    
    // Play sound based on difficulty or rival
    if (difficulty.id === 'hard' || social.rivalBattle) {
        playAudio('battle-start-hard');
    } else {
        playAudio('battle-start');
    }
    
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
    playAudio('attack');

    // Player Action
    let logMsg = "";
    if (action === 'heal') {
        const healAmount = Math.floor(playerMon.stats.hp * 0.5);
        setPlayerHp(prev => Math.min(playerMon.stats.hp, prev + healAmount));
        logMsg = `${playerMon.name} healed for ${healAmount} HP!`;
    } else {
        const { damage, effectiveness, isCritical, isMiss } = calculateDamage(playerMon, enemyMon, moveType);
        
        if (isMiss) {
            logMsg = `${playerMon.name} tried to attack but MISSED!`;
        } else {
            setEnemyHp(prev => Math.max(0, prev - damage));
            logMsg = `${playerMon.name} used ${action === 'special' ? moveType : 'Attack'}! Dealt ${damage} damage.`;
            if (isCritical) logMsg += " CRITICAL HIT!";
            if (effectiveness === 'super') logMsg += " It's super effective!";
            if (effectiveness === 'weak') logMsg += " It's not very effective...";
        }
    }
    
    setCombatLog(prev => [{ message: logMsg, isPlayer: true }, ...prev]);

    setTimeout(() => {
       setIsPlayerTurn(false);
       setTimeout(executeEnemyTurn, 1000);
    }, 1000);
  };

  const executeEnemyTurn = () => {
    if (!playerMon || !enemyMon) return;
    if (enemyHp <= 0) return;
    playAudio('attack');

    const { action, moveType } = getEnemyAction(enemyMon, playerMon);
    const { damage, effectiveness, isCritical, isMiss } = calculateDamage(enemyMon, playerMon, moveType);

    if (isMiss) {
        setCombatLog(prev => [{ message: `${enemyMon!.name} tried to attack but MISSED!`, isPlayer: false }, ...prev]);
    } else {
        setPlayerHp(prev => Math.max(0, prev - damage));
        
        let logMsg = `${enemyMon.name} used ${action === 'special' ? moveType : 'Attack'}! Dealt ${damage} damage.`;
        if (isCritical) logMsg += " CRITICAL HIT!";
        if (effectiveness === 'super') logMsg += " It's super effective!";
        if (effectiveness === 'weak') logMsg += " It's not very effective...";

        setCombatLog(prev => [{ message: logMsg, isPlayer: false }, ...prev]);
    }
    
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
        playAudio('win');
        handleWin();
    } else if (playerHp <= 0) {
        setBattleResult('lose');
        setPhase('result');
        playAudio('lose');
        handleLoss();
    }
  }, [playerHp, enemyHp, phase]);

  const handleWin = async () => {
    const mult = difficulty.rewardMult;
    await updateStardust(Math.floor(REWARDS.BATTLE_WIN_STARDUST * mult));
    await updateTokens(Math.floor(REWARDS.BATTLE_WIN_TOKENS * mult));
    await addScore(Math.floor(REWARDS.BATTLE_WIN_XP * mult));
  };

  const handleLoss = async () => {
    if (user.tokens >= REWARDS.BATTLE_LOSS_TOKENS) {
        await updateTokens(-REWARDS.BATTLE_LOSS_TOKENS);
    }
  };

  const resetBattle = () => {
    setPlayerMon(null);
    setEnemyMon(null);
    setPhase('difficulty');
    setBattleResult(null);
    setCombatLog([]);
    playAudio('click');
    if (social.rivalBattle) {
        clearRivalBattle();
    }
  };

  // Renders
  
  // 1. Difficulty Phase
  if (phase === 'difficulty') {
      return (
        <div className="max-w-xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Battle Simulation</h2>
                <p className="text-slate-400">Choose your risk level.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {Object.values(BATTLE_DIFFICULTIES).map((diff) => (
                    <button 
                        key={diff.id}
                        onClick={() => selectDifficulty(diff)}
                        className={`p-6 rounded-xl border-2 flex items-center justify-between transition-all hover:scale-105 group ${
                            diff.id === 'easy' ? 'border-green-500 bg-green-500/10 hover:bg-green-500/20' :
                            diff.id === 'normal' ? 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20' :
                            'border-red-500 bg-red-500/10 hover:bg-red-500/20'
                        }`}
                    >
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                {diff.id === 'hard' && <Skull size={20} className="text-red-400"/>}
                                {diff.label}
                            </h3>
                            <p className="text-sm text-slate-400">Enemy Stats: {Math.round(diff.multiplier * 100)}%</p>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-slate-300 uppercase">Rewards</div>
                             <div className={`text-2xl font-bold ${
                                 diff.id === 'hard' ? 'text-accent' : 'text-white'
                             }`}>
                                 {diff.rewardMult}x
                             </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
  }

  // 2. Selection Phase
  if (phase === 'select') {
    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center gap-4">
                {!social.rivalBattle && <Button onClick={() => setPhase('difficulty')} variant="ghost" className="text-slate-400">Back</Button>}
                <div>
                     <h2 className="text-3xl font-bold text-white">Select Champion</h2>
                     <p className="text-slate-400 text-sm">Mode: {difficulty.label} ({difficulty.rewardMult}x Rewards)</p>
                </div>
            </div>
            
            {!enemyMon ? (
                <div className="text-center py-10"><div className="animate-spin text-4xl">⚙️</div> Preparing opponent...</div>
            ) : (
                <div className={`bg-slate-800 p-4 rounded-xl border ${social.rivalBattle ? 'border-red-500 bg-red-900/20' : 'border-red-900/50'} mb-6 flex items-center gap-4`}>
                    <div className="bg-red-500/10 p-2 rounded-full"><Sword className="text-red-500"/></div>
                    <div>
                        <p className="text-xs text-red-400 uppercase font-bold">{social.rivalBattle ? `RIVAL: ${social.rivalBattle.trainerName}` : 'Opponent Found'}</p>
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

  // 3. Result Phase
  if (phase === 'result') {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-zoom-in">
             <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                {battleResult === 'win' ? (
                    <>
                        <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white mb-2">Victory!</h2>
                        <p className="text-slate-400 mb-6">Your {playerMon?.name} defeated {enemyMon?.name}.</p>
                        
                        <div className="grid grid-cols-3 gap-2 mb-8">
                             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-500">Stardust</span>
                                <span className="text-xl font-bold text-purple-400">+{Math.floor(REWARDS.BATTLE_WIN_STARDUST * difficulty.rewardMult)}</span>
                             </div>
                             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-500">Tokens</span>
                                <span className="text-xl font-bold text-accent">+{Math.floor(REWARDS.BATTLE_WIN_TOKENS * difficulty.rewardMult)}</span>
                             </div>
                             <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                                <span className="block text-xs text-slate-500">XP</span>
                                <span className="text-xl font-bold text-secondary">+{Math.floor(REWARDS.BATTLE_WIN_XP * difficulty.rewardMult)}</span>
                             </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Skull size={64} className="text-slate-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-300 mb-2">Defeat</h2>
                        <p className="text-slate-500 mb-6">
                            Your {playerMon?.name} fainted.
                            {user.tokens >= REWARDS.BATTLE_LOSS_TOKENS && (
                                <span className="block text-red-400 mt-2">-{REWARDS.BATTLE_LOSS_TOKENS} Tokens lost.</span>
                            )}
                        </p>
                    </>
                )}
                
                <Button onClick={resetBattle} className="w-full">Return to Arena</Button>
             </div>
        </div>
    );
  }

  // 4. Combat Phase
  return (
    <div className="max-w-4xl mx-auto pb-20">
        {/* Battle Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                 <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
                    <span className="text-slate-400 text-xs font-bold uppercase">Turn {turn}</span>
                </div>
                {(difficulty.id === 'hard' || social.rivalBattle) && <span className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded">HIGH STAKES</span>}
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
                    <p className="text-xs text-red-400 font-bold uppercase tracking-wide">{social.rivalBattle ? `Rival ${social.rivalBattle.trainerName}` : 'Wild Pokémon'}</p>
                    
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