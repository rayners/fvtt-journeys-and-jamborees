export const registerHooks = function() {
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
  
  // Check for ARGON HUD integration
  Hooks.on('argonInit', (argon) => {
    argon.registerTool('party-management', {
      id: 'party-management',
      name: 'Party Management',
      icon: 'fas fa-users',
      visible: (token) => token?.actor?.type === 'party',
      onLeftClick: (token) => {
        if (token?.actor) token.actor.sheet.render(true);
      },
      onRightClick: (token) => {
        // Additional context menu options could go here
      }
    });
    
    // Add party-specific actions to ARGON HUD
    argon.registerAction('make-camp', {
      id: 'make-camp',
      name: 'Make Camp',
      icon: 'fas fa-campground',
      group: 'party',
      visible: (token) => token?.actor?.type === 'party',
      onLeftClick: (token) => {
        // Handle making camp
        ui.notifications.info('The party makes camp...');
      }
    });
    
    argon.registerAction('distribute-rations', {
      id: 'distribute-rations',
      name: 'Distribute Rations',
      icon: 'fas fa-utensils',
      group: 'party',
      visible: (token) => token?.actor?.type === 'party',
      onLeftClick: (token) => {
        // Handle distributing rations
        ui.notifications.info('Distributing rations...');
      }
    });
  });
};
