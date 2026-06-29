import pAndNFiltering from '@shell/plugins/steve/projectAndNamespaceFiltering.utils';
import { NAMESPACE_FILTER_NS_FULL_PREFIX, NAMESPACE_FILTER_P_FULL_PREFIX } from '@shell/utils/namespace-filter';
import { MANAGEMENT } from '@shell/config/types';
import { SETTING } from '@shell/config/settings';

const makeRootGetters = (overrides: { currentProduct?: any; perfSettingValue?: string } = {}) => {
  const { currentProduct = { inStore: 'cluster', showWorkspaceSwitcher: false }, perfSettingValue } = overrides;

  return {
    currentProduct,
    'management/byId': (type: string, id: string) => {
      if (type === MANAGEMENT.SETTING && id === SETTING.UI_PERFORMANCE && perfSettingValue !== undefined) {
        return { value: perfSettingValue };
      }

      return undefined;
    },
  } as any;
};

describe('projectAndNamespaceFiltering.utils', () => {
  describe('isApplicable', () => {
    it.each([
      {
        desc:     'returns true when namespaced is an empty array',
        opt:      { namespaced: [] },
        expected: true,
      },
      {
        desc:     'returns true when namespaced is a non-empty array',
        opt:      { namespaced: ['ns://my-ns'] },
        expected: true,
      },
      {
        desc:     'returns false when namespaced is undefined',
        opt:      { namespaced: undefined },
        expected: false,
      },
      {
        desc:     'returns false when namespaced is a string',
        opt:      { namespaced: 'ns://my-ns' } as any,
        expected: false,
      },
      {
        desc:     'returns false when namespaced property is absent',
        opt:      {} as any,
        expected: false,
      },
    ])('$desc', ({ opt, expected }) => {
      expect(pAndNFiltering.isApplicable(opt)).toStrictEqual(expected);
    });
  });

  describe('isEnabled', () => {
    it('returns true when all conditions are met', () => {
      const rootGetters = makeRootGetters({ perfSettingValue: JSON.stringify({ forceNsFilterV2: { enabled: true } }) });

      expect(pAndNFiltering.isEnabled(rootGetters)).toBe(true);
    });

    it('returns false when inStore is not cluster', () => {
      const rootGetters = makeRootGetters({
        currentProduct:   { inStore: 'management', showWorkspaceSwitcher: false },
        perfSettingValue: JSON.stringify({ forceNsFilterV2: { enabled: true } }),
      });

      expect(pAndNFiltering.isEnabled(rootGetters)).toBe(false);
    });

    it('returns false when showWorkspaceSwitcher is true', () => {
      const rootGetters = makeRootGetters({
        currentProduct:   { inStore: 'cluster', showWorkspaceSwitcher: true },
        perfSettingValue: JSON.stringify({ forceNsFilterV2: { enabled: true } }),
      });

      expect(pAndNFiltering.isEnabled(rootGetters)).toBe(false);
    });

    it('returns false when forceNsFilterV2 is disabled', () => {
      const rootGetters = makeRootGetters({ perfSettingValue: JSON.stringify({ forceNsFilterV2: { enabled: false } }) });

      expect(pAndNFiltering.isEnabled(rootGetters)).toBe(false);
    });

    it('returns false when forceNsFilterV2 is absent (default perf setting)', () => {
      const rootGetters = makeRootGetters();

      expect(pAndNFiltering.isEnabled(rootGetters)).toBe(false);
    });

    it('returns false when currentProduct is null', () => {
      const rootGetters = makeRootGetters({
        currentProduct:   null,
        perfSettingValue: JSON.stringify({ forceNsFilterV2: { enabled: true } }),
      });

      expect(pAndNFiltering.isEnabled(rootGetters)).toBe(false);
    });
  });

  describe('createParam', () => {
    it('returns empty string for undefined filter', () => {
      expect(pAndNFiltering.createParam(undefined)).toStrictEqual('');
    });

    it('returns empty string for empty array', () => {
      expect(pAndNFiltering.createParam([])).toStrictEqual('');
    });

    it.each([
      {
        desc:     'plain namespace without prefix',
        filter:   ['my-namespace'],
        expected: 'projectsornamespaces=my-namespace',
      },
      {
        desc:     'namespace with ns:// prefix stripped',
        filter:   [`${ NAMESPACE_FILTER_NS_FULL_PREFIX }my-namespace`],
        expected: 'projectsornamespaces=my-namespace',
      },
      {
        desc:     'project with project:// prefix stripped',
        filter:   [`${ NAMESPACE_FILTER_P_FULL_PREFIX }my-project`],
        expected: 'projectsornamespaces=my-project',
      },
      {
        desc:     'multiple includes joined with comma',
        filter:   ['ns-a', 'ns-b', 'ns-c'],
        expected: 'projectsornamespaces=ns-a,ns-b,ns-c',
      },
      {
        desc:     'multiple includes with mixed prefixes joined',
        filter:   [`${ NAMESPACE_FILTER_NS_FULL_PREFIX }ns-a`, `${ NAMESPACE_FILTER_P_FULL_PREFIX }proj-b`],
        expected: 'projectsornamespaces=ns-a,proj-b',
      },
    ])('include: $desc', ({ filter, expected }) => {
      expect(pAndNFiltering.createParam(filter)).toStrictEqual(expected);
    });

    it.each([
      {
        desc:     'single exclude with leading dash',
        filter:   ['-my-namespace'],
        expected: 'projectsornamespaces!=my-namespace',
      },
      {
        desc:     'multiple excludes joined with comma',
        filter:   ['-ns-a', '-ns-b'],
        expected: 'projectsornamespaces!=ns-a,ns-b',
      },
    ])('exclude: $desc', ({ filter, expected }) => {
      expect(pAndNFiltering.createParam(filter)).toStrictEqual(expected);
    });

    it('exclude overrides include when both are present', () => {
      const filter = ['ns-include', '-ns-exclude'];

      expect(pAndNFiltering.createParam(filter)).toStrictEqual('projectsornamespaces!=ns-exclude');
    });
  });

  describe('checkAndCreateParam', () => {
    it('returns empty string when opt.namespaced is not an array', () => {
      const result = pAndNFiltering.checkAndCreateParam({ namespaced: undefined } as any);

      expect(result).toStrictEqual('');
    });

    it('returns empty string when opt.namespaced is an empty array', () => {
      const result = pAndNFiltering.checkAndCreateParam({ namespaced: [] });

      expect(result).toStrictEqual('');
    });

    it('returns query param when opt.namespaced is a populated array', () => {
      const result = pAndNFiltering.checkAndCreateParam({ namespaced: ['my-namespace'] });

      expect(result).toStrictEqual('projectsornamespaces=my-namespace');
    });

    it('returns query param with prefix stripping for ns:// values', () => {
      const result = pAndNFiltering.checkAndCreateParam({ namespaced: [`${ NAMESPACE_FILTER_NS_FULL_PREFIX }my-namespace`] });

      expect(result).toStrictEqual('projectsornamespaces=my-namespace');
    });
  });
});
