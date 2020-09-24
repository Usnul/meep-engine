import { System } from "../System.js";
import { TooltipComponent } from "./TooltipComponent.js";
import Vector3 from "../../../core/geom/Vector3.js";
import { MeshSystem } from "../../graphics/ecs/mesh/MeshSystem.js";
import { modelHitTest } from "../../../../model/game/util/ScreenGridPicker.js";
import { SurfacePoint3 } from "../../../core/geom/3d/SurfacePoint3.js";
import { VisualTip } from "../../../view/tooltip/VisualTip.js";
import Rectangle from "../../../core/geom/Rectangle.js";

const ray_source = new Vector3();
const ray_direction = new Vector3();

const hit = new SurfacePoint3();

export class TooltipComponentSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @param {TooltipManager} tooltips
     * @param {PointerDevice} pointer
     * @param {Localization} localization
     */
    constructor({ graphics, tooltips, pointer, localization }) {
        super();

        this.dependencies = [TooltipComponent];

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphics = graphics;

        /**
         *
         * @type {TooltipManager}
         */
        this.tooltips = tooltips;

        /**
         *
         * @type {PointerDevice}
         */
        this.pointer = pointer;

        /**
         *
         * @type {Localization}
         */
        this.localization = localization;

        /**
         *
         * @type {number}
         */
        this.time_since_position_update = 0;

        /**
         * Delay before tooltip appears, in seconds
         * @type {number}
         */
        this.display_delay = 0.2;

        /**
         * Screen-space rectangle, used by the tooltip system as the anchor to point to
         * @type {Rectangle}
         */
        this.target = new Rectangle();

        /**
         *
         * @type {VisualTip}
         */
        this.tip = null;


        /**
         *
         * @type {number}
         * @private
         */
        this.__current_tip_entity = -1;
    }


    __clearTip() {
        if (this.tip !== null) {
            this.tooltips.remove(this.tip);

            this.tip = null;
        }

        this.__current_tip_entity = -1;
    }

    __handlePointerPositionChange() {
        this.time_since_position_update = 0;

        if (this.tip !== null) {
            const tip_target = this.__computeTooltipTarget();

            if (tip_target !== this.__current_tip_entity) {
                this.__clearTip();
            } else {
                this.__updateTipTargetBounds();
            }
        }
    }

    __updateTipTargetBounds() {

        const pointer_position = this.pointer.position;

        this.target.set(pointer_position.x - 10, pointer_position.y - 10, 20, 20);
    }

    /**
     *
     * @return {boolean}
     * @private
     */
    __isOnRenderCanvas() {
        return this.graphics.domElement === this.pointer.getTargetElement();
    }

    __computeTooltipTarget() {

        //check what's under pointer
        if (!this.__isOnRenderCanvas()) {
            //only do work when tapping on game field
            return -1;
        }

        const ecd = this.entityManager.dataset;

        if (ecd === null) {
            return -1;
        }

        const pointer_position = this.pointer.position;


        this.graphics.viewportProjectionRay(pointer_position.x, pointer_position.y, ray_source, ray_direction);

        // test against meshes
        const meshSystem = this.entityManager.getSystem(MeshSystem);

        const entities = [];

        meshSystem.traverseVisible((mesh, entity) => {

            if (ecd.getComponent(entity, TooltipComponent) !== undefined) {

                entities.push(entity);

            }

        });

        const hit_entity = modelHitTest(hit, entities, ecd, this.graphics, pointer_position.x, pointer_position.y);


        return hit_entity;
    }

    startup(entityManager, readyCallback, errorCallback) {

        this.pointer.position.onChanged.add(this.__handlePointerPositionChange, this);

        super.startup(entityManager, readyCallback, errorCallback);
    }

    shutdown(entityManager, readyCallback, errorCallback) {

        this.pointer.position.onChanged.remove(this.__handlePointerPositionChange, this);

        super.shutdown(entityManager, readyCallback, errorCallback);
    }

    update(timeDelta) {
        this.time_since_position_update += timeDelta;

        if (this.time_since_position_update < this.display_delay) {
            return;
        }

        const ecd = this.entityManager.dataset;

        if (ecd === null) {
            return;
        }

        if (this.tip !== null) {
            // already presenting a tip
            return;
        }


        const hit_entity = this.__computeTooltipTarget();

        if (hit_entity === -1) {

            return;

        }

        const pointer_position = this.pointer.position;

        this.target.set(pointer_position.x - 10, pointer_position.y - 10, 20, 20);

        const key = ecd.getComponent(hit_entity, TooltipComponent).key;

        const localization = this.localization;

        const localized_string = localization.getString(key);


        const tip = new VisualTip(this.target, () => {

            const view = this.tooltips.getGML().compile(localized_string);

            return view;

        });


        this.tip = tip;
        this.tooltips.add(tip);

        this.__current_tip_entity = hit_entity;
    }
}
