/**
 * Dragonbane Roll API - Proof of concept for easier programmatic rolling
 * This could eventually be contributed upstream to the Dragonbane system
 */

export interface SkillRollOptions {
  skipDialog?: boolean;
  createMessage?: boolean;
  banes?: number;
  boons?: number;
  allowPush?: boolean; // Whether to allow pushing this roll
  onPushQuery?: (result: SkillRollResult) => Promise<boolean>; // Callback to determine if should push
  onPushResult?: (result: SkillRollResult) => Promise<void>; // Callback after push completes
  pushCondition?: string; // Which condition to take when pushing (if not provided, will prompt)
}

export interface SkillRollResult {
  actor: Actor;
  skill: Item;
  roll: Roll;
  total: number;
  skillValue: number;
  success: boolean;
  criticalSuccess: boolean;
  criticalFailure: boolean;
  canPush: boolean;
  pushed: boolean;
  banesApplied: number;
  boonsApplied: number;
  // Advancement mark info
  isDragon: boolean; // Rolled a 1
  isDemon: boolean; // Rolled a 20
  advancementMarkApplied: boolean;
  skillCanAdvance: boolean; // Whether skill is below max value
  // Push info
  conditionTaken?: string; // Condition taken from pushing
}

export class DragonbaneRollAPI {
  /**
   * Check if a skill can advance (not at max value)
   */
  private static canSkillAdvance(skill: Item): boolean {
    const currentValue = skill.system.value || 0;
    const maxValue = 18; // Dragonbane max skill value
    return currentValue < maxValue;
  }

  /**
   * Apply advancement mark to a skill
   */
  private static async applyAdvancementMark(skill: Item): Promise<boolean> {
    // Check if skill can advance
    if (!this.canSkillAdvance(skill)) {
      return false;
    }

    // Check if already has advancement mark
    if (skill.system.advance) {
      return false;
    }

    // Apply the advancement mark
    await skill.update({ 'system.advance': true });
    
    // Show notification
    ui.notifications.info(
      game.i18n.format("DoD.skill.advanceTooltip", { skill: skill.name })
    );
    
    return true;
  }

  /**
   * Create a custom chat message for skill rolls
   */
  private static async createSkillRollMessage(
    result: SkillRollResult,
    options: SkillRollOptions
  ): Promise<ChatMessage | null> {
    if (options.createMessage === false) return null;

    const actor = result.actor;
    const skill = result.skill;
    
    // Build the message content
    let content = `
      <div class="dragonbane skill-roll">
        <div class="roll-header">
          <h4>${game.i18n.localize("DoD.roll.skillRoll")}: ${skill.name}</h4>
        </div>
        <div class="roll-result">
          <div class="dice-roll">
            <div class="dice-result">
              <h4 class="dice-total ${result.criticalSuccess ? 'critical' : result.criticalFailure ? 'fumble' : ''}">${result.total}</h4>
            </div>
          </div>
          <div class="roll-details">
            <span class="skill-value">${game.i18n.localize("DoD.skill.value")}: ${result.skillValue}</span>
          </div>
        </div>
        <div class="roll-outcome">
    `;

    if (result.criticalSuccess) {
      content += `<span class="success critical">${game.i18n.localize("DoD.roll.criticalSuccess")}</span>`;
      if (result.advancementMarkApplied) {
        content += `<div class="advancement-mark">${game.i18n.format("DoD.skill.advanceTooltip", { skill: skill.name })}</div>`;
      }
    } else if (result.criticalFailure) {
      content += `<span class="failure fumble">${game.i18n.localize("DoD.roll.failure")}</span>`;
      if (result.advancementMarkApplied) {
        content += `<div class="advancement-mark">${game.i18n.format("DoD.skill.advanceTooltip", { skill: skill.name })}</div>`;
      }
    } else if (result.success) {
      content += `<span class="success">${game.i18n.localize("DoD.roll.success")}</span>`;
    } else {
      content += `<span class="failure">${game.i18n.localize("DoD.roll.failure")}</span>`;
      
      // Only show push option if allowed and not already pushed
      if (options.allowPush !== false && result.canPush && !result.pushed) {
        content += `
          <div class="push-option" style="margin-top: 0.5em; font-style: italic; color: #666;">
            ${game.i18n.localize("DoD.roll.pushHint")}
          </div>
        `;
      }
    }

    content += `
        </div>
      </div>
    `;

    // Create the chat message
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content,
      rolls: [result.roll],
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    };

