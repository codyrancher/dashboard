import CspAdapterUtils from '@shell/utils/cspAdaptor';
import { CATALOG } from '@shell/config/types';

const mockPaginationEnabled = jest.fn();
const mockCanList = jest.fn();
const mockDispatch = jest.fn();

const mockStore: any = {
  getters: {
    'management/paginationEnabled': mockPaginationEnabled,
    'management/canList':           mockCanList,
  },
  dispatch: mockDispatch,
};

describe('CspAdapterUtils', () => {
  describe('hasCspAdapter', () => {
    it.each([
      {
        desc:     'apps is undefined',
        apps:     undefined as any,
        expected: undefined,
      },
      {
        desc:     'apps is an empty array',
        apps:     [] as any[],
        expected: undefined,
      },
      {
        desc:     'app matches rancher-csp-adapter',
        apps:     [{ metadata: { name: 'rancher-csp-adapter' } }],
        expected: { metadata: { name: 'rancher-csp-adapter' } },
      },
      {
        desc:     'app matches rancher-csp-billing-adapter',
        apps:     [{ metadata: { name: 'rancher-csp-billing-adapter' } }],
        expected: { metadata: { name: 'rancher-csp-billing-adapter' } },
      },
      {
        desc:     'app name does not match',
        apps:     [{ metadata: { name: 'rancher-webhook' } }],
        expected: undefined,
      },
      {
        desc:     'app has no metadata property',
        apps:     [{}],
        expected: undefined,
      },
      {
        desc:     'app metadata name is null',
        apps:     [{ metadata: { name: null } }],
        expected: undefined,
      },
      {
        desc: 'multiple apps, first one matches',
        apps: [
          { metadata: { name: 'rancher-csp-adapter' } },
          { metadata: { name: 'rancher-csp-billing-adapter' } },
        ],
        expected: { metadata: { name: 'rancher-csp-adapter' } },
      },
      {
        desc: 'multiple apps, only second matches',
        apps: [
          { metadata: { name: 'rancher-webhook' } },
          { metadata: { name: 'rancher-csp-billing-adapter' } },
        ],
        expected: { metadata: { name: 'rancher-csp-billing-adapter' } },
      },
    ])('returns correct result when $desc', ({ apps, expected }) => {
      expect(CspAdapterUtils.hasCspAdapter({ $store: mockStore, apps })).toStrictEqual(expected);
    });
  });

  describe('canPagination', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns true when paginationEnabled getter returns true', () => {
      mockPaginationEnabled.mockReturnValue(true);

      expect(CspAdapterUtils.canPagination(mockStore)).toStrictEqual(true);
    });

    it('returns false when paginationEnabled getter returns false', () => {
      mockPaginationEnabled.mockReturnValue(false);

      expect(CspAdapterUtils.canPagination(mockStore)).toStrictEqual(false);
    });

    it('calls paginationEnabled getter with id and context args', () => {
      mockPaginationEnabled.mockReturnValue(false);

      CspAdapterUtils.canPagination(mockStore);

      expect(mockPaginationEnabled).toHaveBeenCalledWith({ id: CATALOG.APP, context: 'branding' });
    });
  });

  describe('fetchCspAdaptorApp', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      CspAdapterUtils.resetState();
    });

    it('returns empty array when canList returns false', async() => {
      mockCanList.mockReturnValue(false);

      const result = await CspAdapterUtils.fetchCspAdaptorApp(mockStore);

      expect(result).toStrictEqual([]);
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('dispatches findAll when pagination is disabled', async() => {
      const apps = [{ metadata: { name: 'rancher-csp-adapter' } }];

      mockCanList.mockReturnValue(true);
      mockPaginationEnabled.mockReturnValue(false);
      mockDispatch.mockResolvedValue(apps);

      const result = await CspAdapterUtils.fetchCspAdaptorApp(mockStore);

      expect(mockDispatch).toHaveBeenCalledWith('management/findAll', { type: CATALOG.APP });
      expect(result).toStrictEqual(apps);
    });

    it('dispatches findPage when pagination is enabled', async() => {
      const apps = [{ metadata: { name: 'rancher-csp-billing-adapter' } }];

      mockCanList.mockReturnValue(true);
      mockPaginationEnabled.mockReturnValue(true);
      mockDispatch.mockResolvedValue({ data: apps });

      const result = await CspAdapterUtils.fetchCspAdaptorApp(mockStore);

      expect(mockDispatch).toHaveBeenCalledWith(
        'management/findPage',
        expect.objectContaining({ type: CATALOG.APP })
      );
      expect(result).toStrictEqual(apps);
    });

    it('uses cached apps on subsequent calls without dispatching again', async() => {
      const apps = [{ metadata: { name: 'rancher-csp-adapter' } }];

      mockCanList.mockReturnValue(true);
      mockPaginationEnabled.mockReturnValue(false);
      mockDispatch.mockResolvedValue(apps);

      await CspAdapterUtils.fetchCspAdaptorApp(mockStore);
      jest.clearAllMocks();

      const result = await CspAdapterUtils.fetchCspAdaptorApp(mockStore);

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(result).toStrictEqual(apps);
    });
  });
});
