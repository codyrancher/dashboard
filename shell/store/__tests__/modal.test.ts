import modalStore, { ModalState } from '../modal';

const { state: makeState, mutations } = modalStore;

const DEFAULT_STATE: ModalState = {
  isOpen:              false,
  component:           null,
  componentProps:      {},
  resources:           [],
  closeOnClickOutside: false,
  modalWidth:          '600px',
  modalSticky:         false,
};

describe('store: modal', () => {
  let state: ModalState;

  beforeEach(() => {
    state = makeState();
  });

  describe('state', () => {
    it('returns the correct initial state', () => {
      expect(state).toStrictEqual(DEFAULT_STATE);
    });
  });

  describe('mutations: openModal', () => {
    const fakeComponent = { name: 'FakeModal' } as any;

    it('sets isOpen to true', () => {
      mutations.openModal(state, { component: fakeComponent });

      expect(state.isOpen).toBe(true);
    });

    it('stores the component (wrapped with markRaw)', () => {
      mutations.openModal(state, { component: fakeComponent });

      expect(state.component).toBe(fakeComponent);
    });

    it('defaults componentProps to {} when not provided', () => {
      mutations.openModal(state, { component: fakeComponent });

      expect(state.componentProps).toStrictEqual({});
    });

    it('uses provided componentProps', () => {
      const props = { foo: 'bar' };

      mutations.openModal(state, { component: fakeComponent, componentProps: props });

      expect(state.componentProps).toStrictEqual({ foo: 'bar' });
    });

    describe('resources normalisation', () => {
      it.each([
        {
          desc:      'array resources — kept as-is',
          resources: ['a', 'b'],
          expected:  ['a', 'b'],
        },
        {
          desc:      'single non-array resource — wrapped in array',
          resources: { id: 1 },
          expected:  [{ id: 1 }],
        },
        {
          desc:      'null resources — defaults to empty array',
          resources: null,
          expected:  [],
        },
        {
          desc:      'undefined resources — defaults to empty array',
          resources: undefined,
          expected:  [],
        },
        {
          desc:      'empty array resources — kept as empty array',
          resources: [],
          expected:  [],
        },
      ])('$desc', ({ resources, expected }) => {
        mutations.openModal(state, { component: fakeComponent, resources: resources as any });

        expect(state.resources).toStrictEqual(expected);
      });
    });

    describe('closeOnClickOutside', () => {
      it('defaults to false when not provided', () => {
        mutations.openModal(state, { component: fakeComponent });

        expect(state.closeOnClickOutside).toBe(false);
      });

      it('uses provided value of true', () => {
        mutations.openModal(state, { component: fakeComponent, closeOnClickOutside: true });

        expect(state.closeOnClickOutside).toBe(true);
      });

      it('keeps false when explicitly set to false', () => {
        mutations.openModal(state, { component: fakeComponent, closeOnClickOutside: false });

        expect(state.closeOnClickOutside).toBe(false);
      });
    });

    describe('modalWidth', () => {
      it('defaults to 600px when not provided', () => {
        mutations.openModal(state, { component: fakeComponent });

        expect(state.modalWidth).toBe('600px');
      });

      it('uses provided modalWidth', () => {
        mutations.openModal(state, { component: fakeComponent, modalWidth: '900px' });

        expect(state.modalWidth).toBe('900px');
      });
    });

    describe('modalSticky', () => {
      it('defaults to false when not provided', () => {
        mutations.openModal(state, { component: fakeComponent });

        expect(state.modalSticky).toBe(false);
      });

      it('uses provided value of true', () => {
        mutations.openModal(state, { component: fakeComponent, modalSticky: true });

        expect(state.modalSticky).toBe(true);
      });
    });
  });

  describe('mutations: closeModal', () => {
    it('resets state to initial values', () => {
      const openedComponent = { name: 'OpenedModal' } as any;

      mutations.openModal(state, {
        component:           openedComponent,
        componentProps:      { x: 1 },
        resources:           ['r1'],
        closeOnClickOutside: true,
        modalWidth:          '800px',
        modalSticky:         true,
      });

      mutations.closeModal(state);

      expect(state).toStrictEqual(DEFAULT_STATE);
    });

    it('sets isOpen to false', () => {
      mutations.openModal(state, { component: { name: 'C' } as any });
      mutations.closeModal(state);

      expect(state.isOpen).toBe(false);
    });

    it('clears component to null', () => {
      mutations.openModal(state, { component: { name: 'C' } as any });
      mutations.closeModal(state);

      expect(state.component).toBeNull();
    });

    it('resets resources to empty array', () => {
      mutations.openModal(state, { component: { name: 'C' } as any, resources: ['r'] });
      mutations.closeModal(state);

      expect(state.resources).toStrictEqual([]);
    });

    it('resets modalWidth to 600px', () => {
      mutations.openModal(state, { component: { name: 'C' } as any, modalWidth: '1000px' });
      mutations.closeModal(state);

      expect(state.modalWidth).toBe('600px');
    });
  });

  describe('namespaced', () => {
    it('is namespaced', () => {
      expect(modalStore.namespaced).toBe(true);
    });
  });
});
