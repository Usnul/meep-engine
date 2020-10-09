import { SpeakLineActionDescription } from "./SpeakLineActionDescription.js";
import { SendRequestActionDescription } from "./SendRequestActionDescription.js";
import { assert } from "../../../../../core/assert.js";
import { ActionSequenceDescription } from "./ActionSequenceDescription.js";
import { DelayActionDescription } from "./DelayActionDescription.js";

const type_map = {
    Sequence({ elements }) {
        assert.isArray(elements);

        const children = elements.map(deserializeActionFromJSON);

        const r = new ActionSequenceDescription();

        r.elements = children;

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
    }
}

registerType(SpeakLineActionDescription);
registerType(SendRequestActionDescription);
registerType(DelayActionDescription);

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
