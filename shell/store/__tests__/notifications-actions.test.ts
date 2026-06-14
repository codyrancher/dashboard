import {
  describe, it, expect, jest, beforeEach, afterEach
} from '@jest/globals';
import { actions } from '@shell/store/notifications';
import { NotificationLevel } from '@shell/types/notifications';
import type { StoredNotification } from '@shell/types/notifications';
import * as cryptoEncryption from '@shell/utils/crypto/encryption';

jest.mock('@shell/utils/crypto/encryption', () => ({
  deriveKey: jest.fn(),
  decrypt:   jest.fn(),
  encrypt:   jest.fn().mockResolvedValue({ cipher: 'enc', iv: 'iv' }),
}));

jest.mock('@shell/utils/crypto', () => ({ md5: jest.fn().mockReturnValue('mock-hash') }));

const mockDeriveKey = cryptoEncryption.deriveKey as jest.Mock;
const mockDecrypt = cryptoEncryption.decrypt as jest.Mock;

function makeStoredNotification(overrides: Partial<StoredNotification> = {}): StoredNotification {
  return {
    id:      'test-id',
    title:   'Title',
    level:   NotificationLevel.Info,
    read:    false,
    created: new Date(),
    ...overrides,
  };
}

describe('store/notifications actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('markRead action', () => {
    it('commits markRead for a notification without preference or handler', async() => {
      const notification = makeStoredNotification({ id: 'n1' });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markRead.call({}, context, 'n1');

      expect(context.commit).toHaveBeenCalledWith('markRead', 'n1');
      expect(context.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches prefs/set when notification has a preference', async() => {
      const notification = makeStoredNotification({
        id:         'n1',
        preference: {
          key:   'some-pref',
          value: 'on',
        },
      });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markRead.call({}, context, 'n1');

      expect(context.dispatch).toHaveBeenCalledWith(
        'prefs/set',
        notification.preference,
        { root: true }
      );
    });

    it('does not dispatch prefs/set when notification is not found', async() => {
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(undefined),
        },
      };

      await actions.markRead.call({}, context, 'missing-id');

      expect(context.commit).toHaveBeenCalledWith('markRead', 'missing-id');
      expect(context.dispatch).not.toHaveBeenCalled();
    });

    it('invokes extension handler with read=true when notification has a handlerName', async() => {
      const mockOnReadUpdated = jest.fn().mockResolvedValue(undefined);
      const mockExtension = { getDynamic: jest.fn().mockReturnValue({ onReadUpdated: mockOnReadUpdated }) };
      const notification = makeStoredNotification({ id: 'n1', handlerName: 'my-handler' });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markRead.call({ $extension: mockExtension }, context, 'n1');

      expect(mockExtension.getDynamic).toHaveBeenCalledWith('notification-handler', 'my-handler');
      expect(mockOnReadUpdated).toHaveBeenCalledWith(notification, true);
    });
  });

  describe('markUnread action', () => {
    it('commits markUnread for a notification without preference or handler', async() => {
      const notification = makeStoredNotification({ id: 'n1' });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markUnread.call({}, context, 'n1');

      expect(context.commit).toHaveBeenCalledWith('markUnread', 'n1');
      expect(context.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches prefs/set with unsetValue when set', async() => {
      const notification = makeStoredNotification({
        id:         'n1',
        preference: {
          key:        'some-pref',
          value:      'on',
          unsetValue: 'off',
        },
      });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markUnread.call({}, context, 'n1');

      expect(context.dispatch).toHaveBeenCalledWith(
        'prefs/set',
        {
          key:   'some-pref',
          value: 'off',
        },
        { root: true }
      );
    });

    it('dispatches prefs/set with empty string when unsetValue is not set', async() => {
      const notification = makeStoredNotification({
        id:         'n1',
        preference: {
          key:   'some-pref',
          value: 'on',
        },
      });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markUnread.call({}, context, 'n1');

      expect(context.dispatch).toHaveBeenCalledWith(
        'prefs/set',
        {
          key:   'some-pref',
          value: '',
        },
        { root: true }
      );
    });

    it('invokes extension handler with read=false when notification has a handlerName', async() => {
      const mockOnReadUpdated = jest.fn().mockResolvedValue(undefined);
      const mockExtension = { getDynamic: jest.fn().mockReturnValue({ onReadUpdated: mockOnReadUpdated }) };
      const notification = makeStoredNotification({ id: 'n1', handlerName: 'my-handler' });
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          item:   jest.fn().mockReturnValue(notification),
        },
      };

      await actions.markUnread.call({ $extension: mockExtension }, context, 'n1');

      expect(mockOnReadUpdated).toHaveBeenCalledWith(notification, false);
    });
  });

  describe('markAllRead action', () => {
    it('commits markAllRead and dispatches nothing when no notifications have preferences or handlers', async() => {
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  { userId: 'user-1', all: [makeStoredNotification({ id: 'n1' })] },
      };

      await actions.markAllRead.call({}, context);

      expect(context.commit).toHaveBeenCalledWith('markAllRead');
      expect(context.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches prefs/set for each notification that has a preference', async() => {
      const notifications = [
        makeStoredNotification({ id: 'n1', preference: { key: 'k1', value: 'v1' } }),
        makeStoredNotification({ id: 'n2', preference: { key: 'k2', value: 'v2' } }),
        makeStoredNotification({ id: 'n3' }),
      ];
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          all:    notifications,
        },
      };

      await actions.markAllRead.call({}, context);

      expect(context.dispatch).toHaveBeenCalledTimes(2);
      expect(context.dispatch).toHaveBeenCalledWith('prefs/set', { key: 'k1', value: 'v1' }, { root: true });
      expect(context.dispatch).toHaveBeenCalledWith('prefs/set', { key: 'k2', value: 'v2' }, { root: true });
    });

    it('invokes handler for each notification that has a handlerName', async() => {
      const mockOnReadUpdated = jest.fn().mockResolvedValue(undefined);
      const mockExtension = { getDynamic: jest.fn().mockReturnValue({ onReadUpdated: mockOnReadUpdated }) };
      const notifications = [
        makeStoredNotification({ id: 'n1', handlerName: 'h1' }),
        makeStoredNotification({ id: 'n2', handlerName: 'h2' }),
        makeStoredNotification({ id: 'n3' }),
      ];
      const context = {
        commit:   jest.fn(),
        dispatch: jest.fn(),
        getters:  {
          userId: 'user-1',
          all:    notifications,
        },
      };

      await actions.markAllRead.call({ $extension: mockExtension }, context);

      expect(mockOnReadUpdated).toHaveBeenCalledTimes(2);
      expect(mockOnReadUpdated).toHaveBeenCalledWith(notifications[0], true);
      expect(mockOnReadUpdated).toHaveBeenCalledWith(notifications[1], true);
    });
  });

  describe('init action', () => {
    const mockBc: { onmessage: any; postMessage: jest.Mock } = {
      onmessage:   null,
      postMessage: jest.fn(),
    };

    beforeEach(() => {
      (global as any).BroadcastChannel = jest.fn().mockReturnValue(mockBc);
      mockBc.onmessage = null;
    });

    it('returns early and logs error when userKey is falsy', async() => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: '' },
      };

      await actions.init(context, { id: '', user: { metadata: { uid: 'uid-1' } } });

      expect(context.commit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('returns early and logs error when userId is falsy', async() => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: '' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: '' } } });

      expect(context.commit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });

    it('returns early and logs error when deriveKey throws', async() => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockDeriveKey.mockRejectedValueOnce(new Error('crypto error'));

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      expect(context.commit).toHaveBeenCalledWith('localStorageKey', 'mock-hash');
      expect(context.commit).toHaveBeenCalledWith('userId', 'uid-1');
      expect(consoleSpy).toHaveBeenCalledWith('Unable to generate encryption key for notifications', expect.any(Error));
    });

    it('commits localStorageKey, userId, encryptionKey and loads empty list when localStorage is empty', async() => {
      const mockKey = {} as CryptoKey;

      mockDeriveKey.mockResolvedValueOnce(mockKey);

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      localStorage.setItem('rancher-notifications-mock-hash', '[]');

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      expect(context.commit).toHaveBeenCalledWith('localStorageKey', 'mock-hash');
      expect(context.commit).toHaveBeenCalledWith('userId', 'uid-1');
      expect(context.commit).toHaveBeenCalledWith('encryptionKey', mockKey);
      expect(context.commit).toHaveBeenCalledWith('load', []);
    });

    it('decrypts and loads notifications from localStorage', async() => {
      const mockKey = {} as CryptoKey;

      mockDeriveKey.mockResolvedValueOnce(mockKey);

      const decryptedPayload = {
        title:   'Loaded Title',
        level:   NotificationLevel.Info,
        message: 'Loaded message',
      };

      mockDecrypt.mockResolvedValueOnce(JSON.stringify(decryptedPayload));

      const indexEntry = {
        id:      'n1',
        created: new Date().toISOString(),
        read:    false,
      };

      localStorage.setItem('rancher-notifications-mock-hash', JSON.stringify([indexEntry]));
      localStorage.setItem('rancher-notifications-mock-hash-n1', JSON.stringify({ cipher: 'enc', iv: 'iv' }));

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      const loadCall = (context.commit as jest.Mock).mock.calls.find(([m]) => m === 'load');

      expect(loadCall).toBeDefined();
      const loaded = loadCall![1] as any[];

      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toStrictEqual('n1');
      expect(loaded[0].title).toStrictEqual('Loaded Title');
    });

    it('filters out notifications that are older than the expiry period', async() => {
      const mockKey = {} as CryptoKey;

      mockDeriveKey.mockResolvedValueOnce(mockKey);

      const decryptedPayload = { title: 'Old', level: NotificationLevel.Info };

      mockDecrypt.mockResolvedValueOnce(JSON.stringify(decryptedPayload));

      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const indexEntry = {
        id:      'old-n',
        created: fifteenDaysAgo.toISOString(),
        read:    false,
      };

      localStorage.setItem('rancher-notifications-mock-hash', JSON.stringify([indexEntry]));
      localStorage.setItem('rancher-notifications-mock-hash-old-n', JSON.stringify({ cipher: 'enc', iv: 'iv' }));

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      const loadCall = (context.commit as jest.Mock).mock.calls.find(([m]) => m === 'load');

      expect(loadCall![1]).toHaveLength(0);
    });

    it('skips notifications where decryption fails and logs error', async() => {
      const mockKey = {} as CryptoKey;

      mockDeriveKey.mockResolvedValueOnce(mockKey);
      mockDecrypt.mockRejectedValueOnce(new Error('decrypt error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const indexEntry = {
        id:      'n1',
        created: new Date().toISOString(),
        read:    false,
      };

      localStorage.setItem('rancher-notifications-mock-hash', JSON.stringify([indexEntry]));
      localStorage.setItem('rancher-notifications-mock-hash-n1', JSON.stringify({ cipher: 'enc', iv: 'iv' }));

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      const loadCall = (context.commit as jest.Mock).mock.calls.find(([m]) => m === 'load');

      expect(loadCall![1]).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith('Unable to decrypt notification data', expect.any(Error));
    });

    it('commits operation from BroadcastChannel message when userId matches', async() => {
      const mockKey = {} as CryptoKey;

      mockDeriveKey.mockResolvedValueOnce(mockKey);
      localStorage.setItem('rancher-notifications-mock-hash', '[]');

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      (context.commit as jest.Mock).mockClear();

      mockBc.onmessage({
        data: {
          operation: 'markRead', param: 'n1', userId: 'uid-1'
        }
      });

      expect(context.commit).toHaveBeenCalledWith('markRead', 'n1');
    });

    it('ignores BroadcastChannel messages where userId does not match', async() => {
      const mockKey = {} as CryptoKey;

      mockDeriveKey.mockResolvedValueOnce(mockKey);
      localStorage.setItem('rancher-notifications-mock-hash', '[]');

      const context = {
        commit:  jest.fn(),
        getters: { localStorageKey: 'rancher-notifications-mock-hash' },
      };

      await actions.init(context, { id: 'user123', user: { metadata: { uid: 'uid-1' } } });

      (context.commit as jest.Mock).mockClear();

      mockBc.onmessage({
        data: {
          operation: 'markRead', param: 'n1', userId: 'different-user'
        }
      });

      expect(context.commit).not.toHaveBeenCalled();
    });
  });
});
