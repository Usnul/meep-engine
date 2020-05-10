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
    }

    /**
     *
     * @param {EntityBlueprint} blueprint
     * @returns {MarkerNodeActionEntityPlacement}
     */
    static from(blueprint) {
        const r = new MarkerNodeActionEntityPlacement();

        r.entity = blueprint;

        return r;
    }

    execute(ecd, node) {
        const blueprint = this.entity;

        const entityBuilder = blueprint.buildEntityBuilder();

        const gp = entityBuilder.getComponent(GridPosition);

        if (gp !== null) {
            gp.copy(node.position);
        }

        const t = entityBuilder.getComponent(Transform);

        if (t !== null) {
            t.copy(node.transofrm);
        }

        entityBuilder.build(ecd);
    }
}
