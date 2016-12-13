//Validation error module

/**
 * Builtin error codes.
 * code => code
 */
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

//Error for validation fails
module.exports = class IamValidatorError extends Error {
  /**
   * Returns builtin error codes
   * @return {object} object: code => code
   * @constructor
   */
  static get CODES() {
    return CODES;
  }

  /**
   * Constructs new validation error
   * @param {object} code validation error code
   * @param {object} extraData additional data to determine error reasons
   */
  constructor(code, extraData) {
    super(code);
    this.code = code;
    this.extraData = extraData;
  }
};
