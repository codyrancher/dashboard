describe('useI18n', () => {
  let useI18nFn: (store: any) => { t: (key: string, args?: unknown, raw?: boolean) => string };
  let mockStringFor: jest.Mock;

  beforeEach(() => {
    mockStringFor = jest.fn();
    jest.resetModules();
    jest.unmock('@shell/composables/useI18n');
    jest.mock('@shell/plugins/i18n', () => ({ stringFor: mockStringFor }));
    useI18nFn = require('@shell/composables/useI18n').useI18n;
  });

  describe('initialization', () => {
    it('returns an object with a t function when called with a valid store', () => {
      const mockStore = { getters: {} };
      const result = useI18nFn(mockStore);

      expect(typeof result.t).toStrictEqual('function');
    });

    it.each([
      {
        desc:  'null store',
        store: null,
      },
      {
        desc:  'undefined store',
        store: undefined,
      },
    ])('throws when called with $desc', ({ store }) => {
      expect(() => useI18nFn(store)).toThrow('usI18n() must be called from setup()');
    });
  });

  describe('t()', () => {
    it('delegates to stringFor with store, key, args, and raw when store is set', () => {
      const mockStore = { getters: {} };

      mockStringFor.mockReturnValue('translated value');

      const { t } = useI18nFn(mockStore);
      const result = t('my.translation.key', { count: 5 }, true);

      expect(mockStringFor).toHaveBeenCalledWith(mockStore, 'my.translation.key', { count: 5 }, true);
      expect(result).toStrictEqual('translated value');
    });

    it('passes undefined args and raw to stringFor when not supplied', () => {
      const mockStore = { getters: {} };

      mockStringFor.mockReturnValue('plain');

      const { t } = useI18nFn(mockStore);

      t('plain.key');

      expect(mockStringFor).toHaveBeenCalledWith(mockStore, 'plain.key', undefined, undefined);
    });

    it('returns the key when store is null after a failed useI18n call', () => {
      const { t } = useI18nFn({ getters: {} });

      expect(() => useI18nFn(null)).toThrow();

      const result = t('fallback.key');

      expect(mockStringFor).not.toHaveBeenCalled();
      expect(result).toStrictEqual('fallback.key');
    });

    it('logs a console warning when store is null and process.env.dev is set', () => {
      const { t } = useI18nFn({ getters: {} });

      expect(() => useI18nFn(null)).toThrow();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const originalDev = process.env.dev;

      process.env.dev = 'true';

      t('some.key');

      expect(warnSpy).toHaveBeenCalledWith('useI18n: store not available');

      process.env.dev = originalDev;
      warnSpy.mockRestore();
    });

    it('does not log a warning when store is null and process.env.dev is not set', () => {
      const { t } = useI18nFn({ getters: {} });

      expect(() => useI18nFn(null)).toThrow();

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const originalDev = process.env.dev;

      delete process.env.dev;

      t('some.key');

      expect(warnSpy).not.toHaveBeenCalled();

      process.env.dev = originalDev;
      warnSpy.mockRestore();
    });

    it('uses the most recently bound store across multiple useI18n calls', () => {
      const store1 = { id: 'store1' };
      const store2 = { id: 'store2' };

      mockStringFor.mockReturnValue('ok');

      const { t } = useI18nFn(store1);

      useI18nFn(store2);

      t('key');

      expect(mockStringFor).toHaveBeenCalledWith(store2, 'key', undefined, undefined);
    });
  });
});
