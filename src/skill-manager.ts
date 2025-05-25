/**
 * Skill Manager for handling dynamic skill detection and selection
 * Provides system-agnostic skill discovery and configuration
 * 
 * KEY IMPLEMENTATION NOTES:
 * - Uses deferred registration pattern - skill settings are registered 
 *   in a separate ready hook to ensure system data is fully loaded
 * - D&D 5e gets priority detection from CONFIG.DND5E.skills (shows proper names)
 * - Dragonbane and others fall back to compendium/world/actor skill detection
 * - Settings registration happens in module.ts ready hook, not init hook
 * - Skill display names come from this manager, used in both settings and templates
 */

import { SystemConfigManager } from './system-config';

export interface SkillChoice {
  id: string;
  name: string;
  label: string;
}

export class SkillManager {
  private static instance: SkillManager;
  
  private constructor() {}
  
  static getInstance(): SkillManager {
    if (!SkillManager.instance) {
      SkillManager.instance = new SkillManager();
    }
    return SkillManager.instance;
  }

  /**
   * Get available skills from the current game system
   * This method ONLY uses data already present in the game system
   * @returns Record of skill choices for settings
   */
  getAvailableSkills(): Record<string, string> {
    const skills: Record<string, string> = {};
    
    // Method 1: System-specific skill detection (highest priority)
    // Special handling for D&D 5e
    if (game.system.id === 'dnd5e') {
      // D&D 5e stores skill configuration in CONFIG.DND5E.skills
      console.log("D&D 5e system detected. CONFIG.DND5E:", CONFIG.DND5E);
      console.log("CONFIG.DND5E?.skills:", CONFIG.DND5E?.skills);
      
      if (CONFIG.DND5E?.skills) {
        console.log("D&D 5e skills found in CONFIG:", CONFIG.DND5E.skills);
        Object.entries(CONFIG.DND5E.skills).forEach(([key, skillData]: [string, any]) => {
          console.log(`Processing skill ${key}:`, skillData);
          // In D&D 5e v3+, skillData is an object with a label property
          if (typeof skillData === 'object' && skillData.label) {
            // The label property already contains the display name we want
            skills[key] = skillData.label;
            console.log(`Skill ${key} -> ${skills[key]} (from label)`);
          } else if (typeof skillData === 'string') {
            // Older versions might use string references
            skills[key] = game.i18n.localize(skillData) || skillData;
            console.log(`Skill ${key} -> ${skills[key]} (from string)`);
          } else {
            // Fallback
            skills[key] = key;
            console.log(`Skill ${key} -> ${skills[key]} (fallback)`);
          }
        });
        console.log("Final D&D 5e skills object:", skills);
        return skills;
      } else {
        console.warn("CONFIG.DND5E.skills not available yet");
      }
    }
    
    // Method 2: Try to get skills from compendiums (including premium modules)
    const skillsFromCompendiums = this.getSkillsFromCompendiums();
    if (Object.keys(skillsFromCompendiums).length > 0) {
      Object.assign(skills, skillsFromCompendiums);
    }
    
    // Method 3: Try to get skills from world items
    const worldSkillItems = game.items
      .filter((i: Item) => i.type === 'skill');
    
    if (worldSkillItems.length > 0) {
      console.log("Found world skill items:", worldSkillItems);
      worldSkillItems.forEach(skill => {
        // Use the actual skill name as the key, not a transformed ID
        skills[skill.name] = skill.name;
      });
    }
    
    // If we have skills from any source so far, return them
    if (Object.keys(skills).length > 0) {
      console.log("Returning skills from compendiums/world:", skills);
      return skills;
    }
    
    // Method 2: Try to extract skills from a sample character actor
    const sampleActor = game.actors.find((a: Actor) => 
      a.type === 'character' || a.type === 'pc' || a.type === 'player'
    );
    
    if (sampleActor?.system?.skills) {
      Object.entries(sampleActor.system.skills).forEach(([key, skill]: [string, any]) => {
        // Different systems structure skills differently
        const label = skill.label || skill.name || key;
        // Handle localization if present
        const localizedLabel = game.i18n.has(label) ? game.i18n.localize(label) : label;
        skills[key] = localizedLabel;
      });
      
      if (Object.keys(skills).length > 0) {
        return skills;
      }
    }
    
    // Method 4: Try to get skills from system configuration/template
    if (game.system.model?.Actor?.character?.skills) {
      const systemSkills = game.system.model.Actor.character.skills;
      Object.keys(systemSkills).forEach(key => {
        // Try to localize using system's localization keys
        const systemPrefix = game.system.id.toUpperCase();
        const possibleKeys = [
          `${systemPrefix}.Skill${key}`,
          `${systemPrefix}.Skill${key.charAt(0).toUpperCase() + key.slice(1)}`,
          `${systemPrefix}.skill.${key}`,
          `SKILL.${key}`,
          key
        ];
        
        let label = key;
        for (const locKey of possibleKeys) {
          if (game.i18n.has(locKey)) {
            label = game.i18n.localize(locKey);
            break;
          }
        }
        
        skills[key] = label;
      });
      
      if (Object.keys(skills).length > 0) {
        return skills;
      }
    }
    
    // Method 4: For Simple Worldbuilding and other systems, try to detect attributes
    if (sampleActor?.system?.attributes) {
      Object.entries(sampleActor.system.attributes).forEach(([key, attr]: [string, any]) => {
        if (attr && typeof attr === 'object' && (attr.value !== undefined || attr.rank !== undefined)) {
          const label = attr.label || key;
          skills[key] = label;
        }
      });
    }
    
    // If no skills found, provide generic options that user must configure
    if (Object.keys(skills).length === 0) {
      skills['configure-me'] = game.i18n.localize('J&J.skills.configureMe') || 'Please Configure Skills';
    }
    
    return skills;
  }

