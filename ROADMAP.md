# Journeys & Jamborees Roadmap

This roadmap outlines the planned development phases for Journeys & Jamborees. Items are organized by priority and release targets, but dates are estimates and may change based on community feedback and development priorities.

## Current Status: Alpha Development

Journeys & Jamborees is currently in active alpha development. The module provides core party management functionality and is stable for testing purposes, but breaking changes may occur between versions until v1.0.

---

## Release Milestones

### v0.2.0 - Enhanced User Experience (Target: Q2 2025)

**Theme**: Polish core features and improve user experience

#### Core Features
- [ ] **Time Integration** (FOU-60) - Integrate with SmallTime and Easy Timekeeping modules
  - Advance time automatically when making camp
  - Calculate and display travel time estimates
  - System-specific rest duration configurations

- [ ] **System Adapter Improvements** - Expand system support
  - Complete testing for Pathfinder 2e, Forbidden Lands, Simple Worldbuilding
  - Additional type definitions for supported systems
  - Enhanced skill detection and handling

#### User Interface
- [ ] **Enhanced Party Sheet** - Improve visual design and usability
  - Better responsive design for different screen sizes
  - Improved visual hierarchy and information density
  - Context-sensitive help tooltips

- [ ] **Travel UI Enhancements** - Make journey management more intuitive
  - Visual progress indicators for journeys
  - Interactive map integration (if available)
  - Quick actions for common travel scenarios

#### Developer Experience
- [ ] **API Documentation** - Comprehensive API reference
  - Public API documentation for integration
  - Hook documentation for module developers
  - Code examples and integration patterns

### v0.3.0 - Advanced Features (Target: Q3 2025)

**Theme**: Add sophisticated journey and survival mechanics

#### Journey Mechanics
- [ ] **Advanced Movement System** - More realistic travel mechanics
  - Different movement paces (slow, normal, fast)
  - Terrain-based movement modifiers
  - Group movement coordination

- [ ] **Weather and Environment** - Dynamic environmental challenges
  - Weather effects on travel and camping
  - Seasonal variations
  - Environmental hazards

- [ ] **Extended Rest System** - More detailed rest mechanics
  - Different rest types (short, long, extended)
  - Rest quality modifiers
  - Interruption handling

#### Content Integration
- [ ] **Enhanced Food Gathering** - Expand survival mechanics
  - Seasonal availability variations
  - Regional food source differences
  - Equipment and tool requirements

- [ ] **Random Encounters** - Improved encounter system
  - Location-based encounter tables
  - Time-of-day encounter variations
  - Scaled difficulty based on party level

### v0.4.0 - Automation & Integration (Target: Q4 2025)

**Theme**: Streamline gameplay with smart automation

#### Smart Automation
- [ ] **Intelligent Resource Management** - Automated consumption tracking
  - Smart food/water calculations
  - Equipment wear and tear tracking
  - Automatic resupply reminders

- [ ] **Journey Planning** - Advanced trip planning tools
  - Route optimization suggestions
  - Supply requirement calculations
  - Risk assessment for planned journeys

#### Module Integrations
- [ ] **Calendar Integration** - Better time management
  - Simple Calendar module support
  - About Time module compatibility
  - Custom calendar system support

- [ ] **Weather Module Integration** - Enhanced environmental systems
  - Weather integration with travel effects
  - Climate-based seasonal changes
  - Storm and extreme weather handling

### v1.0.0 - Stable Release (Target: Q1 2026)

**Theme**: Production-ready release with comprehensive features

#### Stability & Polish
- [ ] **Performance Optimization** - Ensure smooth operation
  - Database query optimization
  - Memory usage improvements
  - Startup time optimization

- [ ] **Comprehensive Testing** - Full test coverage
  - All supported systems thoroughly tested
  - Edge case handling verified
  - Performance benchmarking

- [ ] **Documentation Complete** - User and developer documentation
  - Complete user guide with tutorials
  - API documentation for developers
  - Troubleshooting guides

#### Feature Complete
- [ ] **All Core Features Stable** - No breaking changes
  - API stability guarantee
  - Backward compatibility promise
  - Migration tools for alpha users

---

## Future Considerations (Post v1.0)

These features are under consideration for future releases but are not committed to any specific timeline:

### Advanced Features
- **Multi-Party Management** - Handle multiple adventuring parties
- **Settlement Management** - Base camp and settlement mechanics
- **Vehicle Travel** - Ships, mounts, and vehicle-based journeys
- **Hex Crawl Support** - Integration with hex exploration systems

### System Expansions
- **Additional Game Systems** - Support for more RPG systems
- **Custom System Templates** - Tools for adding new system support
- **Legacy System Support** - Compatibility with older Foundry versions

### Integration Opportunities
- **Map Tools Integration** - Better map-based journey planning
- **Combat Integration** - Travel encounters tied to combat systems
- **Economy Integration** - Cost tracking for travel supplies
- **Quest Integration** - Journey objectives and quest markers

---

## How to Influence the Roadmap

The roadmap is a living document that evolves based on community needs and feedback. Here's how you can help shape the future of Journeys & Jamborees:

### Feedback Channels
- **GitHub Issues**: Report bugs and request features at [github.com/rayners/fvtt-journeys-and-jamborees](https://github.com/rayners/fvtt-journeys-and-jamborees)
- **Community Forums**: Discuss features on Foundry VTT Discord or Reddit
- **Direct Contact**: Reach out through GitHub discussions

### What We're Looking For
- **Use Cases**: How do you use the module in your games?
- **Pain Points**: What's difficult or confusing about current features?
- **Missing Features**: What would make your journey management better?
- **System Support**: Which game systems need better support?

### Contributing
- **Testing**: Try alpha features and report issues
- **Documentation**: Help improve guides and examples
- **Code**: Submit pull requests for bug fixes or features
- **Translations**: Help localize the module for international users

---

## Development Principles

Our development is guided by these core principles:

### 1. System Agnostic First
- All features should work across multiple game systems
- System-specific features are secondary to universal functionality
- Configuration over hard-coding for system differences

### 2. User Experience Focus
- Simple, intuitive interfaces over complex feature sets
- Reasonable defaults that work out of the box
- Optional complexity for advanced users

### 3. Community Driven
- Regular community feedback incorporation
- Transparent development process
- Collaborative decision making on major features

### 4. Stability & Reliability
- Thorough testing of all features
- Backward compatibility preservation
- Clear migration paths for breaking changes

### 5. Integration Friendly
- Well-documented APIs for other module developers
- Standard Foundry patterns and conventions
- Minimal conflicts with other modules

---

*Last Updated: May 27, 2025*

*This roadmap is subject to change based on community feedback, development priorities, and technical constraints. For the most current status, check our [GitHub Issues](https://github.com/rayners/fvtt-journeys-and-jamborees/issues) and [Project Board](https://linear.app/rayners/project/journeys-and-jamborees-1609b565ee4c).*