import { addReleaseNotesNotification } from '@shell/utils/release-notes';
import * as versionModule from '@shell/config/version';
import { NotificationLevel } from '@shell/types/notifications';

jest.mock('@shell/config/version', () => ({ getVersionData: jest.fn() }));
jest.mock('@shell/store/prefs', () => ({ READ_WHATS_NEW: 'read-whatsnew' }));

const VERSION = '2.11.0';
const NOTES_URL = 'https://release-notes.example.com';
const mockT = (key: string, vars?: Record<string, any>) => (vars ? `${ key }:${ JSON.stringify(vars) }` : key);

describe('addReleaseNotesNotification', () => {
  let dispatch: jest.Mock;
  let getters: Record<string, any>;

  beforeEach(() => {
    (versionModule.getVersionData as jest.Mock).mockReturnValue({ Version: VERSION });
    dispatch = jest.fn().mockResolvedValue(undefined);
    getters = {
      'notifications/all': [],
      'prefs/get':         (_key: string) => '',
      'i18n/t':            mockT,
      releaseNotesUrl:     NOTES_URL,
    };
  });

  it('dispatches notifications/add when not found and version not previously read', async() => {
    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({
      id:    `release-notes-${ VERSION }`,
      level: NotificationLevel.Info,
    }));
  });

  it('does not dispatch notifications/add when current version notification already exists', async() => {
    getters['notifications/all'] = [{ id: `release-notes-${ VERSION }` }];

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
  });

  it('does not dispatch notifications/add when this version was already read via preference', async() => {
    getters['prefs/get'] = (_key: string) => VERSION;

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
  });

  it('dispatches notifications/remove for an older release-notes notification', async() => {
    const oldId = 'release-notes-2.10.0';

    getters['notifications/all'] = [{ id: oldId }];

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).toHaveBeenCalledWith('notifications/remove', oldId);
  });

  it('dispatches notifications/add after removing an older release-notes notification', async() => {
    getters['notifications/all'] = [{ id: 'release-notes-2.10.0' }];

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: `release-notes-${ VERSION }` }));
  });

  it('removes old notification but skips notifications/add when version was already read', async() => {
    const oldId = 'release-notes-2.10.0';

    getters['notifications/all'] = [{ id: oldId }];
    getters['prefs/get'] = (_key: string) => VERSION;

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).toHaveBeenCalledWith('notifications/remove', oldId);
    expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
  });

  it('ignores notifications without the release-notes prefix', async() => {
    getters['notifications/all'] = [{ id: 'some-other-notification' }];

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).not.toHaveBeenCalledWith('notifications/remove', 'some-other-notification');
    expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: `release-notes-${ VERSION }` }));
  });

  it('dispatches notifications/add with correct notification structure', async() => {
    await addReleaseNotesNotification(dispatch, getters);

    const notification = dispatch.mock.calls.find((c) => c[0] === 'notifications/add')?.[1];

    expect(notification.level).toStrictEqual(NotificationLevel.Info);
    expect(notification.preference).toStrictEqual({ key: 'read-whatsnew', value: VERSION });
    expect(notification.primaryAction).toStrictEqual({
      label:  'landing.whatsNew.link',
      target: NOTES_URL,
    });
  });

  it('strips the pre-release suffix from the version string', async() => {
    (versionModule.getVersionData as jest.Mock).mockReturnValue({ Version: `${ VERSION }-rc1` });

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).toHaveBeenCalledWith('notifications/add', expect.objectContaining({ id: `release-notes-${ VERSION }` }));
  });

  it('removes old notification and does not add when both old and current exist', async() => {
    const oldId = 'release-notes-2.10.0';

    getters['notifications/all'] = [
      { id: oldId },
      { id: `release-notes-${ VERSION }` },
    ];

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).toHaveBeenCalledWith('notifications/remove', oldId);
    expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());
  });

  it('makes no dispatch calls when notifications list is empty and version already read', async() => {
    getters['prefs/get'] = (_key: string) => VERSION;

    await addReleaseNotesNotification(dispatch, getters);

    expect(dispatch).not.toHaveBeenCalled();
  });
});
