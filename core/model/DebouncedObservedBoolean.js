/**
 *
 * @param {DebouncedObservedBoolean} d
 */
import ObservedBoolean from "./ObservedBoolean.js";

function timerHandler(d) {
    d.assumeSourceValue();
}

/**
 *
 * @enum {number}
 */
export const DebouncedObservedBooleanMode = {
    DebounceRise: 1,
    DebounceFall: 2,
    DebounceBoth: 3
};

/**
 * Helps hide fluctuating values. Resulting value will only be propagated if source holds that value for a given amount of time.
 */
export class DebouncedObservedBoolean extends ObservedBoolean {
    /**
     *
     * @param {ObservedBoolean} source
     * @param {number} time
     * @param {DebouncedObservedBooleanMode|number} mode
     */
    constructor(source, time, mode = DebouncedObservedBooleanMode.DebounceBoth) {
        super(source.getValue());

        this.__source = source;

        this.time = time;

        this.__timeout = null;

        this.mode = mode;
    }

    link() {
        this.assumeSourceValue();
        this.__source.onChanged.add(this.__handleSourceChange, this);
    }

    unlink() {
        this.__source.onChanged.remove(this.__handleSourceChange, this);
        this.__clearTimeout();
    }


    /**
     *
     * @private
     */
    __clearTimeout() {
        if (this.__timeout !== null) {
            clearTimeout(this.__timeout);
            this.__timeout = null;
        }
    }

    /**
     *
     */
    assumeSourceValue() {

        const sourceValue = this.__source.getValue();

        this.set(sourceValue);


    }

    /**
     *
     * @param {boolean} v
     */
    set(v) {
        const old = this.__value;

        if (old !== v) {
            this.__value = v;

            this.onChanged.send2(v, old);
        }

        return this;
    }

    /**
     *
     * @param {boolean} v
     * @param {boolean} old
     * @private
     */
    __handleSourceChange(v, old) {
        this.__clearTimeout();


        if ((v && (this.mode & DebouncedObservedBooleanMode.DebounceRise) !== 0)
            || (!v && (this.mode & DebouncedObservedBooleanMode.DebounceFall) !== 0)
        ) {
            this.__timeout = setTimeout(timerHandler, this.time, this);
        } else {
            //propagate immediately
            this.assumeSourceValue();
        }
    }

    getValue() {
        return this.__value;
    }

}
