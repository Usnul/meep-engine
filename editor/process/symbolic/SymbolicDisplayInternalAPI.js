import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";
import Signal from "../../../core/events/signal/Signal.js";
import { seededRandom } from "../../../core/math/MathUtils.js";

export class SymbolicDisplayInternalAPI {
    constructor() {
        /**
         *
         * @type {SignalBinding[]}
         */
        this.bindings = [];

        /**
         *
         * @type {Engine}
         * @private
         */
        this.__engine = null;

        this.__requestUpdate = new Signal();

        this.random = seededRandom(42);
    }

    bind(signal, action, context) {
        const binding = new SignalBinding(signal, action, context);
        this.bindings.push(binding);
        binding.link();
    }

    onFrame(method, thisArg) {
        const engine = this.__engine;
        this.bind(engine.graphics.on.visibilityConstructionEnded, method, thisArg);
    }

    unbind(signal, action, context) {
        const bindings = this.bindings;

        for (let i = 0; i < bindings.length; i++) {

            const b = bindings[i];

            if (b.signal === signal && b.handler === action && b.context === context) {
                b.unlink();

                bindings.splice(i, 1);
                return true;
            }
        }
        return false;

    }


    update() {
        this.__requestUpdate.send0();
    }

}
