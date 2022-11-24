const assert = require('assert');

const {ExtraStrategy, IAmValidatorErrorCode, MissingStrategy, createValidator} = require('../../lib/v1');

describe('object', () => {
  it('should return empty object for template of type "object" with empty "fields"', done => {
    const validator = createValidator({
      type: 'object',
      fields: {}
    });

    validator.validate({}, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {});

      done();
    });
  });

  it('should return error for template of type "object" when type is incorrect', async () => {
    const validator = createValidator({
      type: 'object',
      fields: {}
    });

    // NOTE: Technically any instance of a class is also instance of an Object.
    // There is no reliable way to check that an object is an instance of some class or not

    for (const value of [true, [], 1, 'test']) {
      await new Promise(resolve => {
        validator.validate(value, (err, result) => {
          assert.deepStrictEqual(err, {
            code: IAmValidatorErrorCode.TypeMismatch,
            data: value,
            info: {
              expectedType: 'object'
            },
            path: []
          });
          assert.strictEqual(result, undefined);

          resolve();
        });
      });
    }
  });

  it('should return object with fields for template of type "object" with non-empty "fields"', done => {
    const validator = createValidator({
      type: 'object',
      fields: {
        test: {
          type: 'string'
        }
      }
    });

    validator.validate({test: '123'}, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {
        test: '123'
      });

      done();
    });
  });

  it('should return error for template of type "object" when field is missing', done => {
    const validator = createValidator({
      type: 'object',
      fields: {
        test: {
          type: 'string'
        }
      }
    });

    validator.validate({}, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.MissingField,
        info: {},
        path: ['test']
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return empty object for template of type "object" when field is missing and "missingStrategy" is "ignore"', done => {
    const validator = createValidator({
      type: 'object',
      fields: {
        test: {
          type: 'string',
          missingStrategy: MissingStrategy.Ignore
        }
      }
    });

    validator.validate({}, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {});

      done();
    });
  });

  it('should return object with default field for template of type "object" when field is missing and "missingStrategy" is "default"', done => {
    const validator = createValidator({
      type: 'object',
      fields: {
        test: {
          type: 'string',
          missingStrategy: MissingStrategy.Default,
          defaultValue: '123'
        }
      }
    });

    validator.validate({}, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {test: '123'});

      done();
    });
  });

  it('should return error for template of type "object" with extra fields', done => {
    const validator = createValidator({
      type: 'object',
      fields: {}
    });

    validator.validate({test: '123'}, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.ExtraFields,
        data: {
          test: '123'
        },
        info: {
          fieldNames: ['test']
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return object with fields for template of type "object" with extra "fields" and "extraStrategy" set to "include"', done => {
    const validator = createValidator({
      type: 'object',
      fields: {},
      extraStrategy: ExtraStrategy.Include
    });

    validator.validate({test: '123'}, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {
        test: '123'
      });

      done();
    });
  });

  it('should return empty object for template of type "object" with extra "fields" and "extraStrategy" set to "exclude"', done => {
    const validator = createValidator({
      type: 'object',
      fields: {},
      extraStrategy: ExtraStrategy.Exclude
    });

    validator.validate({test: '123'}, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {});

      done();
    });
  });

  it('should return null for template of type "object" null is passed and "isNullable" flag is true', done => {
    const validator = createValidator({
      type: 'object',
      fields: {},
      isNullable: true
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of type "object" null is passed and "isNullable" flag is not true', done => {
    const validator = createValidator({
      type: 'object',
      fields: {}
    });

    validator.validate(null, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.UnallowedNull,
        data: null,
        info: {},
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });
});
