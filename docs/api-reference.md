# Journeys & Jamborees API Reference

This document describes the public APIs available for developers who want to interact with the Journeys & Jamborees module.

## Accessing the API

The module's API is available through the game modules collection:

```javascript
const jjApi = game.modules.get('journeys-and-jamborees').api;
```

## Party Actor API

The Party actor extends Foundry's base Actor class with additional methods for party management.

### Properties

#### `partyActor.memberStatus`
Object mapping character IDs to their status and activities.

```javascript
// Example structure
{
  "characterId123": {
    status: "active", // "active", "traveling", or "stayingBehind"
    downtimeActivity: "hunting" // Optional downtime activity
  }
}
```

#### `partyActor.activeMembers`
Array of character IDs that are currently active.

#### `partyActor.travelingMembers`
Array of character IDs that are traveling but not active.

#### `partyActor.stayingBehindMembers`
Array of character IDs that are staying behind.

### Methods

#### `partyActor.addCharacter(characterId)`
Add a character to the party.

**Parameters:**
- `characterId` (string): The ID of the character actor to add

**Returns:** Promise<Actor>

**Example:**
```javascript
const character = game.actors.get("characterId123");
await partyActor.addCharacter(character.id);
```

#### `partyActor.removeCharacter(characterId)`
Remove a character from the party.

**Parameters:**
- `characterId` (string): The ID of the character to remove

**Returns:** Promise<Actor>

#### `partyActor.setCharacterStatus(characterId, status, downtimeActivity?)`
Update a character's status within the party.

**Parameters:**
- `characterId` (string): The character to update
- `status` (string): One of "active", "traveling", or "stayingBehind"
- `downtimeActivity` (string, optional): Activity if traveling

**Returns:** Promise<Actor>

#### `partyActor.assignTravelRole(role, characterId)`
Assign a character to a travel role.

**Parameters:**
- `role` (string): One of "pathfinder", "lookout", or "quartermaster"
- `characterId` (string): The character to assign

**Returns:** Promise<Actor>

#### `partyActor.removeTravelRole(role)`
Remove a character from a travel role.

**Parameters:**
- `role` (string): The role to clear

**Returns:** Promise<Actor>

#### `partyActor.consumeResources()`
Consume daily rations and water based on party size and settings.

**Returns:** Promise<Object> - Object with consumed amounts

**Example:**
```javascript
const consumed = await partyActor.consumeResources();
// { rations: 5, water: 5 }
```

#### `partyActor.rollPathfinding()`
Roll a pathfinding check using the assigned pathfinder's skill.

**Returns:** Promise<Roll|null>

#### `partyActor.rollRandomEncounter()`
Roll for a random encounter based on system settings.

**Returns:** Promise<Roll>

#### `partyActor.addOwnCharacters(userId)`
Add all characters owned by a specific user.

**Parameters:**
- `userId` (string): The user ID

**Returns:** Promise<Array<string>> - Added character IDs

#### `partyActor.resetPartyData()`
Clear all party data (characters, resources, roles).

**Returns:** Promise<Actor>

## Food Gathering API (Dragonbane Only)

Access the food gathering system for Dragonbane games.

```javascript
const foodGathering = game.modules.get('journeys-and-jamborees').api.foodGathering;
```

### Methods

#### `foodGathering.hunt(actor)`
Perform a hunting check.

**Parameters:**
- `actor` (Actor): The character performing the hunt

**Returns:** Promise<Object>
```javascript
{
  success: true,
  rations: 5,
  result: "Deer",
  description: "You successfully hunted a deer!"
}
```

#### `foodGathering.fish(actor, hasRod, hasNet)`
Perform a fishing check.

**Parameters:**
- `actor` (Actor): The character fishing
- `hasRod` (boolean): Whether they have a fishing rod
- `hasNet` (boolean): Whether they have a fishing net

**Returns:** Promise<Object>

#### `foodGathering.forage(actor, season)`
Perform a foraging check.

**Parameters:**
- `actor` (Actor): The character foraging
- `season` (string): Current season ("spring", "summer", "autumn", "winter")

**Returns:** Promise<Object>

## Dragonbane Roll API

Simplified API for rolling Dragonbane skills programmatically.

```javascript
const rollApi = game.modules.get('journeys-and-jamborees').api.dragonbaneRoll;
```

### Methods

#### `rollApi.rollSkill(actor, skillName, options?)`
Roll a skill check for a Dragonbane character.

**Parameters:**
- `actor` (Actor): The character making the roll
- `skillName` (string): Name of the skill
- `options` (Object, optional):
  - `modifier` (number): Bonus/penalty to the roll
  - `push` (boolean): Whether this is a pushed roll
  - `skipDialog` (boolean): Skip the roll dialog

