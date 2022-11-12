const assert = require('assert');

const {IAmValidatorErrorCode, createValidator} = require('../../lib/v1');

describe('class', () => {
  it('should return class instance for template of class type', done => {
    class Test {}

    const validator = createValidator({type: Test});

    validator.validate(new Test(), (err, result) => {
      assert.strictEqual(err, null);
      assert(result instanceof Test);

      done();
    });
  });

  it('should return error for template of class type when type is incorrect', async () => {
    class Test {}

    const validator = createValidator({type: Test});

    for (const value of [true, [], 1, 'test', {}]) {
      await new Promise(resolve => {
        validator.validate(value, (err, result) => {
          assert.deepStrictEqual(err, {
            code: IAmValidatorErrorCode.TypeMismatch,
            data: value,
            info: {
              expectedType: '[class]'
            },
            path: []
          });
          assert.strictEqual(result, undefined);

          resolve();
        });
      });
    }
  });

  it('should return null for template of class type null is passed and "isNullable" flag is true', done => {
    class Test {}

    const validator = createValidator({
      type: Test,
      isNullable: true
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of class type null is passed and "isNullable" flag is not true', done => {
    class Test {}

    const validator = createValidator({type: Test});

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
