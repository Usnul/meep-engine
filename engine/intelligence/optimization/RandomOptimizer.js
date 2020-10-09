import { randomFromArray, seededRandom } from "../../../core/math/MathUtils.js";

/**
 * Hill climbing optimizer based on random moves
 * @template S
 * @class
 */
export class RandomOptimizer {

    /**
     * @template S
     */
    constructor() {
        /**
         *
         * @type {S}
         */
        this.state = null;

        /**
         *
         * @type {function(S):S}
         */
        this.cloneState = null;

        /**
         *
         * @type {function(S):Function[]}
         */
        this.computeValidActions = null;

        /**
         *
         * @type {function(S):number}
         */
        this.scoreFunction = null;

        /**
         *
         * @type {function(S,random:function():number)|null}
         */
        this.randomAction = null;


        /**
         *
         * @type {Function}
         */
        this.random = seededRandom(0);
    }

    /**
     *
     * @param {S} state
     * @param {function(S):Function[]} [computeValidActions]
     * @param {function(S):S} cloneState
     * @param {function(S):number} scoreFunction
     * @param {function(S,random:function():number)} [randomAction]
     */
    initialize(
        {
            state,
            computeValidActions = null,
            cloneState,
            scoreFunction,
            randomAction = null
        }
    ) {
        if (computeValidActions === null && randomAction === null) {
            throw new Error(`Either computeValidActions or randomAction must be supplied`);
        }

        this.state = state;

        this.computeValidActions = computeValidActions;

        this.cloneState = cloneState;

        this.scoreFunction = scoreFunction;

        this.randomAction = randomAction;
    }

    /**
     * Perform a single optimization step
     * @returns {boolean} True if state was improved, false if no change has occurred
     */
    step() {
        const tempState = this.cloneState(this.state);

        const currentScore = this.scoreFunction(this.state);

        //mutate state
        if (this.randomAction !== null) {
            this.randomAction(tempState, this.random);
        } else {

            const actions = this.computeValidActions(tempState);

            const numActions = actions.length;

            if (numActions === 0) {
                return false;
            }


            const action = randomFromArray(this.random, actions);

            action(tempState);
        }

        const newScore = this.scoreFunction(tempState);

        if (Number.isNaN(newScore)) {
            console.error('Score function returned NaN');

            return false;
        }

        if (newScore <= currentScore) {
            //score not improved
            return false;
        }

        //swap current state with the new one
        this.state = tempState;

        return true;
    }

    /**
     *
     * @param {number} tries
     * @returns {boolean}
     */
    stepThrough(tries) {
        for (let i = 0; i < tries; i++) {
            if (this.step()) {
                return true;
            }
        }

        return false;
    }
}
