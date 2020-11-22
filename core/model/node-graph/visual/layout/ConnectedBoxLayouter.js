import { seededRandom } from "../../../../math/MathUtils.js";
import AABB2 from "../../../../geom/AABB2.js";
import Vector2 from "../../../../geom/Vector2.js";
import { resolveBoxOverlapUsingForce } from "../../../../graph/layout/box/resolveBoxOverlapUsingForce.js";
import { QuadTreeNode } from "../../../../geom/2d/quad-tree/QuadTreeNode.js";

const temp_aabb2 = new AABB2();

export class ConnectedBoxLayouter {
    constructor() {

        /**
         *
         * @type {BoxLayoutSpec[]}
         */
        this.boxes = [];
        /**
         *
         * @type {ConnectionLayoutSpec[]}
         */
        this.connections = [];


        /**
         *
         * @type {QuadTreeNode<>}
         * @private
         */
        this.__spatial_index_connections = new QuadTreeNode();
    }

    /**
     * @param {BoxLayoutSpec[]} boxes
     * @param {ConnectionLayoutSpec[]} connections
     */
    initialize(boxes, connections) {
        this.boxes = boxes;
        this.connections = connections;


        this.__spatial_index_connections.clear();

        const n = connections.length;
        for (let i = 0; i < n; i++) {
            const connectionLayoutSpec = connections[i];
        }
    }

    __resolve_box_overlap(max_steps = 3) {

        const forces = this.boxes.map(n => new Vector2());
        const bound_array = this.boxes.map(b => b.bounds);

        let step_count = 0;
        let overlapMoves = -1;
        while (step_count < max_steps && overlapMoves !== 0) {
            step_count++;
            overlapMoves = resolveBoxOverlapUsingForce(forces, bound_array);
        }

    }

    /**
     *
     * @param {BoxLayoutSpec} box
     * @returns {number}
     * @private
     */
    __compute_box_cost(box) {

        let result = 0;

        // fitness is based on how long distances between connection points are
        const connections = box.connections;

        const n = connections.length;

        for (let i = 0; i < n; i++) {
            const connection = connections[i];

            const source = connection.source;

            const _x0 = source.point.x + source.box.bounds.x0;
            const _y0 = source.point.y + source.box.bounds.y0;

            const target = connection.target;

            const _x1 = target.point.x + target.box.bounds.x0;
            const _y1 = target.point.y + target.box.bounds.y0;

            const dx = _x1 - _x0;
            const dy = _y1 - _y0;

            result += dx * dx + dy * dy;
        }

        return result;
    }

    __execute_swaps() {
        let b0_cost;
        let b1_cost;
        let swap_count = 0;

        const boxes = this.boxes;
        const box_count = boxes.length;

        for (let i = 0; i < box_count - 1; i++) {
            const b0 = boxes[i];

            if (b0.locked) {
                continue;
            }

            b0_cost = this.__compute_box_cost(b0);

            for (let j = i + 1; j < box_count; j++) {
                const b1 = boxes[j];

                if (b1.locked) {
                    continue;
                }

                b1_cost = this.__compute_box_cost(b1);

                // attempt swap
                const temp_x = b0.bounds.x0;
                const temp_y = b0.bounds.y0;

                b0.bounds.setPosition(b1.bounds.x0, b1.bounds.y0);
                b1.bounds.setPosition(temp_x, temp_y);

                const b0_cost_after = this.__compute_box_cost(b0);
                const b1_cost_after = this.__compute_box_cost(b0);

                if (b0_cost + b1_cost <= b0_cost_after + b1_cost_after) {
                    // failure, revert
                    b1.bounds.setPosition(b0.bounds.x0, b0.bounds.y0);
                    b0.bounds.setPosition(temp_x, temp_y);
                } else {
                    // update cost
                    b0_cost = b0_cost_after;

                    swap_count++;
                }
            }
        }

        return swap_count;
    }

    /**
     *
     * @param {ConnectionLayoutSpec} spec
     * @param {number} strength
     * @private
     */
    __pull_connection(spec, strength) {

        const source = spec.source;

        const _x0 = source.point.x + source.box.bounds.x0;
        const _y0 = source.point.y + source.box.bounds.y0;

        const target = spec.target;

        const _x1 = target.point.x + target.box.bounds.x0;
        const _y1 = target.point.y + target.box.bounds.y0;

        const dx = _x1 - _x0;
        const dy = _y1 - _y0;


        const step_x = dx * strength * 0.5;
        const step_y = dy * strength * 0.5;

        source.box.bounds.move(step_x, step_y);
        target.box.bounds.move(-step_x, -step_y);
    }

    __pull_connections(strength) {
        const connections = this.connections;
        const n = connections.length;
        for (let i = 0; i < n; i++) {
            const spec = connections[i];

            this.__pull_connection(spec, strength);
        }
    }

    __execute_many_swaps(limit) {
        for (let i = 0; i < limit; i++) {
            const swaps = this.__execute_swaps();

            if (swaps === 0) {
                return;
            }
        }
    }

    __execute_initial_placement() {
        const random = seededRandom(0);

        const boxes = this.boxes;
        const box_count = boxes.length;

        for (let i = 0; i < box_count; i++) {
            const box = boxes[i];
            const bounds = box.bounds;

            const w = bounds.x1 - bounds.x0;
            const h = bounds.y1 - bounds.y0;

            const x0 = (random() - 0.5) * 2 * w;
            const y0 = (random() - 0.5) * 2 * h;

            bounds.set(x0, y0, x0 + w, y0 + h);
        }
    }

    step() {

        this.__execute_many_swaps(10);

        this.__pull_connections(0.1);

        this.__resolve_box_overlap(10);
    }

    layout() {
        this.__execute_initial_placement();

        for (let i = 0; i < 7; i++) {
            this.__pull_connections(0.2);
            this.__resolve_box_overlap(10);
        }

        for (let i = 0; i < 10; i++) {
            this.step();
        }

    }
}
