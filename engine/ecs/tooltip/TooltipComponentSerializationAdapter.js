import { BinaryClassSerializationAdapter } from "../storage/binary/BinaryClassSerializationAdapter.js";
import { TooltipComponent } from "./TooltipComponent.js";

export class TooltipComponentSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = TooltipComponent;
        this.version = 0;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {TooltipComponent} value
     */
    serialize(buffer, value) {
        buffer.writeUTF8String(value.key);
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {TooltipComponent} value
     */
    deserialize(buffer, value) {
        value.key = buffer.readUTF8String();
    }
}
