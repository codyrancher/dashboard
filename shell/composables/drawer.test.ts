import { useDrawer } from './drawer';

const mockCommit = jest.fn();

jest.mock('vuex', () => ({ useStore: () => ({ commit: mockCommit }) }));

describe('useDrawer', () => {
  beforeEach(() => {
    mockCommit.mockClear();
  });

  describe('open', () => {
    it('commits slideInPanel/open with component and returnFocusSelector when no options given', () => {
      const { open } = useDrawer();
      const component = {};

      open(component as any, '#my-trigger');

      expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
        component,
        componentProps: {
          triggerFocusTrap:    true,
          returnFocusSelector: '#my-trigger',
        },
      });
    });

    it('merges additional options into componentProps', () => {
      const { open } = useDrawer();
      const component = {};

      open(component as any, '#trigger', {
        someOption:    'value',
        anotherOption: 42,
      });

      expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
        component,
        componentProps: {
          someOption:          'value',
          anotherOption:       42,
          triggerFocusTrap:    true,
          returnFocusSelector: '#trigger',
        },
      });
    });

    it('always sets triggerFocusTrap to true even when options attempts to override it', () => {
      const { open } = useDrawer();
      const component = {};

      open(component as any, '#trigger', { triggerFocusTrap: false });

      expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
        component,
        componentProps: {
          triggerFocusTrap:    true,
          returnFocusSelector: '#trigger',
        },
      });
    });

    it('always uses the returnFocusSelector argument even when options includes a different returnFocusSelector', () => {
      const { open } = useDrawer();
      const component = {};

      open(component as any, '#real-trigger', { returnFocusSelector: '#override-attempt' });

      expect(mockCommit).toHaveBeenCalledWith('slideInPanel/open', {
        component,
        componentProps: {
          triggerFocusTrap:    true,
          returnFocusSelector: '#real-trigger',
        },
      });
    });

    it('handles empty options object the same as no options', () => {
      const { openNoOpts } = { openNoOpts: useDrawer().open };
      const { openEmpty } = { openEmpty: useDrawer().open };
      const component = {};

      openNoOpts(component as any, '#trigger');
      openEmpty(component as any, '#trigger', {});

      expect(mockCommit).toHaveBeenNthCalledWith(1, 'slideInPanel/open', {
        component,
        componentProps: {
          triggerFocusTrap:    true,
          returnFocusSelector: '#trigger',
        },
      });
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'slideInPanel/open', {
        component,
        componentProps: {
          triggerFocusTrap:    true,
          returnFocusSelector: '#trigger',
        },
      });
    });
  });

  describe('close', () => {
    it('commits slideInPanel/close', () => {
      const { close } = useDrawer();

      close();

      expect(mockCommit).toHaveBeenCalledWith('slideInPanel/close');
    });

    it('does not pass any additional payload when closing', () => {
      const { close } = useDrawer();

      close();

      expect(mockCommit).toHaveBeenCalledWith('slideInPanel/close');
      expect(mockCommit.mock.calls[0]).toHaveLength(1);
    });
  });
});
