import { ref } from 'vue';
import { useRuntimeFlag } from '@shell/composables/useRuntimeFlag';

const mockVersion = ref('2.12.0');
const mockGetVersionInfo = jest.fn(() => ({ fullVersion: mockVersion.value }));

jest.mock('@shell/utils/version', () => ({ getVersionInfo: (...args: any[]) => mockGetVersionInfo(...args) }));

describe('useRuntimeFlag', () => {
  describe('featureDropdownMenu', () => {
    const { featureDropdownMenu } = useRuntimeFlag({} as any);

    it.each([
      {
        desc:        'version at boundary 2.11.0',
        fullVersion: '2.11.0',
        expected:    true,
      },
      {
        desc:        'version above boundary',
        fullVersion: '2.12.0',
        expected:    true,
      },
      {
        desc:        'v-prefixed version at boundary',
        fullVersion: 'v2.11.0',
        expected:    true,
      },
      {
        desc:        'pre-release version at boundary',
        fullVersion: '2.11.0-rc1',
        expected:    true,
      },
      {
        desc:        'version just below boundary',
        fullVersion: '2.10.9',
        expected:    false,
      },
      {
        desc:        'old version well below boundary',
        fullVersion: '2.0.0',
        expected:    false,
      },
      {
        desc:        'uncoercible dev version string',
        fullVersion: 'dev',
        expected:    false,
      },
      {
        desc:        'unknown version string',
        fullVersion: 'unknown',
        expected:    false,
      },
    ])('returns $expected for $desc', ({ fullVersion, expected }) => {
      mockVersion.value = fullVersion;
      expect(featureDropdownMenu.value).toStrictEqual(expected);
    });
  });
});
