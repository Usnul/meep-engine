export class SegmentDefinition {
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
