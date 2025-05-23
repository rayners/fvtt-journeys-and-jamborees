// Enhanced debug script to test character removal
// Run this in the Foundry console

(async function() {
  console.log('=== Enhanced Character Removal Debug Test ===');
  
  // Find a party actor
  const partyActor = game.actors.find(a => a.type === 'party' || a.type === 'journeys-and-jamborees.party');
  
  if (!partyActor) {
    console.log('No party actor found');
    return;
  }
  
  console.log('Found party actor:', partyActor.name);
  console.log('Party actor type:', partyActor.type);
  console.log('Has removeCharacter method:', typeof partyActor.removeCharacter === 'function');
  console.log('Current memberStatus:', JSON.stringify(partyActor.system.memberStatus, null, 2));
  
  // Get the first character in the party
  const memberIds = Object.keys(partyActor.system.memberStatus || {});
  if (memberIds.length === 0) {
    console.log('No characters in party to remove');
    return;
  }
  
  const testCharacterId = memberIds[0];
  const testCharacter = game.actors.get(testCharacterId);
  console.log('Testing removal of character:', testCharacter ? testCharacter.name : 'Unknown Character');
  console.log('Character ID:', testCharacterId);
  
  // Try to remove the character
  console.log('\n--- Before Removal ---');
  console.log('memberStatus:', JSON.stringify(partyActor.system.memberStatus, null, 2));
  console.log('Character count:', Object.keys(partyActor.system.memberStatus).length);
  console.log('Actor data version:', partyActor._stats.modifiedTime);
  
  try {
    console.log('\n--- Calling removeCharacter ---');
    const result = await partyActor.removeCharacter(testCharacterId, true);
    console.log('removeCharacter result:', result);
    
    // Check the data immediately after removal
    console.log('\n--- Immediately After Removal ---');
    console.log('memberStatus:', JSON.stringify(partyActor.system.memberStatus, null, 2));
    console.log('Character count:', Object.keys(partyActor.system.memberStatus || {}).length);
    console.log('Actor data version:', partyActor._stats.modifiedTime);
    console.log('Character still present?', testCharacterId in (partyActor.system.memberStatus || {}));
    
    // Wait a moment and check again
    await new Promise(resolve => setTimeout(resolve, 250));
    console.log('\n--- After 250ms delay ---');
    console.log('memberStatus:', JSON.stringify(partyActor.system.memberStatus, null, 2));
    console.log('Character still present?', testCharacterId in (partyActor.system.memberStatus || {}));
    console.log('Actor data version:', partyActor._stats.modifiedTime);
    
    // Force data refresh
    await partyActor.prepareData();
    console.log('\n--- After prepareData() ---');
    console.log('memberStatus:', JSON.stringify(partyActor.system.memberStatus, null, 2));
    console.log('Character still present?', testCharacterId in (partyActor.system.memberStatus || {}));
    
    // Force re-render the sheet if open
    if (partyActor.sheet?.rendered) {
      console.log('\n--- Re-rendering party sheet ---');
      partyActor.sheet.render(true);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Error removing character:', error);
    console.error('Stack trace:', error.stack);
  }
})();

// Also add a manual clear function for testing
window.debugClearMemberStatus = async function() {
  const partyActor = game.actors.find(a => a.type === 'party' || a.type === 'journeys-and-jamborees.party');
  if (!partyActor) {
    console.error("No party actor found");
    return;
  }
  
  console.log("Manually clearing memberStatus...");
  console.log("Before:", partyActor.system.memberStatus);
  await partyActor.update({'system.memberStatus': {}});
  console.log("After:", partyActor.system.memberStatus);
  
  if (partyActor.sheet?.rendered) {
    partyActor.sheet.render(true);
  }
};