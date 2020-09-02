import Vector3 from "../../../core/geom/Vector3.js";
import { Transform } from "../../ecs/transform/Transform.js";
import EntityBuilder from "../../ecs/EntityBuilder.js";
import HeadsUpDisplay from "../../ecs/gui/hud/HeadsUpDisplay.js";
import ViewportPosition from "../../ecs/gui/ViewportPosition.js";
import GUIElement from "../../ecs/gui/GUIElement.js";
import LabelView from "../../../view/common/LabelView.js";

/**
 *
 * @param {string} text
 * @param {Vector3} [position]
 * @returns {EntityBuilder}
 */
export function createDebugLabel(text, position = Vector3.zero) {

    const v = new LabelView(text, { classList: ['__debug-plaque'] });
    v.css({
        position: 'absolute',
        whiteSpace: 'pre',
        left: 0,
        top: 0
    })

    const t = new Transform();

    t.position.copy(position);

    const eb = new EntityBuilder()
        .add(new HeadsUpDisplay())
        .add(new ViewportPosition())
        .add(GUIElement.fromView(v))
        .add(t);

    return eb;
}
