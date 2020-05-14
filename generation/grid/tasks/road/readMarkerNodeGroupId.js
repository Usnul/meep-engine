import { assert } from "../../../../core/assert.js";

/**
 * @param {MarkerNode} node
 * @returns {number}
 */
export function readMarkerNodeGroupId(node) {
    const groupId = node.properties.groupId;

    assert.isNumber(groupId, 'groupId');

    return groupId;
}
