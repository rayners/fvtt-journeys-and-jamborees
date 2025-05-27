/**
 * System adapter for handling system-specific operations
 * This provides an abstraction layer for different game systems
 *
 * KEY IMPLEMENTATION NOTES:
 * - Each system has different skill value access patterns:
 *   * Dragonbane: actor.getSkill(name) returns skill item with .system.value
 *   * D&D 5e: actor.system.skills[key] object with .total or .mod properties
 *   * PF2e: actor.system.skills[key] with .totalModifier or .value
 *   * Others: various patterns, GenericAdapter tries common locations
 * - Factory pattern ensures one adapter instance per system ID
 * - Base class handles "none" skill gracefully (returns null/failed rolls)
 * - Skill names are passed as-is from settings, adapters handle casing/lookup
 */

import { SystemConfigManager } from './system-config';
import { isDragonbaneActor, isDragonbaneSkill } from './types/dragonbane-guards';

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
   * Trigger a skill roll dialog without waiting for result
   * Used for chat monitoring approach
   * @param actor The actor making the roll
   * @param skillName The name of the skill to roll
   */
  abstract triggerSkillRoll(actor: Actor, skillName: string): void | Promise<void>;

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
    if (!isDragonbaneActor(actor)) {
      return null;
    }
    const skill = actor.getSkill(skillName);
    if (skill && isDragonbaneSkill(skill)) {
      return skill.system.value;
    }
    return null;
  }

  protected async performSkillRoll(actor: Actor, skillName: string): Promise<SkillRollResult> {
    // Use our new Dragonbane Roll API
    const { DragonbaneRollAPI } = await import('./dragonbane-roll-api');

    try {
      // For food gathering, we don't want push mechanics
      const result = await DragonbaneRollAPI.rollSkill(actor, skillName, {
        skipDialog: true,
        createMessage: true, // Show rolls in chat
        allowPush: false // No pushing for food gathering activities
      });

      // Log if advancement mark was earned
      if (result.advancementMarkApplied) {
        ui.notifications.info(`${actor.name} earned an advancement mark in ${skillName}!`);
      }

      return {
        total: result.total,
        success: result.success,
        criticalSuccess: result.criticalSuccess,
        criticalFailure: result.criticalFailure
      };
    } catch (error) {
      console.error('Dragonbane skill roll failed:', error);
      // Return a failed roll
      return {
        total: 20,
        success: false,
        criticalSuccess: false,
        criticalFailure: true
      };
    }
  }

  hasSkill(actor: Actor, skillName: string): boolean {
    // In Dragonbane, skills are items, not properties in system.skills
    return actor.items.some(
      (item: Item) => isDragonbaneSkill(item) && item.name.toLowerCase() === skillName.toLowerCase()
    );
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    // Dragonbane doesn't track individual speed, use system defaults
    return mounted ? this.config.movement.mounted.value : this.config.movement.onFoot.value;
  }

  async triggerSkillRoll(actor: Actor, skillName: string): Promise<void> {
    // Find the skill item
    const skill = actor.items.find(
      (item: Item) => isDragonbaneSkill(item) && item.name.toLowerCase() === skillName.toLowerCase()
    );

    if (!skill) {
      console.warn('Skill not found:', skillName);
      return;
    }

    // Create a fake DOM element that has the necessary methods
    const fakeSheetTableData = {
      dataset: {
        itemId: skill.id
      }
    };

    const fakeElement = {
      dataset: {
        itemId: skill.id,
        skillId: skill.id
      },
      closest: (selector: string) => {
        // Return the fake sheet-table-data element when requested
        if (selector === '.sheet-table-data') {
          return fakeSheetTableData;
        }
        return null;
      },
      classList: {
        contains: () => false
      }
    };

    // Create a fake event
    const fakeEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      currentTarget: fakeElement,
      target: fakeElement,
      type: 'click', // Important! Must be 'click' to trigger roll, not item sheet
      shiftKey: false, // Don't skip dialog
      ctrlKey: false,
      button: 0 // Left click
    };

    // Use the actor sheet's skill roll method directly
    if (actor.sheet && typeof (actor.sheet as any)._onSkillRoll === 'function') {
      await (actor.sheet as any)._onSkillRoll(fakeEvent);
    } else {
      console.warn('Could not find _onSkillRoll method on actor sheet');
    }
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

  triggerSkillRoll(actor: Actor, skillName: string): void {
    // In D&D 5e, use the actor's rollSkill method
    actor.rollSkill(skillName.toLowerCase());
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

  triggerSkillRoll(actor: Actor, skillName: string): void {
    // In PF2e, trigger through the skill object
    const skill = actor.system.skills?.[skillName.toLowerCase()];
    if (skill && skill.roll) {
      skill.roll();
    }
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

  triggerSkillRoll(actor: Actor, skillName: string): void {
    // In Forbidden Lands, use the actor's rollSkill method if available
    if (typeof actor.rollSkill === 'function') {
      actor.rollSkill(skillName.toLowerCase());
    } else {
      // Fallback to manual roll
      this.performSkillRoll(actor, skillName);
    }
  }
}

/**
 * Generic adapter for unknown systems
 */
class GenericAdapter extends SystemAdapter {
  protected getActorSkillValue(actor: Actor, skillName: string): number | null {
    // Try common patterns
    const skill =
      actor.system.skills?.[skillName] ||
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
    return !!(
      actor.system.skills?.[skillName] ||
      actor.system.abilities?.[skillName] ||
      actor.system.attributes?.[skillName]
    );
  }

  getActorSpeed(actor: Actor, mounted: boolean): number {
    // Try to find speed in common locations
    const speed =
      actor.system.attributes?.speed || actor.system.movement?.speed || actor.system.speed;

    if (typeof speed === 'number') return speed;
    if (speed?.value) return speed.value;

    // Fall back to config defaults
    return mounted ? this.config.movement.mounted.value : this.config.movement.onFoot.value;
  }

  triggerSkillRoll(actor: Actor, skillName: string): void {
    // For generic systems, try common methods
    if (typeof actor.rollSkill === 'function') {
      actor.rollSkill(skillName);
    } else if (typeof actor.rollAbility === 'function') {
      actor.rollAbility(skillName);
    } else {
      // Fallback to manual roll
      this.performSkillRoll(actor, skillName);
    }
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
