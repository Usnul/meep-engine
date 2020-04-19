import { BinaryBuffer } from "../../../../../core/binary/BinaryBuffer.js";
import { executeBinaryClassUpgraderChain } from "../BinaryClassUpgrader.js";
import { assert } from "../../../../../core/assert.js";

/**
 * Tool for serializing and deserializing whole objects
 * TODO add support for null serialization
 * TODO add dictionary support
 */
export class BinaryObjectSerializationAdapter {
    constructor() {

        /**
         *
         * @type {BinarySerializationRegistry}
         */
        this.registry = null;

        /**
         *
         * @type {BinaryBuffer}
         * @private
         */
        this.__upgradeBuffer0 = new BinaryBuffer();
        /**
         *
         * @type {BinaryBuffer}
         * @private
         */
        this.__upgradeBuffer1 = new BinaryBuffer();
    }

    /**
     *
     * @param {BinarySerializationRegistry} registry
     */
    initialize(registry) {
        assert.defined(registry);
        assert.ok(registry.isBinarySerializationRegistry, 'registry is not BinarySerializationRegistry');

        this.registry = registry;
    }


    /**
     * Serialize an object of a given class
     * @param {*} object Object to be serialized
     * @param {String} [className] Class name of the object, this will be looked up in the registry
     * @param {BinaryBuffer} buffer target buffer for the object data to be written into
     */
    serialize(buffer, object, className) {
        assert.defined(buffer);
        assert.defined(object);


        if (className === undefined) {
            //class name is not specified, try to infer it

            const Klass = object.__proto__.constructor;

            const typeName = Klass.typeName;

            if (typeof typeName === "string") {
                className = typeName;
            } else {
                throw new Error(`className not specified, could not infer class name from the class itself`);
            }
        }

        const adapter = this.registry.getAdapter(className);

        if (adapter === undefined) {
            throw new Error(`No adapter found for class '${className}'`);
        }

        buffer.writeUTF8String(className);
        buffer.writeUintVar(adapter.getVersion());

        adapter.initialize(this);

        adapter.serialize(buffer, object);
    }

    /**
     * @template T
     * @param {BinaryBuffer} buffer
     * @returns {T}
     */
    deserialize(buffer) {
        //read class of the object
        const klass = buffer.readUTF8String();

        /**
         * Get serialization adapter
         * @type {BinaryClassSerializationAdapter}
         */
        const adapter = this.registry.getAdapter(klass);

        if (adapter === undefined) {
            throw new Error(`No adapter found for class '${klass}'`);
        }

        //serialization format version
        const version = buffer.readUintVar();

        const adapterVersion = adapter.getVersion();

        if (version !== adapterVersion) {
            //upgrade is required

            const upgradersChain = this.registry.getUpgradersChain(klass, version, adapterVersion);

            if (upgradersChain === null) {
                throw new Error(`No upgrade chain fond for klass '${klass}' from version ${version} to current adapter version ${adapterVersion}`);
            }

            buffer = executeBinaryClassUpgraderChain(upgradersChain, buffer, this.__upgradeBuffer0, this.__upgradeBuffer1);
        }

        const Klass = adapter.getClass();

        const value = new Klass();

        adapter.initialize(this);

        adapter.deserialize(buffer, value);

        return value;
    }
}
