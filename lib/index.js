const _ = require('underscore');
const Type = require('type-of-is');
const IamValidatorError = require('./iamvalidator-error');

const CODES = IamValidatorError.CODES;

function testNumber(TEMPLATE, data, path, code) {
  let validNumber = (typeof TEMPLATE.min !== 'number') || (data >= TEMPLATE.min);
  validNumber &= (typeof TEMPLATE.max !== 'number') || (data <= TEMPLATE.max);
  if (!validNumber) {
    throw new IamValidatorError(code, {
      path: path,
      data: data
    });
  }
}

function getExtraData(TEMPLATE, data, path, { ignoreExtra } = {}) {
  let extraData = _(data).pick((_1, name) => !TEMPLATE.fields.hasOwnProperty(name));
  if (!ignoreExtra && ('ignore' !== TEMPLATE.extra) && (_(extraData).size() > 0)) {
    throw new IamValidatorError(CODES.EXTRA_FIELDS, {
      path: path,
      fields: _(extraData).map((_1, name) => name)
    });
  }
  return extraData;
}

function getDefaults(TEMPLATE, path) {
  if ('array' === TEMPLATE.type) {
    return [];
  } else if ('object' !== TEMPLATE.type) {
    if ('ignore' === TEMPLATE.missing) {
      return;
    }
    if ('default' !== TEMPLATE.missing || typeof TEMPLATE.default === 'undefined') {
      throw new IamValidatorError(CODES.MISSING_DEFAULT_FIELD, { path: path });
    }
    return TEMPLATE.default;
  }
  let defaults = _(TEMPLATE.fields).mapObject((field, name) => {
    return getDefaults(field, `${path}.${name}`);
  });
  return _(defaults).pick((_1, value) => {
    return typeof value !== 'undefined';
  });
}

function validateObjectField(data, path, options = {}, field, name) {
  let fieldPath = `${path}.${name}`;
  //NOTE: Object's prototype may be null, causing it to not have hasOwnProperty method
  if (Object.prototype.hasOwnProperty.call(data, name)) {
    return validate(field, data[name], fieldPath, options);
  }
  if (options.ignoreMissing) {
    return;
  }
  switch (field.missing) {
    case 'ignore':
      break;
    case 'default':
      return getDefaults(field);
    default:
      throw new IamValidatorError(CODES.MISSING_FIELD, { path: fieldPath });
  }
}

function validateObject(TEMPLATE, data, path, options) {
  let extraData = getExtraData(TEMPLATE, data, path, options);
  let newData = _(TEMPLATE.fields).mapObject(validateObjectField.bind(null, data, path, options));
  newData = _(newData).pick((value) => {
    return typeof value !== 'undefined';
  });
  return _.extend(newData, extraData);
}

function validateArray(TEMPLATE, data, path) {
  if (!TEMPLATE.element) {
    throw new IamValidatorError(CODES.ELEMENT_NOT_SPECIFIED, { path: path });
  }
  let errorCode = TEMPLATE.errorCode || CODES.INVALID_ARRAY;
  testNumber(TEMPLATE, data.length, path, errorCode);
  return data.map((item, index) => {
    return validate(TEMPLATE.element, item, `${path}.${index}`);
  });
}

function validateString(TEMPLATE, data, path) {
  let errorCode = TEMPLATE.errorCode || CODES.INVALID_STRING;
  testNumber(TEMPLATE, data.length, path, errorCode);
  if (((typeof TEMPLATE.length === 'number') && (data.length !== TEMPLATE.length))
    || ((TEMPLATE.regexp instanceof RegExp) && (!TEMPLATE.regexp.test(data)))) {
    throw new IamValidatorError(errorCode, {
      path: path,
      data: data
    });
  }
  return data;
}

function validateNumber(TEMPLATE, data, path) {
  testNumber(TEMPLATE, data, path, TEMPLATE.errorCode || CODES.INVALID_NUMBER_RANGE);
  return data;
}

function dummy(_1, data) {
  return data;
}

const VALIDATORS = new Map([
  ['object', validateObject],
  ['array', validateArray],
  ['string', validateString],
  ['number', validateNumber],
  ['boolean', dummy],
  ['date', dummy]
]);

function validate(TEMPLATE, data, path, options) {
  let type = Type.string(data).toLowerCase();
  if (type !== TEMPLATE.type) {
    throw new IamValidatorError(CODES.TYPE_MISMATCH, {
      path: path,
      type: type,
      expectedType: TEMPLATE.type
    });
  }
  let validator = VALIDATORS.get(type);
  if (!validator) {
    throw new IamValidatorError(CODES.NO_VALIDATOR, { path: path });
  }

  if (Array.isArray(TEMPLATE.values)){
    const inValues = _.any(TEMPLATE.values, elem => {
      return _.isEqual(elem, data);
    });

    if (!inValues){
      throw new IamValidatorError(CODES.NOT_IN_VALUES, { path: path, data: data });
    }
  }

  let newData = validator(TEMPLATE, data, path, options);

  if (typeof TEMPLATE.validate === 'function') {
    newData = data;
    TEMPLATE.validate(TEMPLATE, newData, path, options);
  }

  if (typeof TEMPLATE.transform === 'function') {
    newData = TEMPLATE.transform(newData);
  }
  return newData;
}

module.exports = class IamValidator {
  static get IamValidatorError() {
    return IamValidatorError;
  }
  
  static registerValidator(typeName, validator) {
    VALIDATORS.set(typeName, validator);
  }

  constructor(template) {
    this.TEMPLATE = template;
  }

  validate(data, options) {
    return validate(this.TEMPLATE, data, '_root', options);
  }
};
