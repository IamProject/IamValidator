const ExtraStrategy = {
  Error: 'error',
  Exclude: 'exclude',
  Include: 'include'
};

const IAmValidatorErrorCode = {
  BooleanNotInValues: 'BOOLEAN_NOT_IN_VALUES',
  CustomError: 'CUSTOM_ERROR',
  DuplicateItems: 'DUPLICATE_ITEMS',
  ExtraFields: 'EXTRA_FIELDS',
  InvalidArrayLength: 'INVALID_ARRAY_LENGTH',
  InvalidNumber: 'INVALID_NUMBER',
  InvalidString: 'INVALID_STRING',
  InvalidStringLength: 'INVALID_STRING_LENGTH',
  MissingField: 'MISSING_FIELD',
  NumberNotInteger: 'NUMBER_NOT_INTEGER',
  NumberNotInValues: 'NUMBER_NOT_IN_VALUES',
  NoMatchingVariant: 'NO_MATCHING_VARIANT',
  StringNotInValues: 'STRING_NOT_IN_VALUES',
  TypeMismatch: 'TYPE_MISMATCH',
  UnallowedNull: 'UNALLOWED_NULL'
};

const MissingStrategy = {
  Default: 'default',
  Error: 'error',
  Ignore: 'ignore'
};

const BASIC_TYPES = ['array', 'number', 'boolean', 'string', 'object', 'variant'];

const NSEC_TO_MSEC_RATIO = 1000 * 1000;

function _createDelayManager(maxDelayNsecs) {
  let previous = (typeof process === 'undefined') ? Date.now() : process.hrtime();

  const getElapsedTime = () => {
    if (typeof previous === 'number') {
      return (Date.now() - previous) * NSEC_TO_MSEC_RATIO;
    }

    const current = process.hrtime(previous);

    return (current[0] * NSEC_TO_MSEC_RATIO) + current[1];
  };

  return {
    shouldDelayExecution: () => {
      return getElapsedTime() > maxDelayNsecs;
    },
    updateTimestamp: () => {
      if (typeof previous === 'number') {
        previous = Date.now();
      } else {
        previous = process.hrtime();
      }
    }
  };
}

function _callbackChain(callbacks, done, {delayManager}) {
  if (delayManager.shouldDelayExecution()) {
    setTimeout(() => {
      delayManager.updateTimestamp();

      _callbackChain(callbacks, done, {delayManager});
    }, 0);

    return;
  }

  const [first, ...rest] = callbacks;

  if (!first) {
    done();

    return;
  }

  first(err => {
    if (err) {
      done(err);

      return;
    }

    _callbackChain(rest, done, {delayManager});
  });
}

function _createCustomError(path, data, customError) {
  return {customError, data, path};
}

function _createError(code, path, data, info = {}) {
  const error = {code, info, path};

  if (data !== undefined) {
    error.data = data;
  }

  return error;
}

function _checkEquality(i1, i2) {
  return i1 === i2;
}

function _validateArray(data, {context, customTypeMap, delayManager, getData, path, template}, done) {
  const {
    checkEquality = _checkEquality,
    forbidDuplicates,
    length,
    maxLength,
    minLength
  } = template;

  if ((typeof length === 'number') && (data.length !== length)) {
    done(_createError(IAmValidatorErrorCode.InvalidArrayLength, path, data, {
      expectedLength: length,
      length: data.length
    }));

    return;
  }

  if ((typeof minLength === 'number') && (data.length < minLength)) {
    done(_createError(IAmValidatorErrorCode.InvalidArrayLength, path, data, {
      expectedMinLength: minLength,
      length: data.length
    }));

    return;
  }

  if ((typeof maxLength === 'number') && (data.length > maxLength)) {
    done(_createError(IAmValidatorErrorCode.InvalidArrayLength, path, data, {
      expectedMaxLength: maxLength,
      length: data.length
    }));

    return;
  }

  if (data.length < 1) {
    done(null, data);

    return;
  }

  const newData = Array(data.length);

  const callbacks = data.map((item, index) => d => {
    _validate(item, {
      context,
      customTypeMap,
      delayManager,
      getData,
      path: path.concat(index),
      template: template.element
    }, (err, result) => {
      if (err) {
        d(err);

        return;
      }

      newData[index] = result;

      d();
    })
  });

  if (forbidDuplicates) {
    callbacks.push(d => {
      _callbackChain(newData.map((item, index) => dd => {
        for (let i = index + 1; i < newData.length; ++i) {
          if (checkEquality(newData[index], newData[i])) {
            dd(_createError(IAmValidatorErrorCode.DuplicateItems, path, data, {indexes: [index, i]}));

            return;
          }
        }

        dd();
      }), d, {delayManager});
    });
  }

  _callbackChain(callbacks, err => {
    if (err) {
      done(err);

      return;
    }

    done(null, newData);
  }, {delayManager});
}

