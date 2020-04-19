import { assert } from "../../../../core/assert.js";

/**
 * Upgrade binary data by executing a sequnece of upgraders on it
 * @param {BinaryClassUpgrader[]} upgraders
 * @param {BinaryBuffer} buffer
 * @param {BinaryBuffer} tempBuffer0
 * @param {BinaryBuffer} tempBuffer1
 * @return {BinaryBuffer} new buffer with upgraded data
 */
export function executeBinaryClassUpgraderChain(upgraders, buffer, tempBuffer0, tempBuffer1) {
    assert.ok(Array.isArray(upgraders), 'upgraders must be an array, instead was something else');
    assert.defined(buffer);
    assert.defined(tempBuffer0);
    assert.defined(tempBuffer1);


    /**
     *
     * @type {BinaryBuffer[]}
     */
    const tempBuffers = [tempBuffer0, tempBuffer1];

    let sourceBuffer = buffer;
    let targetBuffer = tempBuffer0;

    const upgraderCount = upgraders.length;

    //perform upgrade
    for (
        let i = 0;
        i < upgraderCount;
        i++, sourceBuffer = targetBuffer, targetBuffer = tempBuffers[i % 2]
    ) {
        const upgrader = upgraders[i];

        targetBuffer.position = 0;

        upgrader.upgrade(sourceBuffer, targetBuffer);

        //rewind target buffer so it can be read
        targetBuffer.position = 0;
    }

    return sourceBuffer;
}

export class BinaryClassUpgrader {
    constructor() {
        /**
         *
         * @type {number}
         * @protected
         */
        this.__startVersion = 0;
        /**
         *
         * @type {number}
         * @protected
         */
        this.__targetVersion = 0;
    }


    /**
     *
     * @returns {number}
     */
    getStartVersion() {
        return this.__startVersion;
    }

    /**
     *
     * @returns {number}
     */
    getTargetVersion() {
        return this.__targetVersion;
    }

    /**
     *
     * @param {BinaryBuffer} source
     * @param {BinaryBuffer} target
     */
    upgrade(source, target) {
        throw new Error('Not Implemented');
    }
}
