import { DomElementProcessor } from "../DomElementProcessor.js";

export class DomElementProcessorTilt3D extends DomElementProcessor {
    constructor() {
        super();

        /**
         *
         * @type {number}
         */
        this.angle = 5;

        /**
         *
         * @type {number}
         */
        this.depth = 0;

        /**
         *
         * @type {Engine}
         */
        this.engine = null;
    }

    /**
     *
     * @param {number} [angle]
     * @param depth
     * @return {DomElementProcessorTilt3D}
     */
    static from({
                    angle = 20,
                    depth = 0
                }) {

        const r = new DomElementProcessorTilt3D();

        r.angle = angle;
        r.depth = depth;


        return r;
    }

    initialize(manager) {
        this.engine = manager.getEngine();
    }

    startup() {
    }

    shutdown() {
    }

    handleFrame() {

        const engine = this.engine;

        const el = this.el;

        const p = engine.devices.pointer.position;

        const pointer_x = p.x;
        const pointer_y = p.y;

        const viewport_size = engine.gameView.size;

        /**
         *
         * @type {ClientRect}
         */
        const rect = el.getBoundingClientRect();

        const center_x = rect.left + rect.width * 0.5;
        const center_y = rect.top + rect.height * 0.5;


        const viewport_center_x = viewport_size.x * 0.5;
        const viewport_center_y = viewport_size.y * 0.5;

        const delta_x = pointer_x - center_x;
        const delta_y = pointer_y - center_y;


        const tilt_x = (delta_y / viewport_center_y);
        const tilt_y = -(delta_x / viewport_center_x);

        const radius = Math.sqrt(tilt_x * tilt_x + tilt_y * tilt_y);

        const angle = radius * this.angle;


        const style = el.style;

        style.transformOrigin = '50% 50%';
        style.transform = `rotate3d(${tilt_x},${tilt_y},0,${angle}deg) translateZ(${this.depth}px)`;
    }
}
