import View from "../../View.js";
import Vector1 from "../../../core/geom/Vector1.js";
import { clamp } from "../../../core/math/MathUtils.js";
import { CanvasView } from "../CanvasView.js";
import EmptyView from "../EmptyView.js";
import { DomSizeObserver } from "../../util/DomSizeObserver.js";

class SegmentDefinition {
    constructor() {
        this.value = 0;
    }

    /**
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} height
     */
    draw(ctx, x, height) {

    }

    /**
     * @return {SegmentDefinition}
     * @param {number} value
     * @param {SegmentDefinition.draw} paint
     */
    static from(value, paint) {
        const r = new SegmentDefinition();

        r.value = value;
        r.draw = paint;

        return r;
    }
}

/**
 *
 * @type {SegmentDefinition[]}
 */
const SEGMENTS = [
    SegmentDefinition.from(10,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, Math.ceil(height * 0.5));

            ctx.stroke();
        }),
    SegmentDefinition.from(40,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            ctx.stroke();
        }),
    SegmentDefinition.from(200,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, 2);

            ctx.moveTo(x, height);
            ctx.lineTo(x, height - 2);

            ctx.stroke();


            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 2);
            ctx.lineTo(x, height - 2);

            ctx.stroke();
        }),
    SegmentDefinition.from(1000,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            ctx.stroke();

        }),
    SegmentDefinition.from(5000,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, 2);

            ctx.moveTo(x, height);
            ctx.lineTo(x, height - 2);

            ctx.stroke();

            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 2);
            ctx.lineTo(x, height - 2);

            ctx.stroke();
        }),
    SegmentDefinition.from(100000,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            ctx.stroke();
        })
];

export class SegmentedResourceBarView extends View {
    /**
     *
     * @param {Vector1|ObservedInteger} value
     * @param {Vector1|ObservedInteger} [max=1]
     * @param {string[]} [classList]
     */
    constructor({
                    value,
                    max = Vector1.one,
                    classList = []
                }) {
        super();

        /**
         *
         * @type {Vector1|ObservedInteger}
         * @private
         */
        this.__value_current = value;

        /**
         *
         * @type {Vector1|ObservedInteger}
         * @private
         */
        this.__value_max = max;

        this.el = document.createElement('div');

        this.addClass('ui-segmented-resource-bar-view');

        this.addClasses(classList);


        // build structure
        this.__v__fill = new EmptyView({ classList: ['fill'] });

        this.addChild(this.__v__fill);


        this.__v_segments = new CanvasView();
        this.__v_segments.addClass('notch-overlay');

        this.__v__fill.addChild(this.__v_segments);

        // subscribe to changes

        this.bindSignal(this.__value_current.onChanged, this.updateFill, this);
        this.bindSignal(this.__value_max.onChanged, this.handleMaxChange, this);

        /**
         * We need an observer in order to know when we need to resize the canvas element that holds marks
         * @type {DomSizeObserver}
         * @private
         */
        this.__sizeObserver = new DomSizeObserver();

        this.__sizeObserver.attach(this.el);

        this.__sizeObserver.dimensions.size.onChanged.add(this.__updateSize, this);
    }

    link() {

        super.link();

        this.__sizeObserver.start();
        this.update();
    }

    unlink() {
        this.__sizeObserver.stop();

        super.unlink();
    }

    update() {
        this.updateFill();
        this.updateSegments();
    }

    __updateSize() {
        this.updateSegments();
    }

    handleMaxChange() {
        this.updateSegments();
        this.updateFill();
    }

    updateSegments() {
        /**
         *
         * @type {Vector2}
         */
        const size = this.__sizeObserver.dimensions.size;

        this.__v_segments.size.copy(size);

        const vSegments = this.__v_segments;

        vSegments.clear();

        /**
         *
         * @type {CanvasRenderingContext2D}
         */
        const ctx = vSegments.context2d;

        const maxValue = this.__value_max.getValue();

        // figure out what segments to use
        let major_segment_index = 0;

        const max_segment_index = SEGMENTS.length - 1;
        for (let i = max_segment_index; i >= 0; i--) {
            const segmentDefinition = SEGMENTS[i];

            if (segmentDefinition.value <= maxValue && (i >= max_segment_index || SEGMENTS[i + 1].value > maxValue)) {
                //we found major segment
                major_segment_index = i;
            }

        }

        const major_spec = SEGMENTS[major_segment_index];
        const minor_spec = SEGMENTS[major_segment_index - 1];


        const majorSegmentValue = major_spec.value;

        if (minor_spec === undefined) {
            //no minor spec, only paint major
        } else {

            const minorSegmentValue = minor_spec.value;

            const majorMultiplier = majorSegmentValue / minorSegmentValue;

            /**
             *
             * @type {number}
             */
            const stepCount = maxValue / minorSegmentValue;

            const minorSegmentWidth = size.x / stepCount;

            const displayMinor = minorSegmentWidth >= 2;

            for (let i = 1; i < stepCount; i++) {

                const x = i * minorSegmentWidth;

                if (i % majorMultiplier === 0) {
                    // major notch

                    major_spec.draw(ctx, x, size.y);

                } else if (displayMinor) {
                    // minor notch

                    minor_spec.draw(ctx, x, size.y);

                }

            }
        }
    }

    updateFill() {
        const c = this.__value_current.getValue();
        const m = this.__value_max.getValue();

        const f = clamp(c / m, 0, 1);

        this.__v__fill.el.style.width = `${f * 100}%`
    }
}
