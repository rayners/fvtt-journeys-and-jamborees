export const registerHooks = function () {
  // Register hook for token HUD
  Hooks.on('renderTokenHUD', (app, html, data) => {
    // Check if the token is a party token
    const token = canvas.tokens?.get(data._id);
    if (!token) return;

    const actor = token.actor;
    if (!actor || actor.type !== 'party') return;

    // Check if HUD button is enabled
    if (!game.settings.get('journeys-and-jamborees', 'enableHudButton')) return;

    // Add a party management button to the HUD
    const hudButton = $(`
      <div class="control-icon party-management" title="Open Party Management">
        <i class="fas fa-users"></i>
      </div>
    `);

    hudButton.click(ev => {
      ev.preventDefault();
      ev.stopPropagation();
      actor.sheet.render(true);
    });

    html.find('.col.right').append(hudButton);
  });
};
