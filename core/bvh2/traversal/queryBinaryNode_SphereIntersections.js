/**
 *
 * @type {(BinaryNode|LeafNode)[]}
 */
const stack = [];
let stackPointer = 0;


/**
 * @template T
 * @param {T[]} destination
 * @param {number} destinationOffset
 * @param {BinaryNode<T>} root
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} radius
 * @returns {number} Number of results
 */
export function queryBinaryNode_SphereIntersections_Data(destination, destinationOffset, root, x, y, z, radius) {
    let n;

    const radius2 = radius * radius;

    const stackOffset = stackPointer;

    stack[stackPointer++] = root;

    let i = 0;

    while (stackPointer-- > stackOffset) {

        n = stack[stackPointer];

        const d2 = n.distanceToPoint2(x, y, z);
        if (d2 >= radius2) {
            continue;
        }

        if (n.isBinaryNode) {

            if (n.right !== null) {
                stack[stackPointer++] = n.right;
            }

            if (n.left !== null) {
                stack[stackPointer++] = n.left;
            }

        } else {

            destination[destinationOffset + i] = n.object;

            i++;
        }

    }

    //drop the stack frame
    stackPointer = stackOffset;

    return i;
}
