/**
 * Created by Alex Goldring on 25.02.2015.
 */
import { AABB3 } from "../../../../core/bvh2/AABB3.js";
import { LeafNode } from '../../../../core/bvh2/LeafNode.js';
import { computeHashFloat, computeHashIntegerArray } from "../../../../core/math/MathUtils.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

export const MeshFlags = {
    CastShadow: 1,
    ReceiveShadow: 2,
    Loaded: 4,
    InView: 8
};

const DEFAULT_FLAGS = 0;

class Mesh {
    constructor() {
        /**
         *
         * @type {string|null}
         */
        this.url = null;

        /**
         *
         * @type {Object3D|null}
         */
        this.mesh = null;

        /**
         *
         * @type {number}
         */
        this.opacity = 1;

        /**
         *
         * @type {LeafNode}
         */
        this.bvh = new LeafNode(null, 0, 0, 0, 0, 0, 0);

        /**
         * Initialized to size 1x1x1
         * @type {AABB3}
         */
        this.boundingBox = new AABB3(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5);

        /**
         *
         * @type {number}
         */
        this.flags = DEFAULT_FLAGS;
    }

    set center(v) {
        throw new Error('Mesh.center is deprecated');
    }

    get center() {
        throw new Error('Mesh.center is deprecated');
    }

    /**
     *
     * @return {boolean}
     */
    get castShadow() {
        return this.getFlag(MeshFlags.CastShadow);
    }

    /**
     *
     * @param {boolean} v
     */
    set castShadow(v) {
        this.writeFlag(MeshFlags.CastShadow, v);
    }

    get receiveShadow() {
        return this.getFlag(MeshFlags.ReceiveShadow);
    }

    /**
     *
     * @param {boolean} v
     */
    set receiveShadow(v) {
        this.writeFlag(MeshFlags.ReceiveShadow, v);
    }

    get isLoaded() {
        return this.getFlag(MeshFlags.Loaded);
    }

    /**
     *
     * @param {boolean} v
     */
    set isLoaded(v) {
        this.writeFlag(MeshFlags.Loaded, v);
    }

    /**
     *
     * @param {number|MeshFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|MeshFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|MeshFlags} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|MeshFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     *
     * @returns {boolean}
     */
    hasMesh() {
        return this.mesh !== undefined && this.mesh !== null;
    }

    fromJSON(obj) {
        if (obj.url !== undefined) {
            this.url = obj.url;
        }
        if (obj.castShadow !== undefined) {
            this.castShadow = obj.castShadow;
        }
        if (obj.receiveShadow !== undefined) {
            this.receiveShadow = obj.receiveShadow;
        }
        if (obj.opacity !== undefined) {
            this.opacity = obj.opacity;
        }
    }

    toJSON() {
        const result = {
            url: this.url,
            castShadow: this.castShadow,
            receiveShadow: this.receiveShadow,
            opacity: this.opacity
        };

        return result;
    }

    hash() {
        let urlHash = computeStringHash(this.url);
        return computeHashIntegerArray(
            urlHash,
            this.castShadow ? 1 : 0,
            this.receiveShadow ? 1 : 0,
            computeHashFloat(this.opacity)
        );
    }

    /**
     *
     * @param {Mesh} other
     */
    copy(other) {
        this.url = other.url;

        this.castShadow = other.castShadow;
        this.receiveShadow = other.receiveShadow;

        this.opacity = other.opacity;
    }

    /**
     *
     * @returns {Mesh}
     */
    clone() {
        const clone = new Mesh();

        clone.copy(this);

        return clone;
    }

    /**
     *
     * @param json
     * @returns {Mesh}
     */
    static fromJSON(json) {
        const result = new Mesh();

        result.fromJSON(json);

        return result;
    }
}


Mesh.typeName = "Mesh";

export default Mesh;

export class MeshSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Mesh;
        this.version = 0;
    }


    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Mesh} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(value.url);
        buffer.writeUint8(value.castShadow ? 1 : 0);
        buffer.writeUint8(value.receiveShadow ? 1 : 0);

        buffer.writeUint8(0); // deprecated "center" flag

        buffer.writeFloat32(value.opacity);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Mesh} value
     */
    deserialize(buffer, value) {
        value.url = buffer.readUTF8String();
        value.castShadow = buffer.readUint8() !== 0;
        value.receiveShadow = buffer.readUint8() !== 0;

        const deprecated_centerFlag = buffer.readUint8();

        value.opacity = buffer.readFloat32();
    }

}
