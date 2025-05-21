/**
 * Extends the base Actor class to implement additional party-specific logic.
 */
export class PartyActorType extends Actor {
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
    
    // Initialize party data if not present
    if (!data.members) {
      data.members = {
        active: [],
        traveling: [],
        stayingBehind: []
      };
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
    
    // Count active members
    data.activeCount = data.members.active.length;
    
    // Count traveling members
    data.travelingCount = data.members.traveling.length;
    
    // Compute total members
    data.totalMembers = data.activeCount + data.travelingCount + data.members.stayingBehind.length;
    
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
    // Get the character data
    const data = this.system;
    const allMembers = [
      ...data.members.active,
      ...data.members.traveling,
      ...data.members.stayingBehind
    ];
    
    const existingMember = allMembers.find(m => m.id === characterId);
    const memberData = existingMember || { id: characterId };
    
    // Remove from all status arrays
    data.members.active = data.members.active.filter(m => m.id !== characterId);
    data.members.traveling = data.members.traveling.filter(m => m.id !== characterId);
    data.members.stayingBehind = data.members.stayingBehind.filter(m => m.id !== characterId);
    
    // Add to the appropriate status array
    if (status === 'active') {
      data.members.active.push(memberData);
    } else if (status === 'traveling') {
      data.members.traveling.push(memberData);
    } else if (status === 'stayingBehind') {
      data.members.stayingBehind.push(memberData);
    }
    
    // Update the actor
    return this.update({ 'system.members': data.members });
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
    
    const activeMemberCount = this.system.members.active.length;
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
}