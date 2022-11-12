const assert = require('assert');

const {createValidator} = require('../../lib/v1');

describe('complex', () => {
  it('should validate complex data with asynchronous validateAfter', done => {
    const validator = createValidator({
      type: 'object',
      fields: {
        first: {
          type: 'object',
          fields: {
            list: {
              type: 'array',
              element: {
                type: 'object',
                fields: {
                  start: {
                    type: 'date'
                  },
                  end: {
                    type: 'date'
                  }
                }
              },
              validateAfter: (data, done) => setTimeout(() => {
                done(null, data);
              }, 10)
            }
          }
        },
        second: {
          type: 'string',
          regexp: /^[0-9]+$/,
          transformAfter: (data, d) => {
            d(null, Number(data));
          }
        }
      }
    }, {
      customTypes: [{
        type: 'date',
        basicType: Date,
        validate: (data, d) => {
          d(null, data.getTime());
        }
      }]
    });

    const start = new Date('2022-11-11T17:30:00.000Z');
    const end = new Date('2022-11-12T17:30:00.000Z');

    validator.validate({
      first: {
        list: [{
          start,
          end
        }]
      },
      second: '12345'
    }, (err, result) => {
      assert.strictEqual(err, null);
      assert.deepStrictEqual(result, {
        first: {
          list: [{
            start: start.getTime(),
            end: end.getTime()
          }]
        },
        second: 12345
      });

      done();
    });
  });

  it('should return error for complex data', done => {
    const validator = createValidator({
      type: 'object',
      fields: {
        first: {
          type: 'object',
          fields: {
            list: {
              type: 'array',
              element: {
                type: 'object',
                fields: {
                  start: {
                    type: 'date'
                  },
                  end: {
                    type: 'date'
                  }
                }
              }
            }
          }
        },
        second: {
          type: 'string',
          regexp: /^[0-9]+$/,
          transformAfter: (data, d) => {
            d(null, Number(data));
          }
        }
      }
    }, {
      customTypes: [{
        type: 'date',
        basicType: Date,
        validate: (data, d, {getData, path}) => {
          const startTime = getData(path.slice(0, -1)).start.getTime();

          if (data.getTime() > startTime) {
            d({
              code: 'TEST_ERROR',
              info: {
                extraTime: data.getTime() - startTime
              }
            });

            return;
          }

          d(null, data.getTime());
        }
      }]
    });

    const start = new Date('2022-11-11T17:30:00.000Z');
    const end = new Date('2022-11-12T17:30:00.000Z');

    validator.validate({
      first: {
        list: [{
          start,
          end
        }]
      },
      second: '12345'
    }, (err, result) => {
      assert.deepStrictEqual(err, {
        code: 'TEST_ERROR',
        data: end,
        info: {
          extraTime: end.getTime() - start.getTime()
        },
        path: ['first', 'list', 0, 'end']
      });
      assert.strictEqual(result, undefined);

      done();
    });
  });
});
