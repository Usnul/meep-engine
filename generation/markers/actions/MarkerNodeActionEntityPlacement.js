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
         * @type {Function}
         */
        this.process = null;
    }

    /**
     *
     * @param {EntityBlueprint} blueprint
     * @param {Transform} [transform]
     * @param {function(EntityBuilder, MarkerNode, GridData, EntityComponentDataset)} [process] Opportunity to mutate entity before it is added to the dataset (ecd)
     * @returns {MarkerNodeActionEntityPlacement}
     */
    static from(
        {
            blueprint,
            transform = undefined,
            process = null
        }
    ) {

        const r = new MarkerNodeActionEntityPlacement();

        r.entity = blueprint;

        if (transform !== undefined) {
            r.transform.copy(transform);
        }

        this.process = process;

        return r;
    }

    execute(grid, ecd, node) {
        const blueprint = this.entity;

        const entityBuilder = blueprint.buildEntityBuilder(node.properties);

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
            t.multiplyTransforms(node.transform, this.transform);
        }

        // execute post-process step
        const process = this.process;

        if (process !== null) {
            process(entityBuilder, node, grid, ecd);
        }

        entityBuilder.build(ecd);
    }
}
