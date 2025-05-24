# Changelog

> **Development Status**: Journeys & Jamborees is in active development. Breaking changes may occur between versions until v1.0 release.

## [Unreleased]

### Added
- System-agnostic support for multiple game systems
- Pre-configured support for D&D 5e, Pathfinder 2e, and Forbidden Lands
- System configuration settings for movement, skills, and dice formulas
- System adapter pattern for handling different skill systems
- System Configuration Guide documentation
- Comprehensive README documentation
- CONTRIBUTING.md with contribution guidelines
- Improved development documentation in CLAUDE.md
- Comprehensive testing infrastructure with Vitest for unit tests
- Quench integration for end-to-end testing within Foundry VTT
- System-specific test suites for Dragonbane, D&D 5e, PF2e, Forbidden Lands
- Test documentation and guidelines for contributors
- Bug reporting guidelines that encourage including Quench test results

### Changed
- Movement rates now configurable per system
- Skill names dynamically loaded from system configuration
- Dice formulas (encounters, weather) now system-specific
- Default party image changes based on active system
- Enhanced README with alpha warnings and clearer feature status
- Updated all documentation for public repository release

### Fixed
- Character removal now properly uses Foundry's deletion syntax
- Settings labels clarified for per-character consumption
- Party sheet member count display (was showing "/" without numbers)
- Travel role assignment parameter order in party actor

## [0.2.0] - 2024-XX-XX (In Development)

### Added
- Dragonbane-styled UI matching the system's appearance
- Travel role UI with character skill values
- Improved party token representation
- Journey log functionality
- Weather and encounter roll systems
- Movement system based on Dragonbane rules

### Changed
- Refactored party member status system to use a single property instead of three arrays
- Redesigned UI layout to be more compact and efficient
- Consolidated template structure for better performance
- Updated settings labels to clarify that rations and water consumption are per character per day

### Fixed
- Bug where characters could appear in multiple status lists simultaneously
- Party sheet background transparency issues
- Template loading problems
- Method availability on party actor instances
- Multiple localization issues
- Missing translation for Party Journal heading

## [0.1.0] - 2023-XX-XX

### Added
- Initial release
- Party Actor implementation
- Character status management
- Travel role assignments
- Resource tracking
- Party inventory system
- Token HUD integration
