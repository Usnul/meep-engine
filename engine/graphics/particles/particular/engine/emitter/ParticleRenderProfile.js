import { ParticleRendererType } from "./ParticleRendererType.js";

export class ParticleRenderProfile {
    constructor() {

        /**
         *
         * @type {number|ParticleRendererType}
         */
        this.renderer = ParticleRendererType.Billboard;

        /**
         *
         * @type {*[]}
         */
        this.settings = [];
    }
}
