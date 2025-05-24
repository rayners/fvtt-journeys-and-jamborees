/**
 * System adapter for handling system-specific operations
 * This provides an abstraction layer for different game systems
 */

import { SystemConfigManager } from './system-config';

export interface SkillRollResult {
  total: number;
  success: boolean;
  criticalSuccess?: boolean;
  criticalFailure?: boolean;
}

export abstract class SystemAdapter {
  protected config = SystemConfigManager.getInstance().getConfig();

  /**
   * Get the skill value for a character
   * @param actor The actor to get the skill from
   * @param skillName The name of the skill
   * @returns The skill value or null if not found
   */
  getSkillValue(actor: Actor, skillName: string): number | null {
    if (skillName === 'none' || !skillName) return null;
    return this.getActorSkillValue(actor, skillName);
  }
  
  protected abstract getActorSkillValue(actor: Actor, skillName: string): number | null;

  /**
   * Roll a skill check for a character
   * @param actor The actor making the roll
   * @param skillName The name of the skill
   * @returns The roll result
   */
  async rollSkill(actor: Actor, skillName: string): Promise<SkillRollResult> {
    if (skillName === 'none' || !skillName) {
      // Return a failed roll for "none" skill
      return {
        total: 0,
        success: false,
        criticalSuccess: false,
        criticalFailure: false
      };
    }
    return this.performSkillRoll(actor, skillName);
  }
  
  protected abstract performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult>;

  /**
   * Check if an actor has a specific skill
   * @param actor The actor to check
   * @param skillName The name of the skill
   * @returns True if the actor has the skill
   */
  abstract hasSkill(actor: Actor, skillName: string): boolean;

  /**
   * Get the movement speed of an actor
   * @param actor The actor to get speed from
   * @param mounted Whether the actor is mounted
   * @returns The movement speed value
   */
  abstract getActorSpeed(actor: Actor, mounted: boolean): number;
}

/**
 * Dragonbane system adapter
 */
class DragonbaneAdapter extends SystemAdapter {
  protected getActorSkillValue(actor: Actor, skillName: string): number | null {
    const skill = actor.getSkill(skillName);
    return skill?.system?.value ?? null;
  }

  protected async performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult> {
    const roll = await actor.rollSkill(skillName);
    return {
      total: roll.total,
      success: roll.total <= this.getSkillValue(actor, skillName),
      criticalSuccess: roll.total === 1,
      criticalFailure: roll.total === 20
    };
  }

  hasSkill(actor: Actor, skillName: string): boolean {
    return skillName.toLowerCase() in (actor.system.skills || {});
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    // Dragonbane doesn't track individual speed, use system defaults
    return mounted ? this.config.movement.mounted.value : this.config.movement.onFoot.value;
  }
}

/**
 * D&D 5e system adapter
 */
class Dnd5eAdapter extends SystemAdapter {
  protected getActorSkillValue(actor: Actor, skillName: string): number | null {
    const skill = actor.system.skills?.[skillName.toLowerCase()];
    return skill?.total ?? skill?.mod ?? null;
  }

  protected async performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult> {
    const roll = await actor.rollSkill(skillName);
    const dc = 15; // Default DC for moderate difficulty
    return {
      total: roll.total,
      success: roll.total >= dc,
      criticalSuccess: roll.dice[0].total === 20,
      criticalFailure: roll.dice[0].total === 1
    };
  }

  hasSkill(actor: Actor, skillName: string): boolean {
    return skillName.toLowerCase() in (actor.system.skills || {});
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    const movement = actor.system.attributes?.movement;
    if (mounted && movement?.burrow) return movement.burrow;
    return movement?.walk || 30;
  }
}

/**
 * Pathfinder 2e system adapter
 */
class Pf2eAdapter extends SystemAdapter {
  protected getActorSkillValue(actor: Actor, skillName: string): number | null {
    const skill = actor.system.skills?.[skillName.toLowerCase()];
    return skill?.totalModifier ?? skill?.value ?? null;
  }

