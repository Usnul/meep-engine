export class Voice {
    constructor() {

        /**
         *
         * @type {number}
         */
        this.flags = 0;
    }

    /**
     *
     * @param {number|VoiceFlags} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|VoiceFlags} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|VoiceFlags} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|VoiceFlags} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }
}

/**
 *
 * @type {boolean}
 */
Voice.serializable = false;

Voice.typeName = 'Voice';
