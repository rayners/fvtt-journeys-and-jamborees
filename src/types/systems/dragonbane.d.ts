/**
 * Type definitions for the Dragonbane (Drakar och Demoner) game system in Foundry VTT
 * Based on the APIs used by the Journeys & Jamborees module
 */

declare namespace Dragonbane {
  interface SystemData {
    conditions: ConditionStates;
  }

  interface ConditionStates {
    exhausted: boolean;
    sickly: boolean;
    dazed: boolean;
    angry: boolean;
    scared: boolean;
    disheartened: boolean;
  }

  interface SkillData {
    value: number; // 1-18 typically
    advance: boolean; // Has advancement mark
  }

  interface WeaponData {
    features?: {
      thrown?: boolean;
    };
    calculatedRange?: number;
    skill?: {
      name: string;
    };
  }

  interface RollOptions {
    boons?: number;
    banes?: number;
    pushed?: boolean;
    advancement?: boolean;
  }

  interface RollResult {
    total: number;
    success: boolean;
    critical: boolean;
    failure: boolean;
    fumble: boolean;
    canPush: boolean;
  }
}

// Extend the global Actor type when Dragonbane is the active system
declare global {
  interface Actor {
    /**
     * Get a skill item by name (Dragonbane-specific method)
     */
    getSkill?(skillName: string): Item | undefined;
  }

  interface ActorSheet {
    /**
     * Handle skill roll from sheet (Dragonbane-specific method)
     */
    _onSkillRoll?(event: Event): Promise<void>;
  }

  // Extend Item data for Dragonbane-specific item types
  interface Item {
    type: string | 'skill' | 'weapon' | 'armor' | 'gear';
  }

  interface ItemDataProperties {
    // For skills
    value?: number;
    advance?: boolean;
    
    // For weapons
    features?: {
      thrown?: boolean;
    };
    calculatedRange?: number;
    skill?: {
      name: string;
    };
  }

  // Extend game settings for Dragonbane
  interface GameSettings {
    get(module: 'dragonbane', setting: 'autoSkillAdvancement'): boolean;
    get(module: 'dragonbane', setting: string): any;
  }

  // Extend CONFIG for Dragonbane
  interface CONFIG {
    DoD?: {
      conditionTypes: string[];
      skillTypes: string[];
    };
  }
}

// Type guard functions that can be used in the module
declare module "dragonbane-types" {
  export function isDragonbaneActor(actor: Actor): actor is Actor & {
    getSkill(skillName: string): Item | undefined;
    system: ActorDataProperties & Dragonbane.SystemData;
  };

  export function isDragonbaneSkill(item: Item): item is Item & {
    type: 'skill';
    system: ItemDataProperties & Dragonbane.SkillData;
  };

  export function isDragonbaneWeapon(item: Item): item is Item & {
    type: 'weapon';
    system: ItemDataProperties & Dragonbane.WeaponData;
  };
}