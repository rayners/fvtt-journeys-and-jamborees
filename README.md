# Journeys & Jamborees

A party management system for Dragonbane in Foundry VTT.

## Description

This module adds a party management system to Dragonbane in Foundry VTT. It allows players to manage their party as a whole, tracking travel roles, shared resources, and party-wide actions.

## Features

- Party Actor: Represent your party as a Foundry actor
- Travel Roles: Assign party members to different travel roles
- Character Status: Track which characters are active, traveling, or staying behind
- Resource Management: Track shared resources like food and water
- HUD Integration: Access party management directly from the token HUD
- ARGON Integration: Additional quick actions when ARGON HUD is installed
- Localization Support: Fully localized UI with support for multiple languages

## Installation

You can install this module by searching for "Journeys & Jamborees" in the Foundry VTT module browser, or by using the following manifest URL:

```
https://github.com/yourusername/journeys-and-jamborees/releases/latest/download/module.json
```

After installation, you need to properly set up the template files:

### Fix Template Files

1. Locate your Foundry VTT modules directory:
   - Windows: `%APPDATA%\Local\FoundryVTT\Data\modules\journeys-and-jamborees\`
   - macOS: `~/Library/Application Support/FoundryVTT/Data/modules/journeys-and-jamborees/`
   - Linux: `~/.local/share/FoundryVTT/Data/modules/journeys-and-jamborees/`

2. Create a templates directory:
   ```bash
   mkdir -p "[YOUR_FOUNDRY_DATA_PATH]/modules/journeys-and-jamborees/templates"
   ```

3. Copy the template files from the root directory to the templates directory:
   ```bash
   cp "[YOUR_FOUNDRY_DATA_PATH]/modules/journeys-and-jamborees/party-sheet.hbs" "[YOUR_FOUNDRY_DATA_PATH]/modules/journeys-and-jamborees/templates/"
   cp "[YOUR_FOUNDRY_DATA_PATH]/modules/journeys-and-jamborees/party-hud.hbs" "[YOUR_FOUNDRY_DATA_PATH]/modules/journeys-and-jamborees/templates/"
   ```

### Temporary Fix

If you can't manually fix the files, you can paste the following code into your browser console when Foundry is loaded:

```javascript
// Run this in browser console
// Check the template-fix.js file in the module for the full code
loadTemplates = (function(original) {
  return function(paths) {
    const fixedPaths = paths.map(path => {
      if (path.includes('templates') && path.includes('journeys-and-jamborees')) {
        return path.replace('templates/', '');
      }
      return path;
    });
    return original(fixedPaths);
  };
})(loadTemplates);
```

## Usage

After installing and enabling the module, create a new Party actor from the Actors directory. This actor will represent your party and can be placed on the scene as a token.

## Localization

The module comes with English translations by default. If you want to add support for another language, you can create a new translation file in the `languages` directory. See the [Localization Guide](./docs/localization.md) for more details.

## Troubleshooting

### Party Actor Type Not Available

If "Party" doesn't appear as an actor type option when creating a new actor, try these solutions:

1. **Restart Foundry VTT completely** - Sometimes a full restart resolves initialization issues.

2. **Check the console for errors** - Press F12 to open your browser's developer console and look for error messages.

3. **Try the helper script** - This module includes a helper script that can fix actor type registration issues:
   - Install the "Module Management+" or "Console Wizard" modules
   - Copy the contents of `party-actor-type-helper.js` into a new script
   - Run the script before creating a party actor

4. **Check system compatibility** - Ensure you're using Dragonbane system version 0.5.0 or later.

5. **Load order issue** - If you have many modules, try moving this module to load later than others by adjusting priorities in Module Management+.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Dragonbane RPG by Free League Publishing
- The Foundry VTT development community
