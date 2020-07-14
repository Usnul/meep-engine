/**
 * Created by Alex on 06/05/2015.
 */
import Clock from '../Clock.js';
import { SignalHandler } from "../../core/events/signal/SignalHandler.js";
import { assert } from "../../core/assert.js";

/**
 *
 * @constructor
 */
function Ticker() {

    /**
     * @readonly
     * @type {Clock}
     */
    this.clock = new Clock();


    this.clock.pause();

    /**
     * @private
     * @type {boolean}
     */
    this.isRunning = false;

    /**
     *
     * @type {SignalHandler[]}
     */
    this.callbacks = [];
}

/**
 *
 * @param {function} callback
 * @param {*} [thisArg]
 */
Ticker.prototype.subscribe = function (callback, thisArg) {
    const handler = new SignalHandler(callback, thisArg);

    this.callbacks.push(handler);
};

/**
 *
 * @param {function} callback
 * @param {*} [thisArg]
 */
Ticker.prototype.unsubscribe = function (callback, thisArg) {
    assert.typeOf(callback, 'function', 'callback');

    const callbacks = this.callbacks;
    const n = callbacks.length;
    for (let i = 0; i < n; i++) {
        const cb = callbacks[i];

        if (cb.handle === callback) {
            if (thisArg !== undefined) {
                if (thisArg === cb.context) {
                    callbacks.splice(i, 1);
                    return;
                }
            } else {
                callbacks.splice(i, 1);
                return;
            }
        }
    }

};

/**
 *
 * @param {number} maxTimeout
 */
Ticker.prototype.start = function ({ maxTimeout = 100 } = {}) {
    assert.typeOf(maxTimeout, 'number', 'maxTimeout');


    const self = this;
    let timeout = null;
    let animationFrame = null;

    this.isRunning = true;

    function update() {
        if (self.isRunning) {

            const delta = self.clock.getDelta();

            const callbacks = self.callbacks;

            for (let i = 0; i < callbacks.length; i++) {
                const callback = callbacks[i];

                try {
                    callback.handle.call(callback.context, delta);
                } catch (e) {
                    console.error('Error in ticker subscription:', e);
                }

            }
        }
    }

    function cycle() {
        update();
    }

    function timeoutCallback() {
        cancelAnimationFrame(animationFrame);
        animate();
    }

    function animationFrameCallback() {
        clearTimeout(timeout);

        //push tick beyond animation frame stack allowing draw to happen
        setTimeout(animate, 0);
    }

    function animate() {
        animationFrame = requestAnimationFrame(animationFrameCallback);
        cycle();
        timeout = setTimeout(timeoutCallback, maxTimeout);
    }

    self.clock.getDelta(); //purge delta
    self.clock.start();

    requestAnimationFrame(animationFrameCallback);
};

Ticker.prototype.pause = function () {
    this.isRunning = false;
};

Ticker.prototype.resume = function () {
    this.isRunning = true;
};

export default Ticker;
