import { Pokemon, TurnLog, StatusCondition, Weather, BattleBuffs } from '../types';
import { TYPE_CHART, RELICS } from '../constants';

interface DamageContext {
  weather?: Weather;
  attackerBuffs?: BattleBuffs;
  defenderBuffs?: BattleBuffs;
}

export const getEffectiveness = (moveType: string, defenderTypes: string[]): number => {
    let multiplier = 1;
    const moveTypeLower = moveType.toLowerCase();
    const strongAgainst = TYPE_CHART[moveTypeLower] || [];
    
    // Super effective check
    const isSuperEffective = defenderTypes.some(t => strongAgainst.includes(t.toLowerCase()));
    if (isSuperEffective) multiplier *= 2;

    // Resistance check
    const isResistant = defenderTypes.some(dt => {
        const defenderStrongAgainst = TYPE_CHART[dt.toLowerCase()] || [];
        return defenderStrongAgainst.includes(moveTypeLower);
    });
    if (isResistant) multiplier *= 0.5;

    return multiplier;
};

export const calculateDamage = (
    attacker: Pokemon, 
    defender: Pokemon, 
    moveType: string = 'normal', 
    context: DamageContext = {}
): { damage: number, effectiveness: string, isCritical: boolean, isMiss: boolean } => {
  const { weather = 'none', attackerBuffs, defenderBuffs } = context;

  // 1. Accuracy Check (5% miss chance base)
  let missChance = 0.05;
  if (attackerBuffs) missChance -= (attackerBuffs.accuracy || 0) * 0.05; // Each stage improves acc by 5%
  
  // Speed check for evasion-like logic logic
  const attackerSpeed = getEffectiveStat(attacker, 'speed', weather, attackerBuffs);
  const defenderSpeed = getEffectiveStat(defender, 'speed', weather, defenderBuffs);

  if (defenderSpeed > attackerSpeed * 1.2) missChance += 0.1; // Evasion bonus if much faster
  
  // Always hit if not combat logic
  if (Math.random() < Math.max(0, missChance)) {
      return { damage: 0, effectiveness: 'normal', isCritical: false, isMiss: true };
  }

  const power = moveType === 'normal' ? 40 : 75; // Simplified power
  
  let attackStat = getEffectiveStat(attacker, 'attack', weather, attackerBuffs);
  let defenseStat = getEffectiveStat(defender, 'defense', weather, defenderBuffs);

  // Status Modifiers
  if (attacker.status === 'burn') attackStat *= 0.5;

  // Weather Modifiers for Type
  let weatherMod = 1;
  if (weather === 'rain') {
      if (moveType === 'water') weatherMod = 1.5;
      if (moveType === 'fire') weatherMod = 0.5;
  } else if (weather === 'sun') {
      if (moveType === 'fire') weatherMod = 1.5;
      if (moveType === 'water') weatherMod = 0.5;
  }

  const rawDamage = (attackStat / defenseStat) * power * weatherMod;
  
  // Type Effectiveness
  const typeMult = getEffectiveness(moveType, defender.types);
  let effectiveness = 'normal';
  if (typeMult > 1) effectiveness = 'super';
  if (typeMult < 1) effectiveness = 'weak';

  // Critical Hit
  let critChance = 0.06;
  const attackerRelic = attacker.heldItem ? RELICS[attacker.heldItem] : null;
  if (attackerRelic?.id === 'scope_lens' && attackerRelic.value) critChance += attackerRelic.value;
  
  const isCritical = Math.random() < critChance;
  const critMult = isCritical ? 1.5 : 1;

  const variance = (Math.random() * 0.15) + 0.85; // 0.85 to 1.00
  const totalDamage = Math.floor(rawDamage * typeMult * critMult * variance);
  
  return { 
    damage: Math.max(1, totalDamage), 
    effectiveness,
    isCritical,
    isMiss: false
  };
};

