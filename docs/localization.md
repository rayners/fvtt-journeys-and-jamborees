# Localization Guide

Journeys & Jamborees supports full localization for international users. This guide explains how to contribute translations or create new language packs.

## Current Status

- **English (en)**: Complete ✅
- **Other languages**: Community contributions welcome

## Translation Files

Translation files are located in the `languages/` directory:

```
languages/
└── en.json          # English (reference)
```

## Creating a New Translation

### 1. Copy the English File

Create a new translation file based on the English template:

```bash
cp languages/en.json languages/[language-code].json
```

Common language codes:
- `de` - German
- `fr` - French  
- `es` - Spanish
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese

### 2. Update module.json

Add your language to the module's language list in `module.json`:

```json
"languages": [
  {
    "lang": "en",
    "name": "English",
    "path": "languages/en.json"
  },
  {
    "lang": "de",
    "name": "Deutsch",
    "path": "languages/de.json"
  }
]
```

### 3. Translate the Strings

Edit your language file to translate all strings while keeping the JSON structure intact:

```json
{
  "J&J": {
    "ui": {
      "party-sheet": {
        "members": "Mitglieder",           // German
        "rations": "Rationen",
        "water": "Wasser"
      }
    }
  }
}
```

## Translation Guidelines

### Key Structure

**DO NOT** change the keys, only the values:

```json
// ✅ Correct
"members": "Mitglieder"

// ❌ Wrong - don't change the key
"mitglieder": "Mitglieder"
```

### Placeholders

Some strings contain placeholders that should remain unchanged:

```json
// Keep placeholders like {name} intact
"characterJoined": "{name} ist der Gruppe beigetreten"
```

### Context Matters

Consider the UI context when translating:

- **Short labels**: Keep concise for UI buttons
- **Descriptions**: Can be more detailed
- **Error messages**: Should be clear and helpful

### Game Terms

Some terms should match the official game translation:

- "Pathfinder" → Use official Dragonbane term
- "Rations" → Use official game terminology
- Character attributes → Match system translations

## Testing Your Translation

1. Set your Foundry language to your new language
2. Load a world with the module enabled
3. Check all UI elements render correctly
4. Test with different string lengths
5. Verify special characters display properly

## File Structure Reference

The translation file follows this structure:

```json
{
  "J&J": {
    "ui": {
      "party-sheet": {
        // UI labels and buttons
      }
    },
    "members": {
      // Member management strings
    },
    "travelStatus": {
      // Travel status options
    },
    "travelRoles": {
      // Travel role names
    },
    "characterStatus": {
      // Character status options  
    },
    "travelActions": {
      // Travel action buttons
    },
    "resources": {
      // Resource management
    },
    "settings": {
      // Settings page labels
    }
  }
}
```

## Submitting Translations

### For Alpha/Beta

During development, you can:

1. Create an issue with your translation file attached
2. Share via Discord or email
3. Wait for formal contribution process

### Future Process

Once the module accepts contributions:

1. Fork the repository
2. Add your translation file
3. Update `module.json`
4. Submit a pull request
5. Test in review process

## Translation Maintenance

- Translations may need updates as features are added
- Major UI changes will require translation updates
- Community translators will be credited in the module

## Questions?

For translation questions:
- Check existing issues on GitHub
- Ask in the Foundry VTT Discord
- Contact the maintainer

Thank you for helping make Journeys & Jamborees accessible to international users!