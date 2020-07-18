import View from "../../View.js";
import Vector1 from "../../../core/geom/Vector1.js";
import { clamp } from "../../../core/math/MathUtils.js";
import { CanvasView } from "../CanvasView.js";
import { assert } from "../../../core/assert.js";
import EmptyView from "../EmptyView.js";
import { DomSizeObserver } from "../../util/DomSizeObserver.js";

const DEFAULT_SPEC = {
    minor: 200,
    major: 1000
};

export class SegmentedResourceBarView extends View {
    /**
     *
     * @param {Vector1|ObservedInteger} value
     * @param {Vector1|ObservedInteger} [max=1]
     * @param {string[]} [classList]
     * @param {{minor:number, major:number}} [spec]
     */
    constructor({
                    value,
                    max = Vector1.one,
                    classList = [],
                    spec = DEFAULT_SPEC
                }) {
        super();

        assert.lessThan(spec.minor, spec.major, 'spec.minor must be less than spec.major');
        assert.equal(spec.major % spec.minor, 0, 'spec.major must be a multiple of spec.minor');

        /**
         *
         * @type {{minor: number, major: number}}
         */
        this.spec = spec;

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

        const majorSegmentValue = this.spec.major;
        const minorSegmentValue = this.spec.minor;

        const majorMultiplier = majorSegmentValue / minorSegmentValue;

        /**
         *
         * @type {number}
         */
        const minorSegmentCount = maxValue / minorSegmentValue;

        const minorSegmentWidth = size.x / minorSegmentCount;

        const displayMinor = minorSegmentWidth >= 2;

        for (let i = 1; i < minorSegmentCount; i++) {

            const x = i * minorSegmentWidth;

            if (i % majorMultiplier === 0) {
                // major notch

                ctx.strokeStyle = "rgba(0,0,0,0.7)";
                ctx.lineWidth = 2;

                ctx.beginPath();

                ctx.moveTo(x, 0);
                ctx.lineTo(x, size.y);

                ctx.stroke();

            } else if (displayMinor) {
                // minor notch

                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.lineWidth = 1;

                ctx.beginPath();

                ctx.moveTo(x, 0);
                ctx.lineTo(x, size.y);

                ctx.stroke();

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
