import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemConfigManager } from '@/system-config';

describe('SystemConfigManager', () => {
  let configManager: SystemConfigManager;

  beforeEach(() => {
    // Reset the singleton instance before each test
    (SystemConfigManager as any)._instance = null;
    
    // Mock game.system
    global.game = {
      system: { id: 'dragonbane' }
    };
    
    configManager = SystemConfigManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = SystemConfigManager.getInstance();
      const instance2 = SystemConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('getConfig', () => {
    it('should return Dragonbane config when system is dragonbane', () => {
      global.game.system.id = 'dragonbane';
      const config = configManager.getConfig();
      
      expect(config.id).toBe('dragonbane');
      expect(config.name).toBe('Dragonbane');
      expect(config.movement.onFoot.value).toBe(15);
      expect(config.movement.onFoot.unit).toBe('km');
      expect(config.skills.pathfinding).toBe('bushcraft');
    });

    it('should return D&D 5e config when system is dnd5e', () => {
      global.game.system.id = 'dnd5e';
      global.game.system.title = 'D&D 5th Edition';
      configManager = new SystemConfigManager(); // Create new instance
      const config = configManager.getConfig();
      
      expect(config.id).toBe('dnd5e');
      expect(config.name).toBe('D&D 5th Edition');
      expect(config.movement.onFoot.value).toBe(24);
      expect(config.movement.onFoot.unit).toBe('miles');
      expect(config.skills.pathfinding).toBe('sur'); // Actual value is 'sur', not 'survival'
    });

    it('should return default config for unknown systems', () => {
      global.game.system.id = 'unknown-system';
      global.game.system.title = 'Unknown System';
      configManager = new SystemConfigManager();
      const config = configManager.getConfig();
      
      expect(config.id).toBe('unknown-system'); // Uses system id, not 'generic'
      expect(config.name).toBe('Unknown System'); // Uses system title
      expect(config.movement.onFoot.value).toBe(25); // Default config value
      expect(config.movement.onFoot.unit).toBe('units');
    });
  });

  describe('getMovementRate', () => {
    it('should return on-foot movement when not mounted', () => {
      const movement = configManager.getMovementRate(false);
      
      expect(movement.value).toBe(15);
      expect(movement.unit).toBe('km');
    });

    it('should return mounted movement when mounted', () => {
      const movement = configManager.getMovementRate(true);
      
      expect(movement.value).toBe(30);
      expect(movement.unit).toBe('km');
    });
  });

  describe('getSkillName', () => {
    it('should return skill name for pathfinding role', () => {
      const skillName = configManager.getSkillName('pathfinding');
      expect(skillName).toBe('bushcraft');
    });

    it('should return skill name for lookout role', () => {
      const skillName = configManager.getSkillName('lookout');
      expect(skillName).toBe('awareness');
    });
  });

  describe('getDiceFormula', () => {
    it('should return dice formula for random encounter', () => {
      const formula = configManager.getDiceFormula('randomEncounter');
      expect(formula).toBe('1d20');
    });

    it('should return encounter threshold', () => {
      const threshold = configManager.getDiceFormula('encounterThreshold');
      expect(threshold).toBe(18);
    });
  });

  describe('isKnownSystem', () => {
    it('should return true for dragonbane system', () => {
      global.game.system.id = 'dragonbane';
      expect(configManager.isKnownSystem()).toBe(true);
    });

    it('should return false for unknown system', () => {
      global.game.system.id = 'unknown-system';
      configManager = new SystemConfigManager();
      expect(configManager.isKnownSystem()).toBe(false);
    });
  });
});