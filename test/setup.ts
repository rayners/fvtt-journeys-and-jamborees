// Test setup file for Vitest
import { vi } from 'vitest';

// Mock Foundry VTT globals that are typically available in the Foundry environment
declare global {
  var game: any;
  var ui: any;
  var canvas: any;
  var CONFIG: any;
  var foundry: any;
  var ChatMessage: any;
  var Actor: any;
  var ActorSheet: any;
  var Application: any;
  var FormApplication: any;
  var Dialog: any;
  var Handlebars: any;
  var Hooks: any;
  var loadTemplates: any;
  var renderTemplate: any;
  var getTemplate: any;
  var mergeObject: any;
  var duplicate: any;
  var setProperty: any;
  var getProperty: any;
  var hasProperty: any;
  var expandObject: any;
  var flattenObject: any;
  var isNewerVersion: any;
  var fromUuid: any;
  var fromUuidSync: any;
  var TextEditor: any;
}

// Mock basic Foundry globals
globalThis.game = {
  user: { isGM: false, id: 'test-user' },
  users: new Map(),
  actors: new Map(),
  settings: {
    get: vi.fn(),
    set: vi.fn(),
    register: vi.fn()
  },
  i18n: {
    localize: vi.fn((key: string) => key),
    format: vi.fn((key: string, data?: any) => key)
  },
  system: {
    id: 'dragonbane',
    title: 'Dragonbane',
    data: {}
  }
};

globalThis.ui = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
};

globalThis.CONFIG = {
  Actor: {
    documentClass: class MockActor {},
    typeLabels: {}
  },
  debug: {
    hooks: false
  }
};

globalThis.foundry = {
  abstract: {
    TypeDataModel: class MockTypeDataModel {
      constructor(data = {}) {
        Object.assign(this, data);
      }
      prepareDerivedData() {}
    }
  },
  data: {
    fields: {
      HTMLField: class {
        constructor(options = {}) { this.options = options; }
      },
      StringField: class {
        constructor(options = {}) { this.options = options; }
      },
      NumberField: class {
        constructor(options = {}) { 
          this.options = options;
          if (typeof options.initial === 'function') {
            this.initial = options.initial();
          } else {
            this.initial = options.initial || 0;
          }
        }
      },
      BooleanField: class {
        constructor(options = {}) { 
          this.options = options;
          this.initial = options.initial || false;
        }
      },
      ObjectField: class {
        constructor(options = {}) { this.options = options; }
      },
      SchemaField: class {
        constructor(schema = {}) { this.schema = schema; }
      },
      ArrayField: class {
        constructor(element) { this.element = element; }
      },
      DocumentIdField: class {
        constructor(options = {}) { this.options = options; }
      },
      FilePathField: class {
        constructor(options = {}) { this.options = options; }
      }
    }
  },
  utils: {
    mergeObject: vi.fn((original, other, options = {}) => ({ ...original, ...other })),
    duplicate: vi.fn((obj) => JSON.parse(JSON.stringify(obj))),
    setProperty: vi.fn(),
    getProperty: vi.fn(),
    hasProperty: vi.fn(),
    expandObject: vi.fn(),
    flattenObject: vi.fn(),
    isNewerVersion: vi.fn()
  }
};

// Mock Foundry classes
globalThis.Actor = class MockActor {
  static async create() {}
  static async createDocuments() {}
};

globalThis.ActorSheet = class MockActorSheet {};
globalThis.Application = class MockApplication {};
globalThis.FormApplication = class MockFormApplication {};

globalThis.Dialog = class MockDialog {
  static async confirm() {}
  static async prompt() {}
};

globalThis.ChatMessage = class MockChatMessage {
  static async create() {}
};

// Mock Handlebars
globalThis.Handlebars = {
  registerHelper: vi.fn(),
  registerPartial: vi.fn()
};

// Mock Hooks system
globalThis.Hooks = {
  on: vi.fn(),
  once: vi.fn(),
  off: vi.fn(),
  call: vi.fn(),
  callAll: vi.fn()
};

// Mock template functions
globalThis.loadTemplates = vi.fn().mockResolvedValue({});
globalThis.renderTemplate = vi.fn().mockResolvedValue('<div>Mock Template</div>');
globalThis.getTemplate = vi.fn().mockResolvedValue(() => '<div>Mock Template</div>');

// Mock utility functions  
globalThis.mergeObject = globalThis.foundry.utils.mergeObject;
globalThis.duplicate = globalThis.foundry.utils.duplicate;
globalThis.setProperty = globalThis.foundry.utils.setProperty;
globalThis.getProperty = globalThis.foundry.utils.getProperty;
globalThis.hasProperty = globalThis.foundry.utils.hasProperty;
globalThis.expandObject = globalThis.foundry.utils.expandObject;
globalThis.flattenObject = globalThis.foundry.utils.flattenObject;
globalThis.isNewerVersion = globalThis.foundry.utils.isNewerVersion;

globalThis.fromUuid = vi.fn();
globalThis.fromUuidSync = vi.fn();

globalThis.TextEditor = {
  enrichHTML: vi.fn((content) => content)
};