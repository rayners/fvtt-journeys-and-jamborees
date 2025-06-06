# Using Journeys & Jamborees with Simple Worldbuilding

This guide helps you set up and use the Journeys & Jamborees module with the Simple Worldbuilding system.

## Overview

Simple Worldbuilding is a minimal game system that allows you to create custom attributes and mechanics. Journeys & Jamborees adapts to this flexibility by using your custom attributes as skills for travel roles.

## Initial Setup

### 1. Character Attributes

Before using J&J, ensure your characters have attributes that can serve as skills. For example:

```
Character Attributes:
- Navigation (for pathfinding)
- Awareness (for lookout duties)  
- Leadership (for quartermaster role)
```

### 2. Configure Module Settings

1. Go to **Game Settings** → **Configure Settings** → **Module Settings**
2. Find the **Journeys & Jamborees** section
3. Configure the following:

#### Movement Settings
- **Base Movement (On Foot)**: 25 units (adjust to your world's scale)
- **Base Movement (Mounted)**: 50 units
- **Movement Unit**: Change from "units" to your preferred measurement

#### Skill Assignments
- **Pathfinder Skill**: Select the attribute used for navigation
- **Lookout Skill**: Select the attribute used for perception/awareness
- **Quartermaster Skill**: Select the attribute used for management/leadership

If no suitable attributes exist, you can:
- Select "None" to disable skill checks for that role
- Create new attributes on your character templates

#### Dice Formulas
The default dice formulas work well for most games:
- **Random Encounters**: 1d20 (≥15 triggers encounter)
- **Weather Roll**: 1d6
- **Pathfinding Check**: 1d20

## Creating Your First Party

1. Click **Create Actor** in the Actors tab
2. Select **Party** as the actor type
3. Name your party (e.g., "The Adventuring Company")
4. Open the party sheet

## Managing Party Members

### Adding Characters
1. Open the party sheet
2. Go to the **Members** tab
3. Drag character actors from the sidebar into the party
4. Set their status:
   - **Active**: Participating in current activities
   - **Traveling**: With the party but not active
   - **Staying Behind**: Not traveling with the party

### Assigning Travel Roles
1. Go to the **Travel** tab
2. Assign roles by selecting characters:
   - **Pathfinder**: Navigates and scouts ahead
   - **Lookout**: Watches for danger
   - **Quartermaster**: Manages supplies

## Resource Management

Track party resources in the **Inventory** tab:
- **Rations**: Food supplies
- **Water**: Water supplies  
- **Arrows**: Ammunition (optional)
- **Torches**: Light sources (optional)

Click the +/- buttons to adjust quantities.

## Travel System

### Starting Travel
1. Ensure roles are assigned
2. Click **Start Travel** 
3. The party will move based on your configured movement rate
4. Time passes in "periods" (generic time units)

### During Travel
- **Check for Encounters**: Roll for random encounters
- **Check Weather**: Roll for weather conditions
- **Make Camp**: Set up camp (reduces resources)

### Customizing for Your World

Since Simple Worldbuilding is flexible, consider:

1. **Custom Attributes**: Create specific travel-related attributes
   - "Wilderness Lore" for pathfinding
   - "Vigilance" for lookout duties
   - "Resource Management" for quartermaster

2. **Scale Adjustment**: Modify movement rates to match your world
   - Adjust the base movement values
   - Change the unit names in descriptions

3. **Resource Types**: You can track the default resources or roleplay others
   - The module tracks quantities, you define what they represent

## Troubleshooting

### No Skills Showing in Settings
This is normal for Simple Worldbuilding. Either:
1. Create a character with attributes first
2. Select "None" for skills you don't want to use
3. The module will use basic functionality without skill checks

### "Configure Me" Message
This appears when no attributes are detected. Create a character with custom attributes, then refresh the settings page.

### Generic Values
The module uses generic terms like "units" and "period" to fit any world. Interpret these according to your game's fiction.

## Tips for Game Masters

1. **Define Your Scale**: Decide what "25 units" means in your world
   - Could be miles, kilometers, leagues, or abstract distances
   - Adjust the movement settings accordingly

2. **Skill Alternatives**: If you don't use attributes for skills
   - Select "None" for all travel roles
   - Use the journey log to track events narratively
   - Roll dice manually when needed

3. **Resource Interpretation**: The tracked resources are abstract
   - "Rations" could be any consumable
   - "Water" could represent any vital supply
   - Use what makes sense for your setting

## Example Setup

Here's a sample configuration for a fantasy world:

**Attributes on Characters:**
- Survival (value: 10-20)
- Perception (value: 10-20)  
- Leadership (value: 10-20)

**Module Settings:**
- Movement (On Foot): 20 miles
- Movement (Mounted): 40 miles
- Pathfinder Skill: Survival
- Lookout Skill: Perception
- Quartermaster Skill: Leadership

This creates a simple but functional travel system for your Simple Worldbuilding game!

## Supporting Development

Consider supporting continued development of this module:

- **GitHub Sponsors**: [github.com/sponsors/rayners](https://github.com/sponsors/rayners)
- **Patreon**: [patreon.com/rayners](https://patreon.com/rayners)

Your support helps fund ongoing development and maintenance.