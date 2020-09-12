/**
 * Created by Alex Goldring on 21.02.2015.
 */
import { BufferAttribute, PlaneBufferGeometry } from 'three';
import Vector3 from "../../../../core/geom/Vector3.js";
import { assert } from "../../../../core/assert.js";
import { Quad } from "./Quad.js";


function fillArray(arr, val) {
    let i = 0;
    const l = arr.length;
    for (; i < l; i++) {
        arr[i] = val;
    }
}

const
    vA = new Vector3(),
    vB = new Vector3(),
    vC = new Vector3(),
    vD = new Vector3(),
    vTailMid = new Vector3(),
    vRelativePosition = new Vector3(),
    vCross = new Vector3();


/*
 Head quad has following structure
 + ---- A ---- C
 |      | Head |  <- Unconnected side (Tip)
 |      |      |
 + ---- B ---- D
 */

export class Ribbon {
    /**
     *
     * @param {number} length
     * @param {number} width
     * @constructor
     */
    constructor(length, width) {
        assert.isNonNegativeInteger(length, "length");
        assert.isNumber(width, "width");

        const geometry = this.geometry = new PlaneBufferGeometry(length, width, length, 1);

        const position = geometry.attributes.position;
        const opacity = new Float32Array(position.count);

        fillArray(opacity, 1);

        geometry.setAttribute("opacity", new BufferAttribute(opacity, 1));
        //make quads
        this.quads = new Array(length);
        let lastQuad = null;
        for (let i = 0; i < length; i++) {

            const quad = new Quad(geometry, i);

            quad.previous = lastQuad;

            if (lastQuad !== null) {
                lastQuad.next = quad;
            }

            this.quads[i] = quad;

            lastQuad = quad;
        }

        this.__tail = this.quads[0];
        this.__head = this.quads[length - 1];

        this.length = length;
        //this.validate();
    }

    /**
     *
     * @returns {Quad}
     */
    head() {
        return this.__head;
    }

    /**
     *
     * @returns {Quad}
     */
    tail() {
        return this.__tail;
    }

    /**
     *
     * @param {Vector3} v3
     */
    moveToPoint(v3) {
        const position = this.geometry.attributes.position;
        const array = position.array;

        const l = position.count * 3;

        for (let i = 0; i < l; i += 3) {
            array[i] = v3.x;
            array[i + 1] = v3.y;
            array[i + 2] = v3.z;
        }
    }

    /**
     *
     * @param {Vector3} position
     * @param {Vector3} normal
     * @param {number} width
     */
    positionHead(position, normal, width) {
        const head = this.head();

        const halfWidth = width / 2;

        //read previous positions of the tip edge
        head.getVertexA(vA);
        head.getVertexB(vB);

        //compute new tip positions
        vTailMid
            .copy(vA)
            .add(vB)
            .multiplyScalar(0.5);

        vRelativePosition.copy(position).sub(vTailMid);

        vCross.copy(vRelativePosition)
            .cross(normal);

        if (vCross.isZero()) {
            //use old positions as markers, since cross product didn't yield a perpendicular vector
            vC.copy(vA).sub(vTailMid).normalize().multiplyScalar(halfWidth).add(position);
            vD.copy(vB).sub(vTailMid).normalize().multiplyScalar(halfWidth).add(position);
        } else {
            vCross.normalize();

            vC.copy(vCross).multiplyScalar(halfWidth).add(position);
            vD.copy(vCross).negate().multiplyScalar(halfWidth).add(position);
        }

        head.setVertexC(vC.x, vC.y, vC.z);
        head.setVertexD(vD.x, vD.y, vD.z);
    }

    /**
     *
     * @param {number} startValue
     * @param {number} endValue
     * @param {function} callback
     */
    traverseLerpEdges(startValue, endValue, callback) {

        const valueDelta = (endValue - startValue);

        this.traverseEdges(function (a, b, index, maxIndex) {
            const value = startValue + (index / maxIndex) * valueDelta;
            callback(a, b, value);
        });

    }

    /**
     *
     * @param {function(a:number, b:number, i:number, length:number)} callback
     */
    traverseEdges(callback) {
        const quads = this.quads;
        let q = quads[0];


        const numQuads = this.length;

        const numEdges = numQuads + 1;

        callback(q.getA(), q.getB(), 0, numEdges);

        let i = 0;
        for (let q = this.__head; q !== null; q = q.previous, i++) {
            callback(q.getC(), q.getD(), i, numEdges);
        }
    }

    validate() {
        let i0, i1;
        let q0 = this.quads[0];
        for (let i = 1; i < this.quads.length; i++) {
            const q1 = this.quads[i];

            let q0a = q0.getA();
            let q0b = q0.getB();
            const q0c = q0.getC();
            const q0d = q0.getD();

            const q1a = q1.getA();
            const q1b = q1.getB();
            let q1c = q1.getC();
            let q1d = q1.getD();

            if (q0c !== q1a || q0d !== q1b) {
                //segments are disconnected
                throw new Error("segments are disconnected");
            }
            q0 = q1;
        }
    }

    /**
     * moves last segment of ribbon to become new head
     */
    rotate() {
        //take first quad
        const quads = this.quads;
        const length = quads.length;

        //take current head
        const tail = this.__tail;
        const head = this.__head;

        //patch tail to become new head
        const a = tail.getA();
        const b = tail.getB();

        tail.setC(a);
        tail.setD(b);

        const c = head.getC();
        const d = head.getD();

        tail.setA(c);
        tail.setB(d);
        //rotate array
        head.next = tail;
        tail.previous = head;
        //set new tail's end
        const newTail = tail.next;
        newTail.previous = null;
        tail.next = null;

        //update tail and head references
        this.__tail = newTail;
        this.__head = tail;

        //this.validate();
        return this;
    }
}

