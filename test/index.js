const _ = require('underscore');
const assert = require('assert');

const IamValidatorError = require('../lib/iamvalidator-error');
const Validator = require('../lib');

function itOk(template, source, target, options) {
  let validator = new Validator(template);
  it(`${JSON.stringify(template)} on ${JSON.stringify(source)} should return ${JSON.stringify(target)}`, () => {
    assert(_.isEqual(target, validator.validate(source, options)));
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
    itOk({
      type: 'object',
      fields: {}
    }, {}, {});
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
    itOk({
      type: 'object',
      fields: {
        field: {
          type: 'number',
          missing: 'default',
          default: 1
        }
      }
    }, {}, {
      field: 1
    });
    itFail({
      type: 'object',
      fields: {}
    }, {
      extraField: 1
    }, 'EXTRA_FIELDS', {
      path: '_root',
      fields: ['extraField']
    });
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
  });
});
