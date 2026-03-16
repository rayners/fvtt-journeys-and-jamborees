import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/system-config', () => ({
  SystemConfigManager: {
    getInstance: () => ({
      getConfig: () => ({
        movement: { onFoot: { value: 15, unit: 'km' }, mounted: { value: 30, unit: 'km' } },
        assets: { defaultPartyImage: 'icons/svg/mystery-man.svg' }
      }),
      getMovementRate: (mounted: boolean) => ({ value: mounted ? 30 : 15, unit: 'km' }),
      getSkillName: (skill: string) => skill,
      getDiceFormula: () => '1d20',
      getConfig: () => ({
        timeUnit: 'day',
        movement: { onFoot: { value: 15, unit: 'km' }, mounted: { value: 30, unit: 'km' } },
        assets: { defaultPartyImage: 'icons/svg/mystery-man.svg' }
      })
    })
  }
}));

vi.mock('@/activity-data', async () => {
  const actual = await vi.importActual('@/activity-data');
  return actual;
});

import { PartyActorType } from '@/party-actor';

function makePartyActor(overrides: Partial<any> = {}): PartyActorType {
  const actor = new PartyActorType(
    {
      _id: 'party-actor-id',
      name: 'Test Party',
      type: 'journeys-and-jamborees.party',
      system: {
        memberStatus: { char1: 'active', char2: 'active' },
        formation: [],
        activities: {},
        lightStatus: {},
        resources: { rations: 5, water: 5 },
        ...overrides.system
      },
      ...overrides
    },
    {}
  );
  return actor;
}

