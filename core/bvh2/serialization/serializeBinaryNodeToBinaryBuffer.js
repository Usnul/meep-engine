import { serializeAABB3, serializeAABB3Encoded_v0 } from "../AABB3.js";

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {BinaryNode} node
 * @param {BinaryNode} parent
 * @param {function(buffer:BinaryBuffer, value:*):void} leafValueSerializer
 */
function writeBinaryNode(buffer, node, parent, leafValueSerializer) {
    serializeAABB3Encoded_v0(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);

    writeBinaryNodeContents(buffer, node, leafValueSerializer);
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {BinaryNode} node
 * @param {function(buffer:BinaryBuffer, value:*):void} leafValueSerializer
 */
function writeBinaryNodeContents(buffer, node, leafValueSerializer) {

    //build header marker for the node
    let marker = 0;

    const right = node.right;

    if (right !== null) {
        if (right.isLeafNode) {
            marker |= 8;
        } else {
            marker |= 12;
        }
    }

    const left = node.left;

    if (left !== null) {
        if (left.isLeafNode) {
            marker |= 2;
        } else {
            marker |= 3;
        }
    }

    buffer.writeUint8(marker);

    if ((marker & 3) === 3) {
        writeBinaryNode(buffer, left, node, leafValueSerializer);
    } else if ((marker & 2) === 2) {
        writeLeafNode(buffer, left, node, leafValueSerializer);
    }

    if ((marker & 12) === 12) {
        writeBinaryNode(buffer, right, node, leafValueSerializer);
    } else if ((marker & 8) === 8) {
        writeLeafNode(buffer, right, node, leafValueSerializer);
    }
}

/**
 *
 * @param {BinaryBuffer} buffer
 * @param {LeafNode} node
 * @param {BinaryNode} parent
 * @param {function(buffer:BinaryBuffer, value:*):void} leafValueSerializer
 */
function writeLeafNode(buffer, node, parent, leafValueSerializer) {
    serializeAABB3Encoded_v0(buffer, node, parent.x0, parent.y0, parent.z0, parent.x1, parent.y1, parent.z1);
    leafValueSerializer(buffer, node.object);
}

/**
 * Writing is lossy, all descendants have their bounds quantized to uin16
 * @param {BinaryNode} root
 * @param {BinaryBuffer} buffer
 * @param {function(buffer:BinaryBuffer, value:*):void} leafValueSerializer
 */
export function serializeBinaryNodeToBinaryBuffer(root, buffer, leafValueSerializer) {
    //write initial size
    serializeAABB3(buffer, root);

    writeBinaryNodeContents(buffer, root, leafValueSerializer);
}
