/**
 * User: Alex Goldring
 * Date: 17/6/2014
 * Time: 21:43
 */


class Timer {
    /**
     *
     * @param options
     * @constructor
     * @property {number} repeat
     * @property {number} timeout
     * @property {Array.<function>} actions
     * @property {boolean} active
     */
    constructor(options = {}) {
        this.repeat = options.repeat !== void 0 ? options.repeat : 0;
        this.timeout = options.timeout;

        /**
         *
         * @type {function[]}
         */
        this.actions = options.actions || [];

        /**
         *
         * @type {boolean}
         */
        this.active = true;

        /**
         *
         * @type {number}
         */
        this.ticks = 0;

        /**
         * represents current time elapsed in a cycle, always less than timeout value
         * @type {number}
         */
        this.counter = 0;
    }
}

Timer.typeName = "Timer";
Timer.serializable = false;

export default Timer;
