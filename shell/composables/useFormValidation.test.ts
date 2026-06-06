import type { Translation } from '@shell/types/t';
import type { Validator } from '@shell/utils/validators/formRules/index';
import { useFormRules } from './useFormValidation';

const mockT: Translation = (key: string, args?: Record<string, any>) => args ? `${ key }:${ JSON.stringify(args) }` : key;

describe('useFormRules', () => {
  describe('getRules return value based on path lookup', () => {
    it('returns an empty array when no ruleset matches the path', () => {
      const { getRules } = useFormRules(mockT, []);

      expect(getRules('some.unknown.path')).toStrictEqual([]);
    });

    it('returns an empty array when ruleSets is empty', () => {
      const { getRules } = useFormRules(mockT, []);

      expect(getRules('pool.name')).toStrictEqual([]);
    });

    it('returns an empty array when path matches nothing in ruleSets', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required'] }]);

      expect(getRules('pool.quantity')).toStrictEqual([]);
    });

    it('returns an array with the correct number of validators for a matched path', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required', 'noUpperCase'] }]);

      expect(getRules('pool.name')).toHaveLength(2);
    });

    it('returns an array of functions for a matched path', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required'] }]);
      const validators = getRules('pool.name');

      validators.forEach((v) => expect(typeof v).toStrictEqual('function'));
    });
  });

  describe('translation key handling', () => {
    it('uses "Value" as the default display key when no translationKey is provided', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required'] }]);
      const [requiredValidator] = getRules('pool.name');

      const error = requiredValidator(undefined);

      expect(error).toContain('"key":"Value"');
    });

    it('uses the translated translationKey as the display key when provided', () => {
      const { getRules } = useFormRules(
        mockT,
        [{
          path: 'pool.name', rules: ['required'], translationKey: 'generic.name'
        }]
      );
      const [requiredValidator] = getRules('pool.name');

      const error = requiredValidator(undefined);

      expect(error).toContain('"key":"generic.name"');
    });
  });

  describe('validator behaviour', () => {
    it('returned required validator returns undefined for a non-empty string', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required'] }]);
      const [requiredValidator] = getRules('pool.name');

      expect(requiredValidator('hello')).toBeUndefined();
    });

    it('returned required validator returns an error message for undefined', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required'] }]);
      const [requiredValidator] = getRules('pool.name');

      expect(requiredValidator(undefined)).toBeTruthy();
    });

    it('returned required validator returns an error message for an empty string', () => {
      const { getRules } = useFormRules(mockT, [{ path: 'pool.name', rules: ['required'] }]);
      const [requiredValidator] = getRules('pool.name');

      expect(requiredValidator('')).toBeTruthy();
    });
  });

  describe('extraRules merging', () => {
    it('makes extra rules available as named validators', () => {
      const customRule: Validator = (val: any) => (val === 'bad' ? 'not allowed' : undefined);
      const { getRules } = useFormRules(
        mockT,
        [{ path: 'field', rules: ['customRule'] }],
        { customRule }
      );
      const [validator] = getRules('field');

      expect(validator('bad')).toStrictEqual('not allowed');
      expect(validator('good')).toBeUndefined();
    });

    it('extra rules override built-in rules with the same name', () => {
      const alwaysError: Validator = () => 'always an error';
      const { getRules } = useFormRules(
        mockT,
        [{ path: 'field', rules: ['required'] }],
        { required: alwaysError }
      );
      const [validator] = getRules('field');

      expect(validator('any value')).toStrictEqual('always an error');
    });

    it('extra rules can be used alongside built-in rules in the same ruleset', () => {
      const uppercaseOnly: Validator = (val: string) => val !== val.toUpperCase() ? 'must be uppercase' : undefined;
      const { getRules } = useFormRules(
        mockT,
        [{ path: 'field', rules: ['required', 'uppercaseOnly'] }],
        { uppercaseOnly }
      );
      const validators = getRules('field');

      expect(validators).toHaveLength(2);
      expect(validators[0](undefined)).toBeTruthy();
      expect(validators[1]('VALID')).toBeUndefined();
      expect(validators[1]('invalid')).toStrictEqual('must be uppercase');
    });
  });

  describe('unknown rule name', () => {
    it('throws an error for an unknown rule name in non-production environment', () => {
      const savedEnv = process.env.NODE_ENV;

      process.env.NODE_ENV = 'development';

      try {
        const { getRules } = useFormRules(mockT, [{ path: 'field', rules: ['nonExistentRule'] }]);

        expect(() => getRules('field')).toThrow(/Unknown validation rule.*nonExistentRule/);
      } finally {
        process.env.NODE_ENV = savedEnv;
      }
    });
  });

  describe('getRules handles ruleSets with multiple paths independently', () => {
    it('resolves validators for each path independently', () => {
      const customA: Validator = () => 'error-a';
      const customB: Validator = () => 'error-b';
      const { getRules } = useFormRules(
        mockT,
        [
          { path: 'path.a', rules: ['customA'] },
          { path: 'path.b', rules: ['customB'] },
        ],
        { customA, customB }
      );

      const [validatorA] = getRules('path.a');
      const [validatorB] = getRules('path.b');

      expect(validatorA(null)).toStrictEqual('error-a');
      expect(validatorB(null)).toStrictEqual('error-b');
    });
  });
});
