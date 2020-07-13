import { BitSet } from "../../../../../../core/binary/BitSet.js";
import { itemSizeFromAttributeType, typedArrayConstructorFromDataType } from "../../group/ParticleGroup.js";
import { BufferAttribute, BufferGeometry, DynamicDrawUsage } from 'three';
import ObservedValue from "../../../../../../core/model/ObservedValue.js";
import { max3 } from "../../../../../../core/math/MathUtils.js";

const SHRINK_THRESHOLD = 64;
const GROW_MIN_STEP = 32;

export class ParticlePool {
    /**
     *
     * @param {ParticleSpecification} spec
     * @constructor
     */
    constructor(spec) {
        /**
         *
         * @type {ParticleSpecification}
         */
        this.spec = spec;

        /**
         *
         * @type {BitSet}
         */
        this.occupancy = new BitSet();

        /**
         *
         * @type {BufferAttribute[]}
         */
        this.attributes = [];

        /**
         * @type {ObservedValue.<BufferGeometry>}
         */
        this.geometry = new ObservedValue(null);

        /**
         *
         * @type {number}
         */
        this.growFactor = 1.3;

        /**
         *
         * @type {number}
         */
        this.shrinkFactor = 0.5;

        /**
         *
         * @type {number}
         */
        this.capacity = 16;

        this.build();
    }

    size() {
        return this.occupancy.size();
    }

    /**
     *
     * @returns {number}
     */
    create() {
        //find an empty place in the pool
        const index = this.occupancy.nextClearBit(0);

        //reserve place
        this.occupancy.set(index, true);

        //ensure attribute arrays are large enough
        if (this.capacity < index + 1) {
            this.growCapacity(index + 1);
        }

        return index;
    }

    /**
     * Returns true if particle has discontinuous unused slots (holes)
     * @returns {boolean}
     */
    hasHoles() {
        return this.occupancy.nextClearBit(0) < this.occupancy.size();
    }

    /**
     *
     * @param {number} index
     */
    remove(index) {
        this.occupancy.set(index, false);
    }

    /**
     * Remove holes from the occupancy set
     */
    compact() {
        const occupancy = this.occupancy;

        const specAttributes = this.spec.attributes;
        const numAttributes = specAttributes.length;

        let holeIndex, lastIndex, attributeIndex;

        holeIndex = occupancy.nextClearBit(0);
        lastIndex = occupancy.previousSetBit(occupancy.size());

        while (holeIndex < lastIndex) {

            //move occupancy flag from the last to the hole
            occupancy.set(holeIndex, true);
            occupancy.set(lastIndex, false);

            //move attribute values
            for (attributeIndex = 0; attributeIndex < numAttributes; attributeIndex++) {
                const attribute = this.attributes[attributeIndex];

                const itemSize = attribute.itemSize;

                /**
                 *
                 * @type {Float32Array}
                 */
                const oldArray = attribute.array;

                //do swaps in the old array
                const targetIndex = holeIndex * itemSize;
                const sourceIndex = lastIndex * itemSize;

                oldArray.copyWithin(targetIndex, sourceIndex, sourceIndex + itemSize);
            }

            //move hole and last cursors
            holeIndex = occupancy.nextClearBit(holeIndex + 1);
            lastIndex = occupancy.previousSetBit(lastIndex);
        }

        this.geometry.getValue().setDrawRange(0, occupancy.size());
    }

    updateAttributes() {
        const attributes = this.attributes;
        const numAttributes = attributes.length;

        const activeParticleLimit = this.occupancy.size();

        if (activeParticleLimit <= 0) {
            // no particles, no need to update attributes
            return;
        }

        let i = 0;

        for (; i < numAttributes; i++) {
            const attribute = attributes[i];

            attribute.updateRange.count = activeParticleLimit * attribute.itemSize;
            attribute.updateRange.offset = 0;

            //mark attribute for update
            attribute.needsUpdate = true;
        }
    }

    update() {
        //some of the particles may have died and formed holes in the data array, compaction removes them
        this.compact();

        //attempt attribute size shrinkage
        const size = this.occupancy.size();
        this.shrinkCapacity(size);

        this.updateAttributes();
    }

    /**
     * Swap two particles identified by index
     * NOTE: Only attributes are swapped, occupancy is unaffected.
     * @param {number} indexA
     * @param {number} indexB
     */
    swap(indexA, indexB) {
        //assert.ok(this.occupancy.get(indexA), `indexA=${indexA} is unoccupied`);
        //assert.ok(this.occupancy.get(indexB), `indexB=${indexB} is unoccupied`);

        const attributes = this.attributes;
        const numAttributes = attributes.length;

        let i, j;

        for (i = 0; i < numAttributes; i++) {
            const attribute = attributes[i];

            const itemSize = attribute.itemSize;

            const offsetA = indexA * itemSize;
            const offsetB = indexB * itemSize;

            const array = attribute.array;

            for (j = 0; j < itemSize; j++) {
                const addressA = offsetA + j;
                const addressB = offsetB + j;

                const elementA = array[addressA];

                array[addressA] = array[addressB];

                array[addressB] = elementA;
            }
        }
    }

