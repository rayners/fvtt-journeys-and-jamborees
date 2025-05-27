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
  });
});