  protected async performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult> {
    const skill = actor.system.skills?.[skillName.toLowerCase()];
    if (!skill) return { total: 0, success: false };
    
    const roll = await skill.roll();
    const dc = 15; // Default DC
    return {
      total: roll.total,
      success: roll.total >= dc,
      criticalSuccess: roll.total >= dc + 10,
      criticalFailure: roll.total <= dc - 10
    };
  }

  hasSkill(actor: Actor, skillName: string): boolean {
    return skillName.toLowerCase() in (actor.system.skills || {});
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    const speed = actor.system.attributes?.speed;
    return speed?.total || speed?.value || 25;
  }
}

/**
 * Forbidden Lands system adapter
 */
class ForbiddenLandsAdapter extends SystemAdapter {
  protected getActorSkillValue(actor: Actor, skillName: string): number | null {
    const skill = actor.system.skill?.[skillName.toLowerCase()];
    return skill?.value ?? null;
  }

  protected async performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult> {
    // Forbidden Lands uses a different dice system
    const skill = this.getSkillValue(actor, skillName) || 0;
    const attribute = 3; // Default attribute value
    const roll = new Roll(`${skill + attribute}d6`);
    await roll.evaluate();
    
    const successes = roll.dice[0].results.filter(r => r.result >= 6).length;
    return {
      total: successes,
      success: successes > 0,
      criticalSuccess: successes >= 3,
      criticalFailure: successes === 0 && roll.dice[0].results.some(r => r.result === 1)
    };
  }

  hasSkill(actor: Actor, skillName: string): boolean {
    return skillName.toLowerCase() in (actor.system.skill || {});
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    // Forbidden Lands doesn't track speed on actors
    return mounted ? this.config.movement.mounted.value : this.config.movement.onFoot.value;
  }
}

/**
 * Generic adapter for unknown systems
 */
class GenericAdapter extends SystemAdapter {
  protected getActorSkillValue(actor: Actor, skillName: string): number | null {
    // Try common patterns
    const skill = actor.system.skills?.[skillName] || 
                 actor.system.abilities?.[skillName] ||
                 actor.system.attributes?.[skillName];
    return skill?.value ?? skill?.total ?? skill?.mod ?? null;
  }

  protected async performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult> {
    // Use a simple d20 roll
    const roll = new Roll('1d20');
    await roll.evaluate();
    
    const skillValue = this.getSkillValue(actor, skillName) || 0;
    const total = roll.total + skillValue;
    
    return {
      total: total,
      success: total >= 15,
      criticalSuccess: roll.total === 20,
      criticalFailure: roll.total === 1
    };
  }

  hasSkill(actor: Actor, skillName: string): boolean {
    return !!(actor.system.skills?.[skillName] || 
             actor.system.abilities?.[skillName] ||
             actor.system.attributes?.[skillName]);
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    // Try to find speed in common locations
    const speed = actor.system.attributes?.speed ||
                 actor.system.movement?.speed ||
                 actor.system.speed;
    
    if (typeof speed === 'number') return speed;
    if (speed?.value) return speed.value;
    
    // Fall back to config defaults
    return mounted ? this.config.movement.mounted.value : this.config.movement.onFoot.value;
  }
}

/**
 * Factory to get the appropriate adapter for the current system
 */
export class SystemAdapterFactory {
  private static adapters: Map<string, SystemAdapter> = new Map();

  static getAdapter(): SystemAdapter {
    const systemId = game.system.id;
    
    if (!this.adapters.has(systemId)) {
      let adapter: SystemAdapter;
      
      switch (systemId) {
        case 'dragonbane':
          adapter = new DragonbaneAdapter();
          break;
        case 'dnd5e':
          adapter = new Dnd5eAdapter();
          break;
        case 'pf2e':
          adapter = new Pf2eAdapter();
          break;
        case 'forbidden-lands':
          adapter = new ForbiddenLandsAdapter();
          break;
        default:
          adapter = new GenericAdapter();
      }
      
      this.adapters.set(systemId, adapter);
    }
    
    return this.adapters.get(systemId)!;
  }
}