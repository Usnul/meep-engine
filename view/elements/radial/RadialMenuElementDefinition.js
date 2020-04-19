import { noop } from "../../../core/function/Functions.js";
import { assert } from "../../../core/assert.js";

export class RadialMenuElementDefinition {
    constructor() {
        /**
         *
         * @type {number}
         */
        this.outerRadius = 150;
        /**
         *
         * @type {number}
         */
        this.innerRadius = 100;
        /**
         *
         * @type {number}
         */
        this.padding = 0;
        /**
         * Normalized share of the entire circle, 1 is full circle, 0.5 is half and so on
         * @type {number}
         */
        this.share = 1;
        /**
         *
         * @type {Function}
         */
        this.action = noop;
        /**
         * CSS color for the fill
         * @type {string|number}
         */
        this.fill = "none";
        /**
         * Normalized  clock-wise offset within the circle
         * @type {number}
         */
        this.offset = 0;

        /**
         *
         * @type {View|null}
         */
        this.iconView = null;
        /**
         *
         * @type {number}
         */
        this.iconSize = 20;
        /**
         *
         * @type {boolean}
         */
        this.autoSizeIcon = true;
        /**
         * Text label content
         * @type {string}
         */
        this.name = "";
        /**
         *
         * @type {number}
         */
        this.nameRadiusOffset = 10;

        /**
         * CSS color for name label
         * @type {string|number}
         */
        this.nameFill = "white";

        /**
         *
         * @type {Function|null}
         */
        this.onSelected = null;

        /**
         *
         * @type {Function|null}
         */
        this.onDeSelected = null;
    }

    /**
     *
     * @return {boolean}
     */
    get isRadialMenuElementDefinition() {
        return true;
    }

    /**
     *
     * @param {number} [share=1] Normalized share of the entire circle, 1 is full circle, 0.5 is half and so on
     * @param {function} [action]
     * @param {String|number} [fill] CSS color for the fill
     * @param {number} [offset=0] Normalized offset within the circle
     * @param {number} [padding]
     * @param {number} [innerRadius]
     * @param {number} [outerRadius]
     * @param {View} [iconView]
     * @param {number} [iconSize]
     * @param {boolean} [autoSizeIcon]
     * @param {String} [name]
     * @param {number} [nameRadiusOffset]
     * @param {String|number} [nameFill] CSS color for name label
     */
    from({
             share = 1,
             action = null,
             fill = "none",
             offset = 0,
             padding = 0,
             innerRadius = 100,
             outerRadius = 150,
             iconView,
             iconSize = 20,
             autoSizeIcon = true,
             name = "",
             nameRadiusOffset = 10,
             nameFill = "white"
         }) {

        assert.notEqual(iconView, undefined, "Icon View must be defined");
        assert.notEqual(iconView, null, "Icon View must not be null");

        assert.typeOf(share, 'number', 'share');
        assert.typeOf(offset, 'number', 'offset');
        assert.typeOf(padding, 'number', 'padding');
        assert.typeOf(innerRadius, 'number', 'innerRadius');
        assert.typeOf(outerRadius, 'number', 'outerRadius');
        assert.typeOf(iconSize, 'number', 'iconSize');
        assert.typeOf(autoSizeIcon, 'boolean', 'autoSizeIcon');

        this.share = share;
        this.action = action;
        this.fill = fill;
        this.offset = offset;
        this.padding = padding;
        this.innerRadius = innerRadius;
        this.outerRadius = outerRadius;
        this.iconView = iconView;
        this.iconSize = iconSize;
        this.autoSizeIcon = autoSizeIcon;
        this.name = name;
        this.nameRadiusOffset = nameRadiusOffset;
        this.nameFill = nameFill;
    }


    /**
     *
     * @param {number} [share=1] Normalized share of the entire circle, 1 is full circle, 0.5 is half and so on
     * @param {function} [action]
     * @param {String|number} [fill] CSS color for the fill
     * @param {number} [offset=0] Normalized offset within the circle
     * @param {number} [padding]
     * @param {number} [innerRadius]
     * @param {number} [outerRadius]
     * @param {View} [iconView]
     * @param {number} [iconSize]
     * @param {boolean} [autoSizeIcon]
     * @param {String} [name]
     * @param {number} [nameRadiusOffset]
     * @param {String|number} [nameFill] CSS color for name label
     */
    static from({
                    share,
                    action,
                    fill,
                    offset,
                    padding,
                    innerRadius,
                    outerRadius,
                    iconView,
                    iconSize,
                    autoSizeIcon,
                    name,
                    nameRadiusOffset,
                    nameFill
                }) {
        const r = new RadialMenuElementDefinition();

        r.from({
            share,
            action,
            fill,
            offset,
            padding,
            innerRadius,
            outerRadius,
            iconView,
            iconSize,
            autoSizeIcon,
            name,
            nameRadiusOffset,
            nameFill
        });

        return r;
    }
}
