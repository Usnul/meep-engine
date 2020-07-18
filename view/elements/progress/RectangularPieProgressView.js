import View from "../../View.js";
import SVG from "../../SVG.js";
import { line2_line2_intersection } from "../../../core/geom/LineSegment2.js";
import Vector1 from "../../../core/geom/Vector1.js";

export class RectangularPieProgressView extends View {

    /**
     *
     * @param {Vector1|ObservedInteger} value
     * @param {Vector1|ObservedInteger} max
     */
    constructor(value, max = Vector1.one) {
        super();

        this.el = SVG.createElement('svg');

        this.addClass('ui-cooldown-overlay-view');

        const elPath = SVG.createElement('path');

        elPath.setAttribute('fill', 'red');

        this.el.appendChild(elPath);

        this.__path = elPath;

        this.model = value;
        this.max = max;

        this.bindSignal(this.size.onChanged, this.draw, this);
        this.bindSignal(value.onChanged, this.draw, this);

        this.on.linked.add(this.draw, this);

    }

    draw() {


        const v0 = this.model.getValue();
        const v1 = this.max.getValue();

        let fraction;


        if (v1 === 0) {
            fraction = 1;
        } else {
            fraction = v0 / v1;
        }

        const size = this.size;

        const size_x = size.x;
        const size_y = size.y;


        this.el.setAttribute('width', size_x);
        this.el.setAttribute('height', size_y);

        const center_x = size_x / 2;
        const center_y = size_y / 2;

        const radius = size_x + size_y + 1;

        const angle = (1 - fraction) * Math.PI * 2 + Math.PI / 2;

        let path;

        const p = [];

        const line_x = Math.cos(angle) * radius + center_x;
        const line_y = -Math.sin(angle) * radius + center_y;


        if (fraction < .125) {

            line2_line2_intersection(p, 0, 0, size_x, 0, center_x, center_y, line_x, line_y);

            path = `M ${center_x} 0 L ${center_x} ${center_y} L ${p[0]} ${p[1]} L ${size_x} 0 L ${size_x} ${size_y} L 0 ${size_y} L 0 0 Z`;

        } else if (fraction < 0.375) {

            line2_line2_intersection(p, size_x, 0, size_x, size_y, center_x, center_y, line_x, line_y);

            path = `M ${center_x} 0 L ${center_x} ${center_y} L ${p[0]} ${p[1]} L ${size_x} ${size_y} L 0 ${size_y} L 0 0 Z`;

        } else if (fraction < 0.625) {

            line2_line2_intersection(p, size_x, size_y, 0, size_y, center_x, center_y, line_x, line_y);

            path = `M ${center_x} 0 L ${center_x} ${center_y} L ${p[0]} ${p[1]} L 0 ${size_y} L 0 0 Z`;

        } else if (fraction < 0.875) {

            line2_line2_intersection(p, 0, size_y, 0, 0, center_x, center_y, line_x, line_y);

            path = `M ${center_x} 0 L ${center_x} ${center_y} L ${p[0]} ${p[1]} L 0 0 Z`;

        } else {

            line2_line2_intersection(p, 0, 0, size_x, 0, center_x, center_y, line_x, line_y);

            path = `M ${center_x} 0 L ${center_x} ${center_y} L ${p[0]} ${p[1]} Z`;

        }

        this.__path.setAttribute(
            'd',
            path
        );

    }
}
