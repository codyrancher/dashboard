import slideInPanelStore, { SlideInPanelState } from '../slideInPanel';

const { state: makeState, mutations } = slideInPanelStore;

const DEFAULT_STATE: SlideInPanelState = {
  isOpen:         false,
  isClosing:      false,
  component:      null,
  componentProps: {},
};

describe('store: slideInPanel', () => {
  let state: SlideInPanelState;

  beforeEach(() => {
    state = makeState();
  });

  describe('state', () => {
    it('returns the correct initial state', () => {
      expect(state).toStrictEqual(DEFAULT_STATE);
    });
  });

  describe('mutations: open', () => {
    const fakeComponent = { name: 'FakePanel' } as any;

    it('sets isOpen to true', () => {
      mutations.open(state, { component: fakeComponent });

      expect(state.isOpen).toBe(true);
    });

    it('stores the component', () => {
      mutations.open(state, { component: fakeComponent });

      expect(state.component).toBe(fakeComponent);
    });

    it('defaults componentProps to {} when not provided', () => {
      mutations.open(state, { component: fakeComponent });

      expect(state.componentProps).toStrictEqual({});
    });

    it('uses provided componentProps', () => {
      const props = { foo: 'bar', count: 3 };

      mutations.open(state, { component: fakeComponent, componentProps: props });

      expect(state.componentProps).toStrictEqual({ foo: 'bar', count: 3 });
    });
  });

  describe('mutations: close', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sets isOpen to false immediately', () => {
      state.isOpen = true;
      mutations.close(state);

      expect(state.isOpen).toBe(false);
    });

    it('sets isClosing to true immediately', () => {
      mutations.close(state);

      expect(state.isClosing).toBe(true);
    });

    it('does not clear component immediately', () => {
      const fakeComponent = { name: 'FakePanel' } as any;

      mutations.open(state, { component: fakeComponent });
      mutations.close(state);

      expect(state.component).not.toBeNull();
    });

    it('clears component to null after 500ms', () => {
      const fakeComponent = { name: 'FakePanel' } as any;

      mutations.open(state, { component: fakeComponent });
      mutations.close(state);
      jest.advanceTimersByTime(500);

      expect(state.component).toBeNull();
    });

    it('clears componentProps to {} after 500ms', () => {
      mutations.open(state, { component: { name: 'C' } as any, componentProps: { x: 1 } });
      mutations.close(state);
      jest.advanceTimersByTime(500);

      expect(state.componentProps).toStrictEqual({});
    });

    it('sets isClosing to false after 500ms', () => {
      mutations.close(state);
      jest.advanceTimersByTime(500);

      expect(state.isClosing).toBe(false);
    });
  });

  describe('namespaced', () => {
    it('is namespaced', () => {
      expect(slideInPanelStore.namespaced).toBe(true);
    });
  });
});
