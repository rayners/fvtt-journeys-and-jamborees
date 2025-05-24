import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patchPartyActor } from '@/utils';
import { PartyActorType } from '@/party-actor';

// Mock the PartyActorType
vi.mock('@/party-actor', () => ({
  PartyActorType: {
    prototype: {
      setCharacterStatus: vi.fn(),
      assignTravelRole: vi.fn(),
      addResource: vi.fn(),
      removeResource: vi.fn(),
      distributeResources: vi.fn(),
      makeCamp: vi.fn(),
      rollPathfinding: vi.fn(),
      toggleMounted: vi.fn(),
      addAllCharactersAsActive: vi.fn(),
      addCharacter: vi.fn(),
      removeCharacter: vi.fn(),
      removeAllCharacters: vi.fn(),
      removeOwnCharacters: vi.fn(),
      grantOwnershipToPlayers: vi.fn(),
      _updateOwnershipAfterRemoval: vi.fn(),
      _resetOwnershipToGMOnly: vi.fn()
    }
  }
}));

describe('utils', () => {
  describe('patchPartyActor', () => {
    let mockActor: any;
    
    beforeEach(() => {
      mockActor = {
        type: 'party',
        name: 'Test Party'
      };
      vi.clearAllMocks();
    });

    it('should not patch actors that are null/undefined', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      patchPartyActor(null);
      patchPartyActor(undefined);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not patch non-party actors', () => {
      const nonPartyActor = { type: 'character', name: 'Test Character' };
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      patchPartyActor(nonPartyActor);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should patch party actors missing methods', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      patchPartyActor(mockActor);
      
      expect(consoleSpy).toHaveBeenCalledWith('Patching party actor with missing methods:', 'Test Party');
      expect(mockActor.setCharacterStatus).toBeDefined();
      expect(mockActor.assignTravelRole).toBeDefined();
      expect(mockActor.addResource).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('should not patch actors that already have the methods', () => {
      mockActor.setCharacterStatus = vi.fn();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      patchPartyActor(mockActor);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle alternate party type names', () => {
      mockActor.type = 'journeys-and-jamborees.party';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      patchPartyActor(mockActor);
      
      expect(consoleSpy).toHaveBeenCalledWith('Patching party actor with missing methods:', 'Test Party');
      consoleSpy.mockRestore();
    });
  });
});