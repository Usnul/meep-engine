import { SignalBinding } from "../../../core/events/signal/SignalBinding.js";

/**
 *
 * @param {!Transform} source
 * @param {!Transform} target
 * @param {SignalBinding[]} bindings
 * @param {boolean} [syncPosition=true]
 * @param {boolean} [syncRotation=true]
 * @param {boolean} [syncScale=true]
 */
export function synchronizeTransform(source, target, bindings, syncPosition = true, syncRotation = true, syncScale = true) {
    function synchronizePosition(x, y, z) {
        target.position.set(x, y, z);
    }

    function synchronizeScale(x, y, z) {
        target.scale.set(x, y, z);
    }

    function synchronizeRotation(x, y, z, w) {
        target.rotation.set(x, y, z, w);
    }


    if (syncPosition) {
        const position = source.position;

        bindings.push(new SignalBinding(position.onChanged, synchronizePosition));

        synchronizePosition(position.x, position.y, position.z);
    }

    if (syncRotation) {
        const rotation = source.rotation;

        bindings.push(new SignalBinding(rotation.onChanged, synchronizeRotation));

        synchronizeRotation(rotation.x, rotation.y, rotation.z, rotation.w);
    }


    if (syncScale) {
        const scale = source.scale;
        bindings.push(new SignalBinding(scale.onChanged, synchronizeScale));

        synchronizePosition(scale.x, scale.y, scale.z);
    }

}
