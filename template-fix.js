// Template Path Fix
// Run this code in your browser console when Foundry VTT is loaded

// First, check if templates exist in the correct location
(async function() {
  const checkTemplates = async () => {
    try {
      console.log('Template Fix | Checking for template files');
      
      // Helper function to check if a file exists
      const fileExists = async (path) => {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          return response.ok;
        } catch (e) {
          return false;
        }
      };
      
      // Check if templates are in the correct location
      const templateRoot = 'modules/journeys-and-jamborees/templates/';
      const moduleRoot = 'modules/journeys-and-jamborees/';
      
      const templatePaths = [
        templateRoot + 'party-sheet.hbs',
        templateRoot + 'party-hud.hbs'
      ];
      
      const fallbackPaths = [
        moduleRoot + 'party-sheet.hbs',
        moduleRoot + 'party-hud.hbs'
      ];
      
      // Check if templates exist in correct location
      let templatesExist = true;
      for (const path of templatePaths) {
        const exists = await fileExists(path);
        if (!exists) {
          console.warn(`Template Fix | Template not found: ${path}`);
          templatesExist = false;
          break;
        }
      }
      
      // If templates are missing from correct location, check fallback location
      if (!templatesExist) {
        console.log('Template Fix | Checking fallback template locations');
        let fallbacksExist = true;
        
        for (const path of fallbackPaths) {
          const exists = await fileExists(path);
          if (!exists) {
            console.error(`Template Fix | Fallback template not found: ${path}`);
            fallbacksExist = false;
            break;
          }
        }
        
        if (fallbacksExist) {
          // Templates exist in fallback location but not in correct location
          console.warn('Template Fix | Template files are in the wrong location');
          console.warn('Template Fix | Creating runtime fix...');
          
          // Create directories using FilePicker API if possible
          if (typeof FilePicker !== 'undefined') {
            try {
              await FilePicker.createDirectory('data', 'modules/journeys-and-jamborees/templates');
              console.log('Template Fix | Created templates directory');
            } catch (error) {
              console.error('Template Fix | Error creating templates directory:', error);
            }
          }
          
          // Override the loadTemplates function temporarily to handle fallback paths
          const originalLoadTemplates = loadTemplates;
          window.loadTemplates = function(paths) {
            const fixedPaths = paths.map(path => {
              if (path.includes('/templates/') && path.includes('journeys-and-jamborees')) {
                return path.replace('/templates/', '/');
              }
              return path;
            });
            return originalLoadTemplates(fixedPaths);
          };
          
          console.warn('Template Fix | Applied runtime template path fix');
          ui.notifications.warn('Journeys & Jamborees: Template path issue detected. Applied temporary fix. See console for details.');
          
          return true; // Fix applied
        } else {
          console.error('Template Fix | Template files not found in any location');
          ui.notifications.error('Journeys & Jamborees: Template files missing. Module will not function correctly.');
          return false;
        }
      } else {
        console.log('Template Fix | Template files found in correct location');
        return true; // Everything OK
      }
    } catch (error) {
      console.error('Template Fix | Error checking template paths:', error);
      return false;
    }
  };
  
  const result = await checkTemplates();
  return `Template fix ${result ? 'applied successfully' : 'failed'}`;
})();
