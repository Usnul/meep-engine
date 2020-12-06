/**
 * Created by Alex on 31/12/2014.
 */


import ObservedBoolean from "../../../../core/model/ObservedBoolean.js";
import ObservedEnum from "../../../../core/model/ObservedEnum.js";
import { Vector3 as ThreeVector3 } from 'three';
import { assert } from "../../../../core/assert.js";
import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";

/**
 *
 * @enum {String}
 * @readonly
 */
export const ProjectionType = {
    Perspective: "perspective",
    Orthographic: "orthographic"
};

export class Camera {
    constructor() {
        /**
         *
         * @type {boolean}
         */
        this.autoClip = true;

        /**
         * Tunable parameter to prevent clipping planes from thrashing. Clipping planes must move by a certain portion of the current span before frustum gets shrunken
         * @type {number}
         */
        this.autoClipHysteresis = 0.33;

        this.object = null;

        /**
         *
         * @type {ObservedEnum<ProjectionType>}
         */
        this.projectionType = new ObservedEnum(ProjectionType.Perspective, ProjectionType);

        /**
         *
         * @type {ObservedBoolean}
         */
        this.active = new ObservedBoolean(false);
    }

    updateMatrices() {
        const c = this.object;
        c.updateProjectionMatrix();
        c.updateMatrixWorld(true);

        //update world inverse matrix
        c.matrixWorldInverse.copy(c.matrixWorld);
        c.matrixWorldInverse.invert();
    }

    projectRay(x, y, source, target) {
        Camera.projectRay(this.object, x, y, source, target);
    }

    /**
     *
     * @param {Camera} other
     */
    copy(other) {
        this.active.copy(other.active);
        this.projectionType.copy(other.projectionType);
        this.autoClip = other.autoClip;
    }

    /**
     *
     * @returns {Camera}
     */
    clone() {
        const clone = new Camera();

        clone.copy(this);

        return clone;
    }

    toJSON() {
        return {
            autoClip: this.autoClip,
            active: this.active.toJSON()
        };
    }

    fromJSON(json) {
        this.autoClip = json.autoClip;

        if (typeof json.active === "boolean") {
            this.active.fromJSON(json.active);
        } else {
            this.active.set(false);
        }
    }

    /**
     *
     * @param {Camera} camera
     * @param {number} x
     * @param {number} y
     * @param {Vector3} source
     * @param {Vector3} direction
     */
    static projectRay(camera, x, y, source, direction) {
        assert.notEqual(camera, undefined, "Camera must be defined");
        assert.notEqual(camera.position, undefined, "Camera.position must be defined");


        assert.equal(typeof x, "number");
        assert.equal(typeof y, "number");

        // assert.ok(x >= -1, `X(=${x}) must be greater than or equal to -1.0, not a clip-space coordinate`);
        // assert.ok(x <= 1, `X(=${x}) must be less than or equal to 1.0, not a clip-space coordinate`);

        // assert.ok(y >= -1, `Y(=${y}) must be greater than or equal to -1.0, not a clip-space coordinate`);
        // assert.ok(y <= 1, `Y(=${y}) must be less than or equal to 1.0, not a clip-space coordinate`);

        source.copy(camera.position);

        v3.set(x, y, 0.5);
        v3.unproject(camera);

        //get direction
        v3.sub(source).normalize();

        direction.copy(v3);
    }

}

Camera.typeName = "Camera";

Camera.ProjectionType = ProjectionType;

const v3 = new ThreeVector3();


export class CameraSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Camera;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Camera} value
     */
    serialize(buffer, value) {
        buffer.writeUint8(value.autoClip ? 1 : 0);
        value.active.toBinaryBuffer(buffer);

        //TODO serialize hysteresis
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Camera} value
     */
    deserialize(buffer, value) {
        value.autoClip = buffer.readUint8() !== 0;
        value.active.fromBinaryBuffer(buffer);
    }
}
