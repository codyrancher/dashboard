import { createHandler, DynamicContentAnnouncementHandlerName } from '../notification-handler';
import { ANNOUNCEMENT_PREFIX } from '../announcement';
import { READ_ANNOUNCEMENTS } from '@shell/store/prefs';
import { NotificationLevel, Notification } from '@shell/types/notifications';

function makeNotification(id: string): Notification {
  return {
    id,
    level:   NotificationLevel.Announcement,
    title:   'Test notification',
    message: 'Test message',
  };
}

function makeStore({
  all = [],
  pref = '',
}: {
  all?: any[];
  pref?: string;
}) {
  const dispatch = jest.fn().mockResolvedValue(undefined);
  const store = {
    getters: {
      'notifications/all': all,
      'prefs/get':         jest.fn().mockReturnValue(pref),
    },
    dispatch,
  };

  return { store, dispatch };
}

describe('createHandler', () => {
  it('returns a handler object with an onReadUpdated method', () => {
    const { store } = makeStore({});
    const handler = createHandler(store);

    expect(typeof handler.onReadUpdated).toStrictEqual('function');
  });
});

describe('DynamicContentAnnouncementHandlerName', () => {
  it('exports the handler name constant', () => {
    expect(DynamicContentAnnouncementHandlerName).toStrictEqual('dc-announcements');
  });
});

describe('onReadUpdated', () => {
  it('does not dispatch when notification id does not start with announcement prefix', async() => {
    const { store, dispatch } = makeStore({});
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification('some-other-notification'), true);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch when notification id is an unrelated prefix', async() => {
    const { store, dispatch } = makeStore({});
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification('ann-123'), true);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('dispatches prefs/set when notification id starts with announcement prefix', async() => {
    const { store, dispatch } = makeStore({ pref: '' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }abc`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'abc' });
  });

  it('adds stripped id to pref when marking as read and pref is empty', async() => {
    const { store, dispatch } = makeStore({ pref: '' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }my-announcement`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'my-announcement' });
  });

  it('adds stripped id to pref when marking as read with existing pref entries', async() => {
    const { store, dispatch } = makeStore({ pref: 'existing-one' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }new-one`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'existing-one,new-one' });
  });

  it('removes stripped id from pref when marking as unread', async() => {
    const { store, dispatch } = makeStore({ pref: 'abc,xyz' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }abc`), false);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'xyz' });
  });

  it('dispatches empty string when removing the only id from pref', async() => {
    const { store, dispatch } = makeStore({ pref: 'abc' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }abc`), false);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: '' });
  });

  it('does not add duplicate id when re-marking already-read notification as read', async() => {
    const { store, dispatch } = makeStore({ pref: 'abc' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }abc`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'abc' });
  });

  it('sorts the resulting ids alphabetically before dispatching', async() => {
    const { store, dispatch } = makeStore({ pref: 'zzz,aaa' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }mmm`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'aaa,mmm,zzz' });
  });

  it('does not change the pref when marking an absent id as unread', async() => {
    const { store, dispatch } = makeStore({ pref: 'abc' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }not-in-list`), false);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'abc' });
  });

  it('uses store getter READ_ANNOUNCEMENTS to retrieve the current pref', async() => {
    const { store } = makeStore({ pref: 'some-value' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }xyz`), true);

    expect(store.getters['prefs/get']).toHaveBeenCalledWith(READ_ANNOUNCEMENTS);
  });

  it('treats a null pref the same as an empty string', async() => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const store = {
      getters: {
        'notifications/all': [],
        'prefs/get':         jest.fn().mockReturnValue(null),
      },
      dispatch,
    };
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }abc`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'abc' });
  });

  it('stores only the id portion after stripping the prefix for a multi-part id', async() => {
    const { store, dispatch } = makeStore({ pref: '' });
    const handler = createHandler(store);

    await handler.onReadUpdated(makeNotification(`${ ANNOUNCEMENT_PREFIX }release-2.8.0-important`), true);

    expect(dispatch).toHaveBeenCalledWith('prefs/set', { key: READ_ANNOUNCEMENTS, value: 'release-2.8.0-important' });
  });
});
