/**
 * Helper functions for skills and character data in Journeys & Jamborees
 */

/**
 * Get the value of a specific skill from an actor
 * @param actor The actor to get the skill from
 * @param skillName The name of the skill to find
 * @returns The skill value or 0 if not found
 */
export function getSkillValue(actor, skillName) {
  if (!actor) return 0;
  
  const skillItem = actor.getSkill(skillName);
  return skillItem ? skillItem.system.value : 0;
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
  
  // Get skill values for each role using the actor.getSkill method
  Object.entries(skillConfig).forEach(([role, skillName]) => {
    const skill = actor.getSkill(skillName);
    result[role] = skill ? skill.system.value : 0;
  });
  
  return result;
}