  /**
   * Get skills from compendiums (including premium modules)
   * This dynamically checks what's installed without hardcoding module names
   */
  private async getSkillsFromCompendiums(): Promise<Record<string, string>> {
    const skills: Record<string, string> = {};
    
    // Get all item compendiums
    const itemCompendiums = game.packs.filter((pack: CompendiumCollection) => 
      pack.documentName === 'Item'
    );
    
    for (const pack of itemCompendiums) {
      try {
        // Check if this pack might contain skills
        const metadata = pack.metadata;
        
        // Only load the index (lightweight operation)
        const index = await pack.getIndex();
        
        // Look for skill items in the index
        const skillEntries = index.filter((entry: any) => 
          entry.type === 'skill' || 
          entry.name?.toLowerCase().includes('skill') ||
          // Some systems might use different naming
          (metadata.id.includes('skill') || metadata.label?.toLowerCase().includes('skill'))
        );
        
        if (skillEntries.size > 0) {
          // Process skill entries
          skillEntries.forEach((entry: any) => {
            // Use the actual skill name as the key, not a transformed ID
            skills[entry.name] = entry.name;
          });
        }
      } catch (error) {
        // Silently continue if we can't access a compendium
        console.debug(`Could not access compendium ${pack.metadata.id}:`, error);
      }
    }
    
    return skills;
  }

  /**
   * Get skills from compendiums synchronously (fallback)
   */
  private getSkillsFromCompendiums(): Record<string, string> {
    const skills: Record<string, string> = {};
    
    // For Dragonbane specifically, check if the coreset module is active
    if (game.system.id === 'dragonbane' && game.modules.get('dragonbane-coreset')?.active) {
      // The module is installed and active, so we can safely check its compendiums
      const coresetPacks = game.packs.filter((pack: CompendiumCollection) => 
        pack.metadata.packageName === 'dragonbane-coreset' && 
        pack.documentName === 'Item'
      );
      
      // Note: We can't load compendium content synchronously, so we'll rely on world items
      // or the async method if needed
    }
    
    // Check for other system-specific modules dynamically
    const systemModules = game.modules.filter((m: any) => 
      m.active && 
      (m.id.includes(game.system.id) || m.relationships?.systems?.some((s: any) => s.id === game.system.id))
    );
    
    // We'll mark that premium content is available but not load it synchronously
    if (systemModules.size > 0) {
      console.debug(`Found ${systemModules.size} active modules for ${game.system.id}`);
    }
    
    return skills;
  }

