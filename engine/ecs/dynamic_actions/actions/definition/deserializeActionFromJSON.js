import { SpeakLineActionDescription } from "./SpeakLineActionDescription.js";
import { SendRequestActionDescription } from "./SendRequestActionDescription.js";
import { assert } from "../../../../../core/assert.js";
import { ActionSequenceDescription } from "./ActionSequenceDescription.js";
import { DelayActionDescription } from "./DelayActionDescription.js";
import { NoopActionDescription } from "./NoopActionDescription.js";
import { WeightedRandomActionDescription } from "./WeightedRandomActionDescription.js";
import { WhiteToBlackboardActionDescription } from "./WhiteToBlackboardActionDescription.js";

const type_map = {
    Sequence({ elements }) {
        assert.isArray(elements);

        const children = elements.map(deserializeActionFromJSON);

        const r = new ActionSequenceDescription();

        r.elements = children;

        return r;
    },
    Random({ elements }) {
        assert.isArray(elements);


        const r = new WeightedRandomActionDescription();

        elements.forEach(({ weight = 1, action }) => {

            const child_action = deserializeActionFromJSON(action);

            r.addElement(
                child_action,
                weight
            );

        });

        return r;
    }
};

function registerType(t) {

    const type = t.prototype.type;

    assert.typeOf(type, 'string', 'type');

    type_map[type] = (j) => {
        const action = new t;

        action.fromJSON(j);

        return action;
    };
}

registerType(SpeakLineActionDescription);
registerType(SendRequestActionDescription);
registerType(DelayActionDescription);
registerType(NoopActionDescription);
registerType(WhiteToBlackboardActionDescription);

/**
 *
 * @param j
 * @returns {AbstractActionDescription}
 */
export function deserializeActionFromJSON(j) {
    const type = j.type;

    const parser = type_map[type];

    if (parser === undefined) {
        throw new Error(`Unsupported type '${type}'`);
    }

    const action = parser(j);

    return action;
}
