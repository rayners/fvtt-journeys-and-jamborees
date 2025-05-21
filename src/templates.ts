export const preloadTemplates = async function() {
  const templatePaths = [
    // Main templates
    'modules/journeys-and-jamborees/templates/party-sheet.hbs',
    'modules/journeys-and-jamborees/templates/party-hud.hbs',
    
    // Partial templates
    'modules/journeys-and-jamborees/templates/partials/pathfinder-selector.hbs',
    'modules/journeys-and-jamborees/templates/partials/party-sheet-inventory.hbs',
    'modules/journeys-and-jamborees/templates/partials/party-sheet-journal.hbs',
    'modules/journeys-and-jamborees/templates/partials/party-sheet-members.hbs',
    'modules/journeys-and-jamborees/templates/partials/party-sheet-settings.hbs',
    'modules/journeys-and-jamborees/templates/partials/party-sheet-travel.hbs'
  ];

  // Load all templates normally
  await loadTemplates(templatePaths);
  
  // Register partials for Handlebars
  const partialPaths = [
    { name: 'pathfinder-selector', path: 'modules/journeys-and-jamborees/templates/partials/pathfinder-selector.hbs' },
    { name: 'party-sheet-inventory', path: 'modules/journeys-and-jamborees/templates/partials/party-sheet-inventory.hbs' },
    { name: 'party-sheet-journal', path: 'modules/journeys-and-jamborees/templates/partials/party-sheet-journal.hbs' },
    { name: 'party-sheet-members', path: 'modules/journeys-and-jamborees/templates/partials/party-sheet-members.hbs' },
    { name: 'party-sheet-settings', path: 'modules/journeys-and-jamborees/templates/partials/party-sheet-settings.hbs' },
    { name: 'party-sheet-travel', path: 'modules/journeys-and-jamborees/templates/partials/party-sheet-travel.hbs' }
  ];
  
  // Register each partial with Handlebars
  for (const partial of partialPaths) {
    // Fetch the template content
    const content = await fetch(partial.path).then(response => response.text());
    
    // Register with both namespaced and non-namespaced names
    Handlebars.registerPartial(partial.name, content);
    Handlebars.registerPartial(`journeys-and-jamborees.partials.${partial.name}`, content);
  }
  
  return true;
};