  /**
   * Register skill settings with dynamic choices
   */
  registerSkillSettings(): void {
    // Check if settings are already registered
    try {
      game.settings.get("journeys-and-jamborees", "pathfinderSkillName");
      console.log("Skill settings already registered, skipping...");
      return;
    } catch (e) {
      // Settings not registered yet, continue
    }
    
    const availableSkills = this.getAvailableSkills();
    const config = SystemConfigManager.getInstance().getConfig();
    
    // Add a "none" option
    const skillChoices = {
      'none': game.i18n.localize('J&J.skills.none') || 'None',
      ...availableSkills
    };
    
    console.log("Registering skill settings with choices:", skillChoices);
    
    // Register pathfinder skill
    game.settings.register("journeys-and-jamborees", "pathfinderSkillName", {
      name: "SETTINGS.PathfinderSkillName",
      hint: "SETTINGS.PathfinderSkillNameHint",
      scope: "world",
      config: true,
      type: String,
      default: this.findBestMatch(config.skills.pathfinding, availableSkills),
      choices: skillChoices,
      onChange: value => this.onSkillChange()
    });
    
    // Register lookout skill
    game.settings.register("journeys-and-jamborees", "lookoutSkillName", {
      name: "SETTINGS.LookoutSkillName",
      hint: "SETTINGS.LookoutSkillNameHint",
      scope: "world",
      config: true,
      type: String,
      default: this.findBestMatch(config.skills.lookout, availableSkills),
      choices: skillChoices,
      onChange: value => this.onSkillChange()
    });
    
    // Register quartermaster skill
    game.settings.register("journeys-and-jamborees", "quartermasterSkillName", {
      name: "SETTINGS.QuartermasterSkillName",
      hint: "SETTINGS.QuartermasterSkillNameHint",
      scope: "world",
      config: true,
      type: String,
      default: this.findBestMatch(config.skills.quartermaster, availableSkills),
      choices: skillChoices,
      onChange: value => this.onSkillChange()
    });
    
    // Register hunting skill
    game.settings.register("journeys-and-jamborees", "huntingSkillName", {
      name: "SETTINGS.HuntingSkillName",
      hint: "SETTINGS.HuntingSkillNameHint",
      scope: "world",
      config: true,
      type: String,
      default: this.findBestMatch(config.skills.hunting, availableSkills),
      choices: skillChoices,
      onChange: value => this.onSkillChange()
    });
    
    // Register foraging skill
    game.settings.register("journeys-and-jamborees", "foragingSkillName", {
      name: "SETTINGS.ForagingSkillName",
      hint: "SETTINGS.ForagingSkillNameHint",
      scope: "world",
      config: true,
      type: String,
      default: this.findBestMatch(config.skills.foraging, availableSkills),
      choices: skillChoices,
      onChange: value => this.onSkillChange()
    });
  }

  /**
   * Find the best matching skill in available skills
   * This uses fuzzy matching to handle different naming conventions
   */
  findBestMatch(desiredSkill: string, availableSkills: Record<string, string>): string {
    const desired = desiredSkill.toLowerCase();
    
    // Direct key match (case-insensitive)
    const exactMatch = Object.keys(availableSkills).find(
      key => key.toLowerCase() === desired
    );
    if (exactMatch) return exactMatch;
    
    // Handle special characters in skill names (e.g., "hunting & fishing")
    const normalizedDesired = desired.replace(/[&]/g, 'and');
    const specialCharMatch = Object.keys(availableSkills).find(
      key => {
        const normalizedKey = key.toLowerCase().replace(/[&]/g, 'and');
        return normalizedKey === normalizedDesired;
      }
    );
    if (specialCharMatch) return specialCharMatch;
    
    // Partial match in key
    const partialMatch = Object.keys(availableSkills).find(
      key => 
        key.toLowerCase().includes(desired) ||
        desired.includes(key.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    // Common synonyms mapping (only using generic terms)
    const synonyms: Record<string, string[]> = {
      'perception': ['awareness', 'notice', 'spot', 'observe'],
      'survival': ['bushcraft', 'outdoors', 'wilderness'],
      'persuasion': ['diplomacy', 'bartering', 'negotiate', 'social'],
      'stealth': ['sneak', 'hide', 'sneaking']
    };
    
    // Check synonyms
    for (const [synonym, alternatives] of Object.entries(synonyms)) {
      if (desired === synonym || alternatives.includes(desired)) {
        const synMatch = Object.keys(availableSkills).find(
          key => 
            key.toLowerCase() === synonym ||
            alternatives.some(alt => key.toLowerCase().includes(alt))
        );
        if (synMatch) return synMatch;
      }
    }
    
    // Default to none if no match found
    return 'none';
  }

  /**
   * Handle skill setting changes
   */
  private onSkillChange(): void {
    // Update the system configuration
    const config = {
      skills: {
        pathfinding: game.settings.get("journeys-and-jamborees", "pathfinderSkillName"),
        lookout: game.settings.get("journeys-and-jamborees", "lookoutSkillName"),
        quartermaster: game.settings.get("journeys-and-jamborees", "quartermasterSkillName"),
        hunting: game.settings.get("journeys-and-jamborees", "huntingSkillName"),
        foraging: game.settings.get("journeys-and-jamborees", "foragingSkillName")
      }
    };
    
    SystemConfigManager.getInstance().updateFromSettings(config);
  }

  /**
   * Check if the currently configured skills are valid
   * @returns Object with validation status for each role
   */
  validateConfiguredSkills(): { pathfinding: boolean; lookout: boolean; quartermaster: boolean } {
    const availableSkills = this.getAvailableSkills();
    
    return {
      pathfinding: this.isSkillValid(game.settings.get("journeys-and-jamborees", "pathfinderSkillName"), availableSkills),
      lookout: this.isSkillValid(game.settings.get("journeys-and-jamborees", "lookoutSkillName"), availableSkills),
      quartermaster: this.isSkillValid(game.settings.get("journeys-and-jamborees", "quartermasterSkillName"), availableSkills)
    };
  }

  /**
   * Check if a skill is valid (exists in the system)
   */
  private isSkillValid(skillId: string, availableSkills: Record<string, string>): boolean {
    return skillId === 'none' || skillId in availableSkills;
  }
}