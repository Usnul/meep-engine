import { PrefixTreeNode } from "./PrefixTreeNode.js";

export class PrefixTreeLeaf extends PrefixTreeNode {
    constructor() {
        super();

        /**
         * Values associated with the word
         * @type {[]}
         */
        this.values = [];

        /**
         * Actual word
         * @type {string}
         */
        this.word = "";
    }
}

/**
 * @readonly
 * @type {boolean}
 */
PrefixTreeLeaf.prototype.isPrefixTreeLeaf = true;
