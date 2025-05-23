/**
 * Extends the base Actor class to implement additional party-specific logic.
 */
export class PartyActorType extends Actor {
  
  /**
   * Override the create method to handle auto-adding characters and granting ownership
   */
  static async create(data, options = {}) {
    // Ensure the party starts with no ownership except for GM
    if (!data.ownership) {
      data.ownership = {
        default: 0, // No default ownership
        // GM gets full ownership - we'll set this below
      };
      
      // Grant GM ownership if we're creating this as a GM
      if (game.user.isGM) {
        data.ownership[game.user.id] = 3; // OWNER level
      }
    }
    
    // Ensure the party starts with empty memberStatus
    if (!data.system) {
      data.system = {};
    }
    if (!data.system.memberStatus) {
      data.system.memberStatus = {}; // Start with no characters
    }
    
    // Call the parent create method
    const party = await super.create(data, options);
    
    // Check if auto-adding characters is enabled
    const autoAddCharacters = game.settings.get('journeys-and-jamborees', 'autoAddCharactersOnCreation');
    
    if (autoAddCharacters && party) {
      console.log('Auto-adding characters to new party...');
      
      // Get player characters belonging to the current user (if not GM)
      // If GM, get all player characters
      let playerCharacters;
      if (game.user.isGM) {
        // GM can add all player characters
        playerCharacters = game.actors.filter(actor => {
          return actor.type === 'character' && actor.hasPlayerOwner;
        });
      } else {
        // Regular user can only add their own characters
        playerCharacters = game.actors.filter(actor => {
          return actor.type === 'character' && actor.isOwner;
        });
      }
      
      if (playerCharacters.length > 0) {
        const memberStatus = {};
        playerCharacters.forEach(character => {
          memberStatus[character.id] = 'active';
        });
        
        await party.update({ 'system.memberStatus': memberStatus });
        
        // Grant ownership to character owners
        await party.grantOwnershipToPlayers();
        
        ui.notifications.info(`Party created with ${playerCharacters.length} characters.`);
      } else {
        ui.notifications.info('Party created. Add characters by dragging them from the Actor Directory.');
      }
    } else {
      ui.notifications.info('Party created. Add characters by dragging them from the Actor Directory or using the "Add All Characters" button.');
    }
    
    return party;
  }
  /**
   * Override constructor to ensure all methods are available
   */
  constructor(data, options) {
    super(data, options);
    
    // Log for debugging
    console.log('PartyActorType constructor called', this);
    
    // Ensure our methods are bound to this instance
    this.setCharacterStatus = this.setCharacterStatus.bind(this);
    this.assignTravelRole = this.assignTravelRole.bind(this);
    this.addResource = this.addResource.bind(this);
    this.removeResource = this.removeResource.bind(this);
    this.distributeResources = this.distributeResources.bind(this);
    this.makeCamp = this.makeCamp.bind(this);
    this.rollPathfinding = this.rollPathfinding.bind(this);
    this.toggleMounted = this.toggleMounted.bind(this);
    this.addAllCharactersAsActive = this.addAllCharactersAsActive.bind(this);
    this.addCharacter = this.addCharacter.bind(this);
    this.removeCharacter = this.removeCharacter.bind(this);
    this.removeAllCharacters = this.removeAllCharacters.bind(this);
    this.grantOwnershipToPlayers = this.grantOwnershipToPlayers.bind(this);
    this._updateOwnershipAfterRemoval = this._updateOwnershipAfterRemoval.bind(this);
    this._resetOwnershipToGMOnly = this._resetOwnershipToGMOnly.bind(this);
  }
  /**
   * @override
   * Core documents are initialized with default properties using the provided data
   * @param {object} data    The initial data object provided to the Document constructor
   * @param {object} context The document creation context
   */
  _initialize(data, context) {
    // Make sure we're working with the correct type
    if (!data?.type) {
      data = foundry.utils.mergeObject({ type: "journeys-and-jamborees.party" }, data || {});
    }
    super._initialize(data, context);
  }
  
  /** @override */
  prepareData() {
    super.prepareData();
    
    // Add custom data preparation for party actor
    this._preparePartyData();
  }
  
