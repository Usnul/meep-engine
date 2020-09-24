import { System } from "../../System.js";
import { GuiElementParallax } from "./GuiElementParallax.js";
import GUIElement from "../GUIElement.js";

export class GuiElementParallaxSystem extends System {

    /**
     *
     * @param {View} viewport
     * @param {PointerDevice} pointer
     */
    constructor({ viewport, pointer }) {
        super();

        this.dependencies = [GuiElementParallax, GUIElement];

        /**
         *
         * @type {View|null}
         */
        this.viewport = viewport;

        /**
         *
         * @type {PointerDevice|null}
         */
        this.pointer = pointer;
    }

    /**
     *
     * @param {GuiElementParallax} parallax
     * @param {GUIElement} element
     * @param {number} entity
     */
    updateEntity(parallax, element, entity) {

        const p = this.pointer.position;

        const pointer_x = p.x;
        const pointer_y = p.y;

        const viewport_side = this.viewport.size;

        const view = element.view;

        /**
         *
         * @type {ClientRect}
         */
        const rect = view.el.getBoundingClientRect();

        const center_x = rect.left + rect.width * 0.5;
        const center_y = rect.top + rect.height * 0.5;


        const viewport_center_x = viewport_side.x * 0.5;
        const viewport_center_y = viewport_side.y * 0.5;

        const delta_x = pointer_x - viewport_center_x;
        const delta_y = pointer_y - viewport_center_y;


        const tilt_x = (delta_y / viewport_center_y);
        const tilt_y = -(delta_x / viewport_center_x);

        const radius = Math.sqrt(tilt_x * tilt_x + tilt_y * tilt_y);

        const angle = radius * parallax.angle;


        const style = view.el.style;

        style.transformOrigin = '50% 50%';
        style.transform = `rotate3d(${tilt_x},${tilt_y},0,${angle}deg)`;
        style.transformStyle = 'preserve-3d';
    }

    update(timeDelta) {

        const em = this.entityManager;

        const ecd = em.dataset;

        if (ecd === null) {
            return;
        }

        ecd.traverseEntities([GuiElementParallax, GUIElement], this.updateEntity, this);
    }
}
