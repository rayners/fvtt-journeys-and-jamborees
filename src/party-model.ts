import { SystemConfigManager } from './system-config';

/**
 * Data model for party actor type
 */
export class PartyModel extends foundry.abstract.TypeDataModel {
  /**
   * Define the data schema for the party actor
   */
  static defineSchema() {
    const fields = foundry.data.fields;
    
    return {
      description: new fields.HTMLField({required: false, blank: true}),
      notes: new fields.StringField({required: false, blank: true}),
      
      // Party member management
      memberStatus: new fields.ObjectField(),
      
      // Travel roles
      roles: new fields.SchemaField({
        pathfinder: new fields.StringField({required: false, blank: true}),
        lookout: new fields.StringField({required: false, blank: true}),
        quartermaster: new fields.StringField({required: false, blank: true})
      }),
      
      // Party resources
      resources: new fields.SchemaField({
        rations: new fields.NumberField({initial: 0, min: 0, integer: true}),
        water: new fields.NumberField({initial: 0, min: 0, integer: true})
      }),
      
      // Travel settings
      settings: new fields.SchemaField({
        baseMovement: new fields.NumberField({
          initial: () => SystemConfigManager.getInstance().getConfig().movement.onFoot.value, 
          min: 0, 
          integer: true
        }),
        rationsPerDay: new fields.NumberField({initial: 1, min: 0, integer: true}),
        waterPerDay: new fields.NumberField({initial: 1, min: 0, integer: true}),
        encounterChance: new fields.NumberField({initial: 10, min: 0, max: 100, integer: true}),
        tokenScale: new fields.NumberField({initial: 1.5, min: 0.5, max: 3, step: 0.1}),
        showPartyHud: new fields.BooleanField({initial: true}),
        autoConsume: new fields.BooleanField({initial: false}),
        showWarnings: new fields.BooleanField({initial: true})
      }),
      
      // Party movement
      movement: new fields.SchemaField({
        value: new fields.NumberField({
          initial: () => SystemConfigManager.getInstance().getConfig().movement.onFoot.value, 
          min: 0, 
          integer: true
        }),
        isMounted: new fields.BooleanField({initial: false})
      }),
      
      // Journey tracking
      journey: new fields.SchemaField({
        origin: new fields.StringField({required: false, blank: true}),
        destination: new fields.StringField({required: false, blank: true}),
        distance: new fields.NumberField({initial: 0, min: 0, integer: true}),
        traveled: new fields.NumberField({initial: 0, min: 0, integer: true}),
        terrain: new fields.StringField({initial: "road", required: true})
      }),
      
      // Travel status
      status: new fields.SchemaField({
        traveling: new fields.BooleanField({initial: false}),
        resting: new fields.BooleanField({initial: false}),
        camping: new fields.BooleanField({initial: false})
      }),
      
      // Party inventory (shared items)
      inventory: new fields.ArrayField(new fields.SchemaField({
        id: new fields.DocumentIdField({required: true}),
        name: new fields.StringField({required: true}),
        img: new fields.FilePathField({required: false, categories: ["IMAGE"]}),
        quantity: new fields.NumberField({initial: 1, min: 0, integer: true})
      }))
    };
  }

  /**
   * Calculate derived data for the party
   */
  prepareDerivedData() {
    // Initialize memberStatus if not present - but don't reassign the property
    if (!this.memberStatus) {
      this.memberStatus = {};
    }
    
    // Initialize counts for each status
    const activeMembers = [];
    const travelingMembers = [];
    const stayingBehindMembers = [];
    
    // Count members by status from current memberStatus only
    // NOTE: We removed legacy member processing as it was causing removed characters to reappear
    Object.entries(this.memberStatus || {}).forEach(([id, status]) => {
      if (status === 'active') activeMembers.push(id);
      else if (status === 'traveling') travelingMembers.push(id);
      else if (status === 'stayingBehind') stayingBehindMembers.push(id);
    });
    
    // Set counts
    this.activeCount = activeMembers.length;
    this.travelingCount = travelingMembers.length;
    this.stayingBehindCount = stayingBehindMembers.length;
    
    // Store the filtered lists for easy access
    this.activeMembers = activeMembers;
    this.travelingMembers = travelingMembers;
    this.stayingBehindMembers = stayingBehindMembers;
    
    // Compute total members
    this.totalMembers = this.activeCount + this.travelingCount + this.stayingBehindCount;
    
    // Check if we have enough resources
    this.hasEnoughRations = this.resources.rations >= this.totalMembers;
    this.hasEnoughWater = this.resources.water >= this.totalMembers;
    
    // Calculate party movement rate
    this._calculateMovement();
  }
  
  /**
   * Calculate party movement rate based on system rules
   * @private
   */
  _calculateMovement() {
    const config = SystemConfigManager.getInstance().getConfig();
    
    // Use the appropriate movement rate from system config
    const movementConfig = this.movement.isMounted ? config.movement.mounted : config.movement.onFoot;
    let baseMovement = movementConfig.value;
    
    // Apply terrain modifiers if needed
    // For now, use the base value
    this.movement.value = baseMovement;
  }
}