  /**
   * Prepare custom party data
   */
  _preparePartyData() {
    const data = this.system;
    
    // Initialize memberStatus if not present
    if (!data.memberStatus) {
      data.memberStatus = {};
    }
    
    if (!data.roles) {
      data.roles = {
        pathfinder: null,
        lookout: null,
        quartermaster: null
      };
    }
    
    if (!data.resources) {
      data.resources = {
        rations: 0,
        water: 0
      };
    }
    
    // Initialize movement data if not present
    if (!data.movement) {
      data.movement = {
        value: 15, // Default movement of 15km per shift on foot
        isMounted: false
      };
    }
    
    // Initialize settings if not present
    if (!data.settings) {
      data.settings = {
        baseMovement: 15, // Default 15km per Dragonbane rules
        rationsPerDay: 1,
        waterPerDay: 1,
        encounterChance: 10,
        tokenScale: 1.5,
        showPartyHud: true,
        autoConsume: false,
        showWarnings: true
      };
    }
    
    // Initialize journey tracking if not present
    if (!data.journey) {
      data.journey = {
        origin: '',
        destination: '',
        distance: 0,
        traveled: 0,
        terrain: 'road'
      };
    }
    
    // Initialize travel status if not present
    if (!data.status) {
      data.status = {
        traveling: false,
        resting: false,
        camping: false
      };
    }
    
    // Compute derived data
    this._computeDerivedData();
  }
  
  /**
   * Compute any derived data for the party
   */
  _computeDerivedData() {
    const data = this.system;
    
    // Member counts are now calculated in the data model's prepareDerivedData
    // so we can access them directly as data.activeCount, data.travelingCount, etc.
    
    // Check if we have enough resources
    data.hasEnoughRations = data.resources.rations >= data.totalMembers;
    data.hasEnoughWater = data.resources.water >= data.totalMembers;
    
    // Compute movement rate based on Dragonbane rules
    this._computeMovementRate();
    
    // Compute journey remaining distance
    if (data.journey) {
      const remaining = Math.max(0, data.journey.distance - data.journey.traveled);
      data.journeyRemaining = remaining;
    }
  }
  
  /**
   * Compute movement rate based on Dragonbane rules
   * Base movement is 15km per shift on foot, 30km if mounted
   * @private
   */
  _computeMovementRate() {
    const data = this.system;
    
    // Get the base movement from settings (default 15km per Dragonbane rules)
    let baseMovement = data.settings?.baseMovement || 15;
    
    // Double movement if the party is mounted
    if (data.movement.isMounted) {
      baseMovement *= 2; // 30km if mounted per Dragonbane rules
    }
    
    // Could add terrain modifiers here if needed
    // For example: if (data.journey.terrain === 'mountains') baseMovement *= 0.5;
    
    // Update the movement value
    data.movement.value = baseMovement;
  }
  
  /**
   * @override
   * Configure a Token document based on this actor data
   */
  async getTokenData() {
    const data = await super.getTokenData();
    
    // Set token name to match actor
    data.name = this.name;
    
    // Use a specific token image that represents a group
    // If no image is set, use a default
    if (!this.img || this.img === 'icons/svg/mystery-man.svg') {
      data.img = 'modules/dragonbane-coreset/assets/artwork/chapter-2.webp';
    } else {
      data.img = this.img;
    }
    
    // Make the token slightly larger to represent a group
    data.width = data.height = 1.5;
    
    // Use a party-specific icon
    data.actorLink = true;
    data.disposition = CONST.TOKEN_DISPOSITIONS.FRIENDLY;
    
    return data;
  }
  
  /**
   * Set a character's status in the party
   */
  async setCharacterStatus(characterId, status) {
    // Log debug info
    console.log(`Setting character ${characterId} status to ${status}`);
    
    // Initialize member status if needed
    const data = this.system;
    const memberStatus = foundry.utils.deepClone(data.memberStatus || {});
    
    // Check if the status is valid
    if (['active', 'traveling', 'stayingBehind'].includes(status)) {
      console.log('Before change, memberStatus:', {...memberStatus});
      
      // Simply update the character's status
      memberStatus[characterId] = status;
      
      console.log('After change, memberStatus:', {...memberStatus});
      
      // Update the actor with the new status
      return this.update({
        'system.memberStatus': memberStatus
      });
    } else {
      // Remove the character's status if invalid
      if (memberStatus[characterId]) {
        delete memberStatus[characterId];
        return this.update({
          'system.memberStatus': memberStatus
        });
      }
    }
  }
  
  
  /**
   * Assign a travel role to a character
   */
  async assignTravelRole(characterId, role) {
    const data = this.system;
    
    // Update the role
    data.roles[role] = characterId;
    
    // Update the actor
    return this.update({ 'system.roles': data.roles });
  }
  
