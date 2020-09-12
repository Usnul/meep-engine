import Vector3 from "../../../../core/geom/Vector3.js";

const t0 = new Vector3();
const t1 = new Vector3();
const t2 = new Vector3();

export class Quad {
    /**
     *
     * @param {BufferGeometry} bufferGeometry
     * @param {number} index
     * @property {Quad|null} next
     * @property {Quad|null} previous
     * @constructor
     */
    constructor(bufferGeometry, index) {
        this.geometry = bufferGeometry;
        this.index = index;


        this.direction = new Vector3(0, 1, 0);

        //defines a point from which D and C are offset on the same line
        this.position = new Vector3();

        /**
         *
         * @type {Quad|null}
         */
        this.next = null;
        /**
         *
         * @type {Quad|null}
         */
        this.previous = null;

        this.computePosition();
    }

    computeDirection() {
        this.getVertexA(t0);
        this.getVertexB(t1);
        t0.add(t1).multiplyScalar(0.5);

        this.getVertexC(t2);
        this.getVertexD(t1);
        t2.add(t1).multiplyScalar(0.5);

        t2.sub(t0).normalize();

        this.direction.copy(t2);
    }

    computePosition() {
        const p = this.position;
        this.getVertexC(p);
        const x = p.x,
            y = p.y,
            z = p.z;
        this.getVertexD(p);
        p.x += x;
        p.y += y;
        p.z += z;
        p.multiplyScalar(0.5);
    }

    setAttributeIndex(index, value) {
        const indexBuffer = this.geometry.index;
        const aIndex = indexBuffer.array;
        const offset = (this.index * 6) + index;
        aIndex[offset] = value;
        indexBuffer.needsUpdate = true;
    }

    getAttributeIndex(index) {
        const aIndex = this.geometry.index.array;
        const offset = (this.index * 6) + index;
        return aIndex[offset];
    }

    getAttributePosition(index, result) {
        const aPosition = this.geometry.attributes.position.array;
        const offset = index * 3;
        result.set(aPosition[offset], aPosition[offset + 1], aPosition[offset + 2]);
    }

    /**
     *
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setAttributePosition(index, x, y, z) {
        const position = this.geometry.attributes.position;

        const aPosition = position.array;

        const offset = index * 3;

        aPosition[offset] = x;
        aPosition[offset + 1] = y;
        aPosition[offset + 2] = z;

        position.needsUpdate = true;
    }

    setA(index) {
        this.setAttributeIndex(0, index);
    }

    setB(index) {
        this.setAttributeIndex(1, index);
        this.setAttributeIndex(3, index);
    }

    setC(index) {
        this.setAttributeIndex(2, index);
        this.setAttributeIndex(5, index);
    }

    setD(index) {
        this.setAttributeIndex(4, index);
    }

    getA() {
        return this.getAttributeIndex(0);
    }

    getB() {
        return this.getAttributeIndex(1);
    }

    getC() {
        return this.getAttributeIndex(2);
    }

    getD() {
        return this.getAttributeIndex(4);
    }

    /**
     *
     * @param {Vector3} result
     */
    getVertexA(result) {
        this.getAttributePosition(this.getA(), result);
    }

    /**
     *
     * @param {Vector3} result
     */
    getVertexB(result) {
        this.getAttributePosition(this.getB(), result);
    }

    /**
     *
     * @param {Vector3} result
     */
    getVertexC(result) {
        this.getAttributePosition(this.getC(), result);
    }

    /**
     *
     * @param {Vector3} result
     */
    getVertexD(result) {
        this.getAttributePosition(this.getD(), result);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setVertexA(x, y, z) {
        this.setAttributePosition(this.getA(), x, y, z);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setVertexB(x, y, z) {
        this.setAttributePosition(this.getB(), x, y, z);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setVertexC(x, y, z) {
        this.setAttributePosition(this.getC(), x, y, z);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    setVertexD(x, y, z) {
        this.setAttributePosition(this.getD(), x, y, z);
    }
}
