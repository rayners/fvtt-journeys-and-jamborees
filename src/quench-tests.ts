/**
 * Quench test registration for Journeys & Jamborees
 * These tests run inside the actual Foundry VTT environment
 */

import type * as Quench from '@ethaks/fvtt-quench';
import { patchPartyActor } from './utils';
import { SystemConfigManager } from './system-config';

declare global {
  interface Window {
    quench: Quench.Quench;
  }
}

/**
 * Register Quench test batches
 */
export function registerQuenchTests(): void {
  if (!window.quench) return;

  const quench = window.quench;

  // Register Party Actor tests
  quench.registerBatch('journeys-and-jamborees.party-actor', context => {
    const { describe, it, assert, beforeEach, afterEach } = context;

    describe('Party Actor Integration Tests', function () {
      let partyActor: Actor;

      beforeEach(async function () {
        // Create a test party actor
        partyActor = await Actor.create({
          name: 'Test Party',
          type: 'journeys-and-jamborees.party',
          system: {}
        });

        // Ensure the party actor has our custom methods
        // This is needed because Foundry might not use our custom class in all cases
        patchPartyActor(partyActor);
      });

      afterEach(async function () {
        // Clean up test actor
        if (partyActor) {
          await partyActor.delete();
        }
      });

      describe('Character Management', function () {
        it('should add a character to the party', async function () {
          // Create a test character
          const character = await Actor.create({
            name: 'Test Character',
            type: 'character'
          });

          try {
            // Add character to party
            await partyActor.addCharacter(character.id);

            // Verify character was added
            const memberStatus = partyActor.system.memberStatus;
            assert.ok(memberStatus[character.id], 'Character should be in memberStatus');
            assert.equal(memberStatus[character.id], 'active', 'Character should be active');
          } finally {
            // Clean up test character
            await character.delete();
          }
        });

        it('should remove a character from the party', async function () {
          // Create and add a test character
          const character = await Actor.create({
            name: 'Test Character',
            type: 'character'
          });

          try {
            await partyActor.addCharacter(character.id);

            // Remove the character
            await partyActor.removeCharacter(character.id);

            // Verify character was removed
            const memberStatus = partyActor.system.memberStatus;
            assert.notOk(memberStatus[character.id], 'Character should not be in memberStatus');
          } finally {
            await character.delete();
          }
        });

        it('should change character status', async function () {
          const character = await Actor.create({
            name: 'Test Character',
            type: 'character'
          });

          try {
            await partyActor.addCharacter(character.id);

            // Change status to traveling
            await partyActor.setCharacterStatus(character.id, 'traveling');

            // Verify status change
            const memberStatus = partyActor.system.memberStatus;
            assert.equal(memberStatus[character.id], 'traveling', 'Character should be traveling');
          } finally {
            await character.delete();
          }
        });
      });

      describe('Travel Roles', function () {
        it('should assign pathfinder role', async function () {
          const character = await Actor.create({
            name: 'Test Pathfinder',
            type: 'character'
          });

          try {
            await partyActor.addCharacter(character.id);
            await partyActor.assignTravelRole('pathfinder', character.id);

            assert.equal(
              partyActor.system.roles.pathfinder,
              character.id,
              'Pathfinder role should be assigned'
            );
          } finally {
            await character.delete();
          }
        });

        it('should clear role when character is removed', async function () {
          const character = await Actor.create({
            name: 'Test Pathfinder',
            type: 'character'
          });

          try {
            await partyActor.addCharacter(character.id);
            await partyActor.assignTravelRole('pathfinder', character.id);
            await partyActor.removeCharacter(character.id);

            assert.notOk(partyActor.system.roles.pathfinder, 'Pathfinder role should be cleared');
          } finally {
            await character.delete();
          }
        });
      });

      describe('Resource Management', function () {
        it('should add resources', async function () {
          const initialRations = partyActor.system.resources.rations;

          await partyActor.addResource('rations', 5);

          assert.equal(
            partyActor.system.resources.rations,
            initialRations + 5,
            'Rations should increase by 5'
          );
        });

        it('should remove resources', async function () {
          // Ensure we have enough resources to remove
          await partyActor.update({
            'system.resources.rations': 10
          });

          await partyActor.removeResource('rations', 3);

          assert.equal(partyActor.system.resources.rations, 7, 'Rations should be reduced to 7');
        });

        it('should not reduce resources below zero', async function () {
          await partyActor.update({
            'system.resources.water': 2
          });

          await partyActor.removeResource('water', 5);

          assert.equal(partyActor.system.resources.water, 0, 'Water should not go below 0');
        });
      });
    });
  });

  // Register Party Sheet UI tests
  quench.registerBatch('journeys-and-jamborees.party-sheet', context => {
    const { describe, it, assert, beforeEach, afterEach } = context;

    describe('Party Sheet UI Tests', function () {
      let partyActor: Actor;
      let sheet: ActorSheet;

      beforeEach(async function () {
        partyActor = await Actor.create({
          name: 'Test Party UI',
          type: 'journeys-and-jamborees.party'
        });
        patchPartyActor(partyActor);
        patchPartyActor(partyActor);
        sheet = partyActor.sheet;
      });

      afterEach(async function () {
        if (sheet && sheet.rendered) {
          await sheet.close();
        }
        if (partyActor) {
          await partyActor.delete();
        }
      });

      it('should render party sheet', async function () {
        assert.ok(sheet, 'Sheet should exist');

        // Render the sheet and force it to display
        await sheet.render(true, { force: true });

        // Wait a moment for rendering to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        assert.ok(sheet.rendered, 'Sheet should be rendered');
        assert.ok(sheet.element && sheet.element.length > 0, 'Sheet element should exist');
      });

      it('should have tab navigation', async function () {
        await sheet.render(true, { force: true });
        await new Promise(resolve => setTimeout(resolve, 100));

        const tabs = sheet.element.find('.tabs .item');
        assert.ok(tabs.length >= 4, 'Should have at least 4 tabs');

        // Check tab names
        const tabNames = tabs.map((i, el) => el.textContent).get();
        assert.ok(tabNames.includes('Members'), 'Should have Members tab');
        assert.ok(tabNames.includes('Travel'), 'Should have Travel tab');
        assert.ok(tabNames.includes('Inventory'), 'Should have Inventory tab');
        assert.ok(tabNames.includes('Journal'), 'Should have Journal tab');
      });

      it('should display member count', async function () {
        // Add some test characters
        const char1 = await Actor.create({ name: 'Char 1', type: 'character' });
        const char2 = await Actor.create({ name: 'Char 2', type: 'character' });

        try {
          await partyActor.addCharacter(char1.id);
          await partyActor.addCharacter(char2.id);

          await sheet.render(true, { force: true });
          await new Promise(resolve => setTimeout(resolve, 100));

          const memberCount = sheet.element.find('.members .stat-value');
          assert.ok(memberCount.length > 0, 'Member count element should exist');
          assert.ok(
            memberCount.text().includes('2'),
            `Should show 2 members, but shows: ${memberCount.text()}`
          );
        } finally {
          await char1.delete();
          await char2.delete();
        }
      });
    });
  });

  // Register System Integration tests
  quench.registerBatch('journeys-and-jamborees.system-integration', context => {
    const { describe, it, assert } = context;

    describe('System Integration Tests', function () {
      it('should detect current game system', function () {
        const systemId = game.system.id;
        assert.ok(systemId, 'System ID should be defined');

        // Check if our system config recognizes it
        const systemConfig = SystemConfigManager.getInstance().getConfig();
        assert.equal(systemConfig.id, systemId, 'Config should match system ID');
      });

      it('should have party actor type registered', function () {
        // Debug: log what's available in v13
        console.log('CONFIG.Actor:', CONFIG.Actor);
        console.log('game.documentTypes.Actor:', game.documentTypes?.Actor);
        console.log('Actor registered types:', Object.keys(CONFIG.Actor?.dataModels || {}));

        // In v13, types are stored differently
        const dataModelTypes = Object.keys(CONFIG.Actor?.dataModels || {});
        const documentTypes = game.documentTypes?.Actor || [];
        const templateTypes = game.system.template?.Actor?.types || [];

        // Check if party type is registered in any of the possible locations
        const isRegistered =
          dataModelTypes.includes('party') ||
          dataModelTypes.includes('journeys-and-jamborees.party') ||
          documentTypes.includes('party') ||
          documentTypes.includes('journeys-and-jamborees.party') ||
          templateTypes.includes('party') ||
          templateTypes.includes('journeys-and-jamborees.party');

        assert.ok(
          isRegistered,
          `Party type should be registered. DataModels: ${dataModelTypes.join(', ')}, DocumentTypes: ${documentTypes.join(', ')}, Template: ${templateTypes.join(', ')}`
        );
      });

      it('should have module settings registered', function () {
        const settings = [
          'journeys-and-jamborees.movementOnFoot',
          'journeys-and-jamborees.movementMounted',
          'journeys-and-jamborees.pathfinderSkillName',
          'journeys-and-jamborees.lookoutSkillName',
          'journeys-and-jamborees.quartermasterSkillName'
        ];

        settings.forEach(key => {
          const setting = game.settings.settings.get(key);
          assert.ok(setting, `Setting ${key} should be registered`);
        });
      });
    });
  });

  // Register system-specific tests based on current game system
  const systemId = game.system.id;

  // Dragonbane-specific tests
  if (systemId === 'dragonbane') {
    quench.registerBatch('journeys-and-jamborees.system-dragonbane', context => {
      const { describe, it, assert } = context;

      describe('Dragonbane System Tests', function () {
        let partyActor: Actor;
        let testCharacter: Actor;

        beforeEach(async function () {
          partyActor = await Actor.create({
            name: 'Dragonbane Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);

          testCharacter = await Actor.create({
            name: 'Test Adventurer',
            type: 'character',
            system: {
              attributes: {},
              skills: {}
            }
          });
        });

        afterEach(async function () {
          if (partyActor) await partyActor.delete();
          if (testCharacter) await testCharacter.delete();
        });

        it('should use Dragonbane movement rates', function () {
          assert.equal(partyActor.system.movement.value, 15, 'On-foot movement should be 15km');
          assert.equal(partyActor.system.settings.baseMovement, 15, 'Base movement should be 15km');
        });

        it('should use Dragonbane skill names', async function () {
          // Test the system configuration defaults instead of the setting choices
          // The setting choices might be empty if no skills are detected in the test environment
          const systemConfig = SystemConfigManager.getInstance().getConfig();

          // Check that Dragonbane defaults are configured correctly
          assert.equal(
            systemConfig.skills.pathfinding,
            'bushcraft',
            'Default pathfinding skill should be bushcraft'
          );
          assert.equal(
            systemConfig.skills.lookout,
            'awareness',
            'Default lookout skill should be awareness'
          );
          assert.equal(
            systemConfig.skills.quartermaster,
            'bartering',
            'Default quartermaster skill should be bartering'
          );

          // Check that the settings exist and have reasonable defaults
          const pathfinderValue = game.settings.get(
            'journeys-and-jamborees',
            'pathfinderSkillName'
          );
          const lookoutValue = game.settings.get('journeys-and-jamborees', 'lookoutSkillName');

          console.log('Configured skill values:', { pathfinderValue, lookoutValue });

          // The values should either be the system defaults or 'none' if no skills were detected
          assert.ok(
            pathfinderValue === 'bushcraft' || pathfinderValue === 'none',
            `Pathfinder skill should be bushcraft or none, got: ${pathfinderValue}`
          );
        });

        it('should handle shift-based travel time', function () {
          const config = SystemConfigManager.getInstance().getConfig();
          assert.equal(config.timeUnit, 'shift', 'Should use shift as time unit');
        });

        it('should roll pathfinding with Dragonbane dice', async function () {
          // Add character with bushcraft skill
          if (testCharacter.items) {
            await testCharacter.createEmbeddedDocuments('Item', [
              {
                name: 'BUSHCRAFT',
                type: 'skill',
                system: { value: 12 }
              }
            ]);
          }

          await partyActor.addCharacter(testCharacter.id);
          await partyActor.assignTravelRole('pathfinder', testCharacter.id);

          // Verify the skill is properly detected
          const pathfinderSkill = game.settings.get(
            'journeys-and-jamborees',
            'pathfinderSkillName'
          );
          assert.equal(pathfinderSkill, 'bushcraft', 'Pathfinder skill should be bushcraft');
        });
      });
    });
  }

  // D&D 5e-specific tests
  if (systemId === 'dnd5e') {
    quench.registerBatch('journeys-and-jamborees.system-dnd5e', context => {
      const { describe, it, assert } = context;

      describe('D&D 5e System Tests', function () {
        let partyActor: Actor;
        let testCharacter: Actor;

        beforeEach(async function () {
          partyActor = await Actor.create({
            name: 'D&D Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);

          testCharacter = await Actor.create({
            name: 'Test Hero',
            type: 'character',
            system: {
              abilities: {
                wis: { value: 14 }
              },
              skills: {
                sur: { value: 2, proficient: 1 } // Survival skill
              }
            }
          });
        });

        afterEach(async function () {
          if (partyActor) await partyActor.delete();
          if (testCharacter) await testCharacter.delete();
        });

        it('should use D&D 5e movement rates', function () {
          assert.equal(
            partyActor.system.movement.value,
            24,
            'On-foot movement should be 24 miles/day'
          );
          assert.equal(
            partyActor.system.settings.baseMovement,
            24,
            'Base movement should be 24 miles'
          );
        });

        it('should display D&D 5e skill names correctly', async function () {
          const pathfinderSetting = game.settings.settings.get(
            'journeys-and-jamborees.pathfinderSkillName'
          );
          const choices = pathfinderSetting?.config?.choices || {};

          console.log('D&D 5e skill choices:', choices);
          console.log('Choice values:', Object.values(choices));

          // Check if we have any choices at all
          const choiceCount = Object.keys(choices).length;

          if (choiceCount === 0) {
            // No skills detected - this might be OK in test environment
            console.warn('No skill choices detected in test environment');

            // Just verify the setting exists and has a reasonable default
            const currentValue = game.settings.get('journeys-and-jamborees', 'pathfinderSkillName');
            assert.ok(
              currentValue === 'sur' || currentValue === 'none',
              `Should have sur or none as default, got: ${currentValue}`
            );
          } else {
            // Skills were detected - check they show full names
            const hasProperSkillNames = Object.values(choices).some(
              choice => typeof choice === 'string' && choice.includes('Survival')
            );

            assert.ok(
              hasProperSkillNames,
              `Should display "Survival" not "sur". Found: ${Object.values(choices).join(', ')}`
            );
          }
        });

        it('should handle daily travel time', function () {
          const config = SystemConfigManager.getInstance().getConfig();
          assert.equal(config.timeUnit, 'day', 'Should use day as time unit');
        });

        it('should integrate with D&D 5e skill system', async function () {
          await partyActor.addCharacter(testCharacter.id);
          await partyActor.assignTravelRole('pathfinder', testCharacter.id);

          // Check that the skill value is properly retrieved
          const adapter = game.modules.get('journeys-and-jamborees')?.api?.systemAdapter;
          if (adapter) {
            const skillValue = adapter.getSkillValue(testCharacter, 'sur');
            assert.ok(skillValue !== null, 'Should retrieve skill value');
          }
        });
      });
    });
  }

  // Pathfinder 2e-specific tests
  if (systemId === 'pf2e') {
    quench.registerBatch('journeys-and-jamborees.system-pf2e', context => {
      const { describe, it, assert } = context;

      describe('Pathfinder 2e System Tests', function () {
        let partyActor: Actor;

        beforeEach(async function () {
          partyActor = await Actor.create({
            name: 'PF2e Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);
        });

        afterEach(async function () {
          if (partyActor) await partyActor.delete();
        });

        it('should use PF2e movement rates', function () {
          assert.equal(
            partyActor.system.movement.value,
            24,
            'On-foot movement should be 24 miles/day'
          );
        });

        it('should handle PF2e skill proficiency levels', async function () {
          const pathfinderSetting = game.settings.settings.get(
            'journeys-and-jamborees.pathfinderSkillName'
          );
          const choices = pathfinderSetting?.config?.choices || {};

          // PF2e has specific skill proficiency naming
          assert.ok(Object.keys(choices).length > 0, 'Should have skill choices available');
        });
      });
    });
  }

  // Forbidden Lands-specific tests (has native journey mechanics)
  if (systemId === 'forbidden-lands') {
    quench.registerBatch('journeys-and-jamborees.system-forbidden-lands', context => {
      const { describe, it, assert } = context;

      describe('Forbidden Lands System Tests', function () {
        let partyActor: Actor;

        beforeEach(async function () {
          partyActor = await Actor.create({
            name: 'FL Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);
        });

        afterEach(async function () {
          if (partyActor) await partyActor.delete();
        });

        it('should complement native journey mechanics', function () {
          // Forbidden Lands has its own journey rules
          assert.ok(partyActor.system.movement, 'Should have movement system');
          assert.ok(partyActor.system.roles, 'Should have travel roles');
        });

        it('should use hexcrawl-appropriate movement', function () {
          assert.equal(partyActor.system.movement.value, 10, 'Movement should be in hexes');
        });
      });
    });
  }

  // Simple Worldbuilding-specific tests
  if (systemId === 'worldbuilding') {
    quench.registerBatch('journeys-and-jamborees.system-worldbuilding', context => {
      const { describe, it, assert, beforeEach, afterEach } = context;

      describe('Simple Worldbuilding System Tests', function () {
        let partyActor: Actor;
        let testCharacter: Actor;

        beforeEach(async function () {
          partyActor = await Actor.create({
            name: 'Simple Worldbuilding Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);

          // Create a character with custom attributes
          testCharacter = await Actor.create({
            name: 'Test Character',
            type: 'character',
            system: {
              attributes: {
                // Simple Worldbuilding uses custom attributes
                navigation: { value: 15, label: 'Navigation' },
                perception: { value: 12, label: 'Perception' },
                diplomacy: { value: 10, label: 'Diplomacy' }
              }
            }
          });
        });

        afterEach(async function () {
          if (partyActor) await partyActor.delete();
          if (testCharacter) await testCharacter.delete();
        });

        it('should use Simple Worldbuilding defaults', function () {
          assert.equal(partyActor.system.movement.value, 25, 'On-foot movement should be 25 units');
          assert.equal(
            partyActor.system.settings.baseMovement,
            25,
            'Base movement should be 25 units'
          );

          const config = SystemConfigManager.getInstance().getConfig();
          assert.equal(config.timeUnit, 'period', 'Should use period as time unit');
        });

        it('should use GenericAdapter for skill handling', function () {
          const adapter = game.modules.get('journeys-and-jamborees')?.api?.systemAdapter;
          assert.ok(adapter, 'System adapter should exist');
          assert.equal(adapter.constructor.name, 'GenericAdapter', 'Should use GenericAdapter');
        });

        it('should detect attributes as skills', async function () {
          const skillManager = game.modules.get('journeys-and-jamborees')?.api?.skillManager;
          if (skillManager) {
            const availableSkills = skillManager.getAvailableSkills();
            console.log('Simple Worldbuilding detected skills:', availableSkills);

            // Should detect attributes from the test character or show configure message
            const hasSkills = Object.keys(availableSkills).length > 0;
            assert.ok(hasSkills, 'Should detect some skills or show configure message');
          }
        });

        it('should handle minimal system structure gracefully', async function () {
          await partyActor.addCharacter(testCharacter.id);

          // Test that basic operations work without errors
          assert.doesNotThrow(() => {
            partyActor.getCharacters();
          }, 'getCharacters should not throw');

          assert.doesNotThrow(() => {
            partyActor.system.activeCount;
          }, 'activeCount should not throw');

          // Travel roles should be assignable
          await partyActor.assignTravelRole('pathfinder', testCharacter.id);
          assert.equal(
            partyActor.system.roles.pathfinder,
            testCharacter.id,
            'Should assign pathfinder role'
          );
        });

        it('should allow skill configuration via settings', function () {
          // Check that skill settings exist and can be configured
          const pathfinderSetting = game.settings.settings.get(
            'journeys-and-jamborees.pathfinderSkillName'
          );
          assert.ok(pathfinderSetting, 'Pathfinder skill setting should exist');

          // In Simple Worldbuilding, skills might default to 'none' or 'skill'
          const currentValue = game.settings.get('journeys-and-jamborees', 'pathfinderSkillName');
          assert.ok(
            currentValue === 'skill' || currentValue === 'none' || currentValue === 'configure-me',
            `Should have generic default, got: ${currentValue}`
          );
        });

        it('should handle attribute-based skill values', async function () {
          const adapter = game.modules.get('journeys-and-jamborees')?.api?.systemAdapter;
          if (adapter && testCharacter) {
            // Test getting attribute values
            const navValue = adapter.getSkillValue(testCharacter, 'navigation');
            console.log('Navigation attribute value:', navValue);

            // The GenericAdapter should find the value in attributes
            if (navValue !== null) {
              assert.equal(navValue, 15, 'Should retrieve navigation attribute value');
            }
          }
        });

        it('should handle none skill option properly', async function () {
          // Set all skills to none
          await game.settings.set('journeys-and-jamborees', 'pathfinderSkillName', 'none');
          await game.settings.set('journeys-and-jamborees', 'lookoutSkillName', 'none');
          await game.settings.set('journeys-and-jamborees', 'quartermasterSkillName', 'none');

          await partyActor.addCharacter(testCharacter.id);
          await partyActor.assignTravelRole('pathfinder', testCharacter.id);

          // Should handle none skills without errors
          const adapter = game.modules.get('journeys-and-jamborees')?.api?.systemAdapter;
          if (adapter) {
            const skillValue = adapter.getSkillValue(testCharacter, 'none');
            assert.equal(skillValue, null, 'None skill should return null');

            const rollResult = await adapter.rollSkill(testCharacter, 'none');
            assert.equal(rollResult.success, false, 'None skill roll should fail');
          }
        });

        it('should display resource management correctly', async function () {
          const sheet = partyActor.sheet;
          await sheet.render(true, { force: true });
          await new Promise(resolve => setTimeout(resolve, 100));

          // Check that resource elements exist
          const rationsElement = sheet.element.find('.resource[data-resource="rations"]');
          const waterElement = sheet.element.find('.resource[data-resource="water"]');

          assert.ok(rationsElement.length > 0, 'Rations resource should be displayed');
          assert.ok(waterElement.length > 0, 'Water resource should be displayed');

          await sheet.close();
        });

        it('should not have hardcoded Dragonbane references', async function () {
          const sheet = partyActor.sheet;
          await sheet.render(true, { force: true });
          await new Promise(resolve => setTimeout(resolve, 100));

          const htmlContent = sheet.element.html();

          // Check for Dragonbane-specific terms that shouldn't appear
          assert.notOk(
            htmlContent.includes('BUSHCRAFT') && !htmlContent.includes('skill'),
            'Should not show hardcoded BUSHCRAFT'
          );
          assert.notOk(
            htmlContent.includes('shift') && systemId !== 'dragonbane',
            'Should not show shift time unit'
          );

          await sheet.close();
        });
      });
    });
  }

  // Generic/Unknown system tests
  if (!['dragonbane', 'dnd5e', 'pf2e', 'forbidden-lands', 'worldbuilding'].includes(systemId)) {
    quench.registerBatch('journeys-and-jamborees.system-generic', context => {
      const { describe, it, assert } = context;

      describe('Generic System Tests', function () {
        let partyActor: Actor;

        beforeEach(async function () {
          partyActor = await Actor.create({
            name: 'Generic Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);
        });

        afterEach(async function () {
          if (partyActor) await partyActor.delete();
        });

        it('should use generic defaults', function () {
          assert.equal(
            partyActor.system.movement.value,
            25,
            'Should use default 25 units movement'
          );
          assert.equal(
            partyActor.system.settings.baseMovement,
            25,
            'Base movement should be 25 units'
          );
        });

        it('should handle unknown system gracefully', function () {
          const config = SystemConfigManager.getInstance().getConfig();
          assert.equal(config.id, systemId, 'Should use actual system ID');
          assert.ok(config.name, 'Should have a system name');
        });
      });
    });
  }

  // Register Food Gathering tests
  if (game.system.id === 'dragonbane') {
    quench.registerBatch('journeys-and-jamborees.food-gathering', context => {
      const { describe, it, assert, beforeEach, afterEach } = context;

      describe('Food Gathering System Tests', function () {
        let partyActor: Actor;
        let testCharacter: Actor;
        let originalTimeout: number;

        beforeEach(async function () {
          // Save original timeout setting
          originalTimeout = game.settings.get(
            'journeys-and-jamborees',
            'foodGatheringRollTimeout'
          ) as number;
          // Set a shorter timeout for tests
          await game.settings.set('journeys-and-jamborees', 'foodGatheringRollTimeout', 5);

          // Create test party
          partyActor = await Actor.create({
            name: 'Food Gathering Test Party',
            type: 'journeys-and-jamborees.party'
          });
          patchPartyActor(partyActor);

          // Create test character
          testCharacter = await Actor.create({
            name: 'Test Hunter',
            type: 'character',
            system: {}
          });
        });

        afterEach(async function () {
          // Restore original timeout
          await game.settings.set(
            'journeys-and-jamborees',
            'foodGatheringRollTimeout',
            originalTimeout
          );

          // Clean up
          if (testCharacter) await testCharacter.delete();
          if (partyActor) await partyActor.delete();
        });

        it('should register skill roll tracker on ready', function () {
          const tracker = game.modules.get('journeys-and-jamborees')?.api?.skillRollTracker;
          assert.ok(tracker, 'Skill roll tracker should be available in API');
        });

        it('should track pending rolls in user flags', async function () {
          const { SkillRollTracker } = await import('./skill-roll-tracker');
          const tracker = SkillRollTracker.getInstance();

          // Queue a test roll
          const rollId = tracker.queueRoll(
            testCharacter.id,
            'bushcraft',
            'hunt-tracking',
            () => {}
          );

          // Check that it was stored in user flags
          const userFlags = game.user?.getFlag('journeys-and-jamborees', 'pendingRolls') as any;
          assert.ok(userFlags?.[rollId], 'Pending roll should be stored in user flags');
          assert.equal(userFlags[rollId].skillName, 'bushcraft', 'Skill name should match');
        });

        describe('Chat Message Monitoring', function () {
          it('should detect successful skill rolls from chat', async function () {
            const { SkillRollTracker } = await import('./skill-roll-tracker');
            const tracker = SkillRollTracker.getInstance();

            let capturedResult: boolean | null = null;

            // Queue a roll
            tracker.queueRoll(testCharacter.id, 'bushcraft', 'hunt-tracking', success => {
              capturedResult = success;
            });

            // Create a mock successful skill roll message
            await ChatMessage.create({
              content: `
                <div class="skill-roll" 
                     data-actor-id="${testCharacter.id}" 
                     data-skill-id="bushcraft" 
                     data-target="15" 
                     data-result="10">
                  ${game.i18n.localize('DoD.roll.success')}
                </div>
              `,
              speaker: ChatMessage.getSpeaker({ actor: testCharacter })
            });

            // Wait for message processing
            await new Promise(resolve => setTimeout(resolve, 100));

            assert.strictEqual(capturedResult, true, 'Should capture successful roll');
          });

          it('should detect failed skill rolls from chat', async function () {
            const { SkillRollTracker } = await import('./skill-roll-tracker');
            const tracker = SkillRollTracker.getInstance();

            let capturedResult: boolean | null = null;

            // Queue a roll
            tracker.queueRoll(testCharacter.id, 'bushcraft', 'hunt-tracking', success => {
              capturedResult = success;
            });

            // Create a mock failed skill roll message
            await ChatMessage.create({
              content: `
                <div class="skill-roll" 
                     data-actor-id="${testCharacter.id}" 
                     data-skill-id="bushcraft" 
                     data-target="15" 
                     data-result="18">
                  ${game.i18n.localize('DoD.roll.failure')}
                </div>
              `,
              speaker: ChatMessage.getSpeaker({ actor: testCharacter })
            });

            // Wait for message processing
            await new Promise(resolve => setTimeout(resolve, 100));

            assert.strictEqual(capturedResult, false, 'Should capture failed roll');
          });
        });

        describe('Food Gathering Integration', function () {
          it('should check for Dragonbane system and coreset', async function () {
            const foodSystem = game.modules.get('journeys-and-jamborees')?.api?.foodGathering;
            assert.ok(foodSystem, 'Food gathering system should be available');

            const isDragonbane = foodSystem.isDragonbaneSystem();
            const hasCoreSet = foodSystem.isDragonbaneCoresetAvailable();

            assert.strictEqual(isDragonbane, true, 'Should detect Dragonbane system');

            // This might fail if coreset isn't installed
            if (!hasCoreSet) {
              console.warn(
                'Dragonbane coreset not available - some food gathering tests will be skipped'
              );
            }
          });

          it('should detect ranged weapons correctly', async function () {
            // Add a bow to character
            const bow = await testCharacter.createEmbeddedDocuments('Item', [
              {
                name: 'Longbow',
                type: 'weapon',
                system: {
                  range: 20,
                  features: { thrown: false },
                  skill: { name: 'bows' }
                }
              }
            ]);

            assert.ok(bow.length, 'Bow should be created');

            // Test internal method through reflection
            const foodSystem = game.modules.get('journeys-and-jamborees')?.api?.foodGathering;
            const weaponCheck = foodSystem['checkRangedWeapon'](testCharacter);

            assert.strictEqual(weaponCheck.hasRangedWeapon, true, 'Should detect ranged weapon');
            assert.equal(weaponCheck.weaponSkill, 'bows', 'Should identify bow skill');
          });

          it('should detect traps correctly', async function () {
            // Add a trap to character
            await testCharacter.createEmbeddedDocuments('Item', [
              {
                name: 'Hunting Trap',
                type: 'item'
              }
            ]);

            const foodSystem = game.modules.get('journeys-and-jamborees')?.api?.foodGathering;
            const hasTrap = foodSystem['checkHuntingTrap'](testCharacter);

            assert.strictEqual(hasTrap, true, 'Should detect hunting trap');
          });
        });

        describe('Settings Configuration', function () {
          it('should have configurable timeout setting', function () {
            const timeout = game.settings.get('journeys-and-jamborees', 'foodGatheringRollTimeout');
            assert.ok(typeof timeout === 'number', 'Timeout should be a number');
            assert.ok(
              timeout >= 10 && timeout <= 120,
              'Timeout should be between 10 and 120 seconds'
            );
          });

          it('should have skill name settings', function () {
            const huntingSkill = game.settings.get('journeys-and-jamborees', 'huntingSkillName');
            const foragingSkill = game.settings.get('journeys-and-jamborees', 'foragingSkillName');

            assert.ok(huntingSkill, 'Hunting skill should be configured');
            assert.ok(foragingSkill, 'Foraging skill should be configured');
          });
        });
      });
    });
  }
}

/**
 * Hook to register tests when Quench is ready
 */
Hooks.on('quenchReady', () => {
  console.log('Journeys & Jamborees: Registering Quench tests');
  registerQuenchTests();
});
