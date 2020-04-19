import { CompositeBehavior } from "./CompositeBehavior.js";
import { BehaviorStatus } from "../BehaviorStatus.js";
import { BitSet } from "../../../../core/binary/BitSet.js";
import { ObjectBasedClassSerializationAdapter } from "../../../ecs/storage/binary/object/ObjectBasedClassSerializationAdapter.js";

/**
 *
 * @enum {number}
 */
export const ParallelBehaviorPolicy = {
    RequireOne: 0,
    RequireAll: 1
};

export class ParallelBehavior extends CompositeBehavior {
    /**
     *
     * @param {ParallelBehaviorPolicy} successPolicy
     * @param {ParallelBehaviorPolicy} failurePolicy
     */
    constructor(successPolicy, failurePolicy) {
        super();

        /**
         * @private
         * @type {ParallelBehaviorPolicy}
         */
        this.successPolicy = successPolicy;

        /**
         * @private
         * @type {ParallelBehaviorPolicy}
         */
        this.failurePolicy = failurePolicy;

        /**
         * @private
         * @type {BitSet}
         */
        this.activeSet = new BitSet();

        /**
         * @private
         * @type {number}
         */
        this.successCount = 0;
        /**
         * @private
         * @type {number}
         */
        this.failureCount = 0;
    }

    /**
     *
     * @return {ParallelBehaviorPolicy}
     */
    getSuccessPolicy() {
        return this.successPolicy;
    }

    /**
     *
     * @param {ParallelBehaviorPolicy|number} v
     */
    setSuccessPolicy(v) {
        this.successPolicy = v;
    }

    /**
     *
     * @return {ParallelBehaviorPolicy}
     */
    getFailurePolicy() {
        return this.failurePolicy;
    }

    /**
     *
     * @param {ParallelBehaviorPolicy|number} v
     */
    setFailurePolicy(v) {
        this.failurePolicy = v;
    }

    /**
     *
     * @param {number} timeDelta
     * @returns {BehaviorStatus|number}
     */
    tick(timeDelta) {

        const activeSet = this.activeSet;

        /**
         *
         * @type {Behavior[]}
         */
        const children = this.__children;

        const numChildren = children.length;

        let i;

        for (i = 0; i < numChildren; i++) {
            if (!activeSet.get(i)) {
                continue;
            }

            const child = children[i];

            const status = child.tick(timeDelta);

            if (status === BehaviorStatus.Succeeded) {
                activeSet.set(i, false);

                this.successCount++;

                child.finalize();

                if (this.successPolicy === ParallelBehaviorPolicy.RequireOne) {

                    this.__finalizeActiveChildren();

                    this.__status = BehaviorStatus.Succeeded;
                    return BehaviorStatus.Succeeded;

                }

            } else if (status === BehaviorStatus.Failed) {
                activeSet.set(i, false);

                this.failureCount++;

                child.finalize();

                if (this.failurePolicy === ParallelBehaviorPolicy.RequireOne) {

                    this.__finalizeActiveChildren();

                    this.__status = BehaviorStatus.Failed;
                    return BehaviorStatus.Failed;

                } else if (this.successPolicy === ParallelBehaviorPolicy.RequireAll) {

                    this.__finalizeActiveChildren();

                    this.__status = BehaviorStatus.Failed;
                    return BehaviorStatus.Failed;

                }

            }
        }

        if (this.successCount === numChildren && this.successPolicy === ParallelBehaviorPolicy.RequireAll) {

            this.__status = BehaviorStatus.Succeeded;
            return BehaviorStatus.Succeeded;

        } else if (this.failureCount === numChildren && this.failurePolicy === ParallelBehaviorPolicy.RequireAll) {

            this.__status = BehaviorStatus.Failed;
            return BehaviorStatus.Failed;

        } else if ((this.failureCount + this.successCount) === numChildren) {

            this.__status = BehaviorStatus.Failed;
            return BehaviorStatus.Failed;

        } else {

            this.__status = BehaviorStatus.Running;
            return BehaviorStatus.Running;

        }
    }

    initialize(context) {
        this.successCount = 0;
        this.failureCount = 0;

        const children = this.__children;
        const numChildren = children.length;

        for (let i = 0; i < numChildren; i++) {
            const behavior = children[i];

            behavior.initialize(context);

            this.activeSet.set(i, true);
        }

        super.initialize(context);
    }

    /**
     *
     * @private
     */
    __finalizeActiveChildren() {
        const children = this.__children;

        const activeSet = this.activeSet;

        for (let i = activeSet.nextSetBit(0); i !== -1; i = activeSet.nextSetBit(i + 1)) {
            const behavior = children[i];

            behavior.finalize();
        }

    }


    finalize() {
        //finalize remaining active behaviours

        this.__finalizeActiveChildren();
    }

    /**
     *
     * @param {Behavior[]} elements
     * @param {ParallelBehaviorPolicy} success
     * @param {ParallelBehaviorPolicy} failure
     * @returns {ParallelBehavior}
     */
    static from(elements, success = ParallelBehaviorPolicy.RequireAll, failure = ParallelBehaviorPolicy.RequireOne) {
        const r = new ParallelBehavior(success, failure);

        elements.forEach(e => r.addChild(e));

        return r;
    }
}

ParallelBehavior.typeName = "ParallelBehavior";

export class ParallelBehaviorSerializationAdapter extends ObjectBasedClassSerializationAdapter {
    constructor() {
        super();

        this.klass = ParallelBehavior;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParallelBehavior} value
     */
    serialize(buffer, value) {

        buffer.writeUint8(value.getSuccessPolicy());
        buffer.writeUint8(value.getFailurePolicy());

        const children = value.getChildren();

        const n = children.length;

        buffer.writeUintVar(n);

        for (let i = 0; i < n; i++) {
            const behavior = children[i];

            this.objectAdapter.serialize(buffer, behavior);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {ParallelBehavior} value
     */
    deserialize(buffer, value) {
        const successPolicy = buffer.readUint8();
        const failurePolicy = buffer.readUint8();

        const count = buffer.readUintVar();

        value.clearChildren();

        for (let i = 0; i < count; i++) {
            /**
             *
             * @type {Behavior}
             */
            const child = this.objectAdapter.deserialize(buffer);

            value.addChild(child);
        }

        value.setFailurePolicy(failurePolicy);
        value.setSuccessPolicy(successPolicy);
    }
}
