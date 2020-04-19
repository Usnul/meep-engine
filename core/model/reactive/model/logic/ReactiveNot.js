import { ReactiveUnaryExpression } from "../ReactiveUnaryExpression.js";
import DataType from "../../../../parser/simple/DataType.js";

export class ReactiveNot extends ReactiveUnaryExpression {
    /**
     *
     * @param {boolean} v
     * @returns {boolean}
     */
    transform(v) {
        return !v;
    }

    /**
     *
     * @return {ReactiveNot}
     */
    clone() {
        const r = new ReactiveNot();

        r.copy(this);

        return r;
    }
}

ReactiveNot.prototype.dataType = DataType.Boolean;

ReactiveNot.prototype.isLogicExpression = true;
ReactiveNot.prototype.isReactiveNot = true;

/**
 *
 * @param {ReactiveExpression} source
 * @returns {ReactiveNot}
 */
ReactiveNot.from = function (source) {
    const r = new ReactiveNot();

    r.connect(source);

    return r;
};
