/**
 * Configuration data for the Formation & Tasks tab.
 * Ported from the party management macro to be stored in the party actor model.
 */

export interface ActivityOption {
  label: string;
  skill: string | null;
}

export interface ActivityCategory {
  label: string;
  options: Record<string, ActivityOption>;
}

/** Categorized activities for the activity manager */
export const ACTIVITY_DATA: Record<string, ActivityCategory> = {
  wilds: {
    label: 'Wilderness & Camping',
    options: {
      pathfind: { label: 'Pathfinding', skill: 'bushcraft' },
      huntfish: { label: 'Hunting & Fishing', skill: 'hunting_fishing' },
      survey: { label: 'Survey the Land', skill: 'spot_hidden' },
      camp: { label: 'Make Camp', skill: 'bushcraft' },
      watch: { label: 'Keep Watch', skill: 'spot_hidden' },
      cook: { label: 'Cooking', skill: 'bushcraft' },
      sleep: { label: 'Sleep', skill: null }
    }
  },
  care: {
    label: 'Help Others',
    options: {
      mend: { label: 'Mending Wounds', skill: 'healing' },
      entertain: { label: 'Entertain Group', skill: 'performance' },
      support: { label: 'Support...', skill: null }
    }
  },
  projects: {
    label: 'Projects & Maintenance',
    options: {
      repair: { label: 'Repair Gear', skill: 'crafting' },
      craft: { label: 'Crafting Items', skill: 'crafting' },
      scribe: { label: 'Scribing Scrolls', skill: 'learning' },
      train: { label: 'Training', skill: null }
    }
  },
  town: {
    label: 'Town & Social',
    options: {
      barter: { label: 'Bartering', skill: 'bartering' },
      carouse: { label: 'Carousing', skill: 'constitution' },
      rumors: { label: 'Gather Rumors', skill: 'persuasion' },
      network: { label: 'Networking / Contacts', skill: 'persuasion' },
      gamble: { label: 'Gambling', skill: 'bluffing' },
      perform: { label: 'Performance (Public)', skill: 'performance' },
      legal: { label: 'Legal / Bureaucracy', skill: 'learning' },
      service: { label: 'Seek Services', skill: null }
    }
  },
  general: {
    label: 'General / Freeform',
    options: {
      investigate: { label: 'Investigate Area', skill: 'spot_hidden' },
      physical: { label: 'Physical Feat', skill: 'acrobatics' },
      other: { label: 'Other Activity', skill: null }
    }
  }
};

/** Activities that require selecting a target character */
export const TARGETED_ACTIVITIES = ['support', 'mend'];

/** Inventory category configuration for the Logistics tab */
export interface CategoryConfig {
  label: string;
  color: string;
}

export const CATEGORY_DATA: Record<string, CategoryConfig> = {
  currency: { label: 'Treasury', color: '#c5a059' },
  item: { label: 'General Items', color: '#95a5a6' },
  memento: { label: 'Mementos', color: '#d35400' },
  weapon: { label: 'Weapons', color: '#e74c3c' },
  armor: { label: 'Armor & Shields', color: '#34495e' },
  helmet: { label: 'Helmets', color: '#555555' },
  magic_trick: { label: 'Magic Tricks', color: '#1abc9c' },
  spell_book: { label: 'Spellbook', color: '#8e44ad' },
  ability: { label: 'Abilities', color: '#28a745' }
};

/** Sort order for ALL view (grouped by type) */
export const ORDER_ALL: Record<string, number> = {
  currency: 100,
  item: 200,
  memento: 300,
  weapon: 400,
  armor: 500,
  helmet: 600,
  magic_trick: 700,
  spell_book: 800,
  ability: 900
};

/** Sort order for character-filtered view */
export const ORDER_CHAR: Record<string, number> = {
  ability: 100,
  magic_trick: 200,
  spell_book: 300,
  weapon: 400,
  armor: 500,
  helmet: 600,
  item: 700,
  currency: 700,
  memento: 800
};

/** Maps Dragonbane item types to inventory categories */
export const TYPE_MAPPING: Record<string, string> = {
  ability: 'ability',
  weapon: 'weapon',
  armor: 'armor',
  shield: 'armor',
  helmet: 'helmet',
  item: 'item'
};

/** Status condition toggles for the Command Center */
export interface ToggleConfig {
  id: string;
  icon: string;
  title: string;
  class: string;
}

export const TOGGLE_IDS: ToggleConfig[] = [
  { id: 'dse-sleep-deprived', icon: 'fas fa-bed', title: 'Sleepy', class: 'sleepy' },
  { id: 'hungry', icon: 'fas fa-drumstick-bite', title: 'Hungry', class: 'hungry' },
  { id: 'dse-cold', icon: 'fas fa-snowflake', title: 'Cold', class: 'cold' }
];

/** Attribute condition indicators for the Command Center */
export interface AttrCondConfig {
  id: string;
  title: string;
  img: string;
}

export const ATTR_CONDS: AttrCondConfig[] = [
  {
    id: 'dragonbane.condition.exhausted',
    title: 'Exhausted (STR)',
    img: 'systems/dragonbane/art/icons/back-pain.webp'
  },
  {
    id: 'dragonbane.condition.sickly',
    title: 'Sickly (CON)',
    img: 'systems/dragonbane/art/icons/death-juice.webp'
  },
  {
    id: 'dragonbane.condition.dazed',
    title: 'Dazed (AGL)',
    img: 'systems/dragonbane/art/icons/surprised.webp'
  },
  {
    id: 'dragonbane.condition.angry',
    title: 'Angry (INT)',
    img: 'systems/dragonbane/art/icons/angry-eyes.webp'
  },
  {
    id: 'dragonbane.condition.scared',
    title: 'Scared (WIL)',
    img: 'systems/dragonbane/art/icons/terror.webp'
  },
  {
    id: 'dragonbane.condition.disheartened',
    title: 'Disheartened (CHA)',
    img: 'systems/dragonbane/art/icons/worried-eyes.webp'
  }
];

/** Items to exclude from inventory scan */
export const IGNORED_ITEMS = ['Unarmed', 'Fist', 'Kick', 'Dodge'];

/** Currency coin icons */
export const COIN_ICONS = {
  gold: 'icons/commodities/currency/coin-embossed-insect-gold.webp',
  silver: 'icons/commodities/currency/coin-inset-compass-silver.webp',
  copper: 'icons/commodities/currency/coin-oval-rune-copper.webp'
};

/**
 * Look up an activity option by its key
 */
export function findActivityOption(activityKey: string): ActivityOption | null {
  for (const cat of Object.values(ACTIVITY_DATA)) {
    if (cat.options[activityKey]) return cat.options[activityKey];
  }
  return null;
}
