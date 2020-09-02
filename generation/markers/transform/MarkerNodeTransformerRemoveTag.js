import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import { assert } from "../../../core/assert.js";

export class MarkerNodeTransformerRemoveTag extends MarkerNodeTransformer {
    constructor() {
        super();

        this.tag = "";
    }

    /**
     *
     * @param {string} tag
     * @returns {MarkerNodeTransformerRemoveTag}
     */
    static from(tag) {
        assert.typeOf(tag, 'string', 'tag');
        assert.greaterThan(tag.length, 0, 'tag length must be greater than 0');

        const r = new MarkerNodeTransformerRemoveTag();

        r.tag = tag;

        return r;
    }

    transform(node, grid) {
        const tag_index = node.tags.indexOf(this.tag);

        if (tag_index === -1) {
            return node;
        }

        const clone = node.clone();

        clone.tags.splice(tag_index, 1);

        return clone;
    }
}
