/**
 * Type guard functions for Dragonbane system
 */

/**
 * Check if an actor is a Dragonbane actor with the getSkill method
 */
export function isDragonbaneActor(actor: Actor): actor is Actor & {
  getSkill(skillName: string): Item | undefined;
  system: ActorDataProperties & {
    conditions: {
      exhausted: boolean;
      sickly: boolean;
      dazed: boolean;
      angry: boolean;
      scared: boolean;
      disheartened: boolean;
    };
  };
} {
  return game.system.id === 'dragonbane' && 'getSkill' in actor;
}

/**
 * Check if an item is a Dragonbane skill
 */
export function isDragonbaneSkill(item: Item): item is Item & {
  type: 'skill';
  system: ItemDataProperties & {
    value: number;
    advance: boolean;
  };
} {
  return game.system.id === 'dragonbane' && item.type === 'skill';
}

/**
 * Check if an item is a Dragonbane weapon
 */
export function isDragonbaneWeapon(item: Item): item is Item & {
  type: 'weapon';
  system: ItemDataProperties & {
    features?: {
      thrown?: boolean;
    };
    calculatedRange?: number;
    skill?: {
      name: string;
    };
  };
} {
  return game.system.id === 'dragonbane' && item.type === 'weapon';
}