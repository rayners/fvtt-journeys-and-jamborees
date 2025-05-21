# Journeys & Jamborees - Bug Fix

## Issue Fixed
Fixed an error where the party actor type couldn't be created because `CONFIG.Actor.types` was undefined when attempting to register the 'party' actor type.

## Files Changed
1. `src/module.ts`: Added code to check if `CONFIG.Actor.types` exists, create it if needed, and add 'party' to the list of actor types.
2. `dist/module.js`: Applied the same fix to the built JavaScript file.

## How to Test
1. The error "Cannot set properties of undefined (setting 'party')" should no longer appear.
2. You should now be able to create a new actor of type "Party" from the Actors Directory.
3. The party sheet should load properly when you open a party actor.

## Future Improvement Recommendations
1. Consider rebuilding the project with proper source maps to make debugging easier.
2. Add additional validation at initialization time to ensure the Dragonbane system is properly loaded before trying to extend it.
