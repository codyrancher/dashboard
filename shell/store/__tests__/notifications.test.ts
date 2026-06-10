import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { getters, mutations, state } from '@shell/store/notifications';
import { NotificationLevel } from '@shell/types/notifications';
import type { StoredNotification } from '@shell/types/notifications';

function makeNotification(overrides: Partial<StoredNotification> = {}): StoredNotification {
  return {
    id:      'test-id',
    title:   'Test Notification',
    level:   NotificationLevel.Info,
    read:    false,
    created: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeState(overrides: Record<string, any> = {}) {
  return {
    ...state(),
    localStorageKey: 'test-key',
    userId:          'user-1',
    ...overrides,
  };
}

describe('store: notifications', () => {
  beforeEach(() => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getters', () => {
    describe('visible', () => {
      it.each([
        {
          desc:   'returns all when no notifications are hidden',
          notifs: [
            { id: '1', level: NotificationLevel.Info },
            { id: '2', level: NotificationLevel.Error },
          ],
          expectedCount: 2,
          expectedIds:   ['1', '2'],
        },
        {
          desc:   'filters out hidden notifications',
          notifs: [
            { id: '1', level: NotificationLevel.Info },
            { id: '2', level: NotificationLevel.Hidden },
          ],
          expectedCount: 1,
          expectedIds:   ['1'],
        },
        {
          desc:   'returns empty array when all notifications are hidden',
          notifs: [
            { id: '1', level: NotificationLevel.Hidden },
          ],
          expectedCount: 0,
          expectedIds:   [],
        },
      ])('$desc', ({ notifs, expectedCount, expectedIds }) => {
        const s = makeState({ notifications: notifs.map((n) => makeNotification(n)) });
        const result = getters.visible(s);

        expect(result).toHaveLength(expectedCount);
        expect(result.map((n: any) => n.id)).toStrictEqual(expectedIds);
      });
    });

    describe('hidden', () => {
      it('returns only hidden notifications', () => {
        const s = makeState({
          notifications: [
            makeNotification({ id: '1', level: NotificationLevel.Info }),
            makeNotification({ id: '2', level: NotificationLevel.Hidden }),
          ],
        });

        expect(getters.hidden(s)).toHaveLength(1);
        expect(getters.hidden(s)[0].id).toStrictEqual('2');
      });

      it('returns empty array when no notifications are hidden', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1', level: NotificationLevel.Info })] });

        expect(getters.hidden(s)).toStrictEqual([]);
      });
    });

    describe('unreadCount', () => {
      it.each([
        {
          desc:   'counts only unread non-hidden notifications',
          notifs: [
            {
              id: '1', level: NotificationLevel.Info, read: false
            },
            {
              id: '2', level: NotificationLevel.Info, read: true
            },
            {
              id: '3', level: NotificationLevel.Hidden, read: false
            },
          ],
          expected: 1,
        },
        {
          desc:   'returns 0 when all notifications are read',
          notifs: [
            {
              id: '1', level: NotificationLevel.Info, read: true
            },
            {
              id: '2', level: NotificationLevel.Info, read: true
            },
          ],
          expected: 0,
        },
        {
          desc:     'returns 0 for empty list',
          notifs:   [],
          expected: 0,
        },
        {
          desc:   'counts multiple unread non-hidden notifications',
          notifs: [
            {
              id: '1', level: NotificationLevel.Info, read: false
            },
            {
              id: '2', level: NotificationLevel.Error, read: false
            },
          ],
          expected: 2,
        },
      ])('$desc', ({ notifs, expected }) => {
        const s = makeState({ notifications: notifs.map((n) => makeNotification(n)) });

        expect(getters.unreadCount(s)).toStrictEqual(expected);
      });
    });

    describe('item', () => {
      it('returns notification matching the given id', () => {
        const n = makeNotification({ id: 'abc' });
        const s = makeState({ notifications: [n] });

        expect(getters.item(s)('abc')).toStrictEqual(n);
      });

      it('returns undefined for an id not in the list', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1' })] });

        expect(getters.item(s)('unknown')).toBeUndefined();
      });
    });
  });

  describe('mutations', () => {
    describe('add', () => {
      it('prepends notification to the list', () => {
        const s = makeState({ notifications: [makeNotification({ id: 'existing' })] });

        mutations.add(s, makeNotification({ id: 'new' }));

        expect(s.notifications[0].id).toStrictEqual('new');
        expect(s.notifications).toHaveLength(2);
      });

      it('forces read to false on the stored entry', () => {
        const s = makeState({ notifications: [] });

        mutations.add(s, makeNotification({ id: 'n1' }));

        expect(s.notifications[0].read).toStrictEqual(false);
      });

      it('stamps a created date on the stored entry', () => {
        const s = makeState({ notifications: [] });

        mutations.add(s, makeNotification({ id: 'n1' }));

        expect(s.notifications[0].created).toBeInstanceOf(Date);
      });

      it('logs error and skips adding a notification with a duplicate id', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const s = makeState({ notifications: [makeNotification({ id: 'dup' })] });

        mutations.add(s, makeNotification({ id: 'dup' }));

        expect(s.notifications).toHaveLength(1);
        expect(consoleSpy).toHaveBeenCalledTimes(1);
        consoleSpy.mockRestore();
      });

      it('trims list to 50 by removing the oldest entry when limit is exceeded', () => {
        const existing = Array.from({ length: 50 }, (_, i) => makeNotification({ id: `n${ i }` }));
        const s = makeState({ notifications: existing });

        mutations.add(s, makeNotification({ id: 'newest' }));

        expect(s.notifications).toHaveLength(50);
        expect(s.notifications[0].id).toStrictEqual('newest');
        expect(s.notifications.find((n: StoredNotification) => n.id === 'n49')).toBeUndefined();
      });
    });

    describe('markRead', () => {
      it.each([
        {
          desc:         'marks unread notification as read',
          initialRead:  false,
          expectedRead: true,
        },
        {
          desc:         'leaves already-read notification unchanged',
          initialRead:  true,
          expectedRead: true,
        },
      ])('$desc', ({ initialRead, expectedRead }) => {
        const s = makeState({ notifications: [makeNotification({ id: '1', read: initialRead })] });

        mutations.markRead(s, '1');

        expect(s.notifications[0].read).toStrictEqual(expectedRead);
      });

      it('does nothing for unknown id', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1', read: false })] });

        mutations.markRead(s, 'unknown');

        expect(s.notifications[0].read).toStrictEqual(false);
      });
    });

    describe('markUnread', () => {
      it.each([
        {
          desc:         'marks read notification as unread',
          initialRead:  true,
          expectedRead: false,
        },
        {
          desc:         'leaves already-unread notification unchanged',
          initialRead:  false,
          expectedRead: false,
        },
      ])('$desc', ({ initialRead, expectedRead }) => {
        const s = makeState({ notifications: [makeNotification({ id: '1', read: initialRead })] });

        mutations.markUnread(s, '1');

        expect(s.notifications[0].read).toStrictEqual(expectedRead);
      });
    });

    describe('markAllRead', () => {
      it('marks all visible unread notifications as read', () => {
        const s = makeState({
          notifications: [
            makeNotification({
              id: '1', level: NotificationLevel.Info, read: false
            }),
            makeNotification({
              id: '2', level: NotificationLevel.Error, read: false
            }),
          ],
        });

        mutations.markAllRead(s);

        expect(s.notifications[0].read).toStrictEqual(true);
        expect(s.notifications[1].read).toStrictEqual(true);
      });

      it('does not mark hidden notifications as read', () => {
        const s = makeState({
          notifications: [makeNotification({
            id: '1', level: NotificationLevel.Hidden, read: false
          })]
        });

        mutations.markAllRead(s);

        expect(s.notifications[0].read).toStrictEqual(false);
      });

      it('skips notifications that are already read', () => {
        const s = makeState({
          notifications: [makeNotification({
            id: '1', level: NotificationLevel.Info, read: true
          })]
        });

        mutations.markAllRead(s);

        expect(s.notifications[0].read).toStrictEqual(true);
      });
    });

    describe('update', () => {
      it('updates matching notification by id', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1', title: 'Original' })] });

        mutations.update(s, { id: '1', title: 'Updated' });

        expect(s.notifications[0].title).toStrictEqual('Updated');
      });

      it('preserves unmodified fields when updating', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1', level: NotificationLevel.Info })] });

        mutations.update(s, { id: '1', title: 'Updated' });

        expect(s.notifications[0].level).toStrictEqual(NotificationLevel.Info);
      });

      it('does nothing when id does not match any notification', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1', title: 'Original' })] });

        mutations.update(s, { id: 'missing', title: 'nope' });

        expect(s.notifications[0].title).toStrictEqual('Original');
      });

      it('does nothing when payload has no id', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1', title: 'Original' })] });

        mutations.update(s, { title: 'nope' });

        expect(s.notifications[0].title).toStrictEqual('Original');
      });
    });

    describe('remove', () => {
      it('removes matching notification from list', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1' })] });

        mutations.remove(s, '1');

        expect(s.notifications).toHaveLength(0);
      });

      it('calls localStorage.removeItem with the correct composite key', () => {
        const s = makeState({ localStorageKey: 'k', notifications: [makeNotification({ id: '1' })] });

        mutations.remove(s, '1');

        expect(Storage.prototype.removeItem).toHaveBeenCalledWith('k-1');
      });

      it('does not change list when id is not found', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1' })] });

        mutations.remove(s, 'missing');

        expect(s.notifications).toHaveLength(1);
      });
    });

    describe('clearAll', () => {
      it('empties the notifications list', () => {
        const s = makeState({ notifications: [makeNotification({ id: '1' }), makeNotification({ id: '2' })] });

        mutations.clearAll(s);

        expect(s.notifications).toHaveLength(0);
      });

      it('calls localStorage.removeItem for each notification', () => {
        const s = makeState({
          localStorageKey: 'k',
          notifications:   [makeNotification({ id: '1' }), makeNotification({ id: '2' })],
        });

        mutations.clearAll(s);

        expect(Storage.prototype.removeItem).toHaveBeenCalledWith('k-1');
        expect(Storage.prototype.removeItem).toHaveBeenCalledWith('k-2');
      });
    });

    describe('load', () => {
      it('replaces existing notifications with the supplied list', () => {
        const s = makeState({ notifications: [makeNotification({ id: 'old' })] });
        const newList = [makeNotification({ id: 'new' })];

        mutations.load(s, newList);

        expect(s.notifications).toStrictEqual(newList);
      });
    });

    describe('localStorageKey mutation', () => {
      it('sets localStorageKey with rancher-notifications- prefix', () => {
        const s = makeState();

        mutations.localStorageKey(s, 'abc123');

        expect(s.localStorageKey).toStrictEqual('rancher-notifications-abc123');
      });
    });
  });
});
