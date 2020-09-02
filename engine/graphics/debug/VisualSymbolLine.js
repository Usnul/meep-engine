import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial } from "three";
import Renderable from "../../ecs/components/Renderable.js";

export class VisualSymbolLine {

    /**
     *
     * @param {Vector3} source
     * @param {Vector3} target
     * @returns {VisualSymbolLine}
     */
    static from(source, target) {
        const r = new VisualSymbolLine();

        r.source = source;
        r.target = target;

        return r;
    }

    constructor() {

        /**
         *
         * @type {Vector3}
         */
        this.source = null;
        /**
         *
         * @type {Vector3}
         */
        this.target = null;

        this.__material = new LineBasicMaterial({
            color: 0xFFFFFF,
            linewidth: 1,
            transparent: true
        });

        this.__geometry = new BufferGeometry();

        this.__position_attribute = new Float32BufferAttribute(new Float32Array(6), 3);
        this.__geometry.setAttribute('position', this.__position_attribute);


        const mesh = new Line(this.__geometry, this.__material);

        mesh.updateMatrixWorld(); //TODO do we need this?
        mesh.frustumCulled = false;


        this.__renderable = new Renderable(mesh);
        this.__renderable.matrixAutoUpdate = false;
    }

    /**
     *
     * @returns {Renderable}
     */
    get renderable() {
        return this.__renderable;
    }

    set color(c) {
        this.__material.color.set(c);
    }

    updateGeometry() {
        const positionAttribute = this.__position_attribute;

        const positionBuffer = positionAttribute.array;

        const a_x = this.source.x;
        const a_y = this.source.y;
        const a_z = this.source.z;

        positionBuffer[0] = a_x;
        positionBuffer[1] = a_y;
        positionBuffer[2] = a_z;

        const b_x = this.target.x;
        const b_y = this.target.y;
        const b_z = this.target.z;

        positionBuffer[3] = b_x;
        positionBuffer[4] = b_y;
        positionBuffer[5] = b_z;


        positionAttribute.needsUpdate = true;

        // update bounds
        const renderable = this.__renderable;
        const bb = renderable.boundingBox;

        bb.setBoundsUnordered(a_x, a_y, a_z, b_x, b_y, b_z);
        renderable.bvh.resize(bb.x0, bb.y0, bb.z0, bb.x1, bb.y1, bb.z1);
    }

    link() {
        this.source.onChanged.add(this.updateGeometry, this);
        this.target.onChanged.add(this.updateGeometry, this);

        this.updateGeometry();
    }

    unlink() {
        this.source.onChanged.remove(this.updateGeometry, this);
        this.target.onChanged.remove(this.updateGeometry, this);
    }

}