  /**
   * Add resources to the party
   */
  async addResource(type, amount = 1) {
    if (!this.system.resources) return;
    
    const currentAmount = this.system.resources[type] || 0;
    return this.update({
      [`system.resources.${type}`]: currentAmount + amount
    });
  }
  
  /**
   * Remove resources from the party
   */
  async removeResource(type, amount = 1) {
    if (!this.system.resources) return;
    
    const currentAmount = this.system.resources[type] || 0;
    const newAmount = Math.max(0, currentAmount - amount);
    
    return this.update({
      [`system.resources.${type}`]: newAmount
    });
  }
  
  /**
   * Distribute resources to party members
   */
  async distributeResources(type) {
    if (!this.system.resources) return;
    
    const activeMemberCount = this.system.activeCount || 0;
    const currentAmount = this.system.resources[type] || 0;
    
    // Check if we have enough resources
    if (currentAmount < activeMemberCount) {
      ui.notifications.error(`Not enough ${type} to distribute to all party members.`);
      return false;
    }
    
    // Remove the resources
    await this.update({
      [`system.resources.${type}`]: currentAmount - activeMemberCount
    });
    
    ui.notifications.info(`Distributed ${type} to ${activeMemberCount} party members.`);
    return true;
  }
  
  /**
   * Make camp for the party
   */
  async makeCamp() {
    // Implementation will depend on Dragonbane system specifics
    // For now, just display a notification
    ui.notifications.info('The party makes camp for the night.');
    
    // In the future, we could:
    // 1. Consume resources
    // 2. Make BUSHCRAFT checks
    // 3. Roll for random encounters
    // 4. Apply resting benefits to characters
    
    return true;
  }
  
  /**
   * Toggle the party's mounted status
   */
  async toggleMounted() {
    const data = this.system;
    
    // Toggle the mounted status
    const isMounted = !data.movement.isMounted;
    
    // Update the actor
    await this.update({
      'system.movement.isMounted': isMounted
    });
    
    // Announce the change in chat
    ChatMessage.create({
      speaker: { actor: this.id, alias: this.name },
      content: `<h3>${isMounted ? 'Mounted' : 'Dismounted'}</h3>
                <p>The party is now ${isMounted ? 'mounted and moves at 30km per shift' : 'on foot and moves at 15km per shift'}.</p>`
    });
    
    return isMounted;
  }
  
  /**
   * Roll a pathfinding check using the assigned pathfinder's BUSHCRAFT skill
   */
  async rollPathfinding() {
    const pathfinderId = this.system.roles.pathfinder;
    if (!pathfinderId) {
      ui.notifications.warn('No pathfinder assigned to the party.');
      return null;
    }
    
    const pathfinder = game.actors.get(pathfinderId);
    if (!pathfinder) {
      ui.notifications.error('Assigned pathfinder not found.');
      return null;
    }
    
    // This implementation may need to be adjusted based on the Dragonbane system
    try {
      // Try to roll the bushcraft skill
      const skillValue = this._getCharacterSkillValue(pathfinder, 'bushcraft');
      
      // Create a chat message indicating the roll
      ChatMessage.create({
        speaker: { actor: this.id, alias: this.name },
        content: `<h3>Pathfinding Check</h3><p>${pathfinder.name} is leading the way with BUSHCRAFT (${skillValue}).</p>`
      });
      
      // Use the Dragonbane system's roll method if available
      if (pathfinder.rollSkill) {
        return pathfinder.rollSkill('bushcraft');
      } else {
        // Fallback to a basic d20 roll against the skill value
        const roll = new Roll('1d20');
        await roll.evaluate();
        
        const success = roll.total <= skillValue;
        
        // Create a chat message with the result
        ChatMessage.create({
          speaker: { actor: this.id, alias: this.name },
          content: `<h3>Pathfinding Result</h3>
                    <p>Roll: ${roll.total} vs BUSHCRAFT ${skillValue}</p>
                    <p>${success ? 'Success! The party finds the right path.' : 'Failure! The party gets lost.'}</p>`
        });
        
        return {
          success,
          total: roll.total,
          skill: 'bushcraft',
          skillValue
        };
      }
    } catch (error) {
      console.error('Error rolling pathfinding check:', error);
      ui.notifications.error('Could not roll pathfinding check.');
      return null;
    }
  }
  
