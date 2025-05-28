/**
 * Food Gathering Tables Manager
 * Creates and manages RollTables for hunting and foraging
 */

export interface HuntingTableResult {
  animal: string;
  rations: string | number; // Can be dice formula like "2d6" or number
  requiresWeapon: boolean;
  canUseTrap: boolean;
  dangerous: boolean;
}

export interface ForagingTableResult {
  description: string;
  rations: string | number;
  special?: string;
}

export class FoodTablesManager {
  private static instance: FoodTablesManager;
  private jjFolder: Folder | null = null;

  private constructor() {}

  static getInstance(): FoodTablesManager {
    if (!FoodTablesManager.instance) {
      FoodTablesManager.instance = new FoodTablesManager();
    }
    return FoodTablesManager.instance;
  }

  /**
   * Get or create the Journeys & Jamborees folder for RollTables
   */
  private async getJJFolder(): Promise<Folder | null> {
    if (this.jjFolder) return this.jjFolder;

    // Look for existing folder
    this.jjFolder = game.folders.find(f => 
      f.type === 'RollTable' && 
      f.name === 'Journeys & Jamborees'
    ) || null;

    if (!this.jjFolder && game.user.isGM) {
      try {
        this.jjFolder = await Folder.create({
          name: 'Journeys & Jamborees',
          type: 'RollTable',
          sorting: 'a',
          color: '#4b0082',
          description: 'RollTables created by the Journeys & Jamborees module'
        });
      } catch (error) {
        console.warn('J&J | Failed to create folder:', error);
      }
    }

    return this.jjFolder;
  }

  /**
   * Check if we can use official Dragonbane content
   */
  private canUseOfficialContent(): boolean {
    return game.system.id === 'dragonbane' && game.modules.get('dragonbane-coreset')?.active;
  }

  /**
   * Get or create the hunting table
   */
  async getHuntingTable(): Promise<RollTable | null> {
    // Look for existing hunting table
    let huntingTable = game.tables.find(t => t.name === 'J&J Hunting Results');

    if (!huntingTable) {
      if (this.canUseOfficialContent()) {
        huntingTable = await this.createDragonbaneHuntingTable();
      } else {
        huntingTable = await this.createGenericHuntingTable();
      }
    } else {
    }

    return huntingTable;
  }

  /**
   * Get or create the foraging table
   */
  async getForagingTable(): Promise<RollTable | null> {
    // Look for existing foraging table
    let foragingTable = game.tables.find(t => t.name === 'J&J Foraging Results');

    if (!foragingTable) {
      foragingTable = await this.createGenericForagingTable();
    }

    return foragingTable;
  }