function _validateNumber(data, {path, template}, done) {
  const {isInteger, maxValue, minValue} = template;

  if (isInteger && (data % 1)) {
    done(_createError(IAmValidatorErrorCode.NumberNotInteger, path, data));

    return;
  }

  if ((typeof minValue === 'number') && (data < minValue)) {
    done(_createError(IAmValidatorErrorCode.InvalidNumber, path, data, {expectedMinValue: minValue}));

    return;
  }

  if ((typeof maxValue === 'number') && (data > maxValue)) {
    done(_createError(IAmValidatorErrorCode.InvalidNumber, path, data, {expectedMaxValue: maxValue}));

    return;
  }

  done(null, data);
}

function _validateObject(data, {context, customTypeMap, delayManager, getData, path, template}, done) {
  const extraData = Object.entries(data)
    .filter(([key]) => !template.fields[key])
    .reduce((acc, [key, value]) => {
      acc[key] = value;

      return acc;
    }, {});

  const extraDataFieldNames = Object.keys(extraData);

  const shouldIncludeExtraData = template.extraStrategy === ExtraStrategy.Include;
  const hasExtraFields = extraDataFieldNames.length > 0;

  if (hasExtraFields && !shouldIncludeExtraData && (template.extraStrategy !== ExtraStrategy.Exclude)) {
    done(_createError(IAmValidatorErrorCode.ExtraFields, path, data, {fieldNames: extraDataFieldNames}));

    return;
  }

  const newData = shouldIncludeExtraData ? extraData : {};

  _callbackChain(Object.entries(template.fields).map(([key, value]) => d => {
    _validate(data[key], {
      context,
      customTypeMap,
      delayManager,
      getData,
      path: path.concat(key),
      template: value
    }, (err, result) => {
      if (err) {
        d(err);

        return;
      }

      if (result !== undefined) {
        newData[key] = result;
      }

      d();
    });
  }), err => {
    if (err) {
      done(err);

      return;
    }

    done(null, newData);
  }, {delayManager});
}

function _validateString(data, {path, template}, done) {
  const {length, maxLength, minLength, regexp} = template;

  if ((typeof length === 'number') && (data.length !== length)) {
    done(_createError(IAmValidatorErrorCode.InvalidStringLength, path, data, {
      expectedLength: length,
      length: data.length
    }));

    return;
  }

  if ((typeof minLength === 'number') && (data.length < minLength)) {
    done(_createError(IAmValidatorErrorCode.InvalidStringLength, path, data, {
      expectedMinLength: minLength,
      length: data.length
    }));

    return;
  }

  if ((typeof maxLength === 'number') && (data.length > maxLength)) {
    done(_createError(IAmValidatorErrorCode.InvalidStringLength, path, data, {
      expectedMaxLength: maxLength,
      length: data.length
    }));

    return;
  }

  if (regexp && !regexp.test(data)) {
    done(_createError(IAmValidatorErrorCode.InvalidString, path, data));

    return;
  }

  done(null, data);
}

function _validateVariant(data, {context, customTypeMap, delayManager, getData, path, template}, done) {
  const filteredVariants = [];

  let error = null;
  let isHandled = false;
  let newData = null;

  _callbackChain(template.variants.map((variant, index) => d => {
    const {hint} = variant;

    if (!hint) {
      filteredVariants.push(variant);

      d();

      return;
    }

    hint(data, result => {
      if (result) {
        filteredVariants.push(variant);
      }

      d();
    }, {context, customTypeMap, getData, path, template, variantIndex: index});
  }).concat(d => {
    _callbackChain(filteredVariants.map(variant => dd => {
      _validate(data, {
        context,
        customTypeMap,
        delayManager,
        getData,
        path,
        template: variant
      }, (err, result) => {
        if (err) {
          error = err;

          // Not passing error here to iterate to next variant
          dd();

          return;
        }

        newData = result;
        isHandled = true;

        // Interrupting once result is valid
        dd(true);
      });
    }), () => {
      // Ignoring error here

      d();
    }, {delayManager});
  }), err => {
    if (err) {
      // This should not happen

      done(err);

      return;
    }

    if (!isHandled) {
      done(error || (_createError(IAmValidatorErrorCode.NoMatchingVariant, path, data)));

      return;
    }

    done(null, newData);
  }, {delayManager});
}

