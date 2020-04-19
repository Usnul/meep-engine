const stack = [];
let stackPointer = 0;

/**
 *
 * @param {BinaryNode} node
 * @param {BVHVisitor} visitor
 */
export function traverseBinaryNodeUsingVisitor(node, visitor) {
    let n;

    const stackOffset = stackPointer;

    stack[stackPointer++] = node;

    while (stackPointer-- > stackOffset) {

        n = stack[stackPointer];

        if (n.isBinaryNode) {
            const traverseDeeper = visitor.visitBinary(n);

            if (traverseDeeper !== false) {

                if (n.right !== null) {
                    stack[stackPointer++] = n.right;
                }

                if (n.left !== null) {
                    stack[stackPointer++] = n.left;
                }

            }
        } else {
            visitor.visitLeaf(n);
        }

    }

    //drop the stack frame
    stackPointer = stackOffset;
}
