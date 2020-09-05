import { copyAttributeV3 } from "./copyAttributeV3.js";
import Vector3 from "../../../../core/geom/Vector3.js";

const vPreviousPosition = new Vector3();

/**
 *
 * @param {Ribbon} ribbon
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
export function updateTipPosition(ribbon, x, y, z) {
    const geometry = ribbon.geometry;

    const attributes = geometry.attributes;
    const next = attributes.next;
    const prev = attributes.last;


    const head = ribbon.head();

    head.setVertexC(x, y, z);
    head.setVertexD(x, y, z);

    head.getVertexA(vPreviousPosition);

    //special case when new head is at the same place as the old one
    if (vPreviousPosition.x === x && vPreviousPosition.y === y && vPreviousPosition.z === z) {
        copyAttributeV3(prev, head.getA(), prev, head.getC());
        copyAttributeV3(prev, head.getB(), prev, head.getD());

        copyAttributeV3(next, head.getA(), next, head.getC());
        copyAttributeV3(next, head.getB(), next, head.getD());
    } else {
        //compute next offset from position
        let tX = x - vPreviousPosition.x + x;
        let tY = y - vPreviousPosition.y + y;
        let tZ = z - vPreviousPosition.z + z;

        //update head tip
        next.setXYZ(head.getC(), tX, tY, tZ);
        next.setXYZ(head.getD(), tX, tY, tZ);

        //update neck
        next.setXYZ(head.getA(), x, y, z);
        next.setXYZ(head.getB(), x, y, z);
    }

    next.needsUpdate = true;
    prev.needsUpdate = true;
}
