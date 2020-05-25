import { MarkerNodeAction } from "./MarkerNodeAction.js";
import GridPosition from "../../../engine/grid/components/GridPosition.js";
import { Transform } from "../../../engine/ecs/components/Transform.js";
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
    }

    /**
     *
     * @param {EntityBlueprint} blueprint
     * @param {Transform} [transform]
     * @returns {MarkerNodeActionEntityPlacement}
     */
    static from(blueprint, transform = undefined) {
        const r = new MarkerNodeActionEntityPlacement();

        r.entity = blueprint;

        if (transform !== undefined) {
            r.transform.copy(transform);
        }

        return r;
    }

    execute(grid, ecd, node) {
        const blueprint = this.entity;

        const entityBuilder = blueprint.buildEntityBuilder();

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
            t.multiplyTransforms(node.transofrm, this.transform);
        }

        entityBuilder.build(ecd);
    }
}
