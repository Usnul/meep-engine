/**
 * Created by Alex on 01/04/2014.
 */


import Vector1 from "../../../../core/geom/Vector1.js";
import { BooleanVector3 } from "../../../../core/model/BooleanVector3.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import { BinaryClassUpgrader } from "../../../ecs/storage/binary/BinaryClassUpgrader.js";

/**
 *
 * @enum {string}
 */
export const PathFollowerEventType = {
    EndReached: "path-end-reached"
};

/**
 *
 * @enum
 */
export const PathFollowerFlags = {
    Active: 1,
    Locked: 2,
    Loop: 4
};

class PathFollower {
    constructor() {
        /**
         * On which axis to write rotation
         * @type {BooleanVector3}
         */
        this.rotationAlignment = new BooleanVector3(true, true, true);

        /**
         * On which axis to write position
         * @type {BooleanVector3}
         */
        this.positionWriting = new BooleanVector3(true, true, true);

        this.speed = new Vector1(1);

        /**
         * Speed at which path follower can adjust rotation in Rad/s
         * @type {Vector1}
         */
        this.rotationSpeed = new Vector1(Infinity);

        /**
         *
         * @type {number}
         */
        this.flags = PathFollowerFlags.Active;
    }

    get active(){
        console.warn('PathFollower.active is deprecated, use flags instead');
        return this.getFlag(PathFollowerFlags.Active);
    }

    set active(v){
        console.warn('PathFollower.active is deprecated, use flags instead');
        this.writeFlag(PathFollowerFlags.Active, v);
    }

    get lock(){
        console.warn('PathFollower.lock is deprecated, use flags instead');
        return this.getFlag(PathFollowerFlags.Locked);
    }
    set lock(v){
        console.warn('PathFollower.lock is deprecated, use flags instead');
        this.writeFlag(PathFollowerFlags.Locked, v);
    }

    /**
     *
     * @param {number|PathFollowerFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|PathFollowerFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|PathFollowerFlags} flag
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
     * @param {number|PathFollowerFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    toJSON() {
        return {
            active: this.getFlag(PathFollowerFlags.Active),
            speed: this.speed.toJSON(),
            rotationAlignment: this.rotationAlignment.toJSON(),
        };
    }

    fromJSON(json) {
        if (typeof json.active === "boolean") {
            this.writeFlag(PathFollowerFlags.Active, json.active);
        } else {
            this.setFlag(PathFollowerFlags.Active);
        }

        if (typeof json.speed === "number") {
            this.speed.fromJSON(json.speed);
        }
        if (json.rotationAlignment !== undefined) {
            this.rotationAlignment.fromJSON(json.rotationAlignment);
        }

        if (typeof json.rotationSpeed === "number") {
            this.rotationSpeed.fromJSON(json.rotationSpeed);
        }
    }

    /**
     *
     * @param json
     * @returns {PathFollower}
     */
    static fromJSON(json) {
        const r = new PathFollower();

        r.fromJSON(json);

        return r;
    }
}

PathFollower.typeName = "PathFollower";

export default PathFollower;

export class PathFollowerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = PathFollower;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PathFollower} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.flags);
        buffer.writeFloat32(value.speed.getValue());
        buffer.writeFloat32(value.rotationSpeed.getValue());

        value.rotationAlignment.toBinaryBuffer(buffer);
        value.positionWriting.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {PathFollower} value
     */
    deserialize(buffer, value) {
        value.flags = buffer.readUint8();
        value.speed.set(buffer.readFloat32());
        value.rotationSpeed.set(buffer.readFloat32());

        value.rotationAlignment.fromBinaryBuffer(buffer);
        value.positionWriting.fromBinaryBuffer(buffer);
    }
}


export class PathFollowerSerializationUpgrader_0_1 extends BinaryClassUpgrader {
    constructor() {
        super();

        this.__startVersion = 0;
        this.__targetVersion = 1;
    }

    upgrade(source, target) {

        const active = source.readUint8() !== 0;
        const speed = source.readFloat64();
        const rotationAlignment = source.readUint8();
        const rotationSpeed = source.readFloat64();

        target.writeUint8(active ? PathFollowerFlags.Active : 0);

        target.writeFloat32(speed);
        target.writeFloat32(rotationSpeed);

        target.writeUint8(rotationAlignment);
        target.writeUint8(7); //position writing
    }
}
