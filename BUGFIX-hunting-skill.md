# Bug Fix: Hunting Skill Not Found

## Problem
The hunting skill "Hunting & Fishing" was not being found in Dragonbane, with the error showing it was looking for "hunting-&-fishing" instead.

## Root Cause
The `SkillManager.getAvailableSkills()` method was transforming skill names into IDs by replacing spaces with hyphens:
- "Hunting & Fishing" → "hunting-&-fishing"

These transformed IDs were being stored as setting values, but the Dragonbane Roll API expects the actual skill name.

## Solution
1. **Updated `SkillManager.getAvailableSkills()`**: Now uses actual skill names as keys instead of transformed IDs
2. **Updated `DragonbaneAdapter.hasSkill()`**: Fixed to check for skills as items (how Dragonbane stores them) instead of in `system.skills`
3. **Enhanced `findBestMatch()`**: Added handling for special characters like "&" in skill names

## Changes Made
- `src/skill-manager.ts`: 
  - Removed ID transformation in lines 84 and 197
  - Updated `findBestMatch()` to handle special characters
- `src/system-adapter.ts`:
  - Fixed `hasSkill()` method for DragonbaneAdapter to check items

## Testing
After these changes:
1. Skills will be stored with their actual names in settings
2. The Dragonbane Roll API will receive the correct skill name
3. Hunting & Fishing rolls should work properly