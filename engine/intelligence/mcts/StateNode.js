import { MoveEdge } from "./MoveEdge.js";
import { assert } from "../../../core/assert.js";

/**
 *
 * @enum {number}
 */
export const StateType = {
    Undecided: 0,
    Win: 1,
    Loss: 2,
    Tie: 3,
    DepthCapped: 4,
    NoMoves: 5
};

/**
 *
 * @param {MoveEdge} move
 * @param {number} totalPlayouts
 * @param {number} totalUncertainPlayouts
 * @returns {number}
 */
function computeScore(move, totalPlayouts, totalUncertainPlayouts) {
    /**
     *
     * @type {StateNode}
     */
    const stateNode = move.target;

    const playouts = stateNode.playouts;

    if (playouts === 0) {
        return 0;
    }

    let score = 0;

    const wins = stateNode.wins;

    if (wins !== 0) {

        score += wins / playouts;
    } else {
        // TODO consider if the heuristic can bias the outcome in undesirable ways
        // use heuristic instead of actual score
        score = stateNode.heuristicValue;
    }

    return score;
}

const traverseState = function () {

    let stackPointer = 0;
    const stack = [];

    /**
     *
     * @param {StateNode} node
     * @param {function(StateNode)} visitor
     */
    function traverseState(node, visitor) {
        const stackOffset = stackPointer;

        stack[stackPointer++] = node;

        let n;

        while (stackPointer-- > stackOffset) {

            n = stack[stackPointer];

            visitor(n);

            if (n.isExpanded()) {

                const moves = n.moves;
                const numMoves = moves.length;

                for (let i = 0; i < numMoves; i++) {
                    const moveEdge = moves[i];

                    if (moveEdge.isTargetMaterialized()) {
                        const target = moveEdge.target;

                        stack[stackPointer++] = target;
                    }
                }
            }
        }

        //cleanup
        stack.length = stackOffset;
        stackPointer = stackOffset;
    }

    return traverseState;
}();

/**
 * @template State, Action
 */
export class StateNode {
    constructor() {
        /**
         * How deep is the node in the tree
         * @type {number}
         */
        this.depth = 0;

        /**
         *
         * @type {number}
         */
        this.wins = 0;

        /**
         * Number of leses in the subtree of this state
         * @type {number}
         */
        this.losses = 0;


        /**
         * total number of explored playouts
         * @type {number}
         */
        this.playouts = 0;

        /**
         *
         * @type {number}
         */
        this.heuristicValue = 0;

        /**
         * parent node, previous state
         * @type {null|StateNode}
         */
        this.parent = null;

        /**
         *
         * @type {null|MoveEdge[]}
         */
        this.moves = null;

        /**
         *
         * @type {StateType}
         */
        this.type = StateType.Undecided;
    }

    bubbleUpHeuristicScore() {
        let r = this.parent;

        while (r !== null) {
            r.aggregateHeuristicScore();

            r = r.parent;
        }

    }

    /**
     * Aggregate heuristic score from children
     */
    aggregateHeuristicScore() {
        const moves = this.moves;

        if (moves === null) {
            //do nothing
            return;
        }

        const n = moves.length;

        let score = this.heuristicValue;

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {MoveEdge}
             */
            const move = moves[i];

            if (!move.isTargetMaterialized()) {
                continue;
            }

            /**
             *
             * @type {StateNode}
             */
            const target = move.target;

            const childScore = target.heuristicValue;

            if (childScore < score) {
                // pick worst score to aggregate
                score = childScore;
            }

        }

        this.heuristicValue = score;
    }

    /**
     * @param state
     * @param {function(State, source:StateNode):MoveEdge[]} computeValidMoves
     * @param computeTerminalFlag
     * @returns {number} number of children
     */
    expand(state, computeValidMoves, computeTerminalFlag) {
        /**
         *
         * @type {MoveEdge[]}
         */
        const moves = computeValidMoves(state, this);

        assert.notEqual(moves, null, 'computedValidMoves expected to be an array, instead it was null');
        assert.notEqual(moves, undefined, 'computedValidMoves expected to be an array, instead it was undefined');
        assert.ok(Array.isArray(moves), 'computedValidMoves expected to be an array, instead was something else');

        const numMoves = moves.length;

        this.moves = moves;

        if (numMoves === 0) {

            //mark node as terminal
            this.type = StateType.NoMoves;

        }

        return numMoves;
    }


    /**
     *
     * @param {number} playouts
     * @param {number} wins
     * @param {number} losses
     */
    addPlayouts(playouts, wins, losses) {
        let node = this;

        do {

            node.playouts += playouts;
            node.wins += wins;
            node.losses += losses;

            node = node.parent;

        } while (node !== null);
    }


    /**
     * Whenever this is a terminal state or not (win/loss)
     * @returns {boolean}
     */
    isTerminal() {
        return this.type !== 0;
    }

    /**
     *
     * @returns {boolean}
     */
    isExpanded() {
        return this.moves !== null;
    }

    /**
     *
     * @returns {MoveEdge[]}
     */
    pickBestMoves() {
        const totalPlayouts = this.playouts;
        const totalUncertainPlayouts = totalPlayouts - (this.wins + this.losses);

        const moves = this.moves;
        const numMoves = moves.length;


        if (numMoves === 0) {
            //no moves
            return [];
        }

        const firstMove = moves[0];

        let result = [firstMove];
        let bestScore = computeScore(firstMove, totalPlayouts, totalUncertainPlayouts);

        for (let i = 1; i < numMoves; i++) {

            const move = moves[i];

            const score = computeScore(move, totalPlayouts, totalUncertainPlayouts);

            if (score > bestScore) {
                bestScore = score;
                result = [move];
            } else if (score === bestScore) {
                result.push(move);
            }
        }

        return result;
    }

    /**
     *
     * @param {function(StateNode)} visitor
     */
    traverse(visitor) {
        traverseState(this, visitor);
    }
}