**Returns:** Promise<Roll>

**Example:**
```javascript
const roll = await rollApi.rollSkill(actor, "BUSHCRAFT", {
  modifier: 2,
  skipDialog: true
});
```

## Events

The module dispatches several custom events through Foundry's hooks system.

### `jj.partyMemberAdded`
Fired when a character is added to a party.

**Parameters:**
- `party` (Actor): The party actor
- `characterId` (string): The added character's ID

### `jj.partyMemberRemoved`
Fired when a character is removed from a party.

**Parameters:**
- `party` (Actor): The party actor
- `characterId` (string): The removed character's ID

### `jj.partyStatusChanged`
Fired when a character's status changes.

**Parameters:**
- `party` (Actor): The party actor
- `characterId` (string): The character whose status changed
- `newStatus` (string): The new status
- `oldStatus` (string): The previous status

### `jj.resourcesConsumed`
Fired when party resources are consumed.

**Parameters:**
- `party` (Actor): The party actor
- `consumed` (Object): Object with rations and water consumed

## System Configuration API

Access system-specific configuration.

```javascript
const config = game.modules.get('journeys-and-jamborees').api.systemConfig;
```

### Methods

#### `config.getSystemConfig(systemId)`
Get configuration for a specific system.

**Parameters:**
- `systemId` (string): The system ID (e.g., "dnd5e")

**Returns:** Object with system configuration

#### `config.getCurrentSystemConfig()`
Get configuration for the currently active system.

**Returns:** Object with system configuration

## Example Usage

### Creating a Party and Adding Members

```javascript
// Create a new party
const partyData = {
  name: "The Brave Adventurers",
  type: "journeys-and-jamborees.party"
};
const party = await Actor.create(partyData);

// Add all player characters
const players = game.users.filter(u => !u.isGM);
for (const player of players) {
  const characterIds = await party.addOwnCharacters(player.id);
  console.log(`Added ${characterIds.length} characters for ${player.name}`);
}

// Assign travel roles
const pathfinder = game.actors.getName("Aragorn");
await party.assignTravelRole("pathfinder", pathfinder.id);
```

### Handling Daily Travel

```javascript
// Morning routine
async function morningRoutine(party) {
  // Roll for weather
  const weather = await party.rollWeather();
  
  // Pathfinding check
  const pathfindingRoll = await party.rollPathfinding();
  
  // Check for encounters
  const encounterRoll = await party.rollRandomEncounter();
  
  // Update distance traveled
  const currentDistance = party.system.journey.distanceTraveled;
  const dailyMovement = party.system.movement.daily;
  await party.update({
    "system.journey.distanceTraveled": currentDistance + dailyMovement
  });
}

// Evening routine
async function eveningRoutine(party) {
  // Make camp
  await party.update({ "system.travelStatus": "camping" });
  
  // Consume resources
  const consumed = await party.consumeResources();
  
  // Food gathering (Dragonbane only)
  if (game.system.id === "dragonbane") {
    const foodApi = game.modules.get('journeys-and-jamborees').api.foodGathering;
    
    for (const characterId of party.travelingMembers) {
      const character = game.actors.get(characterId);
      const activity = party.system.memberStatus[characterId].downtimeActivity;
      
      if (activity === "hunting") {
        const result = await foodApi.hunt(character);
        if (result.success) {
          await party.update({
            "system.resources.rations": party.system.resources.rations + result.rations
          });
        }
      }
    }
  }
}
```

### Listening to Party Events

```javascript
// Monitor party changes
Hooks.on("jj.partyMemberAdded", (party, characterId) => {
  const character = game.actors.get(characterId);
  ui.notifications.info(`${character.name} joined ${party.name}!`);
});

Hooks.on("jj.resourcesConsumed", (party, consumed) => {
  if (party.system.resources.rations < party.activeMembers.length) {
    ui.notifications.warn(`${party.name} is running low on food!`);
  }
});
```

## Best Practices

1. **Always check if the API exists** before using it:
   ```javascript
   const module = game.modules.get('journeys-and-jamborees');
   if (module?.api) {
     // Use the API
   }
   ```

2. **Handle system-specific features** gracefully:
   ```javascript
   if (game.system.id === "dragonbane" && module.api.foodGathering) {
     // Use food gathering
   }
   ```

3. **Use async/await** for all API methods as they return promises

4. **Listen to hooks** instead of polling for changes

5. **Respect permissions** - the API enforces the same permission rules as the UI

## Supporting Development

Consider supporting continued development of this module:

- **GitHub Sponsors**: [github.com/sponsors/rayners](https://github.com/sponsors/rayners)
- **Patreon**: [patreon.com/rayners](https://patreon.com/rayners)

Your support helps fund ongoing development and maintenance.