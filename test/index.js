const _ = require('underscore');
const assert = require('assert');
const Type = require('type-of-is');

const Validator = require('../lib');
const IamValidatorError = Validator.IamValidatorError;
const CODES = IamValidatorError.CODES;


class Rational {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  get X() {
    return this.x;
  }

  get Y() {
    return this.y;
  }
}


function validateRational(TEMPLATE, data, path, options) {
  let isValid = (typeof data.X === 'number');
  isValid &= (typeof data.Y === 'number');
  isValid &= (TEMPLATE.isZeroValid || (data.Y !== 0));

  if(!isValid) {
    throw new IamValidatorError('RATIONAL_INCORRECT', {
      path: path,
      src: data
    })
  }
  return data;
}


function itOk(template, source, expectedResult, options) {
  let validator = new Validator(template);
  it(`${JSON.stringify(template)} on ${JSON.stringify(source)} with options ${JSON.stringify(options)}`
    + ` should return ${JSON.stringify(expectedResult)}`, () => {
    assert(_.isEqual(expectedResult, validator.validate(source, options)));
  });
}

function itFail(template, source, code, extraData) {
  let validator = new Validator(template);
  let description = `${JSON.stringify(template)} on ${JSON.stringify(source)} should fail with "${code}"`;
  if (extraData) {
    description += ` and extraData ${JSON.stringify(extraData)}`;
  }
  it(description, () => {
    assert.throws(() => {
      validator.validate(source);
    }, (err) => {
      if (!(err instanceof IamValidatorError)) {
        return false;
      }
      if (err.code !== code) {
        return false;
      }
      if (extraData) {
        return _.isEqual(err.extraData, extraData);
      }
      return true;
    });
  });
}

