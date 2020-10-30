/**
 * Created by Alex on 28/01/2015.
 */
import { System } from '../../System.js';
import ViewportPosition from './ViewportPosition.js';
import GUIElement from "../GUIElement.js";
import { assert } from "../../../../core/assert.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import { SignalBinding } from "../../../../core/events/signal/SignalBinding.js";
import { EPSILON } from "../../../../core/math/MathUtils.js";
import AABB2 from "../../../../core/geom/AABB2.js";
import { GUIElementEvent } from "../GUIElementEvent.js";

const CSS_CLASS = 'ecs-viewport-position-component';

/**
 * @this {{system:ViewportPositionSystem, vp: ViewportPosition, el: GUIElement}}
 */
function updatePosition() {
    this.system.positionComponent(this.el, this.vp);
}

const aabb2 = new AABB2();

class ViewportPositionSystem extends System {
    constructor(viewportSize) {
        super();
        this.componentClass = ViewportPosition;

        this.dependencies = [ViewportPosition, GUIElement];

        this.viewportSize = viewportSize;

        this.viewportSizeChangeReactor = new SignalBinding(viewportSize.onChanged, () => {
            const ecd = this.entityManager.dataset;

            if (ecd !== null) {
                ecd.traverseEntities([GUIElement, ViewportPosition], this.positionComponent, this);
            }
        });

        this.data = {};
    }

    startup(entityManager, readyCallback, errorCallback) {
        super.startup(entityManager, readyCallback, errorCallback);

        this.viewportSizeChangeReactor.link();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        super.shutdown(entityManager, readyCallback, errorCallback);

        this.viewportSizeChangeReactor.unlink();
    }

    /**
     * @param {GUIElement} el
     * @param {ViewportPosition} vp
     * @param {number} entity
     */
    positionComponent(el, vp, entity) {
        assert.notEqual(this, undefined, 'this is undefined');
        assert.notEqual(this, null, 'this is null');

        assert.ok(this.isViewportPositionSystem, 'this is not ViewportPositionSystem');


        if (!vp.enabled.getValue()) {
            // positioning is disabled, bail
            return;
        }

        const viewportSize = this.viewportSize;

        const view = el.view;

        const viewport_width = viewportSize.x;
        const viewport_height = viewportSize.y;

        if (viewport_width === 0 || viewport_height === 0) {
            // viewport size is 0
            return;
        }

        // convert size of the hud view into normalized (0-1) form
        let extentX = view.size.x / viewport_width;
        let extentY = view.size.y / viewport_height;

        // convert screen-space offset from pixels to normalized (0-1) form
        const nOffsetX = vp.offset.x / viewport_width;
        const nOffsetY = vp.offset.y / viewport_height;

        // determine visibility in clip space
        const nPositionX = vp.position.x + nOffsetX;
        const nPositionY = vp.position.y + nOffsetY;


        const anchorX = vp.anchor.x;
        const anchorY = vp.anchor.y;

        const x0 = nPositionX - extentX * anchorX;
        const y0 = nPositionY - extentY * anchorY;
        const x1 = nPositionX + extentX * (1 - anchorX);
        const y1 = nPositionY + extentY * (1 - anchorY);

        aabb2.set(
            x0,
            y0,
            x1,
            y1
        );

        const trackedPositionOutOfBounds = x0 > 1 || x1 < 0
            || y0 > 1 || y1 < 0;

        const visible = (vp.stickToScreenEdge || !trackedPositionOutOfBounds);

        el.visible.set(visible);

        if (visible) {

            //we can now use this vector
            setElementPosition(view, aabb2, viewportSize, vp);
        }
    }

    /**
     *
     * @param {ViewportPosition} vp
     * @param {GUIElement} el
     * @param entity
     */
    link(vp, el, entity) {
        try {
            this.positionComponent(el, vp, entity);
        } catch (e) {
            console.error(`Failed to position view (entity=${entity}):`, e);
        }


        const eventContext = {
            vp,
            el,
            system: this
        };

        this.data[entity] = eventContext;

        vp.position.onChanged.add(updatePosition, eventContext);
        vp.offset.onChanged.add(updatePosition, eventContext);
        vp.anchor.onChanged.add(updatePosition, eventContext);
        vp.enabled.onChanged.add(updatePosition, eventContext);

        this.entityManager.dataset.addEntityEventListener(entity, GUIElementEvent.Initialized, updatePosition, eventContext);

        el.view.addClass(CSS_CLASS);
    }

    /**
     *
     * @param {ViewportPosition} vp
     * @param {GUIElement} el
     * @param entity
     */
    unlink(vp, el, entity) {

        const eventContext = this.data[entity];

        if (eventContext !== undefined) {
            delete this.data[entity];

            vp.position.onChanged.remove(updatePosition, eventContext);
            vp.offset.onChanged.remove(updatePosition, eventContext);
            vp.anchor.onChanged.remove(updatePosition, eventContext);
            vp.enabled.onChanged.remove(updatePosition, eventContext);
        }

        this.entityManager.dataset.removeEntityEventListener(entity, GUIElementEvent.Initialized, updatePosition, eventContext);

        el.view.removeClass(CSS_CLASS);
    }


}

const STICKY_FLAG_CLASS_NAME = 'hud-system-sticky-flag';


const stickyBounds = new AABB2();

/**
 *
 * @param {View} view
 * @param {AABB2} bounds
 * @param {Vector2} viewportSize
 * @param {ViewportPosition} vp
 */
function setElementPosition(view, bounds, viewportSize, vp) {
    //deal with stick-to-edge behaviour
    let x, y;

    if (vp.stickToScreenEdge) {


        const clipEdgeX = vp.screenEdgeWidth / viewportSize.x;
        const clipEdgeY = vp.screenEdgeWidth / viewportSize.y;


        stickyBounds.set(clipEdgeX, clipEdgeY, 1 - clipEdgeX, 1 - clipEdgeY);

        let stickFlag = false;

        if (bounds.x0 < stickyBounds.x0) {
            x = stickyBounds.x0;

            stickFlag = true;
        } else if (bounds.x1 > stickyBounds.x1) {
            x = stickyBounds.x1 - bounds.getWidth();

            stickFlag = true;
        } else {
            x = bounds.x0;
        }

        if (bounds.y0 < stickyBounds.y0) {
            y = stickyBounds.y0;

            stickFlag = true;
        } else if (bounds.y1 > stickyBounds.y1) {
            y = stickyBounds.y1 - bounds.getHeight();

            stickFlag = true;
        } else {
            y = bounds.y0;
        }

        view.setClass(STICKY_FLAG_CLASS_NAME, stickFlag);
    } else {
        x = bounds.x0;
        y = bounds.y0;
    }


    const targetX = (x) * (viewportSize.x);
    const targetY = (y) * (viewportSize.y);

    const viewPosition = view.position;

    if (Math.abs(targetX - viewPosition.x) > EPSILON || Math.abs(targetY - viewPosition.y) > EPSILON) {
        viewPosition.set(targetX, targetY);
    }

    view.transformOrigin.copy(vp.anchor);
}

/**
 * @readonly
 * @type {boolean}
 */
ViewportPositionSystem.prototype.isViewportPositionSystem = true;

export default ViewportPositionSystem;
