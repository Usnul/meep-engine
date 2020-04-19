/**
 * @template S
 */
export class MoveEdge {
    constructor() {

        /**
         *
         * @type {null|StateNode}
         */
        this.target = null;
    }

    /**
     * Move that leads from source state to the target state
     * @param {S} inputState
     * @returns S output state
     */
    move(inputState) {

    }

    /**
     *
     * @returns {boolean}
     */
    isTargetMaterialized() {
        return this.target !== null;
    }

    /**
     * @template S
     * @param {function(S):S} f
     * @return {MoveEdge<S>}
     */
    static fromFunction(f) {
        const r = new MoveEdge();

        r.move = f;

        return r;
    }
}
