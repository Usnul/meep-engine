/**
 * @author Alex Goldring
 * @copyright Alex Goldring 2017
 */

/**
 * Base class for implementing reversible actions.
 * Actions are intended to be used in conjunction with {@link ActionProcessor}
 * @template C
 */
export class Action {
    /**
     * How much memory does this action require, used by the ActionProcessor in order to decide how much history to keep
     * @return {number}
     */
    computeByteSize() {
        return 1;
    }

    /**
     * Apply action
     * @param {C} context
     */
    apply(context) {

    }

    /**
     * Revert action, restoring state to just before this action was applied
     * @param {C} context
     */
    revert(context) {

    }
}

/**
 * Used for quick instanceof checks
 * @type {boolean}
 */
Action.prototype.isAction = true;
