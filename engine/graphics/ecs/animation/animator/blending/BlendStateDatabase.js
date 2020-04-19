import { BlendStateMatrix } from "./BlendStateMatrix.js";

export class BlendStateDatabase {
    constructor() {
        /**
         *
         * @type {AnimationClipDefinition[]}
         */
        this.clips = [];

        this.matrices = [];

        /**
         *
         * @type {number}
         */
        this.clipCount = 0;


        /**
         * @type {number}
         */
        this.stateCount = 0;
    }

    /**
     *
     * @param {AnimationClipDefinition[]} clips
     */
    initialize(clips) {

        this.clips = clips;
        this.clipCount = clips.length;

    }

    /**
     *
     * @param {AnimationClip[]} clips
     * @returns {number}
     */
    add(clips) {

        const m = this.clipCount;

        const blendStateMatrix = new BlendStateMatrix(m);

        const n = clips.length;

        main: for (let i = 0; i < m; i++) {
            const c0 = this.clips[i];

            for (let j = 0; j < n; j++) {
                const c1 = clips[j];

                if (c0 === c1.def) {
                    blendStateMatrix.weights[i] = c1.weight;
                    blendStateMatrix.timeScales[i] = c1.timeScale;

                    continue main;
                }
            }
            //clip not found, add default
            blendStateMatrix.weights[i] = 0;
            blendStateMatrix.timeScales[i] = 1;
        }

        this.matrices.push(blendStateMatrix);

        const r = this.stateCount;

        this.stateCount++;

        return r;
    }
}