  /**
   * Get a character's skill value
   * @private
   */
  _getCharacterSkillValue(character, skillName) {
    // This will need to be adapted for the specific system
    try {
      return character.system.skills[skillName]?.value || 0;
    } catch (e) {
      return 0;
    }
  }
  
  /**
   * Quick method to add all available characters to the active list
   * This is helpful for initial setup and testing
   */
  async addAllCharactersAsActive() {
    // Filter characters based on user permissions
    let characters;
    if (game.user.isGM) {
      // GMs can add all characters
      characters = game.actors.filter(a => a.type === 'character');
    } else {
      // Non-GMs can only add characters they own
      characters = game.actors.filter(a => a.type === 'character' && a.isOwner);
    }
    
    const data = this.system;
    
    // Initialize memberStatus if needed
    const memberStatus = data.memberStatus || {};
    
    // Get characters that aren't already in the memberStatus
    const charactersToAdd = characters.filter(c => !(c.id in memberStatus));
    
    if (charactersToAdd.length > 0) {
      // Add all new characters to memberStatus as active
      charactersToAdd.forEach(character => {
        memberStatus[character.id] = 'active';
      });
      
      // Update the actor
      await this.update({ 'system.memberStatus': memberStatus });
      ui.notifications.info(`Added ${charactersToAdd.length} characters to the party.`);
      return true;
    } else {
      ui.notifications.warn('No new characters to add to the party.');
      return false;
    }
  }
  
  /**
   * Add a single character to the party as active
   */
  async addCharacter(characterId, status = 'active', grantOwnership = true) {
    const data = this.system;
    const memberStatus = data.memberStatus || {};
    
    // Check if character already exists in the party
    if (characterId in memberStatus) {
      ui.notifications.warn('Character is already in the party.');
      return false;
    }
    
    // Validate character exists
    const character = game.actors.get(characterId);
    if (!character || character.type !== 'character') {
      ui.notifications.error('Invalid character.');
      return false;
    }
    
    // Check permissions - only allow adding own characters or if GM
    if (!game.user.isGM && !character.isOwner) {
      ui.notifications.error('You can only add characters you own to the party.');
      return false;
    }
    
    // Add character to party
    memberStatus[characterId] = status;
    
    await this.update({ 'system.memberStatus': memberStatus });
    
    // Grant ownership to the character's owner if requested
    if (grantOwnership && character.hasPlayerOwner) {
      await this.grantOwnershipToPlayers();
    }
    
    ui.notifications.info(`Added ${character.name} to the party.`);
    return true;
  }
  