function _validate(data, {context, customTypeMap, delayManager, getData, path, template}, done) {
  const {
    defaultValue,
    isNullable,
    missingStrategy,
    transformAfter,
    transformBefore,
    type,
    validateAfter,
    validateBefore,
    values
  } = template;

  if (data === undefined) {
    switch (missingStrategy) {
    case MissingStrategy.Default:
      done(null, defaultValue);

      break;
    case MissingStrategy.Ignore:
      done(null, data);

      break;
    case MissingStrategy.Error:
    default:
      done(_createError(IAmValidatorErrorCode.MissingField, path, data));

      break;
    }

    return;
  }

  let customType = null;
  let dataIsArray = false;
  let newData = data;

  _callbackChain([d => {
    if (!transformBefore) {
      d();

      return;
    }

    transformBefore(data, (err, result) => {
      if (err) {
        d(_createCustomError(path, data, err));

        return;
      }

      data = result;
      newData = data;

      d();
    }, {context, getData, path, template});
  }, d => {
    if (data === null) {
      if (!isNullable && (type !== 'variant')) {
        d(_createError(IAmValidatorErrorCode.UnallowedNull, path, data));

        return;
      }
    } else if (type !== 'variant') {
      dataIsArray = Array.isArray(data);

      customType = customTypeMap.get(type);

      const resultingType = customType ? customType.basicType : type;

      const typeIsClass = typeof resultingType === 'function';

      if (typeIsClass) {
        if (!(data instanceof resultingType)) {
          d(_createError(IAmValidatorErrorCode.TypeMismatch, path, data, {
            expectedType: typeIsClass ? '[class]' : resultingType
          }));

          return;
        }
      } else if (resultingType === 'array') {
        if (!dataIsArray) {
          d(_createError(IAmValidatorErrorCode.TypeMismatch, path, data, {
            expectedType: typeIsClass ? '[class]' : resultingType
          }));

          return;
        }
      } else {
        if ((typeof data !== resultingType) || (dataIsArray && (resultingType === 'object'))) {
          d(_createError(IAmValidatorErrorCode.TypeMismatch, path, data, {
            expectedType: typeIsClass ? '[class]' : resultingType
          }));

          return;
        }
      }

      if (customType && customType.match) {
        customType.match(data, result => {
          if (!result) {
            customType = null;
          }

          d();
        }, {context, customTypeMap, getData, path, template});

        return;
      }
    }

    d();
  }, d => {
    if (!validateBefore) {
      d();

      return;
    }

    validateBefore(data, err => {
      if (err) {
        d(_createCustomError(path, data, err));

        return;
      }

      d();
    }, {context, getData, path, template});
  }, d => {
    if (!dataIsArray) {
      d();

      return;
    }

    _validateArray(newData, {context, customTypeMap, delayManager, getData, path, template}, (err, result) => {
      if (err) {
        d(err);

        return;
      }

      newData = result;

      d();
    });
  }, d => {
    if (customType) {
      customType.validate(newData, (err, result) => {
        if (err) {
          d(_createCustomError(path, data, err));

          return;
        }

        newData = result;

        d();
      }, {context, customTypeMap, getData, path, template});

      return;
    }

    switch (type) {
    case 'boolean':
      if (values && !(Array.isArray(values) ? values.includes(data) : values.has(data))) {
        d(_createError(IAmValidatorErrorCode.BooleanNotInValues, path, data, {expectedValues: values}));

        return;
      }

      break;
    case 'number':
      if (values && !(Array.isArray(values) ? values.includes(data) : values.has(data))) {
        d(_createError(IAmValidatorErrorCode.NumberNotInValues, path, data, {expectedValues: values}));

        return;
      }

      _validateNumber(newData, {path, template}, (err, result) => {
        if (err) {
          d(err);

          return;
        }

        newData = result;

        d();
      });

      return;
    case 'object':
      if (newData) {
        _validateObject(newData, {context, customTypeMap, delayManager, getData, path, template}, (err, result) => {
          if (err) {
            d(err);

            return;
          }

          newData = result;

          d();
        });

        return;
      }

      break;
    case 'string':
      if (values && !(Array.isArray(values) ? values.includes(data) : values.has(data))) {
        d(_createError(IAmValidatorErrorCode.StringNotInValues, path, data, {expectedValues: values}));

        return;
      }

      _validateString(newData, {path, template}, (err, result) => {
        if (err) {
          d(err);

          return;
        }

        newData = result;

        d();
      });

      return;
    case 'variant': {
      _validateVariant(newData, {context, customTypeMap, delayManager, getData, path, template}, (err, result) => {
        if (err) {
          d(err);

          return;
        }

        newData = result;

        d();
      });

      return;
    }

    default:
      break;
    }

    d();
  }, d => {
    if (!validateAfter) {
      d();

      return;
    }

    validateAfter(newData, err => {
      if (err) {
        d(_createCustomError(path, data, err));

        return;
      }

      d();
    }, {context, getData, path, template});
  }, d => {
    if (!transformAfter) {
      d();

      return;
    }

    transformAfter(data, (err, result) => {
      if (err) {
        d(_createCustomError(path, data, err));

        return;
      }

      newData = result;

      d();
    }, {context, getData, path, template});
  }], err => {
    if (err) {
      done(err);

      return;
    }

    done(null, newData);
  }, {delayManager});
}

