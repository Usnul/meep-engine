import { ReactiveTrigger } from "./ReactiveTrigger.js";
import { assert } from "../../../assert.js";

export class BlackboardTrigger {
    constructor() {
        /**
         * @type {String|null}
         */
        this.code = null;

        /**
         *
         * @type {boolean}
         */
        this.isLinked = false;

        /**
         *
         * @type {Blackboard}
         */
        this.blackboard = null;

        /**
         *
         * @type {ReactiveTrigger}
         */
        this.trigger = null;
    }

    /**
     *
     * @returns {ReactiveExpression}
     */
    getExpression() {
        return this.trigger.expression;
    }

    /**
     *
     * @returns {boolean}
     */
    isCompiled() {
        return this.trigger !== undefined;
    }

    compile() {
        this.trigger = new ReactiveTrigger(this.code);
    }

    /**
     *
     * @param {Blackboard} blackboard
     */
    link(blackboard) {
        assert.defined(blackboard, 'blackboard');

        if (this.isLinked) {
            //already linked
            return;
        }

        this.blackboard = blackboard;

        this.isLinked = true;

        if (!this.isCompiled()) {
            this.compile();
        }

        this.trigger.traverseReferences(this.connectReference, this);
    }

    unlink() {
        if (!this.isLinked) {
            //not linked
            return;
        }

        this.isLinked = false;

        this.trigger.traverseReferences(this.releaseReference, this);
    }

    /**
     * @private
     * @param {ReactiveReference} ref
     */
    connectReference(ref) {
        const value = this.blackboard.acquire(ref.name, ref.dataType);

        ref.connect(value);
    }

    /**
     * @private
     * @param {ReactiveReference} ref
     */
    releaseReference(ref) {

        ref.disconnect();

        this.blackboard.release(ref.name);
    }

}
