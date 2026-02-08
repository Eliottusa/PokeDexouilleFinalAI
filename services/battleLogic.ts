import { Pokemon, TurnLog, StatusCondition } from '../types';
import { TYPE_CHART } from '../constants';

export const calculateDamage = (attacker: Pokemon, defender: Pokemon, moveType?: string): { damage: number, effectiveness: string, isCritical: boolean, isMiss: boolean } => {
  // 1. Status Checks that prevent attacking handled outside this function (Sleep/Freeze)
  
  // 2. Check for Miss (5% chance base)
  let missChance = 0.05;
  
  // Paralysis reduces speed by 50%
  const attackerSpeed = attacker.status === 'paralysis' ? attacker.stats.speed * 0.5 : attacker.stats.speed;
  const defenderSpeed = defender.status === 'paralysis' ? defender.stats.speed * 0.5 : defender.stats.speed;

  if (defenderSpeed > attackerSpeed) {
      missChance += 0.05; 
  }
  
  // Accuracy check
  if (Math.random() < missChance) {
      return { damage: 0, effectiveness: 'normal', isCritical: false, isMiss: true };
  }

  // Base power
  const power = moveType ? 75 : 40;
  
  // Burn reduces Attack by 50%
  const effectiveAttack = attacker.status === 'burn' ? attacker.stats.attack * 0.5 : attacker.stats.attack;

  const rawDamage = (effectiveAttack / defender.stats.defense) * power;
  
  let multiplier = 1;
  let effectiveness = 'normal';

  // Type effectiveness
  if (moveType) {
    const moveTypeLower = moveType.toLowerCase();
    const strongAgainst = TYPE_CHART[moveTypeLower] || [];
    const isSuperEffective = defender.types.some(t => strongAgainst.includes(t.toLowerCase()));

    if (isSuperEffective) {
      multiplier = 2;
      effectiveness = 'super';
    } else {
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

  // Critical Hit (10%)
  const isCritical = Math.random() < 0.1;
  if (isCritical) {
      multiplier *= 1.5;
  }

  const variance = (Math.random() * 0.15) + 0.85;
  const totalDamage = Math.floor(rawDamage * multiplier * variance);
  
  return { 
    damage: Math.max(1, totalDamage), 
    effectiveness,
    isCritical,
    isMiss: false
  };
};

export const getEnemyAction = (enemy: Pokemon, player: Pokemon): { action: 'attack' | 'special', moveType?: string } => {
  const useSpecial = Math.random() > 0.7 && enemy.types.length > 0;
  
  if (useSpecial) {
    return { action: 'special', moveType: enemy.types[0] };
  }
  return { action: 'attack' };
};

// Returns damage taken from status or boolean for skipping turn
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
                 // Wake up
                 message = `${pokemon.name} woke up!`;
            } else {
                canMove = false;
                message = `${pokemon.name} is fast asleep.`;
            }
            break;
        case 'freeze':
            if (Math.random() < 0.2) {
                // Thaw
                message = `${pokemon.name} thawed out!`;
            } else {
                canMove = false;
                message = `${pokemon.name} is frozen solid!`;
            }
            break;
    }

    return { damage, canMove, message };
};