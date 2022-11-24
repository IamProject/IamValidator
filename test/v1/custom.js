const assert = require('assert');

const {createValidator} = require('../../lib/v1');

describe('custom', () => {
  it('should use custom type validator if specified', done => {
    class Test {
      constructor(test) {
        this.test = test;
      }
    }

    const validator = createValidator({
      type: Test
    }, {
      customTypes: [{
        type: 'test',
        basicType: Test,
        validate: (data, d) => {
          d(null, data);
        }
      }]
    });

    let test = new Test('123');

    validator.validate(test, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, test);

      done();
    });
  });

  it('should use custom type validator if specified and return error if "validate" method returns error', done => {
    class Test {
      constructor(test) {
        this.test = test;
      }
    }

    const validator = createValidator({
      type: Test
    }, {
      customTypes: [{
        type: 'test',
        basicType: Test,
        validate: (data, d) => {
          d({
            code: 'TEST_ERROR',
            info: {
              testProp: 'testValue'
            }
          });
        }
      }]
    });

    let test = new Test('123');

    validator.validate(test, (err, result) => {
      assert.deepStrictEqual(err, {
        code: 'TEST_ERROR',
        data: test,
        info: {
          testProp: 'testValue'
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should use custom type validator if specified and not validate if "match" method returns false', done => {
    class Test {
      constructor(test) {
        this.test = test;
      }
    }

    const validator = createValidator({
      type: Test
    }, {
      customTypes: [{
        type: 'test',
        basicType: Test,
        match: (data, d) => {
          d(data.test.startsWith('test'));
        },
        validate: (data, d) => {
          d({code: 'TEST_ERROR'});
        }
      }]
    });

    let test = new Test('123');

    validator.validate(test, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, test);

      done();
    });
  });

  it('should use custom type validator if specified and validate if "match" method returns true', done => {
    class Test {
      constructor(test) {
        this.test = test;
      }
    }

    const validator = createValidator({
      type: Test
    }, {
      customTypes: [{
        type: 'test',
        basicType: Test,
        match: (data, d) => {
          d(data.test.startsWith('test'));
        },
        validate: (data, d) => {
          d({code: 'TEST_ERROR'});
        }
      }]
    });

    let test = new Test('test123');

    validator.validate(test, (err, result) => {
      assert.deepStrictEqual(err, {
        code: 'TEST_ERROR',
        data: test,
        info: {},
        path: []
      });
      assert.deepStrictEqual(result, undefined);

      done();
    });
  });

  it('should use custom type validator with "basicType" being one of the built-in types', done => {
    const validator = createValidator({
      type: 'string'
    }, {
      customTypes: [{
        type: 'test',
        basicType: 'string',
        match: (data, d) => {
          d(data.startsWith('test'));
        },
        validate: (data, d) => {
          d(null, data + data);
        }
      }]
    });

    validator.validate('test123', (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, 'test123test123');

      done();
    });
  });
});
