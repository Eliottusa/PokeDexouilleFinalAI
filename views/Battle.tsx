import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Pokemon, TurnLog, StatusCondition, Weather, BattleBuffs } from '../types';
import { fetchRandomPokemon } from '../services/pokeApi';
import { calculateDamage, getEnemyAction, processStatusEffect, getPredictedDamage } from '../services/battleLogic';
import { TYPE_COLORS, STATUS_COLORS, REWARDS, BATTLE_DIFFICULTIES, ITEMS, RELICS } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { Sword, Trophy, Skull, Zap, Briefcase, X, CloudRain, Sun, Cloud, Wind, Crosshair } from 'lucide-react';

interface ActiveEntity {
    pokemon: Pokemon;
    hp: number;
    maxHp: number;
    status: StatusCondition;
    buffs: BattleBuffs;
    isPlayer: boolean;
    slotId: number; // 0 or 1
}

const Battle: React.FC = () => {
  const { user, inventory, updateTokens, updateStardust, gainXp, playAudio, social, clearRivalBattle, useItem, updatePokemon } = useGame();
  
  // Game State
  const [phase, setPhase] = useState<'difficulty' | 'select' | 'combat' | 'result'>('difficulty');
  const [difficulty, setDifficulty] = useState(BATTLE_DIFFICULTIES.NORMAL);
  const [combatLog, setCombatLog] = useState<TurnLog[]>([]);
  const [turn, setTurn] = useState(0);
  const [weather, setWeather] = useState<Weather>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleResult, setBattleResult] = useState<'win' | 'lose' | null>(null);
  
  // Entities
  const [playerTeam, setPlayerTeam] = useState<ActiveEntity[]>([]);
  const [enemyTeam, setEnemyTeam] = useState<ActiveEntity[]>([]);
  
  // Selection
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  
  // Combat UI
  const [showBag, setShowBag] = useState(false);
  const [targetingMode, setTargetingMode] = useState<{ move: string, isSpecial: boolean } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [combatLog]);

  // Initial Rival Check
  useEffect(() => {
    if (social.rivalBattle) {
        setDifficulty(BATTLE_DIFFICULTIES.HARD);
        // Rivals use hard mode
        initEnemyTeam(1, social.rivalBattle.pokemon);
        setPhase('select');
    }
  }, [social.rivalBattle]);

  // Random Weather on Battle Start
  useEffect(() => {
      if (phase === 'combat') {
          if (Math.random() < 0.3) {
              const weathers: Weather[] = ['rain', 'sun', 'sandstorm'];
              setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
          } else {
              setWeather('none');
          }
      }
  }, [phase]);

  // Helper to init entities
  const createEntity = (p: Pokemon, isPlayer: boolean, slot: number): ActiveEntity => ({
      pokemon: p,
      hp: p.stats.hp,
      maxHp: p.stats.hp,
      status: p.status || 'none',
      buffs: { attack: 0, defense: 0, speed: 0, accuracy: 0 },
      isPlayer,
      slotId: slot
  });

  const initEnemyTeam = async (count: number, rivalMon?: Pokemon) => {
      const enemies: ActiveEntity[] = [];
      if (rivalMon) {
          enemies.push(createEntity(rivalMon, false, 0));
      } else {
          const p1 = await fetchRandomPokemon();
          boostStats(p1);
          enemies.push(createEntity(p1, false, 0));
          if (count > 1) {
              const p2 = await fetchRandomPokemon();
              boostStats(p2);
              enemies.push(createEntity(p2, false, 1));
          }
      }
      setEnemyTeam(enemies);
  };

  const boostStats = (p: Pokemon) => {
      p.stats.hp = Math.floor(p.stats.hp * difficulty.multiplier);
      p.stats.attack = Math.floor(p.stats.attack * difficulty.multiplier);
      p.stats.defense = Math.floor(p.stats.defense * difficulty.multiplier);
      p.stats.speed = Math.floor(p.stats.speed * difficulty.multiplier);
  };

  const selectDifficulty = (diff: typeof BATTLE_DIFFICULTIES.NORMAL) => {
      setDifficulty(diff);
      const enemyCount = diff.id === 'double' ? 2 : 1;
      initEnemyTeam(enemyCount);
      setPhase('select');
      setSelectedPlayerIds([]);
  };

  const toggleSelectPokemon = (id: string) => {
      const limit = difficulty.id === 'double' ? 2 : 1;
      if (selectedPlayerIds.includes(id)) {
          setSelectedPlayerIds(prev => prev.filter(pid => pid !== id));
      } else {
          if (selectedPlayerIds.length < limit) {
              setSelectedPlayerIds(prev => [...prev, id]);
          }
      }
  };

  const confirmSelection = () => {
      const selectedMons = inventory.filter(p => selectedPlayerIds.includes(p.id));
      const entities = selectedMons.map((p, i) => createEntity(p, true, i));
      
      // Handle speed boost items like Quick Claw at start
      entities.forEach(e => {
          if (e.pokemon.heldItem === 'quick_claw') e.buffs.speed += 1;
      });
      
      setPlayerTeam(entities);
      setPhase('combat');
      setCombatLog([{ message: `Battle Started! Mode: ${difficulty.label}`, isPlayer: true }]);
      setTurn(1);
      
      if (difficulty.id === 'hard' || social.rivalBattle) playAudio('battle-start-hard');
      else playAudio('battle-start');

      // Check speed for first turn
      const allEntities = [...entities, ...enemyTeam];
      allEntities.sort((a, b) => b.pokemon.stats.speed - a.pokemon.stats.speed);
      
      if (!allEntities[0].isPlayer) {
          setIsProcessing(true);
          setTimeout(processEnemyTurn, 1000);
      }
  };

  // --- Battle Logic ---

  const processEnemyTurn = async () => {
      // Simple logic: Each living enemy attacks a living player
      // We process all enemies at once for simplicity in this turn-based structure
      // Ideally this would be a queue, but "Simulated" allows grouping.
      
      const livingEnemies = enemyTeam.filter(e => e.hp > 0);
      const livingPlayers = playerTeam.filter(e => e.hp > 0);

      if (livingPlayers.length === 0) return; // End game handled by effect

      const newLog = [...combatLog];
      let playerUpdates = [...playerTeam]; // Clone

      for (const enemy of livingEnemies) {
          // Check status
          const { canMove, message, damage } = processStatusEffect({ ...enemy.pokemon, status: enemy.status });
          if (damage > 0) {
              setEnemyTeam(prev => prev.map(e => e.slotId === enemy.slotId ? { ...e, hp: Math.max(0, e.hp - damage) } : e));
          }
          if (message) newLog.push({ message, isPlayer: false });
          
          if (!canMove) continue;

          // Pick target (Random living player)
          const targetIndex = Math.floor(Math.random() * livingPlayers.length);
          const target = livingPlayers[targetIndex]; // This is a ref to the initial state, we need to update 'playerUpdates'
          const actualTargetIndex = playerUpdates.findIndex(p => p.slotId === target.slotId);
          
          if (playerUpdates[actualTargetIndex].hp <= 0) continue; // Already dead from previous enemy

          // AI Action
          const context = { weather, attackerBuffs: enemy.buffs, defenderBuffs: target.buffs };
          const { action, moveType } = getEnemyAction(enemy.pokemon, target.pokemon, enemy.hp, target.hp, context);
          
          // Calculate Damage
          playAudio('attack');
          const { damage: dmg, isCritical, isMiss } = calculateDamage(enemy.pokemon, target.pokemon, moveType, context);

          if (isMiss) {
              newLog.push({ message: `${enemy.pokemon.name} missed!`, isPlayer: false });
          } else {
              let finalDmg = dmg;
              // Endure check (Friendship)
              if (target.hp - dmg <= 0 && target.pokemon.friendship > 50 && Math.random() < (target.pokemon.friendship / 500)) {
                  finalDmg = target.hp - 1;
                  newLog.push({ message: `${target.pokemon.name} endured the hit!`, isPlayer: true });
              }

              playerUpdates[actualTargetIndex] = {
                  ...playerUpdates[actualTargetIndex],
                  hp: Math.max(0, playerUpdates[actualTargetIndex].hp - finalDmg)
              };

              // Status application chance
              if (moveType && ['fire','ice','electric','poison'].includes(moveType) && playerUpdates[actualTargetIndex].status === 'none' && Math.random() < 0.2) {
                  let status: StatusCondition = 'none';
                  if (moveType === 'fire') status = 'burn';
                  if (moveType === 'ice') status = 'freeze';
                  if (moveType === 'electric') status = 'paralysis';
                  if (moveType === 'poison') status = 'poison';
                  
                  playerUpdates[actualTargetIndex].status = status;
                  newLog.push({ message: `${target.pokemon.name} was ${status}ed!`, isPlayer: false });
              }

              newLog.push({ 
                  message: `${enemy.pokemon.name} used ${moveType || 'Attack'}! ${finalDmg} dmg${isCritical ? ' (CRIT)' : ''}`, 
                  isPlayer: false 
              });
          }
      }

      setCombatLog(newLog);
      setPlayerTeam(playerUpdates);
      
      await checkWinCondition(playerUpdates, enemyTeam);
      
      setIsProcessing(false);
      setTurn(t => t + 1);
  };

  const handlePlayerAttack = async (attackerSlot: number, moveType: string | undefined, targetSlot: number) => {
      setTargetingMode(null);
      setIsProcessing(true);

      const attacker = playerTeam.find(p => p.slotId === attackerSlot);
      const target = enemyTeam.find(e => e.slotId === targetSlot);

      if (!attacker || !target) { setIsProcessing(false); return; }

      const newLog = [...combatLog];
      let enemyUpdates = [...enemyTeam];

      // Status Check
      const { canMove, message, damage } = processStatusEffect({ ...attacker.pokemon, status: attacker.status });
      if (damage > 0) {
          setPlayerTeam(prev => prev.map(p => p.slotId === attackerSlot ? { ...p, hp: Math.max(0, p.hp - damage) } : p));
      }
      if (message) newLog.push({ message, isPlayer: true });

      if (canMove) {
          playAudio('attack');
          const context = { weather, attackerBuffs: attacker.buffs, defenderBuffs: target.buffs };
          const { damage: dmg, isCritical, isMiss, effectiveness } = calculateDamage(attacker.pokemon, target.pokemon, moveType, context);

          if (isMiss) {
              newLog.push({ message: `${attacker.pokemon.name} missed!`, isPlayer: true });
          } else {
              const targetIdx = enemyUpdates.findIndex(e => e.slotId === targetSlot);
              enemyUpdates[targetIdx] = {
                  ...enemyUpdates[targetIdx],
                  hp: Math.max(0, enemyUpdates[targetIdx].hp - dmg)
              };

              // Status Chance
              if (moveType && ['fire','ice','electric','poison'].includes(moveType) && enemyUpdates[targetIdx].status === 'none' && Math.random() < 0.2) {
                  let status: StatusCondition = 'none';
                  if (moveType === 'fire') status = 'burn';
                  if (moveType === 'ice') status = 'freeze';
                  if (moveType === 'electric') status = 'paralysis';
                  if (moveType === 'poison') status = 'poison';
                  
                  enemyUpdates[targetIdx].status = status;
                  newLog.push({ message: `Enemy ${target.pokemon.name} is ${status}!`, isPlayer: true });
              }

              let effText = '';
              if (effectiveness === 'super') effText = ' It\'s super effective!';
              if (effectiveness === 'weak') effText = ' It\'s not very effective...';

              newLog.push({ 
                  message: `${attacker.pokemon.name} used ${moveType || 'Attack'}! ${dmg} dmg.${isCritical ? ' Critical Hit!' : ''}${effText}`, 
                  isPlayer: true 
              });
          }
      }

      setCombatLog(newLog);
      setEnemyTeam(enemyUpdates);

      // Check if all enemies dead, if so win immediately
      const livingEnemies = enemyUpdates.filter(e => e.hp > 0);
      if (livingEnemies.length === 0) {
          setBattleResult('win');
          setPhase('result');
          playAudio('win');
          handleWin(playerTeam); // Pass current team state
          return;
      }

      // If Double battle, logic for 2nd player pokemon could go here if we want strictly ordered turns
      // For simplified "Player Turn" -> "Enemy Turn", we can allow the player to attack with all active mons?
      // Let's stick to: One action per turn for 1v1. For 2v2, let's say all players act then all enemies act.
      // To make it fair: Player can act with ONE pokemon, then ALL enemies act? Unfair.
      // Compromise: Player acts with ONE pokemon. Then ALL enemies act.
      
      setTimeout(processEnemyTurn, 1000);
  };

  const handleUseItem = async (itemId: string) => {
      const item = ITEMS[itemId];
      if (!item) return;

      // Find first living player (simplified item usage)
      const target = playerTeam.find(p => p.hp > 0);
      if (!target) return;

      await useItem(itemId, target.pokemon.id);
      
      const newLog = [...combatLog];
      let updatedTeam = [...playerTeam];
      const idx = updatedTeam.findIndex(p => p.slotId === target.slotId);

      if (item.effect === 'heal') {
          updatedTeam[idx].hp = Math.min(updatedTeam[idx].maxHp, updatedTeam[idx].hp + item.value);
          newLog.push({ message: `Used ${item.name} on ${target.pokemon.name}. Healed ${item.value}.`, isPlayer: true });
      } else if (item.effect === 'status_heal') {
          updatedTeam[idx].status = 'none';
          newLog.push({ message: `Used ${item.name}. ${target.pokemon.name} is cured.`, isPlayer: true });
      } else if (item.effect === 'boost' && item.stat) {
          updatedTeam[idx].buffs[item.stat] += item.value;
          newLog.push({ message: `Used ${item.name}. ${target.pokemon.name}'s ${item.stat} rose!`, isPlayer: true });
      }

      setPlayerTeam(updatedTeam);
      setCombatLog(newLog);
      setShowBag(false);
      setIsProcessing(true);
      setTimeout(processEnemyTurn, 1000);
  };

  const checkWinCondition = async (pTeam: ActiveEntity[], eTeam: ActiveEntity[]) => {
      const pAlive = pTeam.some(p => p.hp > 0);
      const eAlive = eTeam.some(e => e.hp > 0);

      if (!eAlive) {
          setBattleResult('win');
          setPhase('result');
          playAudio('win');
          await handleWin(pTeam);
      } else if (!pAlive) {
          setBattleResult('lose');
          setPhase('result');
          playAudio('lose');
          await handleLoss();
      }
  };

  const handleWin = async (finalTeam: ActiveEntity[]) => {
    const mult = difficulty.rewardMult;
    await updateStardust(Math.floor(REWARDS.BATTLE_WIN_STARDUST * mult));
    await updateTokens(Math.floor(REWARDS.BATTLE_WIN_TOKENS * mult));
    await gainXp(Math.floor(REWARDS.BATTLE_WIN_XP * mult));
    
    // Update stats for all participants
    for (const entity of finalTeam) {
        const p = entity.pokemon;
        const newFriendship = Math.min(255, (p.friendship || 0) + 2);
        const wins = (p.battlesWon || 0) + 1;
        const history = [...(p.history || []), `Won ${difficulty.label} battle on ${new Date().toLocaleDateString()}`];
        await updatePokemon({ ...p, friendship: newFriendship, battlesWon: wins, history });
    }
  };

  const handleLoss = async () => {
    if (user.tokens >= REWARDS.BATTLE_LOSS_TOKENS) {
        await updateTokens(-REWARDS.BATTLE_LOSS_TOKENS);
    }
  };

  const resetBattle = () => {
    setPlayerTeam([]);
    setEnemyTeam([]);
    setPhase('difficulty');
    setBattleResult(null);
    setCombatLog([]);
    setTargetingMode(null);
    setWeather('none');
    playAudio('click');
    if (social.rivalBattle) {
        clearRivalBattle();
    }
  };

  // Render Helpers
  const WeatherIcon = () => {
      switch(weather) {
          case 'rain': return <CloudRain className="text-blue-400" />;
          case 'sun': return <Sun className="text-yellow-400" />;
          case 'sandstorm': return <Wind className="text-orange-400" />;
          default: return <Cloud className="text-slate-600" />;
      }
  };

  const ActiveCard = ({ entity, isOpponent }: { entity: ActiveEntity, isOpponent: boolean }) => {
      const isTargetable = targetingMode && isOpponent && entity.hp > 0;
      
      // Find active player for damage calc preview
      const activePlayer = playerTeam.find(p => p.hp > 0); 
      let prediction = null;
      if (isTargetable && activePlayer) {
          const context = { weather, attackerBuffs: activePlayer.buffs, defenderBuffs: entity.buffs };
          prediction = getPredictedDamage(activePlayer.pokemon, entity.pokemon, targetingMode.move, context);
      }

      return (
          <div 
            onClick={() => isTargetable && activePlayer && handlePlayerAttack(activePlayer.slotId, targetingMode.move, entity.slotId)}
            className={`relative bg-white dark:bg-slate-800 p-3 rounded-xl border-2 transition-all ${
              entity.hp === 0 ? 'opacity-50 grayscale' : ''
            } ${
              isTargetable 
                ? 'border-red-500 cursor-crosshair scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
              {prediction && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                      {prediction.min}-{prediction.max} Dmg ({prediction.effectiveness})
                  </div>
              )}

              <div className="flex items-center gap-3">
                  <img src={entity.pokemon.sprite} className={`w-16 h-16 object-contain ${entity.hp > 0 ? 'animate-bounce-slow' : ''}`} />
                  <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm truncate text-slate-800 dark:text-white">{entity.pokemon.name}</h4>
                          {entity.status !== 'none' && (
                              <span className={`text-[10px] font-bold uppercase ${STATUS_COLORS[entity.status]}`}>{entity.status}</span>
                          )}
                      </div>
                      
                      {/* HP Bar */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-1 overflow-hidden">
                          <div 
                              className={`h-full transition-all duration-500 ${entity.hp < entity.maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`} 
                              style={{ width: `${(entity.hp / entity.maxHp) * 100}%` }}
                          ></div>
                      </div>
                      <p className="text-xs text-slate-500 text-right mt-0.5">{entity.hp}/{entity.maxHp}</p>
                      
                      {/* Buffs Display */}
                      <div className="flex gap-1 mt-1">
                          {entity.buffs.attack > 0 && <span className="text-[10px] text-red-400">Atk+{entity.buffs.attack}</span>}
                          {entity.buffs.defense > 0 && <span className="text-[10px] text-blue-400">Def+{entity.buffs.defense}</span>}
                          {entity.buffs.speed > 0 && <span className="text-[10px] text-green-400">Spd+{entity.buffs.speed}</span>}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  // --- Views ---

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
                            diff.id === 'double' ? 'border-purple-500 bg-purple-500/10 hover:bg-purple-500/20' :
                            'border-red-500 bg-red-500/10 hover:bg-red-500/20'
                        }`}
                    >
                        <div className="text-left">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                {diff.id === 'hard' && <Skull size={20} className="text-red-400"/>}
                                {diff.id === 'double' && <Zap size={20} className="text-purple-400"/>}
                                {diff.label}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {diff.id === 'double' ? '2v2 Tag Battle' : `Enemy Stats: ${Math.round(diff.multiplier * 100)}%`}
                            </p>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">Rewards</div>
                             <div className="text-2xl font-bold text-slate-800 dark:text-white">{diff.rewardMult}x</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
  }

  if (phase === 'select') {
      const limit = difficulty.id === 'double' ? 2 : 1;
      return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Select {limit} Champion{limit > 1 ? 's' : ''}</h2>
                     <p className="text-slate-500 dark:text-slate-400 text-sm">Opponents: {enemyTeam.length}</p>
                </div>
                {selectedPlayerIds.length === limit && (
                    <Button onClick={confirmSelection} className="animate-bounce">Start Battle</Button>
                )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {inventory.filter(p => !p.isArchived).map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => toggleSelectPokemon(p.id)} 
                        className={`cursor-pointer transform transition-all rounded-xl border-4 overflow-hidden ${selectedPlayerIds.includes(p.id) ? 'border-primary scale-95 opacity-100' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    >
                        <div className="pointer-events-none">
                            <PokemonCard pokemon={p} readonly />
                        </div>
                        {selectedPlayerIds.includes(p.id) && (
                            <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1"><X size={16}/></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      );
  }

  if (phase === 'result') {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] animate-zoom-in">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center max-w-md w-full">
                {battleResult === 'win' ? (
                    <>
                        <Trophy size={64} className="text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Victory!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">You defeated the enemy team.</p>
                    </>
                ) : (
                    <>
                        <Skull size={64} className="text-slate-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-slate-300 mb-2">Defeat</h2>
                        <p className="text-slate-500 mb-6">Your team fainted.</p>
                    </>
                )}
                <Button onClick={resetBattle} className="w-full">Return to Arena</Button>
             </div>
        </div>
    );
  }

  // Combat Phase
  const activePlayer = playerTeam.find(p => p.hp > 0);

  return (
    <div className="max-w-4xl mx-auto pb-24 relative">
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4">
                 <div className="bg-white dark:bg-slate-800 px-3 py-1 rounded text-xs font-bold border border-slate-300 dark:border-slate-600">
                    Turn {turn}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                    <WeatherIcon /> {weather === 'none' ? 'Clear' : weather}
                </div>
            </div>
            <Button variant="ghost" className="text-red-400 hover:text-red-300 text-xs" onClick={resetBattle}>Flee</Button>
        </div>

        {/* Battlefield */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Enemy Side */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Enemy Team</h3>
                <div className="grid grid-cols-1 gap-2">
                    {enemyTeam.map(e => <ActiveCard key={e.slotId} entity={e} isOpponent={true} />)}
                </div>
            </div>

            {/* Player Side */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Your Team</h3>
                <div className="grid grid-cols-1 gap-2">
                    {playerTeam.map(e => <ActiveCard key={e.slotId} entity={e} isOpponent={false} />)}
                </div>
            </div>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 z-40">
            <div className="max-w-4xl mx-auto">
                {targetingMode ? (
                    <div className="text-center py-4">
                        <p className="text-slate-800 dark:text-white font-bold animate-pulse mb-2">Select a Target</p>
                        <Button variant="ghost" onClick={() => setTargetingMode(null)}>Cancel</Button>
                    </div>
                ) : showBag ? (
                    <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-slate-800 dark:text-white">Bag</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowBag(false)}><X size={16}/></Button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {Object.entries(user.items || {}).map(([itemId, count]) => {
                                 if (count <= 0) return null;
                                 const item = ITEMS[itemId];
                                 return (
                                     <button key={itemId} onClick={() => handleUseItem(itemId)} className="flex-none w-32 p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-left hover:border-primary">
                                         <span className="text-xl block mb-1">{item.icon}</span>
                                         <div className="font-bold text-xs dark:text-white truncate">{item.name}</div>
                                         <div className="text-[10px] text-slate-500">x{count}</div>
                                     </button>
                                 );
                            })}
                        </div>
                    </div>
                ) : activePlayer ? (
                    <div className="grid grid-cols-4 gap-2">
                        <Button 
                            onClick={() => setTargetingMode({ move: 'normal', isSpecial: false })} 
                            className="h-14 flex flex-col items-center justify-center bg-slate-700 hover:bg-slate-600"
                        >
                            <span className="font-bold">Attack</span>
                        </Button>
                        
                        {activePlayer.pokemon.types.map(t => (
                            <Button 
                                key={t} 
                                onClick={() => setTargetingMode({ move: t, isSpecial: true })} 
                                className={`h-14 flex flex-col items-center justify-center ${TYPE_COLORS[t] || 'bg-slate-600'} border-none`}
                            >
                                <span className="font-bold capitalize">{t}</span>
                            </Button>
                        ))}
                        
                        <Button variant="secondary" onClick={() => setShowBag(true)} className="h-14 flex flex-col items-center justify-center">
                            <Briefcase size={20} className="mb-1" />
                            <span className="text-[10px] opacity-70">Bag</span>
                        </Button>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-4">All your Pokémon have fainted.</div>
                )}
            </div>
        </div>

        {/* Combat Log Overlay */}
        <div ref={scrollRef} className="fixed bottom-24 right-4 w-64 max-h-32 overflow-y-auto bg-black/50 backdrop-blur-sm text-white p-2 rounded text-xs pointer-events-none z-30">
            {combatLog.slice(-5).map((log, i) => (
                <div key={i} className={`mb-1 ${log.isPlayer ? 'text-blue-200' : 'text-red-200'}`}>
                    {log.message}
                </div>
            ))}
        </div>
    </div>
  );
};

export default Battle;