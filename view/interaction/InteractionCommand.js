import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import List from "../../core/collection/List.js";
import { assert } from "../../core/assert.js";
import DataType from "../../core/parser/simple/DataType.js";

export class InteractionCommand {
    /**
     *
     * @param {string} id
     * @param {ObservedBoolean|ReactiveExpression} [enabled]
     * @param {string[]} [features]
     * @param {function} action
     */
    constructor({ id, enabled = new ObservedBoolean(true), features = [], action }) {
        assert.typeOf(id, 'string', 'id');
        assert.typeOf(action, 'function', 'action');

        assert.defined(enabled, 'enabled');
        assert.notEqual(enabled, null, 'enabled is null');
        assert.ok(enabled.isObservedBoolean || (enabled.isReactiveExpression && enabled.dataType === DataType.Boolean), `enabled is not an ObservedBoolean`);

        assert.isArray(features, 'features');

        /**
         *
         * @type {string}
         */
        this.id = id;

        /**
         *
         * @type {ObservedBoolean|ReactiveExpression}
         */
        this.enabled = enabled;

        /**
         *
         * @type {List<String>}
         */
        this.features = new List(features);

        /**
         *
         * @type {Function}
         */
        this.action = action;
    }

    /**
     *
     * @param {string} feature
     * @param {boolean} value
     */
    setFeature(feature, value) {
        if (value && !this.features.contains(feature)) {
            this.features.add(feature);
        } else if (!value && this.features.contains(feature)) {
            this.features.removeOneOf(feature);
        }
    }
}
