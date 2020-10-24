/**
 * Created by Alex on 02/05/2016.
 */
import dom from '../../DOM.js';
import SVG from '../../SVG.js';
import View from "../../View.js";
import { computeIsoscelesTriangleApexAngle } from "../../../core/math/MathUtils.js";
import { RadialText } from "./RadialText.js";

const PI2 = Math.PI * 2;

const elementPrototype = (function () {
    const svgElement = SVG.createElement("path");
    svgElement.setAttribute("fill", "rgba(255,0,0,0.5)");
    return svgElement;
})();

class RadialMenuElement extends View {
    /**
     *
     * @param {RadialMenuElementDefinition} description
     */
    constructor(description) {
        super();

        /**
         *
         * @type {RadialMenuElementDefinition}
         */
        this.description = description;

        const self = this;

        /**
         * @deprecated use description directly
         * @type {number}
         */
        this.share = description.share;
        /**
         * @deprecated use description directly
         * @type {Function}
         */
        this.action = description.action;
        /**
         * @deprecated use description directly
         * @type {String|number}
         */
        this.fill = description.fill;
        /**
         * @deprecated use description directly
         * @type {number}
         */
        this.offset = description.offset;
        /**
         * @deprecated use description directly
         * @type {number}
         */
        this.padding = description.padding;
        /**
         * @deprecated use description directly
         * @type {boolean}
         */
        this.autoSizeIcon = description.autoSizeIcon;

        /**
         * @deprecated use description directly
         * @type {String}
         */
        this.name = description.name;

        /**
         * @deprecated use description directly
         * @type {number}
         */
        this.nameRadiusOffset = description.nameRadiusOffset;

        let dRoot = dom().addClass('ui-radial-menu-element');

        this.el = dRoot.el;

        if (description.cssClass !== null) {
            this.addClass(description.cssClass);
        }

        /**
         * @deprecated use description directly
         * @type {View}
         */
        this.vIcon = description.iconView;

        const elSvg = SVG.createElement('svg');
        const elArc = SVG.createElement("g");
        const elPath = elementPrototype.cloneNode(true);

        this.elPath = elPath;
        elSvg.appendChild(elArc);
        elArc.appendChild(elPath);

        elPath.classList.add('backdrop');
        elPath.setAttribute("fill", this.fill);

        let iconSize = description.iconSize;
        let innerRadius = description.innerRadius;
        let outerRadius = description.outerRadius;

        Object.defineProperties(this, {
            iconSize: {
                set: function (val) {
                    iconSize = val;
                    self.updateIcon();
                }, get: function () {
                    return iconSize;
                }
            },
            innerRadius: {
                set: function (val) {
                    innerRadius = val;
                    self.render();
                },
                get: function () {
                    return innerRadius;
                }
            },
            outerRadius: {
                set: function (val) {
                    outerRadius = val;
                    self.render();
                },
                get: function () {
                    return outerRadius;
                }
            }
        });


        dRoot.append(elSvg);

        if (description.autoSizeIcon === false) {
            description.iconView.size.set(iconSize, iconSize);
        }

        this.radialText = new RadialText({
            share: description.share,
            offset: description.offset,
            fill: description.nameFill,
            radius: outerRadius + description.nameRadiusOffset
        });

        this.radialText.setText(description.name);

        this.addChild(this.radialText);
        this.addChild(description.iconView);
    }

    updateIcon() {

        const vIcon = this.vIcon;

        const outerRadius = this.outerRadius;
        const innerRadius = this.innerRadius;

        let iconSize;

        if (this.autoSizeIcon) {

            iconSize = (outerRadius - innerRadius) / Math.SQRT2;
            vIcon.size.set(iconSize, iconSize);

        } else {

            iconSize = Math.max(vIcon.size.x, vIcon.size.y);

        }

        const a0 = this.offset * PI2;
        const a1 = a0 + this.share * PI2;

        const aMid = (a1 + a0) / 2;

        const cm = Math.cos(aMid);
        const sm = Math.sin(aMid);

        const r = (innerRadius + outerRadius) / 2;

        const iconMidX = cm * r;
        const iconMidY = sm * r;

        const x = iconMidX - iconSize / 2;
        const y = iconMidY - iconSize / 2;


        vIcon.position.set(x, y);
    }

    render() {
        const padding = this.padding;

        const padding_2 = padding / 2;

        //compute padding angle for inner and outer arcs
        const outerRadius = this.outerRadius;
        const innerRadius = this.innerRadius;

        const outerArcPadding = computeIsoscelesTriangleApexAngle(outerRadius, padding_2);
        const innerArcPadding = computeIsoscelesTriangleApexAngle(innerRadius, padding_2);

        //compute wedge bounds of the element
        const a0 = this.offset * PI2;
        const a1 = a0 + this.share * PI2;

        //compute inner and outer arcs for rendered element
        const innerStart = a0 + innerArcPadding;
        const innerEnd = a1 - innerArcPadding;

        const outerStart = a0 + outerArcPadding;
        const outerEnd = a1 - outerArcPadding;

        //draw arc
        this.elPath.setAttribute("d", SVG.svgArc2(innerRadius, outerRadius, innerStart, innerEnd, outerStart, outerEnd));

        this.radialText.radius = outerRadius + this.nameRadiusOffset;
        this.radialText.share = this.share;
        this.radialText.offset = this.offset;
        this.radialText.render();


        //update icon position
        this.updateIcon();
    }
}


export default RadialMenuElement;
