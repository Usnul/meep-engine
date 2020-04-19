import BinaryHeap from './FastBinaryHeap.js';
import Vector2 from '../../../core/geom/Vector2.js';
import { assert } from "../../../core/assert.js";


/**
 *
 * @param {Vector2} result
 * @param {number} index
 * @param {number} width
 */
function index2point(result, index, width) {
    const x = index % width;
    const y = (index / width) | 0;

    result.set(x, y);
}

/**
 *
 * @param {number[]} result
 * @param {number} index
 * @param {number} width
 * @param {number} height
 */
function computeOrthogonalNeighbors(result, index, width, height) {
    const x = index % width;
    const y = (index / width) | 0;
    if (x > 0) {
        result.push(index - 1);
    }
    if (x < width - 1) {
        result.push(index + 1);
    }
    if (y > 0) {
        result.push(index - width);
    }
    if (y < height - 1) {
        result.push(index + width);
    }
}

/**
 *
 * @param {number|Uint8Array|Uint16Array|Float32Array} field
 * @param {Number} width
 * @param {Number} height
 * @param {number} start
 * @param {number} goal
 * @param {Number} crossingPenalty
 * @param {Number} bendPenalty
 * @param {number} blockValue
 * @returns {Array.<Number>} array of indices representing path from start to end
 */
export function gridAStarSearch(field, width, height, start, goal, crossingPenalty, bendPenalty, blockValue) {
    assert.notEqual(field, undefined, 'field is undefined');
    assert.notEqual(field, null, 'field is null');

    assert.notEqual(start, undefined, 'start is undefined');
    assert.notEqual(start, null, 'start is null');

    assert.notEqual(goal, undefined, 'end is undefined');
    assert.notEqual(goal, null, 'end is null');

    assert.typeOf(start, 'number', "start");
    assert.typeOf(goal, 'number', "goal");

    assert.typeOf(crossingPenalty, 'number', 'crossingPenalty');
    assert.typeOf(bendPenalty, 'number', 'bendPenalty');
    assert.typeOf(blockValue, 'number', 'blockValue');


    let limitCycles = 5000000;

    const heuristic = function (index0, index1) {
        const x1 = index0 % width;
        const y1 = Math.floor(index0 / width);
        //
        const x2 = index1 % width;
        const y2 = Math.floor(index1 / width);
        //
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return dx + dy;
    };

    const came_from = [];
    const f_score = [];
    const g_score = [];

    const open = new BinaryHeap(function score(i1) {
        return f_score[i1];
    });

    const closed = [];

    g_score[start] = 0;
    f_score[goal] = heuristic(start, goal);

    const directionTo = [];
    directionTo[start] = 0;

    open.push(start);

    function pathTo(node) {
        let pP = new Vector2(-1, -1),
            pC = new Vector2();
        let dx = 1,
            dy = 1,
            _dx = 0,
            _dy = 0;
        const result = [];
        let prev = node;
        while (node !== void 0) {
            index2point(pC, node, width);
            _dx = pC.x - pP.x;
            _dy = pC.y - pP.y;
            //
            if (_dx !== 0) {
                _dx /= Math.abs(_dx);
            }
            if (_dy !== 0) {
                _dy /= Math.abs(_dy);
            }
            if (dx !== _dx || dy !== _dy) {
                dx = _dx;
                dy = _dy;
                //only record points where connection bends to save space
                result.push(prev);
            }
            prev = node;
            node = came_from[node];
            //swap
            const t = pP;
            pP = pC;
            pC = t;
        }
        if (result[result.length - 1] !== prev) {
            //check if last node needs to be added
            result.push(prev);
        }
        result.reverse();
        return result;
    }

    const neighbors = [];
    while (open.size() > 0) {
        if (limitCycles-- === 0) {
            throw new Error("maximum number of cycles reached");
        }
        // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
        const currentNode = open.pop();

        // End case -- result has been found, return the traced path.
        if (currentNode === goal) {
            return pathTo(currentNode);
        }

        // Normal case -- move currentNode from open to closed, process each of its neighbors.
        closed[currentNode] = true;

        // Find all neighbors for the current node.
        neighbors.length = 0;
        computeOrthogonalNeighbors(neighbors, currentNode, width, height);
        const numNeighbours = neighbors.length;
        if (numNeighbours === 0) {
            continue;
        }
        const directionToCurrent = directionTo[currentNode];
        for (let i = 0; i < numNeighbours; ++i) {
            const neighbor = neighbors[i];

            if (closed[neighbor] !== void 0) {
                // Not a valid node to process, skip to next neighbor.
                continue;
            }

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            const neighborValue = field[neighbor];
            if (neighborValue === blockValue) {
                //cell is blocked, cloe and continue
                closed[neighbor] = true;
                continue;
            }
            const direction = neighbor - currentNode;
            let turnValue;
            if (direction !== directionToCurrent) {
                turnValue = bendPenalty;
            } else {
                turnValue = 0;
            }
            const transitionCost = neighborValue * crossingPenalty + 1 + turnValue;

            const gScore = g_score[currentNode] + transitionCost,
                notInOpenSet = !open.contains(neighbor);

            if (notInOpenSet || gScore < g_score[neighbor]) {

                // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                came_from[neighbor] = currentNode;

                directionTo[neighbor] = direction;

                g_score[neighbor] = gScore;
                const h = heuristic(neighbor, goal);

                f_score[neighbor] = gScore + h;


                if (notInOpenSet) {
                    // Pushing to heap will put it in proper place based on the 'f' value.
                    open.push(neighbor);
                } else {
                    // Already seen the node, but since it has been rescored we need to reorder it in the heap
                    open.rescoreElement(neighbor);
                }
            }
        }
    }
    // No result was found - empty array signifies failure to find path.
    return [];
}
