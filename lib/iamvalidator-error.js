const CODES = [
  'EXTRA_FIELDS',
  'MISSING_DEFAULT_FIELD',
  'MISSING_FIELD',
  'ELEMENT_NOT_SPECIFIED',
  'TYPE_MISMATCH',
  'NO_VALIDATOR',
  'NOT_IN_VALUES',
  'INVALID_NUMBER_RANGE',
  'INVALID_STRING',
  'INVALID_LENGTH',
  'INVALID_CUSTOM_VALIDATE'
].reduce((acc, code) => {
  acc[code] = code;
  return acc;
}, {});

module.exports = class IamValidatorError extends Error {
  static get CODES() {
    return CODES;
  }

  constructor(code, extraData) {
    super(code);
    this.code = code;
    this.extraData = extraData;
  }
};
