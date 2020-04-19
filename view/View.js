/**
 * @author Alex Goldring, 2018
 * @copyright Alex Goldring 2018
 */

import Vector2 from "../core/geom/Vector2.js";

import AABB2 from "../core/geom/AABB2.js";
import Signal from "../core/events/signal/Signal.js";
import { SignalBinding } from "../core/events/signal/SignalBinding.js";
import { assert } from "../core/assert.js";
import Vector1 from "../core/geom/Vector1.js";


/**
 * Performs matrix multiplication of 3x3 matrices
 * r = a * b
 * @param {number[]} a first matrix
 * @param {number[]} b second matrix
 * @param {number[]} r result matrix
 */
function multiplyMatrices3(a, b, r) {
    //read out values of input matrices to support the case where result is written back into one of the inputs
    const a0 = a[0];
    const a1 = a[1];
    const a2 = a[2];

    const a3 = a[3];
    const a4 = a[4];
    const a5 = a[5];

    const a6 = a[6];
    const a7 = a[7];
    const a8 = a[8];


    const b0 = b[0];
    const b1 = b[1];
    const b2 = b[2];

    const b3 = b[3];
    const b4 = b[4];
    const b5 = b[5];

    const b6 = b[6];
    const b7 = b[7];
    const b8 = b[8];

    //produce first row
    r[0] = a0 * b0 + a1 * b3 + a2 * b6;
    r[1] = a0 * b1 + a1 * b4 + a2 * b7;
    r[2] = a0 * b2 + a1 * b5 + a2 * b8;

    //produce second row
    r[3] = a3 * b0 + a4 * b3 + a5 * b6;
    r[4] = a3 * b1 + a4 * b4 + a5 * b7;
    r[5] = a3 * b2 + a4 * b5 + a5 * b8;

    //produce third row
    r[6] = a6 * b0 + a7 * b3 + a8 * b6;
    r[7] = a6 * b1 + a7 * b4 + a8 * b7;
    r[8] = a6 * b2 + a7 * b5 + a8 * b8;
}

/**
 *
 * @param {number} tX translation X offset
 * @param {number} tY translation Y offset
 * @param {number} sX scale in X axis
 * @param {number} sY scale in Y axis
 * @param {number} angle rotation angle
 * @returns {number[]}
 */
function compose3x3transform(tX, tY, sX, sY, angle) {
    //translation matrix
    const tM = [
        1, 0, tX,
        0, 1, tY,
        0, 0, 1
    ];

    //scale matrix
    const sM = [
        sX, 0, 0,
        0, sY, 0,
        0, 0, 1
    ];

    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    //rotation matrix
    const rM = [
        cos, -sin, 0,
        sin, cos, 0,
        0, 0, 1
    ];

    const result = [];

    multiplyMatrices3(tM, sM, result);

    multiplyMatrices3(result, rM, result);

    return result;
}

/**
 * @see https://dev.opera.com/articles/understanding-the-css-transforms-matrix/
 * @param domElement
 * @param {Vector2} position
 * @param {Vector2} scale
 * @param {number} rotation angle in radians
 */
function setElementTransform(domElement, position, scale, rotation) {

    //todo simplify this matrix composition to avoid complex maths
    const m3 = compose3x3transform(position.x, position.y, scale.x, scale.y, rotation);


    /*
     * CSS matrix is:
     *      a c e
     *      b d f
     *      0 0 1
     */

    const a = m3[0];
    const b = m3[3];
    const c = m3[1];
    const d = m3[4];
    const e = m3[2];
    const f = m3[5];

    const transform = "matrix(" + a + ',' + b + ',' + c + ',' + d + ',' + e + ',' + f + ")";

    const style = domElement.style;
    style.webkitTransform = style.oTransform = style.transform = transform;
}

function setElementVisibility(domElement, visibility) {
    const value = visibility ? "block" : "none";
    const style = domElement.style;
    if (style.display !== value) {
        style.display = value;
    }
}

/**
 *
 * @enum {number}
 */
export const ViewFlags = {
    Linked: 1,
    Destroyed: 2,
    Visible: 4
};

