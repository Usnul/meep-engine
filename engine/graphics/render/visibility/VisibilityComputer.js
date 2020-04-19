import { Frustum } from "three";
import { frustumFromCamera } from "../../ecs/camera/CameraSystem.js";
import { assert } from "../../../../core/assert.js";

const frustum = new Frustum();

export class VisibilityComputer {
    constructor() {
        /**
         *
         * @type {VisibilityFilter[]}
         */
        this.filters = [];
        /**
         *
         * @type {Camera}
         */
        this.camera = null;

        /**
         *
         * @type {Frustum[]}
         * @private
         */
        this.__frustums = [];

        /**
         *
         * @type {RenderLayer}
         * @private
         */
        this.__activeLayer = null;
    }

    /**
     *
     * @param {VisibilityFilter} filter
     */
    addFilter(filter) {
        if (this.filters.find(f => f.name === filter.name)) {
            throw new Error(`Filter named '${filter.name}' already exists`);
        }

        this.filters.push(filter);
    }

    /**
     *
     * @param {VisibilityFilter} filter
     * @returns {boolean}
     */
    removeFilter(filter) {
        const i = this.filters.indexOf(filter);

        if (i === -1) {
            //not present
            return false;
        }

        //cut
        this.filters.splice(i, 1);
        return true;
    }

    /**
     *
     * @param {Camera} camera
     */
    setCamera(camera) {
        this.camera = camera;
    }

    /**
     * @private
     * @param {Object3D} object3d
     */
    __includeObject(object3d) {
        assert.equal(object3d.isObject3D, true, `expected isObject3D to be true, instead was '${object3d.isObject3D}'`);

        //object passed all filters, add it to visible set
        this.__activeLayer.visibleSet.push(object3d);
    }

    /**
     * @private
     * @param {RenderLayer} layer
     */
    __processLayer(layer) {

        if (!layer.visible) {
            //whole layer is hidden

            layer.visibleSet.clear();
            return;
        }

        this.__activeLayer = layer;

        //clear visible set
        layer.visibleSet.initializeUpdate();

        /**
         *
         * @type {VisibilityFilter[]}
         */
        const objectFilters = [];
        /**
         *
         * @type {function[]}
         */
        const objectFilterExecutors = [];

        const filters = this.filters;
        const filterCount = filters.length;

        let objectFilterCount = 0;
        let i;
        for (i = 0; i < filterCount; i++) {
            const f = filters[i];

            if (f.enabled && f.layerPredicate(layer)) {
                objectFilters.push(f);
                objectFilterExecutors.push(f.objectPredicateExecute);

                objectFilterCount++;
            }
        }


        //prepare filters
        for (i = 0; i < objectFilterCount; i++) {
            const f = objectFilters[i];

            f.objectPredicateInitialize(this.camera);
        }


        layer.buildVisibleSet(this.__frustums, objectFilterExecutors, this.__includeObject, this);

        //finalize filters
        for (i = 0; i < objectFilterCount; i++) {
            const f = objectFilters[i];

            f.objectPredicateFinalize();
        }


        layer.visibleSet.finalizeUpdate();
    }

    /**
     *
     * @param {RenderLayerManager} renderLayers
     */
    build(renderLayers) {
        frustumFromCamera(this.camera, frustum);

        this.__frustums = [frustum];

        renderLayers.traverse(this.__processLayer, this);
    }
}