    build() {
        const geometry = new BufferGeometry();
        geometry.dynamic = true;

        const l = this.spec.attributes.length;

        for (let i = 0; i < l; i++) {

            /**
             * @type {ParticleAttribute}
             */
            const attributeSpec = this.spec.attributes[i];

            const itemSize = itemSizeFromAttributeType(attributeSpec.type);
            const TypedArrayConstructor = typedArrayConstructorFromDataType(attributeSpec.dataType);

            const newArrayLength = itemSize * this.capacity;
            const newArray = new TypedArrayConstructor(newArrayLength);

            const attribute = this.attributes[i];
            if (attribute !== undefined && attribute.count !== 0) {
                //copy old data
                newArray.set(attribute.array.subarray(0, Math.min(newArrayLength, attribute.array.length)));
            }

            const newAttribute = new BufferAttribute(newArray, itemSize);

            newAttribute.setUsage(DynamicDrawUsage);
            newAttribute.name = attributeSpec.name;

            this.attributes[i] = newAttribute;

            geometry.setAttribute(attributeSpec.name, newAttribute);
        }

        const oldGeometry = this.geometry.getValue();

        this.geometry.set(geometry);

        if (oldGeometry !== null) {
            //dispose of old geometry
            oldGeometry.dispose();
        }

        geometry.setDrawRange(0, this.occupancy.size());
    }

    /**
     *
     * @param {number} capacity
     */
    growCapacity(capacity) {
        const newCapacity = Math.floor(max3(capacity, this.capacity * this.growFactor, this.capacity + GROW_MIN_STEP));
        this.setCapacity(newCapacity);
    }

    /**
     *
     * @param {number} newCapacity
     */
    shrinkCapacity(newCapacity) {
        if (newCapacity < this.capacity * this.shrinkFactor && newCapacity < this.capacity - SHRINK_THRESHOLD) {
            this.setCapacity(newCapacity);
        }
    }

    /**
     *
     * @param {number} newCapacity
     */
    setCapacity(newCapacity) {
        if (this.capacity === newCapacity) {
            //do nothing
            return;
        }

        if (newCapacity < this.occupancy.size()) {
            throw new Error(`Can not set capacity (=${newCapacity}) below occupancy set size (=${this.occupancy.size()})`);
        }

        this.capacity = newCapacity;

        this.build();
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @returns {number}
     */
    readAttributeScalar(particleIndex, attributeIndex) {
        const attribute = this.attributes[attributeIndex];

        const array = attribute.array;

        return array[particleIndex];
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number} value
     */
    writeAttributeScalar(particleIndex, attributeIndex, value) {
        const attribute = this.attributes[attributeIndex];

        const array = attribute.array;

        array[particleIndex] = value;
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number[]} result
     */
    readAttributeVector2(particleIndex, attributeIndex, result) {
        const attribute = this.attributes[attributeIndex];

        const address = particleIndex * 2;

        const array = attribute.array;

        result[0] = array[address];
        result[1] = array[address + 1];
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number} x
     * @param {number} y
     */
    writeAttributeVector2(particleIndex, attributeIndex, x, y) {
        const attribute = this.attributes[attributeIndex];

        const address = particleIndex * 2;

        const array = attribute.array;

        array[address] = x;
        array[address + 1] = y;
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number[]} result
     */
    readAttributeVector3(particleIndex, attributeIndex, result) {
        const attribute = this.attributes[attributeIndex];

        const address = particleIndex * 3;

        const array = attribute.array;

        result[0] = array[address];
        result[1] = array[address + 1];
        result[2] = array[address + 2];
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    writeAttributeVector3(particleIndex, attributeIndex, x, y, z) {
        const attribute = this.attributes[attributeIndex];

        const address = particleIndex * 3;

        const array = attribute.array;

        array[address] = x;
        array[address + 1] = y;
        array[address + 2] = z;
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number[]} result
     */
    readAttributeVector4(particleIndex, attributeIndex, result) {
        const attribute = this.attributes[attributeIndex];

        const address = particleIndex * 4;

        const array = attribute.array;

        result[0] = array[address];
        result[1] = array[address + 1];
        result[2] = array[address + 2];
        result[3] = array[address + 3];
    }

    /**
     *
     * @param {int} particleIndex
     * @param {int} attributeIndex
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     */
    writeAttributeVector4(particleIndex, attributeIndex, x, y, z, w) {
        const attribute = this.attributes[attributeIndex];

        const address = particleIndex * 4;

        const array = attribute.array;

        array[address] = x;
        array[address + 1] = y;
        array[address + 2] = z;
        array[address + 3] = w;
    }
}
