import { MarkerNodeAction } from "./MarkerNodeAction.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { Transform } from "../../../engine/ecs/transform/Transform.js";
import { EntityBlueprint } from "../../../engine/ecs/EntityBlueprint.js";

export class MarkerNodeActionEntityPlacement extends MarkerNodeAction {
    constructor() {
        super();

        /**
         *
         * @type {EntityBlueprint}
         */
        this.entity = new EntityBlueprint();

        /**
         *
         * @type {Transform}
         */
        this.transform = new Transform();

        /**
         *
         * @type {function(EntityBuilder, MarkerNode, GridData, EntityComponentDataset)}
         */
        this.process = null;

        /**
         *
         * @type {MarkerNodeEntityProcessor}
         */
        this.processor = null;
    }

    /**
     *
     * @param {EntityBlueprint} blueprint
     * @param {Transform} [transform]
     * @param {function(EntityBuilder, MarkerNode, GridData, EntityComponentDataset)} [process] Opportunity to mutate entity before it is added to the dataset (ecd)
     * @param {MarkerNodeEntityProcessor} [processor]
     * @returns {MarkerNodeActionEntityPlacement}
     */
    static from(
        {
            blueprint,
            transform = undefined,
            process = null,
            processor = null
        }
    ) {

        if (process !== null) {
            throw new Error('process parameter is deprecated');
        }

        const r = new MarkerNodeActionEntityPlacement();

        r.entity = blueprint;

        if (transform !== undefined) {
            r.transform.copy(transform);
        }

        r.process = process;

        r.processor = processor;

        return r;
    }

    initialize(grid, ecd, seed) {
        if (this.processor !== null) {
            this.processor.initialize(grid, ecd);
        }
    }

    execute(grid, ecd, node) {
        const blueprint = this.entity;

        const entityBuilder = blueprint.buildEntityBuilder(node.properties);

        // execute post-process step
        if (this.processor !== null) {
            this.processor.execute(entityBuilder, node, grid, ecd);
        }

        /**
         *
         * @type {GridPosition}
         */
        const gp = entityBuilder.getComponent(GridPosition);

        if (gp !== null) {
            gp.copy(node.position);
        }

        /**
         *
         * @type {Transform}
         */
        const t = entityBuilder.getComponent(Transform);

        if (t !== null) {
            const temp = new Transform();

            temp.multiplyTransforms(node.transform, this.transform);

            t.multiplyTransforms(temp, t);
        }

        entityBuilder.build(ecd);
    }
}
