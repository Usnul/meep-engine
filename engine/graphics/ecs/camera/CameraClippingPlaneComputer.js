import { isValueBetweenInclusive } from "../../../../core/math/MathUtils.js";
import { frustumFromCamera } from "./CameraSystem.js";
import { Frustum as ThreeFrustum } from "three";

const CLIPPING_EPSILON = 0.001;

const CLIPPING_NEAR_MIN = 0.5;

function sanityCheck(value) {
    return value !== Number.NEGATIVE_INFINITY && value !== Number.POSITIVE_INFINITY && !isNaN(value);
}

export class CameraClippingPlaneComputer {
    constructor() {
        /**
         *
         * @type {Camera}
         */
        this.camera = null;

        /**
         *
         * @type {RenderLayerManager}
         */
        this.layers = null;

        /**
         *
         * @type {number}
         */
        this.hysteresis = 0.5;

        /**
         *
         * @type {Frustum}
         * @private
         */
        this.__frustum = new ThreeFrustum();


        this.near = 0;
        this.far = 0;
    }

    /**
     *
     * @param {RenderLayer} layer
     * @private
     */
    __processLayer(layer) {
        if (!layer.visible) {
            return;
        }

        layer.computeNearFarClippingPlanes(this.__frustum, this.near, this.far, this.__updateClippingPlanes, this);
    }

    /**
     *
     * @param {number} z0
     * @param {number} z1
     * @private
     */
    __updateClippingPlanes(z0, z1) {
        if (z0 < this.near && z0 !== Number.NEGATIVE_INFINITY) {
            this.near = z0;
        }
        if (z1 > this.far && z1 !== Number.POSITIVE_INFINITY) {
            this.far = z1;
        }
    }

    compute() {
        const camera = this.camera;

        /**
         *
         * @type {number}
         */
        const hysteresis = this.hysteresis;

        //quantify hysteresis
        const oldNear = camera.near;
        const oldFar = camera.far;
        const oldClippingPlaneDistance = Math.abs(oldFar - oldNear);

        const shrinkThreshold = hysteresis * oldClippingPlaneDistance;

        frustumFromCamera(camera, this.__frustum);

        const nearPlane = this.__frustum.planes[4];
        const planeOffset = nearPlane.normal.dot(camera.position);
        nearPlane.constant = planeOffset;

        this.far = Number.NEGATIVE_INFINITY;
        this.near = Number.POSITIVE_INFINITY;

        this.layers.traverse(this.__processLayer, this);

        //offset clipping planes by a small margin to prevent clipping of parallel planar surfaces
        this.near -= CLIPPING_EPSILON;
        this.far += CLIPPING_EPSILON;

        //clip near
        if (!sanityCheck(this.near) || this.near < CLIPPING_NEAR_MIN) {
            //use a default
            //NOTE: values smaller than 0.001 seem to lead to glitchy rendering where polygons clip through one another
            this.near = CLIPPING_NEAR_MIN;
        }

        if (!sanityCheck(this.far) || this.far < 0) {
            //use a default
            this.far = 100;
        }

        //hysteresis check
        if (isValueBetweenInclusive(this.near - oldNear, 0, shrinkThreshold)) {
            this.near = oldNear;
        }

        if (isValueBetweenInclusive(oldFar - this.far, 0, shrinkThreshold)) {
            this.far = oldFar;
        }

    }
}
