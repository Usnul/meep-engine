import { equalAttributeV3 } from "./equalAttributeV3.js";
import { copyAttributeV3 } from "./copyAttributeV3.js";

/**
 *
 * @param {Ribbon} ribbon
 */
export function rotateRibbon(ribbon) {
    ribbon.rotate();

    const newHead = ribbon.head();
    const neck = newHead.previous;

    const geometry = ribbon.geometry;

    const attributes = geometry.attributes;

    const next = attributes.next;
    const prev = attributes.last;
    const position = attributes.position;


    //set head segment
    if (equalAttributeV3(position, neck.getA(), position, neck.getC())) {
        //neck had 0 length, clone "prev" from it
        copyAttributeV3(prev, newHead.getA(), prev, newHead.getC());
        copyAttributeV3(prev, newHead.getB(), prev, newHead.getD());
    } else {
        copyAttributeV3(position, newHead.getA(), prev, newHead.getC());
        copyAttributeV3(position, newHead.getB(), prev, newHead.getD());

    }


    next.needsUpdate = true;
    prev.needsUpdate = true;
}