  /**
   * Remove a single character from the party
   */
  async removeCharacter(characterId, updateOwnership = true) {
    const data = this.system;
    
    // Check if character exists in the party
    if (!data.memberStatus || !(characterId in data.memberStatus)) {
      ui.notifications.warn('Character is not in the party.');
      return false;
    }
    
    const character = game.actors.get(characterId);
    const characterName = character ? character.name : 'Unknown Character';
    
    console.log(`removeCharacter: Removing ${characterName} (${characterId})`);
    console.log('Before removal - memberStatus:', {...data.memberStatus});
    
    // Check permissions - only allow removing own characters or if GM
    if (!game.user.isGM && character && !character.isOwner) {
      ui.notifications.error('You can only remove characters you own from the party.');
      return false;
    }
    
    // Create a completely new memberStatus object without the character using deep clone
    const currentMemberStatus = foundry.utils.deepClone(data.memberStatus || {});
    delete currentMemberStatus[characterId];
    
    console.log('After deletion - memberStatus:', {...currentMemberStatus});
    
    // Prepare the update data - use unsetFlag to completely remove the old data first
    const updateData = {
      'system.memberStatus': currentMemberStatus
    };
    
    // Check and clear travel roles if this character was assigned
    if (data.roles.pathfinder === characterId) {
      updateData['system.roles.pathfinder'] = '';
      console.log('Clearing pathfinder role');
    }
    if (data.roles.lookout === characterId) {
      updateData['system.roles.lookout'] = '';
      console.log('Clearing lookout role');
    }
    if (data.roles.quartermaster === characterId) {
      updateData['system.roles.quartermaster'] = '';
      console.log('Clearing quartermaster role');
    }
    
    console.log('Update data to be applied:', updateData);
    
    try {
      // Update the actor data - Foundry will handle ObjectField updates properly
      await this.update(updateData);
      console.log('Actor update completed successfully');
      console.log('Final memberStatus after update:', this.system.memberStatus);
      
    } catch (error) {
      console.error('Error updating actor data:', error);
      ui.notifications.error(`Failed to update party data when removing ${characterName}.`);
      return false;
    }
    
    // Update ownership if requested - remove ownership from users who no longer have characters in the party
    if (updateOwnership) {
      // Ensure the method exists before calling it
      if (typeof this._updateOwnershipAfterRemoval === 'function') {
        try {
          await this._updateOwnershipAfterRemoval();
          console.log('Ownership update completed');
        } catch (error) {
          console.warn('Error updating ownership:', error);
        }
      } else {
        console.warn('_updateOwnershipAfterRemoval method not available, skipping ownership update');
      }
    }
    
    ui.notifications.info(`Removed ${characterName} from the party.`);
    return true;
  }
  
  /**
   * Remove all characters from the party
   */
  async removeAllCharacters() {
    const data = this.system;
    const memberStatus = data.memberStatus || {};
    
    const characterCount = Object.keys(memberStatus).length;
    
    if (characterCount === 0) {
      ui.notifications.warn('No characters to remove from the party.');
      return false;
    }
    
    // Check permissions - only GM can remove all characters
    if (!game.user.isGM) {
      ui.notifications.error('Only the GM can remove all characters from the party.');
      return false;
    }
    
    // Clear all characters and travel roles
    const updateData = {
      'system.memberStatus': {},
      'system.roles.pathfinder': '',
      'system.roles.lookout': '',
      'system.roles.quartermaster': ''
    };
    
    await this.update(updateData);
    
    // Reset ownership to GM only
    if (typeof this._resetOwnershipToGMOnly === 'function') {
      await this._resetOwnershipToGMOnly();
    } else {
      console.warn('_resetOwnershipToGMOnly method not available, skipping ownership reset');
    }
    
    ui.notifications.info(`Removed all ${characterCount} characters from the party.`);
    return true;
  }
  
  /**
   * Remove all characters owned by the current user from the party
   */
  async removeOwnCharacters() {
    const data = this.system;
    const memberStatus = data.memberStatus || {};
    
    // Get character IDs that the current user owns
    const ownedCharacterIds = Object.keys(memberStatus).filter(charId => {
      const character = game.actors.get(charId);
      return character && character.isOwner;
    });
    
    if (ownedCharacterIds.length === 0) {
      ui.notifications.warn('You have no characters in the party to remove.');
      return false;
    }
    
    // Create update data
    const updatedMemberStatus = { ...memberStatus };
    const rolesToClear = {};
    
    // Remove owned characters from memberStatus
    ownedCharacterIds.forEach(charId => {
      delete updatedMemberStatus[charId];
    });
    
    // Check if any removed characters had travel roles
    const roles = data.roles || {};
    if (ownedCharacterIds.includes(roles.pathfinder)) {
      rolesToClear['system.roles.pathfinder'] = '';
    }
    if (ownedCharacterIds.includes(roles.lookout)) {
      rolesToClear['system.roles.lookout'] = '';
    }
    if (ownedCharacterIds.includes(roles.quartermaster)) {
      rolesToClear['system.roles.quartermaster'] = '';
    }
    
    // Prepare update data
    const updateData = {
      'system.memberStatus': updatedMemberStatus,
      ...rolesToClear
    };
    
    await this.update(updateData);
    
    // Update ownership after removal
    if (typeof this._updateOwnershipAfterRemoval === 'function') {
      await this._updateOwnershipAfterRemoval();
    }
    
    ui.notifications.info(`Removed ${ownedCharacterIds.length} of your characters from the party.`);
    return true;
  }
  
