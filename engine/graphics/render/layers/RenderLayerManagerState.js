export class RenderLayerManagerState {
    constructor() {

        /**
         *
         * @type {Map<String,RenderLayerState>}
         */
        this.layers = new Map();

    }

    /**
     *
     * @param {RenderLayerManager} manager
     */
    write(manager) {
        // console.log('RenderLayerManagerState.write');

        for (const [id, state] of this.layers) {

            const layer = manager.getLayerByName(id);

            layer.state.copy(state);

        }

    }

    /**
     * Read the current state from {@link RenderLayerManager}
     * @param {RenderLayerManager} manager
     */
    read(manager) {

        // console.log('RenderLayerManagerState.read');

        this.layers.clear();

        const layers = manager.layers;

        const layerCount = layers.length;

        for (let i = 0; i < layerCount; i++) {
            const layer = layers.get(i);

            const layerState = layer.state.clone();

            this.layers.set(layer.name, layerState);
        }

    }
}
