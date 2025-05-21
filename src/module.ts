// Import the styles
import '../styles/journeys-and-jamborees.scss'

// Import debug helpers
import { inspectActorConfig, findAllActorTypeReferences, debugLog } from './debug';

// Import required modules
import { registerSettings } from './settings';
import { preloadTemplates } from './templates';
import { registerHooks } from './hooks';
import { registerPartyActorType, setupActorCreationHook } from './registration';
import { patchPartyActor } from './utils';

// Initialize the module
Hooks.once('init', async function() {
  console.log('Journeys & Jamborees | Initializing module');
  
  // Register language files
  console.log('Journeys & Jamborees | Registering language files');
  game.i18n.translations['J&J'] = game.i18n.translations['J&J'] || {};
  
  // Add English as fallback language
  if (game.i18n.lang !== 'en') {
    mergeObject(
      game.i18n.translations['J&J'], 
      foundry.utils.deepClone(game.i18n.translations['J&J'] || {})
    );
  }
  
  // Register custom settings
  registerSettings();
  
  // Preload Handlebars templates
  await preloadTemplates();
  
  // Register party actor type - do this once here
  const { partyType } = registerPartyActorType();
  
  // Setup actor creation hook
  setupActorCreationHook(partyType);
  
  // Register hooks
  registerHooks();
});

// When ready
Hooks.once('ready', async function() {
  console.log('Journeys & Jamborees | Module ready');
  
  // Add comprehensive debug logging
  debugLog('Ready', 'Module ready hook called');
  debugLog('Ready', 'Final Actor configuration:');
  inspectActorConfig();
  debugLog('Ready', 'Searching for party type references:');
  findAllActorTypeReferences('party');
  findAllActorTypeReferences('journeys-and-jamborees');
  
  // Safe logging of Actor configuration
  console.log('Available Actor types:', CONFIG.Actor?.types || 'Not available yet');
  
  // Safely log data models
  if (CONFIG.Actor?.dataModels) {
    console.log('Available Actor dataModels:', Object.keys(CONFIG.Actor.dataModels));
  } else {
    console.log('Actor dataModels not available yet');
  }
  
  // Safely log document classes
  if (CONFIG.Actor?.documentClasses) {
    console.log('Available Actor documentClasses:', Object.keys(CONFIG.Actor.documentClasses));
    
    // Check our party type specifically
    const partyType = "party";
    const PartyActorClass = CONFIG.Actor.documentClasses[partyType];
    console.log('Party Actor Class:', PartyActorClass);
    
    // Check if our methods exist on the prototype
    if (PartyActorClass) {
      console.log('setCharacterStatus exists:', typeof PartyActorClass.prototype.setCharacterStatus === 'function');
      console.log('assignTravelRole exists:', typeof PartyActorClass.prototype.assignTravelRole === 'function');
    }
  } else {
    console.log('Actor documentClasses not available yet');
  }
  
  // Check for template files
  try {
    const templateRoot = 'modules/journeys-and-jamborees/templates/';
    const templatePaths = [
      templateRoot + 'party-sheet.hbs',
      templateRoot + 'party-hud.hbs'
    ];
    
    // Log template paths for debugging
    console.log('Journeys & Jamborees | Looking for templates at:', templatePaths);
  } catch (error) {
    console.error('Journeys & Jamborees | Error checking templates:', error);
  }
  
  // Test the creation of a party actor
  if (game.user.isGM) {
    try {
      debugLog('Ready', 'Checking for party actors with problematic types');
      
      // Check for actors with the problematic double namespace
      const problematicActor = game.actors.find(a => a.type === 'journeys-and-jamborees.journeys-and-jamborees.party');
      if (problematicActor) {
        debugLog('Ready', 'Found actor with problematic double namespace type!', {
          name: problematicActor.name,
          id: problematicActor.id,
          type: problematicActor.type
        });
        
        debugLog('Ready', 'Attempting to update actor type to "party"');
        try {
          problematicActor.update({type: 'party'}).then(() => {
            debugLog('Ready', 'Successfully updated actor type');
          }).catch(error => {
            debugLog('Ready', 'Failed to update actor type:', error);
          });
        } catch (error) {
          debugLog('Ready', 'Error attempting to update actor type:', error);
        }
      }
      // Use the new party type - both the clean and namespaced versions
      const cleanType = "party";
      const namespacedType = "journeys-and-jamborees.party";
      const doubleNamespacedType = "journeys-and-jamborees.journeys-and-jamborees.party";
      
      debugLog('Ready', 'Checking for existing party actors');
      
      // Find if we already have a party actor in any of its forms
      const cleanParty = game.actors.find(a => a.type === cleanType);
      const namespacedParty = game.actors.find(a => a.type === namespacedType);
      const problematicParty = game.actors.find(a => a.type === doubleNamespacedType);
      
      if (cleanParty) {
        debugLog('Ready', 'Found clean party actor:', {
          name: cleanParty.name,
          id: cleanParty.id,
          type: cleanParty.type,
          hasSetCharacterStatus: typeof cleanParty.setCharacterStatus === 'function'
        });
        
        // Patch the actor if needed
        patchPartyActor(cleanParty);
      } else if (namespacedParty) {
        debugLog('Ready', 'Found namespaced party actor:', {
          name: namespacedParty.name,
          id: namespacedParty.id,
          type: namespacedParty.type
        });
        
        // Use this one as is
        patchPartyActor(namespacedParty);
      } else if (problematicParty) {
        debugLog('Ready', 'Found problematic party actor:', {
          name: problematicParty.name,
          id: problematicParty.id,
          type: problematicParty.type
        });
        
        debugLog('Ready', 'Attempting to update to namespaced party type');
        try {
          problematicParty.update({type: namespacedType}).then(() => {
            debugLog('Ready', 'Successfully updated actor type');
            patchPartyActor(problematicParty);
          }).catch(error => {
            debugLog('Ready', 'Failed to update actor type:', error);
          });
        } catch (error) {
          debugLog('Ready', 'Error attempting to update actor type:', error);
        }
      } else {
        debugLog('Ready', 'No existing party actor found');
      }
      
      // Add a hook to patch any party actors that are opened
      Hooks.on('renderActorSheet', (sheet, html, data) => {
        const actor = sheet.actor;
        if (actor) {
          debugLog('ActorSheet', `Sheet rendered for actor: ${actor.name} (${actor.id})`, {
            type: actor.type
          });
          
          // Check for all possible party types
          if (actor.type === cleanType || actor.type === namespacedType || actor.type === doubleNamespacedType) {
            debugLog('ActorSheet', 'Found party actor, patching');
            patchPartyActor(actor);
            
            // If it's the problematic double-namespaced type, try to fix it
            if (actor.type === doubleNamespacedType) {
              debugLog('ActorSheet', 'Attempting to update problematic party type');
              try {
                actor.update({type: namespacedType}).then(() => {
                  debugLog('ActorSheet', 'Successfully updated actor type');
                }).catch(error => {
                  debugLog('ActorSheet', 'Failed to update actor type:', error);
                });
              } catch (error) {
                debugLog('ActorSheet', 'Error updating actor type:', error);
              }
            }
          }
        }
      });
    } catch (error) {
      debugLog('Ready', 'Error checking for existing party actor:', error);
      console.error('Error checking for existing party actor:', error);
    }
    
    // Final debug log after everything is set up
    debugLog('Ready', 'Setup complete, final actor configuration:');
    inspectActorConfig();
  }
});
