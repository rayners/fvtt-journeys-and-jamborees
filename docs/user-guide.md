# Journeys & Jamborees User Guide

> ⚠️ **Alpha Software**: This guide describes features as they currently exist. Some functionality may be incomplete or change in future versions.

## Quick Start

### Creating Your First Party

1. **Open the Actors tab** in Foundry VTT
2. **Click "Create Actor"**
3. **Select "Party" from the actor type dropdown**
4. **Name your party** (e.g., "The Brave Adventurers")
5. **Click "Create"**

Your new party actor will appear in the actors list and can be placed on scenes as a token.

### Adding Characters to the Party

#### For Players
- **Drag and drop** your character from the Actors list onto the party sheet
- **Or click "Add All Your Characters"** to add all characters you own

#### For GMs
- Can add any character to any party
- Use "Add All Characters" to add all player characters at once

### Setting Up Travel Roles

Travel roles help organize party responsibilities:

1. **Open the party sheet**
2. **Go to the Members tab**
3. **Scroll down to "Travel Roles"**
4. **Assign roles from dropdown menus:**
   - **Pathfinder**: Uses Bushcraft skill for navigation
   - **Lookout**: Uses Awareness skill to spot danger
   - **Quartermaster**: Uses Bartering skill for supplies

*Note: Only "Active" characters can be assigned to roles*

## Character Status

Each party member has a status that affects their availability:

- **Active**: Participating fully in party activities
- **Traveling**: Moving with the party but doing downtime activities
- **Staying Behind**: Not with the party (at camp, in town, etc.)

### Changing Character Status

1. **Find the character** in the party sheet
2. **Use the status dropdown** next to their name
3. **Select the new status**

### Downtime Activities

Characters with "Traveling" status can perform downtime activities:
- **None**: Just traveling
- **Hunting**: Attempting to find food
- **Fishing**: Trying to catch fish
- **Foraging**: Searching for edible plants
- **Crafting**: Making or repairing items
- **Healing**: Recovering from injuries

## Resource Management

### Tracking Resources

The party sheet tracks shared resources:

- **Rations**: Food supplies for the party
- **Water**: Drinking water for the party

Resource counters appear:
- In the header of the party sheet
- On the Inventory tab for detailed management

### Managing Resources

**Adding Resources:**
1. Go to the **Inventory tab**
2. Click the **+ button** next to the resource
3. Increase the count as needed

**Using Resources:**
- Click the **- button** to decrease resources
- Use the **"Distribute" button** for role-playing resource allocation

**Resource Warnings:**
- Resources turn red when insufficient for the party size
- Default assumption: 1 ration and 1 water per character per day

## Travel Features

### Travel Status

Set the party's current activity:
- **Traveling**: Party is on the move
- **Resting**: Taking a break
- **Camping**: Set up for the night

### Journey Tracking

*Note: Journey features are partially implemented*

1. **Go to the Travel tab**
2. **Fill in journey details:**
   - Origin and destination
   - Total distance
   - Distance traveled
   - Terrain type

### Travel Actions

*Note: These buttons exist but functionality is limited*

- **Find Path**: Roll pathfinding checks
- **Random Encounter**: Generate encounters
- **Roll Weather**: Determine weather conditions
- **Make Camp**: Set up camp for rest

## Food Gathering (Dragonbane)

*Note: Food gathering is available only for Dragonbane system with the Core Set module*

### Using Food Gathering

When making camp in Dragonbane, party members can gather food through:

1. **Hunting**: Track and kill animals for meat
2. **Fishing**: Catch fish with rod or net  
3. **Foraging**: Find edible plants and fungi

Food gathering uses configurable skills (default: Hunting & Fishing for hunting/fishing, Bushcraft for foraging).

### Customizing Food Tables

The module uses Foundry's RollTable system for flexible food gathering results.

#### Official Content vs Generic Tables

- **With Dragonbane Core Set**: Uses official hunting and foraging tables from the rulebook
- **Without Core Set**: Uses generic tables to avoid copyright issues
- **Custom Worlds**: You can create your own tables for any setup

#### Creating Custom Food Tables

**Step 1: Create the RollTable**
1. Go to **Compendium Packs** or **Items** tab
2. Click **Create RollTable** 
3. Name it appropriately:
   - `"J&J Hunting Table"` for hunting
   - `"J&J Foraging Table"` for foraging

**Step 2: Add Table Results**
Add results with the following structure:

| Range | Text | Weight |
|-------|------|--------|
| 1-1 | Squirrel | 1 |
| 2-2 | Crow | 1 |
| 3-3 | Rabbit | 1 |
| 4-4 | Fox | 1 |
| 5-5 | Boar | 1 |
| 6-6 | Deer | 1 |

**Step 3: Configure Result Flags**
For each result, add flags under `journeys-and-jamborees`:

```json
{
  "rations": "1d3",
  "requiresWeapon": true,
  "canUseTrap": true,
  "dangerous": false
}
```

