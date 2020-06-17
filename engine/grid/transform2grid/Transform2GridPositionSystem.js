import { System } from "../../ecs/System.js";
import { Transform2GridPosition } from "./Transform2GridPosition.js";
import GridPosition from "../components/GridPosition.js";
import { Transform } from "../../ecs/transform/Transform.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import Vector2 from "../../../core/geom/Vector2.js";
import { Transform2GridPositionMode } from "./Transform2GridPositionMode.js";

const v2 = new Vector2();

class Synchronizer {
    constructor() {

        /**
         *
         * @type {Transform}
         */
        this.transform = null;

        /**
         *
         * @type {GridPosition}
         */
        this.position = null;

        /**
         *
         * @type {Transform2GridPosition}
         */
        this.component = null;

        /**
         *
         * @type {EntityComponentDataset}
         */
        this.ecd = null;
    }

    write() {
        const terrain = obtainTerrain(this.ecd);

        // read the raw value
        terrain.mapPointWorld2Grid(this.transform.position, v2);

        const mode = this.component.mode;

        // apply transformation mode
        switch (mode) {
            case Transform2GridPositionMode.Floor:
                v2.floor();
                break;

            case Transform2GridPositionMode.Ceil:
                v2.floor();
                break;

            case Transform2GridPositionMode.Round:
                v2.round();
                break;

            default:
                throw new Error(`Unsupported mode '${mode}'`);

            case Transform2GridPositionMode.Continuous:
                // do nothing
        }

        this.position.copy(v2);
    }


    link() {
        this.transform.position.onChanged.add(this.write, this);
    }

    unlink() {
        this.transform.position.onChanged.remove(this.write, this);
    }
}

export class Transform2GridPositionSystem extends System {
    constructor() {
        super();

        this.dependencies = [Transform2GridPosition, Transform, GridPosition];

        /**
         *
         * @type {Synchronizer[]}
         */
        this.data = [];
    }

    /**
     *
     * @param {Transform2GridPosition} component
     * @param {Transform} transform
     * @param {GridPosition} gp
     * @param {number} entity
     */
    link(component, transform, gp, entity) {
        const synchronizer = new Synchronizer();

        synchronizer.transform = transform;
        synchronizer.position = gp;
        synchronizer.component = component;

        synchronizer.ecd = this.entityManager.dataset;

        this.data[entity] = synchronizer;

        synchronizer.link();
    }

    /**
     *
     * @param {Transform2GridPosition} component
     * @param {Transform} transform
     * @param {GridPosition} gp
     * @param {number} entity
     */
    unlink(component, transform, gp, entity) {

        const synchronizer = this.data[entity];

        if (synchronizer !== undefined) {
            delete this.data[entity];

            synchronizer.unlink();
        }

    }
}
