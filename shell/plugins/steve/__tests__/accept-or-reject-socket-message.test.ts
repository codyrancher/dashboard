import acceptOrReject from '../accept-or-reject-socket-message';

function makeCtx(overrides: { getters?: any; rootGetters?: any } = {}) {
  return {
    getters: {
      haveNamespace: jest.fn(),
      havePage:      jest.fn(),
      schemaFor:     jest.fn(),
      all:           jest.fn(),
      ...overrides.getters,
    },
    rootGetters: {
      activeNamespaceCache: {},
      ...overrides.rootGetters,
    },
  };
}

describe('acceptOrRejectSocketMessage', () => {
  describe('typeIsNamespaced', () => {
    it('returns true when haveNamespace returns a non-empty array', () => {
      const ctx = makeCtx({ getters: { haveNamespace: jest.fn(() => ['default']) } });

      expect(acceptOrReject.typeIsNamespaced(ctx, 'pods')).toBe(true);
    });

    it('returns false when haveNamespace returns an empty array', () => {
      const ctx = makeCtx({ getters: { haveNamespace: jest.fn(() => []) } });

      expect(acceptOrReject.typeIsNamespaced(ctx, 'pods')).toBe(false);
    });

    it('returns false when haveNamespace returns undefined', () => {
      const ctx = makeCtx({ getters: { haveNamespace: jest.fn(() => undefined) } });

      expect(acceptOrReject.typeIsNamespaced(ctx, 'pods')).toBe(false);
    });

    it('calls haveNamespace with the given type', () => {
      const haveNamespace = jest.fn(() => ['ns1']);
      const ctx = makeCtx({ getters: { haveNamespace } });

      acceptOrReject.typeIsNamespaced(ctx, 'configmaps');

      expect(haveNamespace).toHaveBeenCalledWith('configmaps');
    });
  });

  describe('typeIsPaginated', () => {
    it('returns true when havePage returns a truthy value', () => {
      const ctx = makeCtx({ getters: { havePage: jest.fn(() => ({ page: 1 })) } });

      expect(acceptOrReject.typeIsPaginated(ctx, 'pods')).toBe(true);
    });

    it('returns false when havePage returns null', () => {
      const ctx = makeCtx({ getters: { havePage: jest.fn(() => null) } });

      expect(acceptOrReject.typeIsPaginated(ctx, 'pods')).toBe(false);
    });

    it('returns false when havePage returns undefined', () => {
      const ctx = makeCtx({ getters: { havePage: jest.fn(() => undefined) } });

      expect(acceptOrReject.typeIsPaginated(ctx, 'pods')).toBe(false);
    });

    it('calls havePage with the given type', () => {
      const havePage = jest.fn(() => null);
      const ctx = makeCtx({ getters: { havePage } });

      acceptOrReject.typeIsPaginated(ctx, 'services');

      expect(havePage).toHaveBeenCalledWith('services');
    });
  });

  describe('filteredNamespaces', () => {
    it('returns rootGetters.activeNamespaceCache', () => {
      const cache = { default: true, 'kube-system': true };
      const ctx = makeCtx({ rootGetters: { activeNamespaceCache: cache } });

      expect(acceptOrReject.filteredNamespaces(ctx)).toStrictEqual(cache);
    });
  });

  describe('subscribeNamespace', () => {
    it('returns undefined (subscribe to all) for a non-empty namespace array', () => {
      expect(acceptOrReject.subscribeNamespace(['default'])).toBeUndefined();
    });

    it('returns undefined for multiple namespaces', () => {
      expect(acceptOrReject.subscribeNamespace(['default', 'kube-system'])).toBeUndefined();
    });

    it('returns the empty array when namespace list is empty', () => {
      expect(acceptOrReject.subscribeNamespace([])).toStrictEqual([]);
    });
  });

  describe('validChange', () => {
    it('returns true when resource is neither namespaced nor paginated', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => []),
          havePage:      jest.fn(() => null),
        },
      });
      const data = { id: 'ns1/pod-1', metadata: { namespace: 'ns1' } };

      expect(acceptOrReject.validChange(ctx, 'pods', data)).toBe(true);
    });

    it('returns true when resource namespace is in the active namespace cache', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => ['ns1']),
          havePage:      jest.fn(() => null),
        },
        rootGetters: { activeNamespaceCache: { ns1: true } },
      });
      const data = { id: 'ns1/pod-1', metadata: { namespace: 'ns1' } };

      expect(acceptOrReject.validChange(ctx, 'pods', data)).toBe(true);
    });

    it('returns false when resource namespace is not in the active namespace cache', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => ['ns1']),
          havePage:      jest.fn(() => null),
        },
        rootGetters: { activeNamespaceCache: { ns1: true } },
      });
      const data = { id: 'other/pod-1', metadata: { namespace: 'other' } };

      expect(acceptOrReject.validChange(ctx, 'pods', data)).toBe(false);
    });

    it('returns true when resource id is found in the paginated page', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => []),
          havePage:      jest.fn(() => ({ page: 1 })),
          all:           jest.fn(() => [{ id: 'ns1/pod-1' }, { id: 'ns1/pod-2' }]),
        },
      });
      const data = { id: 'ns1/pod-1', metadata: { namespace: 'ns1' } };

      expect(acceptOrReject.validChange(ctx, 'pods', data)).toBe(true);
    });

    it('returns false when resource id is not in the paginated page', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => []),
          havePage:      jest.fn(() => ({ page: 1 })),
          all:           jest.fn(() => [{ id: 'ns1/pod-2' }]),
        },
      });
      const data = { id: 'ns1/pod-1', metadata: { namespace: 'ns1' } };

      expect(acceptOrReject.validChange(ctx, 'pods', data)).toBe(false);
    });

    it('applies namespace check before pagination check', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => ['ns1']),
          havePage:      jest.fn(() => ({ page: 1 })),
          all:           jest.fn(() => [{ id: 'other/pod-1' }]),
        },
        rootGetters: { activeNamespaceCache: { ns1: true } },
      });
      // namespace check passes but pagination check would fail
      const data = { id: 'ns1/pod-X', metadata: { namespace: 'ns1' } };

      expect(acceptOrReject.validChange(ctx, 'pods', data)).toBe(false);
    });
  });

  describe('validateBatchChange', () => {
    it('returns the batch unchanged when types are neither namespaced nor paginated', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => []),
          havePage:      jest.fn(() => null),
          schemaFor:     jest.fn(() => ({ attributes: { namespaced: true } })),
          all:           jest.fn(() => []),
        },
      });
      const batch = { pods: { 'ns1/pod-1': {}, 'ns1/pod-2': {} } };

      const result = acceptOrReject.validateBatchChange(ctx, batch);

      expect(Object.keys(result.pods)).toStrictEqual(['ns1/pod-1', 'ns1/pod-2']);
    });

    it('removes entries whose namespace is not in activeNamespaceCache', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => ['ns1']),
          havePage:      jest.fn(() => null),
          schemaFor:     jest.fn(() => ({ attributes: { namespaced: true } })),
          all:           jest.fn(() => []),
        },
        rootGetters: { activeNamespaceCache: { ns1: true } },
      });
      const batch = { pods: { 'ns1/pod-1': {}, 'other/pod-2': {} } };

      const result = acceptOrReject.validateBatchChange(ctx, batch);

      expect(Object.keys(result.pods)).toStrictEqual(['ns1/pod-1']);
    });

    it('removes entries not present in the paginated page', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => []),
          havePage:      jest.fn(() => ({ page: 1 })),
          schemaFor:     jest.fn(() => null),
          all:           jest.fn(() => [{ id: 'ns1/pod-1' }]),
        },
      });
      const batch = { pods: { 'ns1/pod-1': {}, 'ns1/pod-2': {} } };

      const result = acceptOrReject.validateBatchChange(ctx, batch);

      expect(Object.keys(result.pods)).toStrictEqual(['ns1/pod-1']);
    });

    it('skips namespace check when schema indicates non-namespaced resource', () => {
      const ctx = makeCtx({
        getters: {
          haveNamespace: jest.fn(() => ['ns1']),
          havePage:      jest.fn(() => null),
          schemaFor:     jest.fn(() => ({ attributes: { namespaced: false } })),
          all:           jest.fn(() => []),
        },
        rootGetters: { activeNamespaceCache: { ns1: true } },
      });
      const batch = { clusterroles: { view: {}, edit: {} } };

      const result = acceptOrReject.validateBatchChange(ctx, batch);

      expect(Object.keys(result.clusterroles)).toStrictEqual(['view', 'edit']);
    });

    it('caches typeIsNamespaced and typeIsPaginated per type across multiple entries', () => {
      const haveNamespace = jest.fn(() => ['ns1']);
      const havePage = jest.fn(() => null);
      const ctx = makeCtx({
        getters: {
          haveNamespace,
          havePage,
          schemaFor: jest.fn(() => ({ attributes: { namespaced: true } })),
          all:       jest.fn(() => []),
        },
        rootGetters: { activeNamespaceCache: { ns1: true } },
      });
      const batch = {
        pods: {
          'ns1/pod-1': {},
          'ns1/pod-2': {},
          'ns1/pod-3': {},
        },
      };

      acceptOrReject.validateBatchChange(ctx, batch);

      // typeIsNamespaced and typeIsPaginated should only be resolved once per type, not per entry
      expect(haveNamespace).toHaveBeenCalledTimes(1);
      expect(havePage).toHaveBeenCalledTimes(1);
    });
  });
});
