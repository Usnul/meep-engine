import View from "../../View.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { computePlaneRayIntersection } from "../../../core/geom/Plane.js";
import ObservedValue from "../../../core/model/ObservedValue.js";
import { SurfacePoint3 } from "../../../core/geom/3d/SurfacePoint3.js";
import SVG from "../../SVG.js";


const rayContact = new SurfacePoint3();

export class MinimapCameraView extends View {
    /**
     *
     * @param {Camera} camera
     * @param {Transform} transform
     * @param entity
     * @param {Rectangle} world
     * @param {Vector2} worldScale
     * @constructor
     */
    constructor({ camera, transform, entity, world, worldScale }) {
        super();

        this.el = SVG.createElement('svg');

        this.addClass('ui-camera-view');

        /**
         *
         * @type {Element}
         * @private
         */
        this.__el_polygon = SVG.createElement('polygon');

        this.el.appendChild(this.__el_polygon);

        /**
         *
         * @type {Camera}
         */
        this.camera = camera;
        /**
         *
         * @type {Transform}
         */
        this.transform = transform;

        this.entity = entity;

        /**
         *
         * @type {Rectangle}
         * @private
         */
        this.__world = world;

        /**
         *
         * @type {Vector2}
         * @private
         */
        this.__world_scale = worldScale;

        /**
         *
         * @type {ObservedValue<Terrain>}
         */
        this.terrain = new ObservedValue(null);


        this
            .bindSignal(this.camera.projectionType.onChanged, this.__update, this)
            .bindSignal(this.transform.position.onChanged, this.__update, this)
            .bindSignal(worldScale.onChanged, this.__update, this)
            .bindSignal(world.position.onChanged, this.__update, this)
            .bindSignal(this.transform.rotation.onChanged, this.__update, this);

    }

    /**
     *
     * @param {Vector3} result
     * @param {number} originX
     * @param {number} originY
     * @param {number} originZ
     * @param {number} directionX
     * @param {number} directionY
     * @param {number} directionZ
     */
    castTerrainRay(result, originX, originY, originZ, directionX, directionY, directionZ) {
        const terrain = this.terrain.getValue();

        const JITTER = 0.00001;

        if (terrain === null) {
            computePlaneRayIntersection(result, originX, originY, originZ, directionX, directionY, directionZ, 0, 1, 0, 0);
        } else {

            let oX = originX;
            let oY = originY;
            let oZ = originZ;

            let foundHit = false;

            for (let i = 0; i < 10 && !foundHit; i++) {
                foundHit = terrain.raycastFirstSync(rayContact, originX, originY, originZ, directionX, directionY, directionZ);

                if (!foundHit) {
                    //no hit found, try to jitter origin in case of mathematical error at polygon edges
                    oX += (Math.random() - 0.5) * JITTER;
                    oY += (Math.random() - 0.5) * JITTER;
                    oZ += (Math.random() - 0.5) * JITTER;
                } else {
                    result.copy(rayContact.position);
                }

            }

            if (!foundHit) {
                //no hit found, fall back to planar test
                computePlaneRayIntersection(result, originX, originY, originZ, directionX, directionY, directionZ, 0, 1, 0, 0);
            }

        }

    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @returns {Vector3}
     */
    getPoint(x, y) {
        const camera = this.camera;

        /**
         *
         * @type {Rectangle}
         */
        const world = this.__world;

        /**
         *
         * @type {Vector2}
         */
        const worldScale = this.__world_scale;

        const vOrigin = new Vector3(-1, 1, 0.5);
        const vDirection = new Vector3(1, -1, 0.5);
        camera.projectRay(x, y, vOrigin, vDirection);

        const vResult = new Vector3(0, 0, 0);

        this.castTerrainRay(vResult, vOrigin.x, vOrigin.y, vOrigin.z, vDirection.x, vDirection.y, vDirection.z);

        vResult.x -= world.position.x;
        vResult.x *= worldScale.x;

        vResult.z -= world.position.y;
        vResult.z *= worldScale.y;

        return vResult;
    }

    __update() {
        const camera = this.camera;

        /**
         *
         * @type {Transform}
         */
        const transform = this.transform;

        const c = camera.object;

        if (c === null) {
            console.warn(`Camera component doesn't have three.js object built.`);
            return;
        }

        c.position.copy(transform.position);
        camera.updateMatrices();

        const v_tl = this.getPoint(-1, 1);
        const v_tr = this.getPoint(1, 1);
        const v_br = this.getPoint(1, -1);
        const v_bl = this.getPoint(-1, -1);


        this.__el_polygon.setAttribute('points', `${v_tl.x},${v_tl.z} ${v_tr.x},${v_tr.z} ${v_br.x},${v_br.z} ${v_bl.x},${v_bl.z}`);
    };


    link() {
        super.link();
        try {
            this.__update();
        } catch (e) {
            console.error('Failed to execute update', e);
        }
    }

    unlink() {
        super.unlink();

    }
}



