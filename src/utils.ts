/**
 * Utility functions for the Journeys & Jamborees module
 */

import { PartyActorType } from './party-actor';

/**
 * Patches a party actor with the required methods if they're missing
 * This is a workaround for when Foundry doesn't correctly use our custom actor class
 */
export function patchPartyActor(actor) {
  if (!actor) return;
  
  // Only patch party actors
  if (actor.type !== 'journeys-and-jamborees.party') return;
  
  // Check if our key methods are missing
  if (typeof actor.setCharacterStatus !== 'function') {
    console.log('Patching party actor with missing methods:', actor.name);
    
    // Add the methods from our prototype
    const methods = [
      'setCharacterStatus',
      'assignTravelRole',
      'addResource',
      'removeResource',
      'distributeResources',
      'makeCamp',
      'rollPathfinding',
      'toggleMounted'
    ];
    
    methods.forEach(methodName => {
      if (typeof actor[methodName] !== 'function') {
        actor[methodName] = PartyActorType.prototype[methodName].bind(actor);
        console.log(`Added ${methodName} method to party actor`);
      }
    });
  }
}
