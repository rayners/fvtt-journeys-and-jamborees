import { SystemConfigManager } from './system-config';
import { SkillManager } from './skill-manager';

export const registerSettings = function () {
  // Register any module settings here
  game.settings.register('journeys-and-jamborees', 'enableHudButton', {
    name: 'Enable HUD Button',
    hint: 'Show a party management button on the token HUD when the party token is selected.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // System Configuration Settings
  game.settings.register('journeys-and-jamborees', 'movementOnFoot', {
    name: 'SETTINGS.MovementOnFoot',
    hint: 'SETTINGS.MovementOnFootHint',
    scope: 'world',
    config: true,
    type: Number,
    default: SystemConfigManager.getInstance().getConfig().movement.onFoot.value,
    onChange: value => updateSystemConfig()
  });

  game.settings.register('journeys-and-jamborees', 'movementMounted', {
    name: 'SETTINGS.MovementMounted',
    hint: 'SETTINGS.MovementMountedHint',
    scope: 'world',
    config: true,
    type: Number,
    default: SystemConfigManager.getInstance().getConfig().movement.mounted.value,
    onChange: value => updateSystemConfig()
  });

  game.settings.register('journeys-and-jamborees', 'movementUnit', {
    name: 'SETTINGS.MovementUnit',
    hint: 'SETTINGS.MovementUnitHint',
    scope: 'world',
    config: true,
    type: String,
    default: SystemConfigManager.getInstance().getConfig().movement.onFoot.unit,
    onChange: value => updateSystemConfig()
  });

  // Skill settings will be registered after the game is ready

  // Dice configuration
  game.settings.register('journeys-and-jamborees', 'randomEncounterDice', {
    name: 'SETTINGS.RandomEncounterDice',
    hint: 'SETTINGS.RandomEncounterDiceHint',
    scope: 'world',
    config: true,
    type: String,
    default: SystemConfigManager.getInstance().getConfig().dice.randomEncounter,
    onChange: value => updateSystemConfig()
  });

  game.settings.register('journeys-and-jamborees', 'encounterThreshold', {
    name: 'SETTINGS.EncounterThreshold',
    hint: 'SETTINGS.EncounterThresholdHint',
    scope: 'world',
    config: true,
    type: Number,
    default: SystemConfigManager.getInstance().getConfig().dice.encounterThreshold,
    onChange: value => updateSystemConfig()
  });

  game.settings.register('journeys-and-jamborees', 'weatherDice', {
    name: 'SETTINGS.WeatherDice',
    hint: 'SETTINGS.WeatherDiceHint',
    scope: 'world',
    config: true,
    type: String,
    default: SystemConfigManager.getInstance().getConfig().dice.weather,
    onChange: value => updateSystemConfig()
  });

  // Add setting for auto-adding characters on party creation
  game.settings.register('journeys-and-jamborees', 'autoAddCharactersOnCreation', {
    name: 'SETTINGS.AutoAddCharactersOnCreation',
    hint: 'SETTINGS.AutoAddCharactersOnCreationHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  // Food gathering roll timeout
  game.settings.register('journeys-and-jamborees', 'foodGatheringRollTimeout', {
    name: 'SETTINGS.FoodGatheringRollTimeout',
    hint: 'SETTINGS.FoodGatheringRollTimeoutHint',
    scope: 'world',
    config: true,
    type: Number,
    default: 30,
    range: {
      min: 10,
      max: 120,
      step: 5
    }
  });
};

/**
 * Update the system configuration from settings
 */
function updateSystemConfig() {
  const config = {
    movement: {
      onFoot: {
        value: game.settings.get('journeys-and-jamborees', 'movementOnFoot'),
        unit: game.settings.get('journeys-and-jamborees', 'movementUnit')
      },
      mounted: {
        value: game.settings.get('journeys-and-jamborees', 'movementMounted'),
        unit: game.settings.get('journeys-and-jamborees', 'movementUnit')
      }
    },
    skills: {
      // Try to get skill settings if they exist, otherwise use defaults
      pathfinding: game.settings.settings.has('journeys-and-jamborees.pathfinderSkillName')
        ? game.settings.get('journeys-and-jamborees', 'pathfinderSkillName')
        : SystemConfigManager.getInstance().getConfig().skills.pathfinding,
      lookout: game.settings.settings.has('journeys-and-jamborees.lookoutSkillName')
        ? game.settings.get('journeys-and-jamborees', 'lookoutSkillName')
        : SystemConfigManager.getInstance().getConfig().skills.lookout,
      quartermaster: game.settings.settings.has('journeys-and-jamborees.quartermasterSkillName')
        ? game.settings.get('journeys-and-jamborees', 'quartermasterSkillName')
        : SystemConfigManager.getInstance().getConfig().skills.quartermaster
    },
    dice: {
      randomEncounter: game.settings.get('journeys-and-jamborees', 'randomEncounterDice'),
      encounterThreshold: game.settings.get('journeys-and-jamborees', 'encounterThreshold'),
      weather: game.settings.get('journeys-and-jamborees', 'weatherDice')
    }
  };

  SystemConfigManager.getInstance().updateFromSettings(config);
}
