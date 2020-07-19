import View from "../../../View.js";
import Vector1 from "../../../../core/geom/Vector1.js";
import { clamp } from "../../../../core/math/MathUtils.js";
import { CanvasView } from "../../CanvasView.js";
import EmptyView from "../../EmptyView.js";
import { DomSizeObserver } from "../../../util/DomSizeObserver.js";
import { RESOURCE_BAR_SEGMENTS } from "./RESOURCE_BAR_SEGMENTS.js";
import List from "../../../../core/collection/list/List.js";
import ListView from "../../../common/ListView.js";

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


        /**
         *
         * @type {List<NumericInterval>}
         */
        this.highlights = new List();


        this.el = document.createElement('div');

        this.addClass('ui-segmented-resource-bar-view');

        this.addClasses(classList);


        // build structure
        this.__v__fill = new EmptyView({ classList: ['fill'] });
        this.addChild(this.__v__fill);

        this.__v__ghost = new EmptyView({ classList: ['ghost'] });
        this.addChild(this.__v__ghost);


        this.__v_segments = new CanvasView();
        this.__v_segments.addClass('notch-overlay');

        this.__v__fill.addChild(this.__v_segments);


        /**
         *
         * @type {ListView}
         */
        this.highlightViews = new ListView(this.highlights, {
            classList: ['highlights'],
            elementFactory: (interval) => {
                const v = new EmptyView({ classList: ['highlight'] });

                const valueCurrent = this.__value_current;
                const valueMax = this.__value_max;

                const update = () => {
                    const v0 = interval.min / valueMax;
                    const span = (interval.max - interval.min) / valueMax;

                    const style = v.el.style;

                    style.left = `${v0 * 100}%`;
                    style.width = `${span * 100}%`;

                };

                v.bindSignal(interval.onChanged, update);
                v.bindSignal(valueCurrent.onChanged, update);
                v.bindSignal(valueMax.onChanged, update);

                v.on.linked.add(update);

                return v;
            }
        });

        this.addChild(this.highlightViews);

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

        const max_segment_index = RESOURCE_BAR_SEGMENTS.length - 1;
        for (let i = max_segment_index; i >= 0; i--) {
            const segmentDefinition = RESOURCE_BAR_SEGMENTS[i];

            if (segmentDefinition.value <= maxValue && (i >= max_segment_index || RESOURCE_BAR_SEGMENTS[i + 1].value > maxValue)) {
                //we found major segment
                major_segment_index = i;
            }

        }

        const major_spec = RESOURCE_BAR_SEGMENTS[major_segment_index];
        const minor_spec = RESOURCE_BAR_SEGMENTS[major_segment_index - 1];


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

        const width = `${f * 100}%`;

        this.__v__fill.el.style.width = width
        this.__v__ghost.el.style.width = width;
    }
}
