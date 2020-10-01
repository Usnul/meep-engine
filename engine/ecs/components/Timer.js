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
         * @type {Function[]}
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

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} timeout
     * @returns {Promise}
     */
    static createTimeoutPromise(ecd, timeout) {


        return new Promise((resolve, reject) => {

            const entity = ecd.createEntity();

            const timer = new Timer();

            timer.repeat = 0;

            timer.actions.push(() => {
                ecd.removeEntity(entity);

                resolve();
            });

            timer.timeout = timeout;

            ecd.addComponentToEntity(entity, timer);
        });


    }
}

Timer.typeName = "Timer";
Timer.serializable = false;

export default Timer;
