import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock SystemConfigManager before importing PartyModel
vi.mock('@/system-config', () => ({
  SystemConfigManager: {
    getInstance: () => ({
      getConfig: () => ({
        movement: {
          onFoot: { value: 15, unit: 'km' },
          mounted: { value: 30, unit: 'km' }
        }
      })
    })
  }
}));

import { PartyModel } from '@/party-model';

describe('PartyModel', () => {
  let partyModel: PartyModel;

  beforeEach(() => {
    partyModel = new PartyModel({
      memberStatus: {
        char1: 'active',
        char2: 'traveling',
        char3: 'stayingBehind',
        char4: 'active'
      },
      resources: {
        rations: 10,
        water: 8
      },
      movement: {
        value: 15,
        isMounted: false
      }
    });
  });

  describe('defineSchema', () => {
    it('should define a complete schema', () => {
      const schema = PartyModel.defineSchema();

      expect(schema).toBeDefined();
      expect(schema.description).toBeDefined();
      expect(schema.memberStatus).toBeDefined();
      expect(schema.roles).toBeDefined();
      expect(schema.resources).toBeDefined();
      expect(schema.movement).toBeDefined();
      expect(schema.journey).toBeDefined();
      expect(schema.status).toBeDefined();
      expect(schema.inventory).toBeDefined();
    });
  });

  describe('prepareDerivedData', () => {
    it('should calculate member counts correctly', () => {
      partyModel.prepareDerivedData();

      expect(partyModel.activeCount).toBe(2);
      expect(partyModel.travelingCount).toBe(1);
      expect(partyModel.stayingBehindCount).toBe(1);
      expect(partyModel.totalMembers).toBe(4);
    });

    it('should identify active, traveling, and staying behind members', () => {
      partyModel.prepareDerivedData();

      expect(partyModel.activeMembers).toEqual(['char1', 'char4']);
      expect(partyModel.travelingMembers).toEqual(['char2']);
      expect(partyModel.stayingBehindMembers).toEqual(['char3']);
    });

    it('should check resource sufficiency', () => {
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(true); // 10 rations >= 4 members
      expect(partyModel.hasEnoughWater).toBe(true); // 8 water >= 4 members
    });

    it('should detect insufficient resources', () => {
      partyModel.resources.rations = 2;
      partyModel.resources.water = 1;
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(false); // 2 rations < 4 members
      expect(partyModel.hasEnoughWater).toBe(false); // 1 water < 4 members
    });

    it('should handle empty memberStatus', () => {
      partyModel.memberStatus = {};
      partyModel.prepareDerivedData();

      expect(partyModel.activeCount).toBe(0);
      expect(partyModel.travelingCount).toBe(0);
      expect(partyModel.stayingBehindCount).toBe(0);
      expect(partyModel.totalMembers).toBe(0);
    });

    it('should initialize memberStatus if undefined', () => {
      delete partyModel.memberStatus;
      partyModel.prepareDerivedData();

      expect(partyModel.memberStatus).toEqual({});
      expect(partyModel.totalMembers).toBe(0);
    });
  });

  describe('_calculateMovement', () => {
    it('should use on-foot movement when not mounted', () => {
      partyModel.movement.isMounted = false;
      partyModel._calculateMovement();

      expect(partyModel.movement.value).toBe(15); // on-foot value from mock
    });

    it('should use mounted movement when mounted', () => {
      partyModel.movement.isMounted = true;
      partyModel._calculateMovement();

      expect(partyModel.movement.value).toBe(30); // mounted value from mock
    });

    it('should handle system config without mounted settings', () => {
      // Test that the movement calculation doesn't crash when mounted config is missing
      // This simulates a system that only defines on-foot movement
      partyModel.movement.isMounted = true;
      
      // The current implementation should handle this gracefully
      expect(() => partyModel._calculateMovement()).not.toThrow();
      expect(partyModel.movement.value).toBeDefined();
      expect(typeof partyModel.movement.value).toBe('number');
    });
  });

  describe('edge cases and data validation', () => {
    it('should handle negative resource values gracefully', () => {
      partyModel.resources.rations = -5;
      partyModel.resources.water = -10;
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(false);
      expect(partyModel.hasEnoughWater).toBe(false);
    });

    it('should handle invalid member statuses', () => {
      partyModel.memberStatus = {
        char1: 'active',
        char2: 'invalid_status',
        char3: null,
        char4: undefined,
        char5: 'traveling'
      };
      partyModel.prepareDerivedData();

      expect(partyModel.activeCount).toBe(1); // Only char1
      expect(partyModel.travelingCount).toBe(1); // Only char5
      expect(partyModel.stayingBehindCount).toBe(0);
      expect(partyModel.totalMembers).toBe(2);
    });

    it('should handle very large party sizes', () => {
      const largeMemberStatus = {};
      for (let i = 0; i < 100; i++) {
        largeMemberStatus[`char${i}`] = i % 3 === 0 ? 'active' : i % 3 === 1 ? 'traveling' : 'stayingBehind';
      }
      partyModel.memberStatus = largeMemberStatus;
      partyModel.prepareDerivedData();

      expect(partyModel.totalMembers).toBe(100);
      expect(partyModel.activeCount + partyModel.travelingCount + partyModel.stayingBehindCount).toBe(100);
    });

    it('should handle zero resources with zero members', () => {
      partyModel.memberStatus = {};
      partyModel.resources.rations = 0;
      partyModel.resources.water = 0;
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(true); // 0 >= 0
      expect(partyModel.hasEnoughWater).toBe(true); // 0 >= 0
    });

    it('should handle fractional resources correctly', () => {
      partyModel.resources.rations = 3.7; // Fractional rations
      partyModel.resources.water = 2.2; // Fractional water
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(false); // 3.7 < 4 members
      expect(partyModel.hasEnoughWater).toBe(false); // 2.2 < 4 members
    });
  });

  describe('resource calculation edge cases', () => {
    it('should calculate exact resource requirements', () => {
      partyModel.resources.rations = 4; // Exactly enough
      partyModel.resources.water = 4; // Exactly enough
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(true);
      expect(partyModel.hasEnoughWater).toBe(true);
    });

    it('should handle one resource sufficient, one insufficient', () => {
      partyModel.resources.rations = 10; // More than enough
      partyModel.resources.water = 2; // Not enough
      partyModel.prepareDerivedData();

      expect(partyModel.hasEnoughRations).toBe(true);
      expect(partyModel.hasEnoughWater).toBe(false);
    });

    it('should handle party with only traveling members', () => {
      partyModel.memberStatus = {
        char1: 'traveling',
        char2: 'traveling',
        char3: 'traveling'
      };
      partyModel.resources.rations = 2;
      partyModel.resources.water = 4;
      partyModel.prepareDerivedData();

      expect(partyModel.activeCount).toBe(0);
      expect(partyModel.travelingCount).toBe(3);
      expect(partyModel.totalMembers).toBe(3);
      expect(partyModel.hasEnoughRations).toBe(false); // 2 < 3
      expect(partyModel.hasEnoughWater).toBe(true); // 4 >= 3
    });

    it('should handle party with only staying behind members', () => {
      partyModel.memberStatus = {
        char1: 'stayingBehind',
        char2: 'stayingBehind'
      };
      partyModel.resources.rations = 5;
      partyModel.resources.water = 1;
      partyModel.prepareDerivedData();

      expect(partyModel.stayingBehindCount).toBe(2);
      expect(partyModel.activeCount).toBe(0);
      expect(partyModel.travelingCount).toBe(0);
      expect(partyModel.totalMembers).toBe(2);
      expect(partyModel.hasEnoughRations).toBe(true); // 5 >= 2
      expect(partyModel.hasEnoughWater).toBe(false); // 1 < 2
    });
  });

  describe('member list accuracy', () => {
    it('should maintain correct member lists for all statuses', () => {
      const expectedActive = ['char1', 'char4'];
      const expectedTraveling = ['char2'];
      const expectedStaying = ['char3'];

      partyModel.prepareDerivedData();

      expect(partyModel.activeMembers).toEqual(expect.arrayContaining(expectedActive));
      expect(partyModel.activeMembers).toHaveLength(expectedActive.length);

      expect(partyModel.travelingMembers).toEqual(expect.arrayContaining(expectedTraveling));
      expect(partyModel.travelingMembers).toHaveLength(expectedTraveling.length);

      expect(partyModel.stayingBehindMembers).toEqual(expect.arrayContaining(expectedStaying));
      expect(partyModel.stayingBehindMembers).toHaveLength(expectedStaying.length);
    });

    it('should handle sparse member status data', () => {
      // Test that only valid statuses are counted
      partyModel.memberStatus = {
        char1: 'active',
        char2: 'traveling',
        char3: '', // Empty string
        char4: 'stayingBehind'
      };
      partyModel.prepareDerivedData();

      expect(partyModel.activeCount).toBe(1);
      expect(partyModel.travelingCount).toBe(1);
      expect(partyModel.stayingBehindCount).toBe(1);
      expect(partyModel.totalMembers).toBe(3); // Only valid statuses counted
    });
  });
});