describe('validator', () => {
  describe('#validate', () => {
    //1. Empty
    itOk({
      type: 'object',
      fields: {}
    }, {}, {});

    //2. Number
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'number'
        }
      }
    }, {
      field: 1
    }, {
      field: 1
    });

    //3. Missing handle
    //3.1. Fail
    itFail({
      type: 'object',
      fields: {
        missingField: {
          type: 'number'
        }
      }
    }, {}, 'MISSING_FIELD', {
      path: '_root.missingField'
    });
    //3.2. Ignore
    itOk({
      type: 'object',
      fields: {
        missingField: {
          type: 'number'
        }
      }
    }, {}, {}, {
      ignoreMissing: true
    });
    //3.3. Default
    itOk({
      type: 'object',
      fields: {
        missingField: {
          type: 'number',
          default: 1,
          missing: "default"
        }
      }
    }, {}, {
      missingField: 1
    }, {});

    //4. Handling extra fields
    //4.1. Fail
    itFail({
      type: 'object',
      fields: {}
    }, {
      extraField: 1
    }, 'EXTRA_FIELDS', {
      path: '_root',
      fields: ['extraField']
    });
    //4.2. Ignore
    itOk({
      type: 'object',
      fields: {}
    }, {
      extraField: 1
    }, {
      extraField: 1
    }, {
      ignoreExtra: true
    });

    //5. Handling type mismatch
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'number'
        }
      }
    }, {
      field: 'blah'
    }, 'TYPE_MISMATCH', {
      path: '_root.field',
      type: 'string',
      expectedType: 'number'
    });

    //6. Primitives and builtin types
    //6.1. Boolean
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'boolean'
        }
      }
    }, {
      field: true
    }, {
      field: true
    });
    //6.2. Date
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'date'
        }
      }
    }, {
      field: new Date(2017,1,1)
    }, {
      field: new Date(2017,1,1)
    });

    //7. Number ranges
    //7.1.1. Min - OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'number',
          min: 3
        }
      }
    }, {
      field: 3
    }, {
      field: 3
    });
    //7.1.2. Min - Fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'number',
          min: 3
        }
      }
    }, {
      field: 2
    }, 'INVALID_NUMBER_RANGE', {
      path: '_root.field',
      src: 2
    });
    //7.2.1. Max - OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'number',
          max: 3
        }
      }
    }, {
      field: 3
    }, {
      field: 3
    });
    //7.1.2. Max - Fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'number',
          max: 3
        }
      }
    }, {
      field: 4
    }, 'INVALID_NUMBER_RANGE', {
      path: '_root.field',
      src: 4
    });

    //8. String length
    //8.1.1. Length - OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          length: 3
        }
      }
    }, {
      field: '123'
    }, {
      field: '123'
    });
    //8.1.2. Length - Fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          length: 3
        }
      }
    }, {
      field: '1234'
    }, 'INVALID_LENGTH', {
      path: '_root.field',
      src: '1234',
      length: 4,
      expectedLength: 3
    });
    //8.2.1. Min and max length - OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          min: 3,
          max: 5
        }
      }
    }, {
      field: '1234'
    }, {
      field: '1234'
    });
    //8.2.2. Min and max length - less than min fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          min: 3,
          max: 5
        }
      }
    }, {
      field: '12'
    }, 'INVALID_LENGTH', {
      path: '_root.field',
      src: '12',
      length: 2,
      expectedMin: 3,
      expectedMax: 5
    });
    //8.2.3. Min and max length - more than max fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          min: 3,
          max: 5
        }
      }
    }, {
      field: '123456'
    }, 'INVALID_LENGTH', {
      path: '_root.field',
      src: '123456',
      length: 6,
      expectedMin: 3,
      expectedMax: 5
    });

    //9. Limited set of values
    //9.1. OK
    itOk({
      type: 'object',
      fields: {
        fruit: {
          type: 'string',
          values: ['apple', 'orange', 'banana']
        }
      }
    }, {
      fruit: 'orange'
    }, {
      fruit: 'orange'
    });
    //9.2. Fail
    itFail({
      type: 'object',
      fields: {
        fruit: {
          type: 'string',
          values: ['apple', 'orange', 'banana']
        }
      }
    }, {
      fruit: 'carrot'
    }, 'NOT_IN_VALUES', {
      path: '_root.fruit',
      src: 'carrot'
    });

    //10. Arrays
    //10.1.1. Validating elements - OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'array',
          element: {
            type: 'number'
          }
        }
      }
    }, {
      field: [1]
    }, {
      field: [1]
    });
    //10.1.2. Validating elements - type mismatch Fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'array',
          element: {
            type: 'number'
          }
        }
      }
    }, {
      field: [1, 'blah']
    }, 'TYPE_MISMATCH', {
      path: '_root.field.1',
      type: 'string',
      expectedType: 'number'
    });
    //10.2.1. Array length - OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'array',
          element: {
            type: 'number'
          },
          length: 2
        }
      }
    }, {
      field: [1,2]
    }, {
      field: [1,2]
    });
    //10.2.2. Array length - Fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'array',
          element: {
            type: 'number'
          },
          length: 2
        }
      }
    }, {
      field: [1,2,3]
    }, 'INVALID_LENGTH', {
      path: '_root.field',
      src: [1,2,3],
      length: 3,
      expectedLength: 2
    });

    //11. Using regular expressions
    //11.1. OK
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          regexp: /^[a-f0-9]{32}$/i
        }
      }
    }, {
      field: '8a8fce7f8c6e16905732704bf4edd1d8'
    }, {
      field: '8a8fce7f8c6e16905732704bf4edd1d8'
    });
    //11.2. Fail
    itFail({
      type: 'object',
      fields: {
        field: {
          type: 'string',
          regexp: /^[a-f0-9]{32}$/i
        }
      }
    }, {
      field: 'invalid md5 hash'
    }, 'INVALID_STRING', {
      path: '_root.field',
      src: 'invalid md5 hash'
    });

    //12. Custom validation
    //12.1. OK
    itOk({
      type: 'number',
      validate: function(data, path) {
        if (data % 2 !== 0) {
          throw new IamValidatorError(CODES.INVALID_CUSTOM_VALIDATE, {
            path: path,
            src: data
          })
        }
      }
    }, 0, 0);
    //12.2. Fail
    itFail({
      type: 'number',
      validate: function(data, path) {
        if (data % 2 !== 0) {
          throw new IamValidatorError(CODES.INVALID_CUSTOM_VALIDATE, {
            path: path,
            src: data
          })
        }
      }
    }, 1, 'INVALID_CUSTOM_VALIDATE', {
      path: '_root',
      src: 1
    });

    //13. Transform after validation
    itOk({
      type: 'number',
      transform: function (data) {
        return data.toString()
      }
    }, 0, '0');

    //14. Custom type validation
    let r1 = new Rational(1, 2);
    let r2 = new Rational(1, 0);
    Validator.registerValidator(Type.string(r1).toLowerCase(), validateRational);
    //14.1. OK
    itOk({
      type: 'rational'
    }, r1, r1);
    //14.2. Fail
    itFail({
      type: 'rational'
    }, r2, 'RATIONAL_INCORRECT', {
      path: '_root',
      src: r2
    });
    //14.1. isZeroValid
    itOk({
      type: 'rational',
      isZeroValid: true
    }, r2, r2);
  });
});
