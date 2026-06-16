import { state, getters, mutations, actions } from '../ui-context';

describe('store/ui-context', () => {
  describe('state', () => {
    it('returns initial state with idCounter 0 and empty elements', () => {
      const s = state();

      expect(s).toStrictEqual({ idCounter: 0, elements: {} });
    });
  });

  describe('getters', () => {
    describe('all', () => {
      it('returns empty array when elements is empty', () => {
        const s = state();

        expect(getters.all(s)).toStrictEqual([]);
      });

      it('returns the context of a single element', () => {
        const s = state();
        const context = { tag: 'my-tag', value: 'my-value' };

        s.elements['ctx-0'] = { id: 0, context };

        expect(getters.all(s)).toStrictEqual([context]);
      });

      it('returns contexts sorted alphabetically by tag', () => {
        const s = state();

        s.elements['ctx-0'] = { id: 0, context: { tag: 'zebra', value: 'z' } };
        s.elements['ctx-1'] = { id: 1, context: { tag: 'apple', value: 'a' } };
        s.elements['ctx-2'] = { id: 2, context: { tag: 'mango', value: 'm' } };

        expect(getters.all(s)).toStrictEqual([
          { tag: 'apple', value: 'a' },
          { tag: 'mango', value: 'm' },
          { tag: 'zebra', value: 'z' },
        ]);
      });

      it('sorts elements with empty tags before elements with non-empty tags', () => {
        const s = state();

        s.elements['ctx-0'] = { id: 0, context: { tag: 'beta', value: 'b' } };
        s.elements['ctx-1'] = { id: 1, context: { tag: '', value: 'empty' } };

        const result = getters.all(s);

        expect(result[0]).toStrictEqual({ tag: '', value: 'empty' });
      });

      it('returns all optional context fields', () => {
        const s = state();
        const context = {
          tag:         'full-tag',
          value:       'full-value',
          hookId:      'hook-123',
          description: 'my description',
          icon:        'icon-name',
        };

        s.elements['ctx-0'] = { id: 0, context };

        expect(getters.all(s)).toStrictEqual([context]);
      });
    });
  });

  describe('mutations', () => {
    describe('add', () => {
      it('stores the element in state.elements under its id', () => {
        const s = state();
        const element = { id: 'ctx-0' as any, context: { tag: 'test-tag', value: 'test-val' } };

        mutations.add(s as any, element);

        expect(s.elements['ctx-0']).toStrictEqual(element);
      });
    });

    describe('update', () => {
      it('replaces the context of an existing element', () => {
        const s = state();

        s.elements['ctx-0'] = { id: 0, context: { tag: 'test-tag', value: 'old-value' } };

        const updated = { id: 'ctx-0' as any, context: { tag: 'test-tag', value: 'new-value' } };

        mutations.update(s as any, updated);

        expect(s.elements['ctx-0'].context).toStrictEqual(updated.context);
      });

      it('does not create an entry when id is not in state', () => {
        const s = state();

        mutations.update(s as any, { id: 'ctx-999' as any, context: { tag: 'tag', value: 'val' } });

        expect(s.elements['ctx-999']).toBeUndefined();
      });
    });

    describe('remove', () => {
      it('removes the element from state.elements', () => {
        const s = state();
        const element = { id: 'ctx-0' as any, context: { tag: 'test-tag', value: 'test-val' } };

        s.elements['ctx-0'] = element;

        mutations.remove(s as any, element);

        expect(s.elements['ctx-0']).toBeUndefined();
      });
    });
  });

  describe('actions', () => {
    describe('add', () => {
      it.each([
        {
          desc:    'context value is undefined',
          context: { tag: 'my-tag', value: undefined },
        },
        {
          desc:    'context tag is empty string',
          context: { tag: '', value: 'some-value' },
        },
        {
          desc:    'context is null',
          context: null,
        },
        {
          desc:    'context tag is missing (undefined)',
          context: { value: 'some-value' },
        },
      ])('throws for invalid context: $desc', ({ context }) => {
        const s = state();
        const commit = jest.fn();

        expect(() => actions.add({ commit, state: s }, context as any)).toThrow('[ui-context]');
      });

      it('calls commit with add and the generated id and context', () => {
        const s = state();
        const commit = jest.fn();
        const context = { tag: 'my-tag', value: 'my-value' };

        actions.add({ commit, state: s }, context);

        expect(commit).toHaveBeenCalledWith('add', { id: 'ctx-0', context });
      });

      it('returns the generated id for the new element', () => {
        const s = state();
        const commit = jest.fn();

        const id = actions.add({ commit, state: s }, { tag: 'my-tag', value: 'my-value' });

        expect(id).toStrictEqual('ctx-0');
      });

      it('increments idCounter after each successful add', () => {
        const s = state();
        const commit = jest.fn();

        actions.add({ commit, state: s }, { tag: 'tag-1', value: 'val-1' });
        actions.add({ commit, state: s }, { tag: 'tag-2', value: 'val-2' });

        expect(s.idCounter).toStrictEqual(2);
      });

      it('generates sequential ids across consecutive calls', () => {
        const s = state();
        const commit = jest.fn();

        const id1 = actions.add({ commit, state: s }, { tag: 'tag-1', value: 'val-1' });
        const id2 = actions.add({ commit, state: s }, { tag: 'tag-2', value: 'val-2' });

        expect(id1).toStrictEqual('ctx-0');
        expect(id2).toStrictEqual('ctx-1');
      });
    });

    describe('update', () => {
      it('throws when the element id is not found in state', () => {
        const s = state();
        const commit = jest.fn();

        expect(() => actions.update({ commit, state: s }, { id: 'ctx-99' as any, context: { tag: 't', value: 'v' } })).toThrow('[ui-context]');
      });

      it('calls commit with update and the element', () => {
        const s = state();
        const commit = jest.fn();
        const element = { id: 'ctx-0' as any, context: { tag: 'test-tag', value: 'updated-val' } };

        s.elements['ctx-0'] = { id: 0, context: { tag: 'test-tag', value: 'old-val' } };

        actions.update({ commit, state: s }, element);

        expect(commit).toHaveBeenCalledWith('update', element);
      });
    });

    describe('remove', () => {
      it('throws when the element id is not found in state', () => {
        const s = state();
        const commit = jest.fn();

        expect(() => actions.remove({ commit, state: s }, 'ctx-99' as any)).toThrow('[ui-context]');
      });

      it('calls commit with remove and the matching element object', () => {
        const s = state();
        const commit = jest.fn();
        const element = { id: 0, context: { tag: 'test-tag', value: 'test-val' } };

        s.elements['ctx-0'] = element;

        actions.remove({ commit, state: s }, 'ctx-0' as any);

        expect(commit).toHaveBeenCalledWith('remove', element);
      });
    });
  });
});
