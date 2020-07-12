import Vector1 from "../../../core/geom/Vector1.js";
import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";

export class FogOfWarRevealer {
    constructor() {
        this.radius = new Vector1(1);
    }

    toJSON() {
        return {
            radius: this.radius.toJSON()
        };
    }

    fromJSON({ radius }) {
        this.radius.fromJSON(radius);
    }

    static fromJSON(j) {
        const r = new FogOfWarRevealer();

        r.fromJSON(j);

        return r;
    }
}

FogOfWarRevealer.typeName = 'FogOfWarRevealer';


export class FogOfWarRevealerSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = FogOfWarRevealer;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FogOfWarRevealer} value
     */
    serialize(buffer, value) {
        value.radius.toBinaryBuffer(buffer);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {FogOfWarRevealer} value
     */
    deserialize(buffer, value) {
        value.radius.fromBinaryBuffer(buffer);
    }
}
