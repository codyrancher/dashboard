import {
  state,
  getters,
  mutations,
  actions,
} from '@shell/store/growl';
import { NotificationLevel } from '@shell/types/notifications';

describe('store: growl', () => {
  describe('state', () => {
    it('returns fresh initial state', () => {
      expect(state()).toStrictEqual({ nextId: 1, stack: [] });
    });

    it('returns independent state instances', () => {
      const s1 = state();
      const s2 = state();

      s1.stack.push({ id: 99, started: 0 } as any);
      expect(s2.stack).toStrictEqual([]);
    });
  });

  describe('getters', () => {
    describe('find', () => {
      it('returns item matching key-val pair', () => {
        const s = state();

        s.stack = [
          { id: 1, color: 'success' },
          { id: 2, color: 'error' },
        ] as any[];
        const result = getters.find(s)({ key: 'color', val: 'error' });

        expect(result).toStrictEqual({ id: 2, color: 'error' });
      });

      it('returns undefined when no item matches', () => {
        const s = state();

        s.stack = [{ id: 1, color: 'info' }] as any[];
        const result = getters.find(s)({ key: 'color', val: 'warning' });

        expect(result).toBeUndefined();
      });
    });

    describe('byId', () => {
      it('returns item with matching id', () => {
        const s = state();

        s.stack = [{ id: 1 }, { id: 2 }] as any[];
        const result = getters.byId(s)(2);

        expect(result).toStrictEqual({ id: 2 });
      });

      it('returns undefined for unknown id', () => {
        const s = state();

        s.stack = [{ id: 1 }] as any[];
        const result = getters.byId(s)(99);

        expect(result).toBeUndefined();
      });
    });
  });

  describe('mutations', () => {
    describe('add', () => {
      it('prepends item to stack with auto-incremented id and started timestamp', () => {
        const s = state();
        const before = Date.now();

        mutations.add(s, { color: 'success', title: 'Done' });

        const after = Date.now();

        expect(s.stack).toHaveLength(1);
        expect(s.stack[0].id).toStrictEqual(1);
        expect(s.stack[0].color).toStrictEqual('success');
        expect(s.stack[0].title).toStrictEqual('Done');
        expect(s.stack[0].started).toBeGreaterThanOrEqual(before);
        expect(s.stack[0].started).toBeLessThanOrEqual(after);
        expect(s.nextId).toStrictEqual(2);
      });

      it('increments id on successive adds', () => {
        const s = state();

        mutations.add(s, { color: 'info' });
        mutations.add(s, { color: 'warning' });

        expect(s.stack[0].id).toStrictEqual(2);
        expect(s.stack[1].id).toStrictEqual(1);
        expect(s.nextId).toStrictEqual(3);
      });

      it('newest item is at front of stack', () => {
        const s = state();

        mutations.add(s, { title: 'first' });
        mutations.add(s, { title: 'second' });

        expect(s.stack[0].title).toStrictEqual('second');
        expect(s.stack[1].title).toStrictEqual('first');
      });

      it('pops the oldest (last) item when stack is at max capacity of 5', () => {
        const s = state();

        for (let i = 0; i < 5; i++) {
          mutations.add(s, { title: `growl-${ i + 1 }` });
        }
        expect(s.stack).toHaveLength(5);
        const idOfOldest = s.stack[4].id;

        mutations.add(s, { title: 'newest' });

        expect(s.stack).toHaveLength(5);
        expect(s.stack[0].title).toStrictEqual('newest');
        expect(s.stack.find((item) => item.id === idOfOldest)).toBeUndefined();
      });

      it('does not remove items when stack is below max capacity', () => {
        const s = state();

        for (let i = 0; i < 4; i++) {
          mutations.add(s, { title: `growl-${ i + 1 }` });
        }
        expect(s.stack).toHaveLength(4);

        mutations.add(s, { title: 'fifth' });
        expect(s.stack).toHaveLength(5);
      });
    });

    describe('remove', () => {
      it('removes item with the given id from stack', () => {
        const s = state();

        mutations.add(s, { title: 'first' });
        mutations.add(s, { title: 'second' });
        const idToRemove = s.stack[1].id;

        mutations.remove(s, idToRemove);

        expect(s.stack).toHaveLength(1);
        expect(s.stack[0].title).toStrictEqual('second');
      });

      it('is a no-op when id is not in stack', () => {
        const s = state();

        mutations.add(s, { title: 'only' });
        mutations.remove(s, 999);

        expect(s.stack).toHaveLength(1);
      });
    });

    describe('clear', () => {
      it('empties the stack', () => {
        const s = state();

        mutations.add(s, { title: 'a' });
        mutations.add(s, { title: 'b' });
        mutations.clear(s);

        expect(s.stack).toHaveLength(0);
      });

      it('is safe on an already-empty stack', () => {
        const s = state();

        mutations.clear(s);
        expect(s.stack).toHaveLength(0);
      });
    });
  });

  describe('actions', () => {
    describe('close', () => {
      it('removes the growl by id', async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const growl = { id: 5 };
        const byId = jest.fn(() => growl);
        const ctx = {
          commit, dispatch, getters: { byId }
        };

        await (actions.close as any)(ctx, 5);

        expect(commit).toHaveBeenCalledWith('remove', 5);
      });

      it('dispatches notifications/markRead when growl has a notification', async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const notificationId = 'notif-42';
        const growl = { id: 5, notification: notificationId };
        const byId = jest.fn(() => growl);
        const ctx = {
          commit, dispatch, getters: { byId }
        };

        await (actions.close as any)(ctx, 5);

        expect(dispatch).toHaveBeenCalledWith(
          'notifications/markRead',
          notificationId,
          { root: true }
        );
      });

      it('does not dispatch notifications/markRead when growl has no notification', async() => {
        const commit = jest.fn();
        const dispatch = jest.fn();
        const growl = { id: 5 };
        const byId = jest.fn(() => growl);
        const ctx = {
          commit, dispatch, getters: { byId }
        };

        await (actions.close as any)(ctx, 5);

        expect(dispatch).not.toHaveBeenCalled();
      });
    });

    describe('notification', () => {
      it.each([
        {
          desc:          'success level',
          level:         NotificationLevel.Success,
          expectedColor: 'success',
          expectedIcon:  'checkmark',
        },
        {
          desc:          'warning level',
          level:         NotificationLevel.Warning,
          expectedColor: 'warning',
          expectedIcon:  'warning',
        },
        {
          desc:          'error level',
          level:         NotificationLevel.Error,
          expectedColor: 'error',
          expectedIcon:  'error',
        },
      ])('commits add for $desc', ({ level, expectedColor, expectedIcon }) => {
        const commit = jest.fn();
        const notification = {
          id:      'n-1',
          title:   'Test',
          message: 'msg',
          level,
        };

        (actions.notification as any)({ commit }, notification);

        expect(commit).toHaveBeenCalledWith('add', {
          title:        notification.title,
          message:      notification.message,
          notification: notification.id,
          timeout:      5000,
          color:        expectedColor,
          icon:         expectedIcon,
        });
      });

      it.each([
        {
          desc:  'announcement level',
          level: NotificationLevel.Announcement,
        },
        {
          desc:  'task level',
          level: NotificationLevel.Task,
        },
        {
          desc:  'info level',
          level: NotificationLevel.Info,
        },
        {
          desc:  'hidden level',
          level: NotificationLevel.Hidden,
        },
      ])('does not commit add for $desc', ({ level }) => {
        const commit = jest.fn();
        const notification = {
          id:      'n-2',
          title:   'Skip me',
          message: 'msg',
          level,
        };

        (actions.notification as any)({ commit }, notification);

        expect(commit).not.toHaveBeenCalled();
      });
    });
  });
});
