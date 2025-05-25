/**
 * Food Gathering System for Journeys & Jamborees
 * Implements Dragonbane's hunting, fishing, and foraging mechanics
 */

import { SystemAdapterFactory } from './system-adapter';
import { FoodTablesManager } from './food-tables';

export interface FoodGatheringResult {
  success: boolean;
  rations: number;
  description: string;
  complications?: string;
}

export interface HuntingResult extends FoodGatheringResult {
  animal?: string;
  requiresWeapon: boolean;
  canUseTrap: boolean;
}

export class FoodGatheringSystem {
  private static instance: FoodGatheringSystem;
  
  private constructor() {}
  
  static getInstance(): FoodGatheringSystem {
    if (!FoodGatheringSystem.instance) {
      FoodGatheringSystem.instance = new FoodGatheringSystem();
    }
    return FoodGatheringSystem.instance;
  }
  
  /**
   * Check if Dragonbane core set is available
   */
  isDragonbaneCoresetAvailable(): boolean {
    return game.modules.get('dragonbane-coreset')?.active || false;
  }
  
  /**
   * Check if we're running Dragonbane system
   */
  isDragonbaneSystem(): boolean {
    return game.system.id === 'dragonbane';
  }
  
  /**
   * Determine which animal was found during hunting using RollTables
   */
  private async rollHuntingAnimal(): Promise<HuntingResult> {
    const tablesManager = FoodTablesManager.getInstance();
    const tableResult = await tablesManager.rollHunting();
    
    if (!tableResult) {
      return {
        success: false,
        animal: undefined,
        rations: 0,
        requiresWeapon: true,
        canUseTrap: false,
        description: game.i18n.localize('J&J.FoodGathering.NoAnimalsFound')
      };
    }
    
    // Extract metadata from table result flags
    const flags = tableResult.flags?.['journeys-and-jamborees'] || {};
    const requiresWeapon = flags.requiresWeapon !== false; // Default true
    const canUseTrap = flags.canUseTrap === true; // Default false
    const dangerous = flags.dangerous === true; // Default false
    
    // Calculate rations from table result
    let rationsValue = 0;
    const rationsText = flags.rations || '1';
    
    if (rationsText.includes('d')) {
      // It's a dice formula
      const rationsRoll = new Roll(rationsText);
      await rationsRoll.evaluate();
      rationsValue = rationsRoll.total;
    } else {
      // It's a number
      rationsValue = parseInt(rationsText) || 1;
    }
    
    return {
      success: true,
      animal: tableResult.animal,
      rations: rationsValue,
      requiresWeapon: requiresWeapon,
      canUseTrap: canUseTrap,
      description: game.i18n.format('J&J.FoodGathering.HuntingFound', { 
        animal: tableResult.animal, 
        rations: rationsValue 
      }),
      complications: dangerous ? game.i18n.localize('J&J.FoodGathering.DangerousAnimal') : undefined
    };
  }
  
  /**
   * Check if actor has a ranged weapon and get its skill
   * @param actor The character to check
   * @returns Object with hasRangedWeapon flag and skillName if found
   */
  private checkRangedWeapon(actor: Actor): { hasRangedWeapon: boolean; weaponSkill?: string; weapon?: any } {
    // Get all items that are weapons
    const weapons = actor.items.filter(item => item.type === 'weapon');
    
    
    // Find ranged weapons (range >= 10 and not thrown)
    for (const weapon of weapons) {
      const isThrown = weapon.system.features?.thrown || false;
      const range = weapon.system.calculatedRange || weapon.system.range?.value || weapon.system.range || 0;
      
      
      if (!isThrown && range >= 10) {
        return {
          hasRangedWeapon: true,
          weaponSkill: weapon.system.skill?.name,
          weapon: weapon
        };
      }
    }
    
    return { hasRangedWeapon: false };
  }
  
  /**
   * Check if actor has hunting trap
   * @param actor The character to check
   */
  private checkHuntingTrap(actor: Actor): boolean {
    // Look for items named "trap" or "hunting trap" in inventory
    return actor.items.some(item => 
      item.type === 'item' && 
      (item.name.toLowerCase().includes('trap') || 
       item.name.toLowerCase().includes('snare'))
    );
  }
  
