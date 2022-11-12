# IamValidator

JS object validator

**WARNING: BREAKING CHANGES!** The package has been rewritten. New version is exported under `v1`.
To keep backward compatibility, old version is exported as before. Old README is available under tha name `READMEv0.md`

The new version is not compatible with the old one. Some of new features/changes:

* Callbacks are used to allow asynchronous validation.
* New custom method (`validateBefore`, `validateAfter`, etc.) signatures (all options are passed as object)
* Constraint names are changed (e.g. `min -> minValue (number) / minLength (array)`)
* Some error codes are replaced/changed, new ones are introduced
* `extraData` is renamed to `info`
* `path` is now always an array and there is no root element now

# Example

```js
const {createValidator} = require('iamvalidator').v1;
const DB = require('../lib/database');

const UserValidator = createValidator({
  type: 'object',
  fields: {
    nickname: {
      type: 'string',           // Nickname must be a string
      minLength: 4,                   // with a minimum length of 4
      maxLength: 20,                  // and maximum length of 20
      regexp: /^[a-zA-Z0-9_]+$/ // consisting of latin letters, digits and underscores
    },
    password: {
      type: 'string', // password must be a string
      minLength: 8,         // with a minimum length of 8
      maxLength: 32,        // and maximum length of 32
      validate: (pwd, done) => {
        // A password must contain at least one digin
        if (!/[0-9]/.test(pwd)) {
          done({code: 'PASSWORD_HAS_NO_DIGITS'});

          return;
        }

        // A password must contain at least one lowercase letter
        if (!/[a-z]/.test(pwd)) {
          done({code: 'PASSWORD_HAS_NO_LOWERCASE_LETTERS'});

          return;
        }

        // A password must contain at least one uppercase letter
        if (!/[A-Z]/.test(pwd)) {
          done({code: 'PASSWORD_HAS_NO_UPPERCSE_LETTERS'});

          return;
        }

        done(null, pwd);
      },
      transformAfter: async (pwd, done) => {
        try {
          const salt = await DB.from('salt').select('value').where('type', '=', "'password'");

          // A password must be hashed after validation
          done(null, Crypto.createHash('sha1').update(pwd).update(salt).digest('hex'));
        } catch (err) {
          done({code: 'INTERNAL_ERROR'});
        }
      }
    },
    kittens: {
      type: 'number',
      minValue: 0,
      transformBefore: (count, done) => {
        // A value may be passed as a string, and it will be converted to number before any validation
        done(null, Number(count));
      }
    }
  }
});

let user1 = {
  nickname: 'Vasia',
  password: 'pwd123PWD',
  kittens: 1
};

let user2 = {
  nickname: 'Petia)))',
  password: 'pwd321PWD',
  kittens: 0
};

let user3 = {
  nickname: 'Slava',
  password: '123',
  kittens: '0'
};

let user4 = {
  nickname: 'Slava',
  password: 123,
  kittens: '2'
};

UserValidator.validate(user1, (err, result) => {
  console.log(err, result);

  /* null, {
    nickname: 'Vasia',
    password: 'f3e4c83aa7c6a1da18f1facf63dcdf21c3f8a881'
  } */
});

UserValidator.validate(user2, (err, result) => {
  console.log(err, result);

  /* {
    code: 'INVALID_STRING',
    data: 'Petia)))',
    path: ['nickname'],
    info: {}
  } */
});

UserValidator.validate(user3, (err, result) => {
  console.log(err, result);

  /* {
    code: 'PASSWORD_HAS_NO_LOWERCASE_LETTERS',
    data: '123',
    path: ['password'],
    info: {}
  } */
});

UserValidator.validate(user4, (err, result) => {
  console.log(err, result);

  /* {
    code: 'TYPE_MISMATCH',
    data: 123,
    path: ['password'],
    info: {
      expectedType: 'string'
    }
  } */
});
```

# API

## createValidator(template, {customTypes = []} = {})

