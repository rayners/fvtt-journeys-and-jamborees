# System Configuration Guide

Journeys & Jamborees is designed to work with multiple game systems in Foundry VTT. This guide explains how to configure the module for your game system.

## Supported Systems

The module comes with pre-configured settings for the following systems:

- **Dragonbane** - Full support with all features
- **D&D 5th Edition** - Full support with appropriate skill mappings
- **Pathfinder 2e** - Full support with PF2e skill system
- **Forbidden Lands** - Full support, compatible with existing party mechanics
- **Simple Worldbuilding** - Basic support with generic configurations
- **Other Systems** - Automatic detection with configurable settings

## Configuration Settings

You can customize the module for your system through the module settings:

### Movement Settings

- **Movement Rate (On Foot)**: Distance traveled per time period when walking
- **Movement Rate (Mounted)**: Distance traveled per time period when mounted
- **Movement Unit**: Unit of measurement (km, miles, hexes, etc.)

### Skill Configuration

- **Pathfinder Skill Name**: The skill used for finding paths (e.g., Survival, Bushcraft)
- Additional skills are automatically mapped based on your system

### Dice Configuration

- **Random Encounter Dice**: Dice formula for encounter checks (e.g., 1d20, 1d6)
- **Encounter Threshold**: Minimum roll to trigger an encounter
- **Weather Dice**: Dice formula for weather determination

## System-Specific Notes

### Dragonbane
- Default movement: 15km on foot, 30km mounted per shift
- Uses Bushcraft for pathfinding, Awareness for lookout, Bartering for quartermaster
- Random encounters on 18+ (1d20)

### D&D 5th Edition
- Default movement: 24 miles per day on foot, 30 miles mounted
- Uses Survival for pathfinding, Perception for lookout, Persuasion for quartermaster
- Random encounters on 15+ (1d20)

### Pathfinder 2e
- Default movement: 24 miles per day on foot, 32 miles mounted
- Uses Survival for pathfinding, Perception for lookout, Diplomacy for quartermaster
- Random encounters on 15+ (1d20)

### Forbidden Lands
- Default movement: 10km per quarter day on foot, 20km mounted
- Uses Survival for pathfinding, Scouting for lookout, Manipulation for quartermaster
- Different encounter system (1d6)

## Customizing for Your System

If your system isn't listed above or you want to customize the settings:

1. Open **Game Settings** → **Module Settings** → **Journeys & Jamborees**
2. Adjust the movement rates to match your system's travel rules
3. Set the appropriate skill names for your system
4. Configure dice formulas to match your system's mechanics

### Example: Customizing for a Homebrew System

```
Movement (On Foot): 5 hexes
Movement (Mounted): 8 hexes  
Movement Unit: hexes
Pathfinder Skill: Navigation
Random Encounter Dice: 2d6
Encounter Threshold: 10
Weather Dice: 1d8
```

## API for Developers

If you're a system developer and want to add native support for your system:

```javascript
// The module uses a SystemConfigManager that can be extended
import { SystemConfigManager } from './system-config';

// Get current configuration
const config = SystemConfigManager.getInstance().getConfig();

// Access specific values
const onFootSpeed = config.movement.onFoot.value;
const pathfindingSkill = config.skills.pathfinding;
```

## Troubleshooting

### Characters don't have the expected skills
- Check that skill names in settings match your system's skill names exactly
- Skill names are case-insensitive

### Movement calculations seem wrong
- Verify movement units match your system (km vs miles vs hexes)
- Check if your system uses different time periods (day vs shift vs watch)

### Dice rolls aren't working
- Ensure dice formulas are valid Foundry roll formulas
- Test formulas in the chat with `/r <formula>` first

## Contributing System Support

If you'd like to contribute pre-configured settings for additional systems, please submit a pull request or open an issue on GitHub with the system's:
- Movement rates and units
- Skill names for pathfinding, lookout, and quartermaster roles
- Dice formulas and thresholds
- Any special considerations