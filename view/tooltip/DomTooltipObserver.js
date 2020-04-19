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

        function handleMouseEnter() {
            isEntered.set(true);

            self.on.entered.dispatch();

            sizeObserver.attach(view.el);
            sizeObserver.start();
        }

        function handleMouseLeave() {
            isEntered.set(false);

            sizeObserver.stop();

            self.on.exited.dispatch();

        }


        function dimensionsAreZero() {
            return tipTargetRectangle.position.isZero() && tipTargetRectangle.size.isZero();
        }

        function dimensionsAreFinite() {
            const p = tipTargetRectangle.position;
            const s = tipTargetRectangle.size;

            return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(s.x) && Number.isFinite(s.y);
        }


        const sizeObserver = new DomSizeObserver();


        function copyDimensionsFromBoundingRect() {
            const d = sizeObserver.dimensions;

            tipTargetRectangle.size.copy(d.size);
            tipTargetRectangle.position.copy(d.position);
        }

        function copyDimensions() {
            const position = view.position;
            const scale = view.scale;
            const size = view.size;

            tipTargetRectangle.position.set(position.x, position.y);
            tipTargetRectangle.size.set(size.x * scale.x, size.y * scale.y);

            if (dimensionsAreZero() && dimensionsAreFinite()) {
                requestAnimationFrame(copyDimensionsFromBoundingRect);
            }
        }

        const bindings = [
            new SignalBinding(view.position.onChanged, copyDimensions),
            new SignalBinding(view.size.onChanged, copyDimensions),
            new SignalBinding(sizeObserver.dimensions.position.onChanged, copyDimensionsFromBoundingRect),
            new SignalBinding(sizeObserver.dimensions.size.onChanged, copyDimensionsFromBoundingRect)
        ];

        this.handleViewLinked = function () {
            const el = view.el;

            //ensure that the element can capture pointer events
            el.style.pointerEvents = "auto";

            el.addEventListener(MouseEvents.Enter, handleMouseEnter);
            el.addEventListener(MouseEvents.Leave, handleMouseLeave);

            bindings.forEach(b => b.link());

            copyDimensions();
        };

        this.handleViewUnlinked = function () {
            const el = view.el;

            el.removeEventListener(MouseEvents.Enter, handleMouseEnter);
            el.removeEventListener(MouseEvents.Leave, handleMouseLeave);

            bindings.forEach(b => b.unlink());

            if (isEntered.getValue()) {
                //remove tip
                handleMouseLeave();
            }
        };

    }

    link() {
        const view = this.view;

        if (view.isLinked) {
            this.handleViewLinked();
        }

        view.on.linked.add(this.handleViewLinked);
        view.on.unlinked.add(this.handleViewUnlinked);

    }

    unlink() {
        const view = this.view;

        if (view.isLinked) {
            this.handleViewUnlinked();
        }

        view.on.linked.remove(this.handleViewLinked);
        view.on.unlinked.remove(this.handleViewUnlinked);
    }
}
