import { SystemConfigManager } from './system-config.js';

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
        default: 0 // No default ownership
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
    const autoAddCharacters = game.settings.get(
      'journeys-and-jamborees',
      'autoAddCharactersOnCreation'
    );

    if (autoAddCharacters && party) {
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
        ui.notifications.info(
          'Party created. Add characters by dragging them from the Actor Directory.'
        );
      }
    } else {
      ui.notifications.info(
        'Party created. Add characters by dragging them from the Actor Directory or using the "Add All Characters" button.'
      );
    }

    return party;
  }
  /**
   * Override constructor to ensure all methods are available
   */
  constructor(data, options) {
    super(data, options);

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
      data = foundry.utils.mergeObject({ type: 'journeys-and-jamborees.party' }, data || {});
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
      const configManager = SystemConfigManager.getInstance();
      const onFootMovement = configManager.getMovementRate(false);
      data.movement = {
        value: onFootMovement.value, // Default movement based on system config
        isMounted: false
      };
    }

    // Initialize settings if not present
    if (!data.settings) {
      const configManager = SystemConfigManager.getInstance();
      const onFootMovement = configManager.getMovementRate(false);
      data.settings = {
        baseMovement: onFootMovement.value, // Default movement based on system config
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

    // Compute movement rate based on system configuration
    this._computeMovementRate();

    // Compute journey remaining distance
    if (data.journey) {
      const remaining = Math.max(0, data.journey.distance - data.journey.traveled);
      data.journeyRemaining = remaining;
    }
  }

  /**
   * Compute movement rate based on system configuration
   * Base movement varies by system, typically doubled when mounted
   * @private
   */
  _computeMovementRate() {
    const data = this.system;
    const configManager = SystemConfigManager.getInstance();

    // Get the base movement from settings or use system default
    const systemMovement = configManager.getMovementRate(data.movement.isMounted);
    let baseMovement = data.settings?.baseMovement || systemMovement.value;

    // If mounted and using system defaults, use the mounted rate
    if (data.movement.isMounted && !data.settings?.baseMovement) {
      baseMovement = systemMovement.value;
    } else if (data.movement.isMounted && data.settings?.baseMovement) {
      // If using custom base movement, double it when mounted
      baseMovement *= 2;
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
    // If no image is set, use a system-appropriate default
    if (!this.img || this.img === 'icons/svg/mystery-man.svg') {
      const configManager = SystemConfigManager.getInstance();
      const config = configManager.getConfig();
      data.img = config.assets.defaultPartyImage;
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
    // Initialize member status if needed
    const data = this.system;
    const memberStatus = foundry.utils.deepClone(data.memberStatus || {});

    // Check if the status is valid
    if (['active', 'traveling', 'stayingBehind'].includes(status)) {
      // Simply update the character's status
      memberStatus[characterId] = status;

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
  async assignTravelRole(role, characterId) {
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
    // Check if we're in Dragonbane with core set
    const isDragonbane = game.system.id === 'dragonbane';
    const hasCoreSet = game.modules.get('dragonbane-coreset')?.active;

    // Store reference to this actor before creating dialog
    const partyActor = this;

    if (isDragonbane && hasCoreSet) {
      // Show food gathering dialog
      const foodGatheringAvailable = true;

      // Create dialog for camp activities
      new Dialog({
        title: game.i18n.localize('J&J.camp.makeCamp'),
        content: `
          <form>
            <p>${game.i18n.localize('J&J.camp.description')}</p>
            <div class="form-group">
              <label>${game.i18n.localize('J&J.camp.activities')}</label>
              <button type="button" class="gather-food" data-action="gather">
                <i class="fas fa-drumstick-bite"></i>
                ${game.i18n.localize('J&J.FoodGathering.GatherFood')}
              </button>
            </div>
          </form>
        `,
        buttons: {
          rest: {
            icon: '<i class="fas fa-campground"></i>',
            label: game.i18n.localize('J&J.camp.rest'),
            callback: () => {
              ui.notifications.info('The party makes camp for the night.');
              // Consume daily resources if auto-consume is on
              if (partyActor.system.settings.autoConsume) {
                const rationsPerDay =
                  partyActor.system.settings.rationsPerDay * partyActor.system.activeCount;
                const waterPerDay =
                  partyActor.system.settings.waterPerDay * partyActor.system.activeCount;
                partyActor.removeResource('rations', rationsPerDay);
                partyActor.removeResource('water', waterPerDay);
              }
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('Cancel')
          }
        },
        render: html => {
          html.find('.gather-food').click(async () => {
            // Close this dialog and open food gathering dialog
            html.closest('.dialog').find('.close').click();
            await partyActor.openFoodGatheringDialog();
          });
        }
      }).render(true);
    } else {
      // Non-Dragonbane camp making
      ui.notifications.info('The party makes camp for the night.');

      // Consume daily resources if auto-consume is on
      if (this.system.settings.autoConsume) {
        const rationsPerDay = this.system.settings.rationsPerDay * this.system.activeCount;
        const waterPerDay = this.system.settings.waterPerDay * this.system.activeCount;
        this.removeResource('rations', rationsPerDay);
        this.removeResource('water', waterPerDay);
      }
    }

    return true;
  }

  /**
   * Get all characters in the party
   */
  getCharacters() {
    const memberStatus = this.system.memberStatus || {};
    const characterIds = Object.keys(memberStatus);
    return characterIds.map(id => game.actors.get(id)).filter(actor => actor);
  }

  /**
   * Open food gathering dialog
   */
  async openFoodGatheringDialog() {
    const { FoodGatheringSystem } = await import('./food-gathering');
    const foodSystem = FoodGatheringSystem.getInstance();

    // Get party members who can gather
    const members = this.getCharacters();
    if (members.length === 0) {
      ui.notifications.warn('No party members available for food gathering');
      return;
    }

    // Create character selection and gathering type dialog
    const content = `
      <form>
        <div class="form-group">
          <label>${game.i18n.localize('J&J.FoodGathering.SelectCharacter')}</label>
          <select name="character">
            ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('J&J.FoodGathering.SelectActivity')}</label>
          <select name="activity">
            <option value="hunt">${game.i18n.localize('J&J.FoodGathering.Hunt')}</option>
            <option value="fish">${game.i18n.localize('J&J.FoodGathering.Fish')}</option>
            <option value="forage">${game.i18n.localize('J&J.FoodGathering.Forage')}</option>
          </select>
        </div>
      </form>
    `;

    new Dialog({
      title: game.i18n.localize('J&J.FoodGathering.GatherFood'),
      content,
      buttons: {
        gather: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: game.i18n.localize('J&J.FoodGathering.Gather'),
          callback: async html => {
            const formData = new FormDataExtended(html[0].querySelector('form')).object;
            const character = game.actors.get(formData.character);
            const activity = formData.activity;

            if (!character) return;

            let result;
            switch (activity) {
              case 'hunt':
                result = await foodSystem.hunt(character);
                break;
              case 'fish':
                // TODO: Check character inventory for fishing gear
                result = await foodSystem.fish(character, true, false);
                break;
              case 'forage':
                // TODO: Determine current season
                result = await foodSystem.forage(character, 'summer');
                break;
            }

            // Display result
            if (result) {
              ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: character }),
                content: `<div class="food-gathering-result">
                  <h3>${game.i18n.localize(`J&J.FoodGathering.${activity.charAt(0).toUpperCase() + activity.slice(1)}`)}</h3>
                  <p>${result.description}</p>
                  ${result.complications ? `<p class="complications">${result.complications}</p>` : ''}
                </div>`
              });

              // Add rations to party if successful
              if (result.success && result.rations > 0) {
                await this.addResource('rations', result.rations);
                ui.notifications.info(`Added ${result.rations} rations to party supplies`);
              }
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('Cancel')
        }
      }
    }).render(true);
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

    // Get config manager for announcing the change
    const configManager = SystemConfigManager.getInstance();
    const movementConfig = configManager.getMovementRate(isMounted);
    const timeUnit = configManager.getConfig().timeUnit;

    // Announce the change in chat
    ChatMessage.create({
      speaker: { actor: this.id, alias: this.name },
      content: `<h3>${isMounted ? 'Mounted' : 'Dismounted'}</h3>
                <p>The party is now ${isMounted ? 'mounted' : 'on foot'} and moves at ${movementConfig.value}${movementConfig.unit} per ${timeUnit}.</p>`
    });

    return isMounted;
  }

  /**
   * Roll a pathfinding check using the assigned pathfinder's navigation skill
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

    // Get the appropriate skill name from system configuration
    const configManager = SystemConfigManager.getInstance();
    const pathfindingSkill = configManager.getSkillName('pathfinding');

    try {
      // Try to roll the pathfinding skill
      const skillValue = this._getCharacterSkillValue(pathfinder, pathfindingSkill);

      // Create a chat message indicating the roll
      ChatMessage.create({
        speaker: { actor: this.id, alias: this.name },
        content: `<h3>Pathfinding Check</h3><p>${pathfinder.name} is leading the way with ${pathfindingSkill.toUpperCase()} (${skillValue}).</p>`
      });

      // Use the system's roll method if available
      if (pathfinder.rollSkill) {
        return pathfinder.rollSkill(pathfindingSkill);
      } else {
        // Fallback to a basic roll using system-appropriate dice
        const diceFormula = configManager.getDiceFormula('pathfinding');
        const roll = new Roll(diceFormula.toString());
        await roll.evaluate();

        const success = roll.total <= skillValue;

        // Create a chat message with the result
        ChatMessage.create({
          speaker: { actor: this.id, alias: this.name },
          content: `<h3>Pathfinding Result</h3>
                    <p>Roll: ${roll.total} vs ${pathfindingSkill.toUpperCase()} ${skillValue}</p>
                    <p>${success ? 'Success! The party finds the right path.' : 'Failure! The party gets lost.'}</p>`
        });

        return {
          success,
          total: roll.total,
          skill: pathfindingSkill,
          skillValue
        };
      }
    } catch (error) {
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

    // Check permissions - only allow removing own characters or if GM
    if (!game.user.isGM && character && !character.isOwner) {
      ui.notifications.error('You can only remove characters you own from the party.');
      return false;
    }

    // Use Foundry's deletion syntax to remove the character
    const updateData = {
      [`system.memberStatus.-=${characterId}`]: null
    };

    // Check and clear travel roles if this character was assigned
    if (data.roles.pathfinder === characterId) {
      updateData['system.roles.pathfinder'] = '';
    }
    if (data.roles.lookout === characterId) {
      updateData['system.roles.lookout'] = '';
    }
    if (data.roles.quartermaster === characterId) {
      updateData['system.roles.quartermaster'] = '';
    }

    try {
      // Update the actor data - Foundry will handle ObjectField updates properly
      await this.update(updateData);
    } catch (error) {
      ui.notifications.error(`Failed to update party data when removing ${characterName}.`);
      return false;
    }

    // Update ownership if requested - remove ownership from users who no longer have characters in the party
    if (updateOwnership) {
      // Ensure the method exists before calling it
      if (typeof this._updateOwnershipAfterRemoval === 'function') {
        try {
          await this._updateOwnershipAfterRemoval();
        } catch (error) {}
      } else {
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

    // Use deletion syntax to remove all characters
    const updateData = {
      'system.roles.pathfinder': '',
      'system.roles.lookout': '',
      'system.roles.quartermaster': ''
    };

    // Add deletion for each character in memberStatus
    Object.keys(memberStatus).forEach(charId => {
      updateData[`system.memberStatus.-=${charId}`] = null;
    });

    await this.update(updateData);

    // Reset ownership to GM only
    if (typeof this._resetOwnershipToGMOnly === 'function') {
      await this._resetOwnershipToGMOnly();
    } else {
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

    // Create update data using Foundry's deletion syntax
    const updateData = {};

    // Use Foundry's "-=" prefix to delete specific keys from memberStatus
    ownedCharacterIds.forEach(charId => {
      updateData[`system.memberStatus.-=${charId}`] = null;
    });

    // Check if any removed characters had travel roles and clear them
    const roles = data.roles || {};
    if (ownedCharacterIds.includes(roles.pathfinder)) {
      updateData['system.roles.pathfinder'] = '';
    }
    if (ownedCharacterIds.includes(roles.lookout)) {
      updateData['system.roles.lookout'] = '';
    }
    if (ownedCharacterIds.includes(roles.quartermaster)) {
      updateData['system.roles.quartermaster'] = '';
    }

    try {
      await this.update(updateData);

      // Update ownership after removal
      if (typeof this._updateOwnershipAfterRemoval === 'function') {
        await this._updateOwnershipAfterRemoval();
      }

      ui.notifications.info(
        `Removed ${ownedCharacterIds.length} of your characters from the party.`
      );
      return true;
    } catch (error) {
      console.error('Failed to update party actor:', error);
      ui.notifications.error(
        'Failed to remove characters from the party. You may not have permission to update the party.'
      );
      return false;
    }
  }

  /**
   * Grant ownership permissions to players who own characters in the party
   */
  async grantOwnershipToPlayers() {
    const data = this.system;
    const memberStatus = data.memberStatus || {};

    if (Object.keys(memberStatus).length === 0) {
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
        }
      }
    }

    if (ownersAdded > 0) {
      await this.update({ ownership: currentOwnership });
      const playerNames = Array.from(playersGranted).join(', ');
      ui.notifications.info(`Granted party ownership to: ${playerNames}`);
      return true;
    } else {
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
        if (level === 3) {
          // OWNER level
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
      await this.update({ ownership: currentOwnership });
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

    await this.update({ ownership: ownership });
  }
}
