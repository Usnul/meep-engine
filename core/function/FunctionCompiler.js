import { isArrayEqualStrict } from "../collection/ArrayUtils.js";
import { computeHashArray, computeHashIntegerArray } from "../math/MathUtils.js";
import { computeStringHash, computeUTF8StringByteSize } from "../primitives/strings/StringUtils.js";
import { Cache } from "../Cache.js";
import { assert } from "../assert.js";

class FunctionDefinition {
    /**
     *
     * @param {string} [name]
     * @param {string} body
     * @param {string[]} [args]
     */
    constructor({ name, body, args = [] }) {
        assert.typeOf(body, 'string', 'body');

        /**
         *
         * @type {string}
         */
        this.name = name;
        /**
         *`
         * @type {string[]}
         */
        this.args = args;
        /**
         *
         * @type {string}
         */
        this.body = body;

        /**
         *
         * @type {number}
         * @private
         */
        this.__hash = 0;

        this.updateHash();

    }

    updateHash() {
        this.__hash = computeHashIntegerArray(
            computeStringHash(this.name),
            computeStringHash(this.body),
            computeHashArray(this.args, computeStringHash)
        );
    }

    /**
     *
     * @return {number}
     */
    computeByteSize() {

        let result = computeUTF8StringByteSize(this.body);

        if (this.name !== undefined) {
            result += computeUTF8StringByteSize(this.name);
        }

        const n = this.args.length;
        for (let i = 0; i < n; i++) {
            const arg = this.args[i];

            result += computeUTF8StringByteSize(arg);
        }

        return result;
    }

    /**
     *
     * @param {FunctionDefinition} other
     * @returns {boolean}
     */
    equals(other) {
        return this.name === other.name
            && this.body === other.body
            && isArrayEqualStrict(this.args, other.args)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return this.__hash;
    }
}

/**
 * Optimization structure, caches functions internally to avoid creating multiple identical functions
 */
export class FunctionCompiler {
    constructor() {
        /**
         *
         * @type {Cache<FunctionDefinition, Function>}
         * @private
         */
        this.cache = new Cache({
            maxWeight: 10383360,
            keyWeigher(k) {
                return k.computeByteSize();
            },
            keyHashFunction(k) {
                return k.hash();
            },
            keyEqualityFunction(a, b) {
                return a.equals(b);
            }
        });
    }

    /**
     *
     * @param {string} code
     * @param {string[]} [args]
     * @param {string} [name]
     */
    compile({ code, args = [], name }) {
        assert.typeOf(code, 'string', 'code');
        assert.isArray(args, 'args');

        const fd = new FunctionDefinition({ body: code, args, name });

        const existing = this.cache.get(fd);

        if (existing === null) {


            const f = new Function(args.join(","), code);

            if (name !== undefined) {
                //give function a name
                Object.defineProperty(f, "name", { value: name });
            }

            //cache
            this.cache.put(fd, f);

            return f;

        } else {

            return existing;
        }
    }
}

FunctionCompiler.INSTANCE = new FunctionCompiler();
