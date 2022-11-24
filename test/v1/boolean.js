const assert = require('assert');

const {IAmValidatorErrorCode, createValidator} = require('../../lib/v1');

describe('boolean', () => {
  it('should return boolean for template of type "boolean"', done => {
    const validator = createValidator({type: 'boolean'});

    validator.validate(true, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, true);

      done();
    });
  });

  it('should return error for template of type "boolean" when type is incorrect', async () => {
    const validator = createValidator({type: 'boolean'});

    class Test {}

    for (const value of [[], 1, 'test', {}, new Test()]) {
      await new Promise(resolve => {
        validator.validate(value, (err, result) => {
          assert.deepStrictEqual(err, {
            code: IAmValidatorErrorCode.TypeMismatch,
            data: value,
            info: {
              expectedType: 'boolean'
            },
            path: []
          });
          assert.strictEqual(result, undefined);

          resolve();
        });
      });
    }
  });

  it('should return boolean for template of type "boolean" when it satisfies "values" constraint', done => {
    const validator = createValidator({
      type: 'boolean',
      values: [true, false]
    });

    validator.validate(false, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, false);

      done();
    });
  });

  it('should return error for template of type "boolean" when it does not satisfy "values" constraint', done => {
    const validator = createValidator({
      type: 'boolean',
      values: [true]
    });

    validator.validate(false, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.BooleanNotInValues,
        data: false,
        info: {
          expectedValues: [true]
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return null for template of type "boolean" null is passed and "isNullable" flag is true', done => {
    const validator = createValidator({
      type: 'boolean',
      isNullable: true
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of type "boolean" null is passed and "isNullable" flag is not true', done => {
    const validator = createValidator({type: 'boolean'});

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
