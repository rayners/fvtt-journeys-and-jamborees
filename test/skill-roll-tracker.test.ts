import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { SkillRollTracker } from '../src/skill-roll-tracker';

// Mock Foundry globals
const mockHooks = {
  on: vi.fn(),
  off: vi.fn()
};

const mockUser = {
  id: 'user123',
  getFlag: vi.fn(),
  setFlag: vi.fn(),
  unsetFlag: vi.fn()
};

const mockGame = {
  userId: 'user123',
  users: {
    get: vi.fn().mockReturnValue(mockUser)
  },
  i18n: {
    localize: (key: string) => {
      // Return specific text for push button label
      if (key === 'DoD.roll.pushButtonLabel') return 'Push';
      return key;
    }
  }
};

const mockFoundry = {
  utils: {
    randomID: vi.fn().mockReturnValue('test-id-123')
  }
};

// @ts-ignore
global.Hooks = mockHooks;
// @ts-ignore
global.game = mockGame;
// @ts-ignore
global.foundry = mockFoundry;

describe('SkillRollTracker', () => {
  let tracker: SkillRollTracker;
  let hookCallback: Function;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset singleton
    // @ts-ignore - accessing private property for testing
    SkillRollTracker.instance = undefined;

    // Capture the hook callback when registered
    mockHooks.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'createChatMessage') {
        hookCallback = callback;
      }
      return 1;
    });

    // Mock setInterval
    vi.useFakeTimers();

    tracker = SkillRollTracker.getInstance();
  });

  afterEach(() => {
    tracker.destroy();
    vi.useRealTimers();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SkillRollTracker.getInstance();
      const instance2 = SkillRollTracker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialization', () => {
    it('should register chat message hook', () => {
      expect(mockHooks.on).toHaveBeenCalledWith('createChatMessage', expect.any(Function));
    });

    it('should set up cleanup interval', () => {
      // Fast forward 1 minute
      vi.advanceTimersByTime(60000);

      // The cleanup method should have been called
      // We'll test the actual cleanup in another test
    });
  });

  describe('queueRoll', () => {
    it('should queue a pending roll and return ID', () => {
      const callback = vi.fn();
      const rollId = tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      expect(rollId).toBe('test-id-123');
      expect(mockUser.setFlag).toHaveBeenCalledWith(
        'journeys-and-jamborees',
        'pendingRolls',
        expect.objectContaining({
          'test-id-123': expect.objectContaining({
            id: 'test-id-123',
            actorId: 'actor123',
            skillName: 'bushcraft',
            purpose: 'hunt-tracking',
            timestamp: expect.any(Number)
          })
        })
      );
    });
  });

  describe('onChatMessage', () => {
    it('should handle successful skill roll message', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      const mockChatMessage = {
        content: `
          <div class="skill-roll" 
               data-actor-id="actor123" 
               data-skill-id="bushcraft" 
               data-target="15" 
               data-result="10">
            DoD.roll.success
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      expect(callback).toHaveBeenCalledWith(true);
      expect(mockUser.unsetFlag).toHaveBeenCalledWith(
        'journeys-and-jamborees',
        'pendingRolls.test-id-123'
      );
    });

    it('should handle failed skill roll message', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      const mockChatMessage = {
        content: `
          <div class="skill-roll" 
               data-actor-id="actor123" 
               data-skill-id="bushcraft" 
               data-target="15" 
               data-result="18">
            DoD.roll.failure
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should handle dragon (critical success) roll', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      const mockChatMessage = {
        content: `
          <div class="skill-roll" 
               data-actor-id="actor123" 
               data-skill-id="bushcraft" 
               data-target="15" 
               data-result="1">
            DoD.roll.dragon
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should handle demon (critical failure) roll', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      const mockChatMessage = {
        content: `
          <div class="skill-roll" 
               data-actor-id="actor123" 
               data-skill-id="bushcraft" 
               data-target="15" 
               data-result="20">
            DoD.roll.demon
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      expect(callback).toHaveBeenCalledWith(false);
    });

    it('should calculate success based on result vs target when no text indicator', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      const mockChatMessage = {
        content: `
          <div class="skill-roll" 
               data-actor-id="actor123" 
               data-skill-id="bushcraft" 
               data-target="15" 
               data-result="12">
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      // 12 <= 15, so success
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should ignore non-skill roll messages', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      const mockChatMessage = {
        content: '<div>Just a regular chat message</div>',
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should match actor by UUID or partial ID', async () => {
      const callback = vi.fn();
      tracker.queueRoll(
        'Scene.abc123.Token.def456.Actor.actor123',
        'bushcraft',
        'hunt-tracking',
        callback
      );

      const mockChatMessage = {
        content: `
          <div class="skill-roll" 
               data-actor-id="actor123" 
               data-skill-id="bushcraft" 
               data-target="15" 
               data-result="10">
            DoD.roll.success
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback(mockChatMessage);

      expect(callback).toHaveBeenCalledWith(true);
    });
  });

  describe('cleanupOldRolls', () => {
    it('should remove rolls older than 5 minutes', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Queue a roll
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback1);

      // Advance time by 4 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);

      // Queue another roll
      mockFoundry.utils.randomID.mockReturnValue('test-id-456');
      tracker.queueRoll('actor456', 'awareness', 'hunt-tracking', callback2);

      // Advance time by 2 more minutes (first roll is now 6 minutes old)
      vi.advanceTimersByTime(2 * 60 * 1000);

      // The cleanup should have removed the first roll
      expect(mockUser.unsetFlag).toHaveBeenCalledWith(
        'journeys-and-jamborees',
        'pendingRolls.test-id-123'
      );

      // But not the second roll
      expect(mockUser.unsetFlag).not.toHaveBeenCalledWith(
        'journeys-and-jamborees',
        'pendingRolls.test-id-456'
      );
    });
  });

  describe('push roll handling', () => {
    it('should detect failed rolls that can be pushed', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      // Failed roll with push button
      const failedRollMessage = {
        content: `
          <div class="skill-roll" data-actor-id="actor123" data-result="18" data-target="15">
            DoD.roll.failure
            <button class="chat-button push-roll" data-actor-id="actor123">
              Push
            </button>
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback?.(failedRollMessage);

      // Should not resolve immediately since it can be pushed
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle pushed rolls', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      // First: failed roll that can be pushed
      const failedRollMessage = {
        content: `
          <div class="skill-roll" data-actor-id="actor123" data-result="18" data-target="15">
            DoD.roll.failure
            <button class="chat-button push-roll" data-actor-id="actor123">
              Push
            </button>
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback?.(failedRollMessage);

      // Then: pushed roll (with isReroll flag)
      const pushedRollMessage = {
        content: `
          <div class="skill-roll" data-actor-id="actor123" data-result="12" data-target="15">
            DoD.roll.success
          </div>
        `,
        speaker: { actor: 'actor123' },
        flags: { dragonbane: { isReroll: true } }
      };

      // @ts-ignore
      await hookCallback?.(pushedRollMessage);

      // Now it should resolve with success
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should not wait for push on rolls marked as non-pushable', async () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback, false); // allowPush = false

      // Failed roll that would normally show push button
      const failedRollMessage = {
        content: `
          <div class="skill-roll" data-actor-id="actor123" data-result="18" data-target="15">
            DoD.roll.failure
            <button class="chat-button push-roll" data-actor-id="actor123">
              Push
            </button>
          </div>
        `,
        speaker: { actor: 'actor123' }
      };

      // @ts-ignore
      await hookCallback?.(failedRollMessage);

      // Should resolve immediately even though it has a push button
      expect(callback).toHaveBeenCalledWith(false);
    });
  });

  describe('destroy', () => {
    it('should unregister hook and clear pending rolls', () => {
      const callback = vi.fn();
      tracker.queueRoll('actor123', 'bushcraft', 'hunt-tracking', callback);

      tracker.destroy();

      expect(mockHooks.off).toHaveBeenCalledWith('createChatMessage', 1);

      // Try to trigger a chat message after destroy
      const mockChatMessage = {
        content: `<div class="skill-roll" data-actor-id="actor123">success</div>`,
        speaker: { actor: 'actor123' }
      };

      // This should not call the callback since the tracker is destroyed
      // @ts-ignore
      hookCallback?.(mockChatMessage);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
