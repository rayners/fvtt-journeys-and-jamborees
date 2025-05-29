# Testing Guide for Journeys & Jamborees

This directory contains the test suite for the Journeys & Jamborees Foundry VTT module.

## ✅ **CURRENT STATUS: 100% PASS RATE**
- **64/64 tests passing** (Last updated: 2025-01-28)
- **Complete CI pipeline success**
- **All mock integration issues resolved**

## Shared Foundry Mock Setup

### `foundry-mocks.ts` - Comprehensive Mock Library
A shared, reusable mock setup for Foundry VTT that provides:

- **Document Classes**: Actor, RollTable, Folder, Dialog, ChatMessage
- **Foundry Globals**: game, ui, canvas, CONFIG, foundry, Hooks  
- **Utility Functions**: All foundry.utils methods, template functions
- **Canvas Support**: PIXI graphics, CanvasLayer, regions
- **System Support**: Configurable for different game systems

**Key Features:**
- ✅ **Shared between projects** - Used by both J&J and R&R
- ✅ **Complete API coverage** - Mocks all common Foundry APIs
- ✅ **Region support** - Full Scene.regions collection with filter()
- ✅ **Document creation** - Async create/update/delete methods
- ✅ **System agnostic** - Works with any game system

**Usage:**
```typescript
import { setupFoundryMocks, createMockScene, createMockRegion } from './foundry-mocks';

setupFoundryMocks({
  systemId: 'dragonbane',
  user: { isGM: false },
  includeCanvas: true
});
```

### `setup.ts` - J&J Specific Configuration
Project-specific setup that configures the shared mocks for Journeys & Jamborees needs.

## Test Frameworks

We use a dual testing approach:

### 1. Vitest (Unit & Integration Tests)
For testing business logic outside of Foundry VTT:
- Fast test execution with hot module reload
- Jest-compatible API for easy migration
- Built-in TypeScript support
- Excellent coverage reporting
- Interactive UI for test debugging

### 2. Quench (In-App E2E Tests)
For testing within the actual Foundry VTT environment:
- End-to-end UI testing
- Tests run in real Foundry context
- Access to actual game data and systems
- Powered by Mocha and Chai
- Native Foundry test runner UI

## Running Tests

### Vitest Tests

```bash
# Run tests in watch mode (default)
npm test

# Run tests once and exit
npm run test:run

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Quench Tests

1. Install the Quench module in Foundry VTT:
   - Manifest URL: `https://github.com/ethaks/fvtt-quench/releases/latest/download/module.json`
   - Or search for "Quench" in the Foundry module browser

2. Enable both Quench and Journeys & Jamborees modules in your world

3. Open the Quench UI:
   - Click the flask icon in the scene controls
   - Or use the "Quench" button in the module management screen

4. Run tests:
   - Select "Journeys & Jamborees" test batches
   - Click "Run" to execute tests
   - View results in the Quench UI

## Test Structure

### Setup Files
- `test/setup.ts` - Global test setup and Foundry VTT mocks
- `vitest.config.ts` - Vitest configuration

- `src/quench-tests.ts` - Quench test registration

### Test Categories

#### Vitest Unit Tests
- `utils.test.ts` - Utility function tests
- `party-model.test.ts` - Party data model tests
- `system-config.test.ts` - System configuration manager tests

#### Quench E2E Tests

##### Core Tests (run in all systems)
- **Party Actor Tests** (`journeys-and-jamborees.party-actor`)
  - Character management (add/remove/status)
  - Travel role assignments
  - Resource management
- **Party Sheet Tests** (`journeys-and-jamborees.party-sheet`)
  - UI rendering and navigation
  - Tab functionality
  - Member display
- **System Integration Tests** (`journeys-and-jamborees.system-integration`)
  - Game system detection
  - Actor type registration
  - Settings registration

##### System-Specific Tests (run only in matching system)
- **Dragonbane Tests** (`journeys-and-jamborees.system-dragonbane`)
  - 15km/shift movement rates
  - BUSHCRAFT/AWARENESS skill integration
  - Shift-based time units
  - Dragonbane dice mechanics
- **D&D 5e Tests** (`journeys-and-jamborees.system-dnd5e`)
  - 24 miles/day movement rates
  - Proper skill name display (Survival, not 'sur')
  - Daily travel time units
  - D&D 5e skill system integration
- **Pathfinder 2e Tests** (`journeys-and-jamborees.system-pf2e`)
  - PF2e movement rates
  - Skill proficiency level handling
- **Forbidden Lands Tests** (`journeys-and-jamborees.system-forbidden-lands`)
  - Hexcrawl movement (10 hexes)
  - Integration with native journey mechanics
- **Generic System Tests** (`journeys-and-jamborees.system-generic`)
  - Default 25 units movement
  - Graceful handling of unknown systems

## Foundry VTT Testing Approach

Since Foundry VTT modules run in a specialized environment, we mock the following globals:

### Core Foundry Globals
- `game` - Main game instance with user, settings, system info
- `ui` - User interface notifications and controls
- `CONFIG` - System configuration objects
- `foundry` - Foundry utilities and base classes

### Document Classes
- `Actor`, `ActorSheet` - Actor document mocks
- `Application`, `FormApplication` - Base application mocks
- `Dialog` - Dialog interface mocks
- `ChatMessage` - Chat message mocks

### Template System
- `loadTemplates`, `renderTemplate`, `getTemplate` - Template rendering mocks
- `Handlebars` - Template engine mocks

### Utility Functions
- `mergeObject`, `duplicate`, `setProperty` - Object manipulation mocks
- `fromUuid`, `TextEditor` - Additional utility mocks

## Writing Tests

### Basic Test Structure
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YourModule } from '@/your-module';