describe('PartyActorType new methods', () => {
  let actor: PartyActorType;
  let updateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    actor = makePartyActor();
    updateSpy = vi.fn().mockResolvedValue(undefined);
    (actor as any).update = updateSpy;
    (actor as any).system = {
      memberStatus: { char1: 'active', char2: 'active' },
      formation: [],
      activities: {},
      lightStatus: {},
      resources: { rations: 5, water: 5 }
    };
  });

  describe('setFormationOrder', () => {
    it('should save ordered character IDs to system.formation', async () => {
      await actor.setFormationOrder(['char2', 'char1']);
      expect(updateSpy).toHaveBeenCalledWith({ 'system.formation': ['char2', 'char1'] });
    });

    it('should accept empty array', async () => {
      await actor.setFormationOrder([]);
      expect(updateSpy).toHaveBeenCalledWith({ 'system.formation': [] });
    });
  });

  describe('setCharacterActivity', () => {
    it('should assign an activity to a character', async () => {
      await actor.setCharacterActivity('char1', 'pathfind');
      expect(updateSpy).toHaveBeenCalledWith({
        'system.activities': {
          char1: { activity: 'pathfind', target: undefined, customSkill: undefined }
        }
      });
    });

    it('should assign activity with a target character', async () => {
      await actor.setCharacterActivity('char1', 'support', 'char2');
      expect(updateSpy).toHaveBeenCalledWith({
        'system.activities': {
          char1: { activity: 'support', target: 'char2', customSkill: undefined }
        }
      });
    });

    it('should assign activity with a custom skill', async () => {
      await actor.setCharacterActivity('char1', 'other', undefined, 'Swimming');
      expect(updateSpy).toHaveBeenCalledWith({
        'system.activities': {
          char1: { activity: 'other', target: undefined, customSkill: 'Swimming' }
        }
      });
    });

    it('should preserve existing activity assignments for other characters', async () => {
      (actor as any).system.activities = { char2: { activity: 'watch', target: undefined, customSkill: undefined } };
      await actor.setCharacterActivity('char1', 'cook');
      const callArg = updateSpy.mock.calls[0][0]['system.activities'];
      expect(callArg.char1).toBeDefined();
      expect(callArg.char2).toBeDefined();
      expect(callArg.char2.activity).toBe('watch');
    });
  });

  describe('clearCharacterActivity', () => {
    it('should remove a character activity using Foundry deletion syntax', async () => {
      await actor.clearCharacterActivity('char1');
      expect(updateSpy).toHaveBeenCalledWith({ 'system.activities.-=char1': null });
    });
  });

  describe('toggleCharacterLight', () => {
    it('should toggle light from false to true', async () => {
      (actor as any).system.lightStatus = { char1: false };
      await actor.toggleCharacterLight('char1');
      const callArg = updateSpy.mock.calls[0][0]['system.lightStatus'];
      expect(callArg.char1).toBe(true);
    });

    it('should toggle light from true to false', async () => {
      (actor as any).system.lightStatus = { char1: true };
      await actor.toggleCharacterLight('char1');
      const callArg = updateSpy.mock.calls[0][0]['system.lightStatus'];
      expect(callArg.char1).toBe(false);
    });

    it('should treat undefined as false (toggle to true)', async () => {
      (actor as any).system.lightStatus = {};
      await actor.toggleCharacterLight('char1');
      const callArg = updateSpy.mock.calls[0][0]['system.lightStatus'];
      expect(callArg.char1).toBe(true);
    });
  });

  describe('scanPartyInventory', () => {
    beforeEach(() => {
      // Mock getCharacters to return test actors
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: {
            currency: { gc: 10, sc: 5, cc: 0 }
          },
          items: [
            {
              name: 'Longsword',
              type: 'weapon',
              img: 'icons/sword.webp',
              system: {
                quantity: 1,
                worn: true,
                memento: false,
                storage: false,
                features: ['edged', 'parrying'],
                damage: '2d8',
                itemDescription: 'A fine longsword.'
              }
            },
            {
              name: 'Torches',
              type: 'item',
              img: 'icons/torch.webp',
              system: {
                quantity: 3,
                worn: false,
                memento: false,
                storage: false,
                features: []
              }
            }
          ]
        },
        {
          name: 'Legolas',
          img: 'icons/legolas.webp',
          system: {
            currency: { gc: 2, sc: 0, cc: 10 }
          },
          items: [
            {
              name: 'Longbow',
              type: 'weapon',
              img: 'icons/bow.webp',
              system: {
                quantity: 1,
                worn: false,
                memento: false,
                storage: false,
                features: ['ranged'],
                itemDescription: 'A beautiful elven longbow.'
              }
            }
          ]
        }
      ]);
    });

    it('should aggregate currency from all characters', () => {
      const inv = actor.scanPartyInventory();
      expect(inv['Gold']).toBeDefined();
      expect(inv['Gold'].totalQty).toBe(12); // 10 + 2
      expect(inv['Silver']).toBeDefined();
      expect(inv['Silver'].totalQty).toBe(5);
      expect(inv['Copper']).toBeDefined();
      expect(inv['Copper'].totalQty).toBe(10);
    });

    it('should aggregate weapons correctly', () => {
      const inv = actor.scanPartyInventory();
      expect(inv['Longsword']).toBeDefined();
      expect(inv['Longsword'].category).toBe('weapon');
      expect(inv['Longsword'].totalQty).toBe(1);
      expect(inv['Longsword'].owners['Aragorn'].equipped).toBe(true);
    });

    it('should stack items across characters', () => {
      // Both have torches
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [{ name: 'Torch', type: 'item', img: 'icons/torch.webp', system: { quantity: 2, worn: false, memento: false, storage: false } }]
        },
        {
          name: 'Legolas',
          img: 'icons/legolas.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [{ name: 'Torch', type: 'item', img: 'icons/torch.webp', system: { quantity: 3, worn: false, memento: false, storage: false } }]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Torch'].totalQty).toBe(5);
      expect(Object.keys(inv['Torch'].owners)).toHaveLength(2);
    });

    it('should skip stored items', () => {
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [
            { name: 'Stored Sword', type: 'weapon', img: 'icons/sword.webp', system: { quantity: 1, worn: false, memento: false, storage: true } },
            { name: 'Dagger', type: 'weapon', img: 'icons/dagger.webp', system: { quantity: 1, worn: false, memento: false, storage: false } }
          ]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Stored Sword']).toBeUndefined();
      expect(inv['Dagger']).toBeDefined();
    });

    it('should skip ignored items', () => {
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [
            { name: 'Unarmed', type: 'weapon', img: 'icons/fist.webp', system: { quantity: 1, worn: false, memento: false, storage: false } },
            { name: 'Dagger', type: 'weapon', img: 'icons/dagger.webp', system: { quantity: 1, worn: false, memento: false, storage: false } }
          ]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Unarmed']).toBeUndefined();
      expect(inv['Dagger']).toBeDefined();
    });

    it('should handle mementos correctly', () => {
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [
            { name: 'Silver Ring', type: 'item', img: 'icons/ring.webp', system: { quantity: 1, worn: false, memento: true, storage: false } }
          ]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Silver Ring']).toBeDefined();
      expect(inv['Silver Ring'].category).toBe('memento');
    });

    it('should handle spells and magic tricks', () => {
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Gandalf',
          img: 'icons/wizard.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [
            { name: 'Fireball', type: 'spell', img: 'icons/fire.webp', system: { rank: 3, memorized: true } },
            { name: 'Light', type: 'spell', img: 'icons/light.webp', system: { rank: 0, memorized: false } }
          ]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Fireball']).toBeDefined();
      expect(inv['Fireball'].category).toBe('spell_book');
      expect(inv['Fireball'].hasPreparedInstance).toBe(true);
      expect(inv['Light']).toBeDefined();
      expect(inv['Light'].category).toBe('magic_trick');
    });

    it('should use itemDescription (Dragonbane v3 API)', () => {
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [
            { name: 'Sword', type: 'weapon', img: 'icons/sword.webp', system: { quantity: 1, worn: false, memento: false, storage: false, itemDescription: 'A fine blade.', description: 'Old description' } }
          ]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Sword'].desc).toBe('A fine blade.');
    });

    it('should join features array to string (Dragonbane v3 API)', () => {
      (actor as any).getCharacters = vi.fn().mockReturnValue([
        {
          name: 'Aragorn',
          img: 'icons/aragorn.webp',
          system: { currency: { gc: 0, sc: 0, cc: 0 } },
          items: [
            { name: 'Axe', type: 'weapon', img: 'icons/axe.webp', system: { quantity: 1, worn: false, memento: false, storage: false, features: ['edged', 'slow'] } }
          ]
        }
      ]);
      const inv = actor.scanPartyInventory();
      expect(inv['Axe'].stats['Features']).toBe('edged, slow');
    });
  });
});