  /**
   * Create the official Dragonbane hunting table (only when Core Set is available)
   */
  private async createDragonbaneHuntingTable(): Promise<RollTable> {
    const folder = await this.getJJFolder();
    const tableData = {
      name: 'J&J Hunting Results',
      description: 'Official Dragonbane hunting results table (requires Core Set)',
      formula: '1d6',
      replacement: true,
      displayRoll: true,
      folder: folder?.id || null,
      results: [
        {
          range: [1, 1],
          text: 'Squirrel',
          flags: {
            'journeys-and-jamborees': {
              rations: 1,
              requiresWeapon: true,
              canUseTrap: true,
              dangerous: false
            }
          }
        },
        {
          range: [2, 2],
          text: 'Crow',
          flags: {
            'journeys-and-jamborees': {
              rations: 1,
              requiresWeapon: true,
              canUseTrap: false,
              dangerous: false
            }
          }
        },
        {
          range: [3, 3],
          text: 'Rabbit',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d3',
              requiresWeapon: true,
              canUseTrap: true,
              dangerous: false
            }
          }
        },
        {
          range: [4, 4],
          text: 'Fox',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d4',
              requiresWeapon: true,
              canUseTrap: true,
              dangerous: false
            }
          }
        },
        {
          range: [5, 5],
          text: 'Boar',
          flags: {
            'journeys-and-jamborees': {
              rations: '2d6',
              requiresWeapon: true,
              canUseTrap: false,
              dangerous: true
            }
          }
        },
        {
          range: [6, 6],
          text: 'Deer',
          flags: {
            'journeys-and-jamborees': {
              rations: '2d8',
              requiresWeapon: true,
              canUseTrap: false,
              dangerous: false
            }
          }
        }
      ]
    };

    return await RollTable.create(tableData);
  }

  /**
   * Create a generic hunting table (no copyrighted content)
   */
  private async createGenericHuntingTable(): Promise<RollTable> {
    const folder = await this.getJJFolder();
    const tableData = {
      name: 'J&J Hunting Results',
      description: 'Generic hunting results table for Journeys & Jamborees',
      formula: '1d6',
      replacement: true,
      displayRoll: true,
      folder: folder?.id || null,
      results: [
        {
          range: [1, 1],
          text: 'Small Bird',
          flags: {
            'journeys-and-jamborees': {
              rations: 1,
              requiresWeapon: true,
              canUseTrap: true,
              dangerous: false
            }
          }
        },
        {
          range: [2, 2],
          text: 'Flying creature',
          flags: {
            'journeys-and-jamborees': {
              rations: 1,
              requiresWeapon: true,
              canUseTrap: false,
              dangerous: false
            }
          }
        },
        {
          range: [3, 3],
          text: 'Quick prey',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d3',
              requiresWeapon: true,
              canUseTrap: true,
              dangerous: false
            }
          }
        },
        {
          range: [4, 4],
          text: 'Cunning hunter',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d4',
              requiresWeapon: true,
              canUseTrap: true,
              dangerous: false
            }
          }
        },
        {
          range: [5, 5],
          text: 'Dangerous beast',
          flags: {
            'journeys-and-jamborees': {
              rations: '2d4',
              requiresWeapon: true,
              canUseTrap: false,
              dangerous: true
            }
          }
        },
        {
          range: [6, 6],
          text: 'Large herbivore',
          flags: {
            'journeys-and-jamborees': {
              rations: '2d6',
              requiresWeapon: true,
              canUseTrap: false,
              dangerous: false
            }
          }
        }
      ]
    };

    return await RollTable.create(tableData);
  }

  /**
   * Create the generic foraging table
   */
  private async createGenericForagingTable(): Promise<RollTable> {
    const folder = await this.getJJFolder();
    const tableData = {
      name: 'J&J Foraging Results',
      description: 'Generic foraging results table for Journeys & Jamborees',
      formula: '1d20',
      replacement: true,
      displayRoll: true,
      folder: folder?.id || null,
      results: [
        {
          range: [1, 2],
          text: 'Nothing edible found',
          flags: {
            'journeys-and-jamborees': {
              rations: 0,
              special: 'failure'
            }
          }
        },
        {
          range: [3, 5],
          text: 'Mistook poisonous plants for edible',
          flags: {
            'journeys-and-jamborees': {
              rations: -1,
              special: 'poison'
            }
          }
        },
        {
          range: [6, 10],
          text: 'Handful of bitter berries',
          flags: {
            'journeys-and-jamborees': {
              rations: 1,
              special: 'basic'
            }
          }
        },
        {
          range: [11, 14],
          text: 'Edible roots and shoots',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d3',
              special: 'basic'
            }
          }
        },
        {
          range: [15, 17],
          text: 'Nuts and wild vegetables',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d4+1',
              special: 'good'
            }
          }
        },
        {
          range: [18, 19],
          text: 'Bountiful patch of wild edibles',
          flags: {
            'journeys-and-jamborees': {
              rations: '1d6+2',
              special: 'excellent'
            }
          }
        },
        {
          range: [20, 20],
          text: 'Rare beneficial herbs found',
          flags: {
            'journeys-and-jamborees': {
              rations: '2d3',
              special: 'medicinal'
            }
          }
        }
      ]
    };

    return await RollTable.create(tableData);
  }

  /**
   * Roll on the hunting table and parse results
   */
  async rollHunting(): Promise<HuntingTableResult | null> {
    const table = await this.getHuntingTable();
    if (!table) return null;

    const roll = await table.roll();
    const result = roll.results[0];

    if (!result) return null;

    const flags = result.flags?.['journeys-and-jamborees'];
    if (!flags) {
      // Fallback parsing if no flags (for custom tables)
      return this.parseHuntingText(result.description || result.name);
    }

    const animalName = result.description || result.name || result.text;

    return {
      animal: animalName,
      rations: flags.rations,
      requiresWeapon: flags.requiresWeapon,
      canUseTrap: flags.canUseTrap,
      dangerous: flags.dangerous
    };
  }

  /**
   * Roll on the foraging table and parse results
   */
  async rollForaging(): Promise<ForagingTableResult | null> {
    const table = await this.getForagingTable();
    if (!table) return null;

    const roll = await table.roll();
    const result = roll.results[0];

    if (!result) return null;

    const flags = result.flags?.['journeys-and-jamborees'];
    if (!flags) {
      // Fallback parsing if no flags (for custom tables)
      return this.parseForagingText(result.description || result.name);
    }

    const itemName = result.description || result.name || result.text;

    return {
      description: itemName,
      rations: flags.rations,
      special: flags.special
    };
  }

  /**
   * Parse hunting result text for custom tables without flags
   * Format: "Animal|rations|weapon/trap|safe/dangerous"
   */
  private parseHuntingText(text: string): HuntingTableResult {
    const parts = text.split('|');
    if (parts.length >= 4) {
      return {
        animal: parts[0].trim(),
        rations: parts[1].trim(),
        requiresWeapon: parts[2].trim().toLowerCase().includes('weapon'),
        canUseTrap: parts[2].trim().toLowerCase().includes('trap'),
        dangerous: parts[3].trim().toLowerCase().includes('dangerous')
      };
    }

    // Fallback for simple text
    return {
      animal: text,
      rations: 1,
      requiresWeapon: true,
      canUseTrap: false,
      dangerous: false
    };
  }

  /**
   * Parse foraging result text for custom tables without flags
   * Format: "Description|rations|special"
   */
  private parseForagingText(text: string): ForagingTableResult {
    const parts = text.split('|');
    if (parts.length >= 2) {
      return {
        description: parts[0].trim(),
        rations: parts[1].trim(),
        special: parts[2]?.trim()
      };
    }

    // Fallback for simple text
    return {
      description: text,
      rations: 1
    };
  }

  /**
   * Initialize tables on module load
   */
  async initializeTables(): Promise<void> {
    // Create tables for any system, but content varies based on what's available
    if (game.user.isGM) {
      await this.getHuntingTable();
      await this.getForagingTable();
    }
  }
}
