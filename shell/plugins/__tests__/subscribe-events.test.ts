import { SteveWatchEventListenerManager } from '@shell/plugins/subscribe-events';
import { STEVE_WATCH_EVENT_TYPES } from '@shell/types/store/subscribe.types';

describe('steveWatchEventListenerManager', () => {
  let manager: SteveWatchEventListenerManager;

  const makeParams = (overrides = {}) => ({
    type: 'test-resource',
    ...overrides,
  });

  beforeEach(() => {
    manager = new SteveWatchEventListenerManager();
  });

  describe('isSupportedEventType', () => {
    it.each([
      {
        desc:     'returns true for CHANGES (the only supported type)',
        type:     STEVE_WATCH_EVENT_TYPES.CHANGES,
        expected: true,
      },
      {
        desc:     'returns false for START event type',
        type:     STEVE_WATCH_EVENT_TYPES.START,
        expected: false,
      },
      {
        desc:     'returns false for CREATE event type',
        type:     STEVE_WATCH_EVENT_TYPES.CREATE,
        expected: false,
      },
      {
        desc:     'returns false for REMOVE event type',
        type:     STEVE_WATCH_EVENT_TYPES.REMOVE,
        expected: false,
      },
    ])('$desc', ({ type, expected }) => {
      expect(manager.isSupportedEventType(type)).toStrictEqual(expected);
    });
  });

  describe('getWatch', () => {
    it('returns undefined when no watch has been registered', () => {
      const result = manager.getWatch({ params: makeParams() });

      expect(result).toStrictEqual(undefined);
    });

    it('returns the watch after a standard watch has been set', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });

      expect(manager.getWatch({ params })).toStrictEqual({ hasStandardWatch: true, listeners: [] });
    });

    it('returns different watches for different params', () => {
      const paramsA = makeParams({ type: 'pods' });
      const paramsB = makeParams({ type: 'services' });

      manager.setStandardWatch({ standardWatch: true, args: { params: paramsA } });

      expect(manager.getWatch({ params: paramsA })).toBeDefined();
      expect(manager.getWatch({ params: paramsB })).toStrictEqual(undefined);
    });
  });

  describe('hasStandardWatch', () => {
    it('returns undefined when no watch exists', () => {
      expect(manager.hasStandardWatch({ params: makeParams() })).toStrictEqual(undefined);
    });

    it('returns true after setStandardWatch is called with true', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });

      expect(manager.hasStandardWatch({ params })).toStrictEqual(true);
    });

    it('returns undefined after the watch entry is deleted when clearing the standard watch', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });
      manager.setStandardWatch({ standardWatch: false, args: { params } });

      expect(manager.hasStandardWatch({ params })).toStrictEqual(undefined);
    });
  });

  describe('setStandardWatch', () => {
    it('does not create a watch entry when setting standardWatch to false on a non-existent watch', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: false, args: { params } });

      expect(manager.getWatch({ params })).toStrictEqual(undefined);
    });

    it('creates a watch entry when setting standardWatch to true', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });

      expect(manager.getWatch({ params })).toBeDefined();
    });

    it('deletes the watch when standardWatch is set to false and there are no listeners', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });
      manager.setStandardWatch({ standardWatch: false, args: { params } });

      expect(manager.getWatch({ params })).toStrictEqual(undefined);
    });

    it('keeps the watch entry when standardWatch is false but listeners still exist', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });
      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });
      manager.setStandardWatch({ standardWatch: false, args: { params } });

      expect(manager.getWatch({ params })).toBeDefined();
    });

    it('sets hasStandardWatch to false on an existing watch without destroying it when listeners are present', () => {
      const params = makeParams();

      manager.setStandardWatch({ standardWatch: true, args: { params } });
      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });
      manager.setStandardWatch({ standardWatch: false, args: { params } });

      expect(manager.getWatch({ params })?.hasStandardWatch).toStrictEqual(false);
    });
  });

  describe('hasEventListeners', () => {
    it('returns false when no watch exists', () => {
      expect(manager.hasEventListeners({ params: makeParams() })).toStrictEqual(false);
    });

    it('returns false when a listener entry exists but has no callbacks', () => {
      const params = makeParams();

      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      expect(manager.hasEventListeners({ params })).toStrictEqual(false);
    });

    it('returns true when at least one callback has been registered', () => {
      const params = makeParams();

      manager.addEventListenerCallback({
        callback: jest.fn(),
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });

      expect(manager.hasEventListeners({ params })).toStrictEqual(true);
    });
  });

  describe('getEventListener', () => {
    it('returns null when no watch exists', () => {
      expect(
        manager.getEventListener({ args: { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params: makeParams() } })
      ).toStrictEqual(null);
    });

    it('returns null when the watch has no listener for the given event', () => {
      const params = makeParams();

      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      expect(
        manager.getEventListener({ args: { event: STEVE_WATCH_EVENT_TYPES.START, params } })
      ).toStrictEqual(null);
    });

    it('returns the listener when entryOnly is true even if there are no callbacks', () => {
      const params = makeParams();

      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      const result = manager.getEventListener({
        entryOnly: true,
        args:      { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params },
      });

      expect(result?.event).toStrictEqual(STEVE_WATCH_EVENT_TYPES.CHANGES);
    });

    it('returns null when entryOnly is false and the listener has no callbacks', () => {
      const params = makeParams();

      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      expect(
        manager.getEventListener({
          entryOnly: false,
          args:      { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params },
        })
      ).toStrictEqual(null);
    });

    it('returns the listener when callbacks are registered', () => {
      const params = makeParams();

      manager.addEventListenerCallback({
        callback: jest.fn(),
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });

      expect(
        manager.getEventListener({ args: { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params } })
      ).toBeDefined();
    });
  });

  describe('addEventListener', () => {
    it('throws when event is not provided', () => {
      expect(() => {
        manager.addEventListener({ event: '' as any, params: makeParams() });
      }).toThrow("Cannot add a socket watch event listener if there's no event to listen to");
    });

    it('creates a new watch and listener when neither exist', () => {
      const params = makeParams();

      const listener = manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      expect(listener.event).toStrictEqual(STEVE_WATCH_EVENT_TYPES.CHANGES);
      expect(listener.callbacks).toStrictEqual({});
    });

    it('returns the same listener object when called twice for the same event and params', () => {
      const params = makeParams();

      const first = manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });
      const second = manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      expect(first).toBe(second);
    });

    it('creates separate listener entries for different events on the same watch', () => {
      const params = makeParams();

      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });
      manager.addEventListener({ event: STEVE_WATCH_EVENT_TYPES.START, params });

      expect(manager.getWatch({ params })?.listeners.length).toStrictEqual(2);
    });
  });

  describe('triggerEventListener', () => {
    it('does nothing when no listener exists for the event', () => {
      const params = makeParams();

      expect(() => {
        manager.triggerEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });
      }).not.toThrow();
    });

    it('calls all registered callbacks with forceWatch and revision from params', () => {
      const params = makeParams({ forceWatch: true, revision: 'rev-1' });
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      manager.addEventListenerCallback({
        callback: cb1,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });
      manager.addEventListenerCallback({
        callback: cb2,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-2',
        },
      });

      manager.triggerEventListener({ event: STEVE_WATCH_EVENT_TYPES.CHANGES, params });

      expect(cb1).toHaveBeenCalledWith({ forceWatch: true, revision: 'rev-1' });
      expect(cb2).toHaveBeenCalledWith({ forceWatch: true, revision: 'rev-1' });
    });

    it('does not invoke callbacks registered for a different event', () => {
      const params = makeParams();
      const cb = jest.fn();

      manager.addEventListenerCallback({
        callback: cb,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });

      manager.triggerEventListener({ event: STEVE_WATCH_EVENT_TYPES.START, params });

      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('triggerAllEventListeners', () => {
    it('calls callbacks for every registered event listener on the watch', () => {
      const params = makeParams({ forceWatch: false, revision: 'rev-2' });
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      manager.addEventListenerCallback({
        callback: cb1,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });
      manager.addEventListenerCallback({
        callback: cb2,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.START,
          params,
          id:    'cb-2',
        },
      });

      manager.triggerAllEventListeners({ params });

      expect(cb1).toHaveBeenCalledWith({ forceWatch: false, revision: 'rev-2' });
      expect(cb2).toHaveBeenCalledWith({ forceWatch: false, revision: 'rev-2' });
    });
  });

  describe('addEventListenerCallback', () => {
    it('creates a listener entry and registers the callback under the given id', () => {
      const params = makeParams();
      const cb = jest.fn();

      manager.addEventListenerCallback({
        callback: cb,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'my-cb',
        },
      });

      const listener = manager.getEventListener({
        entryOnly: true,
        args:      { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params },
      });

      expect(listener?.callbacks['my-cb']).toBe(cb);
    });

    it('does not replace an existing callback when the same id is used', () => {
      const params = makeParams();
      const first = jest.fn();
      const second = jest.fn();

      manager.addEventListenerCallback({
        callback: first,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'my-cb',
        },
      });
      manager.addEventListenerCallback({
        callback: second,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'my-cb',
        },
      });

      const listener = manager.getEventListener({
        entryOnly: true,
        args:      { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params },
      });

      expect(listener?.callbacks['my-cb']).toBe(first);
    });
  });

  describe('removeEventListenerCallback', () => {
    it('does nothing when no listener exists for the event', () => {
      expect(() => {
        manager.removeEventListenerCallback({
          event:  STEVE_WATCH_EVENT_TYPES.CHANGES,
          params: makeParams(),
          id:     'cb-1',
        });
      }).not.toThrow();
    });

    it('removes the specified callback from the listener', () => {
      const params = makeParams();
      const cb = jest.fn();

      manager.addEventListenerCallback({
        callback: cb,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });

      manager.removeEventListenerCallback({
        event: STEVE_WATCH_EVENT_TYPES.CHANGES,
        params,
        id:    'cb-1',
      });

      const listener = manager.getEventListener({
        entryOnly: true,
        args:      { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params },
      });

      expect(listener?.callbacks['cb-1']).toStrictEqual(undefined);
    });

    it('only removes the targeted callback, leaving other callbacks intact', () => {
      const params = makeParams();
      const cb1 = jest.fn();
      const cb2 = jest.fn();

      manager.addEventListenerCallback({
        callback: cb1,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-1',
        },
      });
      manager.addEventListenerCallback({
        callback: cb2,
        args:     {
          event: STEVE_WATCH_EVENT_TYPES.CHANGES,
          params,
          id:    'cb-2',
        },
      });

      manager.removeEventListenerCallback({
        event: STEVE_WATCH_EVENT_TYPES.CHANGES,
        params,
        id:    'cb-1',
      });

      const listener = manager.getEventListener({
        entryOnly: true,
        args:      { event: STEVE_WATCH_EVENT_TYPES.CHANGES, params },
      });

      expect(listener?.callbacks['cb-1']).toStrictEqual(undefined);
      expect(listener?.callbacks['cb-2']).toBe(cb2);
    });
  });
});
