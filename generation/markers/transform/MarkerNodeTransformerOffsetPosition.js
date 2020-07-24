import { MarkerNodeTransformer } from "./MarkerNodeTransformer.js";
import Vector2 from "../../../core/geom/Vector2.js";
import Vector3 from "../../../core/geom/Vector3.js";
import Quaternion from "../../../core/geom/Quaternion.js";

const swing = new Quaternion();
const twist = new Quaternion();
const v3 = new Vector3();

export class MarkerNodeTransformerOffsetPosition extends MarkerNodeTransformer {
    constructor() {
        super();

        this.offset = new Vector2();
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {MarkerNodeTransformerOffsetPosition}
     */
    static from(x, y) {
        const r = new MarkerNodeTransformerOffsetPosition();

        r.offset.set(x, y);

        return r;
    }

    transform(node, grid) {
        const r = node.clone();

        r.transform.rotation.toEulerAnglesYXZ(v3);

        //rotate offset
        const rotation = -v3.z;

        const sin = Math.sin(rotation);
        const cos = Math.cos(rotation);

        const local_x = this.offset.x;
        const local_y = this.offset.y;

        const rotated_local_x = local_x * cos - local_y * sin
        const rotated_local_y = local_x * sin + local_y * cos;

        r.position._add(rotated_local_x, rotated_local_y);

        return r;
    }
}