  /**
   * Perform hunting action
   * @param actor The character doing the hunting
   */
  async hunt(actor: Actor): Promise<HuntingResult> {
    if (!this.isDragonbaneSystem() || !this.isDragonbaneCoresetAvailable()) {
      return {
        success: false,
        rations: 0,
        requiresWeapon: true,
        canUseTrap: false,
        description: game.i18n.localize('J&J.FoodGathering.NotAvailable')
      };
    }
    
    // Get the configured hunting skill
    const huntingSkill = game.settings.get('journeys-and-jamborees', 'huntingSkillName') as string;
    
    // Check what equipment the hunter has
    const weaponCheck = this.checkRangedWeapon(actor);
    const hasTrap = this.checkHuntingTrap(actor);
    
    // First roll: Track down an animal (using configured hunting skill)
    const adapter = SystemAdapterFactory.getAdapter();
    const trackingResult = await adapter.rollSkill(actor, huntingSkill);
    
    if (!trackingResult.success) {
      return {
        success: false,
        rations: 0,
        requiresWeapon: true,
        canUseTrap: false,
        description: game.i18n.localize('J&J.FoodGathering.NoAnimalsFound')
      };
    }
    
    // Determine what animal was found
    const animalResult = await this.rollHuntingAnimal();
    
    // Check if the hunter has the right equipment
    if (!weaponCheck.hasRangedWeapon && animalResult.requiresWeapon && (!hasTrap || !animalResult.canUseTrap)) {
      return {
        ...animalResult,
        success: false,
        rations: 0,
        description: game.i18n.format('J&J.FoodGathering.NoEquipmentForAnimal', { 
          animal: animalResult.animal 
        })
      };
    }
    
    // Second roll: Kill the animal (weapon skill or hunting skill for trap)
    let killResult;
    if (weaponCheck.hasRangedWeapon && weaponCheck.weaponSkill) {
      // Use the specific weapon skill (BOWS, CROSSBOWS, etc.)
      killResult = await adapter.rollSkill(actor, weaponCheck.weaponSkill);
    } else if (hasTrap && animalResult.canUseTrap) {
      // Use hunting skill for trap
      killResult = await adapter.rollSkill(actor, huntingSkill);
    } else {
      // This shouldn't happen if we checked equipment correctly
      killResult = { success: false };
    }
    
    if (!killResult.success) {
      // Special case: Boar attacks if hunting fails
      if (animalResult.animal === 'Boar') {
        return {
          ...animalResult,
          success: false,
          rations: 0,
          description: game.i18n.localize('J&J.FoodGathering.BoarAttacks'),
          complications: game.i18n.localize('J&J.FoodGathering.BoarAttacksDetail')
        };
      }
      
      return {
        ...animalResult,
        success: false,
        rations: 0,
        description: game.i18n.format('J&J.FoodGathering.AnimalEscaped', { 
          animal: animalResult.animal 
        })
      };
    }
    
    return animalResult;
  }
  
