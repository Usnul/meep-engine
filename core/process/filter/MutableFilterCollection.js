import { MutableFilter } from "./MutableFilter.js";
import List from "../../collection/list/List.js";
import { CollectionParticipationKind } from "./CollectionParticipationKind.js";

/**
 * @template T
 */
export class MutableFilterCollection extends MutableFilter {

    /**
     *
     * @param {CollectionParticipationKind} type
     */
    constructor(type) {
        super();

        this.type = type;

        /**
         *
         * @type {List<MutableFilter<T>>}
         */
        this.fitlers = new List();

        this.fitlers.on.added.add(this.__handleFilterAdded, this);
        this.fitlers.on.removed.add(this.__handleFilterRemoved, this);
    }

    /**
     *
     * @param {MutableFilter} filter
     * @private
     */
    __handleFilterAdded(filter) {
        this.onChanged.send0();

        filter.onChanged.add(this.onChanged.send0, this.onChanged);
    }

    /**
     *
     * @param {MutableFilter} filter
     * @private
     */
    __handleFilterRemoved(filter) {
        this.onChanged.send0();

        filter.onChanged.remove(this.onChanged.send0, this.onChanged);
    }

    apply(v) {
        const filters = this.fitlers;
        const n = filters.length;

        if (this.type === CollectionParticipationKind.All) {

            for (let i = 0; i < n; i++) {
                const filter = filters.get(i);

                if (!filter.apply(v)) {
                    return false;
                }
            }

            return true;

        } else if (this.type === CollectionParticipationKind.Any) {

            for (let i = 0; i < n; i++) {
                const filter = filters.get(i);

                if (filter.apply(v)) {
                    return true;
                }
            }

            return false;
        }

        return true;
    }
}