describe('YourModule', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

### Mocking Foundry Dependencies
```typescript
// Mock a Foundry module
vi.mock('@/foundry-dependent-module', () => ({
  SomeClass: {
    prototype: {
      someMethod: vi.fn()
    }
  }
}));
```

### Testing Async Operations
```typescript
it('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

## Coverage Goals

We aim for:
- **90%+ line coverage** for core business logic
- **80%+ branch coverage** for conditional logic
- **100% coverage** for utility functions

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Use descriptive test names** - Make it clear what each test validates
3. **Arrange, Act, Assert** - Structure tests clearly
4. **Mock external dependencies** - Isolate units under test
5. **Test edge cases** - Include error conditions and boundary values
6. **Keep tests fast** - Avoid unnecessary async operations in unit tests

## Debugging Tests

### Using the UI
```bash
npm run test:ui
```
Opens an interactive test runner in your browser with:
- Real-time test results
- Coverage visualization
- Test file explorer
- Console output

### VS Code Integration
Install the Vitest extension for VS Code to:
- Run tests from the editor
- Set breakpoints in test files
- View inline test results

## Writing Quench Tests

### Basic Structure
```typescript
quench.registerBatch('module-name.batch-name', (context) => {
  const { describe, it, assert, expect, beforeEach, afterEach } = context;
  
  describe('Test Suite', function() {
    beforeEach(async function() {
      // Setup before each test
    });
    
    afterEach(async function() {
      // Cleanup after each test
    });
    
    it('should do something', async function() {
      // Test implementation
      assert.ok(true, 'Test passed');
      expect(result).to.equal(expected);
    });
  });
});
```

### Testing Best Practices for Quench
1. **Clean up test data** - Always delete actors/items created during tests
2. **Use async/await** - Most Foundry operations are asynchronous
3. **Test real interactions** - Click buttons, fill forms, test actual UI
4. **Isolate tests** - Each test should be independent
5. **Use descriptive names** - Help identify failing tests quickly

## Test Strategy

- **Vitest**: Fast feedback during development, test business logic
- **Quench**: Validate actual Foundry integration, test UI interactions
- **Coverage**: Aim for high coverage with Vitest, use Quench for critical paths

### System-Specific Testing Benefits

System-specific tests ensure that:
1. **Movement calculations** use appropriate units (km, miles, hexes)
2. **Skill systems** integrate correctly with each game's mechanics
3. **Time units** match system expectations (shifts, days, watches)
4. **UI labels** display properly localized skill names
5. **Dice mechanics** use the correct formulas for each system
6. **Edge cases** specific to each system are handled gracefully

This approach catches system-specific bugs early and ensures a consistent experience across all supported game systems.

## Using Quench for Debugging and Bug Reports

### Running Tests for Bug Reports

When reporting bugs, Quench test results provide valuable diagnostic information:

1. **Run the test suite** in your problematic environment
2. **Screenshot failing tests** showing the error messages
3. **Note which tests pass/fail** to help narrow down the issue
4. **Include test output** in your GitHub issue

### Writing Tests to Demonstrate Bugs

For complex or hard-to-reproduce bugs, write a Quench test:

```javascript
// Save this in your world scripts or as a macro
Hooks.on('quenchReady', (quench) => {
  quench.registerBatch('my-bug-demo', (context) => {
    const { describe, it, assert, expect } = context;
    
    describe('Bug Reproduction', function() {
      it('demonstrates the issue with party resources', async function() {
        const party = await Actor.create({
          name: 'Bug Demo Party',
          type: 'party',
          system: { resources: { rations: 10 } }
        });
        
        try {
          // Your specific steps that trigger the bug
          await party.removeResource('rations', 5);
          await party.removeResource('rations', 6); // This causes the bug
          
          // What you expect vs what actually happens
          assert.equal(party.system.resources.rations, 0, 
            'Rations should be 0 but they went negative!');
        } finally {
          await party.delete();
        }
      });
    });
  });
});
```

### Benefits for Maintainers

- **Exact reproduction steps** in executable form
- **Clear success/failure criteria**
- **Environment information** (Quench shows system details)
- **Faster bug fixes** with precise test cases

Include test code in bug reports when possible - it's the fastest way to get issues resolved!

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Commits to main branch
- Release preparation

Test results are reported in GitHub Actions and must pass for merges.

## Recent Testing Achievements ✅

### 100% Pass Rate Milestone (2025-01-28)

**Background**: J&J previously had 2 failing tests in the food gathering system that were preventing complete CI success.

**Root Causes Identified**:
1. **Singleton Mock Issues**: `FoodTablesManager.instance` wasn't being reset between tests, causing the mock to not be applied properly
2. **Type Definition Mismatch**: Test weapon objects used `range` instead of `calculatedRange`, failing Dragonbane type validation

**Solutions Implemented**:

1. **Comprehensive Singleton Reset Pattern**:
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
     
     // Reset ALL singleton instances
     // @ts-ignore
     FoodGatheringSystem.instance = undefined;
     // @ts-ignore  
     FoodTablesManager.instance = undefined;
     // @ts-ignore
     SkillRollTracker.instance = undefined;
   });
   ```

2. **Correct Dragonbane Weapon Structure**:
   ```typescript
   const mockWeapon = {
     type: 'weapon',
     system: {
       calculatedRange: 20,  // Fixed: was 'range'
       features: { thrown: false },
       skill: { name: 'bows' }
     }
   };
   ```

**Impact**:
- ✅ **Before**: 62/64 tests passing (97% pass rate)
- ✅ **After**: 64/64 tests passing (100% pass rate)
- ✅ **Result**: Complete green CI build status
- ✅ **Benefit**: Reliable development environment for ongoing work

**Key Learning**: Always reset singleton instances in test setup when using dependency injection patterns with mocks. This pattern applies to any module using singleton classes.