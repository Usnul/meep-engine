/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 21:47
 */
import { System } from '../../ecs/System.js';
import SoundListener from './SoundListener.js';
import { Transform } from '../../ecs/transform/Transform.js';
import { browserInfo } from "../../Platform.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { noop } from "../../../core/function/Functions.js";

const v3 = new Vector3();

class Context {
    constructor() {
        /**
         *
         * @type {SoundListener}
         */
        this.listener = null;
        /**
         *
         * @type {Transform}
         */
        this.transform = null;

        /**
         *
         * @type {AudioContext}
         */
        this.audioContext = null;
    }

    link() {
        this.transform.position.onChanged.add(this.updatePosition, this);
        this.transform.rotation.onChanged.add(this.updateRotation, this);

        this.updatePosition();
        this.updateRotation();
    }

    unlink() {
        this.transform.position.onChanged.remove(this.updatePosition, this);
        this.transform.rotation.onChanged.remove(this.updateRotation, this);
    }

    updateRotation() {

        v3.copy(Vector3.forward);

        v3.applyQuaternion(this.transform.rotation);

        /**
         *
         * @type {AudioListener}
         */
        const listener = this.audioContext.listener;

        setListenerOrientation(listener, v3);
    }

    updatePosition() {
        /**
         *
         * @type {AudioListener}
         */
        const listener = this.audioContext.listener;

        setListenerPosition(listener, this.transform.position);

    }
}

class SoundListenerSystem extends System {
    /**
     *
     * @param {AudioContext} context
     * @constructor
     */
    constructor(context) {
        super();
        this.componentClass = SoundListener;
        this.dependencies = [SoundListener, Transform];
        //
        this.webAudioContext = context;

        /**
         *
         * @type {Context[]}
         */
        this.data = [];
    }

    link(component, transform, entity) {
        const ctx = new Context();

        ctx.transform = transform;
        ctx.listener = component;

        ctx.audioContext = this.webAudioContext;

        ctx.link();

        this.data[entity] = ctx;
    }

    unlink(component, transform, entity) {

        const ctx = this.data[entity];

        if (ctx !== undefined) {
            delete this.data[entity];

            ctx.unlink();
        }

    }
}


/**
 *
 * @param {AudioListener} listener
 * @param {Vector3} position
 */
function setListenerPosition2(listener, position) {
    if (Number.isFinite(position.x)) {
        listener.positionX.setValueAtTime(position.x, 0);
    } else {
        console.error(`Couldn't set X(=${position.x}), because it is not finite`);
    }

    if (Number.isFinite(position.y)) {
        listener.positionY.setValueAtTime(position.y, 0);
    } else {
        console.error(`Couldn't set Y(=${position.y}), because it is not finite`);
    }

    if (Number.isFinite(position.z)) {
        listener.positionZ.setValueAtTime(position.z, 0);
    } else {
        console.error(`Couldn't set Z(=${position.z}), because it is not finite`);
    }
}

/**
 *
 * @param {AudioListener} listener
 * @param {Vector3} position
 */
function setListenerPosition1(listener, position) {
    let x, y, z;
    if (Number.isFinite(position.x)) {
        x = position.x;
    } else {
        x = 0;
        console.error(`Couldn't set X(=${position.x}), because it is not finite`);
    }

    if (Number.isFinite(position.y)) {
        y = position.y;
    } else {
        y = 0;
        console.error(`Couldn't set Y(=${position.y}), because it is not finite`);
    }

    if (Number.isFinite(position.z)) {
        z = position.z;
    } else {
        z = 0;
        console.error(`Couldn't set Z(=${position.z}), because it is not finite`);
    }

    listener.setPosition(x, y, z);
}

/**
 *
 * @param {AudioListener} listener
 * @param {Vector3} position
 */
function setListenerPositionNOOP(listener, position) {
    //does nothing
}

let setListenerPosition = setListenerPositionNOOP;

if (navigator !== undefined) {
    const info = browserInfo();
    if (info.name === "Chrome") {
        if (info.version >= 64) {
            setListenerPosition = setListenerPosition2;
        } else {
            setListenerPosition = setListenerPosition1;
        }
    } else if (info.name === "Firefox") {
        setListenerPosition = setListenerPosition1;
    }
}

if (setListenerPosition === setListenerPositionNOOP) {
    console.warn("No support for AudioListener position detected");
}


let setListenerOrientation = noop;

if (navigator !== undefined) {
    const info = browserInfo();
    if (info.name === "Chrome") {
        setListenerOrientation = (listener, forward) => {
            listener.forwardX.value = forward.x;
            listener.forwardY.value = forward.y;
            listener.forwardZ.value = forward.z;

        };
    } else if (info.name === "Firefox") {
        setListenerOrientation = (listener, forward) => {
            listener.setOrientation(forward.x, forward.y, forward.z, 0, 1, 0);
        };
    }
}

export default SoundListenerSystem;
