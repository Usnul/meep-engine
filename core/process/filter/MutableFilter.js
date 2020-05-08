import Signal from "../../events/signal/Signal.js";

/**
 * @template T
 */
export class MutableFilter {
    /**
     * @template T
     */
    constructor() {
        this.onChanged = new Signal();
    }

    /**
     *
     * @param v
     * @return {boolean}
     */
    apply(v) {
        return true;
    }
}
