export const registerSettings = function() {
  // Register any module settings here
  game.settings.register('journeys-and-jamborees', 'enableHudButton', {
    name: 'Enable HUD Button',
    hint: 'Show a party management button on the token HUD when the party token is selected.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
  
  // Add new setting for pathfinder skill name
  game.settings.register("journeys-and-jamborees", "pathfinderSkillName", {
    name: "SETTINGS.PathfinderSkillName",
    hint: "SETTINGS.PathfinderSkillNameHint",
    scope: "world", 
    config: true,
    type: String,
    default: "Bushcraft"
  });
  
  // Add setting for auto-adding characters on party creation
  game.settings.register("journeys-and-jamborees", "autoAddCharactersOnCreation", {
    name: "SETTINGS.AutoAddCharactersOnCreation",
    hint: "SETTINGS.AutoAddCharactersOnCreationHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
};
