export class RenderLayerState {
    constructor() {
        /**
         * Whether the layer should be rendered or not
         * @type {boolean}
         */
        this.visible = true;
    }

    /**
     *
     * @param {RenderLayerState} other
     */
    copy(other) {
        this.visible = other.visible;
    }

    /**
     *
     * @returns {RenderLayerState}
     */
    clone() {
        const r = new RenderLayerState();

        r.copy(this);

        return r;
    }
}
