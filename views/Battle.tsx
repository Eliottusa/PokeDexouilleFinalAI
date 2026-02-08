import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Pokemon, TurnLog, StatusCondition } from '../types';
import { fetchRandomPokemon } from '../services/pokeApi';
import { calculateDamage, getEnemyAction, processStatusEffect } from '../services/battleLogic';
import { TYPE_COLORS, STATUS_COLORS, REWARDS, BATTLE_DIFFICULTIES, ITEMS } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { Sword, Trophy, Skull, Zap, Briefcase, X } from 'lucide-react';

const Battle: React.FC = () => {
  const { user, inventory, updateTokens, updateStardust, gainXp, playAudio, social, clearRivalBattle, useItem, updatePokemon } = useGame();
  
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
  const [showBag, setShowBag] = useState(false);

  // Battle specific stats
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  
  // Temporary battle status (not saved to DB unless item used/battle ends)
  const [playerStatus, setPlayerStatus] = useState<StatusCondition>('none');
  const [enemyStatus, setEnemyStatus] = useState<StatusCondition>('none');

  // Initialization logic...
  useEffect(() => {
    if (social.rivalBattle) {
        setDifficulty(BATTLE_DIFFICULTIES.HARD);
        // Rivals have better moves/stats
        setEnemyMon({
            ...social.rivalBattle.pokemon,
            status: 'none'
        });
        setPhase('select');
    }
  }, [social.rivalBattle]);

  useEffect(() => {
    if (phase === 'select' && !enemyMon) {
        fetchRandomPokemon().then(p => {
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
    setPlayerStatus(pokemon.status || 'none'); // Inherit status? Usually fresh battle resets status unless persistent RPG. Let's make it persistent later, for now fresh.
    
    setEnemyHp(enemyMon!.stats.hp);
    setEnemyStatus('none');
    
    setPhase('combat');
    setCombatLog([{ message: `Battle started!`, isPlayer: true }]);
    setTurn(1);
    
    if (difficulty.id === 'hard' || social.rivalBattle) playAudio('battle-start-hard');
    else playAudio('battle-start');
    
    if (enemyMon!.stats.speed > pokemon.stats.speed) {
        setIsPlayerTurn(false);
        setTimeout(executeEnemyTurn, 1000);
    } else {
        setIsPlayerTurn(true);
    }
  };

  const applyStatusDamage = async (isPlayer: boolean) => {
     // End of Turn Status Effects
     const mon = isPlayer ? { ...playerMon!, stats: { ...playerMon!.stats, hp: playerHp }, status: playerStatus } : { ...enemyMon!, stats: { ...enemyMon!.stats, hp: enemyHp }, status: enemyStatus };
     const { damage, message } = processStatusEffect(mon);
     
     if (damage > 0 || message) {
         if (message) setCombatLog(prev => [{ message, isPlayer }, ...prev]);
         if (damage > 0) {
             if (isPlayer) setPlayerHp(prev => Math.max(0, prev - damage));
             else setEnemyHp(prev => Math.max(0, prev - damage));
         }
         await new Promise(r => setTimeout(r, 800));
     }
  };

  const handleUseItem = async (itemId: string) => {
      if (!playerMon) return;
      const success = await useItem(itemId, playerMon.id);
      if (!success) return;

      const item = ITEMS[itemId];
      let msg = `Used ${item.name}!`;

      if (item.effect === 'heal') {
          const healAmount = item.value;
          setPlayerHp(prev => Math.min(playerMon.stats.hp, prev + healAmount));
          msg += ` Healed ${healAmount} HP.`;
      } else if (item.effect === 'status_heal') {
          setPlayerStatus('none');
          msg += ` Status cured.`;
      }
      
      setCombatLog(prev => [{ message: msg, isPlayer: true }, ...prev]);
      setShowBag(false);
      setIsPlayerTurn(false);
      setTimeout(executeEnemyTurn, 1000);
  };

  const executeTurn = async (action: 'attack' | 'special' | 'heal', moveType?: string) => {
    if (!playerMon || !enemyMon || isProcessing) return;
    setIsProcessing(true);
    
    // 1. Check Status (Paralysis/Sleep/Freeze)
    const { canMove, message } = processStatusEffect({ ...playerMon, status: playerStatus });
    if (!canMove) {
        setCombatLog(prev => [{ message: message, isPlayer: true }, ...prev]);
        setIsPlayerTurn(false);
        setTimeout(executeEnemyTurn, 1000);
        return;
    }
    if (message && canMove) setCombatLog(prev => [{ message, isPlayer: true }, ...prev]); // e.g. thawed

    playAudio('attack');

    // Player Action
    if (action === 'heal') {
        // Innate heal ability (removed/nerfed if using items?) - Let's keep for strategy
        const healAmount = Math.floor(playerMon.stats.hp * 0.3); // Nerfed to 30%
        setPlayerHp(prev => Math.min(playerMon.stats.hp, prev + healAmount));
        setCombatLog(prev => [{ message: `${playerMon.name} focused... Healed ${healAmount} HP!`, isPlayer: true }, ...prev]);
    } else {
        const { damage, effectiveness, isCritical, isMiss } = calculateDamage({ ...playerMon, status: playerStatus }, { ...enemyMon, status: enemyStatus }, moveType);
        
        if (isMiss) {
            setCombatLog(prev => [{ message: `${playerMon.name} missed!`, isPlayer: true }, ...prev]);
        } else {
            setEnemyHp(prev => Math.max(0, prev - damage));
            
            // Chance to apply status if special move?
            // Simple logic: 10% chance to burn with fire, etc.
            let statusMsg = '';
            if (moveType === 'fire' && enemyStatus === 'none' && Math.random() < 0.2) {
                setEnemyStatus('burn');
                statusMsg = ' Enemy was burned!';
            } else if (moveType === 'electric' && enemyStatus === 'none' && Math.random() < 0.2) {
                setEnemyStatus('paralysis');
                statusMsg = ' Enemy was paralyzed!';
            } else if (moveType === 'ice' && enemyStatus === 'none' && Math.random() < 0.1) {
                setEnemyStatus('freeze');
                statusMsg = ' Enemy froze solid!';
            }

            let logMsg = `${playerMon.name} used ${moveType || 'Attack'}! ${damage} dmg.`;
            if (isCritical) logMsg += " CRIT!";
            if (effectiveness === 'super') logMsg += " Super effective!";
            if (effectiveness === 'weak') logMsg += " Not effective.";
            logMsg += statusMsg;
            setCombatLog(prev => [{ message: logMsg, isPlayer: true }, ...prev]);
        }
    }
    
    await applyStatusDamage(true); // Player takes burn damage etc at end of THEIR turn usually? Or end of round. Let's do end of action for simplicity.

    setTimeout(() => {
       setIsPlayerTurn(false);
       setTimeout(executeEnemyTurn, 1000);
    }, 1000);
  };

  const executeEnemyTurn = async () => {
    if (!playerMon || !enemyMon) return;
    if (enemyHp <= 0) return; // Dead enemy can't attack

    const { canMove, message } = processStatusEffect({ ...enemyMon, status: enemyStatus });
    if (!canMove) {
        setCombatLog(prev => [{ message: message, isPlayer: false }, ...prev]);
        setIsPlayerTurn(true);
        setIsProcessing(false);
        setTurn(prev => prev + 1);
        return;
    }

    playAudio('attack');

    const { action, moveType } = getEnemyAction(enemyMon, playerMon);
    const { damage, effectiveness, isCritical, isMiss } = calculateDamage({ ...enemyMon, status: enemyStatus }, { ...playerMon, status: playerStatus }, moveType);

    if (isMiss) {
        setCombatLog(prev => [{ message: `${enemyMon!.name} missed!`, isPlayer: false }, ...prev]);
    } else {
        // Friendship Survival Mechanic
        let finalDamage = damage;
        let survived = false;
        if (playerHp - damage <= 0 && playerMon.friendship > 50 && Math.random() < (playerMon.friendship / 500)) { // Max 50% chance at 250 friendship
             finalDamage = playerHp - 1;
             survived = true;
        }

        setPlayerHp(prev => Math.max(0, prev - finalDamage));
        
        // Enemy Status Application
        let statusMsg = '';
        if (moveType && ['fire', 'electric', 'poison', 'ice'].includes(moveType) && playerStatus === 'none' && Math.random() < 0.2) {
             if (moveType === 'fire') { setPlayerStatus('burn'); statusMsg = ' You were burned!'; }
             if (moveType === 'electric') { setPlayerStatus('paralysis'); statusMsg = ' You were paralyzed!'; }
             if (moveType === 'poison') { setPlayerStatus('poison'); statusMsg = ' You were poisoned!'; }
             if (moveType === 'ice') { setPlayerStatus('freeze'); statusMsg = ' You froze!'; }
        }

        let logMsg = `${enemyMon.name} used ${moveType || 'Attack'}! ${finalDamage} dmg.`;
        if (isCritical) logMsg += " CRIT!";
        if (survived) logMsg += " Endured the hit!";
        logMsg += statusMsg;

        setCombatLog(prev => [{ message: logMsg, isPlayer: false }, ...prev]);
    }
    
    await applyStatusDamage(false);

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
    await gainXp(Math.floor(REWARDS.BATTLE_WIN_XP * mult));
    
    // Friendship Gain
    if (playerMon) {
        const newFriendship = Math.min(255, (playerMon.friendship || 0) + 2);
        await updatePokemon({ ...playerMon, friendship: newFriendship });
    }
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

  // 1. Difficulty Phase
  if (phase === 'difficulty') {
      return (
        <div className="max-w-xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Battle Simulation</h2>
                <p className="text-slate-500 dark:text-slate-400">Choose your risk level.</p>
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
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                {diff.id === 'hard' && <Skull size={20} className="text-red-400"/>}
                                {diff.label}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Enemy Stats: {Math.round(diff.multiplier * 100)}%</p>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">Rewards</div>
                             <div className={`text-2xl font-bold ${
                                 diff.id === 'hard' ? 'text-accent' : 'text-slate-800 dark:text-white'
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
                     <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Select Champion</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Mode: {difficulty.label} ({difficulty.rewardMult}x Rewards)</p>
                </div>
            </div>
            
            {!enemyMon ? (
                <div className="text-center py-10"><div className="animate-spin text-4xl">⚙️</div> Preparing opponent...</div>
            ) : (
                <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl border ${social.rivalBattle ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-red-200 dark:border-red-900/50'} mb-6 flex items-center gap-4`}>
                    <div className="bg-red-500/10 p-2 rounded-full"><Sword className="text-red-500"/></div>
                    <div>
                        <p className="text-xs text-red-400 uppercase font-bold">{social.rivalBattle ? `RIVAL: ${social.rivalBattle.trainerName}` : 'Opponent Found'}</p>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{enemyMon.name} (HP: {enemyMon.stats.hp})</h3>
                        <div className="flex gap-1 mt-1">
                             {enemyMon.types.map(t => <span key={t} className={`px-2 py-0.5 rounded text-[10px] uppercase text-white ${TYPE_COLORS[t] || 'bg-gray-500'}`}>{t}</span>)}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.filter(p => !p.isArchived).map(p => (
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
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center max-w-md w-full">
                {battleResult === 'win' ? (
                    <>
                        <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Victory!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Your {playerMon?.name} defeated {enemyMon?.name}.</p>
                    </>
                ) : (
                    <>
                        <Skull size={64} className="text-slate-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-300 mb-2">Defeat</h2>
                        <p className="text-slate-500 mb-6">Your {playerMon?.name} fainted.</p>
                    </>
                )}
                
                <Button onClick={resetBattle} className="w-full">Return to Arena</Button>
             </div>
        </div>
    );
  }

  // 4. Combat Phase
  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
        {/* Battle Header */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                 <div className="bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase">Turn {turn}</span>
                </div>
                {(difficulty.id === 'hard' || social.rivalBattle) && <span className="text-red-500 text-xs font-bold border border-red-500 px-2 py-1 rounded">HIGH STAKES</span>}
            </div>
            
            <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={resetBattle}>Flee Battle</Button>
        </div>

        {/* Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Player */}
            <div className="order-2 md:order-1 bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden shadow-sm">
                <div className="relative z-10 flex flex-col items-center">
                    <img src={playerMon?.sprite} className={`w-32 h-32 object-contain drop-shadow-2xl animate-bounce-slow ${playerStatus !== 'none' ? 'opacity-80 grayscale-[0.3]' : ''}`} />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-4">{playerMon?.name}</h3>
                    
                    {/* Status Icon */}
                    {playerStatus !== 'none' && (
                        <div className={`text-xs font-bold uppercase ${STATUS_COLORS[playerStatus]} mt-1`}>
                            {playerStatus}
                        </div>
                    )}

                    {/* HP Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-900 h-4 rounded-full mt-2 overflow-hidden border border-slate-300 dark:border-slate-600">
                        <div 
                            className={`h-full transition-all duration-500 ${playerHp < playerMon!.stats.hp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${(playerHp / playerMon!.stats.hp) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{playerHp} / {playerMon!.stats.hp} HP</span>
                </div>
            </div>

            {/* Enemy */}
            <div className="order-1 md:order-2 bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden shadow-sm">
                <div className="relative z-10 flex flex-col items-center">
                    <img src={enemyMon?.sprite} className={`w-32 h-32 object-contain drop-shadow-2xl ${enemyStatus !== 'none' ? 'opacity-80 grayscale-[0.3]' : ''}`} />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-4">{enemyMon?.name}</h3>
                    
                    {/* Status Icon */}
                    {enemyStatus !== 'none' && (
                        <div className={`text-xs font-bold uppercase ${STATUS_COLORS[enemyStatus]} mt-1`}>
                            {enemyStatus}
                        </div>
                    )}

                    {/* HP Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-900 h-4 rounded-full mt-2 overflow-hidden border border-slate-300 dark:border-slate-600">
                         <div 
                            className={`h-full transition-all duration-500 ${enemyHp < enemyMon!.stats.hp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${(enemyHp / enemyMon!.stats.hp) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{enemyHp} / {enemyMon!.stats.hp} HP</span>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm relative overflow-hidden">
            {showBag && (
                <div className="absolute inset-0 bg-white dark:bg-slate-800 z-20 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg dark:text-white">Inventory</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowBag(false)}><X size={16}/></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                        {Object.entries(user.items || {}).map(([itemId, count]) => {
                             if (count <= 0) return null;
                             const item = ITEMS[itemId];
                             return (
                                 <button key={itemId} onClick={() => handleUseItem(itemId)} className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-left">
                                     <span className="text-xl">{item.icon}</span>
                                     <div className="flex-1">
                                         <div className="font-bold text-sm dark:text-white">{item.name}</div>
                                         <div className="text-xs text-slate-500">{item.description}</div>
                                     </div>
                                     <span className="font-mono text-sm dark:text-white">x{count}</span>
                                 </button>
                             );
                        })}
                        {Object.values(user.items || {}).every(c => c <= 0) && <p className="col-span-2 text-center text-slate-500">Your bag is empty.</p>}
                    </div>
                </div>
            )}
            
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
                    
                    <Button variant="secondary" onClick={() => setShowBag(true)} className="h-14 flex flex-col items-center justify-center">
                        <Briefcase size={20} className="mb-1" />
                        <span className="text-[10px] opacity-70">Bag</span>
                    </Button>
                </div>
            ) : (
                <div className="text-center py-4 text-slate-400 animate-pulse">
                    Enemy is thinking...
                </div>
            )}
        </div>

        {/* Log */}
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 space-y-2">
            {combatLog.map((log, i) => (
                <div key={i} className={`text-sm ${log.isPlayer ? 'text-blue-600 dark:text-blue-300' : 'text-red-600 dark:text-red-300'}`}>
                    <span className="opacity-50 text-xs mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log.message}
                </div>
            ))}
        </div>
    </div>
  );
};

export default Battle;