# Journeys & Jamborees

FoundryVTT module implementing a system-agnostic party management system.

## Development Commands

```bash
npm run build         # Build the module
npm run watch         # Watch and rebuild
npm run dev           # Development mode with local server
npm run lint          # Check code style
npm run lint:fix      # Auto-fix lint issues
npm run format        # Prettier formatting
npm run typecheck     # Type check without emitting
npm run validate      # Full pipeline: lint + format + typecheck + test + build
npm test              # Tests in watch mode
npm run test:run      # Run all tests once (use before commits)
npm run test:coverage # Coverage report
```

**CRITICAL**: Always use `npm run test:run` (not `npm run test:workspaces`) before commits.

## Architecture

### Core Design Patterns
- **Custom Actor Type**: `journeys-and-jamborees.party` actor represents the party
- **System Adapter Pattern**: Abstracts differences between game systems (D&D 5e, Dragonbane, PF2e, etc.)
- **Dynamic Configuration**: Runtime detection and configuration per game system
- **Singleton Services**: Food gathering, skill detection, and roll tracking
- **Permission-Based Ownership**: Party actors owned by all players with characters in the party

### Key Components
- **PartyActor** (`src/party-actor.ts`): Custom actor class with party-specific methods
- **SystemAdapter** (`src/system-adapter.ts`): System-specific skill and roll handling
- **SystemConfig** (`src/system-config.ts`): Per-system configuration (movement, skills, dice)
- **SkillManager** (`src/skill-manager.ts`): Dynamic skill detection across systems
- **FoodGatheringSystem** (`src/food-gathering.ts`): Dragonbane hunting/fishing/foraging mechanics
- **FoodTablesManager** (`src/food-tables.ts`): RollTable creation and management

### Module Ecosystem

J&J focuses on **party management**. Realm/region UI belongs in **Realms & Reaches**.

- J&J **reads** realm data via R&R API when available (soft dependency)
- J&J provides: party actors, travel mechanics, food gathering, camping
- R&R provides: scene controls, drawing tools, realm data storage, spatial queries

## Gotchas

### Foundry Object Update Pattern
When removing all keys from an object field, Foundry doesn't handle empty objects `{}` properly.
Use deletion syntax:
```javascript
// WRONG - empty object doesn't update correctly
{ 'system.memberStatus': {} }

// CORRECT - use deletion syntax for each key
{ 'system.memberStatus.-=charId': null }
```

### Actor Type Namespacing
```javascript
// WRONG
Actor.create({ type: 'party' })
// CORRECT
Actor.create({ type: 'journeys-and-jamborees.party' })
```

### Singleton Mock Reset (Testing)
Singleton classes maintain state between tests. Always reset in `beforeEach()`:
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  // @ts-ignore - Reset ALL singleton instances
  FoodGatheringSystem.instance = undefined;
  FoodTablesManager.instance = undefined;
  SkillRollTracker.instance = undefined;
  // THEN set up mocks
});
```

### Handlebars Nested `#each` Scope
Top-level context variables set in `_preparePartContext` are NOT accessible inside a
`{{#each ... as |alias|}}` block without `@root`:
```handlebars
{{!-- WRONG - 'activityData' is invisible inside the each block --}}
{{#each formation.rows as |row|}}{{#each activityData as |cat|}}...
{{!-- CORRECT --}}
{{#each formation.rows as |row|}}{{#each @root.activityData as |cat|}}...
```

### Activity Skill Name Matching
`activity-data.ts` uses snake_case skill keys (e.g. `hunting_fishing`, `spot_hidden`)
but game systems use display names (`Hunting & Fishing`, `Spot Hidden`).
`SkillManager.findBestMatch()` handles this via underscore→space normalization and
word-based matching. When adding new activities, use snake_case and add synonyms to
`findBestMatch()` if the skill name is ambiguous across systems.

### ApplicationV2 Tab System (_preparePartContext pattern)
When using HandlebarsApplicationMixin with TABS, follow the S&S pattern — do NOT call
`super._preparePartContext`. Instead:
```typescript
declare _prepareTabs: (group: string) => Record<string, unknown>; // mixin method, must declare

async _preparePartContext(partId, context) {
  const partContext = { ...context };
  if (partId === 'tabs') partContext.tabs = this._prepareTabs('primary');
  const tabs = (context.tabs ?? {}) as Record<string, unknown>;
  if (partId in tabs) partContext.tab = tabs[partId];
  // add tab-specific data here
  return partContext;
}
```
Without this, `tab.cssClass` is never injected and all tab sections remain hidden.

### ApplicationV2 CSS Scoping
Tab visibility CSS is scoped to `.journeys-and-jamborees.sheet.party`. Any standalone
`ApplicationV2` that shares this styling must include `sheet` and `party` in its `DEFAULT_OPTIONS.classes`.

### PartyInventoryEntry Structure
`scanPartyInventory()` returns `Record<name, PartyInventoryEntry>` — the item name is the
**record key**, not a property. Use `Object.entries()`:
```typescript
// WRONG - entry has no .name property
Object.values(inventory).map(entry => entry.name.localeCompare(...))
// CORRECT
Object.entries(inventory).map(([name, entry]) => ...)
```
`entry.owners` is `Record<ownerName, PartyInventoryOwner>` — expand to array for templates.

### patchPartyActor Coverage
`patchPartyActor` in `utils.ts` uses dynamic prototype traversal. A coverage test in
`test/utils.test.ts` automatically catches any new methods added to `PartyActorType.prototype`
that are missing from the lifecycle exclusion set.

### Dragonbane Weapon Structure
Test weapon objects must use `calculatedRange` not `range`:
```typescript
const mockWeapon = {
  type: 'weapon',
  system: {
    calculatedRange: 20,    // NOT 'range'
    features: { thrown: false },
    skill: { name: 'bows' }
  }
};
```

### Setting Names
Skill-related settings use the "SkillName" suffix: `pathfinderSkillName`, `lookoutSkillName`, `quartermasterSkillName`.

### Simple Worldbuilding
Simple Worldbuilding has strict template requirements. Skip modifying `game.system.template.Actor.types` for it. Detection: `game.system.id === 'worldbuilding'`.

### Module.json URLs
Never use `/latest/` in manifest or download URLs. Use version-specific URLs:
```
.../releases/download/v0.1.0/module.json  (CORRECT)
.../releases/latest/download/module.json   (WRONG - breaks Foundry updates)
```

Use clean semver without suffixes (`0.1.0`, not `0.1.0-alpha`) - Foundry may not handle version comparison correctly with suffixes.

## System Adapter Notes

- **Dragonbane**: Uses `actor.getSkill(skillName)` -> skill item with `.system.value`
- **D&D 5e**: Uses `actor.system.skills[key]` -> object with `.total` or `.mod`; skill names from `CONFIG.DND5E.skills`
- **Skill Detection**: D&D 5e uses CONFIG, others fall back to actor sampling
- **Settings Registration**: Uses deferred registration in ready hook for reliable system data access

## Development Context

For comprehensive standards and patterns, see [dev-context/](dev-context/README.md).
**CRITICAL**: Read [dev-context/ai-code-access-restrictions.md](dev-context/ai-code-access-restrictions.md) first for security boundaries.
