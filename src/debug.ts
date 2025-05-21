/**
 * Debug logger with consistent formatting and data inspection
 */
export const debugLog = (context: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  console.log(`%c[J&J Debug ${timestamp}] ${context}: %c${message}`, 'color: #9966ff; font-weight: bold', 'color: #66ccff');
  
  if (data !== undefined) {
    if (typeof data === 'object' && data !== null) {
      // For objects, we want to see all properties including non-enumerable ones
      console.log('Data:', JSON.parse(JSON.stringify(data, null, 2)));
      
      if (Array.isArray(data)) {
        console.log('Array length:', data.length);
      } else {
        // Show all keys including symbols and non-enumerable
        console.log('Object keys:', Object.getOwnPropertyNames(data));
      }
    } else {
      console.log('Data:', data);
    }
  }
};

/**
 * Inspect a DOM element structure, particularly useful for debugging UI issues
 */
export const inspectElement = (element: HTMLElement, context: string) => {
  debugLog(context, 'Element inspection:', {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    attributes: Array.from(element.attributes).map(attr => ({ name: attr.name, value: attr.value })),
    children: element.children.length
  });
  
  // If it's a select element, inspect its options
  if (element.tagName === 'SELECT') {
    const select = element as HTMLSelectElement;
    const options = Array.from(select.options).map(option => ({
      value: option.value,
      text: option.text,
      selected: option.selected
    }));
    
    debugLog(context, 'Select options:', options);
  }
};

/**
 * Debug the create actor dialog
 */
export const inspectCreateActorDialog = (dialog: any, html: JQuery) => {
  debugLog('CreateActorDialog', 'Dialog inspection:', {
    title: dialog.title,
    element: html[0]?.outerHTML || 'No HTML found'
  });
  
  const typeSelect = html.find('select[name="type"]');
  if (typeSelect.length) {
    const selectElement = typeSelect[0] as HTMLSelectElement;
    inspectElement(selectElement, 'CreateActorDialog-TypeSelect');
    
    // List all options
    debugLog('CreateActorDialog', 'Type select options:', 
      Array.from(selectElement.options).map(o => `${o.value}: ${o.text}`));
  } else {
    debugLog('CreateActorDialog', 'Type select not found!');
  }
};

/**
 * Inspect CONFIG.Actor structure
 */
export const inspectActorConfig = () => {
  if (!CONFIG?.Actor) {
    debugLog('ActorConfig', 'CONFIG.Actor not available!');
    return;
  }
  
  // Types
  debugLog('ActorConfig', 'Actor types:', CONFIG.Actor.types);
  
  // Type labels
  const typeLabels = { ...CONFIG.Actor.typeLabels };
  debugLog('ActorConfig', 'Actor type labels:', typeLabels);
  
  // Data models
  const dataModelKeys = Object.keys(CONFIG.Actor.dataModels || {});
  debugLog('ActorConfig', 'Actor data models:', dataModelKeys);
  
  // Document classes
  const documentClassKeys = Object.keys(CONFIG.Actor.documentClasses || {});
  debugLog('ActorConfig', 'Actor document classes:', documentClassKeys);
};

/**
 * Find all places where an actor type might be registered
 */
export const findAllActorTypeReferences = (searchType = 'party') => {
  debugLog('TypeReferences', `Searching for type references containing "${searchType}"`);
  
  // Search in CONFIG
  if (CONFIG?.Actor) {
    // Types array
    const typesIndex = CONFIG.Actor.types?.findIndex(t => t.includes(searchType));
    if (typesIndex !== undefined && typesIndex >= 0) {
      debugLog('TypeReferences', `Found in CONFIG.Actor.types[${typesIndex}]:`, CONFIG.Actor.types[typesIndex]);
    }
    
    // Type labels
    for (const [key, value] of Object.entries(CONFIG.Actor.typeLabels || {})) {
      if (key.includes(searchType)) {
        debugLog('TypeReferences', `Found in CONFIG.Actor.typeLabels["${key}"]:`, value);
      }
    }
    
    // Data models
    for (const key of Object.keys(CONFIG.Actor.dataModels || {})) {
      if (key.includes(searchType)) {
        debugLog('TypeReferences', `Found in CONFIG.Actor.dataModels["${key}"]`);
      }
    }
    
    // Document classes
    for (const key of Object.keys(CONFIG.Actor.documentClasses || {})) {
      if (key.includes(searchType)) {
        debugLog('TypeReferences', `Found in CONFIG.Actor.documentClasses["${key}"]`);
      }
    }
  }
  
  // Search in translations
  if (game?.i18n?.translations) {
    for (const [key, value] of Object.entries(game.i18n.translations)) {
      if (key.includes(searchType)) {
        debugLog('TypeReferences', `Found in game.i18n.translations["${key}"]:`, value);
      }
    }
  }
};

/**
 * Examine all registered sheets for actors
 */
export const inspectRegisteredSheets = () => {
  if (!DocumentSheetConfig?.unpackObject) {
    debugLog('Sheets', 'DocumentSheetConfig not available');
    return;
  }
  
  const sheets = DocumentSheetConfig.unpackObject(DocumentSheetConfig["_configurations"].Actor);
  debugLog('Sheets', 'Registered Actor sheets:', sheets);
  
  // Look for our party sheets specifically
  for (const [id, sheetConfig] of Object.entries(sheets)) {
    if (id.includes('journeys') || 
        (sheetConfig as any)?.types?.some((t: string) => t.includes('party'))) {
      debugLog('Sheets', `Found relevant sheet config for "${id}":`, sheetConfig);
    }
  }
};
