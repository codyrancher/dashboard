import useDragHandler from '../useDragHandler';
import type { Position, Tab } from '@shell/types/window-manager';

const CENTER: Position = 'center';
const LEFT: Position = 'left';
const RIGHT: Position = 'right';
const BOTTOM: Position = 'bottom';

const mockCommit = jest.fn();
const mockState: { wm: { lockedPositions: Position[]; userPin: Position } } = {
  wm: {
    lockedPositions: [],
    userPin:         CENTER,
  },
};
const mockStore = {
  state:  mockState,
  commit: mockCommit,
};

jest.mock('vuex', () => ({ useStore: () => mockStore }));

function makeDragEvent(jsonData?: string): DragEvent {
  return {
    dataTransfer: {
      setData: jest.fn(),
      getData: jest.fn().mockReturnValue(jsonData ?? ''),
    },
    preventDefault: jest.fn(),
  } as unknown as DragEvent;
}

function makeTab(id: string, position: Position): Tab {
  return {
    id,
    icon:            '',
    label:           '',
    position,
    layouts:         [],
    showHeader:      false,
    containerHeight: null,
    containerWidth:  null,
  };
}

describe('useDragHandler', () => {
  let composable: ReturnType<typeof useDragHandler>;

  beforeEach(() => {
    mockCommit.mockClear();
    mockState.wm.lockedPositions = [];
    mockState.wm.userPin = CENTER;
    composable = useDragHandler();
    // Reset shared module-level refs between tests
    composable.dragOverPositionsActive.value = false;
    composable.pinArea.value = CENTER;
  });

  describe('initial state', () => {
    it('dragOverPositionsActive starts as false', () => {
      expect(composable.dragOverPositionsActive.value).toBe(false);
    });

    it('dragOverTabBarActive starts as false', () => {
      expect(composable.dragOverTabBarActive.value).toBe(false);
    });

    it('pinArea starts as CENTER', () => {
      expect(composable.pinArea.value).toBe(CENTER);
    });
  });

  describe('lockedPositions', () => {
    it('returns empty array when store has no locked positions', () => {
      mockState.wm.lockedPositions = [];
      const c = useDragHandler();

      expect(c.lockedPositions.value).toStrictEqual([]);
    });

    it('returns locked positions from store state', () => {
      mockState.wm.lockedPositions = [LEFT, BOTTOM];
      const c = useDragHandler();

      expect(c.lockedPositions.value).toStrictEqual([LEFT, BOTTOM]);
    });
  });

  describe('lockedPosition', () => {
    it('returns false when no position prop provided', () => {
      const c = useDragHandler();

      expect(c.lockedPosition.value).toBe(false);
    });

    it('returns false when position prop is not in lockedPositions', () => {
      mockState.wm.lockedPositions = [LEFT];
      const c = useDragHandler({ position: RIGHT });

      expect(c.lockedPosition.value).toBe(false);
    });

    it('returns true when position prop is in lockedPositions', () => {
      mockState.wm.lockedPositions = [LEFT, BOTTOM];
      const c = useDragHandler({ position: BOTTOM });

      expect(c.lockedPosition.value).toBe(true);
    });
  });

  describe('pin computed', () => {
    it('getter returns current store wm.userPin', () => {
      mockState.wm.userPin = RIGHT;
      const c = useDragHandler();

      expect(c.pin.value).toBe(RIGHT);
    });

    it('setter commits wm/setUserPin when new pin is not CENTER', () => {
      composable.pin.value = LEFT;
      expect(mockCommit).toHaveBeenCalledWith('wm/setUserPin', LEFT);
    });

    it('setter does not commit when new pin is CENTER', () => {
      composable.pin.value = CENTER;
      expect(mockCommit).not.toHaveBeenCalled();
    });
  });

  describe('onDragPositionStart', () => {
    it('writes tab position and id to dataTransfer as JSON', () => {
      const event = makeDragEvent();
      const tab = makeTab('tab-1', LEFT);

      composable.onDragPositionStart({ event, tab });

      expect(event.dataTransfer!.setData).toHaveBeenCalledWith(
        'application/json',
        JSON.stringify({ position: LEFT, tabId: 'tab-1' })
      );
    });

    it('sets dragOverPositionsActive to true', () => {
      composable.onDragPositionStart({ event: makeDragEvent(), tab: makeTab('t', LEFT) });
      expect(composable.dragOverPositionsActive.value).toBe(true);
    });

    it('sets dragOverTabBarActive to true', () => {
      composable.onDragPositionStart({ event: makeDragEvent(), tab: makeTab('t', LEFT) });
      expect(composable.dragOverTabBarActive.value).toBe(true);
    });
  });

  describe('onDragPositionOver', () => {
    it('updates pinArea to the hovered position', () => {
      composable.onDragPositionOver(makeDragEvent(), RIGHT);
      expect(composable.pinArea.value).toBe(RIGHT);
    });

    it('calls event.preventDefault for non-CENTER positions', () => {
      const event = makeDragEvent();

      composable.onDragPositionOver(event, BOTTOM);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not call event.preventDefault for CENTER position', () => {
      const event = makeDragEvent();

      composable.onDragPositionOver(event, CENTER);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onDragPositionEnd', () => {
    it('commits wm/setUserPin with pinArea when pinArea is not CENTER', () => {
      composable.pinArea.value = RIGHT;
      composable.onDragPositionEnd({ event: makeDragEvent(), tab: makeTab('t', LEFT) });
      expect(mockCommit).toHaveBeenCalledWith('wm/setUserPin', RIGHT);
    });

    it('commits wm/switchTab with tabId and pinArea when pinArea is not CENTER', () => {
      composable.pinArea.value = BOTTOM;
      composable.onDragPositionEnd({ event: makeDragEvent(), tab: makeTab('tab-2', LEFT) });
      expect(mockCommit).toHaveBeenCalledWith('wm/switchTab', { tabId: 'tab-2', targetPosition: BOTTOM });
    });

    it('does not commit wm/switchTab when pinArea is CENTER', () => {
      composable.pinArea.value = CENTER;
      composable.onDragPositionEnd({ event: makeDragEvent(), tab: makeTab('t', LEFT) });
      expect(mockCommit).not.toHaveBeenCalledWith('wm/switchTab', expect.anything());
    });

    it('resets dragOverPositionsActive to false', () => {
      composable.dragOverPositionsActive.value = true;
      composable.onDragPositionEnd({ event: makeDragEvent(), tab: makeTab('t', LEFT) });
      expect(composable.dragOverPositionsActive.value).toBe(false);
    });

    it('resets pinArea to CENTER', () => {
      composable.pinArea.value = LEFT;
      composable.onDragPositionEnd({ event: makeDragEvent(), tab: makeTab('t', LEFT) });
      expect(composable.pinArea.value).toBe(CENTER);
    });
  });

  describe('onTabBarDragOver', () => {
    it('sets dragOverTabBarActive to true', () => {
      const event = makeDragEvent();

      composable.onTabBarDragOver(event);
      expect(composable.dragOverTabBarActive.value).toBe(true);
    });

    it('calls event.preventDefault', () => {
      const event = makeDragEvent();

      composable.onTabBarDragOver(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onTabBarDragLeave', () => {
    it('sets dragOverTabBarActive to false', () => {
      composable.dragOverTabBarActive.value = true;
      composable.onTabBarDragLeave();
      expect(composable.dragOverTabBarActive.value).toBe(false);
    });
  });

  describe('onTabBarDrop', () => {
    it('resets dragOverTabBarActive to false on drop', () => {
      const c = useDragHandler({ position: RIGHT });

      c.dragOverTabBarActive.value = true;
      c.onTabBarDrop(makeDragEvent(JSON.stringify({ tabId: 'tab-x' })));
      expect(c.dragOverTabBarActive.value).toBe(false);
    });

    it('commits wm/switchTab with tabId and the component position', () => {
      const c = useDragHandler({ position: RIGHT });
      const data = JSON.stringify({ tabId: 'tab-7', position: LEFT });

      c.onTabBarDrop(makeDragEvent(data));
      expect(mockCommit).toHaveBeenCalledWith('wm/switchTab', {
        tabId:          'tab-7',
        targetPosition: RIGHT,
      });
    });

    it('warns when dataTransfer carries no data', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      composable.onTabBarDrop(makeDragEvent(''));
      expect(warnSpy).toHaveBeenCalledWith('No data found in drag event');
      warnSpy.mockRestore();
    });

    it('does not commit wm/switchTab when dataTransfer carries no data', () => {
      composable.onTabBarDrop(makeDragEvent(''));
      expect(mockCommit).not.toHaveBeenCalledWith('wm/switchTab', expect.anything());
    });
  });

  describe('shared module-level state', () => {
    it('dragOverPositionsActive is the same ref across composable instances', () => {
      const c1 = useDragHandler();
      const c2 = useDragHandler();

      c1.dragOverPositionsActive.value = true;
      expect(c2.dragOverPositionsActive.value).toBe(true);
    });

    it('pinArea is the same ref across composable instances', () => {
      const c1 = useDragHandler();
      const c2 = useDragHandler();

      c1.pinArea.value = BOTTOM;
      expect(c2.pinArea.value).toBe(BOTTOM);
    });
  });
});
