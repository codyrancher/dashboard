import { state, getters, mutations, actions } from '@shell/store/wm';
import { BOTTOM, LEFT, RIGHT } from '@shell/utils/position';

const STORAGE_KEY = {
  [BOTTOM]: 'wm-height',
  [LEFT]:   'wm-vl-width',
  [RIGHT]:  'wm-vr-width',
  pin:      'wm-pin',
};

function makeLocalStorageMock() {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: () => {
      store = {};
      jest.clearAllMocks();
    },
  };
}

function makeTab(overrides: Record<string, any> = {}): any {
  return {
    id:       'tab-1',
    label:    'Tab 1',
    icon:     'icon',
    position: BOTTOM,
    ...overrides,
  };
}

describe('store: wm', () => {
  let localStorageMock: ReturnType<typeof makeLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = makeLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value:        localStorageMock,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('state factory', () => {
    it('reads panelHeight from localStorage on initialisation', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEY[BOTTOM]) return '300';

        return null;
      });

      const s = state();

      expect(s.panelHeight[BOTTOM]).toBe('300');
    });

    it('reads panelWidth from localStorage on initialisation', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === STORAGE_KEY[LEFT]) return '250';
        if (key === STORAGE_KEY[RIGHT]) return '200';

        return null;
      });

      const s = state();

      expect(s.panelWidth[LEFT]).toBe('250');
      expect(s.panelWidth[RIGHT]).toBe('200');
    });

    it('sets tabs, active, open and lockedPositions to empty collections', () => {
      const s = state();

      expect(s.tabs).toStrictEqual([]);
      expect(s.active).toStrictEqual({});
      expect(s.open).toStrictEqual({});
      expect(s.lockedPositions).toStrictEqual([]);
    });

    it('sets userPin to null', () => {
      const s = state();

      expect(s.userPin).toBeNull();
    });
  });

  describe('getters', () => {
    let s: ReturnType<typeof state>;

    beforeEach(() => {
      s = state();
    });

    it('byId returns the tab matching the given id', () => {
      const tab = makeTab({ id: 'my-tab' });

      s.tabs.push(tab);
      const result = getters.byId(s)('my-tab');

      expect(result).toStrictEqual(tab);
    });

    it('byId returns undefined when no tab matches', () => {
      const result = getters.byId(s)('missing');

      expect(result).toBeUndefined();
    });

    it('tabs returns all tabs', () => {
      const tab1 = makeTab({ id: 'a' });
      const tab2 = makeTab({ id: 'b' });

      s.tabs.push(tab1, tab2);

      expect(getters.tabs(s)).toStrictEqual([tab1, tab2]);
    });

    it('isOpen returns true when the position is open', () => {
      s.open[BOTTOM] = true;

      expect(getters.isOpen(s)(BOTTOM)).toBe(true);
    });

    it('isOpen returns false when the position is not open', () => {
      s.open[BOTTOM] = false;

      expect(getters.isOpen(s)(BOTTOM)).toBe(false);
    });

    it('panelWidth returns panelWidth from state', () => {
      s.panelWidth[LEFT] = 300;

      expect(getters.panelWidth(s)).toStrictEqual(s.panelWidth);
    });

    it('panelHeight returns panelHeight from state', () => {
      s.panelHeight[BOTTOM] = 200;

      expect(getters.panelHeight(s)).toStrictEqual(s.panelHeight);
    });

    it('userPin returns userPin from state', () => {
      s.userPin = LEFT;

      expect(getters.userPin(s)).toBe(LEFT);
    });

    it('lockedPositions returns lockedPositions from state', () => {
      s.lockedPositions = [BOTTOM];

      expect(getters.lockedPositions(s)).toStrictEqual([BOTTOM]);
    });
  });

  describe('mutations', () => {
    let s: ReturnType<typeof state>;

    beforeEach(() => {
      s = state();
    });

    describe('addTab', () => {
      it('adds a new tab to the tabs array', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        mutations.addTab(s, tab);

        expect(s.tabs).toHaveLength(1);
        expect(s.tabs[0].id).toBe('tab-1');
      });

      it('does not add a duplicate tab when the same id exists', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push({ ...tab });
        mutations.addTab(s, tab);

        expect(s.tabs).toHaveLength(1);
      });

      it('sets active[position] to the tab id', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        mutations.addTab(s, tab);

        expect(s.active[BOTTOM]).toBe('tab-1');
      });

      it('sets open[position] to true', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        mutations.addTab(s, tab);

        expect(s.open[BOTTOM]).toBe(true);
      });

      it('sets userPin to the tab position', () => {
        const tab = makeTab({ id: 'tab-1', position: LEFT });

        mutations.addTab(s, tab);

        expect(s.userPin).toBe(LEFT);
      });

      it('saves the pin position to localStorage', () => {
        const tab = makeTab({ id: 'tab-1', position: LEFT });

        mutations.addTab(s, tab);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY.pin, LEFT);
      });

      it('falls back to BOTTOM when position is undefined and localStorage has no pin', () => {
        localStorageMock.getItem.mockReturnValue(null);
        const tab = makeTab({ id: 'tab-1', position: undefined });

        mutations.addTab(s, tab);

        expect(tab.position).toBe(BOTTOM);
      });

      it('uses stored pin position when position is undefined', () => {
        localStorageMock.getItem.mockImplementation((key: string) => {
          if (key === STORAGE_KEY.pin) return LEFT;

          return null;
        });
        const tab = makeTab({ id: 'tab-1', position: undefined });

        mutations.addTab(s, tab);

        expect(tab.position).toBe(LEFT);
      });

      it('forces BOTTOM position when BOTTOM is in lockedPositions', () => {
        s.lockedPositions = [BOTTOM];
        const tab = makeTab({ id: 'tab-1', position: LEFT });

        mutations.addTab(s, tab);

        expect(tab.position).toBe(BOTTOM);
      });

      it('sets default layouts to ["default"] when layouts is undefined', () => {
        const tab = makeTab({
          id: 'tab-1', position: BOTTOM, layouts: undefined
        });

        mutations.addTab(s, tab);

        expect(tab.layouts).toStrictEqual(['default']);
      });

      it('preserves existing layouts when already set', () => {
        const tab = makeTab({
          id:       'tab-1',
          position: BOTTOM,
          layouts:  ['home'],
        });

        mutations.addTab(s, tab);

        expect(tab.layouts).toStrictEqual(['home']);
      });

      it('sets showHeader to true when showHeader is undefined', () => {
        const tab = makeTab({
          id: 'tab-1', position: BOTTOM, showHeader: undefined
        });

        mutations.addTab(s, tab);

        expect(tab.showHeader).toBe(true);
      });

      it('preserves showHeader = false when explicitly set', () => {
        const tab = makeTab({
          id: 'tab-1', position: BOTTOM, showHeader: false
        });

        mutations.addTab(s, tab);

        expect(tab.showHeader).toBe(false);
      });

      it('updates active and open even for a duplicate tab', () => {
        const existing = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push({ ...existing });
        s.active[BOTTOM] = 'other';
        s.open[BOTTOM] = false;

        mutations.addTab(s, existing);

        expect(s.active[BOTTOM]).toBe('tab-1');
        expect(s.open[BOTTOM]).toBe(true);
      });
    });

    describe('switchTab', () => {
      it('moves the tab to the target position', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: LEFT });

        expect(s.tabs[0].position).toBe(LEFT);
      });

      it('sets active[targetPosition] to the tab id', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: LEFT });

        expect(s.active[LEFT]).toBe('tab-1');
      });

      it('opens the target position', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: RIGHT });

        expect(s.open[RIGHT]).toBe(true);
      });

      it('clears old position active when no tabs remain there', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: LEFT });

        expect(s.active[BOTTOM]).toBe('');
        expect(s.open[BOTTOM]).toBe(false);
      });

      it('sets the remaining old-position tab as active when others remain', () => {
        const tab1 = makeTab({ id: 'tab-1', position: BOTTOM });
        const tab2 = makeTab({ id: 'tab-2', position: BOTTOM });

        s.tabs.push(tab1, tab2);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: LEFT });

        expect(s.active[BOTTOM]).toBe('tab-2');
      });

      it('saves the target position as the pin in localStorage', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: RIGHT });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY.pin, RIGHT);
      });

      it('sets userPin to the target position', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.switchTab(s, { tabId: 'tab-1', targetPosition: RIGHT });

        expect(s.userPin).toBe(RIGHT);
      });
    });

    describe('closeTab', () => {
      it('removes the tab from the tabs array', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.closeTab(s, { id: 'tab-1' });

        expect(s.tabs).toHaveLength(0);
      });

      it('returns early without modifying state for a non-existent id', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.closeTab(s, { id: 'does-not-exist' });

        expect(s.tabs).toHaveLength(1);
      });

      it('sets open[position] to false when no tabs remain at that position', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        s.open[BOTTOM] = true;
        mutations.closeTab(s, { id: 'tab-1' });

        expect(s.open[BOTTOM]).toBe(false);
      });

      it('activates the next remaining tab at the same position', () => {
        const tab1 = makeTab({ id: 'tab-1', position: BOTTOM });
        const tab2 = makeTab({ id: 'tab-2', position: BOTTOM });

        s.tabs.push(tab1, tab2);
        s.active[BOTTOM] = 'tab-1';
        mutations.closeTab(s, { id: 'tab-1' });

        expect(s.active[BOTTOM]).toBe('tab-2');
      });

      it('keeps position open when other tabs remain', () => {
        const tab1 = makeTab({ id: 'tab-1', position: BOTTOM });
        const tab2 = makeTab({ id: 'tab-2', position: BOTTOM });

        s.tabs.push(tab1, tab2);
        s.open[BOTTOM] = true;
        mutations.closeTab(s, { id: 'tab-1' });

        expect(s.open[BOTTOM]).toBe(true);
      });
    });

    describe('removeTab', () => {
      it('removes the specified tab object from the tabs array', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        s.tabs.push(tab);
        mutations.removeTab(s, tab);

        expect(s.tabs).toHaveLength(0);
      });

      it('does nothing when the tab is not in the array', () => {
        const tab1 = makeTab({ id: 'tab-1', position: BOTTOM });
        const tab2 = makeTab({ id: 'tab-2', position: BOTTOM });

        s.tabs.push(tab1);
        mutations.removeTab(s, tab2);

        expect(s.tabs).toHaveLength(1);
      });
    });

    describe('setOpen', () => {
      it('updates open state for the given position', () => {
        mutations.setOpen(s, { position: BOTTOM, open: true });

        expect(s.open[BOTTOM]).toBe(true);
      });

      it('can close a position', () => {
        s.open[BOTTOM] = true;
        mutations.setOpen(s, { position: BOTTOM, open: false });

        expect(s.open[BOTTOM]).toBe(false);
      });
    });

    describe('setActive', () => {
      it('sets the active tab id for the given position', () => {
        mutations.setActive(s, { position: BOTTOM, id: 'tab-x' });

        expect(s.active[BOTTOM]).toBe('tab-x');
      });
    });

    describe('setPanelHeight', () => {
      it('updates panelHeight for the given position', () => {
        mutations.setPanelHeight(s, { position: BOTTOM, height: 350 });

        expect(s.panelHeight[BOTTOM]).toBe(350);
      });

      it('saves height to localStorage', () => {
        mutations.setPanelHeight(s, { position: BOTTOM, height: 350 });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY[BOTTOM], '350');
      });

      it('updates containerHeight for all tabs at the given position', () => {
        const tab1 = makeTab({
          id: 'tab-1', position: BOTTOM, containerHeight: null
        });
        const tab2 = makeTab({
          id: 'tab-2', position: LEFT, containerHeight: null
        });

        s.tabs.push(tab1, tab2);
        mutations.setPanelHeight(s, { position: BOTTOM, height: 400 });

        expect(tab1.containerHeight).toBe(400);
        expect(tab2.containerHeight).toBeNull();
      });
    });

    describe('setPanelWidth', () => {
      it('updates panelWidth for the given position', () => {
        mutations.setPanelWidth(s, { position: LEFT, width: 250 });

        expect(s.panelWidth[LEFT]).toBe(250);
      });

      it('saves width to localStorage', () => {
        mutations.setPanelWidth(s, { position: LEFT, width: 250 });

        expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY[LEFT], '250');
      });

      it('updates containerWidth for all tabs at the given position', () => {
        const tab1 = makeTab({
          id: 'tab-1', position: LEFT, containerWidth: null
        });
        const tab2 = makeTab({
          id: 'tab-2', position: RIGHT, containerWidth: null
        });

        s.tabs.push(tab1, tab2);
        mutations.setPanelWidth(s, { position: LEFT, width: 280 });

        expect(tab1.containerWidth).toBe(280);
        expect(tab2.containerWidth).toBeNull();
      });
    });

    describe('setUserPin', () => {
      it('updates userPin in state', () => {
        mutations.setUserPin(s, RIGHT);

        expect(s.userPin).toBe(RIGHT);
      });

      it('saves the pin to localStorage', () => {
        mutations.setUserPin(s, RIGHT);

        expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY.pin, RIGHT);
      });
    });

    describe('setLockedPositions', () => {
      it('replaces lockedPositions with the given array', () => {
        mutations.setLockedPositions(s, [BOTTOM, LEFT]);

        expect(s.lockedPositions).toStrictEqual([BOTTOM, LEFT]);
      });

      it('can clear all locked positions', () => {
        s.lockedPositions = [BOTTOM];
        mutations.setLockedPositions(s, []);

        expect(s.lockedPositions).toStrictEqual([]);
      });
    });
  });

  describe('actions', () => {
    let s: ReturnType<typeof state>;
    let commit: jest.Mock;

    beforeEach(() => {
      s = state();
      commit = jest.fn();
    });

    describe('close', () => {
      it('throws when id is not provided', () => {
        expect(() => actions.close({
          state: s, getters: {}, commit
        }, '')).toThrow('[wm] id is not provided');
      });

      it('commits closeTab with the given id', () => {
        actions.close({
          state: s, getters: {}, commit
        }, 'tab-1');

        expect(commit).toHaveBeenCalledWith('closeTab', { id: 'tab-1' });
      });
    });

    describe('open', () => {
      it('throws when tab has no id', () => {
        const tab = makeTab({ id: '' });

        expect(() => actions.open({ commit }, tab)).toThrow('[wm] id is not provided');
      });

      it('commits addTab with the provided tab', () => {
        const tab = makeTab({ id: 'tab-1', position: BOTTOM });

        actions.open({ commit }, tab);

        expect(commit).toHaveBeenCalledWith('addTab', tab);
      });
    });
  });
});
