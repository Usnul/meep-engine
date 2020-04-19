import { BitSet } from "../../../../core/binary/BitSet.js";
import Signal from "../../../../core/events/signal/Signal.js";
import { assert } from "../../../../core/assert.js";

/**
 * @readonly
 * @enum {number}
 */
const VisibilitySetState = {
    Clear: 0,
    Building: 1,
    Ready: 2
};

export class VisibilitySet {
    constructor() {
        /**
         *
         * @type {Object3D[]}
         */
        this.elements = [];

        this.flags = new BitSet();

        this.size = 0;

        /**
         *
         * @type {Signal}
         */
        this.onUpdateFinished = new Signal();

        /**
         *
         * @type {Signal}
         */
        this.onAdded = new Signal();

        /**
         *
         * @type {Signal}
         */
        this.onRemoved = new Signal();

        /**
         *
         * @type {VisibilitySetState|number}
         */
        this.state = VisibilitySetState.Clear;
    }

    clear() {
        this.elements.splice(0, this.size);
        this.size = 0;
        this.flags.reset();

        this.state = VisibilitySetState.Clear;
    }

    initializeUpdate() {
        //mark all elements as dirty
        this.flags.setRange(0, this.size - 1);

        this.state = VisibilitySetState.Building;
    }

    finalizeUpdate() {
        assert.equal(this.state, VisibilitySetState.Building, `Expected BUILDING state, instead got '${this.state}'`);

        let deletions = 0;

        //go through all dirty flags and remove corresponding elements
        for (
            let i = this.flags.nextSetBit(0);
            i !== -1;
            i = this.flags.nextSetBit(i + 1)
        ) {
            const index = i - deletions;

            const removed = this.elements.splice(index, 1);

            this.onRemoved.send1(removed[0]);

            deletions++;
        }

        //update size
        this.size -= deletions;

        this.flags.reset();

        this.state = VisibilitySetState.Ready;

        //dispatch notification
        this.onUpdateFinished.send0();
    }

    /**
     *
     * @param {Object3D} element
     */
    push(element) {
        //check if element is already in the set
        const i = this.elements.indexOf(element);

        if (i === -1) {
            this.elements.push(element);
            this.size++;

            this.onAdded.send1(element);
        } else {
            //clear dirty flag
            this.flags.clear(i);
        }

    }
}