  /**
   * Grant ownership permissions to players who own characters in the party
   */
  async grantOwnershipToPlayers() {
    const data = this.system;
    const memberStatus = data.memberStatus || {};
    
    if (Object.keys(memberStatus).length === 0) {
      console.log('No characters in the party to grant ownership for.');
      return false;
    }
    
    const currentOwnership = foundry.utils.deepClone(this.ownership || {});
    
    // Ensure default ownership is 0
    if (!currentOwnership.default) {
      currentOwnership.default = 0;
    }
    
    // Ensure GM has ownership
    if (game.user.isGM && (!currentOwnership[game.user.id] || currentOwnership[game.user.id] < 3)) {
      currentOwnership[game.user.id] = 3;
    }
    
    let ownersAdded = 0;
    const playersGranted = new Set();
    
    // Find owners of characters in the party
    for (const characterId of Object.keys(memberStatus)) {
      const character = game.actors.get(characterId);
      if (!character) continue;
      
      console.log(`Checking ownership for character: ${character.name}`);
      
      // Get character owners
      const characterOwnership = character.ownership || {};
      for (const [userId, level] of Object.entries(characterOwnership)) {
        const user = game.users.get(userId);
        if (!user) continue;
        
        // Grant ownership if user has owner level (3) and isn't already an owner
        if (level === 3 && (!currentOwnership[userId] || currentOwnership[userId] < 3)) {
          currentOwnership[userId] = 3; // OWNER level
          playersGranted.add(user.name);
          ownersAdded++;
          console.log(`Granted party ownership to: ${user.name}`);
        }
      }
    }
    
    if (ownersAdded > 0) {
      await this.update({ 'ownership': currentOwnership });
      const playerNames = Array.from(playersGranted).join(', ');
      ui.notifications.info(`Granted party ownership to: ${playerNames}`);
      return true;
    } else {
      console.log('No new ownership permissions to grant.');
      return false;
    }
  }
  
  /**
   * Update ownership after character removal - remove ownership from users who no longer have characters in the party
   * @private
   */
  async _updateOwnershipAfterRemoval() {
    const data = this.system;
    const memberStatus = data.memberStatus || {};
    const currentOwnership = foundry.utils.deepClone(this.ownership || {});
    
    // Get all user IDs who should still have ownership (users who own characters in the party)
    const usersWithCharacters = new Set();
    
    for (const characterId of Object.keys(memberStatus)) {
      const character = game.actors.get(characterId);
      if (!character) continue;
      
      const characterOwnership = character.ownership || {};
      for (const [userId, level] of Object.entries(characterOwnership)) {
        if (level === 3) { // OWNER level
          usersWithCharacters.add(userId);
        }
      }
    }
    
    // Always preserve GM ownership
    const gmUsers = game.users.filter(u => u.isGM);
    gmUsers.forEach(gm => usersWithCharacters.add(gm.id));
    
    // Remove ownership from users who no longer have characters in the party
    let ownersRemoved = 0;
    const removedPlayers = [];
    
    for (const [userId, level] of Object.entries(currentOwnership)) {
      if (userId === 'default') continue;
      
      const user = game.users.get(userId);
      if (!user) continue;
      
      if (level === 3 && !usersWithCharacters.has(userId)) {
        delete currentOwnership[userId];
        removedPlayers.push(user.name);
        ownersRemoved++;
      }
    }
    
    if (ownersRemoved > 0) {
      await this.update({ 'ownership': currentOwnership });
      console.log(`Removed party ownership from: ${removedPlayers.join(', ')}`);
    }
  }
  
  /**
   * Reset ownership to GM only
   * @private
   */
  async _resetOwnershipToGMOnly() {
    const ownership = {
      default: 0
    };
    
    // Grant ownership to all GMs
    const gmUsers = game.users.filter(u => u.isGM);
    gmUsers.forEach(gm => {
      ownership[gm.id] = 3; // OWNER level
    });
    
    await this.update({ 'ownership': ownership });
  }
}