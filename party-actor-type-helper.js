// Party Actor Type Registration Helper
// This script can be manually added to your world using "Module Management+" or Console Wizard if needed

Hooks.once('init', function() {
  console.log('Party Actor Type Helper | Initializing');
  
  // Safety function to register party actor type
  const registerPartyActorType = function() {
    try {
      // Make sure CONFIG exists
      if (!CONFIG || !CONFIG.Actor) {
        console.error('Party Actor Type Helper | CONFIG.Actor not available');
        return;
      }
      
      // Make sure actor types are initialized
      CONFIG.Actor.types = CONFIG.Actor.types || [];
      
      // Register the party actor type if not already there
      if (!CONFIG.Actor.types.includes('party')) {
        CONFIG.Actor.types.push('party');
        console.log('Party Actor Type Helper | Successfully registered party actor type');
      } else {
        console.log('Party Actor Type Helper | Party actor type was already registered');
      }
    } catch (error) {
      console.error('Party Actor Type Helper | Failed to register party actor type:', error);
    }
  };
  
  // Register immediately
  registerPartyActorType();
  
  // Also register on setup and ready hooks as backup
  Hooks.once('setup', registerPartyActorType);
  Hooks.once('ready', registerPartyActorType);
});
