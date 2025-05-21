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
      members: new fields.SchemaField({
        active: new fields.ArrayField(new fields.SchemaField({
          id: new fields.DocumentIdField({required: true}),
          isLeader: new fields.BooleanField({initial: false})
        })),
        traveling: new fields.ArrayField(new fields.SchemaField({
          id: new fields.DocumentIdField({required: true})
        })),
        stayingBehind: new fields.ArrayField(new fields.SchemaField({
          id: new fields.DocumentIdField({required: true})
        }))
      }),
      
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
        baseMovement: new fields.NumberField({initial: 15, min: 0, integer: true}), // Default 15km per Dragonbane rules
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
        value: new fields.NumberField({initial: 15, min: 0, integer: true}),
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
    // Count active members
    this.activeCount = this.members.active.length;
    
    // Count traveling members
    this.travelingCount = this.members.traveling.length;
    
    // Compute total members
    this.totalMembers = this.activeCount + this.travelingCount + this.members.stayingBehind.length;
    
    // Check if we have enough resources
    this.hasEnoughRations = this.resources.rations >= this.totalMembers;
    this.hasEnoughWater = this.resources.water >= this.totalMembers;
    
    // Calculate party movement rate
    this._calculateMovement();
  }
  
  /**
   * Calculate party movement rate based on Dragonbane rules
   * Base movement is 15km per shift on foot, 30km if mounted
   * @private
   */
  _calculateMovement() {
    // Get the base movement from settings (default 15km per Dragonbane rules)
    let baseMovement = this.settings.baseMovement;
    
    // Double movement if the party is mounted
    if (this.movement.isMounted) {
      baseMovement *= 2; // 30km if mounted
    }
    
    // Apply terrain modifiers if needed
    // For now, use the base value
    this.movement.value = baseMovement;
  }
}
