const assert = require('assert');

const {IAmValidatorErrorCode, createValidator} = require('../../lib/v1');

describe('string', () => {
  it('should return string for template of type "string"', done => {
    const validator = createValidator({type: 'string'});

    validator.validate('test', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 'test');

      done();
    });
  });

  it('should return error for template of type "string" when type is incorrect', async () => {
    const validator = createValidator({type: 'string'});

    class Test {}

    for (const value of [true, 1, {}, new Test()]) {
      await new Promise(resolve => {
        validator.validate(value, (err, result) => {
          assert.deepStrictEqual(err, {
            code: IAmValidatorErrorCode.TypeMismatch,
            data: value,
            info: {
              expectedType: 'string'
            },
            path: []
          });
          assert.strictEqual(result, undefined);

          resolve();
        });
      });
    }
  });

  it('should return string for template of type "string" when it satisfies "values" constraint', done => {
    const validator = createValidator({
      type: 'string',
      values: ['test1', 'test2', 'test3']
    });

    validator.validate('test2', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 'test2');

      done();
    });
  });

  it('should return error for template of type "string" when it does not satisfy "values" constraint', done => {
    const validator = createValidator({
      type: 'string',
      values: ['test1', 'test2', 'test3']
    });

    validator.validate('test4', (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.StringNotInValues,
        data: 'test4',
        info: {
          expectedValues: ['test1', 'test2', 'test3']
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return string for template of type "string" when it satisfies "length" constraint', done => {
    const validator = createValidator({
      type: 'string',
      length: 4
    });

    validator.validate('1234', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, '1234');

      done();
    });
  });

  it('should return error for template of type "string" when it does not satisfy "length" constraint', done => {
    const validator = createValidator({
      type: 'string',
      length: 4
    });

    validator.validate('12345', (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidStringLength,
        data: '12345',
        info: {
          expectedLength: 4,
          length: 5
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return string for template of type "string" when it satisfies "minLength" constraint', done => {
    const validator = createValidator({
      type: 'string',
      minLength: 4
    });

    validator.validate('12345', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, '12345');

      done();
    });
  });

  it('should return error for template of type "string" when it does not satisfy "minLength" constraint', done => {
    const validator = createValidator({
      type: 'string',
      minLength: 10
    });

    validator.validate('12345', (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidStringLength,
        data: '12345',
        info: {
          expectedMinLength: 10,
          length: 5
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return string for template of type "string" when it satisfies "maxLength" constraint', done => {
    const validator = createValidator({
      type: 'string',
      maxLength: 10
    });

    validator.validate('12345', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, '12345');

      done();
    });
  });

  it('should return error for template of type "string" when it does not satisfy "maxLength" constraint', done => {
    const validator = createValidator({
      type: 'string',
      maxLength: 4
    });

    validator.validate('12345', (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidStringLength,
        data: '12345',
        info: {
          expectedMaxLength: 4,
          length: 5
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return string for template of type "string" when it satisfies "regexp" constraint', done => {
    const validator = createValidator({
      type: 'string',
      regexp: /^[0-9]+$/
    });

    validator.validate('12345', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, '12345');

      done();
    });
  });

  it('should return error for template of type "string" when it does not satisfy "regexp" constraint', done => {
    const validator = createValidator({
      type: 'string',
      regexp: /^[0-9]+$/
    });

    validator.validate('12test', (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.InvalidString,
        data: '12test',
        info: {},
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return null for template of type "string" null is passed and "isNullable" flag is true', done => {
    const validator = createValidator({
      type: 'string',
      isNullable: true
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of type "string" null is passed and "isNullable" flag is not true', done => {
    const validator = createValidator({type: 'string'});

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