/**
 * @readonly
 * @type {ViewFlags|number}
 */
const INITIAL_FLAGS = ViewFlags.Visible;

/**
 * Base View class
 * @class
 */
class View {
    /**
     * @constructor
     */
    constructor() {
        /**
         *
         * @type {Element|NodeDescription|null}
         */
        this.el = null;

        /**
         * Signal bindings, these will be linked and unlinked along with the view
         * @private
         * @type {SignalBinding[]}
         */
        this.bindings = [];

        /**
         *
         * @type {ViewFlags|number}
         */
        this.flags = INITIAL_FLAGS;

        /**
         *
         * @type {Vector2}
         */
        const position = this.position = new Vector2(0, 0);

        /**
         *
         * @type {Vector1}
         */
        const rotation = this.rotation = new Vector1(0);

        /**
         *
         * @type {Vector2}
         */
        const scale = this.scale = new Vector2(1, 1);

        /**
         *
         * @type {Vector2}
         */
        const size = this.size = new Vector2(0, 0);

        /**
         * Origin from which rotation and scaling is applied
         * @type {Vector2}
         */
        this.transformOrigin = new Vector2(0.5, 0.5);

        this.on = {
            linked: new Signal(),
            unlinked: new Signal()
        };

        /**
         *
         * @type {View[]}
         */
        this.children = [];

        /**
         *
         * @type {View|null}
         */
        this.parent = null;

        position.onChanged.add(this.__updateTransform, this);
        scale.onChanged.add(this.__updateTransform, this);
        rotation.onChanged.add(this.__updateTransform, this);
        size.onChanged.add(this.__setDimensions, this);

        this.transformOrigin.onChanged.add(this.__setTransformOrigin, this);
    }

    /**
     * @returns {boolean}
     */
    get isLinked() {
        return this.getFlag(ViewFlags.Linked);
    }

    /**
     *
     * @return {boolean}
     */
    get isDestroyed() {
        return this.getFlag(ViewFlags.Destroyed);
    }

    /**
     *
     * @param {boolean} v
     */
    set visible(v) {
        if (v === this.getFlag(ViewFlags.Visible)) {
            //do nothing
        }

        this.writeFlag(ViewFlags.Visible, v);

        setElementVisibility(this.el, v);
    }

    /**
     *
     * @return {boolean}
     */
    get visible() {
        return this.getFlag(ViewFlags.Visible);
    }

