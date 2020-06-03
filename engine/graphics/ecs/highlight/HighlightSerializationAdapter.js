import { BinaryClassSerializationAdapter } from "../../../ecs/storage/binary/BinaryClassSerializationAdapter.js";
import Highlight from "./Highlight.js";
import { HighlightDefinition } from "./HighlightDefinition.js";
import { COMPONENT_SERIALIZATION_TRANSIENT_FIELD } from "../../../ecs/storage/COMPONENT_SERIALIZATION_TRANSIENT_FIELD.js";

export class HighlightSerializationAdapter extends BinaryClassSerializationAdapter {
    constructor() {
        super();

        this.klass = Highlight;
        this.version = 1;
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Highlight} value
     */
    serialize(buffer, value) {
        const n = value.elements.length;

        /**
         *
         * @type {HighlightDefinition[]}
         */
        const serializable = [];

        //collect serializable highlights
        for (let i = 0; i < n; i++) {
            const highlightElement = value.elements.get(i);

            if (highlightElement[COMPONENT_SERIALIZATION_TRANSIENT_FIELD]) {
                continue;
            }

            serializable.push(highlightElement);

        }

        const l = serializable.length;

        buffer.writeUintVar(l);

        for (let i = 0; i < l; i++) {
            const highlightElement = serializable[i];

            const color = highlightElement.color;

            buffer.writeFloat32(color.r);
            buffer.writeFloat32(color.g);
            buffer.writeFloat32(color.b);

            buffer.writeFloat32(highlightElement.opacity);
        }
    }

    /**
     *
     * @param {BinaryBuffer} buffer
     * @param {Highlight} value
     */
    deserialize(buffer, value) {
        const elementCount = buffer.readUintVar();


        value.elements.reset();

        for (let i = 0; i < elementCount; i++) {

            const r = buffer.readFloat32();
            const g = buffer.readFloat32();
            const b = buffer.readFloat32();

            const opacity = buffer.readFloat32();

            const element = new HighlightDefinition();


            element.color.setRGB(r, g, b);
            element.opacity = opacity;

            value.elements.add(element);
        }
    }
}
