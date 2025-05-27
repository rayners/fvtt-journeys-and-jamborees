# Journeys & Jamborees

> ⚠️ **ALPHA SOFTWARE - NOT READY FOR USE** ⚠️
>
> This module is in early development and is not ready for production use.
> Features are incomplete, APIs will change, and bugs are expected.
>
> **Do not use this in your active games yet!**

A comprehensive party management system for Foundry VTT that works with multiple game systems including Dragonbane, D&D 5e, Pathfinder 2e, and more.

## 📚 Documentation

Full documentation is available at: **[docs.rayners.dev/journeys-and-jamborees](https://docs.rayners.dev/journeys-and-jamborees)**

- [Installation Guide](https://docs.rayners.dev/journeys-and-jamborees/installation)
- [Quick Start Guide](https://docs.rayners.dev/journeys-and-jamborees/quick-start)
- [User Guide](https://docs.rayners.dev/journeys-and-jamborees/party-management)
- [Contributing](https://docs.rayners.dev/journeys-and-jamborees/contributing)

## About

Journeys & Jamborees transforms how groups handle travel, resources, and party dynamics by treating the party as a cohesive unit with its own character sheet. Instead of juggling individual character inventories and tracking party resources across multiple sheets, J&J provides a unified Party actor that serves as the central hub for group activities.

## Development Status

This module is being actively developed. Major features are still being implemented.

- [x] Core party management
- [x] Character status tracking
- [x] Resource tracking
- [ ] Journey logging system
- [ ] Weather and encounter integration
- [ ] Mount management
- [ ] Multi-language support
- [ ] UI/UX polish
- [ ] Testing and bug fixes

Development is tracked privately but bug reports are welcome via [GitHub Issues](https://github.com/rayners/fvtt-journeys-and-jamborees/issues).

## Features

### ✅ Currently Implemented

- **Party Actor**: Custom actor type representing the entire party
- **Character Management**: Add/remove party members with proper permission handling
- **Character Status**: Active, traveling, or staying behind
- **Travel Roles**: Pathfinder, lookout, and quartermaster assignments
- **Resource Tracking**: Shared rations, water, and gold with automatic consumption
- **Party Inventory**: Separate from character inventories
- **Permission System**: Automatic ownership for party members
- **Multi-System Support**: Works with D&D 5e, Pathfinder 2e, Forbidden Lands, Simple Worldbuilding, and more
- **Rest Mechanics**: Automatic resource consumption when camping
- **Food Gathering** (Dragonbane): Hunting, fishing, and foraging with customizable RollTables
- **Journey Tracking**: Distance-based travel with configurable movement rates
- **Testing Framework**: Comprehensive test suite with Vitest and Quench integration

### 🚧 In Development

- Enhanced journey logging with session history
- Advanced weather and encounter systems
- Mount management
- Multi-language support
- Additional system integrations
- Advanced automation features

## Requirements

- Foundry VTT v13.0.0 or later
- A compatible game system (Dragonbane, D&D 5e, Pathfinder 2e, Forbidden Lands, Simple Worldbuilding, or any system with configurable support)

## Installation

### Manual Installation (Current Method)

1. Download the latest release from [GitHub Releases](https://github.com/rayners/fvtt-journeys-and-jamborees/releases)
2. Extract to your Foundry VTT modules directory
3. Restart Foundry VTT
4. Enable the module in your world

### Future Installation

Once published to the Foundry package repository:

```
https://github.com/rayners/fvtt-journeys-and-jamborees/releases/latest/download/module.json
```

## System Support

Journeys & Jamborees is designed to work with any game system in Foundry VTT:

- **Pre-configured**: Dragonbane, D&D 5e, Pathfinder 2e, Forbidden Lands
- **Configurable**: Customize movement rates, skills, and dice formulas for any system
- **Automatic**: Falls back to sensible defaults for unknown systems

See the [System Configuration Guide](https://docs.rayners.dev/journeys-and-jamborees/system-configuration) for details.

## Quick Start

1. Create a new "Party" actor
2. Add player characters to the party
3. Assign travel roles
4. Track resources and manage inventory
5. Begin your journey!

For detailed instructions, see the [Quick Start Guide](https://docs.rayners.dev/journeys-and-jamborees/quick-start).

## Contributing

Thank you for your interest in contributing to Journeys & Jamborees! We welcome community involvement.

### How to Contribute

- 🐛 **Bug Reports**: Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 **Feature Requests**: Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md)
- 🧪 **Testing**: Help test with different game systems and workflows
- 📖 **Documentation**: Improve guides and add examples
- 🌐 **Translations**: Localize the module for other languages

### Getting Started

1. Read our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines
2. Check our [Support Guide](SUPPORT.md) for help and community channels
3. Review the [Security Policy](SECURITY.md) for responsible disclosure

### Testing & Debugging

This module includes comprehensive test coverage:

- **Unit tests** via `npm test` for development
- **In-app tests** via [Quench](https://foundryvtt.com/packages/quench) for end-to-end testing

When reporting bugs:

1. Use the bug report template with all required information
2. Run Quench test suites and include results
3. Include console errors and reproduction steps

For more details, see our [full documentation](https://docs.rayners.dev/journeys-and-jamborees).

## Support

- **Documentation**: [docs.rayners.dev/journeys-and-jamborees](https://docs.rayners.dev/journeys-and-jamborees)
- **Bug Reports**: [GitHub Issues](https://github.com/rayners/fvtt-journeys-and-jamborees/issues)
- **Discussion**: Foundry VTT Discord #module-discussion

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- The Dragonbane RPG by Free League Publishing
- The Foundry VTT development community
- All alpha testers and contributors
