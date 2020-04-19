/**
 * Created by Alex on 26/07/2014.
 */


import RadialMenuElement from './RadialMenuElement.js';
import SVG from '../../SVG.js';
import Vector2 from "../../../core/geom/Vector2.js";
import EmptyView from '../EmptyView.js';

import View from "../../View.js";
import List from "../../../core/collection/List.js";
import { arraySetDiff } from "../../../core/collection/Set.js";

const PI2 = Math.PI * 2;

/**
 *
 * @param {number} outerRadius
 * @param {number} innerRadius
 * @param {number} centerX
 * @param {number} centerY
 * @returns {Element} SVG path element
 */
function makeDonut(outerRadius, innerRadius, centerX, centerY) {
    const el = SVG.createElement('path');
    const dValue = [
        `M ${centerX} ${centerY - outerRadius}`,
        `A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${centerY + outerRadius}`,
        `A ${outerRadius} ${outerRadius} 0 1 0 ${centerX} ${centerY - outerRadius}`,
        'Z',
        `M ${centerX} ${centerY - innerRadius}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${centerY + innerRadius}`,
        `A ${innerRadius} ${innerRadius} 0 1 1 ${centerX} ${centerY - innerRadius}`,
        'Z',
    ].join(' ');

    el.setAttribute('d', dValue);
    return el;
}

const DEFAULT_BACKGROUND_COLOR = 'rgba(0,0,0,0.6)';

class RadialMenu extends View {
    /**
     *
     * @param {RadialMenuElementDefinition[]} items
     * @param {number} [padding=0]
     * @param {number} [outerRadius=150]
     * @param {number} [innerRadius=50]
     * @param {number} [focusWidth]
     * @param {number} [backdropInnerRadius]
     * @param {number} [backdropOuterRadius]
     * @param {string} [backgroundColor] CSSColor string
     * @param {string[]} [classList]
     * @constructor
     */
    constructor(items, {
        padding = 0,
        outerRadius = 150,
        innerRadius = 50,
        focusWidth = 20,
        backdropInnerRadius,
        backdropOuterRadius,
        backgroundColor = DEFAULT_BACKGROUND_COLOR,
        classList = []
    }) {
        super();

        /**
         *
         * @type {List<RadialMenuElement>}
         */
        this.selected = new List();

        /**
         *
         * @type {Array.<RadialMenuElement>}
         */
        this.elements = [];

        /**
         *
         * @type {number}
         */
        this.firstElementOffset = 0;

        /**
         *
         * @type {number}
         */
        this.padding = padding;

        /**
         *
         * @type {number}
         */
        this.outerRadius = outerRadius;
        /**
         *
         * @type {number}
         */
        this.innerRadius = innerRadius;

        if (backdropInnerRadius === undefined) {
            backdropInnerRadius = innerRadius;
        }

        if (backdropOuterRadius === undefined) {
            backdropOuterRadius = outerRadius + 10;
        }

        /**
         * @type {number}
         */
        this.backdropInnerRadius = backdropInnerRadius;
        /**
         * @type {number}
         */
        this.backdropOuterRadius = backdropOuterRadius;


        /**
         *
         * @type {number}
         */
        this.focusOuterRadius = this.outerRadius + focusWidth;
        /**
         *
         * @type {number}
         */
        this.focusInnerRadius = this.innerRadius;

        /**
         *
         * @type {number}
         */
        this.width = this.focusOuterRadius * 2;
        /**
         *
         * @type {number}
         */
        this.height = this.focusOuterRadius * 2;

        const el = this.el = document.createElement("div");
        el.classList.add('ui-radial-menu');
        classList.forEach(c => this.addClass(c));

        el.style.position = "absolute";
        el.style.overflow = "visible";

        this.size.set(this.width, this.height);

        const svgElDonut = SVG.createElement("svg");
        svgElDonut.classList.add('backdrop');
        svgElDonut.style.overflow = "visible";
        svgElDonut.setAttribute("width", this.width);
        svgElDonut.setAttribute("height", this.height);

        //line to give feedback
        const elLine = SVG.createElement("line");
        elLine.classList.add("pointer-line");
        elLine.style.stroke = "rgba(255,255,255,0.6)";
        elLine.style.strokeWidth = "5";
        elLine.style.strokeLinecap = "round";

        el.appendChild(svgElDonut);

        const elDonut = makeDonut(this.backdropOuterRadius, this.backdropInnerRadius, this.focusOuterRadius, this.focusOuterRadius);
        elDonut.setAttribute('fill', backgroundColor);
        svgElDonut.appendChild(elDonut);

        const vElementContainer = new EmptyView({ classList: ['elements'] });
        vElementContainer.position.set(this.focusOuterRadius, this.focusOuterRadius);
        this.addChild(vElementContainer);

        this.vElementContainer = vElementContainer;

        function moveLineEnd(x, y) {
            elLine.setAttribute("x2", vElementContainer.position.x + x);
            elLine.setAttribute("y2", vElementContainer.position.y + y);
        }

        this.linePosition = new Vector2(0, 0);
        this.linePosition.onChanged.add(moveLineEnd);

        elLine.setAttribute("x1", vElementContainer.position.x);
        elLine.setAttribute("y1", vElementContainer.position.y);

        //initialize line to 0 length in the middle
        moveLineEnd(0, 0);

        this.init(items);

        const vLineContainer = new EmptyView({ classList: ['pointer-line'] });
        const elSvgLine = SVG.createElement('svg');
        vLineContainer.el.appendChild(elSvgLine);
        elSvgLine.appendChild(elLine);
        this.addChild(vLineContainer);
    }

