# IamValidator

JS object validator

# Example

```
const Validator = require('iamvalidator');
const ValidatorError = Validator.IamValidatorError;
const Crypto = require('crypto');

const SALT = 'salt';

const UserValidator = new Validator({
  type: 'object',
  fields: {
    nickname: {
      type: 'string',           //Nickname must be a string
      min: 4,                   //with a minimum length of 4
      max: 20,                  //and maximum length of 20
      regexp: /^[a-zA-Z0-9_]+$/ //consisting of latin letters, digits and underscores
    },
    password: {
      type: 'string', //password must be a string
      min: 8,         //with a minimum length of 8
      max: 32,        //and maximum length of 32
      validate: (pwd) => {
        //A password must contain at least one digin
        if (!/[0-9]/.test(pwd)) {
          throw new ValidatorError('PASSWORD_HAS_NO_DIGITS');
        }
        //A password must contain at least one lowercase letter
        if (!/[a-z]/.test(pwd)) {
          throw new ValidatorError('PASSWORD_HAS_NO_LOWERCASE_LETTERS');
        }
        //A password must contain at least one uppercase letter
        if (!/[A-Z]/.test(pwd)) {
          throw new ValidatorError('PASSWORD_HAS_NO_UPPERCSE_LETTERS');
        }
      },
      transformAfter: (pwd) => {
        //A password must be hashed after validation
        return Crypto.createHash('sha1').update(pwd).update(SALT).digest('hex');
      }
    },
    kittens: {
      type: 'number',
      min: 0,
      transformBefore: (count) => {
        //A value may be passed as a string, and it will be converted to number before any validation
        return Number(count);
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

try {
  console.log(UserValidator.validate(user1));
  /*{
    nickname: 'Vasia',
    password: 'f3e4c83aa7c6a1da18f1facf63dcdf21c3f8a881'
  }*/
} catch (err) {
  console.error(err);
}

try {
  console.log(UserValidator.validate(user2));
} catch (err) {
  console.error(err); //INVALID_STRING
}

try {
  console.log(UserValidator.validate(user3));
} catch (err) {
  console.error(err); //PASSWORD_HAS_NO_LOWERCASE_LETTERS
}

try {
  console.log(UserValidator.validate(user4));
} catch (err) {
  console.error(err); //TYPE_MISMATCH
}
```

# API

## IamValidator

Class representing a validator

### IamValidator.registerValidator(typeName, validator)

Registers a validation function for the type specified.

`validator` function is called with the following parameters:

* `TEMPLATE` -- validation template
* `data` -- data to validate
* `path` -- path to field being validated (`_root`, `_root.field1`, `_root.field1.sub_field2`, etc.)
* `options` -- options passed to `IamValidator.validate` method

The function must return the validated data, or throw an error.

### constructor(TEMPLATE)

Validator object constructor. Accepts validation template, an object in the following form:

```
{
  type: '<type>',
  missing: '<ignore>|<default>', //optional
  default: '<default_value>', //required if 'missing' is specified
  values: [], //optional, a set of values allowed for this object
  validate: (TEMPLATE, data, path, options) => {}, //optional, a custom validation function
  transformBefore: (data) => {}, //optional, a custom function to transform the object before any validation
  transformAfter: (data) => {}, //optional, a custom function to transform the object after validation
  //fields specific for the <type>
}
```

Also accepts an array of validation templates.
In case an array os passed, the values will be matched against every template consequently.
The result of the *first* positive match will be returned.
If not template matches, the error produced *last* will be thrown.

### validate(data, [options])

Performs validation.

Possible options are:

* `ignoreMissing` -- force missing fields to be ignored

Returns the validated data.

## IamValidator.IamValidatorError

Class inheriting Node.js Error class. Represents a validation error.

### IamValidatorError.CODES

Constant containing the error codes:

* `EXTRA_FIELDS`
* `MISSING_DEFAULT_FIELD`
* `MISSING_FIELD`
* `ELEMENT_NOT_SPECIFIED`
* `TYPE_MISMATCH`
* `NO_VALIDATOR`
* `NOT_IN_VALUES`

### constructor(code, [extraData])

Error object constructor.

`extraData` is an optional argument, used to attach arbitrary extra data to an error object instance.

## Types

There are several builtin types. `type-of-is` pachage is used to determine object's type.

### object

A JavaScript object.

Example:

```
{
  type: 'object',
  fields: {
    //nested fields
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
    //element definition
  }
}
```

### string

A string.

Example:

```
{
  type: 'string',
  min: <M>, //optional, minimum string length
  max: <N>, //optional, maximum string length
  length: <K>, //optional, exact string length
  regexp: <R> //optional, a regular expression to match the string against
}
```

### number

A number.

Example:

```
{
  type: 'number',
  min: <M>, //optional, minimum value
  max: <N>, //optional, maximum value
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

### date

An instance of JavaScript Date object.

Example:

```
{
  type: 'date'
}
```

### null

Null object.

Example:

```
{
  type: 'null'
}
```

## Advanced
### isNullable
Any type can be allowed to be null.

Example:

```
{
  type: 'date',
  isNullable: true
}
```
