/**
 * Extended type definitions for Foundry VTT that aren't in the community types
 * These declarations augment the existing types to include properties we use
 */

// Extend the global game object with properties we know exist
declare global {
  interface LenientGlobalVariableTypes {
    game: Game;
  }

  interface Game {
    modules: Collection<Module>;
    items: Collection<Item>;
    packs: Collection<CompendiumCollection<any>>;
    userId: string;
    documentTypes?: {
      Actor: string[];
      [key: string]: string[];
    };
    i18n: {
      localize(key: string): string;
      format(key: string, data: Record<string, any>): string;
      translations: Record<string, any>;
      lang: string;
    };
    system: {
      id: string;
      version: string;
      data: any;
      template: any;
    };
  }

  interface Module {
    id: string;
    active: boolean;
    api?: any;
  }

  // Extend CONFIG for system-specific properties
  interface CONFIG {
    DND5E?: {
      skills: Record<string, { label: string; ability: string }>;
      abilities: Record<string, string>;
    };
    Actor: {
      documentClass: typeof Actor;
      types?: string[];
      documentClasses?: Record<string, typeof Actor>;
      [key: string]: any;
    };
  }

  // Extend Actor with methods that exist in various systems
  interface Actor {
    type: string;
    system: any;
    sheet: ActorSheet;
    
    // System-specific methods
    getSkill?(skillName: string): any;
    rollSkill?(skillName: string, options?: any): Promise<any>;
    rollAbility?(abilityName: string, options?: any): Promise<any>;
    createEmbeddedDocuments?(
      embeddedName: string,
      data: any[],
      context?: any
    ): Promise<any[]>;
    
    // Party-specific methods (added by our module)
    getCharacters?(): Actor[];
    setCharacterStatus?(characterId: string, status: string): Promise<void>;
    addOwnCharacter?(characterId: string): Promise<void>;
    removeOwnCharacter?(characterId: string): Promise<void>;
    addCharacter?(characterId: string): Promise<void>;
    removeCharacter?(characterId: string): Promise<void>;
    assignTravelRole?(role: string, characterId: string): Promise<void>;
    addResource?(resource: string, amount: number): Promise<void>;
    removeResource?(resource: string, amount: number): Promise<void>;
  }

  interface Item {
    name: string;
    type: string;
    system: any;
    update(data: any): Promise<Item>;
  }

  interface ChatMessage {
    content: string;
    speaker: any;
    flags?: Record<string, any>;
  }

  interface CompendiumCollection<T> {
    documentName: string;
    metadata: {
      id: string;
      label: string;
      package: string;
      type: string;
    };
    getDocuments(): Promise<T[]>;
  }

  namespace foundry {
    namespace utils {
      function randomID(): string;
      function deepClone<T>(obj: T): T;
    }
  }

  // Type aliases for commonly used patterns
  type ActorDataProperties = any;
  type ItemDataProperties = any;
}

// Export to make this a module
export {};