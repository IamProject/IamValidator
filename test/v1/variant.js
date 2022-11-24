const assert = require('assert');

const {IAmValidatorErrorCode, createValidator} = require('../../lib/v1');

describe('variant', () => {
  it('should return value for template of type "variant" if satisfies any of the variants', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        type: 'number'
      }, {
        type: 'string'
      }]
    });

    validator.validate('test', (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, 'test');

      done();
    });
  });

  it('should return error for template of type "variant" if does not satisfy any of the variants', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        type: 'string'
      }, {
        type: 'number'
      }]
    });

    validator.validate(true, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.TypeMismatch,
        data: true,
        info: {
          expectedType: 'number'
        },
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return null for template of type "variant" null is passed and "isNullable" flag is true for any of the variants', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        type: 'number'
      }, {
        type: 'string',
        isNullable: true
      }]
    });

    validator.validate(null, (err, result) => {
      assert.strictEqual(err, null);
      assert.strictEqual(result, null);

      done();
    });
  });

  it('should return error for template of type "variant" null is passed and "isNullable" flag is not set to true for any of the variants', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        type: 'string'
      }]
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

  it('should return value for template of type "variant" if satisfies any of the variants matched by "hint"', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        hint: (value, done) => {
          done(value.kind === 'kind1');
        },
        type: 'object',
        fields: {
          kind: {
            type: 'string',
            values: ['kind1']
          },
          test: {
            type: 'string'
          }
        }
      }, {
        hint: (value, done) => {
          done(value.kind === 'kind2');
        },
        type: 'object',
        fields: {
          kind: {
            type: 'string',
            values: ['kind2']
          },
          test: {
            type: 'number'
          }
        }
      }]
    });

    validator.validate({
      kind: 'kind2',
      test: 10
    }, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {
        kind: 'kind2',
        test: 10
      });

      done();
    });
  });

  it('should return error for template of type "variant" if none of variants matched by "hint" are successfully validated', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        hint: (value, done) => {
          done(value.kind === 'kind1');
        },
        type: 'object',
        fields: {
          kind: {
            type: 'string',
            values: ['kind1']
          },
          test: {
            type: 'string'
          }
        }
      }, {
        hint: (value, done) => {
          done(value.kind === 'kind2');
        },
        type: 'object',
        fields: {
          kind: {
            type: 'string',
            values: ['kind2']
          },
          test: {
            type: 'number'
          }
        }
      }]
    });

    validator.validate({
      kind: 'kind2',
      test: '123'
    }, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.TypeMismatch,
        data: '123',
        info: {
          expectedType: 'number'
        },
        path: ['test']
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });

  it('should return error for template of type "variant" if no matching variant found', done => {
    const validator = createValidator({
      type: 'variant',
      variants: [{
        hint: (value, done) => {
          done(value.kind === 'kind1');
        },
        type: 'object',
        fields: {
          kind: {
            type: 'string',
            values: ['kind1']
          },
          test: {
            type: 'number'
          }
        }
      }]
    });

    validator.validate({
      kind: 'kind2',
      test: '123'
    }, (err, result) => {
      assert.deepStrictEqual(err, {
        code: IAmValidatorErrorCode.NoMatchingVariant,
        data: {
          kind: 'kind2',
          test: '123'
        },
        info: {},
        path: []
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });
});