function _validateTemplate(template, path, {customTypeMap}) {
  if (!template || (typeof template !== 'object')) {
    throw new Error(`IAmValidator: Invalid template ${path.join('.')}`);
  }

  const {
    checkEquality,
    defaultValue,
    element,
    extraStrategy,
    fields,
    forbidDuplicates,
    isInteger,
    isNullable,
    length,
    maxLength,
    maxValue,
    minLength,
    minValue,
    missingStrategy,
    regexp,
    transformAfter,
    transformBefore,
    type,
    validateAfter,
    validateBefore,
    values,
    variants
  } = template;

  const typeOfType = typeof type;

  if (
    ((typeOfType !== 'string') || (!BASIC_TYPES.includes(type) && !customTypeMap.has(type))) &&
      (typeOfType !== 'function')
  ) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.type`);
  }

  if ((isNullable !== undefined) && (typeof isNullable !== 'boolean')) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.isNullable`);
  }

  if ((transformBefore !== undefined) && (typeof transformBefore !== 'function')) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.transformBefore`);
  }

  if ((transformAfter !== undefined) && (typeof transformAfter !== 'function')) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.transformAfter`);
  }

  if ((validateBefore !== undefined) && (typeof validateBefore !== 'function')) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.validateBefore`);
  }

  if ((validateAfter !== undefined) && (typeof validateAfter !== 'function')) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.validateAfter`);
  }

  if ((missingStrategy !== undefined) && !Object.values(MissingStrategy).includes(missingStrategy)) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.missingStrategy`);
  }

  if ((missingStrategy === MissingStrategy.Default) && (defaultValue === undefined)) {
    throw new Error(`IAmValidator: Missing ${path.join('.')}.defaultValue`);
  }

  if ((extraStrategy !== undefined) && !Object.values(ExtraStrategy).includes(extraStrategy)) {
    throw new Error(`IAmValidator: Invalid ${path.join('.')}.extraStrategy`);
  }

  switch (type) {
  case 'array':
    if ((length !== undefined) && ((typeof length !== 'number') || (length < 0) || ((length % 1) !== 0))) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.length`);
    }

    if ((maxLength !== undefined) && ((typeof maxLength !== 'number') || (maxLength < 0) || ((maxLength % 1) !== 0))) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.maxLength`);
    }

    if ((minLength !== undefined) && ((typeof minLength !== 'number') || (minLength < 0) || ((minLength % 1) !== 0))) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.minLength`);
    }

    if ((forbidDuplicates !== undefined) && (typeof forbidDuplicates !== 'boolean')) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.forbidDuplicates`);
    }

    if ((checkEquality !== undefined) && (typeof checkEquality !== 'function')) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.checkEquality`);
    }

    _validateTemplate(element, path.concat('element'), {customTypeMap});

    break;
  case 'boolean':
    if (
      (values !== undefined) && (!Array.isArray(values) || (values.length < 1)) &&
      (!(values instanceof Set) || (values.size < 1))
    ) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.values`);
    }

    break;
  case 'number':
    if ((isInteger !== undefined) && (typeof isInteger !== 'boolean')) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.isInteger`);
    }

    if ((maxValue !== undefined) && (typeof maxValue !== 'number')) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.maxValue`);
    }

    if ((minValue !== undefined) && (typeof minValue !== 'number')) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.minValue`);
    }

    if (
      (values !== undefined) && (!Array.isArray(values) || (values.length < 1)) &&
      (!(values instanceof Set) || (values.size < 1))
    ) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.values`);
    }

    break;
  case 'object':
    if ((typeof fields !== 'object') || !fields) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.fields`);
    }

    Object.entries(fields).forEach(([key, value]) => {
      _validateTemplate(value, path.concat('fields', key), {customTypeMap});
    });

    break;
  case 'string':
    if ((length !== undefined) && ((typeof length !== 'number') || (length < 0) || ((length % 1) !== 0))) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.length`);
    }

    if ((maxLength !== undefined) && ((typeof maxLength !== 'number') || (maxLength < 0) || ((maxLength % 1) !== 0))) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.maxLength`);
    }

    if ((minLength !== undefined) && ((typeof minLength !== 'number') || (minLength < 0) || ((minLength % 1) !== 0))) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.minLength`);
    }

    if ((regexp !== undefined) && !(regexp instanceof RegExp)) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.regexp`);
    }

    if (
      (values !== undefined) && (!Array.isArray(values) || (values.length < 1)) &&
      (!(values instanceof Set) || (values.size < 1))
    ) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.values`);
    }

    break;
  case 'variant':
    if (!Array.isArray(variants) || (variants.length < 1)) {
      throw new Error(`IAmValidator: Invalid ${path.join('.')}.variants`);
    }

    variants.forEach((variant, index) => {
      _validateTemplate(variant, path.concat('variants', index), {customTypeMap});

      const {hint} = variant;

      if ((hint !== undefined) && (typeof hint !== 'function')) {
        throw new Error(`IAmValidator: Invalid ${path.join('.')}.variants.${index}.hint`);
      }
    });

    break;
  default:
    break;
  }
}

function _createCustomTypeMap(customTypes) {
  const map = new Map();

  customTypes.forEach((customType, index) => {
    if (!customType || (typeof customType !== 'object')) {
      throw new Error(`IAmValidator: Invalid custom type [${index}]`);
    }

    const {basicType, match, type, validate} = customType;

    const typeOfType = typeof type;

    if (((typeOfType !== 'string') || BASIC_TYPES.includes(type)) && (typeOfType !== 'function')) {
      throw new Error(`IAmValidator: Invalid custom type [${index}].type`);
    }

    const typeOfBasicType = typeof basicType;

    if (((typeOfBasicType !== 'string') || !BASIC_TYPES.includes(basicType)) && (typeOfBasicType !== 'function')) {
      throw new Error(`IAmValidator: Invalid custom type [${index}].basicType`);
    }

    if ((match !== undefined) && (typeof match !== 'function')) {
      throw new Error(`IAmValidator: Invalid custom type [${index}].match`);
    }

    if ((typeOfBasicType === 'string') && !match) {
      throw new Error(`IAmValidator: Invalid custom type [${index}].match`);
    }

    if (typeof validate !== 'function') {
      throw new Error(`IAmValidator: Invalid custom type [${index}].validate`);
    }

    map.set(type, customType);

    if (!BASIC_TYPES.includes(type)) {
      map.set(basicType, customType);
    }
  });

  return map;
}

function createValidator(template, options = {}) {
  const {
    customTypes = [],
    maxDelayNsecs = NSEC_TO_MSEC_RATIO
  } = options;

  const customTypeMap = _createCustomTypeMap(customTypes);

  _validateTemplate(template, [], {customTypeMap});

  return {
    template,
    validate: (data, done, validateOptions = {}) => {
      const {
        context = {},
        maxDelayNsecs: maxDelayNsecsLocal = maxDelayNsecs
      } = validateOptions;

      return _validate(data, {
        context,
        customTypeMap,
        template,
        delayManager: _createDelayManager(maxDelayNsecsLocal),
        getData: path => path.reduce((acc, segment) => acc[segment], data),
        path: [],
      }, (err, result) => {
        if (!err) {
          done(null, result);

          return;
        }

        if (!err.customError) {
          done(err);

          return;
        }

        done({
          code: (typeof err.customError.code === 'string') ? err.customError.code : IAmValidatorErrorCode.CustomError,
          data: err.data,
          path: err.path,
          info: ((typeof err.customError.info === 'object') && err.customError.info) || {}
        });
      });
    }
  };
}

module.exports = {
  ExtraStrategy,
  IAmValidatorErrorCode,
  MissingStrategy,
  BASIC_TYPES,
  createValidator
};
