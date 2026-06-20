import { defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { useClickOutside } from '@shell/composables/useClickOutside';

describe('useClickOutside', () => {
  let capturedHandlers: Record<string, (e: any) => void>;
  let addEventSpy: jest.SpyInstance;
  let removeEventSpy: jest.SpyInstance;

  beforeEach(() => {
    capturedHandlers = {};
    addEventSpy = jest.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
      capturedHandlers[event] = handler;
    });
    removeEventSpy = jest.spyOn(window, 'removeEventListener').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mountWithHook(
    componentEl: HTMLElement,
    callback: any,
    options: { ignore?: string[] } = {}
  ): VueWrapper {
    const componentRef = ref<HTMLElement | null>(componentEl);
    const TestComponent = defineComponent({
      setup() {
        useClickOutside(componentRef, callback, options);

        return {};
      },
      template: '<div></div>',
    });

    return mount(TestComponent);
  }

  function makeEvent(overrides: Partial<{ target: Element; composedPath: () => Element[]; detail: number }> = {}): any {
    return {
      target:       document.createElement('div'),
      composedPath: () => [],
      detail:       1,
      ...overrides,
    };
  }

  describe('lifecycle', () => {
    it.each([
      { desc: 'click', event: 'click' },
      { desc: 'pointerdown', event: 'pointerdown' },
    ])('registers the $desc event listener on mount', ({ event }) => {
      mountWithHook(document.createElement('div'), jest.fn());

      expect(addEventSpy).toHaveBeenCalledWith(event, expect.any(Function));
    });

    it.each([
      { desc: 'click', event: 'click' },
      { desc: 'pointerdown', event: 'pointerdown' },
    ])('removes the $desc event listener on unmount', ({ event }) => {
      const wrapper = mountWithHook(document.createElement('div'), jest.fn());

      wrapper.unmount();

      expect(removeEventSpy).toHaveBeenCalledWith(event, expect.any(Function));
    });
  });

  describe('click listener', () => {
    it('calls callback when click target is outside the component element', () => {
      const target = document.createElement('div');
      const outsideEl = document.createElement('span');
      const callback = jest.fn();

      mountWithHook(target, callback);

      capturedHandlers['click'](makeEvent({ target: outsideEl, composedPath: () => [outsideEl] }));

      expect(callback).toHaveBeenCalledWith();
    });

    it('does not call callback when click target is the component element', () => {
      const target = document.createElement('div');
      const callback = jest.fn();

      mountWithHook(target, callback);

      capturedHandlers['click'](makeEvent({ target, composedPath: () => [target] }));

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback when the composedPath of the click includes the component element', () => {
      const target = document.createElement('div');
      const child = document.createElement('span');
      const callback = jest.fn();

      mountWithHook(target, callback);

      capturedHandlers['click'](makeEvent({ target: child, composedPath: () => [child, target] }));

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback when component.value is null', () => {
      const callback = jest.fn();
      const componentRef = ref<HTMLElement | null>(null);
      const TestComponent = defineComponent({
        setup() {
          useClickOutside(componentRef, callback);

          return {};
        },
        template: '<div></div>',
      });

      mount(TestComponent);

      capturedHandlers['click'](makeEvent());

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not throw when callback is not a function', () => {
      const target = document.createElement('div');
      const outsideEl = document.createElement('span');

      mountWithHook(target, 'not-a-function');

      expect(() => {
        capturedHandlers['click'](makeEvent({ target: outsideEl, composedPath: () => [outsideEl] }));
      }).not.toThrow();
    });
  });

  describe('ignore option', () => {
    it('suppresses callback when a prior pointerdown targeted a css-selector-matched ignore element', () => {
      const target = document.createElement('div');
      const ignoredEl = document.createElement('button');

      ignoredEl.className = 'dropdown-menu';
      document.body.appendChild(ignoredEl);

      const callback = jest.fn();

      mountWithHook(target, callback, { ignore: ['.dropdown-menu'] });

      capturedHandlers['pointerdown'](makeEvent({
        target:       ignoredEl,
        composedPath: () => [ignoredEl],
      }));

      capturedHandlers['click'](makeEvent({
        target:       document.createElement('span'),
        composedPath: () => [document.createElement('span')],
      }));

      expect(callback).not.toHaveBeenCalled();

      document.body.removeChild(ignoredEl);
    });

    it('calls callback when pointerdown targets a non-ignored element outside the component', () => {
      const target = document.createElement('div');
      const outsideEl = document.createElement('span');
      const callback = jest.fn();

      mountWithHook(target, callback, { ignore: ['.dropdown-menu'] });

      capturedHandlers['pointerdown'](makeEvent({
        target:       outsideEl,
        composedPath: () => [outsideEl],
      }));

      capturedHandlers['click'](makeEvent({
        target:       outsideEl,
        composedPath: () => [outsideEl],
      }));

      expect(callback).toHaveBeenCalledWith();
    });
  });

  describe('pointerdown inside component', () => {
    it('does not call callback when pointerdown was inside the component and click was outside', () => {
      const target = document.createElement('div');
      const outsideEl = document.createElement('span');
      const callback = jest.fn();

      mountWithHook(target, callback);

      capturedHandlers['pointerdown'](makeEvent({
        target,
        composedPath: () => [target],
      }));

      capturedHandlers['click'](makeEvent({
        target:       outsideEl,
        composedPath: () => [outsideEl],
      }));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('keyboard click (detail=0)', () => {
    it('does not call callback when detail is 0 and click event target matches an ignore selector', () => {
      const target = document.createElement('div');
      const ignoredEl = document.createElement('button');

      ignoredEl.className = 'skip-kb';
      document.body.appendChild(ignoredEl);

      const callback = jest.fn();

      mountWithHook(target, callback, { ignore: ['.skip-kb'] });

      capturedHandlers['click'](makeEvent({
        target:       ignoredEl,
        composedPath: () => [ignoredEl],
        detail:       0,
      }));

      expect(callback).not.toHaveBeenCalled();

      document.body.removeChild(ignoredEl);
    });
  });
});
