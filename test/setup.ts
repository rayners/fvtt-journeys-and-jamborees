// Test setup file for Vitest - J&J specific configuration
import { setupFoundryMocks } from './foundry-mocks';

// Set up Foundry mocks with J&J-specific configuration
setupFoundryMocks({
  systemId: 'dragonbane',
  user: { isGM: false, id: 'test-user' },
  includeCanvas: false // J&J doesn't need canvas for most tests
});

// J&J-specific game enhancements
if (globalThis.game) {
  // Add modules map for coreset detection
  globalThis.game.modules = new Map([
    ['dragonbane-coreset', { active: false }]
  ]);

  // Add tables map for FoodTablesManager
  globalThis.game.tables = {
    find: () => null
  };

  // Add folders for RollTable organization
  globalThis.game.folders = {
    find: () => null
  };

  // Set system to Dragonbane by default
  globalThis.game.system = {
    id: 'dragonbane',
    title: 'Dragonbane',
    data: {}
  };
}
