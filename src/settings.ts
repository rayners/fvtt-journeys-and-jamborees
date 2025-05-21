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
};
