import Rectangle from "../../core/geom/Rectangle.js";
import { VisualTip } from "./VisualTip.js";
import Signal from "../../core/events/signal/Signal.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import { DomSizeObserver } from "../util/DomSizeObserver.js";
import { SignalBinding } from "../../core/events/signal/SignalBinding.js";
import { MouseEvents } from "../../engine/input/devices/events/MouseEvents.js";

export class DomTooltipObserver {
    /**
     *
     * @param {View} view
     * @param {function} factory
     */
    constructor(view, factory) {
        /**
         *
         * @type {View}
         */
        this.view = view;

        /**
         *
         * @type {Function}
         */
        this.factory = factory;

        const tipTargetRectangle = new Rectangle();

        this.tipTargetRectangle = tipTargetRectangle;

        /**
         *
         * @type {VisualTip}
         */
        this.tip = new VisualTip(tipTargetRectangle, factory);

        this.on = {
            entered: new Signal(),
            exited: new Signal()
        };

        let isEntered = this.isEntered = new ObservedBoolean(false);

        const self = this;


        const sizeObserver = new DomSizeObserver();
        this.sizeObserver = sizeObserver;


        this.__copyDimensionsFromBoundingRect = () => {
            const d = sizeObserver.dimensions;

            tipTargetRectangle.size.copy(d.size);
            tipTargetRectangle.position.copy(d.position);
        }


        this.bindings = [
            new SignalBinding(view.position.onChanged, this.__copyDimensions, this),
            new SignalBinding(view.size.onChanged, this.__copyDimensions, this),
            new SignalBinding(sizeObserver.dimensions.position.onChanged, this.__copyDimensionsFromBoundingRect, this),
            new SignalBinding(sizeObserver.dimensions.size.onChanged, this.__copyDimensionsFromBoundingRect, this)
        ];


        this.handleMouseEnter = () => {
            isEntered.set(true);

            self.on.entered.dispatch();

            sizeObserver.attach(view.el);
            sizeObserver.start();
        }

        this.handleMouseLeave = () => {
            isEntered.set(false);

            sizeObserver.stop();

            self.on.exited.dispatch();

        }
    }

    __dimensionsAreZero() {
        const r = this.tipTargetRectangle;

        return r.position.isZero() && r.size.isZero();
    }

    __dimensionsAreFinite() {
        const r = this.tipTargetRectangle;

        const p = r.position;
        const s = r.size;

        return Number.isFinite(p.x)
            && Number.isFinite(p.y)
            && Number.isFinite(s.x)
            && Number.isFinite(s.y)
            ;
    }


    __copyDimensions() {
        const view = this.view;

        const position = view.position;
        const scale = view.scale;
        const size = view.size;

        const r = this.tipTargetRectangle;

        r.position.set(position.x, position.y);
        r.size.set(size.x * scale.x, size.y * scale.y);

        if (this.__dimensionsAreZero() || this.__dimensionsAreFinite()) {

            requestAnimationFrame(this.__copyDimensionsFromBoundingRect);

        }
    }

    __handleViewLinked() {
        const view = this.view;

        const el = view.el;

        //ensure that the element can capture pointer events
        el.style.pointerEvents = "auto";

        el.addEventListener(MouseEvents.Enter, this.handleMouseEnter);
        el.addEventListener(MouseEvents.Leave, this.handleMouseLeave);

        this.bindings.forEach(b => b.link());

        this.__copyDimensions();
    }


    __handleViewUnlinked() {
        const view = this.view;

        const el = view.el;

        el.removeEventListener(MouseEvents.Enter, this.handleMouseEnter);
        el.removeEventListener(MouseEvents.Leave, this.handleMouseLeave);

        this.bindings.forEach(b => b.unlink());

        if (this.isEntered.getValue()) {
            //remove tip
            this.handleMouseLeave();
        }
    };

    link() {
        const view = this.view;

        if (view.isLinked) {
            this.__handleViewLinked();
        }

        view.on.linked.add(this.__handleViewLinked, this);
        view.on.unlinked.add(this.__handleViewUnlinked, this);

    }

    unlink() {
        const view = this.view;

        if (view.isLinked) {
            this.__handleViewUnlinked();
        }

        view.on.linked.remove(this.__handleViewLinked, this);
        view.on.unlinked.remove(this.__handleViewUnlinked, this);
    }
}
