import { PrefixTreeNode } from "./PrefixTreeNode.js";
import { PrefixTreeLeaf } from "./PrefixTreeLeaf.js";

export class PrefixTree extends PrefixTreeNode {
    constructor() {
        super();

        /**
         *
         * @type {string}
         */
        this.character = "";

        /**
         *
         * @type {PrefixTreeNode[]}
         */
        this.children = [];
    }

    /**
     *
     * @param {PrefixTreeNode} node
     */
    addChild(node) {
        node.depth = this.depth + 1;
        node.parent = this;

        this.children.push(node);
    }

    /**
     *
     * @param {string} character
     * @return {PrefixTree|undefined}
     */
    findChildByCharacter(character) {
        const n = this.children.length;

        for (let i = 0; i < n; i++) {
            const child = this.children[i];

            if (!child.isPrefixTree) {
                continue;
            }

            if (child.character === character) {
                return child;
            }
        }
    }

    /**
     *
     * @param {string} word
     * @returns {PrefixTreeLeaf|undefined}
     */
    findLeafByWord(word) {

        const n = this.children.length;

        for (let i = 0; i < n; i++) {
            const child = this.children[i];

            if (!child.isPrefixTreeLeaf) {
                continue;
            }

            if (child.word === word) {
                return child;
            }
        }
    }

    /**
     *
     * @param {[]} result
     */
    collectValues(result) {
        const children = this.children;
        const n = children.length;

        for (let i = 0; i < n; i++) {
            const node = children[i];

            if (node.isPrefixTree) {
                node.collectValue(result);
            } else {
                const values = node.values;
                const valueCount = values.length;

                for (let j = 0; j < valueCount; j++) {
                    const value = values[j];

                    result.push(value);
                }
            }
        }
    }

    /**
     *
     * @param {[]} result
     * @param {string} prefix
     */
    findValuesByPrefix(result, prefix) {
        const l = prefix.length;

        let n = this;

        for (let i = 0; i < l; i++) {

            const character = prefix.charAt(i);
            n = n.findChildByCharacter(character)

            if (n === undefined) {
                return;
            }
        }


    }

    /**
     *
     * @param {string} text
     * @param {RegExp} splitExpression
     * @param {boolean} stripSpecial
     * @param {boolean} stripPunctuation
     * @param {boolean} forceLowerCase
     * @param {*} value
     */
    insertText({ text, splitExpression = /\s/, stripSpecial = true, stripPunctuation = true, forceLowerCase = true, value }) {
        const strings = text.split(splitExpression);

        const words = [];

        const n = strings.length;

        let i;

        for (i = 0; i < n; i++) {
            const input = strings[i];

            let output = input;

            if (stripSpecial) {
                output = output.replace(/[\n\t\r]/g, '');
            }

            if (stripPunctuation) {
                output = output.replace(/[\,\.\!\?\-\+\[\]\(\)\=\"\']/g, '');
            }

            if (forceLowerCase) {
                output = output.toLocaleLowerCase();
            }

            if (output.length === 0) {
                continue;
            }

            if (words.indexOf(output) !== -1) {
                //skip, already recorded
                continue;
            }

            words.push(output);
        }

        const wordCount = words.length;

        for (i = 0; i < wordCount; i++) {

            const word = words[i];

            this.insertWord(word, value);
        }
    }

    /**
     *
     * @param {string} word
     * @param {*} value
     */
    insertWord(word, value) {
        const n = word.length;

        if (n <= this.depth) {
            //last letter
            let leaf = this.findLeafByWord(word);

            if (leaf === undefined) {
                leaf = new PrefixTreeLeaf();

                leaf.word = word;

                this.addChild(leaf);
            }

            leaf.values.push(value);

        } else {

            const char = word.charAt(this.depth);

            let child = this.findChildByCharacter(char);

            if (child === undefined) {
                child = new PrefixTree();
                child.character = char;

                this.addChild(child);
            }

            child.insertWord(word, value);
        }
    }
}

/**
 * @readonly
 * @type {boolean}
 */
PrefixTree.prototype.isPrefixTree = true;
