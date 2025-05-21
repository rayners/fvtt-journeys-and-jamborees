# Template Fix for Journeys & Jamborees

If you're seeing the error about missing partials, you can run this code in your browser console when Foundry is open to fix it:

```javascript
// Fix for missing partials in Journeys & Jamborees
(async function() {
  console.log('J&J Fix | Registering missing partials');
  
  // Register each partial with Handlebars
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
    try {
      // Fetch the template content
      const response = await fetch(partial.path);
      if (!response.ok) {
        console.error(`J&J Fix | Could not fetch partial: ${partial.path}`);
        continue;
      }
      
      const content = await response.text();
      
      // Register with both namespaced and non-namespaced names
      Handlebars.registerPartial(partial.name, content);
      Handlebars.registerPartial(`journeys-and-jamborees.partials.${partial.name}`, content);
      console.log(`J&J Fix | Registered partial: ${partial.name}`);
    } catch (error) {
      console.error(`J&J Fix | Error registering partial ${partial.name}:`, error);
    }
  }
  
  console.log('J&J Fix | Partials registration complete');
  ui.notifications.info('Journeys & Jamborees: Partials registered successfully. Try opening the party sheet now.');
})();
```

Copy and paste the above code into your browser's console when Foundry VTT is running. This will manually register the partial templates that are missing.

## Permanent Fix

The permanent fix has been applied in the latest version. Make sure you're using the latest release and rebuild the module from source if you're a developer.
