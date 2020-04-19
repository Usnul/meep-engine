/**
 * Created by Alex on 09/10/2015.
 */

import List from '../../../../core/collection/List.js';
import { assert } from "../../../../core/assert.js";
import Signal from "../../../../core/events/signal/Signal.js";
import { InputBinding } from "../InputBinding.js";


/**
 *
 * @param {Array} bindings
 * @constructor
 */
function InputController(bindings = []) {
    assert.ok(Array.isArray(bindings), 'Expected bindings to be an array, instead got something else');

    this.mapping = new List();

    const inputControllerBindings = bindings.map(b => new InputBinding(b));

    this.mapping.addAll(inputControllerBindings);

    this.on = {
        unlinked: new Signal()
    };
}

InputController.typeName = "InputController";
InputController.serializable = false;

export default InputController;
