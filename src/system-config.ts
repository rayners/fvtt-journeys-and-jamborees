/**
 * System configuration for different game systems
 * This module provides system-specific values and behaviors
 */

export interface SystemMovementConfig {
  onFoot: {
    value: number;
    unit: string;
  };
  mounted: {
    value: number;
    unit: string;
  };
}

export interface SystemSkillConfig {
  pathfinding: string;
  lookout: string;
  quartermaster: string;
}

export interface SystemDiceConfig {
  randomEncounter: string;
  encounterThreshold: number;
  pathfinding: string;
  weather: string;
}

export interface SystemAssetConfig {
  defaultPartyImage: string;
}

export interface SystemConfig {
  id: string;
  name: string;
  movement: SystemMovementConfig;
  skills: SystemSkillConfig;
  dice: SystemDiceConfig;
  assets: SystemAssetConfig;
  // Time unit used by the system (e.g., "shift", "watch", "hour")
  timeUnit: string;
}

// Default configurations for known systems
const SYSTEM_CONFIGS: Record<string, SystemConfig> = {
  dragonbane: {
    id: 'dragonbane',
    name: 'Dragonbane',
    movement: {
      onFoot: { value: 15, unit: 'km' },
      mounted: { value: 30, unit: 'km' }
    },
    skills: {
      pathfinding: 'bushcraft',
      lookout: 'awareness',
      quartermaster: 'bartering'
    },
    dice: {
      randomEncounter: '1d20',
      encounterThreshold: 18,
      pathfinding: '1d20',
      weather: '1d6'
    },
    assets: {
      defaultPartyImage: 'modules/dragonbane-coreset/assets/artwork/chapter-2.webp'
    },
    timeUnit: 'shift'
  },
  dnd5e: {
    id: 'dnd5e',
    name: 'D&D 5th Edition',
    movement: {
      onFoot: { value: 24, unit: 'miles' },  // 24 miles per day
      mounted: { value: 30, unit: 'miles' }  // 30 miles per day (normal pace)
    },
    skills: {
      pathfinding: 'survival',
      lookout: 'perception',
      quartermaster: 'persuasion'
    },
    dice: {
      randomEncounter: '1d20',
      encounterThreshold: 15,
      pathfinding: '1d20',
      weather: '1d20'
    },
    assets: {
      defaultPartyImage: 'icons/environment/wilderness/path-dirt.webp'
    },
    timeUnit: 'day'
  },
  pf2e: {
    id: 'pf2e',
    name: 'Pathfinder 2e',
    movement: {
      onFoot: { value: 24, unit: 'miles' },
      mounted: { value: 32, unit: 'miles' }
    },
    skills: {
      pathfinding: 'survival',
      lookout: 'perception',
      quartermaster: 'diplomacy'
    },
    dice: {
      randomEncounter: '1d20',
      encounterThreshold: 15,
      pathfinding: '1d20',
      weather: '1d20'
    },
    assets: {
      defaultPartyImage: 'icons/environment/wilderness/path-dirt.webp'
    },
    timeUnit: 'day'
  },
  'forbidden-lands': {
    id: 'forbidden-lands',
    name: 'Forbidden Lands',
    movement: {
      onFoot: { value: 10, unit: 'km' },  // per quarter day
      mounted: { value: 20, unit: 'km' }
    },
    skills: {
      pathfinding: 'survival',
      lookout: 'scouting',
      quartermaster: 'manipulation'
    },
    dice: {
      randomEncounter: '1d6',
      encounterThreshold: 1,  // Forbidden Lands uses different encounter system
      pathfinding: '1d12',
      weather: '1d6'
    },
    assets: {
      defaultPartyImage: 'icons/environment/wilderness/path-dirt.webp'
    },
    timeUnit: 'quarter'
  },
  worldbuilding: {
    id: 'worldbuilding',
    name: 'Simple Worldbuilding',
    movement: {
      onFoot: { value: 25, unit: 'units' },
      mounted: { value: 50, unit: 'units' }
    },
    skills: {
      pathfinding: 'skill',  // Generic skill name
      lookout: 'skill',
      quartermaster: 'skill'
    },
    dice: {
      randomEncounter: '1d20',
      encounterThreshold: 15,
      pathfinding: '1d20',
      weather: '1d6'
    },
    assets: {
      defaultPartyImage: 'icons/environment/wilderness/path-dirt.webp'
    },
    timeUnit: 'period'
  }
};

// Fallback configuration for unknown systems
const DEFAULT_CONFIG: SystemConfig = {
  id: 'generic',
  name: 'Generic System',
  movement: {
    onFoot: { value: 25, unit: 'units' },
    mounted: { value: 50, unit: 'units' }
  },
  skills: {
    pathfinding: 'skill',
    lookout: 'skill',
    quartermaster: 'skill'
  },
  dice: {
    randomEncounter: '1d20',
    encounterThreshold: 15,
    pathfinding: '1d20',
    weather: '1d6'
  },
  assets: {
    defaultPartyImage: 'icons/environment/wilderness/path-dirt.webp'
  },
  timeUnit: 'period'
};

export class SystemConfigManager {
  private static instance: SystemConfigManager;
  private currentConfig: SystemConfig;
  private customConfig: Partial<SystemConfig> = {};

  private constructor() {
    // Initialize with system detection
    const systemId = game.system.id;
    this.currentConfig = SYSTEM_CONFIGS[systemId] || { ...DEFAULT_CONFIG, id: systemId, name: game.system.title };
  }

  static getInstance(): SystemConfigManager {
    if (!SystemConfigManager.instance) {
      SystemConfigManager.instance = new SystemConfigManager();
    }
    return SystemConfigManager.instance;
  }

  /**
   * Get the current system configuration
   */
  getConfig(): SystemConfig {
    // Merge custom settings over defaults
    return {
      ...this.currentConfig,
      ...this.customConfig,
      movement: { ...this.currentConfig.movement, ...this.customConfig.movement },
      skills: { ...this.currentConfig.skills, ...this.customConfig.skills },
      dice: { ...this.currentConfig.dice, ...this.customConfig.dice },
      assets: { ...this.currentConfig.assets, ...this.customConfig.assets }
    } as SystemConfig;
  }

  /**
   * Update configuration from module settings
   */
  updateFromSettings(settings: Partial<SystemConfig>): void {
    this.customConfig = settings;
  }

  /**
   * Get movement rate for a specific mode
   */
  getMovementRate(mounted: boolean = false): { value: number; unit: string } {
    const config = this.getConfig();
    return mounted ? config.movement.mounted : config.movement.onFoot;
  }

  /**
   * Get skill name for a specific role
   */
  getSkillName(role: keyof SystemSkillConfig): string {
    const config = this.getConfig();
    return config.skills[role] || 'skill';
  }

  /**
   * Get dice formula for a specific check
   */
  getDiceFormula(check: keyof SystemDiceConfig): string | number {
    const config = this.getConfig();
    return config.dice[check];
  }

  /**
   * Check if current system is a known system
   */
  isKnownSystem(): boolean {
    return game.system.id in SYSTEM_CONFIGS;
  }

  /**
   * Get list of all known system configurations
   */
  static getAllConfigs(): Record<string, SystemConfig> {
    return { ...SYSTEM_CONFIGS };
  }
}