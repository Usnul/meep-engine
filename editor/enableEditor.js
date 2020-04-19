import Editor from "./Editor.js";
import { noop } from "../core/function/Functions.js";

/**
 *
 * @param {Engine} engine
 * @param {function(Editor):*} [initialization]
 */
export function enableEditor(engine, initialization = noop) {
    let editor = null;

    let enabled = false;

    function attachEditor() {
        console.log('Enabling editor');
        if (editor === null) {
            editor = new Editor();
            editor.initialize();

            initialization(editor);
        }
        editor.attach(engine);
        enabled = true;
    }

    function detachEditor() {
        console.log('Disabling editor');
        if (editor !== null) {
            editor.detach();
        }
        enabled = false;
    }

    function toggleEditor() {
        if (!enabled) {
            attachEditor();
        } else {
            detachEditor();
        }

        return editor;
    }

    //bind key for toggling editor
    engine.inputEngine.mapKey(144, {
        on: function () {
            toggleEditor();
        },
        off: function () {

        }
    });

    console.warn('Editor mode enabled, use NumLock key to toggle editor mode');
}
