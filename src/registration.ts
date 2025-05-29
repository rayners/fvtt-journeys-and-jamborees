// Import required classes
import { PartyActorType } from './party-actor';
import { PartyModel } from './party-model';
import { PartyActorSheet } from './party-sheet';

/**
 * Handles registration of the party actor type with Foundry VTT
 */
export const registerPartyActorType = function () {
  // Define both the clean and namespaced types
  const cleanType = 'party';
  const namespacedType = 'journeys-and-jamborees.party';
  const doubleNamespacedType = 'journeys-and-jamborees.journeys-and-jamborees.party';

  // Register the actor type only once
  console.log('Journeys & Jamborees | Registering party actor type');

  // 1. Register data model
  if (CONFIG.Actor?.dataModels) {
    // Clean up any existing registrations
    for (const key in CONFIG.Actor.dataModels) {
      if (key.includes('party') || key.includes('journeys-and-jamborees')) {
        delete CONFIG.Actor.dataModels[key];
      }
    }

    // Register our model
    Object.assign(CONFIG.Actor.dataModels, {
      [cleanType]: PartyModel,
      [namespacedType]: PartyModel // Register both types
    });
    console.log('Journeys & Jamborees | PartyModel added');
  } else {
    console.warn('Journeys & Jamborees | CONFIG.Actor.dataModels not available yet');
  }

  // 2. Add to actor types array
  if (CONFIG.Actor?.types) {
    // Remove any existing 'party' or legacy types from the array
    CONFIG.Actor.types = CONFIG.Actor.types.filter(type => {
      return !(type.includes('party') || type.includes('journeys-and-jamborees'));
    });

    // Add both our types
    CONFIG.Actor.types.push(cleanType);
    CONFIG.Actor.types.push(namespacedType);
  } else {
    console.warn('Journeys & Jamborees | CONFIG.Actor.types not available yet');
  }

  // 2b. Add to system template if it exists
  // Skip for Simple Worldbuilding as it has strict template requirements
  if (game.system?.template?.Actor?.types && game.system.id !== 'worldbuilding') {
    if (!game.system.template.Actor.types.includes(cleanType)) {
      game.system.template.Actor.types.push(cleanType);
    }
    if (!game.system.template.Actor.types.includes(namespacedType)) {
      game.system.template.Actor.types.push(namespacedType);
    }
    console.log('Journeys & Jamborees | Added party types to system template');
  } else if (game.system.id === 'worldbuilding') {
    console.log(
      'Journeys & Jamborees | Skipping system template modification for Simple Worldbuilding'
    );
  }

  // 3. Register document class
  if (CONFIG.Actor?.documentClasses) {
    // Clean up any existing registrations
    for (const key in CONFIG.Actor.documentClasses) {
      if (key.includes('party') || key.includes('journeys-and-jamborees')) {
        delete CONFIG.Actor.documentClasses[key];
      }
    }

    // Register our class for both types
    CONFIG.Actor.documentClasses[cleanType] = PartyActorType;
    CONFIG.Actor.documentClasses[namespacedType] = PartyActorType;
    console.log('Journeys & Jamborees | Document class registered');
  } else {
    console.warn('Journeys & Jamborees | CONFIG.Actor.documentClasses not available yet');
  }

  // 4. Register sheet
  try {
    DocumentSheetConfig.registerSheet(Actor, 'journeys-and-jamborees', PartyActorSheet, {
      types: [cleanType, namespacedType],
      makeDefault: true,
      label: 'Journeys & Jamborees.PartySheet'
    });
    console.log('Journeys & Jamborees | Party sheet registered successfully');
  } catch (error) {
    console.error('Journeys & Jamborees | Error registering party sheet:', error);
  }

  // Clean up and register type labels
  if (CONFIG.Actor?.typeLabels) {
    // Specifically target the problematic double-namespaced key
    delete CONFIG.Actor.typeLabels[doubleNamespacedType];

    // Remove any existing party labels
    for (const key in CONFIG.Actor.typeLabels) {
      if (key.includes('party') || key.includes('journeys-and-jamborees')) {
        delete CONFIG.Actor.typeLabels[key];
      }
    }

    // Set our clean labels for both types
    CONFIG.Actor.typeLabels[cleanType] = 'Party';
    CONFIG.Actor.typeLabels[namespacedType] = 'Party';
    console.log('Journeys & Jamborees | Type label registered');
  }

  // Clear any old translations that might be causing issues
  for (const key in game.i18n.translations) {
    if (key.includes('party') || key.includes('journeys-and-jamborees')) {
      delete game.i18n.translations[key];
    }
  }

  // Set clean translations
  game.i18n.translations['TYPES.Actor.party'] = 'Party';
  game.i18n.translations['TYPES.Actor.journeys-and-jamborees.party'] = 'Party';
  game.i18n.translations['ACTOR.TypeParty'] = 'Party';
  game.i18n.translations['ACTOR.TypeJourneys-and-jamborees.party'] = 'Party';
  game.i18n.translations['ENTITY.Party'] = 'Party';

  console.log('Journeys & Jamborees | Translations registered');
  console.log('Journeys & Jamborees | Party actor type registration complete');

  return {
    partyType: namespacedType // Return the namespaced version
  };
};

/**
 * Handles adding the party type to the actor creation dialog
 */
export const setupActorCreationHook = function (_partyType) {
  // The full namespaced type as Foundry would generate it
  const namespacedType = 'journeys-and-jamborees.party';
  const doubleNamespacedType = 'journeys-and-jamborees.journeys-and-jamborees.party';

  // Add a hook to inject our actor type into the creation dialog
  Hooks.on('renderDialog', (dialog, html, _data) => {
    // Check if this is the create actor dialog
    const title = dialog.title;
    if (title === 'Create Actor') {
      // We need to modify the select dropdown options
      const typeSelect = html.find('select[name="type"]');
      if (typeSelect.length) {
        // Get the original options
        const options = Array.from(typeSelect[0].options);

        // Look for our party option
        for (const option of options) {
          if (
            option.value === namespacedType ||
            option.value === doubleNamespacedType ||
            option.value.includes('party')
          ) {
            // Just change the display text
            option.text = 'Party';
          }
        }
      }
    }
  });
};
