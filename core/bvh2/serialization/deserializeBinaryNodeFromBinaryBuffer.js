import { deserializeAABB3, deserializeAABB3Encoded_v0 } from "../AABB3.js";
import { LeafNode } from "../LeafNode.js";
import { BinaryNode } from "../BinaryNode.js";

/**
 *
 * @param {BinaryNode} root
 * @param {BinaryBuffer} buffer
 * @param {function(buffer:BinaryBuffer):*} leafValueDeserializer
 */
export function deserializeBinaryNodeFromBinaryBuffer(root, buffer, leafValueDeserializer) {
    //read bounds
    deserializeAABB3(buffer, root);

    /**
     *
     * @param {BinaryNode} parent
     * @returns {BinaryNode}
     */
    function readBinaryNode(parent) {

        const node = new BinaryNode();

        node.parentNode = parent;

        //read bounds
        deserializeAABB3Encoded_v0(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);

        //read marker
        const marker = buffer.readUint8();

        if ((marker & 3) === 3) {
            node.left = readBinaryNode(node);
        } else if ((marker & 2) === 2) {
            node.left = readLeafNode(node);
        } else {
            node.left = null;
        }

        if ((marker & 12) === 12) {
            node.right = readBinaryNode(node);
        } else if ((marker & 8) === 8) {
            node.right = readLeafNode(node);
        } else {
            node.right = null;
        }

        node.updateLeafNodeCount();

        return node;
    }

    /**
     *
     * @param {BinaryNode} parent
     * @returns {LeafNode}
     */
    function readLeafNode(parent) {
        const node = new LeafNode();

        node.parentNode = parent;

        //read bounds
        deserializeAABB3Encoded_v0(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);

        node.object = leafValueDeserializer(buffer);

        return node;
    }

    //read marker
    const marker = buffer.readUint8();

    if ((marker & 3) === 3) {
        root.left = readBinaryNode(root);
    } else if ((marker & 2) === 2) {
        root.left = readLeafNode(root);
    } else {
        root.left = null;
    }

    if ((marker & 12) === 12) {
        root.right = readBinaryNode(root);
    } else if ((marker & 8) === 8) {
        root.right = readLeafNode(root);
    } else {
        root.right = null;
    }
}
