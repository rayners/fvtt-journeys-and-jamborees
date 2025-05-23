declare let ActorSheet: any; // Use global ActorSheet but suppress the warning
declare global {
  let Dialog: any; // Use global Dialog but suppress the warning
}

import { patchPartyActor } from './utils';
import { getSkillValue, getRoleSkillValues } from './helpers';

/**
 * Extends the basic ActorSheet with specific logic for the party actor sheet.
 */
export class PartyActorSheet extends ActorSheet {
  // Add a constructor to properly initialize our sheet
  constructor(object, options) {
    super(object, options);
    
    // Ensure our actor is properly initialized
    if (object && !object.setCharacterStatus) {
      console.warn("Party actor doesn't have required methods - patching", object);
      patchPartyActor(object);
    }
  }
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['dragonbane', 'sheet', 'actor', 'party'],
      template: 'modules/journeys-and-jamborees/templates/party-sheet.hbs',
      width: 680,
      height: 650,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'management' }],
      dragDrop: [{ dragSelector: null, dropSelector: null }] // Enable drag-drop
    });
  }
  
  /** @override */
  getData() {
    console.log('PartySheet.getData() called');
    const data = super.getData();
    const actorData = this.actor.toObject(false);
    
    // Add actor and system data
    data.actor = actorData;
    data.system = actorData.system;
    
    // Log memberStatus for debugging
    console.log('getData() - Current memberStatus:', JSON.stringify(data.system.memberStatus, null, 2));
    
    // Add isItem flag to items and check if we have any items
    let hasItems = false;
    if (data.actor.items) {
      data.actor.items = data.actor.items.map(item => {
        const isItem = item.type === 'item';
        if (isItem) hasItems = true;
        return {
          ...item,
          isItem
        };
      });
    }
    data.hasItems = hasItems;
    
    // Get the configured pathfinder skill name
    const pathfinderSkillName = game.settings.get("journeys-and-jamborees", "pathfinderSkillName") || "Bushcraft";
    data.pathfinderSkillName = pathfinderSkillName;
    
    // Add character data with the correct skill values
    const characters = this._getPartyCharacters(pathfinderSkillName);
    data.characters = characters;
    
    // Add filtered character lists for travel roles
    data.activeCharacters = characters.filter(char => char.isActive);
    data.travelingCharacters = characters.filter(char => char.isTraveling);
    
    // Log the character lists for debugging
    console.log('getData() - Total characters found:', characters.length);
    console.log('getData() - Active characters:', data.activeCharacters.length);
    console.log('getData() - Traveling characters:', data.travelingCharacters.length);
    
    // Add travel roles with skill values
    data.travelRoles = this._getTravelRolesWithSkills(pathfinderSkillName);
    
    // Add user-specific data
    data.isGM = game.user.isGM;
    data.currentUserCharacterId = this._getCurrentUserCharacterId();
    
    // Return the data for rendering
    return data;
  }
  
  /**
   * Get character actors that are actually in the party
   */
  _getPartyCharacters(pathfinderSkillName) {
    const data = this.actor.system;
    const memberStatus = data.memberStatus || {};
    
    // Get all character IDs that are in the party
    const partyCharacterIds = Object.keys(memberStatus);
    
    // Get all 'character' type actors that are in the party
    const characters = game.actors.filter(a => 
      a.type === 'character' && partyCharacterIds.includes(a.id)
    );
    
    // Log raw character data for debugging
    console.log('Character actors found:', characters.length);
    
    // Map them to a usable format
    const mappedCharacters = characters.map(c => {
      // Get player information
      const ownerUser = this._getCharacterOwner(c);
      
      // Get status information
      const isActive = this._isCharacterActive(c.id);
      const isTraveling = this._isCharacterTraveling(c.id);
      const isStayingBehind = this._isCharacterStayingBehind(c.id);
      
      // Get skill values using the helper function
      const pathfinderSkillValue = getSkillValue(c, pathfinderSkillName);
      const awarenessValue = getSkillValue(c, "Awareness");
      const barteringValue = getSkillValue(c, "Bartering");
      
      // Log character status for debugging
      console.log(`Character ${c.name} (${c.id}) status:`, { isActive, isTraveling, isStayingBehind });
      console.log(`Character ${c.name} skills:`, { 
        pathfinder: pathfinderSkillValue, 
        awareness: awarenessValue, 
        bartering: barteringValue 
      });
      
      return {
        id: c.id,
        name: c.name,
        img: c.img,
        owner: this._isCharacterOwnedByCurrentUser(c),
        isActive: isActive,
        isTraveling: isTraveling,
        isStayingBehind: isStayingBehind,
        travelRole: this._getCharacterTravelRole(c.id),
        pathfinderSkillValue: pathfinderSkillValue,
        bushcraft: this._getCharacterSkillValue(c, 'bushcraft'),
        awareness: awarenessValue,
        bartering: barteringValue,
        playerName: ownerUser ? ownerUser.name : 'No Player',
        userColor: ownerUser ? this._ensureReadableColor(ownerUser.color) : '#7a7971'
      };
    });
    
    // Log final mapped characters
    console.log('Mapped characters:', mappedCharacters);
    
    return mappedCharacters;
  }
  
  /**
   * Get travel roles with the assigned character's skill value
   */
  _getTravelRolesWithSkills(pathfinderSkillName) {
    const data = this.actor.system;
    const roles = {};
    
    // Pathfinder role
    roles.pathfinder = {
      name: 'Pathfinder',
      characterId: data.roles.pathfinder,
      characterName: this._getCharacterNameById(data.roles.pathfinder),
      skill: pathfinderSkillName.toLowerCase(),
      skillValue: this._getAssignedCharacterSkillValue(data.roles.pathfinder, pathfinderSkillName)
    };
    
    // Lookout role
    roles.lookout = {
      name: 'Lookout',
      characterId: data.roles.lookout,
      characterName: this._getCharacterNameById(data.roles.lookout),
      skill: 'awareness',
      skillValue: this._getAssignedCharacterSkillValue(data.roles.lookout, 'awareness')
    };
    
    // Quartermaster role
    roles.quartermaster = {
      name: 'Quartermaster',
      characterId: data.roles.quartermaster,
      characterName: this._getCharacterNameById(data.roles.quartermaster),
      skill: 'bartering',
      skillValue: this._getAssignedCharacterSkillValue(data.roles.quartermaster, 'bartering')
    };
    
    return roles;
  }
  
  /**
   * Check if a character is owned by the current user
   */
  _isCharacterOwnedByCurrentUser(character) {
    return character.isOwner;
  }
  
  /**
   * Get the current user's character ID
   */
  _getCurrentUserCharacterId() {
    // Find a character actor owned by the current user
    const userCharacter = game.actors.find(a => a.isOwner && a.type === 'character');
    return userCharacter ? userCharacter.id : null;
  }
  
  /**
   * Check if a character is in active status
   */
  _isCharacterActive(characterId) {
    const data = this.actor.system;
    return data.memberStatus && data.memberStatus[characterId] === 'active';
  }
  
  /**
   * Check if a character is in traveling status
   */
  _isCharacterTraveling(characterId) {
    const data = this.actor.system;
    return data.memberStatus && data.memberStatus[characterId] === 'traveling';
  }
  
  /**
   * Check if a character is staying behind
   */
  _isCharacterStayingBehind(characterId) {
    const data = this.actor.system;
    return data.memberStatus && data.memberStatus[characterId] === 'stayingBehind';
  }
  
  /**
   * Get a character's travel role
   */
  _getCharacterTravelRole(characterId) {
    const data = this.actor.system;
    
    for (const [role, id] of Object.entries(data.roles)) {
      if (id === characterId) return role;
    }
    
    return null;
  }
  
  /**
   * Get a character's skill value
   */
  _getCharacterSkillValue(character, skillName) {
    return getSkillValue(character, skillName);
  }
  
  /**
   * Get the skill value for an assigned character
   */
  _getAssignedCharacterSkillValue(characterId, skillName) {
    if (!characterId) return null;
    
    const character = game.actors.get(characterId);
    if (!character) return null;
    
    return this._getCharacterSkillValue(character, skillName);
  }
  
  /**
   * Get a character's name by ID
   */
  _getCharacterNameById(characterId) {
    if (!characterId) return null;
    
    const character = game.actors.get(characterId);
    return character ? character.name : null;
  }

  /**
   * Get the user who owns a character, preferring non-GM users
   */
  _getCharacterOwner(character) {
    if (!character) return null;
    
    // Find all users with owner permission (level 3)
    const ownerIds = Object.entries(character.ownership || {})
      .filter(([id, level]) => level === 3)
      .map(([id]) => id);
    
    if (ownerIds.length === 0) return null;
    
    // Get all owner users
    const ownerUsers = ownerIds
      .map(id => game.users.get(id))
      .filter(user => user); // Remove any undefined users
    
    // Prefer non-GM users over GMs
    const regularUsers = ownerUsers.filter(user => !user.isGM);
    if (regularUsers.length > 0) {
      return regularUsers[0]; // Return the first non-GM user
    }
    
    // Fall back to GM if no regular users are owners
    return ownerUsers[0];
  }
  
  /**
   * Ensure a color is readable against the sheet background
   */
  _ensureReadableColor(color) {
    // Make sure we have a valid color string
    if (!color || typeof color !== 'string') {
      return '#7a7971'; // Default gray color
    }

    // Get background brightness - assumes a light background
    const backgroundBrightness = 200; // Approximate value
    
    // Get color brightness
    const colorBrightness = this._getColorBrightness(color);
    
    // If both the background and color are too similar in brightness, adjust the color
    if (Math.abs(backgroundBrightness - colorBrightness) < 50) {
      // Darken the color if it's light, lighten if it's dark
      return (colorBrightness > 128) 
        ? this._darkenColor(color, 30)
        : this._lightenColor(color, 30);
    }
    
    return color;
  }
  
  /**
   * Calculate the brightness of a color (0-255)
   */
  _getColorBrightness(color) {
    // Make sure we have a valid hex color string
    if (!color || typeof color !== 'string') {
      return 128; // Default mid-brightness
    }

    // Clean the hex string and ensure it's valid
    const hex = color.startsWith('#') ? color.substring(1) : color;
    
    // Check if we have a valid hex color
    if (!/^[0-9A-Fa-f]{3,6}$/.test(hex)) {
      return 128; // Default mid-brightness for invalid colors
    }
    
    // Expand 3-digit hex to 6-digit if needed
    const fullHex = hex.length === 3 
      ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      : hex;
    
    // Convert hex to RGB
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    // Use perceived brightness formula
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  /**
   * Lighten a color by a percentage
   */
  _lightenColor(color, percent) {
    // Make sure we have a valid color string
    if (!color || typeof color !== 'string') {
      return '#7a7971'; // Default gray color
    }

    // Clean the hex string and ensure it's valid
    const hex = color.startsWith('#') ? color.substring(1) : color;
    
    // Check if we have a valid hex color
    if (!/^[0-9A-Fa-f]{3,6}$/.test(hex)) {
      return '#7a7971'; // Default gray for invalid colors
    }
    
    // Expand 3-digit hex to 6-digit if needed
    const fullHex = hex.length === 3 
      ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      : hex;
    
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    // Lighten
    const amount = Math.round(2.55 * percent);
    const newR = Math.min(255, r + amount);
    const newG = Math.min(255, g + amount);
    const newB = Math.min(255, b + amount);
    
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  }
  
  /**
   * Darken a color by a percentage
   */
  _darkenColor(color, percent) {
    // Make sure we have a valid color string
    if (!color || typeof color !== 'string') {
      return '#7a7971'; // Default gray color
    }

    // Clean the hex string and ensure it's valid
    const hex = color.startsWith('#') ? color.substring(1) : color;
    
    // Check if we have a valid hex color
    if (!/^[0-9A-Fa-f]{3,6}$/.test(hex)) {
      return '#7a7971'; // Default gray for invalid colors
    }
    
    // Expand 3-digit hex to 6-digit if needed
    const fullHex = hex.length === 3 
      ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      : hex;
    
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    
    // Darken
    const amount = Math.round(2.55 * percent);
    const newR = Math.max(0, r - amount);
    const newG = Math.max(0, g - amount);
    const newB = Math.max(0, b - amount);
    
    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  }
  
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Fix character portrait sizes
    this._fixPortraitSizes(html);
    
    // Character status management
    html.find('.character-status-select').change(this._onCharacterStatusChange.bind(this));
    
    // Travel role management
    html.find('.assign-role').click(this._onAssignRoleClick.bind(this));
    html.find('.pathfinder-select').change(this._onPathfinderSelectChange.bind(this));
    html.find('.lookout-select').change(this._onLookoutSelectChange.bind(this));
    html.find('.quartermaster-select').change(this._onQuartermasterSelectChange.bind(this));
    
    // Resource management
    html.find('.add-resource').click(this._onAddResourceClick.bind(this));
    html.find('.remove-resource').click(this._onRemoveResourceClick.bind(this));
    
    // Party actions
    html.find('.make-camp').click(this._onMakeCampClick.bind(this));
    html.find('.distribute-resources').click(this._onDistributeResourcesClick.bind(this));
    html.find('.roll-pathfinding').click(this._onRollPathfindingClick.bind(this));
    html.find('.random-encounter').click(this._onRandomEncounterClick.bind(this));
    html.find('.roll-weather').click(this._onRollWeatherClick.bind(this));
    html.find('.toggle-mounted').click(this._onToggleMountedClick.bind(this));
    html.find('.add-all-characters').click(this._onAddAllCharactersClick.bind(this));
    html.find('.remove-character').click(this._onRemoveCharacterClick.bind(this));
    html.find('.remove-all-characters').click(this._onRemoveAllCharactersClick.bind(this));
    
    // Enable drag-and-drop for adding characters
    this._activateDragDrop(html);
    
    // If the sheet is editable
    if (this.isEditable) {
      // Add inventory item
      html.find('.item-create').click(this._onItemCreate.bind(this));
      
      // Inventory item management
      html.find('.item-edit').click(this._onItemEdit.bind(this));
      html.find('.item-delete').click(this._onItemDelete.bind(this));
    }
  }

  /**
   * Fix portrait sizes to match the actor directory
   */
  _fixPortraitSizes(html) {
    // Set size for all character portraits
    const portraits = html.find('.character-portrait, .thumbnail');
    portraits.each((i, img) => {
      img.style.width = '48px';
      img.style.height = '48px';
      img.style.maxWidth = '48px';
      img.style.maxHeight = '48px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '3px';
      img.style.border = '1px solid var(--color-border-light-tertiary)';
    });

    // Also target any images with 'mage.webp' or similar in src
    const characterImages = html.find('img[src*="actors/"]');
    characterImages.each((i, img) => {
      // Skip profile image
      if (img.classList.contains('profile-img')) return;
      
      img.style.width = '48px';
      img.style.height = '48px';
      img.style.maxWidth = '48px';
      img.style.maxHeight = '48px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '3px';
      img.style.border = '1px solid var(--color-border-light-tertiary)';
    });
    
    // Keep profile image larger
    const profileImg = html.find('.profile-img');
    if (profileImg.length) {
      profileImg[0].style.width = '60px';
      profileImg[0].style.height = '60px';
      profileImg[0].style.maxWidth = '60px';
      profileImg[0].style.maxHeight = '60px';
      profileImg[0].style.objectFit = 'cover';
    }
  }
  
  /**
   * Handle changing a character's status
   */
  async _onCharacterStatusChange(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const characterId = element.dataset.characterId;
    const status = element.value;
    
    // Access the actor correctly - ensure we access the extended methods
    const partyActor = this.actor;
    
    // Check if the method exists before calling it
    if (typeof partyActor.setCharacterStatus === 'function') {
      await partyActor.setCharacterStatus(characterId, status);
    } else {
      console.error("Party actor doesn't have setCharacterStatus method", partyActor);
      ui.notifications.error("Could not change character status. See console for details.");
    }
  }
  
  /**
   * Handle pathfinder selection change
   */
  async _onPathfinderSelectChange(event) {
    event.preventDefault();
    
    const select = event.currentTarget;
    const characterId = select.value;
    
    // Update the travel role
    await this.actor.update({
      'system.roles.pathfinder': characterId
    });
  }
  
  /**
   * Handle lookout selection change
   */
  async _onLookoutSelectChange(event) {
    event.preventDefault();
    
    const select = event.currentTarget;
    const characterId = select.value;
    
    // Update the travel role
    await this.actor.update({
      'system.roles.lookout': characterId
    });
  }
  
  /**
   * Handle quartermaster selection change
   */
  async _onQuartermasterSelectChange(event) {
    event.preventDefault();
    
    const select = event.currentTarget;
    const characterId = select.value;
    
    // Update the travel role
    await this.actor.update({
      'system.roles.quartermaster': characterId
    });
  }
  
  /**
   * Handle assigning a travel role
   */
  async _onAssignRoleClick(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const characterId = element.dataset.characterId;
    const role = element.dataset.role;
    
    const partyActor = this.actor;
    if (typeof partyActor.assignTravelRole === 'function') {
      await partyActor.assignTravelRole(characterId, role);
    } else {
      console.error("Party actor doesn't have assignTravelRole method", partyActor);
      ui.notifications.error("Could not assign travel role. See console for details.");
    }
  }
  
  /**
   * Handle adding a resource
   */
  async _onAddResourceClick(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const resourceType = element.dataset.resourceType;
    
    const partyActor = this.actor;
    if (typeof partyActor.addResource === 'function') {
      await partyActor.addResource(resourceType);
    } else {
      console.error("Party actor doesn't have addResource method", partyActor);
      ui.notifications.error("Could not add resource. See console for details.");
    }
  }
  
  /**
   * Handle removing a resource
   */
  async _onRemoveResourceClick(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const resourceType = element.dataset.resourceType;
    
    const partyActor = this.actor;
    if (typeof partyActor.removeResource === 'function') {
      await partyActor.removeResource(resourceType);
    } else {
      console.error("Party actor doesn't have removeResource method", partyActor);
      ui.notifications.error("Could not remove resource. See console for details.");
    }
  }
  
  /**
   * Handle making camp
   */
  async _onMakeCampClick(event) {
    event.preventDefault();
    
    const partyActor = this.actor;
    if (typeof partyActor.makeCamp === 'function') {
      await partyActor.makeCamp();
    } else {
      console.error("Party actor doesn't have makeCamp method", partyActor);
      ui.notifications.error("Could not make camp. See console for details.");
    }
  }
  
  /**
   * Handle distributing resources
   */
  async _onDistributeResourcesClick(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const resourceType = element.dataset.resourceType;
    
    const partyActor = this.actor;
    if (typeof partyActor.distributeResources === 'function') {
      await partyActor.distributeResources(resourceType);
    } else {
      console.error("Party actor doesn't have distributeResources method", partyActor);
      ui.notifications.error("Could not distribute resources. See console for details.");
    }
  }
  
  /**
   * Handle rolling pathfinding
   */
  async _onRollPathfindingClick(event) {
    event.preventDefault();
    
    const partyActor = this.actor;
    if (typeof partyActor.rollPathfinding === 'function') {
      await partyActor.rollPathfinding();
    } else {
      console.error("Party actor doesn't have rollPathfinding method", partyActor);
      ui.notifications.error("Could not roll pathfinding. See console for details.");
    }
  }
  
  /**
   * Handle rolling for random encounters
   */
  async _onRandomEncounterClick(event) {
    event.preventDefault();
    
    // This would ideally be implemented to use Dragonbane-specific encounter tables
    // For now, we'll just roll a d20 and announce the result
    const roll = new Roll('1d20');
    await roll.evaluate();
    
    ChatMessage.create({
      speaker: { actor: this.actor.id, alias: this.actor.name },
      content: `<h3>Random Encounter Check</h3><p>Roll: ${roll.total}</p><p>${roll.total >= 18 ? 'An encounter occurs!' : 'No encounter.'}</p>`
    });
  }
  
  /**
   * Handle rolling for weather
   */
  async _onRollWeatherClick(event) {
    event.preventDefault();
    
    // This would ideally be implemented with Dragonbane-specific weather tables
    // For now, just roll a d6 and announce the result
    const roll = new Roll('1d6');
    await roll.evaluate();
    
    const weather = {
      1: 'Clear skies',
      2: 'Partly cloudy',
      3: 'Overcast',
      4: 'Light rain',
      5: 'Heavy rain',
      6: 'Storm'
    }[roll.total];
    
    ChatMessage.create({
      speaker: { actor: this.actor.id, alias: this.actor.name },
      content: `<h3>Weather Roll</h3><p>Result: ${weather}</p>`
    });
  }
  
  /**
   * Handle toggling mounted status
   */
  async _onToggleMountedClick(event) {
    event.preventDefault();
    
    const partyActor = this.actor;
    if (typeof partyActor.toggleMounted === 'function') {
      await partyActor.toggleMounted();
    } else {
      console.error("Party actor doesn't have toggleMounted method", partyActor);
      ui.notifications.error("Could not toggle mounted status. See console for details.");
    }
  }
  
  /**
   * Handle adding all characters to the party
   */
  async _onAddAllCharactersClick(event) {
    event.preventDefault();
    
    const partyActor = this.actor;
    if (typeof partyActor.addAllCharactersAsActive === 'function') {
      await partyActor.addAllCharactersAsActive();
    } else {
      console.error("Party actor doesn't have addAllCharactersAsActive method", partyActor);
      ui.notifications.error("Could not add all characters. See console for details.");
    }
  }
  
  /**
   * Handle removing a character from the party
   */
  async _onRemoveCharacterClick(event) {
    event.preventDefault();
    
    const element = event.currentTarget;
    const characterId = element.dataset.characterId;
    
    if (!characterId) {
      ui.notifications.error('No character ID specified.');
      return;
    }
    
    // Get character name for debugging
    const character = game.actors.get(characterId);
    const characterName = character ? character.name : 'Unknown Character';
    
    console.log(`Attempting to remove character: ${characterName} (${characterId})`);
    
    // Use the party actor's removeCharacter method instead of handling it in the sheet
    const partyActor = this.actor;
    
    // Ensure the actor is properly patched before attempting to call methods
    if (typeof partyActor.removeCharacter !== 'function') {
      console.error("Party actor doesn't have removeCharacter method", partyActor);
      ui.notifications.error("Could not remove character. See console for details.");
      return;
    }
    
    try {
      const result = await partyActor.removeCharacter(characterId, true);
      
      if (result) {
        // Successfully removed, the actor method handles notifications
        // Force a re-render to ensure UI is updated with fresh data
        // Use setTimeout to ensure the actor update has fully propagated
        setTimeout(() => {
          console.log('Re-rendering sheet after character removal');
          this.render(true); // Force full re-render
        }, 200);
      }
    } catch (error) {
      console.error('Error removing character:', error);
      ui.notifications.error(`Failed to remove ${characterName}. See console for details.`);
    }
  }
  
  
  /**
   * Handle removing all characters from the party
   */
  async _onRemoveAllCharactersClick(event) {
    event.preventDefault();
    
    // Determine which method to call based on user type
    const isGM = game.user.isGM;
    const methodName = isGM ? 'removeAllCharacters' : 'removeOwnCharacters';
    const dialogTitle = isGM ? 'Remove All Characters' : 'Remove Your Characters';
    const dialogContent = isGM 
      ? '<p>Are you sure you want to remove all characters from the party?</p>'
      : '<p>Are you sure you want to remove all your characters from the party?</p>';
    
    // Ask for confirmation
    const confirmed = await Dialog.confirm({
      title: dialogTitle,
      content: dialogContent,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
    
    if (!confirmed) return;
    
    const partyActor = this.actor;
    
    // Ensure the actor is properly patched before attempting to call methods
    patchPartyActor(partyActor);
    
    if (typeof partyActor[methodName] === 'function') {
      await partyActor[methodName]();
    } else {
      console.error(`Party actor doesn't have ${methodName} method`, partyActor);
      ui.notifications.error("Could not remove characters. See console for details.");
    }
  }
  
  /**
   * Handle creating a new item
   */
  _onItemCreate(event) {
    event.preventDefault();
    
    const header = event.currentTarget;
    const type = header.dataset.type;
    
    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type
    };
    
    this.actor.createEmbeddedDocuments('Item', [itemData]);
  }
  
  /**
   * Handle editing an item
   */
  _onItemEdit(event) {
    event.preventDefault();
    
    const li = event.currentTarget.closest('.item');
    const item = this.actor.items.get(li.dataset.itemId);
    
    item.sheet.render(true);
  }
  
  /**
   * Handle deleting an item
   */
  _onItemDelete(event) {
    event.preventDefault();
    
    const li = event.currentTarget.closest('.item');
    const itemId = li.dataset.itemId;
    
    new Dialog({
      title: 'Confirm Deletion',
      content: '<p>Are you sure you want to delete this item?</p>',
      buttons: {
        delete: {
          icon: '<i class="fas fa-trash"></i>',
          label: 'Delete',
          callback: () => this.actor.deleteEmbeddedDocuments('Item', [itemId])
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'cancel'
    }).render(true);
  }
  
  /**
   * Activate drag-and-drop functionality for the party sheet
   */
  _activateDragDrop(html) {
    // Create a new DragDrop instance
    const dragDrop = new DragDrop({
      dragSelector: '.character', // Allow dragging characters (not implemented for this sheet)
      dropSelector: '.party-sheet', // Allow dropping on the entire sheet
      permissions: {
        dragstart: () => false, // Don't allow dragging from this sheet
        drop: () => this.isEditable // Only allow dropping if editable
      },
      callbacks: {
        drop: this._onDrop.bind(this)
      }
    });
    
    // Bind the DragDrop to the HTML element
    dragDrop.bind(html[0]);
  }
  
  /**
   * Handle drop events
   */
  async _onDrop(event) {
    event.preventDefault();
    
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      console.error('Invalid drop data:', err);
      return false;
    }
    
    // Only handle Actor drops
    if (data.type !== 'Actor') {
      return false;
    }
    
    // Get the dropped actor
    const actor = await Actor.implementation.fromDropData(data);
    if (!actor) {
      ui.notifications.error('Invalid actor data.');
      return false;
    }
    
    // Only allow character actors
    if (actor.type !== 'character') {
      ui.notifications.warn('Only character actors can be added to the party.');
      return false;
    }
    
    // Check permissions - only allow adding own characters or if GM
    if (!game.user.isGM && !actor.isOwner) {
      ui.notifications.error('You can only add characters you own to the party.');
      return false;
    }
    
    // Add the character to the party (grantOwnership is handled automatically in addCharacter)
    const partyActor = this.actor;
    if (typeof partyActor.addCharacter === 'function') {
      return await partyActor.addCharacter(actor.id, 'active', true);
    } else {
      console.error("Party actor doesn't have addCharacter method", partyActor);
      ui.notifications.error("Could not add character. See console for details.");
      return false;
    }
  }
}