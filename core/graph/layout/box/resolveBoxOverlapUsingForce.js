import Vector2 from "../../../geom/Vector2.js";

/**
 *
 * @param {Vector2[]} forces
 * @param {Array.<AABB2>} boxes
 */
export function resolveBoxOverlapUsingForce(forces, boxes) {
    const numBoxes = boxes.length;

    // initialize forces
    for (let i = 0; i < numBoxes; i++) {
        const f = forces[i];

        f.set(0, 0);
    }

    let moves = 0;

    for (let i = 0; i < numBoxes - 1; i++) {
        const b0 = boxes[i];

        const r1Right = b0.x1;
        const r1Bottom = b0.y1;

        for (let j = i + 1; j < numBoxes; j++) {
            const b1 = boxes[j];

            //compute overlap
            const left = r1Right - b1.x0;
            if (left < 0) {
                //no overlap
                continue;
            }

            const right = b1.x1 - b0.x0;
            if (right < 0) {
                //no overlap
                continue;
            }

            const top = r1Bottom - b1.y0;
            if (top < 0) {
                //no overlap
                continue;
            }

            const bottom = b1.y1 - b0.y0;
            if (bottom < 0) {
                //no overlap
                continue;
            }

            //pick the smallest overlap value
            let dX = left < right ? -left : right;
            let dY = top < bottom ? -top : bottom;

            //pick smallest axis
            if (Math.abs(dX) < Math.abs(dY)) {
                dY = 0;
            } else {
                dX = 0;
            }

            //create separation vector
            const d = new Vector2(dX, dY);
            const halfD = d.multiplyScalar(0.5);

            const f1 = forces[i];
            const f2 = forces[j];

            //apply separation
            if (b0.locked === true && b1.locked === true) {
                continue;
            } else if (b0.locked === true) {
                f2.sub(d);
            } else if (b1.locked === true) {
                f1.add(d);
            } else {
                f1.add(halfD);
                f2.sub(halfD);
            }

            moves++;
        }
    }

    //apply forces
    for (let i = 0; i < numBoxes; i++) {
        const box = boxes[i];
        const force = forces[i];

        const dX = force.x;
        const dY = force.y;
        box.move(dX, dY);
    }

    return moves;
}
