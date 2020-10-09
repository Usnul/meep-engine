import { SpeakLineAction } from "./SpeakLineAction.js";

const type_map = {
    [SpeakLineAction.prototype.type]({ line_id }) {
        const r = new SpeakLineAction();

        r.line_id = line_id;

        return r;
    }
};

/**
 *
 * @param j
 * @returns {AbstractAction}
 */
export function deserializeActionFromJSON(j) {
    const type = j.type;

    const parser = type_map[type];

    if (parser === undefined) {
        throw new Error(`Unsupported type '${type}'`);
    }

    return parser(j);
}
