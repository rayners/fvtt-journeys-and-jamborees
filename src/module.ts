// Import the styles
import '../styles/journeys-and-jamborees.scss'

// Import required modules
import { registerSettings } from './settings';
import { SkillManager } from './skill-manager';
import { preloadTemplates } from './templates';
import { registerHooks } from './hooks';
import { registerPartyActorType, setupActorCreationHook } from './registration';
import { patchPartyActor } from './utils';
import { SkillRollTracker } from './skill-roll-tracker';
// Import API for external access
import './api';
// Import quench tests - they self-register via the quenchReady hook
import './quench-tests';
// Import Dragonbane Roll API if using Dragonbane
import './dragonbane-roll-api';

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
  
  // Initialize the skill roll tracker
  SkillRollTracker.getInstance();
  
  // Patch any existing party actors to ensure they have the latest methods
  const partyActors = game.actors.filter(a => a.type === 'party' || a.type === 'journeys-and-jamborees.party');
  if (partyActors.length > 0) {
    console.log('Journeys & Jamborees | Found party actors, ensuring they have latest methods:', partyActors.length);
    
    for (const partyActor of partyActors) {
      // Ensure the actor has the current methods
      patchPartyActor(partyActor);
    }
  }
  
});

// Register skill settings in a separate ready hook to ensure system data is loaded
// IMPORTANT: Skill settings MUST be registered after the game is fully ready to 
// ensure CONFIG objects (like CONFIG.DND5E.skills) are populated. If registered 
// in 'init', D&D 5e skills show as "sur" instead of "Survival".
Hooks.once("ready", () => {
  console.log('Journeys & Jamborees | Registering skill settings');
  SkillManager.getInstance().registerSkillSettings();
});
