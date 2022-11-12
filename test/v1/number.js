const assert = require('assert');

const {IAmValidatorErrorCode, createValidator} = require('../../lib/v1');

describe('number', () => {
  it('should return number for template of type "number"', done => {
    const validator = createValidator({type: 'number'});

    validator.validate(1, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 1);

      done();
    });
  });

  it('should return error for template of type "number" when type is incorrect', async () => {
    const validator = createValidator({type: 'number'});

    class Test {}

    for (const value of [true, [], 'test', {}, new Test()]) {
      await new Promise(resolve => {
        validator.validate(value, (err, result) => {
          assert.deepStrictEqual(err, {
            code: IAmValidatorErrorCode.TypeMismatch,
            data: value,
            info: {
              expectedType: 'number'
            },
            path: []
          });
          assert.strictEqual(result, undefined);

          resolve();
        });
      });
    }
  });

  it('should return number for template of type "number" when it satisfies "values" constraint', done => {
    const validator = createValidator({
      type: 'number',
      values: [1, 2, 3]
    });

    validator.validate(2, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 2);

      done();
    });
  });

  it('should return error for template of type "number" when it does not satisfy "values" constraint', done => {
    const validator = createValidator({
      type: 'number',
      values: [1, 2, 3]
    });

    validator.validate(5, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.NumberNotInValues,
        data: 5,
        info: {
          expectedValues: [1, 2, 3]
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return number for template of type "number" when it satisfies "minValue" constraint', done => {
    const validator = createValidator({
      type: 'number',
      minValue: 10
    });

    validator.validate(12, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 12);

      done();
    });
  });

  it('should return error for template of type "number" when it does not satisfy "minValue" constraint', done => {
    const validator = createValidator({
      type: 'number',
      minValue: 10
    });

    validator.validate(5, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidNumber,
        data: 5,
        info: {
          expectedMinValue: 10
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return number for template of type "number" when it satisfies "maxValue" constraint', done => {
    const validator = createValidator({
      type: 'number',
      maxValue: 100
    });

    validator.validate(99, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 99);

      done();
    });
  });

  it('should return error for template of type "number" when it does not satisfy "maxValue" constraint', done => {
    const validator = createValidator({
      type: 'number',
      maxValue: 100
    });

    validator.validate(101, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidNumber,
        data: 101,
        info: {
          expectedMaxValue: 100
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return number for template of type "number" when it satisfies "isInteger" constraint', done => {
    const validator = createValidator({
      type: 'number',
      isInteger: true
    });

    validator.validate(100, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 100);

      done();
    });
  });

  it('should return error for template of type "number" when it does not satisfy "isInteger" constraint', done => {
    const validator = createValidator({
      type: 'number',
      isInteger: true
    });

    validator.validate(100.1, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.NumberNotInteger,
        data: 100.1,
        info: {},
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return null for template of type "number" null is passed and "isNullable" flag is true', done => {
    const validator = createValidator({
      type: 'number',
      isNullable: true
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of type "number" null is passed and "isNullable" flag is not true', done => {
    const validator = createValidator({type: 'number'});

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
