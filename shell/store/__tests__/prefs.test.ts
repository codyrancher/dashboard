import {
  state as makeState,
  getters,
  mutations,
  actions,
  CLUSTER,
  LAST_VISITED,
  AFTER_LOGIN_ROUTE,
  THEME,
  PREFERS_SCHEME,
  LOCALE,
  DEV,
  PLUGIN_DEVELOPER,
  DIFF,
  EXPANDED_GROUPS,
  GROUP_RESOURCES,
} from '../prefs';

describe('store: prefs', () => {
  let s: ReturnType<typeof makeState>;

  beforeEach(() => {
    s = makeState();
  });

  describe('getters.get', () => {
    it('throws for an unknown preference key', () => {
      expect(() => getters.get(s)('__no-such-key__')).toThrow('Unknown preference: __no-such-key__');
    });

    it('returns the user-set value (cloned) when present', () => {
      s.data[THEME] = 'light';
      expect(getters.get(s)(THEME)).toStrictEqual('light');
    });

    it('returns the default value (cloned) when no user value is set', () => {
      expect(getters.get(s)(THEME)).toStrictEqual('auto');
    });

    it('returns a clone, not the original reference, for object values', () => {
      const val = { x: 1 };

      s.data[CLUSTER] = val;
      const result = getters.get(s)(CLUSTER);

      expect(result).toStrictEqual(val);
      expect(result).not.toBe(val);
    });
  });

  describe('getters.defaultValue', () => {
    it('throws for an unknown preference key', () => {
      expect(() => getters.defaultValue(s)('__no-such-key__')).toThrow('Unknown preference: __no-such-key__');
    });

    it('returns the default value defined by create()', () => {
      expect(getters.defaultValue(s)(THEME)).toStrictEqual('auto');
    });

    it('returns a clone, not the original reference, for array defaults', () => {
      const defaultVal = getters.defaultValue(s)(EXPANDED_GROUPS);
      const secondCall = getters.defaultValue(s)(EXPANDED_GROUPS);

      expect(defaultVal).toStrictEqual(secondCall);
      expect(defaultVal).not.toBe(secondCall);
    });
  });

  describe('getters.options', () => {
    it('throws for an unknown preference key', () => {
      expect(() => getters.options(s)('__no-such-key__')).toThrow('Unknown preference: __no-such-key__');
    });

    it('throws when the preference has no options', () => {
      expect(() => getters.options(s)(CLUSTER)).toThrow('Preference does not have options: cluster');
    });

    it('returns a copy of the options array', () => {
      expect(getters.options(s)(DIFF)).toStrictEqual(['unified', 'split']);
    });

    it('returns a new array (not the original reference)', () => {
      const first = getters.options(s)(DIFF);
      const second = getters.options(s)(DIFF);

      expect(first).not.toBe(second);
    });
  });

  describe('getters.theme', () => {
    const buildGetters = (themeVal: string, pcsVal: string) => ({ get: (key: string) => (key === THEME ? themeVal : pcsVal) });

    it('returns the management setting value when set', () => {
      const rootGetters = { 'management/byId': () => ({ value: 'light' }) };
      const result = getters.theme(s, buildGetters('dark', ''), null as any, rootGetters as any);

      expect(result).toStrictEqual('light');
    });

    it('returns the stored theme directly when not auto or ui- prefixed', () => {
      const rootGetters = { 'management/byId': () => null };
      const result = getters.theme(s, buildGetters('dark', ''), null as any, rootGetters as any);

      expect(result).toStrictEqual('dark');
    });

    it('strips the ui- prefix from the theme value', () => {
      const rootGetters = { 'management/byId': () => null };
      const result = getters.theme(s, buildGetters('ui-light', ''), null as any, rootGetters as any);

      expect(result).toStrictEqual('light');
    });

    it('resolves auto to the pcs preference when pcs is light', () => {
      const rootGetters = { 'management/byId': () => null };
      const result = getters.theme(s, buildGetters('auto', 'light'), null as any, rootGetters as any);

      expect(result).toStrictEqual('light');
    });

    it('resolves auto to the pcs preference when pcs is dark', () => {
      const rootGetters = { 'management/byId': () => null };
      const result = getters.theme(s, buildGetters('auto', 'dark'), null as any, rootGetters as any);

      expect(result).toStrictEqual('dark');
    });

    it('resolves auto to dark when pcs is not light or dark', () => {
      const rootGetters = { 'management/byId': () => null };
      const result = getters.theme(s, buildGetters('auto', ''), null as any, rootGetters as any);

      expect(result).toStrictEqual('dark');
    });
  });

  describe('getters.afterLoginRoute', () => {
    const buildGetters = (afterLogin: any, lastVisited = '', cluster = '') => ({
      get: (key: string) => {
        if (key === AFTER_LOGIN_ROUTE) {
          return afterLogin;
        }
        if (key === LAST_VISITED) {
          return lastVisited;
        }
        if (key === CLUSTER) {
          return cluster;
        }

        return undefined;
      },
    });

    it('returns non-string values as-is', () => {
      const obj = { name: 'custom-route', params: { id: '42' } };
      const result = getters.afterLoginRoute(s, buildGetters(obj) as any);

      expect(result).toStrictEqual(obj);
    });

    it('returns home route object when preference is home', () => {
      const result = getters.afterLoginRoute(s, buildGetters('home') as any);

      expect(result).toStrictEqual({ name: 'home' });
    });

    it('returns authRedirect when preference is last-visited and authRedirect is set', () => {
      s.authRedirect = { name: 'c-cluster-explorer', params: { cluster: 'abc' } };
      const result = getters.afterLoginRoute(s, buildGetters('last-visited') as any);

      expect(result).toStrictEqual({ name: 'c-cluster-explorer', params: { cluster: 'abc' } });
    });

    it('returns lastVisited pref when last-visited and authRedirect is not set', () => {
      s.authRedirect = null;
      const result = getters.afterLoginRoute(
        s,
        buildGetters('last-visited', 'some-last-visited') as any
      );

      expect(result).toStrictEqual('some-last-visited');
    });

    it('returns cluster explorer route with cluster pref when last-visited and no stored last-visited', () => {
      s.authRedirect = null;
      const result = getters.afterLoginRoute(
        s,
        buildGetters('last-visited', '', 'local') as any
      );

      expect(result).toStrictEqual({ name: 'c-cluster-explorer', params: { cluster: 'local' } });
    });

    it('returns cluster explorer route for a cluster-dashboard string', () => {
      const result = getters.afterLoginRoute(s, buildGetters('my-cluster-dashboard') as any);

      expect(result).toStrictEqual({ name: 'c-cluster-explorer', params: { cluster: 'my-cluster' } });
    });

    it('returns named route for any other string preference', () => {
      const result = getters.afterLoginRoute(s, buildGetters('some-route') as any);

      expect(result).toStrictEqual({ name: 'some-route' });
    });
  });

  describe('getters.dev', () => {
    it('returns the PLUGIN_DEVELOPER preference value', () => {
      s.data[PLUGIN_DEVELOPER] = true;
      const localGetters = {
        get: (key: string) => {
          if (!(key in s.definitions)) {
            throw new Error(`Unknown preference: ${ key }`);
          }

          return s.data[key];
        },
      };
      const result = getters.dev(s, localGetters as any);

      expect(result).toStrictEqual(true);
    });

    it('falls back to DEV preference when PLUGIN_DEVELOPER getter throws', () => {
      s.data[DEV] = true;
      const localGetters = {
        get: (key: string) => {
          if (key === PLUGIN_DEVELOPER) {
            throw new Error('Unknown preference: plugin-developer');
          }

          return s.data[key];
        },
      };
      const result = getters.dev(s, localGetters as any);

      expect(result).toStrictEqual(true);
    });
  });

  describe('mutations', () => {
    describe('load', () => {
      it('stores a value for the given key', () => {
        mutations.load(s, { key: THEME, value: 'light' });
        expect(s.data[THEME]).toStrictEqual('light');
      });
    });

    describe('cookiesLoaded', () => {
      it('sets cookiesLoaded to true', () => {
        expect(s.cookiesLoaded).toStrictEqual(false);
        mutations.cookiesLoaded(s);
        expect(s.cookiesLoaded).toStrictEqual(true);
      });
    });

    describe('reset', () => {
      it('removes non-cookie preference data', () => {
        s.data[GROUP_RESOURCES] = 'project';
        mutations.reset(s);
        expect(s.data[GROUP_RESOURCES]).toBeUndefined();
      });

      it('preserves data for cookie-backed preferences', () => {
        s.data[LOCALE] = 'de-de';
        s.data[PREFERS_SCHEME] = 'light';
        mutations.reset(s);
        expect(s.data[LOCALE]).toStrictEqual('de-de');
        expect(s.data[PREFERS_SCHEME]).toStrictEqual('light');
      });
    });

    describe('setDefinition', () => {
      it('adds a new definition to state.definitions', () => {
        const testKey = '__prefs-test-setdef__';
        const definition = {
          def:              'test-default',
          asCookie:         false,
          parseJSON:        false,
          asUserPreference: true,
          options:          null,
          inheritFrom:      null,
          mangleRead:       null,
          mangleWrite:      null,
        };

        mutations.setDefinition(s, { name: testKey, definition });
        expect(s.definitions[testKey]).toStrictEqual(definition);
      });
    });

    describe('setAuthRedirect', () => {
      it('sets the authRedirect on state', () => {
        const route = { name: 'c-cluster-explorer', params: { cluster: 'local' } };

        mutations.setAuthRedirect(s, route);
        expect(s.authRedirect).toStrictEqual(route);
      });
    });
  });

  describe('actions.setLastVisited', () => {
    let dispatch: jest.Mock;
    let localGetters: Record<string, any>;

    beforeEach(() => {
      dispatch = jest.fn();
      localGetters = { get: (key: string) => s.data[key] ?? s.definitions[key]?.def };
    });

    it('returns without dispatching when route is falsy', async() => {
      await actions.setLastVisited({
        s, dispatch, getters: localGetters
      } as any, null);
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('returns without dispatching when afterLoginRoute pref is not last-visited', async() => {
      s.data[AFTER_LOGIN_ROUTE] = 'home';
      await actions.setLastVisited({
        s, dispatch, getters: localGetters
      } as any, '/some/path');
      expect(dispatch).not.toHaveBeenCalled();
    });

    it('dispatches set with LAST_VISITED when afterLoginRoute pref is last-visited', async() => {
      s.data[AFTER_LOGIN_ROUTE] = 'last-visited';
      await actions.setLastVisited({
        s, dispatch, getters: localGetters
      } as any, '/some/path');
      expect(dispatch).toHaveBeenCalledWith('set', {
        key:   LAST_VISITED,
        value: '/some/path',
      });
    });
  });
});
