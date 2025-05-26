/**
 * Skill Roll Tracker for Food Gathering System
 * Monitors chat messages to determine success/failure of skill rolls
 */

export interface PendingRoll {
  id: string;
  actorId: string;
  skillName: string;
  purpose: 'hunt-tracking' | 'hunt-kill' | 'fish' | 'forage' | 'cook';
  timestamp: number;
  callback: (success: boolean) => void;
  resolved?: boolean;
  allowPush?: boolean;
}

export class SkillRollTracker {
  private static instance: SkillRollTracker;
  private pendingRolls: Map<string, PendingRoll> = new Map();
  private chatHookId: number | null = null;
  
  private constructor() {
    this.initialize();
  }
  
  static getInstance(): SkillRollTracker {
    if (!SkillRollTracker.instance) {
      SkillRollTracker.instance = new SkillRollTracker();
    }
    return SkillRollTracker.instance;
  }
  
  private initialize() {
    // Hook into chat messages to monitor skill rolls
    this.chatHookId = Hooks.on('createChatMessage', this.onChatMessage.bind(this));
    
    // Clean up old pending rolls every minute
    setInterval(() => this.cleanupOldRolls(), 60000);
  }
  
  /**
   * Queue a skill roll for tracking
   * @param actorId The actor making the roll
   * @param skillName The skill being rolled
   * @param purpose What the roll is for
   * @param callback Function to call with the result
   * @param allowPush Whether to allow push rolls
   * @returns The pending roll ID
   */
  queueRoll(
    actorId: string, 
    skillName: string, 
    purpose: PendingRoll['purpose'], 
    callback: (success: boolean) => void,
    allowPush: boolean = true
  ): string {
    const id = foundry.utils.randomID();
    const pendingRoll: PendingRoll = {
      id,
      actorId,
      skillName,
      purpose,
      timestamp: Date.now(),
      callback,
      resolved: false,
      allowPush
    };
    
    this.pendingRolls.set(id, pendingRoll);
    
    // Store in user flags for persistence
    this.storePendingRoll(pendingRoll);
    
    return id;
  }
  
  /**
   * Handle chat messages to detect skill roll results
   */
  private async onChatMessage(chatMessage: ChatMessage) {
    // Check if this is a skill roll message
    const messageContent = chatMessage.content;
    const isSkillRoll = messageContent.includes('skill-roll') || 
                       messageContent.includes('data-skill-id');
    
    if (!isSkillRoll) return;
    
    // Debug: Log failed rolls to see their structure
    if (messageContent.includes('failure') || messageContent.includes('DoD.roll.failure')) {
      console.log('J&J SkillRollTracker: Failed roll message:', messageContent);
    }
    
    // Parse the message to extract actor and skill information
    const parser = new DOMParser();
    const doc = parser.parseFromString(messageContent, 'text/html');
    const skillRollDiv = doc.querySelector('.skill-roll, [data-actor-id]');
    
    if (!skillRollDiv) return;
    
    // Extract data from the skill roll
    const actorId = skillRollDiv.getAttribute('data-actor-id');
    const skillId = skillRollDiv.getAttribute('data-skill-id');
    const result = parseInt(skillRollDiv.getAttribute('data-result') || '0');
    const target = parseInt(skillRollDiv.getAttribute('data-target') || '0');
    
    // Also check for speaker information
    const speaker = chatMessage.speaker;
    const speakerActorId = speaker?.actor;
    
    // Check if this is a push roll by looking for specific indicators
    // In Dragonbane, pushed rolls have isReroll flag set
    const isPushRoll = chatMessage.flags?.dragonbane?.isReroll === true;
    
    // Debug logging for push detection
    if (isPushRoll && CONFIG.debug.hooks) {
      console.log('J&J SkillRollTracker: Push roll detected', {
        flags: chatMessage.flags?.dragonbane,
        contentSnippet: messageContent.substring(0, 200)
      });
    }
    
    // Determine success/failure from the message content
    let success = false;
    if (messageContent.includes('DoD.roll.dragon') || 
        messageContent.includes('DoD.roll.success') ||
        messageContent.includes(game.i18n.localize('DoD.roll.dragon')) ||
        messageContent.includes(game.i18n.localize('DoD.roll.success'))) {
      success = true;
    } else if (result > 0 && target > 0) {
      // Fallback: calculate success based on result vs target
      success = result <= target;
    }
    
    // Check if this is a failure that can be pushed
    // In Dragonbane, the push button appears in the chat message for failed rolls
    // Look for the actual push button HTML structure
    const canPush = !success && !isPushRoll && (
      messageContent.includes('push-roll') && // class="chat-button push-roll"
      messageContent.includes('data-actor-id=') && // Has actor data
      messageContent.includes(game.i18n.localize('DoD.roll.pushButtonLabel')) // Has push button text
    );
    
    // Find matching pending rolls
    const relevantActorId = actorId || speakerActorId;
    if (!relevantActorId) return;
    
    // Look for pending rolls from this actor
    for (const [rollId, pendingRoll] of this.pendingRolls.entries()) {
      // Skip already resolved rolls unless this is a push
      if (pendingRoll.resolved && !isPushRoll) {
        console.log('J&J SkillRollTracker: Skipping already resolved roll', rollId);
        continue;
      }
      
      // Match by actor ID (could be UUID or regular ID)
      const actorMatches = pendingRoll.actorId === relevantActorId || 
                          pendingRoll.actorId.includes(relevantActorId) ||
                          relevantActorId.includes(pendingRoll.actorId);
      
      if (actorMatches) {
        console.log('J&J SkillRollTracker: Found matching roll', {
          success,
          canPush,
          allowPush: pendingRoll.allowPush,
          resolved: pendingRoll.resolved,
          isPushRoll,
          rollId,
          purpose: pendingRoll.purpose
        });
        
        // If this is a failed roll that can be pushed, wait for potential push
        if (canPush && pendingRoll.allowPush && !pendingRoll.resolved) {
          console.log('J&J SkillRollTracker: Failed roll can be pushed, waiting...');
          // Don't mark as resolved yet - we're still waiting for a potential push
          // The roll will be resolved either by a push or by timeout
          continue;
        }
        
        // For push rolls or final results, resolve the pending roll
        console.log('J&J SkillRollTracker: Resolving roll with result:', success);
        this.resolvePendingRoll(rollId, success);
        break;
      }
    }
  }
  