    /**
     *
     * @param {number|ViewFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|ViewFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|ViewFlags} flag
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
     * @param {number|ViewFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @private
     */
    __setTransformOrigin(x, y) {
        const style = this.el.style;

        style.transformOrigin = `${x * 100}% ${y * 100}%`;
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @private
     */
    __setDimensions(x, y) {
        const style = this.el.style;

        style.width = x + "px";
        style.height = y + "px";
    }

    /**
     *
     * @private
     */
    __updateTransform() {
        setElementTransform(this.el, this.position, this.scale, this.rotation.getValue());
    }

    /**
     * intended as initialization point when view becomes linked to the visible tree
     */
    link() {
        if (this.isLinked) {
            //do nothing
            return;
        }

        assert.notOk(this.isDestroyed, 'view is destroyed and may not be re-used');

        this.setFlag(ViewFlags.Linked);

        const signalBindings = this.bindings;
        const bindingCount = signalBindings.length;

        let i;
        for (i = 0; i < bindingCount; i++) {
            const binding = signalBindings[i];

            binding.link();
        }

        //link all children also
        const children = this.children;
        const childCount = children.length;

        for (i = 0; i < childCount; i++) {
            const child = children[i];

            child.link();
        }

        this.on.linked.dispatch();
    }

    /**
     * Finalization point, release all used resources and cleanup listeners
     */
    unlink() {
        if (!this.isLinked) {
            //do nothing
            return;
        }

        this.clearFlag(ViewFlags.Linked);

        const signalBindings = this.bindings;
        const bindingCount = signalBindings.length;

        let i;
        for (i = 0; i < bindingCount; i++) {
            const binding = signalBindings[i];

            binding.unlink();
        }

        //unlink all children also
        const children = this.children;
        const childCount = children.length;

        for (i = 0; i < childCount; i++) {
            const child = children[i];

            child.unlink();
        }

        this.on.unlinked.dispatch();
    }

    /**
     *
     * @param {View} child
     * @returns {View}
     */
    addChild(child) {
        assert.notEqual(child, undefined, 'child is undefined');
        assert.notEqual(child, null, 'child is null');
        assert.ok(typeof child, 'object', `child must be an object, isntead was '${typeof child}'`);
        assert.ok(child instanceof View, 'child is not an instance of View');

        child.parent = this;

        if (this.isLinked && !child.isLinked) {
            child.link();
        }

        this.children.push(child);
        this.el.appendChild(child.el);


        return this;
    }

    /**
     *
     * @param {Vector2} size
     * @param {number} targetX normalized horizontal position for setting child's position. 0 represents left-most , 1 right-most
     * @param {number} targetY normalized vertical position for setting child's position. 0 represents top-most , 1 bottom-most
     * @param {number} alignmentX
     * @param {number} alignmentY
     * @param {Vector2} result
     */
    computePlacement(size, targetX, targetY, alignmentX, alignmentY, result) {

        const p = new Vector2(targetX, targetY);

        p.multiply(this.size);
        p.add(this.position);

        p._sub(size.x * alignmentX, size.y * alignmentY);

        result.copy(p);
    }

    /**
     *
     * @param {View} child
     * @param {number} targetX normalized horizontal position for setting child's position. 0 represents left-most , 1 right-most
     * @param {number} targetY normalized vertical position for setting child's position. 0 represents top-most , 1 bottom-most
     * @param {number} alignmentX
     * @param {number} alignmentY
     */
    addChildAt(child, targetX, targetY, alignmentX, alignmentY) {
        assert.equal(typeof targetX, "number", `targetX must be of type "number", instead was "${typeof targetX}"`);
        assert.equal(typeof targetY, "number", `targetY must be of type "number", instead was "${typeof targetY}"`);
        assert.equal(typeof alignmentX, "number", `alignmentX must be of type "number", instead was "${typeof alignmentX}"`);
        assert.equal(typeof alignmentY, "number", `alignmentY must be of type "number", instead was "${typeof alignmentY}"`);

        this.computePlacement(child.size, targetX, targetY, alignmentX, alignmentY, child.position);

        this.addChild(child);
        //need to resize the container to ensure future calls work as expected
        this.resizeToFitChildren();
    }

    /**
     *
     * @param {View} child
     */
    removeChild(child) {
        const i = this.children.indexOf(child);
        if (i !== -1) {
            this.children.splice(i, 1);
            this.el.removeChild(child.el);
            child.unlink();

            child.parent = null;
        } else {
            console.warn('Child not found. this:', this, 'child:', child);
        }
    }

    /**
     *
     * @param {View} child
     * @returns {boolean}
     */
    hasChild(child) {
        return (this.children.indexOf(child) !== -1);
    }

    removeAllChildren() {
        const children = this.children;
        const numChildren = children.length;
        for (let i = 0; i < numChildren; i++) {
            const child = children.pop();
            this.el.removeChild(child.el);
            child.unlink();

            child.parent = null;
        }
    }

    /**
     *
     * @param {AABB2} aabb
     * @param {number} offsetX
     * @param {number} offsetY
     */
    expandToFit(aabb, offsetX, offsetY) {

        const oX = this.position.x + offsetX;
        const oY = this.position.y + offsetY;

        aabb._expandToFit(oX, oY, oX + this.size.x, oY + this.size.y);

        const children = this.children;

        let i = 0;
        const l = children.length;
        for (; i < l; i++) {
            const child = children[i];
            child.expandToFit(aabb, oX, oY);
        }

    }

    /**
     *
     * @param {AABB2} [result]
     * @returns {AABB2}
     */
    computeBoundingBox(result) {
        if (result === undefined) {
            result = new AABB2();
            result.setNegativelyInfiniteBounds();
        }

        this.expandToFit(result, 0, 0);
        return result;
    }

    resizeToFitChildren() {

        const box = new AABB2(0, 0, this.size.x, this.size.y);
        const children = this.children;

        let i = 0;
        const l = children.length;
        for (; i < l; i++) {
            const child = children[i];
            child.expandToFit(box, 0, 0);
        }

        this.size.set(box.x1, box.y1);
    }

    /**
     *
     * @param {Vector2} input
     * @param {Vector2} result
     * @returns {Vector2} result, same as parameter
     */
    positionLocalToGlobal(input, result) {
        result.copy(input);

        let v = this;
        while (v !== null) {
            result.add(v.position);

            v = v.parent;
        }

        return result;
    }

    /**
     *
     * @param {Vector2} input
     * @param {Vector2} result
     * @returns {Vector2} result, same as parameter
     */
    positionGlobalToLocal(input, result) {
        result.copy(input);

        let v = this;
        while (v !== null) {
            result.sub(v.position);

            v = v.parent;
        }

        return result;
    }

    /**
     *
     * @param {Vector2} result
     */
    computeGlobalScale(result) {
        let v = this;

        let x = 1;
        let y = 1;

        while (v !== null) {
            x *= v.scale.x;
            y *= v.scale.y;

            v = v.parent;
        }

        result.set(x, y);
    }

    destroy() {
        assert.notOk(this.isLinked, 'view is linked, linked view may not be destroyed');

        const children = this.children;
        const childrenCount = children.length;

        for (let i = 0; i < childrenCount; i++) {
            const child = children[i];

            //cascade destruction
            child.destroy();
        }

        this.setFlag(ViewFlags.Destroyed);
    }

    /**
     *
     * @param {Signal} signal
     * @param {function} handler
     * @param {*} [context]
     * @returns {View} returns self, for call chaining
     */
    bindSignal(signal, handler, context) {
        const binding = new SignalBinding(signal, handler, context);
        this.bindings.push(binding);

        if (this.isLinked) {
            binding.link();
        }

        return this;
    }

    /**
     *
     * @param {Signal} signal
     * @param {function} handler
     * @param {*} [context]
     * @returns {boolean} true if binding existed and was removed, false otherwise
     */
    unbindSignal(signal, handler, context) {
        const bindings = this.bindings;
        const numBindings = bindings.length;
        for (let i = 0; i < numBindings; i++) {
            const signalBinding = bindings[i];

            if (
                signalBinding.signal === signal
                && signalBinding.handler === handler
                && (context === undefined || signalBinding.context === context)
            ) {
                bindings.splice(i, 1);

                signalBinding.unlink();

                return true;
            }
        }

        return false;
    }

    /**
     * Add CSS class to View's dom element
     *
     * NOTE: Idempotent
     *
     * @param {string} name
     */
    addClass(name) {
        this.el.classList.add(name);
    }

    /**
     * Add multiple CSS calsses to the View's dom element
     * @param {string[]} names
     */
    addClasses(names) {
        const classList = this.el.classList;

        const n = names.length;
        for (let i = 0; i < n; i++) {
            const name = names[i];

            classList.add(name);
        }
    }

    /**
     * Remove CSS class from View's dom element
     *
     * NOTE: Idempotent
     *
     * @param {string} name
     */
    removeClass(name) {
        this.el.classList.remove(name);
    }

    /**
     * Toggle CSS class of the View's dom element ON or OFF
     *
     * NOTE: Idempotent
     *
     * @param {string} name
     * @param {boolean} flag if true, will add class, if false will remove it
     * @returns {View}
     */
    setClass(name, flag) {
        const classList = this.el.classList;
        classList.toggle(name, flag);
        return this;
    }

    /**
     *
     * @param {Object} hash
     */
    css(hash) {
        for (let propertyName in hash) {
            if (hash.hasOwnProperty(propertyName)) {
                this.el.style[propertyName] = hash[propertyName];
            }
        }
    }
}


export default View;
