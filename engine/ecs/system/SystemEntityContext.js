export class SystemEntityContext {
    constructor() {

        this.entity = -1;

        /**
         * Pointer back to the system
         * @type {System}
         */
        this.system = null;

        /**
         *
         * @type {*[]}
         */
        this.components = [];

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__is_linked = false;
    }

    /**
     *
     * @returns {EntityComponentDataset}
     */
    getDataset() {
        return this.system.entityManager.dataset;
    }

    link() {
        if (this.__is_linked) {
            return;
        }

        this.__is_linked = true;
    }

    unlink() {

        if (!this.__is_linked) {
            return;
        }

        this.__is_linked = false;
    }
}