    render() {
        this.elements.forEach(function (el) {
            el.render();
        });
    }

    link() {
        super.link();
        this.render();
    }

    computeTotalShareValue() {
        return this.elements.reduce(function (prev, element) {
            return prev + element.share;
        }, 0);
    }

    /**
     *
     * @param {RadialMenuElementDefinition[]} items
     */
    init(items) {
        const self = this;

        const n = items.length;
        const padding = n > 1 ? this.padding : 0;

        this.elements = [];

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {RadialMenuElementDefinition}
             */
            const item = items[i];

            if (!item.isRadialMenuElementDefinition) {
                throw new Error(`Supplied element is not RadialMenuElementDefinition`);
            }

            item.outerRadius = self.outerRadius;
            item.innerRadius = self.innerRadius;
            item.padding = padding;

            const element = new RadialMenuElement(item);

            this.elements.push(element);

            this.vElementContainer.addChild(element);
        }
    }

    autoLayout() {

        const numElements = this.elements.length;

        if (numElements === 1) {
            const first = this.elements[0];

            first.share = 0.33;
        } else {

            //normalize share values
            this.normalizeElementShares();
        }

        if (numElements > 0) {
            //set first element position so that it appears at the top
            const firstElement = this.elements[0];

            firstElement.offset = -(0.25 + firstElement.share / 2);
        }

        this.updatePositions();
    }

    normalizeElementShares() {
        const shareValue = this.computeTotalShareValue();
        this.elements.forEach(function (element) {
            element.share /= shareValue;
        });
    }

    normalizeOffsetsSequentially() {
        const elements = this.elements;

        if (elements.length === 0) {
            return;
        }
        const firstElement = elements[0];

        let offset = this.firstElementOffset + firstElement.offset;

        elements.forEach(function (element) {
            const share = element.share;
            element.offset = offset;
            offset += share;
        });
    }

    updatePositions() {
        this.normalizeOffsetsSequentially();
        //render
        this.elements.forEach(function (element, index) {
            element.render();
        });
    }

    /**
     *
     * @param {RadialMenuElement} el
     * @param {boolean} flag
     */
    setElementSelection(el, flag) {
        const selected = this.selected;

        const index = selected.indexOf(el);

        if (flag && index < 0) {
            selected.add(el);

            el.outerRadius = this.focusOuterRadius;
            el.innerRadius = this.focusInnerRadius;

            const onSelected = el.description.onSelected;
            if (typeof onSelected === "function") {
                onSelected();
            }

        } else if (!flag && index >= 0) {
            selected.remove(index);

            el.outerRadius = this.outerRadius;
            el.innerRadius = this.innerRadius;

            const onDeSelected = el.description.onDeSelected;
            if (typeof onDeSelected === "function") {
                onDeSelected();
            }

        }
    }

    resetElementSelection() {
        const self = this;

        const selected = this.selected.asArray().slice();

        for (const el of selected) {
            self.setElementSelection(el, false);
        }
    }

    /**
     *
     * @param {number} angle
     */
    selectByAngle(angle) {
        const na = 1 - angle / PI2;

        //pick element that fits the angle
        const elements = this.elements;
        const elementCount = elements.length;

        const selected = [];

        for (let i = 0; i < elementCount; i++) {
            const el = elements[i];

            //normalize offset
            let no = el.offset;

            while (no < 0) {
                no += 1;
            }

            let s0 = no;
            let s1 = no + el.share;


            if ((s0 <= na && s1 > na) || (s1 > 1 && (s1 % 1) > na)) {
                selected.push(el);
            }
        }

        const diff = arraySetDiff(this.selected.asArray(), selected);

        const removals = diff.uniqueA;
        const additions = diff.uniqueB;

        removals.forEach(el => this.setElementSelection(el, false));
        additions.forEach(el => this.setElementSelection(el, true));
    }

    runSelected() {
        this.selected.forEach(function (el) {
            const action = el.action;
            if (action !== void 0) {
                action();
            }
        });
    }
}


export default RadialMenu;