Creates a validator. Accepts validation template, an object in the following form:

```
{
  type: <type>,
  missingStartegy: [MissingStrategy], // optional
  extraStrategy: [ExtraStrategy], // optional
  defaultValue: [default_value], // optional, only required if missingStartegy is MissingStrategy.Default
  values: Array|Set, // optional, an array or set of values allowed, only valid for types 'string', 'boolean', 'number'
  validateBefore: (data, done, options) => {}, // optional, a custom validation function called before other validators
  validateAfter: (data, done, options) => {}, // optional, a custom validation function called after other validators
  transformBefore: (data, done, options) => {}, // optional, a custom function to transform the object before validation
  transformAfter: (data, done, options) => {}, // optional, a custom function to transform the object after validation
  // ...fields specific for the <type>
}
```

`validateBefore` validates data after checking the type, but before any default validators.
`validateAfter` validates data after default validators, just before `transformAfter`.

Example:

```
{
  type: 'string',
  regexp: /\d+/,
  transformAfter: (value, done) => done(null, Number(value))
}
```

### validate(data, done, {context = {}} = {})

Performs validation.

* `data` -- data to be validated
* `done` -- callback function called after validation with either `(null, newData)` or `(error)`

Possible options are:

* `context` -- a context passed to custom validation functions (empty array by default)

### IAmValidatorErrorCode

Constant containing the error codes:

```
{
    BooleanNotInValues: 'BOOLEAN_NOT_IN_VALUES',
    CustomError: 'CUSTOM_ERROR',
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
}
```

## Types

There are several builtin types. 

### object

A JavaScript object.

Example:

```
{
  type: 'object',
  fields: {
    // nested fields
  }
}
```

### array

A JavaScript array.

Example:

```
{
  type: 'array',
  element: {
    // element definition
  }
}
```

### string

A string.

Example:

```
{
  type: 'string',
  minLength: [M], // optional, minimum string length
  maxLength: [N], // optional, maximum string length
  length: [K], // optional, exact string length
  regexp: [R] // optional, a regular expression to match the string against
}
```

### number

A number.

Example:

```
{
  type: 'number',
  minValue: [M], // optional, minimum value
  maxValue: [N], // optional, maximum value
  isInteger: [true|false] // optional, specifies if number must be an integer
}
```

### boolean

A boolean.

Example:

```
{
  type: 'boolean'
}
```

### variant

Used to validate against multiple templates. The result of first successful validation is used.

Example:

```
{
  type: 'variant',
  variants: [{
    type: 'string',
    regexp: /\d+/,
    transformAfter: (data, done) => done(null, Number(value))
  }, {
    type: 'number'
  }]
}
```

If `hint` function is provided to template variants, raw data is checked against that function.
Templates with `hint` returning `false`-ish values are excluded from validation.
Templates are used in the same order they are specified.
This may be used to optimize large template validation.
Example:

```
[{
  type: 'object',
  hint: (rawValue, done) => done(rawValue.kind === 'KIND_A'),
  fields: {
    kind: {
      type: 'string',
      values: ['KIND_A']
    }
    // Dozens of fields for kind A
  }
}, {
  type: 'object',
  hint: (rawValue, done) => done(rawValue.kind === 'KIND_B'),
  fields: {
    kind: {
      type: 'string',
      values: ['KIND_B']
    }
    // Dozens of fields for kind B, different from the ones for kind A
  }
}]
```

If no variant matches the data, a NoMatchingVariant error occurs.

## Advanced

### isNullable

Any type can be allowed to be null.

Example:

```
{
  type: 'string',
  isNullable: true
}
```

### Object prototype (class) as "type"

Example:

```
class CustomClass {
  constructor() {
    //
  }
}

{
  type: CustomClass
}
```

`customTypes` may be used to validate instances of a class and preserve them as is. If no validator is specified,
`'object'` validator is used by default. This leads to loss of some properties (like instance methods) as objects are
mapped (no reference equality of input and output data).
