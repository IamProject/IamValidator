const assert = require('assert');

const {IAmValidatorErrorCode, createValidator} = require('../../lib/v1');

describe('array', () => {
  it('should return empty array for template of type "array"', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      }
    });

    validator.validate([], (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, []);

      done();
    });
  });

  it('should return error for template of type "array" when type is incorrect', async () => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      }
    });

    class Test {}

    for (const value of [true, 1, 'test', {}, new Test()]) {
      await new Promise(resolve => {
        validator.validate(value, (err, result) => {
          assert.deepStrictEqual(err, {
            code: IAmValidatorErrorCode.TypeMismatch,
            data: value,
            info: {
              expectedType: 'array'
            },
            path: []
          });
          assert.strictEqual(result, undefined);

          resolve();
        });
      });
    }
  });

  it('should return array for template of type "array" when it satisfies "length" constraint', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      length: 2
    });

    validator.validate(['test1', 'test2'], (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, ['test1', 'test2']);

      done();
    });
  });

  it('should return error for template of type "array" when it does not satisfy "length" constraint', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      length: 2
    });

    validator.validate(['test1'], (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidArrayLength,
        data: ['test1'],
        info: {
          expectedLength: 2,
          length: 1
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return array for template of type "array" when it satisfies "minLength" constraint', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      minLength: 2
    });

    validator.validate(['test1', 'test2'], (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, ['test1', 'test2']);

      done();
    });
  });

  it('should return error for template of type "array" when it does not satisfy "minLength" constraint', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      minLength: 2
    });

    validator.validate(['test1'], (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidArrayLength,
        data: ['test1'],
        info: {
          expectedMinLength: 2,
          length: 1
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return array for template of type "array" when it satisfies "maxLength" constraint', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      maxLength: 2
    });

    validator.validate(['test1', 'test2'], (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, ['test1', 'test2']);

      done();
    });
  });

  it('should return error for template of type "array" when it does not satisfy "maxLength" constraint', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      maxLength: 2
    });

    validator.validate(['test1', 'test2', 'test3'], (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidArrayLength,
        data: ['test1', 'test2', 'test3'],
        info: {
          expectedMaxLength: 2,
          length: 3
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return null for template of type "array" null is passed and "isNullable" flag is true', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      },
      isNullable: true
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of type "array" null is passed and "isNullable" flag is not true', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'string'
      }
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
