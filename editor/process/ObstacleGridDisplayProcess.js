import { EditorProcess } from "./EditorProcess.js";
import { obtainTerrain } from "../../../model/game/scenes/SceneUtils.js";
import GridObstacle from "../../engine/grid/components/GridObstacle.js";
import GridPosition from "../../engine/grid/components/GridPosition.js";
import { Sampler2D } from "../../engine/graphics/texture/sampler/Sampler2D.js";

class ObstacleGridDisplayProcess extends EditorProcess {

    constructor() {
        super();
        /**
         *
         * @type {TerrainOverlay|null}
         */
        this.overlay = null;
        this.name = ObstacleGridDisplayProcess.Id;
    }

    startup() {
        super.startup();

        const engine = this.editor.engine;

        const entityManager = engine.entityManager;

        const terrain = obtainTerrain(entityManager.dataset);

        if (terrain === null) {
            this.overlay = null;
            return;
        }

        const overlay = terrain.overlay;
        this.overlay = overlay;

        overlay.push();

        overlay.borderWidth.set(0.05);

        this.draw();
    }

    draw() {
        /**
         *
         * @type {TerrainOverlay}
         */
        const overlay = this.overlay;
        if (overlay === null) {
            //no overlay, do nothing
            return;
        }

        //
        const drawBuffer = Sampler2D.uint8(4, overlay.size.x, overlay.size.y);

        overlay.clear();

        const em = this.editor.engine.entityManager;

        const color = [];

        /**
         *
         * @param {number} x
         * @param {number} y
         * @param {number} value
         */
        function paintPoint(x, y, value) {
            drawBuffer.read(x, y, color);

            if (value === 0) {
                if (color[3] !== 0) {
                    return;
                }
                color[0] = 2;
                color[1] = 256;
                color[2] = 0;
                color[3] = 13;
            } else {
                if (color[3] !== 0) {
                    drawBuffer.set(x, y, [0, 0, 0, 0]);
                }

                color[0] = 0;
                color[1] = 0;
                color[2] = 0;
                color[3] = 54;
            }


            drawBuffer.set(x, y, color);
        }

        /**
         *
         * @param {GridObstacle} obstacle
         * @param {GridPosition} position
         */
        function visitObstacle(obstacle, position) {
            obstacle.traverseMask(position.x, position.y, paintPoint);
        }

        em.dataset.traverseEntities([GridObstacle, GridPosition], visitObstacle);

        overlay.writeData(drawBuffer.data);
    }

    shutdown() {
        super.shutdown();

        if (this.overlay !== null) {
            this.overlay.pop();
        }
    }
}

ObstacleGridDisplayProcess.Id = "obstacle-grid-display";

export { ObstacleGridDisplayProcess };
