/**
 * Register keybindings for the module
 */
export function registerKeybindings(): void {
  // Register the party sheet keybinding
  game.keybindings.register('journeys-and-jamborees', 'openPartySheet', {
    name: 'J&J.Keybindings.OpenPartySheet',
    hint: 'J&J.Keybindings.OpenPartySheetHint',
    editable: [{ key: 'KeyP' }],
    onDown: () => {
      openPartySheet();
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
}

/**
 * Open the party sheet for the user
 * If multiple party actors exist that the user has permission to view,
 * it will open the first one found.
 */
function openPartySheet(): void {
  // Find all party actors the user has permission to view
  const partyActors = game.actors.filter(actor => {
    const isPartyActor = actor.type === 'party' || actor.type === 'journeys-and-jamborees.party';
    const hasPermission = actor.testUserPermission(game.user, 'OBSERVER');
    return isPartyActor && hasPermission;
  });

  if (partyActors.length === 0) {
    ui.notifications.warn(game.i18n.localize('J&J.Keybindings.NoPartyFound'));
    return;
  }

  // If there's only one party actor, open it
  if (partyActors.length === 1) {
    partyActors[0].sheet.render(true);
    return;
  }

  // If there are multiple party actors, prioritize owned ones
  const ownedPartyActors = partyActors.filter(actor =>
    actor.testUserPermission(game.user, 'OWNER')
  );

  if (ownedPartyActors.length > 0) {
    // Open the first owned party actor
    ownedPartyActors[0].sheet.render(true);
  } else {
    // Open the first viewable party actor
    partyActors[0].sheet.render(true);
  }

  // If multiple party actors exist, inform the user
  if (partyActors.length > 1) {
    ui.notifications.info(
      game.i18n.format('J&J.Keybindings.MultiplePartiesFound', {
        count: partyActors.length
      })
    );
  }
}
