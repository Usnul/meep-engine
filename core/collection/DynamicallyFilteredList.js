import List from "./List.js";
import { arraySetDiff } from "./Set.js";
import { invokeObjectEquals } from "../function/Functions.js";
import { frameThrottle } from "../../engine/graphics/FrameThrottle.js";

export class DynamicallyFilteredList {
    /**
     * @template T
     * @param {List<T>} input
     * @param {List<MutableFilter<T>>} filters
     * @returns {List<T>}
     */
    constructor(input, filters) {
        /**
         *
         * @type {List<T>}
         */
        this.input = input;

        /**
         *
         * @type {List<T>}
         */
        this.output = new List();

        /**
         *
         * @type {List<MutableFilter<T>>}
         */
        this.filters = filters;

        /**
         *
         * @type {boolean}
         */
        this.deferred = true;

        this.deferredApply = frameThrottle(this.apply, this);
    }

    update(){
        if(this.deferred){
            this.deferredApply();
        }else{
            this.apply();
        }
    }

    /**
     * @private
     * @param {MutableFilter} f
     */
    watchFilter(f) {
        f.onChanged.add(this.update, this);
    }

    /**
     * @private
     * @param {MutableFilter} f
     */
    unwatchFilter(f) {
        f.onChanged.remove(this.update, this);
    }

    /**
     * @private
     * @param {MutableFilter} f
     */
    handleFilterAdded(f) {
        this.watchFilter(f);
        this.update();
    }

    /**
     * @private
     * @param {MutableFilter} f
     */
    handleFilterRemoved(f) {
        this.unwatchFilter(f);
        this.update();
    }

    link() {
        this.input.on.added.add(this.update, this);
        this.input.on.removed.add(this.update, this);

        this.filters.forEach(this.watchFilter, this);

        this.filters.on.added.add(this.handleFilterAdded, this);
        this.filters.on.removed.add(this.handleFilterRemoved, this);

        this.update();
    }

    unlink() {
        this.input.on.added.remove(this.update, this);
        this.input.on.removed.remove(this.update, this);

        this.filters.forEach(this.unwatchFilter, this);

        this.filters.on.added.remove(this.handleFilterAdded, this);
        this.filters.on.removed.remove(this.handleFilterRemoved, this);
    }

    apply() {
        const input = this.input;
        const output = this.output;
        const filters = this.filters.asArray();

        /**
         *
         * @type {T[]}
         */
        const oldOutput = output.asArray().slice();
        /**
         *
         * @type {T[]}
         */
        const newOutput = [];

        const inputArray = input.asArray();

        const inputSize = inputArray.length;

        input: for (let i = 0; i < inputSize; i++) {
            const v = inputArray[i];

            for (let j = 0; j < filters.length; j++) {
                const f = filters[j];

                if (f.apply(v) !== true) {
                    continue input;
                }
            }

            newOutput.push(v);
        }

        const diff = arraySetDiff(oldOutput, newOutput, invokeObjectEquals);

        //resolve diff
        const removals = diff.uniqueA;

        removals.forEach(item => output.removeOneOf(item));

        const additions = diff.uniqueB;

        //sort additions by their position in the input
        additions.sort((a, b) => {
            const ai = input.indexOf(a);
            const bi = input.indexOf(b);

            return bi - ai;
        });

        /**
         *
         * @param {Item} item
         * @return {number}
         */
        function computeInsertionPosition(item) {
            //find where the item is in the input
            const inputIndex = input.indexOf(item);

            for (let i = inputIndex - 1; i >= 0; i--) {
                const prev = input.get(i);

                //look for previous item in the output
                const j = output.indexOf(prev);

                if (j !== -1) {
                    return j + 1;
                }
            }

            //insert in the beginning
            return 0;
        }

        additions.forEach(item => {
            //find a place for insertion
            const p = computeInsertionPosition(item);

            output.insert(p, item);
        });
    }
}
