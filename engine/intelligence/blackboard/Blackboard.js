import DataType from "../../../core/parser/simple/DataType.js";
import Vector1 from "../../../core/geom/Vector1.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import { assert } from "../../../core/assert.js";
import { BinaryClassSerializationAdapter } from "../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import ObservedString from "../../../core/model/ObservedString.js";

/**
 *
 * @param {DataType} type
 * @returns {Vector1|ObservedBoolean}
 */
function createValueByType(type) {

    let value;

    switch (type) {
        case DataType.Number:
            value = new Vector1(0);
            break;
        case DataType.Boolean:
            value = new ObservedBoolean(false);
            break;
        case DataType.String:
            value = new ObservedString("");
            break;
        default:
            throw new TypeError(`Unsupported data type '${type}'`);
    }

    return value;
}

class BlackboardValue {
    /**
     *
     * @param {DataType} type
     */
    constructor(type) {
        /**
         *
         * @type {number}
         */
        this.referenceCount = 0;
        /**
         *
         * @type {DataType}
         */
        this.type = type;
        this.value = createValueByType(type);
    }
}

export class Blackboard {
    constructor() {

        /**
         *
         * @type {Object<string,BlackboardValue>}
         */
        this.data = {};

        /**
         * @private
         */
        this.proxy = new Proxy(this, {
            /**
             *
             * @param target
             * @param {string} p
             * @param receiver
             * @returns {*}
             */
            get(target, p, receiver) {
                const data = target.data;

                if (!data.hasOwnProperty(p)) {
                    return undefined;
                }

                const blackboardValue = data[p];

                const resolved_value = blackboardValue.value.getValue();

                return resolved_value;
            },
            set(target, p, value, receiver) {


                const blackboardValue = target.data[p];

                if (blackboardValue === undefined) {
                    return undefined;
                }

                blackboardValue.value.set(value);

            },
            ownKeys(target) {

                return Reflect.ownKeys(target.data);

            }
        });
    }

    /**
     *
     * @returns {Object}
     */
    getValueProxy() {
        return this.proxy;
    }

    /**
     *
     * @param {function(name:string, value:*, type: DataType)} visitor
     */
    traverse(visitor) {
        assert.typeOf(visitor, 'function', 'visitor');

        for (let name in this.data) {
            if (!this.data.hasOwnProperty(name)) {
                continue;
            }

            const blackboardValue = this.data[name];

            visitor(name, blackboardValue.value, blackboardValue.type);
        }
    }

    /**
     *
     * @param {function(name:string, value:*, type: DataType)} visitor
     * @param {RegExp} pattern
     */
    traverseWithPattern(pattern, visitor) {
        assert.notEqual(pattern, undefined, 'pattern is undefined');
        assert.ok(pattern instanceof RegExp, 'pattern is not a RegExp');

        this.traverse(function (name, value, type) {
            if (pattern.test(name)) {
                visitor(name, value, type);
            }
        });
    }

    /**
     *
     * @param {string} name
     * @param {boolean} [initialValue=false]
     * @returns {ObservedBoolean}
     */
    acquireBoolean(name, initialValue = false) {
        return this.acquire(name, DataType.Boolean, initialValue);
    }

    /**
     *
     * @param {string} name
     * @param {number} [initialValue=0]
     * @returns {Vector1}
     */
    acquireNumber(name, initialValue = 0) {
        return this.acquire(name, DataType.Number, initialValue);
    }

    /**
     *
     * @param {string} name
     * @param {string} [initialValue]
     * @returns {ObservedString}
     */
    acquireString(name, initialValue = '') {
        assert.typeOf(initialValue, 'string', 'initialValue');

        return this.acquire(name, DataType.String, initialValue);
    }

    /**
     * @template T
     * @param {string} name
     * @param {DataType} type
     * @param {number|boolean} [initialValue]
     * @returns {T}
     */
    acquire(name, type, initialValue) {
        assert.typeOf(name, 'string', 'name');

        if (this.data.hasOwnProperty(name)) {
            const datum = this.data[name];

            if (type !== DataType.Any && datum.type !== type) {
                throw new TypeError(`Value '${name}' exists, but is type(='${datum.type}'), expected type '${type}'`);
            }

            datum.referenceCount++;

            return datum.value;
        } else {
            //doesn't exist - create it
            const blackboardValue = new BlackboardValue(type);

            if (initialValue !== undefined) {
                blackboardValue.value.set(initialValue);
            }

            this.data[name] = blackboardValue;

            return blackboardValue.value;
        }
    }

    /**
     *
     * @param {string} name
     */
    release(name) {
        assert.typeOf(name, 'string', 'name');
        assert.ok(this.data.hasOwnProperty(name), `Attempting to release a value '${name}' that doesn't exist`);

        const datum = this.data[name];

        datum.referenceCount--;

        //todo cleanup value from blackboard if no one is using it
    }

    /**
     * Drop all values
     */
    reset() {
        this.data = {};
    }


    toJSON() {
        const result = {};

        this.traverse((name, value, type) => {
            result[name] = value.toJSON();
        });

        return result;
    }

    fromJSON(json) {
        this.reset();

        for (let propName in json) {
            const value = json[propName];

            if (typeof value === 'number') {
                this.acquireNumber(propName, value).set(value);
            } else if (typeof value === 'boolean') {
                this.acquireNumber(propName, value).set(value);
            }
        }
    }
}

Blackboard.typeName = 'Blackboard';

export class BlackboardSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Blackboard;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Blackboard} value
     */
    serialize(buffer, value) {

        const keys = Object.keys(value.data);

        const numKeys = keys.length;

        buffer.writeUint32(numKeys);
        for (let i = 0; i < numKeys; i++) {
            const key = keys[i];

            // write key
            buffer.writeUTF8String(key);

            const datum = value.data[key];

            //write type
            switch (datum.type) {
                case DataType.Number:
                    buffer.writeUint8(1);
                    break;
                case DataType.Boolean:
                    buffer.writeUint8(2);
                    break;
                case DataType.String:
                    buffer.writeUint8(3);
                    break;
                default:
                    throw new TypeError(`Unexpected data type '${datum.type}'`);
            }

            //write value
            datum.value.toBinaryBuffer(buffer);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Blackboard} value
     */
    deserialize(buffer, value) {
        const data = {};

        const numKeys = buffer.readUint32();

        for (let i = 0; i < numKeys; i++) {
            const key = buffer.readUTF8String();

            const typeFlag = buffer.readUint8();

            let type;
            switch (typeFlag) {
                case 1:
                    type = DataType.Number;
                    break;
                case 2:
                    type = DataType.Boolean;
                    break;
                case 3:
                    type = DataType.String;
                    break;
                default:
                    throw new TypeError(`Unexpected data type flag '${typeFlag}'`);
            }

            const blackboardValue = new BlackboardValue(type);

            //read data value
            blackboardValue.value.fromBinaryBuffer(buffer);

            data[key] = blackboardValue;
        }

        value.data = data;
    }
}
