import { BitSet } from "../../../../core/binary/BitSet.js";
import Signal from "../../../../core/events/signal/Signal.js";
import { assert } from "../../../../core/assert.js";
import { IllegalStateException } from "../../../../core/fsm/exceptions/IllegalStateException.js";

/**
 * @readonly
 * @enum {number}
 */
const IncrementalDeltaSetState = {
    Clear: 0,
    Building: 1,
    Ready: 2
};

/**
 * accelerated Set data structure optimized for incremental re-building
 * @template V
 */
export class IncrementalDeltaSet {
    constructor() {
        /**
         *
         * @type {V[]}
         */
        this.elements = [];

        /**
         * Current version of the state, each time the set is updated - version changes
         * @type {number}
         */
        this.version = 0;

        /**
         * Dirty flag set, used during the update to keep track of which elements are to be remove
         * @type {BitSet}
         */
        this.flags = new BitSet();

        /**
         * Number of currently held elements
         * @type {number}
         */
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
         * @type {IncrementalDeltaSetState|number}
         */
        this.state = IncrementalDeltaSetState.Clear;
    }

    /**
     *
     * @param {V} element
     * @returns {boolean}
     */
    contains(element) {
        return this.elements.indexOf(element) !== -1;
    }

    /**
     *
     * @param {V} element
     * @returns {boolean}
     */
    forceRemove(element) {
        if (this.state === IncrementalDeltaSetState.Building) {
            throw new IllegalStateException('Cannot remove during build');
        }

        const i = this.elements.indexOf(element, 0);

        if (i !== -1) {
            this.elements.splice(i, 1);
            this.size--;

            this.version++;

            return true;
        } else {
            return false;
        }
    }

    clear() {
        this.elements.splice(0, this.size);
        this.size = 0;
        this.flags.reset();

        this.state = IncrementalDeltaSetState.Clear;

        this.version++;
    }

    initializeUpdate() {
        //mark all elements as dirty
        this.flags.setRange(0, this.size - 1);

        this.state = IncrementalDeltaSetState.Building;

        this.version++;
    }

    finalizeUpdate() {
        assert.equal(this.state, IncrementalDeltaSetState.Building, `Expected BUILDING state, instead got '${this.state}'`);

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

        this.state = IncrementalDeltaSetState.Ready;

        //dispatch notification
        this.onUpdateFinished.send0();
    }

    /**
     *
     * @param {V} element
     */
    push(element) {
        //check if element is already in the set
        const i = this.elements.indexOf(element); //TODO this can probably be done faster. Maybe use a bloom filter? or some kind of a hash

        if (i === -1) {
            this.elements.push(element);
            this.size++;

            this.onAdded.send1(element);
        } else {
            //Existing element. We're keeping it. clear dirty flag
            this.flags.clear(i);
        }

    }
}
