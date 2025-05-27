# Simple Worldbuilding Test Plan for Journeys & Jamborees

This document outlines the test plan for validating the Journeys & Jamborees module with the Simple Worldbuilding system.

## Prerequisites

1. Foundry VTT v13 installed
2. Simple Worldbuilding system installed and active
3. Journeys & Jamborees module built and linked
4. Quench module installed (for automated tests)

## Test Setup

1. Create a new world using Simple Worldbuilding system
2. Enable the following modules:
   - Journeys & Jamborees
   - Quench (for automated testing)
3. Create test characters with custom attributes (e.g., Navigation, Perception, Diplomacy)

## Manual Test Cases

### 1. Core Functionality Tests ✅

#### 1.1 Module Loading

- [ ] Module loads without console errors
- [ ] Module appears in the module list as active
- [ ] No warnings about missing dependencies

#### 1.2 Party Actor Creation

- [ ] Can create a new Party actor
- [ ] Party actor appears in the actor list
- [ ] Party sheet opens without errors
- [ ] Default values are set correctly (25 units movement, etc.)

#### 1.3 Character Management

- [ ] Can add characters to the party
- [ ] Can remove characters from the party
- [ ] Character status changes work (active/traveling/staying)
- [ ] Member count updates correctly

### 2. Skill System Tests 🔧

#### 2.1 Skill Detection

- [ ] Skills/attributes are detected from existing characters
- [ ] If no skills detected, shows "Please Configure Skills" message
- [ ] Attributes with value field are recognized as skills

#### 2.2 Settings Configuration

- [ ] Skill settings appear in module configuration
- [ ] Dropdowns show detected skills or generic options
- [ ] "None" option is available in skill dropdowns
- [ ] Can save skill configuration changes

#### 2.3 Skill Display

- [ ] Party sheet shows correct skill names (not codes)
- [ ] Skill values display correctly for assigned characters
- [ ] Empty skill slots show appropriate placeholder

#### 2.4 Fallback Behavior

- [ ] GenericAdapter is used (check console logs)
- [ ] Skills marked as "none" don't cause errors
- [ ] Missing skills handled gracefully

### 3. System Configuration Tests ⚙️

#### 3.1 Movement Rates

- [ ] Default movement is 25 units (on foot)
- [ ] Mounted movement is 50 units
- [ ] Movement settings can be changed
- [ ] Changes reflect in party sheet

#### 3.2 Dice Formulas

- [ ] Random encounter uses 1d20 (threshold 15)
- [ ] Weather roll uses 1d6
- [ ] Pathfinding uses 1d20
- [ ] Custom dice formulas can be configured

#### 3.3 No Hardcoded References

- [ ] No "BUSHCRAFT" text visible
- [ ] No "shift" time unit (should be "period")
- [ ] No Dragonbane-specific imagery
- [ ] Generic wilderness image used

### 4. User Experience Tests 👤

#### 4.1 Settings Interface

- [ ] All settings have clear labels
- [ ] Hints explain what each setting does
- [ ] Settings grouped logically
- [ ] Changes save properly

#### 4.2 Error Handling

- [ ] No console errors during normal use
- [ ] Graceful handling of missing data
- [ ] Clear messages for configuration needs
- [ ] Operations don't fail silently

#### 4.3 Sheet Functionality

- [ ] All tabs load correctly
- [ ] Resource management works
- [ ] Travel log functions
- [ ] Roll buttons work (or show appropriate message)

### 5. Integration Tests 🔄

#### 5.1 Travel Roles

- [ ] Can assign pathfinder role
- [ ] Can assign lookout role
- [ ] Can assign quartermaster role
- [ ] Roles cleared when character removed

#### 5.2 Resource Tracking

- [ ] Can add/remove rations
- [ ] Can add/remove water
- [ ] Can add/remove arrows
- [ ] Resources don't go negative

#### 5.3 Party Operations

- [ ] Start travel works
- [ ] End travel works
- [ ] Make camp functions
- [ ] Weather rolls work

## Automated Test Execution

Run Quench tests for Simple Worldbuilding:

1. Open Quench UI (flask icon)
2. Find "Journeys & Jamborees" test section
3. Run "Simple Worldbuilding System Tests"
4. Verify all tests pass

## Expected Results

### Success Criteria

- All core party management features work
- Skill system handles minimal structure gracefully
- Users can configure skills for their world
- No crashes or critical errors
- System feels natural for Simple Worldbuilding users

### Known Limitations

- Skills may need manual configuration
- Some features designed for complex systems may be simplified
- Generic defaults used throughout

## Test Recording

### Environment

- Foundry Version: **\_\_\_\_**
- Simple Worldbuilding Version: **\_\_\_\_**
- J&J Module Version: 0.1.0
- Test Date: **\_\_\_\_**
- Tester: **\_\_\_\_**

### Results Summary

- [ ] All core tests pass
- [ ] No blocking issues found
- [ ] Documentation needs identified
- [ ] Enhancement opportunities noted

### Issues Found

1. ***
2. ***
3. ***

### Notes

---

---

---

## Post-Test Actions

1. Update CLAUDE.md with any new findings
2. Create issues for any bugs found
3. Update documentation for Simple Worldbuilding users
4. Consider creating a Simple Worldbuilding example configuration
