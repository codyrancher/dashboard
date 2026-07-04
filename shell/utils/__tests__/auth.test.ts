import {
  parseAuthProvidersInfo,
  canViewResource,
  notLoggedIn,
  checkPermissions,
} from '@shell/utils/auth';

describe('shell/utils/auth', () => {
  describe('parseAuthProvidersInfo', () => {
    it('returns empty results for an empty rows array', () => {
      expect(parseAuthProvidersInfo([])).toStrictEqual({
        nonLocal:        [],
        enabledLocation: null,
        enabled:         [],
      });
    });

    it('filters out the local provider', () => {
      const rows = [{
        name: 'local', id: 'local', enabled: true
      }];

      expect(parseAuthProvidersInfo(rows)).toStrictEqual({
        nonLocal:        [],
        enabledLocation: null,
        enabled:         [],
      });
    });

    it.each([
      {
        desc: 'a single enabled non-oidc provider',
        rows: [{
          name: 'github', id: 'github', enabled: true
        }],
        expected: {
          nonLocal: [{
            name: 'github', id: 'github', enabled: true
          }],
          enabledLocation: {
            name:   'c-cluster-auth-config-id',
            params: { id: 'github' },
            query:  { mode: 'edit' },
          },
          enabled: [{
            name: 'github', id: 'github', enabled: true
          }],
        },
      },
      {
        desc: 'an oidc provider (excluded from nonLocal but included in enabled)',
        rows: [{
          name: 'oidc', id: 'oidc', enabled: true
        }],
        expected: {
          nonLocal:        [],
          enabledLocation: {
            name:   'c-cluster-auth-config-id',
            params: { id: 'oidc' },
            query:  { mode: 'edit' },
          },
          enabled: [{
            name: 'oidc', id: 'oidc', enabled: true
          }],
        },
      },
    ])('handles $desc', ({ rows, expected }) => {
      expect(parseAuthProvidersInfo(rows)).toStrictEqual(expected);
    });

    it('returns null enabledLocation when multiple providers are enabled', () => {
      const rows = [
        {
          name: 'github', id: 'github', enabled: true
        },
        {
          name: 'gitlab', id: 'gitlab', enabled: true
        },
      ];
      const result = parseAuthProvidersInfo(rows);

      expect(result.enabledLocation).toBeNull();
    });

    it('returns null enabledLocation when no provider is enabled', () => {
      const rows = [{
        name: 'github', id: 'github', enabled: false
      }];
      const result = parseAuthProvidersInfo(rows);

      expect(result.enabledLocation).toBeNull();
    });

    it('excludes disabled providers from enabled list', () => {
      const rows = [
        {
          name: 'github', id: 'github', enabled: false
        },
        {
          name: 'gitlab', id: 'gitlab', enabled: true
        },
      ];
      const result = parseAuthProvidersInfo(rows);

      expect(result.enabled).toStrictEqual([{
        name: 'gitlab', id: 'gitlab', enabled: true
      }]);
    });

    it('includes oidc in nonLocal when accompanied by another non-oidc provider', () => {
      const rows = [
        {
          name: 'github', id: 'github', enabled: false
        },
        {
          name: 'oidc', id: 'oidc', enabled: false
        },
      ];
      const result = parseAuthProvidersInfo(rows);

      expect(result.nonLocal).toStrictEqual([{
        name: 'github', id: 'github', enabled: false
      }]);
    });
  });

  describe('canViewResource', () => {
    it('returns false when currentStore returns a falsy value', () => {
      const store = {
        getters: {
          currentStore:         () => null,
          'type-map/isVirtual': () => false,
        },
      };

      expect(canViewResource(store, 'some.type')).toStrictEqual(false);
    });

    it('returns false when schemaFor getter does not exist for the store', () => {
      const store = {
        getters: {
          currentStore:         () => 'management',
          // intentionally missing 'management/schemaFor'
          'type-map/isVirtual': () => false,
        } as Record<string, unknown>,
      };

      expect(canViewResource(store, 'some.type')).toStrictEqual(false);
    });

    it('returns true when schemaFor returns a truthy schema', () => {
      const schema = { id: 'some.type' };
      const store = {
        getters: {
          currentStore:           () => 'management',
          'management/schemaFor': () => schema,
          'type-map/isVirtual':   () => false,
        },
      };

      expect(canViewResource(store, 'some.type')).toStrictEqual(true);
    });

    it('returns true when resource has no schema but is virtual', () => {
      const store = {
        getters: {
          currentStore:           () => 'management',
          'management/schemaFor': () => null,
          'type-map/isVirtual':   () => true,
        },
      };

      expect(canViewResource(store, 'some.virtual.type')).toStrictEqual(true);
    });

    it('returns false when resource has no schema and is not virtual', () => {
      const store = {
        getters: {
          currentStore:           () => 'management',
          'management/schemaFor': () => null,
          'type-map/isVirtual':   () => false,
        },
      };

      expect(canViewResource(store, 'some.type')).toStrictEqual(false);
    });
  });

  describe('notLoggedIn', () => {
    it('always commits auth/hasAuth to true', () => {
      const commit = jest.fn();
      const redirect = jest.fn();
      const route = { name: 'index' };

      notLoggedIn({ commit }, redirect, route);

      expect(commit).toHaveBeenCalledWith('auth/hasAuth', true);
    });

    it('commits prefs/setAuthRedirect when route name does not include "auth"', () => {
      const commit = jest.fn();
      const redirect = jest.fn();
      const route = { name: 'c-cluster-dashboard' };

      notLoggedIn({ commit }, redirect, route);

      expect(commit).toHaveBeenCalledWith('prefs/setAuthRedirect', route);
    });

    it('does not commit prefs/setAuthRedirect when route name includes "auth"', () => {
      const commit = jest.fn();
      const redirect = jest.fn();
      const route = { name: 'auth-login' };

      notLoggedIn({ commit }, redirect, route);

      expect(commit).not.toHaveBeenCalledWith('prefs/setAuthRedirect', expect.anything());
    });

    it('redirects to /auth/login for the index route', () => {
      const commit = jest.fn();
      const redirect = jest.fn();
      const route = { name: 'index' };

      notLoggedIn({ commit }, redirect, route);

      expect(redirect).toHaveBeenCalledWith('/auth/login');
    });

    it('redirects to /auth/login?timed-out for non-index routes', () => {
      const commit = jest.fn();
      const redirect = jest.fn();
      const route = { name: 'c-cluster-dashboard' };

      notLoggedIn({ commit }, redirect, route);

      expect(redirect).toHaveBeenCalledWith('/auth/login?timed-out');
    });
  });

  describe('checkPermissions', () => {
    it('returns an empty object for no types', async() => {
      const getters = { 'management/schemaFor': () => null };

      await expect(checkPermissions({}, getters)).resolves.toStrictEqual({});
    });

    it('sets key to false when schema is missing', async() => {
      const getters = { 'management/schemaFor': () => null };
      const types = { myKey: { type: 'some.type', inStoreType: 'management' } };

      await expect(checkPermissions(types, getters)).resolves.toStrictEqual({ myKey: false });
    });

    it('uses schemaValidator result when provided', async() => {
      const schema = { id: 'some.type' };
      const getters = { 'management/schemaFor': () => schema };
      const types = {
        allowed: {
          type:            'some.type',
          inStoreType:     'management',
          schemaValidator: () => true,
        },
        denied: {
          type:            'some.type',
          inStoreType:     'management',
          schemaValidator: () => false,
        },
      };

      await expect(checkPermissions(types, getters)).resolves.toStrictEqual({
        allowed: true,
        denied:  false,
      });
    });

    it('checks resourceMethods against schema.resourceMethods', async() => {
      const schema = { id: 'some.type', resourceMethods: ['GET', 'PUT', 'DELETE'] };
      const getters = { 'management/schemaFor': () => schema };
      const types = {
        allPresent: {
          type:            'some.type',
          inStoreType:     'management',
          resourceMethods: ['GET', 'PUT'],
        },
        oneMissing: {
          type:            'some.type',
          inStoreType:     'management',
          resourceMethods: ['GET', 'PATCH'],
        },
      };

      await expect(checkPermissions(types, getters)).resolves.toStrictEqual({
        allPresent: true,
        oneMissing: false,
      });
    });

    it('checks collectionMethods against schema.collectionMethods', async() => {
      const schema = { id: 'some.type', collectionMethods: ['GET', 'POST'] };
      const getters = { 'management/schemaFor': () => schema };
      const types = {
        allPresent: {
          type:              'some.type',
          inStoreType:       'management',
          collectionMethods: ['GET'],
        },
        oneMissing: {
          type:              'some.type',
          inStoreType:       'management',
          collectionMethods: ['GET', 'DELETE'],
        },
      };

      await expect(checkPermissions(types, getters)).resolves.toStrictEqual({
        allPresent: true,
        oneMissing: false,
      });
    });

    it('returns true when schema exists and no method validators are provided', async() => {
      const schema = { id: 'some.type' };
      const getters = { 'management/schemaFor': () => schema };
      const types = { myKey: { type: 'some.type', inStoreType: 'management' } };

      await expect(checkPermissions(types, getters)).resolves.toStrictEqual({ myKey: true });
    });
  });
});
