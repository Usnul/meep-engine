import { BaseProcess } from "../../core/process/BaseProcess.js";
import { assert } from "../../core/assert.js";


class EditorProcess extends BaseProcess {

    constructor() {
        super();

        /**
         *
         * @type {string}
         */
        this.name = "unnamed";
        /**
         *
         * @type {Editor|null}
         */
        this.editor = null;
    }

    /**
     *
     * @param {Editor} editor
     */
    initialize(editor) {
        assert.defined(editor,'editor');

        this.editor = editor;

        super.initialize();
    }
}

export { EditorProcess };