#### Flag Options

**For Hunting Results:**
- `rations`: Amount of food (number or dice formula like "1d3", "2d6")
- `requiresWeapon`: Does this animal require a ranged weapon? (true/false)
- `canUseTrap`: Can this animal be caught with traps? (true/false) 
- `dangerous`: Is this animal dangerous if hunting fails? (true/false)

**For Foraging Results:**
- `rations`: Amount of food found (number or dice formula)

#### Example Custom Hunting Table

**Arctic Hunting Table:**
- Ice Fox (1d2 rations, requires weapon, can trap)
- Seal (1d6 rations, requires weapon, cannot trap)
- Caribou (2d8 rations, requires weapon, cannot trap)
- Arctic Hare (1d3 rations, requires weapon, can trap)
- Polar Bear (3d6 rations, requires weapon, cannot trap, dangerous)

**Desert Foraging Table:**
- Cactus Fruit (1 ration)
- Desert Sage (1d2 rations)
- Prickly Pear (1d3 rations)
- Nothing Edible (0 rations)

#### Table Detection

The module automatically finds your custom tables by name:
- Tables containing "hunting" are used for hunting
- Tables containing "foraging" are used for foraging
- If multiple tables exist, it uses the first one found
- Official tables take precedence when Core Set is active

#### Tips for Custom Tables

1. **Balance Results**: Include both good and poor outcomes
2. **Use Dice Formulas**: Makes results more variable and interesting
3. **Consider Your Setting**: Match animals/plants to your world's environment
4. **Test Your Tables**: Roll them manually to check balance
5. **Seasonal Variants**: Create different tables for different seasons/regions

## Party Inventory

### Shared Items

The party has its own inventory separate from character items:

1. **Go to the Inventory tab**
2. **Click "Add" to create new items**
3. **Drag items from character sheets** to share them

### Item Management

- **Edit items** by clicking the edit icon
- **Delete items** by clicking the trash icon
- **Track quantities** for stackable items

## Journal and Notes

### Party Journal

1. **Go to the Journal tab**
2. **Use the rich text editor** for party descriptions
3. **Add notes** in the text area below
4. **Link journal entries** from the Foundry journal

### Linked Journals

Connect Foundry journal entries to your party:
1. **Click "Link" in the Linked Journals section**
2. **Select journal entries** from your world
3. **Access them quickly** from the party sheet

## Settings and Configuration

### Party Settings

**Go to the Settings tab** to configure:

- **Base Movement**: How far the party travels per day
- **Rations Per Character Per Day**: Food consumption rate
- **Water Per Character Per Day**: Water consumption rate
- **Encounter Chance**: Probability of random encounters
- **Token Scale**: Size of party token on maps
- **Show Party HUD**: Enable/disable HUD integration
- **Auto-consume Resources**: Automatic resource deduction
- **Show Warnings**: Resource warning notifications

### Danger Zone

**Reset Party Data**: Clears all party information (use with caution!)

## Permissions and Ownership

### Player Permissions

- Players can **add/remove only their own characters**
- Players **cannot modify** other players' characters
- Players **share ownership** of parties containing their characters

### GM Permissions

- GMs can **manage all characters** in any party
- GMs can **modify all party settings**
- GMs can **access all party features**

### Automatic Ownership

When you add a character to a party:
- You **automatically gain ownership** of that party
- Other players with characters in the party **also get ownership**
- **Everyone can view and edit** the shared party information

## Tips and Best Practices

### Getting Started

1. **Create one party per adventure group**
2. **Add all player characters** at the start of a session
3. **Assign travel roles** based on character skills
4. **Set starting resources** appropriate for your journey

### During Play

1. **Update character status** as the story progresses
2. **Track resource consumption** during travel
3. **Use the journey log** to record important events
4. **Change travel roles** as situations require

### GM Advice

1. **Use party tokens** to represent the group on travel maps
2. **Check resource levels** before long journeys
3. **Adjust settings** to match your campaign style
4. **Reset party data** when starting new adventures

## Troubleshooting

### Common Issues

**"Party" actor type not available:**
- Restart Foundry VTT completely
- Check that the module is enabled
- Verify you're using Dragonbane system

**Characters not appearing:**
- Check character ownership
- Verify the character is properly created
- Try refreshing the party sheet

**Permission errors:**
- Ensure you own the character you're trying to add
- Check that you have appropriate permissions
- Contact your GM if issues persist

### Getting Help

- Check the [GitHub Issues](https://github.com/rayners/fvtt-journeys-and-jamborees/issues)
- Ask in the Foundry VTT Discord
- Report bugs with detailed reproduction steps

## What's Coming Next

### Near-term Features

- Enhanced journey tracking
- Weather integration
- Mount management
- Resource automation

### Future Plans

- Support for other game systems
- Advanced travel mechanics
- Campaign milestone tracking
- Enhanced automation features

---

*This guide will be updated as features are added and refined. Check back regularly for the latest information!*