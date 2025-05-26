import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { FoodGatheringSystem } from '../src/food-gathering';
import { SkillRollTracker } from '../src/skill-roll-tracker';
import { FoodTablesManager } from '../src/food-tables';
import { SystemAdapterFactory } from '../src/system-adapter';

// Mock dependencies
vi.mock('../src/skill-roll-tracker');
vi.mock('../src/food-tables');
vi.mock('../src/system-adapter');

// Mock Foundry globals
const mockGame = {
  system: { id: 'dragonbane' },
  modules: {
    get: vi.fn().mockReturnValue({ active: true })
  },
  settings: {
    get: vi.fn()
  },
  i18n: {
    localize: (key: string) => key,
    format: (key: string, data: any) => `${key} ${JSON.stringify(data)}`
  }
};

const mockUi = {
  notifications: {
    info: vi.fn(),
    warn: vi.fn()
  }
};

const mockRoll = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  total: 4
};

// @ts-ignore
global.game = mockGame;
// @ts-ignore
global.ui = mockUi;
// @ts-ignore
global.Roll = vi.fn().mockImplementation(() => mockRoll);

describe('FoodGatheringSystem', () => {
  let foodSystem: FoodGatheringSystem;
  let mockTracker: any;
  let mockTablesManager: any;
  let mockAdapter: any;
  let mockActor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset singleton
    // @ts-ignore
    FoodGatheringSystem.instance = undefined;
    
    // Set up mocks
    mockTracker = {
      queueRoll: vi.fn(),
      getInstance: vi.fn()
    };
    (SkillRollTracker.getInstance as Mock).mockReturnValue(mockTracker);
    
    mockTablesManager = {
      rollHunting: vi.fn(),
      rollForaging: vi.fn()
    };
    (FoodTablesManager.getInstance as Mock).mockReturnValue(mockTablesManager);
    
    mockAdapter = {
      rollSkill: vi.fn(),
      triggerSkillRoll: vi.fn()
    };
    (SystemAdapterFactory.getAdapter as Mock).mockReturnValue(mockAdapter);
    
    // Mock actor with items
    mockActor = {
      id: 'actor123',
      uuid: 'Actor.actor123',
      items: []
    };
    
    // Configure settings
    mockGame.settings.get.mockImplementation((module: string, key: string) => {
      const settings: Record<string, any> = {
        'foodGatheringRollTimeout': 30,
        'huntingSkillName': 'hunting & fishing',
        'foragingSkillName': 'bushcraft'
      };
      return settings[key];
    });
    
    foodSystem = FoodGatheringSystem.getInstance();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rollSkillWithTracking', () => {
    it('should queue roll and wait for result', async () => {
      vi.useFakeTimers();
      
      let resolveCallback: ((success: boolean) => void) | null = null;
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        resolveCallback = callback;
        return 'roll-id-123';
      });
      
      const resultPromise = foodSystem['rollSkillWithTracking'](mockActor, 'bushcraft', 'hunt-tracking');
      
      // Verify notification was shown
      expect(mockUi.notifications.info).toHaveBeenCalledWith(
        'J&J.FoodGathering.WaitingForRoll {"skill":"bushcraft","timeout":30}'
      );
      
      // Verify roll was triggered
      expect(mockAdapter.triggerSkillRoll).toHaveBeenCalledWith(mockActor, 'bushcraft');
      
      // Simulate successful roll callback
      resolveCallback?.(true);
      
      const result = await resultPromise;
      expect(result).toEqual({ success: true });
      
      vi.useRealTimers();
    });

    it('should timeout after configured seconds', async () => {
      vi.useFakeTimers();
      
      mockTracker.queueRoll.mockImplementation(() => 'roll-id-123');
      
      const resultPromise = foodSystem['rollSkillWithTracking'](mockActor, 'bushcraft', 'hunt-tracking');
      
      // Fast forward past timeout
      vi.advanceTimersByTime(31000);
      
      const result = await resultPromise;
      
      expect(result).toEqual({ success: false });
      expect(mockUi.notifications.warn).toHaveBeenCalledWith('J&J.FoodGathering.RollTimeout');
      
      vi.useRealTimers();
    });
  });

  describe('hunt', () => {
    beforeEach(() => {
      // Set up successful tracking roll
      let trackingCallback: ((success: boolean) => void) | null = null;
      let killCallback: ((success: boolean) => void) | null = null;
      
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        if (purpose === 'hunt-tracking') {
          trackingCallback = callback;
        } else if (purpose === 'hunt-kill') {
          killCallback = callback;
        }
        // Simulate immediate success
        setTimeout(() => callback(true), 0);
        return 'roll-id-123';
      });
    });

    it('should successfully hunt with ranged weapon', async () => {
      // Add a bow to actor's inventory
      mockActor.items = [{
        type: 'weapon',
        system: {
          range: 20,
          features: { thrown: false },
          skill: { name: 'bows' }
        }
      }];
      
      // Mock successful hunting table result
      mockTablesManager.rollHunting.mockResolvedValue({
        animal: 'Deer',
        flags: {
          'journeys-and-jamborees': {
            rations: '2d6',
            requiresWeapon: true,
            canUseTrap: false
          }
        }
      });
      
      mockRoll.total = 8; // Rations roll result
      
      const result = await foodSystem.hunt(mockActor);
      
      expect(result).toMatchObject({
        success: true,
        animal: 'Deer',
        rations: 8,
        requiresWeapon: true,
        canUseTrap: false,
        description: expect.stringContaining('Deer')
      });
      
      // Verify both rolls were made
      expect(mockTracker.queueRoll).toHaveBeenCalledTimes(2);
      expect(mockTracker.queueRoll).toHaveBeenCalledWith('actor123', 'hunting & fishing', 'hunt-tracking', expect.any(Function), true);
      expect(mockTracker.queueRoll).toHaveBeenCalledWith('actor123', 'bows', 'hunt-kill', expect.any(Function), true);
    });

    it('should fail hunt if no proper equipment', async () => {
      // No weapons in inventory
      mockActor.items = [];
      
      // Mock hunting table result that requires weapon
      mockTablesManager.rollHunting.mockResolvedValue({
        animal: 'Wild Boar',
        flags: {
          'journeys-and-jamborees': {
            rations: '2d8',
            requiresWeapon: true,
            canUseTrap: false
          }
        }
      });
      
      const result = await foodSystem.hunt(mockActor);
      
      expect(result).toMatchObject({
        success: false,
        rations: 0,
        description: expect.stringContaining('Wild Boar')
      });
    });

    it('should handle boar attack on failed kill roll', async () => {
      // Add weapon
      mockActor.items = [{
        type: 'weapon',
        system: {
          range: 20,
          features: { thrown: false },
          skill: { name: 'bows' }
        }
      }];
      
      // Mock boar result
      mockTablesManager.rollHunting.mockResolvedValue({
        animal: 'Boar',
        flags: {
          'journeys-and-jamborees': {
            rations: '2d8',
            requiresWeapon: true
          }
        }
      });
      
      // Make kill roll fail
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        if (purpose === 'hunt-tracking') {
          setTimeout(() => callback(true), 0);
        } else if (purpose === 'hunt-kill') {
          setTimeout(() => callback(false), 0); // Fail the kill
        }
        return 'roll-id-123';
      });
      
      const result = await foodSystem.hunt(mockActor);
      
      expect(result).toMatchObject({
        success: false,
        rations: 0,
        description: 'J&J.FoodGathering.BoarAttacks',
        complications: 'J&J.FoodGathering.BoarAttacksDetail'
      });
    });

    it('should use trap for hunting if available and allowed', async () => {
      // Add trap to inventory
      mockActor.items = [{
        type: 'item',
        name: 'Hunting Trap'
      }];
      
      // Mock result that allows trap
      mockTablesManager.rollHunting.mockResolvedValue({
        animal: 'Rabbit',
        flags: {
          'journeys-and-jamborees': {
            rations: '1d4',
            requiresWeapon: false,
            canUseTrap: true
          }
        }
      });
      
      const result = await foodSystem.hunt(mockActor);
      
      expect(result.success).toBe(true);
      
      // Should use hunting skill for trap, not weapon skill
      expect(mockTracker.queueRoll).toHaveBeenCalledWith(
        'actor123', 
        'hunting & fishing', 
        'hunt-kill', 
        expect.any(Function),
        true
      );
    });
  });

  describe('fish', () => {
    it('should successfully fish with rod', async () => {
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        setTimeout(() => callback(true), 0);
        return 'roll-id-123';
      });
      
      mockRoll.total = 3; // 1d4 result
      
      const result = await foodSystem.fish(mockActor, true, false);
      
      expect(result).toMatchObject({
        success: true,
        rations: 3,
        description: expect.stringContaining('J&J.FoodGathering.FishingRod')
      });
      
      expect(Roll).toHaveBeenCalledWith('1d4');
    });

    it('should get more rations with net', async () => {
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        setTimeout(() => callback(true), 0);
        return 'roll-id-123';
      });
      
      mockRoll.total = 5; // 1d6 result
      
      const result = await foodSystem.fish(mockActor, false, true);
      
      expect(result).toMatchObject({
        success: true,
        rations: 5,
        description: expect.stringContaining('J&J.FoodGathering.FishingNet')
      });
      
      expect(Roll).toHaveBeenCalledWith('1d6');
    });

    it('should fail without fishing gear', async () => {
      const result = await foodSystem.fish(mockActor, false, false);
      
      expect(result).toMatchObject({
        success: false,
        rations: 0,
        description: 'J&J.FoodGathering.NoFishingGear'
      });
      
      // Should not attempt any rolls
      expect(mockTracker.queueRoll).not.toHaveBeenCalled();
    });
  });

  describe('forage', () => {
    beforeEach(() => {
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        setTimeout(() => callback(true), 0);
        return 'roll-id-123';
      });
    });

    it('should successfully forage in summer', async () => {
      mockTablesManager.rollForaging.mockResolvedValue({
        description: 'Wild berries',
        flags: {
          'journeys-and-jamborees': {
            rations: '1d3'
          }
        }
      });
      
      mockRoll.total = 2;
      
      const result = await foodSystem.forage(mockActor, 'summer');
      
      expect(result).toMatchObject({
        success: true,
        rations: 2,
        description: expect.stringContaining('Wild berries')
      });
    });

    it('should handle different seasons in description', async () => {
      mockTablesManager.rollForaging.mockResolvedValue({
        description: 'Mushrooms',
        flags: {
          'journeys-and-jamborees': {
            rations: '1d4'
          }
        }
      });
      
      const winterResult = await foodSystem.forage(mockActor, 'winter');
      expect(winterResult.description).toContain('J&J.FoodGathering.Season.winter');
      
      const fallResult = await foodSystem.forage(mockActor, 'fall');
      expect(fallResult.description).toContain('J&J.FoodGathering.Season.fall');
    });

    it('should handle failed foraging roll', async () => {
      mockTracker.queueRoll.mockImplementation((actorId: string, skill: string, purpose: string, callback: (success: boolean) => void, allowPush?: boolean) => {
        setTimeout(() => callback(false), 0);
        return 'roll-id-123';
      });
      
      const result = await foodSystem.forage(mockActor);
      
      expect(result).toMatchObject({
        success: false,
        rations: 0,
        description: 'J&J.FoodGathering.NothingFound'
      });
    });
  });

  describe('system availability checks', () => {
    it('should reject operations if not Dragonbane system', async () => {
      mockGame.system.id = 'dnd5e';
      
      const huntResult = await foodSystem.hunt(mockActor);
      expect(huntResult.success).toBe(false);
      expect(huntResult.description).toBe('J&J.FoodGathering.NotAvailable');
      
      const fishResult = await foodSystem.fish(mockActor, true, false);
      expect(fishResult.success).toBe(false);
      
      const forageResult = await foodSystem.forage(mockActor);
      expect(forageResult.success).toBe(false);
    });

    it('should reject operations if coreset not active', async () => {
      mockGame.modules.get.mockReturnValue({ active: false });
      
      const huntResult = await foodSystem.hunt(mockActor);
      expect(huntResult.success).toBe(false);
      expect(huntResult.description).toBe('J&J.FoodGathering.NotAvailable');
    });
  });
});