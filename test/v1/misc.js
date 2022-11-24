const assert = require('assert');

const {createValidator} = require('../../lib/v1');

describe('misc', () => {
  it('should allow using Set for template "values" option', done => {
    const validator = createValidator({
      type: 'boolean',
      values: new Set([true, false])
    });

    validator.validate(false, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, false);

      done();
    });
  });

  it('should use transformBefore if specified', done => {
    const validator = createValidator({
      type: 'number',
      transformBefore: (data, d) => {
        d(null, Number(data));
      }
    });

    validator.validate('123', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 123);

      done();
    });
  });

  it('should use transformAfter if specified', done => {
    const validator = createValidator({
      type: 'string',
      transformAfter: (data, d) => {
        d(null, Number(data));
      }
    });

    validator.validate('123', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 123);

      done();
    });
  });

  it('should return error from validateBefore if specified', done => {
    const validator = createValidator({
      type: 'number',
      validateBefore: (data, d) => {
        d({
          code: 'TEST_ERROR',
          info: {
            testProp: 'testValue'
          }
        });
      }
    });

    validator.validate(5, (err, result) => {
      assert.deepStrictEqual(err, {
        code: 'TEST_ERROR',
        data: 5,
        info: {
          testProp: 'testValue'
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return error from validateAfter if specified', done => {
    const validator = createValidator({
      type: 'number',
      validateAfter: (data, d) => {
        d({
          code: 'TEST_ERROR',
          info: {
            testProp: 'testValue'
          }
        });
      }
    });

    validator.validate(5, (err, result) => {
      assert.deepStrictEqual(err, {
        code: 'TEST_ERROR',
        data: 5,
        info: {
          testProp: 'testValue'
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should allow using context', done => {
    const validator = createValidator({
      type: 'array',
      element: {
        type: 'number',
        validateAfter: (data, d, options) => {
          options.context.total += data;

          d(null, data);
        }
      }
    });

    const context = {
      total: 0
    };

    validator.validate([1, 2, 3], (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, [1, 2, 3]);
      assert.strictEqual(context.total, 6);

      done();
    }, {context});
  });

  it('should allow using path and getData to access source data', done => {
    let test = 0;

    const validator = createValidator({
      type: 'object',
      fields: {
        test: {
          type: 'array',
          element: {
            type: 'number',
            validateAfter: (data, d, {getData, path}) => {
              test += getData(path.slice(0, -2)).sibling * path[path.length - 1];

              d(null, data);
            }
          }
        },
        sibling: {
          type: 'number'
        }
      }
    });

    validator.validate({
      test: [1, 2, 3],
      sibling: 5
    }, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {
        test: [1, 2, 3],
        sibling: 5
      });
      assert.strictEqual(test, 15);

      done();
    });
  });
});
