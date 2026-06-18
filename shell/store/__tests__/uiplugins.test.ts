import { state, getters, mutations } from '../uiplugins';

/** Minimal stub with only the properties used by the store */
interface PluginStub {
  name: string;
}

function makeState() {
  return state();
}

describe('uiplugins store', () => {
  describe('state', () => {
    it('returns empty plugins array', () => {
      expect(makeState().plugins).toStrictEqual([]);
    });

    it('returns empty errors object', () => {
      expect(makeState().errors).toStrictEqual({});
    });

    it('returns ready as false', () => {
      expect(makeState().ready).toStrictEqual(false);
    });

    it('returns a fresh copy on each call', () => {
      const s1 = makeState();
      const s2 = makeState();

      s1.plugins.push({ name: 'a' } as any);
      expect(s2.plugins).toStrictEqual([]);
    });
  });

  describe('getters', () => {
    it('plugins returns state.plugins', () => {
      const s = makeState();
      const plugin = { name: 'foo' } as any;

      s.plugins.push(plugin);
      expect(getters.plugins(s)).toStrictEqual([plugin]);
    });

    it('errors returns state.errors', () => {
      const s = makeState();

      s.errors['bar'] = true;
      expect(getters.errors(s)).toStrictEqual({ bar: true });
    });

    it('ready returns state.ready', () => {
      const s = makeState();

      s.ready = true;
      expect(getters.ready(s)).toStrictEqual(true);
    });
  });

  describe('mutations.setError', () => {
    it('adds a new error entry by name', () => {
      const s = makeState();

      mutations.setError(s, { name: 'my-plugin', error: true });
      expect(s.errors['my-plugin']).toStrictEqual(true);
    });

    it('stores a falsy error value (no error cleared)', () => {
      const s = makeState();

      mutations.setError(s, { name: 'my-plugin', error: false });
      expect(s.errors['my-plugin']).toStrictEqual(false);
    });

    it('overwrites an existing error entry', () => {
      const s = makeState();

      mutations.setError(s, { name: 'plug', error: true });
      mutations.setError(s, { name: 'plug', error: false });
      expect(s.errors['plug']).toStrictEqual(false);
    });

    it('stores errors for distinct names independently', () => {
      const s = makeState();

      mutations.setError(s, { name: 'a', error: true });
      mutations.setError(s, { name: 'b', error: false });
      expect(s.errors).toStrictEqual({ a: true, b: false });
    });
  });

  describe('mutations.addPlugin', () => {
    it('appends a plugin to an empty list', () => {
      const s = makeState();
      const plugin: PluginStub = { name: 'alpha' };

      mutations.addPlugin(s, plugin as any);
      expect(s.plugins).toStrictEqual([plugin]);
    });

    it('appends a plugin to an existing list', () => {
      const s = makeState();
      const first: PluginStub = { name: 'first' };
      const second: PluginStub = { name: 'second' };

      mutations.addPlugin(s, first as any);
      mutations.addPlugin(s, second as any);
      expect(s.plugins).toStrictEqual([first, second]);
    });
  });

  describe('mutations.removePlugin', () => {
    it('removes a plugin whose name matches', () => {
      const s = makeState();
      const plugin: PluginStub = { name: 'target' };

      mutations.addPlugin(s, plugin as any);
      mutations.removePlugin(s, 'target');
      expect(s.plugins).toStrictEqual([]);
    });

    it('does nothing when no plugin with the given name exists', () => {
      const s = makeState();
      const plugin: PluginStub = { name: 'present' };

      mutations.addPlugin(s, plugin as any);
      mutations.removePlugin(s, 'absent');
      expect(s.plugins).toStrictEqual([plugin]);
    });

    it('removes only the matching plugin when multiple are present', () => {
      const s = makeState();
      const a: PluginStub = { name: 'a' };
      const b: PluginStub = { name: 'b' };
      const c: PluginStub = { name: 'c' };

      mutations.addPlugin(s, a as any);
      mutations.addPlugin(s, b as any);
      mutations.addPlugin(s, c as any);
      mutations.removePlugin(s, 'b');
      expect(s.plugins).toStrictEqual([a, c]);
    });

    it('removes the first occurrence when names are duplicated', () => {
      const s = makeState();
      const first: PluginStub = { name: 'dup' };
      const second: PluginStub = { name: 'dup' };

      mutations.addPlugin(s, first as any);
      mutations.addPlugin(s, second as any);
      mutations.removePlugin(s, 'dup');
      expect(s.plugins).toStrictEqual([second]);
    });
  });

  describe('mutations.setReady', () => {
    it('sets ready to true', () => {
      const s = makeState();

      mutations.setReady(s, true);
      expect(s.ready).toStrictEqual(true);
    });

    it('sets ready to false', () => {
      const s = makeState();

      s.ready = true;
      mutations.setReady(s, false);
      expect(s.ready).toStrictEqual(false);
    });
  });
});
