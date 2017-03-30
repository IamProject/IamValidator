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


function itOk(title, template, source, expectedResult, options) {
  let validator = new Validator(template);
  it(title, () => {
    assert(_.isEqual(expectedResult, validator.validate(source, options)));
  });
}

function itFail(title, template, source, code, extraData) {
  let validator = new Validator(template);
  it(title, () => {
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
  describe('1. Basic', () => {
    itOk('1.1. Returns empty object on empty template', {
      type: 'object',
      fields: {}
    }, {}, {});
    itOk('1.2. Returns the number on number template', {
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
    itOk('1.3. Returns the boolean on boolean template', {
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
    itOk('1.4. Returns the date on date template', {
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
    itFail('1.5. Throws "TYPE_MISMATCH" when field type isn\'t equal to expected type', {
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
  });

  describe('2. Missing fields', () => {
    itFail('2.1. Throws "MISSING_FIELD" when required field is missing', {
      type: 'object',
      fields: {
        missingField: {
          type: 'number'
        }
      }
    }, {}, 'MISSING_FIELD', {
      path: '_root.missingField'
    });
    itOk('2.2. Returns empty object when required field is missing (global option "ignoreMissing")', {
      type: 'object',
      fields: {
        missingField: {
          type: 'number'
        }
      }
    }, {}, {}, {
      ignoreMissing: true
    });
    itOk('2.3. Returns empty object when required field is missing (option { \'missing\': \'ignore\' })', {
      type: 'object',
      fields: {
        missingField: {
          type: 'number',
          missing: 'ignore'
        }
      }
    }, {}, {}, {
      ignoreMissing: true
    });
    itOk('2.4. Returns default value when required field is missing (options { \'missing\': \'default\' } and "default")', {
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
  });

  describe('3. Extra fields', () => {
    itFail('3.1. Throws on fields not described in template', {
      type: 'object',
      fields: {}
    }, {
      extraField: 1
    }, 'EXTRA_FIELDS', {
      path: '_root',
      fields: ['extraField']
    });
    itOk('3.2. Returns the fields not described in template (global option "ignoreExtra")', {
      type: 'object',
      fields: {}
    }, {
      extraField: 1
    }, {
      extraField: 1
    }, {
      ignoreExtra: true
    });
  });

  describe('4. Number ranges', () => {
    itOk('4.1.1. Returns the number when it satisfies \'min\' option', {
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
    itFail('4.1.2. Throws "INVALID_NUMBER_RANGE" when number less than \'min\' option', {
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
    itOk('4.2.1. Returns the number when it satisfies \'max\' option', {
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
    itFail('4.2.2. Throws "INVALID_NUMBER_RANGE" when number more than \'max\' option', {
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
  });

  describe('5. Strings', () => {
    itOk('5.1.1. Returns the string when its length is equal to \'length\' option', {
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
    itFail('5.1.2. Throws "INVALID_LENGTH" when string length isn\'t equal to \'length\' option', {
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
    itOk('5.2.1. Returns the string when its length satisfies to \'min\'-\'max\' range', {
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
    itFail('5.2.2. Throws "INVALID_LENGTH" when string length less than \'min\' option', {
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
    itFail('5.2.2. Throws "INVALID_LENGTH" when string length more than \'max\' option', {
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

    itOk('5.3.1. Returns the string when it satisfies \'regexp\' option', {
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
    itFail('5.3.2. Throws "INVALID_STRING" when it doesn\'t satisfy \'regexp\' option', {
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
  });

  describe('6. Limited set of allowed values', () => {
    itOk('6.1. Returns the value when it\'s in \'values\' array option', {
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
    itFail('6.2. Throws "NOT_IN_VALUES" when it\'s not in \'values\' array option', {
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
  });

  describe('7. Arrays', () => {
    itOk('7.1.1. Returns the array when all its elements satisfy template in \'element\' option', {
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
    itFail('7.1.2. Throws when not all array elements satisfy template in \'element\' option', {
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
    itOk('7.2.1. Returns the array when its length is equal to \'length\' option', {
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
      field: [1, 2]
    }, {
      field: [1, 2]
    });
    itFail('7.2.2. Throws "INVALID_LENGTH" when array length isn\'t equal to \'length\' option', {
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
      field: [1, 2, 3]
    }, 'INVALID_LENGTH', {
      path: '_root.field',
      src: [1, 2, 3],
      length: 3,
      expectedLength: 2
    });
  });

  describe('8. Advanced', () => {
    itOk('8.1.1 Returns null object when it is allowed', {
      type: 'date',
      isNullable: true
    }, null, null);
    itFail('8.1.2 Throws when null object isn\'t allowed', {
      type: 'date'
    }, null, 'UNALLOWED_NULL', {
      path: '_root',
      src: null
    });
    itOk('8.2.1 Returns the value when it satisfies custom validation in \'validate\' option', {
      type: 'number',
      validate: function (data, path) {
        if (data % 2 !== 0) {
          throw new IamValidatorError(CODES.INVALID_CUSTOM_VALIDATE, {
            path: path,
            src: data
          })
        }
      }
    }, 0, 0);
    itFail('8.2.2 Throws when value doesn\'t satisfy custom validation in \'validate\' option', {
      type: 'number',
      validate: function (data, path) {
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
    itOk('8.3. Transform value after successful validation (option \'transform\')', {
      type: 'number',
      transform: function (data) {
        return data.toString()
      }
    }, 0, '0');
  });

  describe('9. Custom types', () => {
    let r1 = new Rational(1, 2);
    let r2 = new Rational(1, 0);
    Validator.registerValidator(Type.string(r1).toLowerCase(), validateRational);
    itOk('9.1. Returns the instance of custom type when it satisfies registered validator', {
      type: 'rational'
    }, r1, r1);
    itFail('9.2. Throws when custom type instance doesn\'t satisfy registered validator', {
      type: 'rational'
    }, r2, 'RATIONAL_INCORRECT', {
      path: '_root',
      src: r2
    });
    itOk('9.3. Registered validator can use custom options', {
      type: 'rational',
      isZeroValid: true
    }, r2, r2);
  });
});