  /**
   * Resolve a pending roll with the result
   */
  private resolvePendingRoll(rollId: string, success: boolean) {
    const pendingRoll = this.pendingRolls.get(rollId);
    if (!pendingRoll) return;
    
    // Call the callback with the result
    pendingRoll.callback(success);
    
    // Remove from pending rolls
    this.pendingRolls.delete(rollId);
    this.removePendingRoll(rollId);
  }
  
  /**
   * Store pending roll in user flags
   */
  private storePendingRoll(pendingRoll: PendingRoll) {
    const userId = game.userId;
    if (!userId) return;
    
    const user = game.users?.get(userId);
    if (!user) return;
    
    // Store minimal data (not the callback function)
    const rollData = {
      id: pendingRoll.id,
      actorId: pendingRoll.actorId,
      skillName: pendingRoll.skillName,
      purpose: pendingRoll.purpose,
      timestamp: pendingRoll.timestamp
    };
    
    const currentRolls = user.getFlag('journeys-and-jamborees', 'pendingRolls') || {};
    currentRolls[pendingRoll.id] = rollData;
    
    user.setFlag('journeys-and-jamborees', 'pendingRolls', currentRolls);
  }
  
  /**
   * Remove pending roll from user flags
   */
  private removePendingRoll(rollId: string) {
    const userId = game.userId;
    if (!userId) return;
    
    const user = game.users?.get(userId);
    if (!user) return;
    
    user.unsetFlag('journeys-and-jamborees', `pendingRolls.${rollId}`);
  }
  
  /**
   * Clean up old pending rolls (older than 5 minutes)
   */
  private cleanupOldRolls() {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    for (const [rollId, pendingRoll] of this.pendingRolls.entries()) {
      if (pendingRoll.timestamp < fiveMinutesAgo) {
        this.pendingRolls.delete(rollId);
        this.removePendingRoll(rollId);
      }
    }
  }
  
  /**
   * Clean up when module is disabled
   */
  destroy() {
    if (this.chatHookId !== null) {
      Hooks.off('createChatMessage', this.chatHookId);
      this.chatHookId = null;
    }
    
    this.pendingRolls.clear();
  }
}