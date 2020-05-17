import { HighlightDefinition } from "./HighlightDefinition.js";
import { lerp } from "../../../../core/math/MathUtils.js";

export class HighlightRenderElement {
    constructor() {

        /**
         *
         * @type {Object3D}
         */
        this.object = null;

        /**
         * TODO some definitions may be merged, such as those with the same {@link HighlightDefinition.thickness}, this would allow for less work in the shader
         * @type {HighlightDefinition[]}
         */
        this.definitions = [];

        this.merged = new HighlightDefinition();
    }

    merge() {
        const definitions = this.definitions;
        const n = definitions.length;

        let outputR = 0;
        let outputG = 0;
        let outputB = 0;
        let outputA = 0;

        for (let i = 0; i < n; i++) {
            const definition = definitions[i];

            const color = definition.color;
            const opacity = definition.opacity;

            outputR = lerp(outputR, color.r, opacity);
            outputG = lerp(outputG, color.g, opacity);
            outputB = lerp(outputB, color.b, opacity);

            outputA = (outputA * (1 - opacity)) + opacity;
        }

        this.merged.color.setRGB(outputR, outputG, outputB);
        this.merged.opacity = outputA;
    }
}
