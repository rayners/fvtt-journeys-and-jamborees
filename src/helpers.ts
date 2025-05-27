/**
 * Helper functions for skills and character data in Journeys & Jamborees
 */

import { SystemAdapterFactory } from './system-adapter';

/**
 * Get the value of a specific skill from an actor
 * @param actor The actor to get the skill from
 * @param skillName The name of the skill to find
 * @returns The skill value or 0 if not found
 */
export function getSkillValue(actor, skillName) {
  if (!actor) return 0;

  try {
    const adapter = SystemAdapterFactory.getAdapter();
    const value = adapter.getSkillValue(actor, skillName);
    return value ?? 0;
  } catch (error) {
    console.warn(`Failed to get skill value for ${skillName}:`, error);
    return 0;
  }
}

/**
 * Get multiple skill values for an actor based on role configuration
 * @param actor The actor to get skills from
 * @param skillConfig Object mapping roles to skill names
 * @returns Object with role names as keys and skill values as values
 */
export function getRoleSkillValues(actor, skillConfig) {
  if (!actor) return {};

  const result = {};
  const adapter = SystemAdapterFactory.getAdapter();

  // Get skill values for each role using the system adapter
  Object.entries(skillConfig).forEach(([role, skillName]) => {
    try {
      const value = adapter.getSkillValue(actor, skillName);
      result[role] = value ?? 0;
    } catch (error) {
      console.warn(`Failed to get ${role} skill value:`, error);
      result[role] = 0;
    }
  });

  return result;
}
