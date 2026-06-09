import { SchemaAttributeColumn } from '@shell/plugins/steve/schema';
import { COUNT } from '@shell/config/types';
import {
  rowValueGetter,
  conditionalDepaginate,
  configureConditionalDepaginate,
} from '@shell/store/type-map.utils';

function makeCol(field: string, overrides: Partial<SchemaAttributeColumn> = {}): SchemaAttributeColumn {
  return {
    description: '',
    field,
    format:      '',
    name:        'test-col',
    priority:    0,
    type:        '',
    ...overrides,
  };
}

function makeRootGetters(type: string, count: number | undefined, storeName = 'management') {
  const countsData = count !== undefined ? { summary: { count } } : undefined;

  return {
    currentStore:           () => storeName,
    [`${ storeName }/all`]: (t: string) => (t === COUNT ? [{ counts: { [type]: countsData } }] : []),
  };
}

describe('fx: rowValueGetter', () => {
  it.each([
    {
      desc:     'field starting with a dot prepends $ and returns the path',
      field:    '.metadata.name',
      asFn:     false,
      expected: '$.metadata.name',
    },
    {
      desc:     'field not starting with a dot is returned as-is when no special pattern matches',
      field:    '$.metadata.name',
      asFn:     false,
      expected: '$.metadata.name',
    },
    {
      desc:     'field matching metadata.fields pattern returns dot-notation string when asFn is false',
      field:    '$.metadata.fields[0]',
      asFn:     false,
      expected: 'metadata.fields.0',
    },
    {
      desc:     'field with leading dot matching metadata.fields returns dot-notation string when asFn is false',
      field:    '.metadata.fields[2]',
      asFn:     false,
      expected: 'metadata.fields.2',
    },
    {
      desc:     'field matching metadata.fields[10] returns two-digit index string when asFn is false',
      field:    '$.metadata.fields[10]',
      asFn:     false,
      expected: 'metadata.fields.10',
    },
  ])('returns correct path string for $desc', ({ field, asFn, expected }) => {
    const col = makeCol(field);

    expect(rowValueGetter(col, asFn)).toStrictEqual(expected);
  });

  it('returns a function that accesses metadata.fields by index when asFn is true', () => {
    const col = makeCol('$.metadata.fields[1]');
    const fn = rowValueGetter(col, true);
    const row = { metadata: { fields: ['first', 'second', 'third'] } };

    expect(typeof fn).toStrictEqual('function');
    expect((fn as Function)(row)).toStrictEqual('second');
  });

  it('returns undefined when metadata.fields is absent from the row and asFn is true', () => {
    const col = makeCol('$.metadata.fields[0]');
    const fn = rowValueGetter(col, true);

    expect((fn as Function)({})).toStrictEqual(undefined);
  });

  it('defaults to returning a function (asFn defaults to true)', () => {
    const col = makeCol('$.metadata.fields[0]');
    const result = rowValueGetter(col);

    expect(typeof result).toStrictEqual('function');
  });

  it('rewrites escaped dot notation in json paths', () => {
    const col = makeCol('$.metadata.labels.topology\\.kubernetes\\.io/zone');

    expect(rowValueGetter(col, false)).toStrictEqual('$.metadata.labels.["topology.kubernetes.io/zone"]');
  });

  it('returns non-json-path values unchanged', () => {
    const col = makeCol('metadata.name');

    expect(rowValueGetter(col, false)).toStrictEqual('metadata.name');
  });
});

describe('fx: conditionalDepaginate', () => {
  it.each([
    {
      desc:           'returns false when depaginate is a function and no depaginateArgs provided',
      depaginate:     () => true,
      useArgs:        false,
      expectedResult: false,
    },
    {
      desc:           'returns true when depaginate is boolean true',
      depaginate:     true,
      useArgs:        false,
      expectedResult: true,
    },
    {
      desc:           'returns false when depaginate is boolean false',
      depaginate:     false,
      useArgs:        false,
      expectedResult: false,
    },
  ])('$desc', ({ depaginate, useArgs, expectedResult }) => {
    const args = useArgs ? { ctx: { rootGetters: {} as any }, args: { type: 'pod', opt: {} as any } } : undefined;

    expect(conditionalDepaginate(depaginate as any, args)).toStrictEqual(expectedResult);
  });

  it('calls the depaginate function with depaginateArgs when args are provided', () => {
    const mockFn = jest.fn().mockReturnValue(true);
    const args = {
      ctx:  { rootGetters: {} as any },
      args: { type: 'pod', opt: {} as any },
    };

    expect(conditionalDepaginate(mockFn, args)).toStrictEqual(true);
    expect(mockFn).toHaveBeenCalledWith(args);
  });

  it('calls the depaginate function and returns false when the function returns false', () => {
    const mockFn = jest.fn().mockReturnValue(false);
    const args = {
      ctx:  { rootGetters: {} as any },
      args: { type: 'pod', opt: {} as any },
    };

    expect(conditionalDepaginate(mockFn, args)).toStrictEqual(false);
    expect(mockFn).toHaveBeenCalledWith(args);
  });
});

describe('fx: configureConditionalDepaginate', () => {
  it.each([
    {
      desc:             'returns true when resource count is below maxResourceCount',
      count:            49,
      maxResourceCount: 50,
      isNorman:         false,
      expected:         true,
    },
    {
      desc:             'returns false when resource count equals maxResourceCount',
      count:            50,
      maxResourceCount: 50,
      isNorman:         false,
      expected:         false,
    },
    {
      desc:             'returns false when resource count exceeds maxResourceCount',
      count:            100,
      maxResourceCount: 50,
      isNorman:         false,
      expected:         false,
    },
    {
      desc:             'returns false when resource count is undefined',
      count:            undefined,
      maxResourceCount: 50,
      isNorman:         false,
      expected:         false,
    },
  ])('$desc', ({
    count, maxResourceCount, isNorman, expected
  }) => {
    const type = 'mypod';
    const fn = configureConditionalDepaginate({ maxResourceCount, isNorman });
    const rootGetters = makeRootGetters(type, count) as any;
    const fnArgs = {
      ctx:  { rootGetters },
      args: { type, opt: {} as any },
    };

    expect(fn(fnArgs)).toStrictEqual(expected);
  });

  it('uses the management.cattle.io prefix for norman types', () => {
    const type = 'node';
    const normanType = `management.cattle.io.${ type }`;
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: true });
    const rootGetters = makeRootGetters(normanType, 50) as any;
    const fnArgs = {
      ctx:  { rootGetters },
      args: { type, opt: {} as any },
    };

    expect(fn(fnArgs)).toStrictEqual(true);
  });

  it('returns a function', () => {
    const fn = configureConditionalDepaginate({ maxResourceCount: 100, isNorman: false });

    expect(typeof fn).toStrictEqual('function');
  });
});
