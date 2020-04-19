export class BVHVisitor {
    constructor() {

    }

    initialize() {

    }

    finalize() {

    }

    /**
     *
     * @param {LeafNode} node
     */
    visitLeaf(node) {

    }

    /**
     *
     * @param {BinaryNode} node
     * @returns {boolean} true if traversal should go deeper, false to exclude descendants from traversal
     */
    visitBinary(node) {
        return true;
    }
}
