import {
  state,
  getters,
  mutations,
  actions,
} from '../action-menu';

describe('store: action-menu', () => {
  let s: ReturnType<typeof state>;

  beforeEach(() => {
    s = state();
  });

  describe('state factory', () => {
    it('returns expected default values', () => {
      expect(s).toStrictEqual({
        show:                false,
        resources:           [],
        elem:                null,
        event:               null,
        showPromptRemove:    false,
        showPromptRestore:   false,
        showModal:           false,
        performCallbackData: undefined,
        toRemove:            [],
        toRestore:           [],
        modalData:           {},
      });
    });
  });

  describe('getters', () => {
    describe('optionsArray', () => {
      it('returns empty array when resources is null', () => {
        s.resources = null;
        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when resources is not an array', () => {
        s.resources = 'not-an-array' as any;
        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when resources is empty', () => {
        s.resources = [];
        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns empty array when resource has no availableActions', () => {
        s.resources = [{}] as any;
        expect(getters.optionsArray(s)).toStrictEqual([]);
      });

      it('returns actions from a single resource', () => {
        s.resources = [{
          availableActions: [{
            action: 'delete', enabled: true, label: 'Delete'
          }]
        }] as any;
        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].action).toStrictEqual('delete');
        expect(result[0].enabled).toStrictEqual(true);
      });

      it('marks an action enabled when it is available on all resources', () => {
        s.resources = [
          { availableActions: [{ action: 'edit', enabled: true }] },
          { availableActions: [{ action: 'edit', enabled: true }] },
        ] as any;
        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].enabled).toStrictEqual(true);
      });

      it('marks an action disabled when it is disabled on any resource', () => {
        s.resources = [
          { availableActions: [{ action: 'edit', enabled: true }] },
          { availableActions: [{ action: 'edit', enabled: false }] },
        ] as any;
        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].enabled).toStrictEqual(false);
      });

      it('marks an action enabled when it is missing on some resources (not counted for those resources)', () => {
        // _add is only called per-resource per-action; resources without the action don't decrement available.
        // So an action present and enabled on resource 1 but absent on resource 2 is still enabled.
        s.resources = [
          { availableActions: [{ action: 'promote', enabled: true }] },
          { availableActions: [] },
        ] as any;
        const result = getters.optionsArray(s);

        expect(result).toHaveLength(1);
        expect(result[0].enabled).toStrictEqual(true);
      });

      it('merges actions from multiple resources, deduplicating by action id', () => {
        s.resources = [
          { availableActions: [{ action: 'edit', enabled: true }, { action: 'delete', enabled: true }] },
          { availableActions: [{ action: 'edit', enabled: true }, { action: 'delete', enabled: true }] },
        ] as any;
        const result = getters.optionsArray(s);

        expect(result).toHaveLength(2);
        expect(result.map((r: any) => r.action)).toStrictEqual(['edit', 'delete']);
      });

      it('filters out actions where anyEnabled is never true', () => {
        s.resources = [{ availableActions: [{ action: 'noop', enabled: false }] }] as any;
        const result = getters.optionsArray(s);

        expect(result).toStrictEqual([]);
      });
    });
  });

  describe('mutations', () => {
    describe('show', () => {
      it('sets show=true with elem, event and wraps a single resource in an array', () => {
        const resource = { id: 'r1' };
        const elem = document.createElement('div');
        const event = new Event('click');

        mutations.show(s, {
          resources: resource,
          elem,
          event,
        });

        expect(s.show).toStrictEqual(true);
        expect(s.resources).toStrictEqual([resource]);
        expect(s.elem).toBe(elem);
        expect(s.event).toBe(event);
      });

      it('keeps an array of resources as-is', () => {
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.show(s, {
          resources,
          elem:  null,
          event: null,
        });

        expect(s.resources).toStrictEqual(resources);
      });
    });

    describe('hide', () => {
      it('sets show=false and clears resources and elem', () => {
        s.show = true;
        s.resources = [{ id: 'r1' }] as any;
        s.elem = document.createElement('div') as any;

        mutations.hide(s);

        expect(s.show).toStrictEqual(false);
        expect(s.resources).toBeNull();
        expect(s.elem).toBeNull();
      });
    });

    describe('togglePromptRemove', () => {
      it('hides the prompt and clears toRemove when called with falsy', () => {
        s.showPromptRemove = true;
        s.toRemove = [{ id: 'r1' }] as any;

        mutations.togglePromptRemove(s, null);

        expect(s.showPromptRemove).toStrictEqual(false);
        expect(s.toRemove).toStrictEqual([]);
      });

      it('toggles showPromptRemove from false to true and normalizes a single resource', () => {
        s.showPromptRemove = false;

        mutations.togglePromptRemove(s, { id: 'r1' });

        expect(s.showPromptRemove).toStrictEqual(true);
        expect(s.toRemove).toStrictEqual([{ id: 'r1' }]);
      });

      it('accepts an array of resources', () => {
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.togglePromptRemove(s, resources);

        expect(s.toRemove).toStrictEqual(resources);
      });

      it('toggles showPromptRemove from true to false when called with resources', () => {
        s.showPromptRemove = true;

        mutations.togglePromptRemove(s, { id: 'r1' });

        expect(s.showPromptRemove).toStrictEqual(false);
      });
    });

    describe('togglePromptRestore', () => {
      it('hides the prompt and clears toRestore when called with falsy', () => {
        s.showPromptRestore = true;
        s.toRestore = [{ id: 'r1' }] as any;

        mutations.togglePromptRestore(s, null);

        expect(s.showPromptRestore).toStrictEqual(false);
        expect(s.toRestore).toStrictEqual([]);
      });

      it('toggles showPromptRestore from false to true and normalizes a single resource', () => {
        s.showPromptRestore = false;

        mutations.togglePromptRestore(s, { id: 'r1' });

        expect(s.showPromptRestore).toStrictEqual(true);
        expect(s.toRestore).toStrictEqual([{ id: 'r1' }]);
      });
    });

    describe('togglePromptModal', () => {
      it('hides the modal and sets modalData to null when called with falsy', () => {
        s.showModal = true;

        mutations.togglePromptModal(s, null);

        expect(s.showModal).toStrictEqual(false);
        expect(s.modalData).toBeNull();
      });

      it('sets performCallbackData and hides modal when data has performCallback', () => {
        const data = { performCallback: true, something: 'value' };

        mutations.togglePromptModal(s, data);

        expect(s.performCallbackData).toStrictEqual(data);
        expect(s.showModal).toStrictEqual(false);
        expect(s.modalData).toStrictEqual(data);
      });

      it('shows the modal and sets modalData when data has no performCallback', () => {
        const data = { type: 'confirm', message: 'Are you sure?' };

        mutations.togglePromptModal(s, data);

        expect(s.showModal).toStrictEqual(true);
        expect(s.modalData).toStrictEqual(data);
        expect(s.performCallbackData).toBeUndefined();
      });
    });

    describe('updateModalData', () => {
      it('merges key/value pairs onto existing modalData', () => {
        s.modalData = { existing: 'value' };

        mutations.updateModalData(s, [
          { key: 'newKey', value: 'newValue' },
          { key: 'existing', value: 'updated' },
        ]);

        expect(s.modalData).toStrictEqual({ existing: 'updated', newKey: 'newValue' });
      });

      it('initializes modalData if it is falsy before merging', () => {
        s.modalData = null as any;

        mutations.updateModalData(s, [{ key: 'a', value: 1 }]);

        expect(s.modalData).toStrictEqual({ a: 1 });
      });
    });

    describe('clearCallbackData', () => {
      it('sets performCallbackData to undefined', () => {
        s.performCallbackData = { performCallback: true };

        mutations.clearCallbackData(s);

        expect(s.performCallbackData).toBeUndefined();
      });
    });

    describe('SET_RESOURCE', () => {
      it('wraps a single non-array resource in an array', () => {
        const resource = { id: 'r1' };

        mutations.SET_RESOURCE(s, resource);

        expect(s.resources).toStrictEqual([resource]);
      });

      it('keeps an array of resources as-is', () => {
        const resources = [{ id: 'r1' }, { id: 'r2' }];

        mutations.SET_RESOURCE(s, resources);

        expect(s.resources).toStrictEqual(resources);
      });
    });
  });

  describe('actions', () => {
    describe('execute', () => {
      it('calls action.action on each resource and collects results', async() => {
        const fn1 = jest.fn().mockReturnValue('result1');
        const fn2 = jest.fn().mockReturnValue('result2');
        const resource1 = { doIt: fn1 };
        const resource2 = { doIt: fn2 };

        s.resources = [resource1, resource2] as any;

        const results = await actions.execute(
          { state: s } as any,
          {
            action: { action: 'doIt' }, args: ['arg1'], opts: {}
          }
        );

        expect(fn1).toHaveBeenCalledWith('arg1');
        expect(fn2).toHaveBeenCalledWith('arg1');
        expect(results).toStrictEqual(['result1', 'result2']);
      });

      it('skips resources that do not have the action function', async() => {
        const fn = jest.fn().mockReturnValue('ok');
        const resource1 = { doIt: fn };
        const resource2 = {};

        s.resources = [resource1, resource2] as any;

        const results = await actions.execute(
          { state: s } as any,
          {
            action: { action: 'doIt' }, args: [], opts: {}
          }
        );

        expect(fn).toHaveBeenCalledTimes(1);
        expect(results).toStrictEqual(['ok']);
      });

      it('uses altAction on altResource when opts.alt and action.altAction are set', async() => {
        const altFn = jest.fn().mockReturnValue('alt-result');
        const altResource = { altDoIt: altFn };
        const resource = {
          doIt: jest.fn(), altDoIt: jest.fn(), altResource
        };

        s.resources = [resource] as any;

        const results = await actions.execute(
          { state: s } as any,
          {
            action: {
              action: 'doIt', altAction: 'altDoIt', altResource
            },
            args: [],
            opts: { alt: true },
          }
        );

        expect(altFn).toHaveBeenCalledTimes(1);
        expect(resource.doIt).not.toHaveBeenCalled();
        expect(results).toStrictEqual(['alt-result']);
      });

      it('passes empty args array when args is not provided', async() => {
        const fn = jest.fn().mockReturnValue('ok');
        const resource = { doIt: fn };

        s.resources = [resource] as any;

        await actions.execute(
          { state: s } as any,
          {
            action: { action: 'doIt' }, args: undefined, opts: {}
          }
        );

        expect(fn).toHaveBeenCalledWith();
      });
    });

    describe('setResource', () => {
      it('commits SET_RESOURCE with the provided resource', () => {
        const commit = jest.fn();
        const resource = { id: 'r1' };

        actions.setResource({ commit } as any, resource);

        expect(commit).toHaveBeenCalledWith('SET_RESOURCE', resource);
      });
    });

    describe('clearCallbackData', () => {
      it('commits clearCallbackData', () => {
        const commit = jest.fn();

        actions.clearCallbackData({ commit } as any, undefined);

        expect(commit).toHaveBeenCalledWith('clearCallbackData');
      });
    });
  });
});
