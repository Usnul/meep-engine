function equal(a, b, m) {
    assert(a === b, m) // eslint-disable-line eqeqeq
}

function notEqual(a, b, m) {
    assert(a !== b, m) // eslint-disable-line eqeqeq
}

function notOk(t, m) {
    assert(!t, m)
}

/**
 *
 * @param {object} a
 * @param {object} b
 * @param {string} [m]
 */
function logicalEquals(a, b, m) {
    assert.ok(a.equals(b), m);
}

function assert(t, m) {
    if (!t) {
        throw new Error(m || 'AssertionError')
    }
}

/**
 *
 * @param {number} a
 * @param {number} b
 * @param {string} [m]
 */
function greaterThan(a, b, m) {
    assert.equal(typeof a, 'number');
    assert.equal(typeof b, 'number');

    if (!(a > b)) {
        let message = '';

        if (m !== undefined) {
            message += m + '. ';
        }

        message += `Expected ${a} > ${b}.`;

        throw new Error(message);
    }
}

/**
 *
 * @param {number} a
 * @param {number} b
 * @param {string} [m]
 */
function greaterThanOrEqual(a, b, m) {
    assert.equal(typeof a, 'number');
    assert.equal(typeof b, 'number');

    if (!(a >= b)) {
        let message = '';

        if (m !== undefined) {
            message += m + '. ';
        }

        message += `Expected ${a} >= ${b}.`;

        throw new Error(message);
    }
}

const typeOfTypes = ['string', 'boolean', 'number', 'object', 'undefined', 'function', 'symbol'];

/**
 *
 * @param {*} value
 * @param {string} type
 * @param {string} valueName
 */
function typeOf(value, type, valueName = 'value') {

    assert.notEqual(typeOfTypes.indexOf(type), -1, `type must be one of [${typeOfTypes.join(', ')}], instead was '${type}'`);
    assert.equal(typeof valueName, 'string', `valueName must be a string, instead was '${typeof valueName}'`);

    assert.equal(typeof value, type, `expected ${valueName} to be ${type}, instead was '${typeof value}'(=${value})`);
}

/**
 * @template T
 * @param {T[]} haystack
 * @param {T} needle
 * @param {string} [message]
 */
function arrayHas(haystack, needle, message = 'Array does not contain the item') {
    assert.notEqual(haystack.indexOf(needle), -1, message);
}

/**
 * @template T
 * @param {T[]} haystack
 * @param {T} needle
 * @param {string} [message]
 */
function arrayHasNo(haystack, needle, message = 'Array contains the item') {
    assert.equal(haystack.indexOf(needle), -1, message);
}

/**
 * @template T
 * @param {T} value
 * @param {Object<T>} enumerable
 * @param {string} [name]
 */
assert.enum = function (value, enumerable, name = 'value') {
    for (let n in enumerable) {
        if (enumerable[n] === value) {
            return;
        }
    }

    throw new Error(`${name}(=${value}) is not a valid enumerable value, valid values are: [${Object.values(enumerable).join(', ')}]`);
};

assert.notEqual = notEqual;
assert.notOk = notOk;
assert.equal = equal;
assert.logicalyEqual = logicalEquals;
assert.ok = assert;
assert.greaterThan = greaterThan;
assert.greaterThanOrEqual = greaterThanOrEqual;
assert.typeOf = typeOf;
assert.arrayHas = arrayHas;
assert.arrayHasNo = arrayHasNo;


/**
 *
 * @param {*} value
 * @param {String} [name]
 */
assert.defined = function (value, name = "value") {

    if (value === undefined) {
        throw new Error(`${name} is undefined`);
    }

};

/**
 *
 * @param {*} value
 * @param {String} [name]
 */
assert.notNull = function (value, name = "value") {

    if (value === null) {
        throw new Error(`${name} is null`);
    }

};

/**
 *
 * @param {number} value
 * @param {string} name
 */
assert.notNaN = function (value, name = "value") {
    assert.ok(!Number.isNaN(value), `${name} must be a valid number, instead was NaN`);
};

/**
 *
 * @param {number} value
 * @param {string} name
 */
assert.isFiniteNumber = function (value, name = "value") {
    assert.ok(Number.isFinite(value), `${name} must be a finite number, instead was ${value}`);
};

export {
    assert
};
