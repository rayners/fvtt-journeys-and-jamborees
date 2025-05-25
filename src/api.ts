/**
 * API exports for Journeys & Jamborees module
 * This provides access to key components for testing and integration
 */

import { SystemAdapterFactory } from './system-adapter';
import { SkillManager } from './skill-manager';
import { SystemConfigManager } from './system-config';

export const JourneysAndJamboreesAPI = {
  // System adapter for skill/movement handling
  get systemAdapter() {
    return SystemAdapterFactory.getAdapter();
  },
  
  // Skill manager for skill detection and configuration
  get skillManager() {
    return SkillManager.getInstance();
  },
  
  // System configuration manager
  get systemConfig() {
    return SystemConfigManager.getInstance();
  },
  
  // Version info
  version: '0.1.0',
  
  // Helper to check if using a specific adapter
  isUsingAdapter(adapterName: string): boolean {
    const adapter = this.systemAdapter;
    return adapter.constructor.name === adapterName;
  }
};

// Register the API when the module is ready
Hooks.once('ready', () => {
  const moduleData = game.modules.get('journeys-and-jamborees');
  if (moduleData) {
    moduleData.api = JourneysAndJamboreesAPI;
    console.log('Journeys & Jamborees | API registered');
  }
});