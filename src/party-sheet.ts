import {
  ACTIVITY_DATA,
  TARGETED_ACTIVITIES,
  CATEGORY_DATA,
  ORDER_ALL,
  ORDER_CHAR,
  TOGGLE_IDS,
  ATTR_CONDS,
  findActivityOption
} from './activity-data.js';
import type { PartyInventoryEntry } from './party-actor.js';
import { PartyActorType } from './party-actor.js';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Party actor sheet implemented as ActorSheetV2 (Foundry v13 API).
 * Replaces the legacy ActorSheet with 5-tab layout:
 * 1. Command Center — per-character rows with HP/WP/ENC bars and condition toggles
 * 2. Logistics — aggregated party inventory with filtering
 * 3. Formation & Tasks — marching order + activity manager
 * 4. Journal — party description/notes
 * 5. Settings — party configuration
 */
export class PartyActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['journeys-and-jamborees', 'sheet', 'party'],
    position: { width: 700, height: 800 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      toggleCondition: PartyActorSheet.#onToggleCondition,
      toggleLight: PartyActorSheet.#onToggleLight,
      rollActivity: PartyActorSheet.#onRollActivity,
      removeActivity: PartyActorSheet.#onRemoveActivity,
      addAllCharacters: PartyActorSheet.#onAddAllCharacters,
      removeCharacter: PartyActorSheet.#onRemoveCharacter,
      removeAllCharacters: PartyActorSheet.#onRemoveAllCharacters,
      makeCamp: PartyActorSheet.#onMakeCamp,
      addResource: PartyActorSheet.#onAddResource,
      removeResource: PartyActorSheet.#onRemoveResource,
      distributeResource: PartyActorSheet.#onDistributeResource,
      rollPathfinding: PartyActorSheet.#onRollPathfinding,
      toggleMounted: PartyActorSheet.#onToggleMounted,
      saveFormation: PartyActorSheet.#onSaveFormation
    }
  };

  static PARTS = {
    header: { template: 'modules/journeys-and-jamborees/templates/parts/header.hbs' },
    tabs: { template: 'modules/journeys-and-jamborees/templates/parts/tabs.hbs' },
    'command-center': {
      scrollable: [''],
      template: 'modules/journeys-and-jamborees/templates/parts/command-center.hbs'
    },
    logistics: {
      scrollable: [''],
      template: 'modules/journeys-and-jamborees/templates/parts/logistics.hbs'
    },
    formation: {
      scrollable: [''],
      template: 'modules/journeys-and-jamborees/templates/parts/formation.hbs'
    },
    journal: {
      scrollable: [''],
      template: 'modules/journeys-and-jamborees/templates/parts/journal.hbs'
    },
    settings: {
      scrollable: [''],
      template: 'modules/journeys-and-jamborees/templates/parts/settings.hbs'
    }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'command-center', group: 'primary', label: 'J&J.tabs.commandCenter', icon: 'fas fa-users' },
        { id: 'logistics', group: 'primary', label: 'J&J.tabs.logistics', icon: 'fas fa-boxes' },
        { id: 'formation', group: 'primary', label: 'J&J.tabs.formation', icon: 'fas fa-map-signs' },
        { id: 'journal', group: 'primary', label: 'J&J.tabs.journal', icon: 'fas fa-book' },
        { id: 'settings', group: 'primary', label: 'J&J.tabs.settings', icon: 'fas fa-cog' }
      ],
      initial: 'command-center'
    }
  };

  /** Hook IDs for cleanup on close */
  #hookIds: number[] = [];

  get actor(): PartyActorType {
    return super.actor as PartyActorType;
  }

  /** @override */
  async _prepareContext(options: unknown): Promise<Record<string, unknown>> {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const system = actor.system;

    // Get party members
    const memberStatus = system.memberStatus || {};
    const characters = this._prepareCharacterData(memberStatus);

    // Prepare inventory for logistics tab
    const inventoryData = actor.scanPartyInventory();
    const logistics = this._prepareLogisticsData(inventoryData, characters);

    // Prepare formation data
    const formationData = this._prepareFormationData(characters, system);

    return {
      ...context,
      actor,
      system,
      // Tab system
      tabs: this._prepareTabs(),
      // Command Center data
      characters,
      toggleIds: TOGGLE_IDS,
      attrConds: ATTR_CONDS,
      // Logistics data
      logistics,
      categoryData: CATEGORY_DATA,
      orderAll: ORDER_ALL,
      orderChar: ORDER_CHAR,
      // Formation & Tasks data
      formation: formationData,
      activityData: ACTIVITY_DATA,
      targetedActivities: TARGETED_ACTIVITIES,
      // Metadata
      isGM: game.user?.isGM ?? false,
      isEditable: this.isEditable
    };
  }

  /** Prepare character rows for Command Center */
  private _prepareCharacterData(memberStatus: Record<string, string>) {
    return Object.keys(memberStatus)
      .map(id => game.actors?.get(id))
      .filter(Boolean)
      .map(actor => {
        const s = actor.system;
        const hpVal = s.hitPoints?.value ?? 0;
        const hpBase = s.hitPoints?.base ?? hpVal;
        const hpMax = s.hitPoints?.max ?? 10;
        const wpVal = s.willPoints?.value ?? 0;
        const wpBase = s.willPoints?.base ?? wpVal;
        const wpMax = s.willPoints?.max ?? 10;
        const encVal = s.encumbrance?.value ?? 0;
        const encMax = s.maxEncumbrance?.value ?? 10;
        const mvVal = s.movement?.base ?? s.movement?.value ?? '?';

        const hpPct = Math.max(0, Math.min(100, (hpVal / (hpMax || 1)) * 100));
        const wpPct = Math.max(0, Math.min(100, (wpVal / (wpMax || 1)) * 100));
        const encPct = Math.max(0, Math.min(100, (encVal / (encMax || 1)) * 100));
        const isOverEncumbered = encVal > encMax;

        // Conditions — check actor.statuses (Foundry v13) and active effects
        const toggleStates = TOGGLE_IDS.map(t => ({
          ...t,
          active: actor.statuses?.has(t.id) || actor.effects?.some(
            e => (e.statusId === t.id || e.flags?.core?.statusId === t.id) && !e.disabled
          ) || false
        }));

        const attrStates = ATTR_CONDS.map(a => ({
          ...a,
          active: actor.statuses?.has(a.id) || actor.effects?.some(
            e => (e.statusId === a.id || e.flags?.core?.statusId === a.id) && !e.disabled
          ) || false
        }));

        return {
          id: actor.id,
          name: actor.name,
          img: actor.img,
          status: memberStatus[actor.id],
          isOwner: actor.isOwner,
          hp: { value: hpVal, base: hpBase, max: hpMax, pct: hpPct },
          wp: { value: wpVal, base: wpBase, max: wpMax, pct: wpPct },
          enc: { value: encVal, max: encMax, pct: encPct, isOverEncumbered },
          movement: mvVal,
          toggleStates,
          attrStates
        };
      });
  }

  /** Prepare inventory cards for Logistics tab */
  private _prepareLogisticsData(
    inventory: Record<string, PartyInventoryEntry>,
    characters: ReturnType<typeof this._prepareCharacterData>
  ) {
    const cards = Object.entries(inventory)
      .sort(([nameA, dataA], [nameB, dataB]) => {
        const ordA = ORDER_ALL[dataA.category] ?? 999;
        const ordB = ORDER_ALL[dataB.category] ?? 999;
        if (ordA !== ordB) return ordA - ordB;
        return nameA.localeCompare(nameB);
      })
      .map(([name, data]) => {
        const catData = CATEGORY_DATA[data.category] ?? CATEGORY_DATA['item'];
        return {
          name,
          ...data,
          catData,
          sortOrder: ORDER_ALL[data.category] ?? 500,
          ownerList: Object.entries(data.owners).map(([oName, oData]) => ({
            name: oName,
            ...oData
          }))
        };
      });

    return { cards, characterFilters: characters };
  }

  /** Prepare formation and activity data */
  private _prepareFormationData(
    characters: ReturnType<typeof this._prepareCharacterData>,
    system: any
  ) {
    const formation: string[] = system.formation ?? [];
    const activities: Record<string, any> = system.activities ?? {};
    const lightStatus: Record<string, boolean> = system.lightStatus ?? {};

    // Sort characters by formation order
    const ordered = [...characters].sort((a, b) => {
      const ia = formation.indexOf(a.id);
      const ib = formation.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    const activityRows = characters.map(char => {
      const assignment = activities[char.id] ?? null;
      const actKey = assignment?.activity ?? '';
      const targetId = assignment?.target ?? '';
      const customSkill = assignment?.customSkill ?? null;

      const actOption = actKey ? findActivityOption(actKey) : null;
      const skillToRoll = customSkill ?? actOption?.skill ?? null;

      return {
        ...char,
        assignment,
        actKey,
        targetId,
        customSkill,
        actOption,
        skillToRoll,
        skillLabel: skillToRoll ? skillToRoll.replace(/_/g, ' ').toUpperCase() : '',
        isTargeted: TARGETED_ACTIVITIES.includes(actKey),
        isLit: lightStatus[char.id] ?? false,
        otherChars: characters.filter(c => c.id !== char.id)
      };
    });

    return { ordered, activityRows, formation, lightStatus };
  }

  /** Build tab navigation context */
  private _prepareTabs() {
    const tabs: Record<string, any> = {};
    const tabDefs = (PartyActorSheet.TABS as any).primary.tabs;
    const active = (this.tabGroups as any)?.primary ?? 'command-center';
    for (const tab of tabDefs) {
      tabs[tab.id] = {
        ...tab,
        active: tab.id === active,
        cssClass: tab.id === active ? 'active' : ''
      };
    }
    return tabs;
  }

  /** @override */
  _onRender(context: unknown, options: unknown) {
    super._onRender(context, options);
    const html = this.element;

    // Inventory filter buttons
    html.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.preventDefault();
        html.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        (btn as HTMLElement).classList.add('active');
        this._applyInventoryFilter((btn as HTMLElement).dataset.target ?? 'all');
      });
    });
    this._applyInventoryFilter('all');

    // Activity select changes
    html.querySelectorAll('.activity-select').forEach(select => {
      select.addEventListener('change', async ev => {
        const el = ev.currentTarget as HTMLSelectElement;
        const charId = el.dataset.charId ?? '';
        const activity = el.value;
        if (charId) await this.actor.setCharacterActivity(charId, activity);
      });
    });

    // Target select changes
    html.querySelectorAll('.target-select').forEach(select => {
      select.addEventListener('change', async ev => {
        const el = ev.currentTarget as HTMLSelectElement;
        const charId = el.dataset.charId ?? '';
        const targetId = el.value;
        const curActivity = this.actor.system.activities?.[charId]?.activity ?? 'support';
        if (charId) await this.actor.setCharacterActivity(charId, curActivity, targetId);
      });
    });

    // Formation drag-and-drop
    this._activateFormationDragDrop(html);

    // Item card detail popups
    html.querySelectorAll('.item-card').forEach(card => {
      card.addEventListener('click', ev => {
        ev.preventDefault();
        const payload = (card as HTMLElement).dataset.payload;
        if (payload) this._showItemDetail(JSON.parse(payload));
      });
    });

    // Drag-drop for adding characters to party
    this._activateCharacterDragDrop(html);
  }

  /** @override */
  _onFirstRender(context: unknown, options: unknown) {
    super._onFirstRender(context, options);

    // Register hooks to auto-refresh when relevant data changes
    const id1 = Hooks.on('updateActor', (actor: Actor) => {
      if (this._isRelevantActor(actor)) this.render();
    });
    const id2 = Hooks.on('createActiveEffect', (effect: ActiveEffect) => {
      if (this._isRelevantActor(effect.parent as Actor)) this.render();
    });
    const id3 = Hooks.on('deleteActiveEffect', (effect: ActiveEffect) => {
      if (this._isRelevantActor(effect.parent as Actor)) this.render();
    });
    const id4 = Hooks.on('updateItem', (_item: Item, _changes: unknown, _options: unknown, userId: string) => {
      this.render();
    });

    this.#hookIds = [id1, id2, id3, id4];
  }

  /** @override */
  async _preClose(options: unknown) {
    this.#hookIds.forEach(id => Hooks.off('updateActor', id));
    this.#hookIds.forEach(id => Hooks.off('createActiveEffect', id));
    this.#hookIds.forEach(id => Hooks.off('deleteActiveEffect', id));
    this.#hookIds.forEach(id => Hooks.off('updateItem', id));
    this.#hookIds = [];
    return super._preClose(options);
  }

  private _isRelevantActor(actor: Actor | null) {
    if (!actor) return false;
    if (actor.id === this.actor.id) return true;
    return !!this.actor.system.memberStatus?.[actor.id];
  }

  /** Apply inventory filter by character name or 'all' */
  private _applyInventoryFilter(target: string) {
    const html = this.element;
    const isAll = target === 'all';

    html.querySelectorAll('.item-card').forEach(card => {
      const el = card as HTMLElement;
      const payload = JSON.parse(el.dataset.payload ?? '{}');
      if (isAll || payload.owners?.[target]) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });

    // Show/hide category dividers
    html.querySelectorAll('.grid-divider').forEach(div => {
      const cat = (div as HTMLElement).dataset.cat;
      const hasVisible = html.querySelector(`.item-card[data-cat="${cat}"]`);
      (div as HTMLElement).style.display = hasVisible ? '' : 'none';
    });
  }

  /** Formation drag-and-drop reordering */
  private _activateFormationDragDrop(html: HTMLElement) {
    const container = html.querySelector('#formation-container');
    if (!container) return;

    let dragSrcId: string | null = null;

    container.querySelectorAll('.formation-slot[draggable="true"]').forEach(slot => {
      slot.addEventListener('dragstart', ev => {
        dragSrcId = (slot as HTMLElement).dataset.charId ?? null;
        (slot as HTMLElement).style.opacity = '0.4';
        (ev as DragEvent).dataTransfer?.setData('text/plain', dragSrcId ?? '');
      });

      slot.addEventListener('dragover', ev => {
        ev.preventDefault();
      });

      slot.addEventListener('drop', async ev => {
        ev.stopPropagation();
        (slot as HTMLElement).style.opacity = '1';
        const targetId = (slot as HTMLElement).dataset.charId;
        if (!dragSrcId || !targetId || dragSrcId === targetId) return;

        const formation = [...(this.actor.system.formation ?? [])];
        const characters = Object.keys(this.actor.system.memberStatus ?? {});

        // Get current ordered list (fill missing from memberStatus order)
        const orderedIds = characters.sort((a, b) => {
          const ia = formation.indexOf(a);
          const ib = formation.indexOf(b);
          if (ia === -1 && ib === -1) return 0;
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });

        const fromIdx = orderedIds.indexOf(dragSrcId);
        const toIdx = orderedIds.indexOf(targetId);
        if (fromIdx >= 0 && toIdx >= 0) {
          const [moved] = orderedIds.splice(fromIdx, 1);
          orderedIds.splice(toIdx, 0, moved);
          await this.actor.setFormationOrder(orderedIds);
        }
      });

      slot.addEventListener('dragend', () => {
        (slot as HTMLElement).style.opacity = '1';
        dragSrcId = null;
      });
    });
  }

  /** Enable dropping character actors onto the sheet */
  private _activateCharacterDragDrop(html: HTMLElement) {
    html.addEventListener('dragover', ev => ev.preventDefault());
    html.addEventListener('drop', async ev => {
      let data: any;
      try {
        data = JSON.parse(ev.dataTransfer?.getData('text/plain') ?? '{}');
      } catch {
        return;
      }
      if (data.type !== 'Actor') return;

      const actor = await Actor.implementation.fromDropData(data);
      if (!actor || actor.type !== 'character') {
        ui.notifications?.warn('Only character actors can be added to the party.');
        return;
      }
      if (!game.user?.isGM && !actor.isOwner) {
        ui.notifications?.error('You can only add characters you own to the party.');
        return;
      }
      await this.actor.addCharacter(actor.id, 'active', true);
    });
  }

  /** Show item detail popup using DialogV2 */
  private _showItemDetail(payload: any) {
    const { DialogV2 } = foundry.applications.api;

    let statsHtml = '';
    if (payload.stats && Object.keys(payload.stats).length > 0) {
      const statItems = Object.entries(payload.stats)
        .filter(([, val]) => val && val !== '0' && val !== 0)
        .map(([key, val]) => `<b>${key}:</b> ${val}`);
      if (statItems.length > 0) {
        statsHtml = `<div class="item-stats">${statItems.join(' | ')}</div>`;
      }
    }

    const descHtml = payload.desc
      ? `<div class="item-desc">${payload.desc}</div>`
      : '';

    const ownersHtml = Object.entries(payload.owners ?? {})
      .map(([owner, data]: [string, any]) => `
        <div class="item-owner-row">
          <img src="${data.icon}" class="owner-portrait">
          <div class="owner-name">${owner} ${data.equipped ? '<i class="fas fa-shield-alt"></i>' : ''}</div>
          <div class="owner-count">${!['magic_trick', 'spell_book', 'ability'].includes(payload.category) ? data.count : ''}</div>
        </div>`)
      .join('');

    const content = `
      <div class="item-detail-popup">
        <button class="btn-share-chat">
          <i class="fas fa-comment"></i> Share to Chat
        </button>
        ${statsHtml}
        ${descHtml}
        <h3>Carriers</h3>
        ${ownersHtml}
      </div>`;

    DialogV2.wait({
      window: { title: payload.name },
      content,
      buttons: [{ action: 'close', label: 'Close', default: true }],
      render: (event: Event, html: HTMLElement) => {
        html.querySelector('.btn-share-chat')?.addEventListener('click', ev => {
          ev.preventDefault();
          const chatContent = `
            <div class="item-chat-share">
              <header class="item-chat-header">
                <img src="${payload.img}" class="item-chat-img">
                <h3>${payload.name}</h3>
              </header>
              <div>${statsHtml}<div>${payload.desc || 'No description.'}</div></div>
            </div>`;
          ChatMessage.create({ content: chatContent });
          ui.notifications?.info(`Shared ${payload.name} to chat.`);
        });
      }
    });
  }

  // ===== STATIC ACTION HANDLERS =====

  static async #onToggleCondition(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const actorId = (target.closest('[data-actor-id]') as HTMLElement)?.dataset.actorId;
    const effectId = target.dataset.effectId;
    if (!actorId || !effectId) return;
    const actor = game.actors?.get(actorId);
    if (actor) await actor.toggleStatusEffect(effectId);
  }

  static async #onToggleLight(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const charId = target.dataset.charId;
    if (charId) await this.actor.toggleCharacterLight(charId);
  }

  static async #onRollActivity(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const charId = target.dataset.charId;
    const skillName = target.dataset.skill;
    const activityName = target.dataset.activity;
    const targetId = target.dataset.target;

    if (!charId || !skillName) return;
    const char = game.actors?.get(charId);
    if (!char) return;

    let displayContext = activityName ?? skillName;
    if (targetId) {
      const targetChar = game.actors?.get(targetId);
      if (targetChar) displayContext += ` for ${targetChar.name}`;
    }

    ChatMessage.create({
      content: `
        <div class="skill-request-card">
          <header class="skill-request-header">
            <i class="fas fa-dice-d20"></i>
            <span>Skill Request</span>
          </header>
          <div class="skill-request-body">
            <img src="${char.img}" class="skill-request-portrait">
            <div>
              <div class="skill-request-name">${char.name}</div>
              <div>Please roll <strong>${skillName}</strong></div>
              <div class="skill-request-context">Context: ${displayContext}</div>
            </div>
          </div>
        </div>`
    });
  }

  static async #onRemoveActivity(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const charId = target.dataset.charId;
    if (charId) await this.actor.clearCharacterActivity(charId);
  }

  static async #onAddAllCharacters(this: PartyActorSheet, event: Event) {
    event.preventDefault();
    await this.actor.addAllCharactersAsActive();
  }

  static async #onRemoveCharacter(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const charId = target.dataset.charId;
    if (charId) await this.actor.removeCharacter(charId, true);
  }

  static async #onRemoveAllCharacters(this: PartyActorSheet, event: Event) {
    event.preventDefault();
    const { DialogV2 } = foundry.applications.api;
    const isGM = game.user?.isGM ?? false;
    const confirmed = await DialogV2.confirm({
      window: { title: isGM ? 'Remove All Characters' : 'Remove Your Characters' },
      content: isGM
        ? '<p>Are you sure you want to remove all characters from the party?</p>'
        : '<p>Are you sure you want to remove all your characters from the party?</p>'
    });
    if (!confirmed) return;
    if (isGM) await this.actor.removeAllCharacters();
    else await this.actor.removeOwnCharacters();
  }

  static async #onMakeCamp(this: PartyActorSheet, event: Event) {
    event.preventDefault();
    await this.actor.makeCamp();
  }

  static async #onAddResource(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const type = target.dataset.resourceType;
    if (type) await this.actor.addResource(type);
  }

  static async #onRemoveResource(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const type = target.dataset.resourceType;
    if (type) await this.actor.removeResource(type);
  }

  static async #onDistributeResource(this: PartyActorSheet, event: Event, target: HTMLElement) {
    event.preventDefault();
    const type = target.dataset.resourceType;
    if (type) await this.actor.distributeResources(type);
  }

  static async #onRollPathfinding(this: PartyActorSheet, event: Event) {
    event.preventDefault();
    await this.actor.rollPathfinding();
  }

  static async #onToggleMounted(this: PartyActorSheet, event: Event) {
    event.preventDefault();
    await this.actor.toggleMounted();
  }

  static async #onSaveFormation(this: PartyActorSheet, event: Event) {
    event.preventDefault();
    // Formation order is saved via drag-drop; this button just confirms
    ui.notifications?.info('Marching order saved.');
  }
}
