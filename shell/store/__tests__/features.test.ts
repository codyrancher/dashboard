import {
  getters, actions, mapFeature, MULTI_CLUSTER, LEGACY, RKE2,
} from '@shell/store/features';
import { MANAGEMENT } from '@shell/config/types';

describe('features store', () => {
  describe('getters.get', () => {
    it('throws for an unknown feature name', () => {
      const rootGetters = { 'management/byId': jest.fn() };
      const getter = getters.get({}, {}, {}, rootGetters);

      expect(() => getter('unknown-feature-xyz')).toThrow('Unknown feature: unknown-feature-xyz');
    });

    it.each([
      {
        desc:     'enabled entry',
        enabled:  true,
        expected: true,
      },
      {
        desc:     'disabled entry',
        enabled:  false,
        expected: false,
      },
    ])('returns entry.enabled when a management entry exists: $desc', ({ enabled, expected }) => {
      const rootGetters = { 'management/byId': jest.fn(() => ({ enabled })) };
      const getter = getters.get({}, {}, {}, rootGetters);

      expect(getter(MULTI_CLUSTER)).toStrictEqual(expected);
      expect(rootGetters['management/byId']).toHaveBeenCalledWith(MANAGEMENT.FEATURE, MULTI_CLUSTER);
    });

    it.each([
      {
        desc:     'MULTI_CLUSTER defaults to true',
        feature:  MULTI_CLUSTER,
        expected: true,
      },
      {
        desc:     'LEGACY defaults to false',
        feature:  LEGACY,
        expected: false,
      },
      {
        desc:     'RKE2 defaults to true',
        feature:  RKE2,
        expected: true,
      },
    ])('falls back to the registered default when no management entry exists: $desc', ({ feature, expected }) => {
      const rootGetters = { 'management/byId': jest.fn(() => undefined) };
      const getter = getters.get({}, {}, {}, rootGetters);

      expect(getter(feature)).toStrictEqual(expected);
    });
  });

  describe('actions.loadServer', () => {
    it('dispatches management/findAll when canList returns true', async() => {
      const dispatch = jest.fn().mockResolvedValue([]);
      const rootGetters = { 'management/canList': jest.fn(() => true) };

      await actions.loadServer({ rootGetters, dispatch });

      expect(rootGetters['management/canList']).toHaveBeenCalledWith(MANAGEMENT.FEATURE);
      expect(dispatch).toHaveBeenCalledWith(
        'management/findAll',
        { type: MANAGEMENT.FEATURE, opt: { watch: false } },
        { root: true }
      );
    });

    it('does not dispatch when canList returns false', async() => {
      const dispatch = jest.fn();
      const rootGetters = { 'management/canList': jest.fn(() => false) };

      await actions.loadServer({ rootGetters, dispatch });

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('returns the result of management/findAll', async() => {
      const features = [{ id: 'rke2', enabled: true }];
      const dispatch = jest.fn().mockResolvedValue(features);
      const rootGetters = { 'management/canList': jest.fn(() => true) };

      const result = await actions.loadServer({ rootGetters, dispatch });

      expect(result).toStrictEqual(features);
    });
  });

  describe('mapFeature', () => {
    it('get() invokes the features/get store getter with the feature name', () => {
      const mockGetFn = jest.fn(() => true);
      const context = { $store: { getters: { 'features/get': mockGetFn } } };
      const computed = mapFeature(MULTI_CLUSTER);

      const result = computed.get.call(context);

      expect(mockGetFn).toHaveBeenCalledWith(MULTI_CLUSTER);
      expect(result).toStrictEqual(true);
    });

    it('set() throws an error regardless of the value', () => {
      const computed = mapFeature(MULTI_CLUSTER);

      expect(() => computed.set(true)).toThrow('The feature store only supports getting');
    });
  });
});