    return await ChatMessage.create(messageData);
  }

  /**
   * Perform a custom skill roll with full control
   */
  static async rollSkillCustom(
    actor: Actor,
    skillNameOrId: string,
    options: SkillRollOptions = {}
  ): Promise<SkillRollResult> {
    // Find the skill
    let skill = actor.items.get(skillNameOrId);
    if (!skill) {
      skill = actor.items.find((item: Item) =>
        item.type === 'skill' &&
        item.name.toLowerCase() === skillNameOrId.toLowerCase()
      );
    }

    if (!skill) {
      throw new Error(`Skill ${skillNameOrId} not found on actor ${actor.name}`);
    }

    const skillValue = skill.system.value || 0;
    const skillCanAdvance = this.canSkillAdvance(skill);

    // Handle banes and boons
    const banes = options.banes || 0;
    const boons = options.boons || 0;
    const netModifier = boons - banes;

    // Create the roll
    let rollFormula = '1d20';
    if (netModifier > 0) {
      // Boons - roll multiple dice and take lowest
      rollFormula = `${netModifier + 1}d20kl`;
    } else if (netModifier < 0) {
      // Banes - roll multiple dice and take highest  
      rollFormula = `${Math.abs(netModifier) + 1}d20kh`;
    }

    const roll = new Roll(rollFormula);
    await roll.evaluate();

    const total = roll.total;
    const isDragon = total === 1;
    const isDemon = total === 20;
    const success = total <= skillValue;
    const canPush = !isDemon && !success && options.allowPush !== false;

    // Handle advancement marks
    let advancementMarkApplied = false;
    if ((isDragon || isDemon) && skillCanAdvance) {
      const autoAdvance = game.settings.get('dragonbane', 'autoSkillAdvancement') ?? true;
      if (autoAdvance) {
        advancementMarkApplied = await this.applyAdvancementMark(skill);
      }
    }

    // Create the result
    const result: SkillRollResult = {
      actor,
      skill,
      roll,
      total,
      skillValue,
      success,
      criticalSuccess: isDragon,
      criticalFailure: isDemon,
      canPush,
      pushed: false,
      banesApplied: banes,
      boonsApplied: boons,
      isDragon,
      isDemon,
      advancementMarkApplied,
      skillCanAdvance
    };

    // Create chat message
    await this.createSkillRollMessage(result, options);

    // Handle push query if failed and can push
    if (!success && canPush && options.onPushQuery) {
      const shouldPush = await options.onPushQuery(result);
      if (shouldPush) {
        return this.pushSkillRoll(result, options);
      }
    }

    return result;
  }

  /**
   * Get available conditions for pushing
   */
  private static getAvailableConditions(actor: Actor): string[] {
    const allConditions = ['exhausted', 'sickly', 'dazed', 'angry', 'scared', 'disheartened'];
    const currentConditions = actor.system.conditions || {};
    
    // Filter out conditions the actor already has
    return allConditions.filter(condition => !currentConditions[condition]);
  }

  /**
   * Apply a condition to the actor
   */
  private static async applyCondition(actor: Actor, condition: string): Promise<void> {
    const conditions = actor.system.conditions || {};
    conditions[condition] = true;
    await actor.update({ 'system.conditions': conditions });
  }

  /**
   * Push a skill roll
   */
  private static async pushSkillRoll(
    originalResult: SkillRollResult,
    options: SkillRollOptions
  ): Promise<SkillRollResult> {
    // Check available conditions
    const availableConditions = this.getAvailableConditions(originalResult.actor);
    if (availableConditions.length === 0) {
      ui.notifications.warn(game.i18n.localize("DoD.roll.cannotPushAllConditions"));
      return originalResult; // Cannot push
    }

    // Determine which condition to take
    let conditionToTake = options.pushCondition;
    if (!conditionToTake || !availableConditions.includes(conditionToTake)) {
      // Would need to prompt user - for now just take the first available
      conditionToTake = availableConditions[0];
    }

    // Apply the condition
    await this.applyCondition(originalResult.actor, conditionToTake);

    // Create the push roll
    const pushRoll = new Roll('1d20');
    await pushRoll.evaluate();

    const total = pushRoll.total;
    const isDragon = total === 1;
    const isDemon = total === 20;
    const success = total <= originalResult.skillValue;

    // Handle advancement marks for push
    let advancementMarkApplied = originalResult.advancementMarkApplied;
    if ((isDragon || isDemon) && originalResult.skillCanAdvance && !advancementMarkApplied) {
      const autoAdvance = game.settings.get('dragonbane', 'autoSkillAdvancement') ?? true;
      if (autoAdvance) {
        advancementMarkApplied = await this.applyAdvancementMark(originalResult.skill);
      }
    }

    // Create pushed result
    const pushedResult: SkillRollResult = {
      ...originalResult,
      roll: pushRoll,
      total,
      success,
      criticalSuccess: isDragon,
      criticalFailure: isDemon,
      pushed: true,
      canPush: false,
      isDragon,
      isDemon,
      advancementMarkApplied,
      conditionTaken: conditionToTake
    };

    // Create push message
    const content = `
      <div class="dragonbane skill-roll pushed">
        <div class="roll-header">
          <h4>${game.i18n.localize("DoD.roll.pushed")}: ${originalResult.skill.name}</h4>
        </div>
        <div class="roll-result">
          <div class="dice-roll">
            <div class="dice-result">
              <h4 class="dice-total ${isDragon ? 'critical' : isDemon ? 'fumble' : ''}">${total}</h4>
            </div>
          </div>
        </div>
        <div class="roll-outcome">
          ${isDragon ? `<span class="success critical">${game.i18n.localize("DoD.roll.criticalSuccess")}</span>` :
            isDemon ? `<span class="failure fumble">${game.i18n.localize("DoD.roll.criticalFailure")}</span>` :
            success ? `<span class="success">${game.i18n.localize("DoD.roll.success")}</span>` :
            `<span class="failure">${game.i18n.localize("DoD.roll.failure")}</span>`}
          ${advancementMarkApplied && !originalResult.advancementMarkApplied ? 
            `<div class="advancement-mark">${game.i18n.format("DoD.skill.advanceTooltip", { skill: originalResult.skill.name })}</div>` : ''}
          <div class="condition-taken" style="margin-top: 0.5em; font-style: italic;">
            ${game.i18n.format("DoD.condition.gained", { condition: game.i18n.localize(`DoD.condition.${conditionToTake}`) })}
          </div>
        </div>
      </div>
    `;

    if (options.createMessage !== false) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: originalResult.actor }),
        content: content,
        rolls: [pushRoll],
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        sound: CONFIG.sounds.dice
      });
    }

    // Call push result callback if provided
    if (options.onPushResult) {
      await options.onPushResult(pushedResult);
    }

    return pushedResult;
  }

  /**
   * Roll using the sheet method
   */
  private static async rollSkillViaSheet(
    actor: Actor,
    skillNameOrId: string,
    options: SkillRollOptions = {}
  ): Promise<SkillRollResult> {
    // Find the skill
    let skill = actor.items.get(skillNameOrId);
    if (!skill) {
      skill = actor.items.find((item: Item) =>
        item.type === 'skill' &&
        item.name.toLowerCase() === skillNameOrId.toLowerCase()
      );
    }

    if (!skill) {
      throw new Error(`Skill ${skillNameOrId} not found on actor ${actor.name}`);
    }

    const skillValue = skill.system.value || 0;
    const skillCanAdvance = this.canSkillAdvance(skill);

    // Store current message count
    const messageCountBefore = game.messages.size;

    // Create a fake event for the sheet
    const fakeEvent = {
      type: "click",
      currentTarget: {
        closest: (selector: string) => {
          if (selector === ".sheet-table-data") {
            return { dataset: { itemId: skill.id } };
          }
          return null;
        }
      },
      preventDefault: () => {},
      shiftKey: options.skipDialog !== false,  // Skip dialog by default
      ctrlKey: false
    };

    // Use the actor sheet's skill roll method
    // @ts-ignore
    await actor.sheet._onSkillRoll(fakeEvent);

    // Wait a bit for the message to be created
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find the new message
    let rollMessage = null;
    if (game.messages.size > messageCountBefore) {
      const messages = game.messages.contents;
      rollMessage = messages[messages.length - 1];
    }

    if (!rollMessage) {
      throw new Error('No chat message created from skill roll');
    }

    // Extract roll data
    const roll = rollMessage.rolls?.[0];
    if (!roll) {
      throw new Error('No roll data in chat message');
    }

    const total = roll.total;
    const isDragon = total === 1;
    const isDemon = total === 20;
    const success = total <= skillValue;
    const canPush = !isDemon && !success && options.allowPush !== false;

    // Check if advancement mark was applied
    const updatedSkill = actor.items.get(skill.id);
    const hadAdvanceMark = skill.system.advance;
    const hasAdvanceMark = updatedSkill?.system?.advance;
    const advancementMarkApplied = !hadAdvanceMark && hasAdvanceMark;

    // Modify the message if we don't want push UI
    if (rollMessage && !success && !options.allowPush) {
      // Remove push UI from the message by updating its content
      let content = rollMessage.content;
      
      // Remove the push form if it exists
      content = content.replace(/<form[^>]*class="push-roll-form"[^>]*>[\s\S]*?<\/form>/gi, '');
      
      // Update the message
      await rollMessage.update({ content });
    }

    // Delete the message if we don't want it
    if (options.createMessage === false && rollMessage) {
      await rollMessage.delete();
    }

    return {
      actor,
      skill,
      roll: roll,
      total: total,
      skillValue: skillValue,
      success: success,
      criticalSuccess: isDragon,
      criticalFailure: isDemon,
      canPush: canPush,
      pushed: false,
      banesApplied: 0,
      boonsApplied: 0,
      isDragon: isDragon,
      isDemon: isDemon,
      advancementMarkApplied: advancementMarkApplied,
      skillCanAdvance: skillCanAdvance
    };
  }

  /**
   * Perform a skill roll programmatically
   * @param actor The actor performing the roll
   * @param skillNameOrId The name or ID of the skill to roll
   * @param options Options for the roll
   * @returns The roll result
   */
  static async rollSkill(
    actor: Actor,
    skillNameOrId: string,
    options: SkillRollOptions = {}
  ): Promise<SkillRollResult> {
    // For now, use the sheet method to get proper Dragonbane formatting
    return this.rollSkillViaSheet(actor, skillNameOrId, options);
  }

  /**
   * Simple automated roll helper (no push mechanics)
   */
  static async rollSkillSimple(
    actor: Actor,
    skillNameOrId: string,
    options: Omit<SkillRollOptions, 'skipDialog' | 'allowPush'> = {}
  ): Promise<SkillRollResult> {
    return this.rollSkill(actor, skillNameOrId, {
      ...options,
      skipDialog: true,
      allowPush: false, // No push for simple rolls
      createMessage: options.createMessage ?? false
    });
  }
}

// Also add as methods on Actor prototype for convenience
Hooks.once('ready', () => {
  if (game.system.id === 'dragonbane') {
    // Add to Actor prototype
    Object.defineProperty(Actor.prototype, 'rollSkill', {
      value: async function(skillNameOrId: string, options: SkillRollOptions = {}) {
        return DragonbaneRollAPI.rollSkill(this, skillNameOrId, options);
      },
      writable: true,
      configurable: true
    });

    Object.defineProperty(Actor.prototype, 'rollSkillSimple', {
      value: async function(skillNameOrId: string, options = {}) {
        return DragonbaneRollAPI.rollSkillSimple(this, skillNameOrId, options);
      },
      writable: true,
      configurable: true
    });

    console.log('Journeys & Jamborees: Dragonbane Roll API ready');
  }
});