// Helper to calculate stat with buffs/relics/weather
const getEffectiveStat = (pokemon: Pokemon, stat: 'attack' | 'defense' | 'speed', weather: Weather, buffs?: BattleBuffs): number => {
    let value = pokemon.stats[stat];
    
    // Relic
    const relic = pokemon.heldItem ? RELICS[pokemon.heldItem] : null;
    if (relic && relic.effect === 'stat_boost' && relic.stat === stat) {
        value *= (1 + relic.value);
    }

    // Weather
    if (weather === 'sandstorm' && stat === 'defense' && pokemon.types.includes('rock')) {
        value *= 1.5;
    }
    if (weather === 'rain' && stat === 'speed' && pokemon.types.includes('water')) {
       // Swift Swim simulation
       value *= 2; 
    }

    // Status
    if (stat === 'speed' && pokemon.status === 'paralysis') {
        value *= 0.5;
    }

    // Buffs (-6 to +6 stages) - Simplified: each stage is +50% of base
    if (buffs) {
        const stage = buffs[stat] || 0;
        if (stage > 0) value *= (1 + 0.5 * stage);
        else if (stage < 0) value /= (1 + 0.5 * Math.abs(stage));
    }

    return Math.floor(value);
};

export const getPredictedDamage = (attacker: Pokemon, defender: Pokemon, moveType: string, context: DamageContext): { min: number, max: number, effectiveness: string } => {
    // Run simplified calc without RNG
    // We reuse calculateDamage logic but control variance and crit
    // This is a rough estimation for UI
    
    const power = moveType === 'normal' ? 40 : 75;
    let attackStat = getEffectiveStat(attacker, 'attack', context.weather || 'none', context.attackerBuffs);
    let defenseStat = getEffectiveStat(defender, 'defense', context.weather || 'none', context.defenderBuffs);
    
    if (attacker.status === 'burn') attackStat *= 0.5;

    let weatherMod = 1;
    if (context.weather === 'rain') {
      if (moveType === 'water') weatherMod = 1.5;
      if (moveType === 'fire') weatherMod = 0.5;
    } else if (context.weather === 'sun') {
      if (moveType === 'fire') weatherMod = 1.5;
      if (moveType === 'water') weatherMod = 0.5;
    }

    const raw = (attackStat / defenseStat) * power * weatherMod;
    const typeMult = getEffectiveness(moveType, defender.types);
    
    const effectiveness = typeMult > 1 ? 'super' : typeMult < 1 ? 'weak' : 'normal';

    const min = Math.floor(raw * typeMult * 0.85);
    const max = Math.floor(raw * typeMult * 1.0);

    return { min, max, effectiveness };
};

export const getEnemyAction = (
    enemy: Pokemon, 
    player: Pokemon, 
    currentHp: number, 
    playerHp: number,
    context: DamageContext = {}
): { action: 'attack' | 'special', moveType?: string } => {
  
  // Smart AI Logic
  
  // 1. Survival: If HP is low (< 20%), small chance to defend/stall? (Not implemented, AI is aggressive)
  
  // 2. Kill confirm: Check if any move kills
  const possibleMoves = ['normal', ...enemy.types];
  let bestMove = 'normal';
  let maxDamage = 0;

  for (const move of possibleMoves) {
      const pred = getPredictedDamage(enemy, player, move, { 
          weather: context.weather, 
          attackerBuffs: context.defenderBuffs, // Enemy is attacker here (defender in context)
          defenderBuffs: context.attackerBuffs 
      });
      // Prefer max potential
      if (pred.max > maxDamage) {
          maxDamage = pred.max;
          bestMove = move;
      }
  }

  // 3. Selection
  if (bestMove !== 'normal') {
      return { action: 'special', moveType: bestMove };
  }
  
  return { action: 'attack' };
};

export const processStatusEffect = (pokemon: Pokemon): { damage: number, canMove: boolean, message: string } => {
    let damage = 0;
    let canMove = true;
    let message = '';

    switch (pokemon.status) {
        case 'burn':
            damage = Math.floor(pokemon.stats.hp / 8);
            message = `${pokemon.name} is hurt by its burn!`;
            break;
        case 'poison':
            damage = Math.floor(pokemon.stats.hp / 8);
            message = `${pokemon.name} is hurt by poison!`;
            break;
        case 'paralysis':
            if (Math.random() < 0.25) {
                canMove = false;
                message = `${pokemon.name} is paralyzed! It can't move!`;
            }
            break;
        case 'sleep':
            if (Math.random() < 0.33) {
                 message = `${pokemon.name} woke up!`;
            } else {
                canMove = false;
                message = `${pokemon.name} is fast asleep.`;
            }
            break;
        case 'freeze':
            if (Math.random() < 0.2) {
                message = `${pokemon.name} thawed out!`;
            } else {
                canMove = false;
                message = `${pokemon.name} is frozen solid!`;
            }
            break;
    }

    return { damage, canMove, message };
};