  /**
   * Perform fishing action
   * @param actor The character doing the fishing
   * @param hasRod Whether the character has a fishing rod
   * @param hasNet Whether the character has a fishing net
   */
  async fish(actor: Actor, hasRod: boolean, hasNet: boolean): Promise<FoodGatheringResult> {
    if (!this.isDragonbaneSystem() || !this.isDragonbaneCoresetAvailable()) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NotAvailable')
      };
    }
    
    if (!hasRod && !hasNet) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NoFishingGear')
      };
    }
    
    const huntingSkill = game.settings.get('journeys-and-jamborees', 'huntingSkillName') as string;
    const adapter = SystemAdapterFactory.getAdapter();
    const fishingResult = await adapter.rollSkill(actor, huntingSkill);
    
    if (!fishingResult.success) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NoFishCaught')
      };
    }
    
    // Roll for rations based on equipment
    const rationsFormula = hasNet ? '1d6' : '1d4';
    const rationsRoll = new Roll(rationsFormula);
    await rationsRoll.evaluate();
    
    return {
      success: true,
      rations: rationsRoll.total,
      description: game.i18n.format('J&J.FoodGathering.FishCaught', { 
        rations: rationsRoll.total,
        gear: hasNet ? game.i18n.localize('J&J.FoodGathering.FishingNet') : game.i18n.localize('J&J.FoodGathering.FishingRod')
      })
    };
  }
  
  /**
   * Perform foraging action
   * @param actor The character doing the foraging
   * @param season Current season (affects difficulty)
   */
  async forage(actor: Actor, season: 'spring' | 'summer' | 'fall' | 'winter' = 'summer'): Promise<FoodGatheringResult> {
    if (!this.isDragonbaneSystem() || !this.isDragonbaneCoresetAvailable()) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NotAvailable')
      };
    }
    
    // For foraging, use the configured foraging skill
    const foragingSkill = game.settings.get('journeys-and-jamborees', 'foragingSkillName') as string;
    const adapter = SystemAdapterFactory.getAdapter();
    
    // Modify the roll based on season
    // In Dragonbane, bane/boon would be handled differently
    // For now, we'll just note it in the description
    const seasonModifier = season === 'winter' ? 'bane' : (season === 'fall' ? 'boon' : 'normal');
    
    const foragingResult = await adapter.rollSkill(actor, foragingSkill);
    
    if (!foragingResult.success) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NothingFound')
      };
    }
    
    // Use foraging table to determine what was found
    const tablesManager = FoodTablesManager.getInstance();
    const tableResult = await tablesManager.rollForaging();
    
    if (!tableResult) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NothingFound')
      };
    }
    
    // Extract rations from table result flags
    const flags = tableResult.flags?.['journeys-and-jamborees'] || {};
    let rationsValue = 0;
    const rationsText = flags.rations || '1d3';
    
    if (rationsText.includes('d')) {
      // It's a dice formula
      const rationsRoll = new Roll(rationsText);
      await rationsRoll.evaluate();
      rationsValue = rationsRoll.total;
    } else {
      // It's a number
      rationsValue = parseInt(rationsText) || 1;
    }
    
    return {
      success: true,
      rations: rationsValue,
      description: game.i18n.format('J&J.FoodGathering.ForagingSuccess', { 
        item: tableResult.description,
        rations: rationsValue,
        season: game.i18n.localize(`J&J.FoodGathering.Season.${season}`)
      })
    };
  }
  
  /**
   * Cook raw food
   * @param actor The character doing the cooking
   * @param rawRations Number of raw rations to cook
   * @param hasFieldKitchen Whether the character has a field kitchen
   * @param hasProperKitchen Whether in a proper kitchen
   */
  async cook(actor: Actor, rawRations: number, hasFieldKitchen: boolean = false, hasProperKitchen: boolean = false): Promise<FoodGatheringResult> {
    if (!this.isDragonbaneSystem() || !this.isDragonbaneCoresetAvailable()) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.NotAvailable')
      };
    }
    
    // Check ration limits
    if (!hasProperKitchen && rawRations > 10) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.TooManyRations')
      };
    }
    
    const adapter = SystemAdapterFactory.getAdapter();
    
    // Note: In Dragonbane, field kitchen or proper kitchen would give a boon
    // For now, we'll just note it in the result
    const cookingResult = await adapter.rollSkill(actor, 'bushcraft');
    
    if (!cookingResult.success) {
      return {
        success: false,
        rations: 0,
        description: game.i18n.localize('J&J.FoodGathering.CookingFailed'),
        complications: game.i18n.localize('J&J.FoodGathering.FoodStillRaw')
      };
    }
    
    return {
      success: true,
      rations: rawRations,
      description: game.i18n.format('J&J.FoodGathering.CookingSuccess', { 
        rations: rawRations,
        kitchen: hasProperKitchen ? game.i18n.localize('J&J.FoodGathering.ProperKitchen') : 
                 (hasFieldKitchen ? game.i18n.localize('J&J.FoodGathering.FieldKitchen') : 
                 game.i18n.localize('J&J.FoodGathering.Campfire'))
      })
    };
  }
}