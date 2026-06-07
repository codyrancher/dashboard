import { ref, nextTick } from 'vue';
import { useLabeledSelect } from '@shell/composables/useLabeledSelect';

const mockGetWidth = jest.fn();
const mockSetWidth = jest.fn();

jest.mock('@shell/utils/width', () => ({
  getWidth: (...args: any[]) => mockGetWidth(...args),
  setWidth: (...args: any[]) => mockSetWidth(...args),
}));

describe('useLabeledSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSearchable', () => {
    it.each([
      {
        desc:             'returns true when canPaginate is true regardless of other props',
        props:            { options: [], searchable: false },
        canPaginateValue: true,
        expected:         true,
      },
      {
        desc:             'returns true when searchable prop is true',
        props:            { options: [], searchable: true },
        canPaginateValue: false,
        expected:         true,
      },
      {
        desc:             'returns true when options length is exactly 10',
        props:            { options: Array(10).fill(null), searchable: false },
        canPaginateValue: false,
        expected:         true,
      },
      {
        desc:             'returns true when options length exceeds 10',
        props:            { options: Array(11).fill(null), searchable: false },
        canPaginateValue: false,
        expected:         true,
      },
      {
        desc:             'returns false when options length is 9 and not searchable',
        props:            { options: Array(9).fill(null), searchable: false },
        canPaginateValue: false,
        expected:         false,
      },
      {
        desc:             'returns false when no options prop and not searchable',
        props:            {},
        canPaginateValue: false,
        expected:         false,
      },
    ])('$desc', ({ props, canPaginateValue, expected }) => {
      const canPaginate = ref(canPaginateValue);
      const { isSearchable } = useLabeledSelect(props, canPaginate);

      expect(isSearchable.value).toStrictEqual(expected);
    });
  });

  describe('isFilterable', () => {
    it.each([
      {
        desc:             'returns false when canPaginate is true',
        props:            { filterable: true },
        canPaginateValue: true,
        expected:         false,
      },
      {
        desc:             'returns false when filterable prop is explicitly false',
        props:            { filterable: false },
        canPaginateValue: false,
        expected:         false,
      },
      {
        desc:             'returns true when filterable prop is explicitly true',
        props:            { filterable: true },
        canPaginateValue: false,
        expected:         true,
      },
      {
        desc:             'returns true by default when filterable is not provided',
        props:            {},
        canPaginateValue: false,
        expected:         true,
      },
    ])('$desc', ({ props, canPaginateValue, expected }) => {
      const canPaginate = ref(canPaginateValue);
      const { isFilterable } = useLabeledSelect(props, canPaginate);

      expect(isFilterable.value).toStrictEqual(expected);
    });
  });

  describe('resizeHandler', () => {
    it('sets dropdown width to match select width when dropdown is narrower', async() => {
      const { resizeHandler } = useLabeledSelect({});
      const mockDD = {};
      const mockSelect = { querySelector: jest.fn(() => mockDD) };
      const selectRef = ref(mockSelect as any);

      // first call: getWidth(selectRef.value) → select width
      // second call: getWidth(DD) → dropdown width
      mockGetWidth.mockReturnValueOnce(200).mockReturnValueOnce(100);

      resizeHandler(selectRef);
      await nextTick();

      expect(mockSetWidth).toHaveBeenCalledWith(mockDD, 200);
    });

    it('does not change dropdown width when dropdown is wider than select', async() => {
      const { resizeHandler } = useLabeledSelect({});
      const mockDD = {};
      const mockSelect = { querySelector: jest.fn(() => mockDD) };
      const selectRef = ref(mockSelect as any);

      // first call: getWidth(selectRef.value) → select width
      // second call: getWidth(DD) → dropdown width
      mockGetWidth.mockReturnValueOnce(100).mockReturnValueOnce(200);

      resizeHandler(selectRef);
      await nextTick();

      expect(mockSetWidth).not.toHaveBeenCalled();
    });

    it('does nothing when selectRef value is null', async() => {
      const { resizeHandler } = useLabeledSelect({});
      const selectRef = ref(null);

      resizeHandler(selectRef);
      await nextTick();

      expect(mockGetWidth).not.toHaveBeenCalled();
      expect(mockSetWidth).not.toHaveBeenCalled();
    });
  });
});
