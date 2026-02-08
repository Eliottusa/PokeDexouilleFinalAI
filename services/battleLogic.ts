import { Pokemon, TurnLog } from '../types';
import { TYPE_CHART } from '../constants';

export const calculateDamage = (attacker: Pokemon, defender: Pokemon, moveType?: string): { damage: number, effectiveness: string, isCritical: boolean, isMiss: boolean } => {
  // 1. Check for Miss (5% chance)
  // Speed difference affects miss chance slightly
  let missChance = 0.05;
  if (defender.stats.speed > attacker.stats.speed) {
      missChance += 0.05; // 10% miss if enemy is faster
  }
  
  if (Math.random() < missChance) {
      return { damage: 0, effectiveness: 'normal', isCritical: false, isMiss: true };
  }

  // Base power for standard attack is 40, Special (typed) is 75
  const power = moveType ? 75 : 40;
  
  // Basic formula: (Attack / Defense) * Power
  const rawDamage = (attacker.stats.attack / defender.stats.defense) * power;
  
  let multiplier = 1;
  let effectiveness = 'normal';

  // Type effectiveness check
  if (moveType) {
    const moveTypeLower = moveType.toLowerCase();
    
    // Check Strong Against
    const strongAgainst = TYPE_CHART[moveTypeLower] || [];
    const isSuperEffective = defender.types.some(t => strongAgainst.includes(t.toLowerCase()));

    if (isSuperEffective) {
      multiplier = 2;
      effectiveness = 'super';
    } else {
        // Simple resistance logic: if the defender type is strong against the move type, it resists
        const isResistant = defender.types.some(dt => {
            const defenderStrongAgainst = TYPE_CHART[dt.toLowerCase()] || [];
            return defenderStrongAgainst.includes(moveTypeLower);
        });

        if (isResistant) {
            multiplier = 0.5;
            effectiveness = 'weak';
        }
    }
  }

  // Critical Hit Check (10% chance)
  const isCritical = Math.random() < 0.1;
  if (isCritical) {
      multiplier *= 1.5;
  }

  // Random variance (0.85 to 1.0)
  const variance = (Math.random() * 0.15) + 0.85;
  
  const totalDamage = Math.floor(rawDamage * multiplier * variance);
  
  // Ensure at least 1 damage
  return { 
    damage: Math.max(1, totalDamage), 
    effectiveness,
    isCritical,
    isMiss: false
  };
};

export const getEnemyAction = (enemy: Pokemon, player: Pokemon): { action: 'attack' | 'special', moveType?: string } => {
  // Simple AI: 30% chance to use special move if it has a type
  const useSpecial = Math.random() > 0.7 && enemy.types.length > 0;
  
  if (useSpecial) {
    return { action: 'special', moveType: enemy.types[0] };
  }
  return { action: 'attack' };
};