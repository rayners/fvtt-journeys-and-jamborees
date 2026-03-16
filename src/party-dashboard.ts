import {
  ACTIVITY_DATA,
  CATEGORY_DATA,
  ORDER_ALL,
  ORDER_CHAR,
  TARGETED_ACTIVITIES,
  findActivityOption
} from './activity-data.js';
import { PartyActorType } from './party-actor.js';
import { SystemAdapterFactory } from './system-adapter.js';
import { SkillManager } from './skill-manager.js';
import { patchPartyActor } from './utils.js';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/** One instance per party actor UUID — prevents duplicate dashboard windows */
const _instances = new Map<string, PartyDashboardApp>();

/**
 * Party Dashboard — a tabbed ApplicationV2 opened on demand from the Command Center.
 * Contains Logistics, Formation & Tasks, Journal, and Settings tabs.
 * Not an ActorSheet — takes the party actor as a constructor parameter.
 */
export class PartyDashboardApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ['journeys-and-jamborees', 'sheet', 'party', 'party-dashboard'],
    position: { width: 650, height: 780 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      filterInventory: PartyDashboardApp.#onFilterInventory,
      showItemDetail: PartyDashboardApp.#onShowItemDetail,
      setActivity: PartyDashboardApp.#onSetActivity,
      removeActivity: PartyDashboardApp.#onRemoveActivity,
      rollActivity: PartyDashboardApp.#onRollActivity,
      toggleLight: PartyDashboardApp.#onToggleLight
    }
  };

  static PARTS = {
    tabs: {
      template: 'templates/generic/tab-navigation.hbs'
    },
    logistics: {
      scrollable: ['.item-grid'],
      template: 'modules/journeys-and-jamborees/templates/parts/logistics.hbs'
    },
    formation: {
      scrollable: ['.formation-container', '#activity-dropzone'],
      template: 'modules/journeys-and-jamborees/templates/parts/formation.hbs'
    },
    journal: {
      scrollable: ['.party-journal'],
      template: 'modules/journeys-and-jamborees/templates/parts/journal.hbs'
    },
    settings: {
      scrollable: ['.party-settings'],
      template: 'modules/journeys-and-jamborees/templates/parts/settings.hbs'
    }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: 'logistics', group: 'primary', label: 'J&J.tabs.logistics' },
        { id: 'formation', group: 'primary', label: 'J&J.tabs.formation' },
        { id: 'journal', group: 'primary', label: 'J&J.tabs.journal' },
        { id: 'settings', group: 'primary', label: 'J&J.tabs.settings' }
      ],
      initial: 'logistics'
    }
  };

  /** Provided by HandlebarsApplicationMixin — returns tab config objects keyed by id */
  declare _prepareTabs: (group: string) => Record<string, unknown>;

  /** The party actor this dashboard is bound to */
  readonly #actor: PartyActorType;

  /** Hook IDs for cleanup */
  #hookIds: number[] = [];

  constructor(actor: PartyActorType, options: Record<string, unknown> = {}) {
    super(options);
    this.#actor = actor;
  }

  /** Unique window ID per party actor */
  get id(): string {
    return `party-dashboard-${this.#actor.id}`;
  }

  /** Window title */
  get title(): string {
    return `${this.#actor.name} — Dashboard`;
  }

  /** Open or bring to front an existing dashboard for this actor */
  static openForActor(actor: PartyActorType, tab?: string) {
    patchPartyActor(actor);
    const key = actor.uuid ?? actor.id;
    let app = _instances.get(key);
    if (!app) {
      app = new PartyDashboardApp(actor);
      _instances.set(key, app);
    }
    app.render({ force: true });
    if (tab) {
      app.changeTab(tab, 'primary');
    }
    return app;
  }

  // ===== CONTEXT PREPARATION =====

  /** @override */
  async _prepareContext(options: unknown): Promise<Record<string, unknown>> {
    const context = await super._prepareContext(options);
    const actor = this.#actor;
    patchPartyActor(actor);
    const system = actor.system;

    return {
      ...context,
      actor,
      system,
      isGM: game.user?.isGM ?? false,
      isEditable: actor.isOwner,
      owner: actor.isOwner,
      editable: actor.isOwner
    };
  }

  /** @override — inject per-tab context (tab.cssClass) following S&S pattern */
  async _preparePartContext(partId: string, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const partContext: Record<string, unknown> = { ...context };

    // For the tab nav part, inject the tabs object from the mixin
    if (partId === 'tabs') {
      partContext.tabs = this._prepareTabs('primary');
    }

    // For each tab section, inject the specific tab object (provides cssClass)
    const tabs = (context.tabs ?? {}) as Record<string, unknown>;
    if (partId in tabs) {
      partContext.tab = tabs[partId];
    }

    // Tab-specific data
    switch (partId) {
      case 'logistics':
        partContext.logistics = this._prepareLogisticsData();
        break;
      case 'formation':
        Object.assign(partContext, this._prepareFormationData());
        partContext.activityData = ACTIVITY_DATA;
        break;
    }

    return partContext;
  }

  /** Prepare data for the Logistics tab */
  private _prepareLogisticsData() {
    const actor = this.#actor;
    const inventory = actor.scanPartyInventory();
    const characters = actor.getCharacters?.() ?? [];

    // Build sorted card list — name is the record key, not a property on the entry
    const cards = Object.entries(inventory).map(([name, entry]) => {
      const catData = CATEGORY_DATA[entry.category] ?? { label: entry.category, color: '#888' };
      const ownerList = Object.entries(entry.owners).map(([ownerName, owner]) => ({
        name: ownerName,
        icon: owner.icon,
        count: owner.count,
        equipped: owner.equipped
      }));
      return {
        ...entry,
        name,
        catData,
        ownerList,
        sortOrder: ORDER_ALL[entry.category] ?? 999
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    const characterFilters = characters.map(c => ({ id: c.id, name: c.name, img: c.img }));

    return { cards, characterFilters };
  }

  /** Prepare data for the Formation & Tasks tab */
  private _prepareFormationData() {
    const actor = this.#actor;
    const system = actor.system;
    const characters = actor.getCharacters?.() ?? [];

    // Build formation ordered list
    const formationIds: string[] = system.formation ?? [];
    const characterMap = new Map(characters.map(c => [c.id, c]));

    // Characters in formation order, then those not in formation
    const ordered: unknown[] = [];
    for (const id of formationIds) {
      const c = characterMap.get(id);
      if (c) ordered.push({
        id: c.id,
        name: c.name,
        img: c.img,
        isLit: !!(system.lightStatus?.[c.id])
      });
    }
    for (const c of characters) {
      if (!formationIds.includes(c.id)) {
        ordered.push({
          id: c.id,
          name: c.name,
          img: c.img,
          isLit: !!(system.lightStatus?.[c.id])
        });
      }
    }

    // Build activity rows
    const activities: Record<string, { activity: string; target?: string; customSkill?: string }> = system.activities ?? {};
    const activityRows = characters.map(c => {
      const assignment = activities[c.id] ?? {};
      const actKey = assignment.activity ?? '';
      const targetId = assignment.target ?? '';
      const customSkill = assignment.customSkill ?? null;
      const actOption = findActivityOption(actKey);
      const skillToRoll = customSkill ?? actOption?.skill ?? null;
      const isTargeted = TARGETED_ACTIVITIES.includes(actKey);
      const otherChars = characters.filter(o => o.id !== c.id).map(o => ({ id: o.id, name: o.name }));

      return {
        id: c.id,
        name: c.name,
        img: c.img,
        isOwner: c.isOwner,
        actKey,
        targetId,
        actOption,
        customSkill,
        skillToRoll,
        skillLabel: customSkill ?? actOption?.skill ?? '',
        isTargeted,
        otherChars
      };
    });

    return { formation: { ordered, activityRows } };
  }

  // ===== LIFECYCLE =====

  /** @override */
  _onRender(context: unknown, options: unknown) {
    super._onRender(context, options);
    this._activateFormationDragDrop();
    this._activateActivitySelects();
    this._activateInventoryFilter();
    this._activateActivityDragDrop();
  }

  /** @override */
  _onFirstRender(context: unknown, options: unknown) {
    super._onFirstRender(context, options);

    const refresh = () => this.render();
    const id1 = Hooks.on('updateActor', (a: Actor) => { if (this._isRelevantActor(a)) refresh(); });
    const id2 = Hooks.on('createActiveEffect', (e: ActiveEffect) => { if (this._isRelevantActor(e.parent as Actor)) refresh(); });
    const id3 = Hooks.on('deleteActiveEffect', (e: ActiveEffect) => { if (this._isRelevantActor(e.parent as Actor)) refresh(); });
    const id4 = Hooks.on('createItem', (_item: Item, _opts: unknown, _userId: string) => refresh());
    const id5 = Hooks.on('deleteItem', (_item: Item, _opts: unknown, _userId: string) => refresh());
    const id6 = Hooks.on('updateItem', (_item: Item, _opts: unknown, _userId: string) => refresh());

    this.#hookIds = [id1, id2, id3, id4, id5, id6];
  }

  /** @override */
  async _preClose(options: unknown) {
    this.#hookIds.forEach(id => {
      Hooks.off('updateActor', id);
      Hooks.off('createActiveEffect', id);
      Hooks.off('deleteActiveEffect', id);
      Hooks.off('createItem', id);
      Hooks.off('deleteItem', id);
      Hooks.off('updateItem', id);
    });
    this.#hookIds = [];
    _instances.delete(this.#actor.uuid ?? this.#actor.id);
    return super._preClose(options);
  }

  private _isRelevantActor(actor: Actor | null) {
    if (!actor) return false;
    if (actor.id === this.#actor.id) return true;
    return !!this.#actor.system.memberStatus?.[actor.id];
  }

  // ===== FORMATION DRAG-DROP =====

  private _activateFormationDragDrop() {
    const container = this.element.querySelector<HTMLElement>('#formation-container');
    if (!container) return;

    let draggedId: string | null = null;

    container.querySelectorAll<HTMLElement>('.formation-slot').forEach(slot => {
      slot.addEventListener('dragstart', ev => {
        draggedId = slot.dataset.charId ?? null;
        ev.dataTransfer?.setData('text/plain', draggedId ?? '');
      });
      slot.addEventListener('dragover', ev => {
        ev.preventDefault();
        slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', async ev => {
        ev.preventDefault();
        slot.classList.remove('drag-over');
        const targetId = slot.dataset.charId;
        if (!draggedId || draggedId === targetId) return;

        const slots = Array.from(container.querySelectorAll<HTMLElement>('.formation-slot'));
        const ids = slots.map(s => s.dataset.charId ?? '').filter(Boolean);
        const fromIdx = ids.indexOf(draggedId);
        const toIdx = ids.indexOf(targetId ?? '');
        if (fromIdx === -1 || toIdx === -1) return;

        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, draggedId);
        await this.#actor.setFormationOrder(ids);
      });
    });
  }

  // ===== ACTIVITY SELECTS =====

  private _activateActivitySelects() {
    this.element.querySelectorAll<HTMLSelectElement>('.activity-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const charId = sel.dataset.charId;
        if (!charId) return;
        const key = sel.value;
        if (!key) {
          await this.#actor.clearCharacterActivity(charId);
        } else {
          await this.#actor.setCharacterActivity(charId, key);
        }
      });
    });

    this.element.querySelectorAll<HTMLSelectElement>('.target-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const charId = sel.dataset.charId;
        if (!charId) return;
        const activities = this.#actor.system.activities ?? {};
        const current = activities[charId] ?? {};
        if (current.activity) {
          await this.#actor.setCharacterActivity(charId, current.activity, sel.value);
        }
      });
    });
  }

  // ===== INVENTORY FILTER =====

  private _activateInventoryFilter() {
    const filterBar = this.element.querySelector<HTMLElement>('#filter-bar');
    const grid = this.element.querySelector<HTMLElement>('#grid-container');
    if (!filterBar || !grid) return;

    filterBar.querySelectorAll<HTMLElement>('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target ?? 'all';
        this._applyInventoryFilter(grid, target);
      });
    });
  }

  /** Allow dragging a skill item onto an activity row to override the default skill */
  private _activateActivityDragDrop() {
    this.element.querySelectorAll<HTMLElement>('.activity-row').forEach(row => {
      row.addEventListener('dragover', ev => {
        ev.preventDefault();
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
      row.addEventListener('drop', async ev => {
        ev.preventDefault();
        row.classList.remove('drag-over');
        const charId = row.dataset.charId;
        if (!charId) return;

        let data: { type?: string; uuid?: string };
        try {
          data = JSON.parse(ev.dataTransfer?.getData('text/plain') ?? '{}');
        } catch {
          return;
        }
        if (data.type !== 'Item') return;

        const item = await fromUuid(data.uuid ?? '');
        if (!item) return;

        const activities = this.#actor.system.activities ?? {};
        const current = (activities as Record<string, { activity: string; target?: string }>)[charId];
        if (!current?.activity) {
          ui.notifications.warn('Select an activity first before overriding the skill.');
          return;
        }

        const itemName = (item as { name?: string }).name ?? '';
        await this.#actor.setCharacterActivity(charId, current.activity, current.target, itemName);
        ui.notifications.info(`${itemName} set as custom skill for this activity.`);
      });
    });
  }

  private _applyInventoryFilter(grid: HTMLElement, target: string) {
    grid.querySelectorAll<HTMLElement>('.item-card').forEach(card => {
      if (target === 'all') {
        card.style.display = '';
        return;
      }
      let payload: unknown;
      try { payload = JSON.parse(card.dataset.payload ?? '{}'); } catch { payload = {}; }
      const ownerList: Array<{ name: string }> = (payload as { ownerList?: Array<{ name: string }> }).ownerList ?? [];
      const visible = ownerList.some(o => o.name === target);
      card.style.display = visible ? '' : 'none';
    });
  }

  // ===== STATIC ACTION HANDLERS =====

  static async #onFilterInventory(this: PartyDashboardApp, _event: Event, target: HTMLElement) {
    const filterBar = target.closest<HTMLElement>('#filter-bar');
    const grid = this.element.querySelector<HTMLElement>('#grid-container');
    if (!filterBar || !grid) return;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    target.classList.add('active');
    this._applyInventoryFilter(grid, target.dataset.target ?? 'all');
  }

  static async #onShowItemDetail(this: PartyDashboardApp, _event: Event, target: HTMLElement) {
    const card = target.closest<HTMLElement>('.item-card');
    if (!card) return;
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(card.dataset.payload ?? '{}'); } catch { return; }

    const { DialogV2 } = foundry.applications.api;
    const name = payload.name as string ?? 'Item';
    const owners = (payload.ownerList as Array<{ name: string; icon: string }> ?? [])
      .map(o => `<img src="${o.icon}" title="${o.name}" style="width:24px;height:24px;border-radius:50%;"> ${o.name}`)
      .join('<br>');

    await DialogV2.wait({
      window: { title: name },
      content: `<p><strong>${name}</strong></p><p>Held by: ${owners || 'Unknown'}</p>`,
      buttons: [
        { label: 'Close', action: 'close', default: true }
      ]
    });
  }

  static async #onSetActivity(this: PartyDashboardApp, _event: Event, target: HTMLElement) {
    const charId = target.dataset.charId;
    const activity = target.dataset.activity;
    if (!charId || !activity) return;
    await this.#actor.setCharacterActivity(charId, activity);
  }

  static async #onRemoveActivity(this: PartyDashboardApp, _event: Event, target: HTMLElement) {
    const charId = target.dataset.charId;
    if (!charId) return;
    await this.#actor.clearCharacterActivity(charId);
  }

  static async #onRollActivity(this: PartyDashboardApp, _event: Event, target: HTMLElement) {
    const charId = target.dataset.charId;
    const skillName = target.dataset.skill;
    const activityLabel = target.dataset.activity;
    if (!charId || !skillName) return;

    const actor = game.actors?.get(charId);
    if (!actor) return;

    // Resolve skill name for the current system via synonym matching
    const skillManager = SkillManager.getInstance();
    const availableSkills = skillManager.getAvailableSkills();
    const resolvedSkill = skillManager.findBestMatch(skillName, availableSkills);

    if (resolvedSkill === 'none') {
      await PartyDashboardApp.#postSkillRequestChat(actor, skillName, activityLabel);
      return;
    }

    // Use SystemAdapter to perform the roll (handles system-native chat output)
    const adapter = SystemAdapterFactory.getAdapter();
    try {
      await adapter.rollSkill(actor, resolvedSkill);
    } catch {
      // Fallback: trigger native skill dialog
      adapter.triggerSkillRoll(actor, resolvedSkill);
    }
  }

  static async #postSkillRequestChat(actor: Actor, skillName: string, activityLabel?: string) {
    const actorName = (actor as { name?: string }).name ?? 'Unknown';
    const content = `
      <div class="jj-activity-chat">
        <header style="display:flex;align-items:center;gap:6px;font-weight:bold;">
          <i class="fas fa-dice-d20"></i>
          <span>${actorName} — ${activityLabel ?? skillName}</span>
        </header>
        <p>Skill <em>${skillName}</em> not found in this system. Please roll manually.</p>
      </div>
    `;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content
    });
  }

  static async #onToggleLight(this: PartyDashboardApp, _event: Event, target: HTMLElement) {
    const charId = target.dataset.charId;
    if (!charId) return;
    await this.#actor.toggleCharacterLight(charId);
  }
}
