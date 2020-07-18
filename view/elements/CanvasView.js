import View from "../View.js";


export class CanvasView extends View {
    constructor() {
        super();

        const canvas = document.createElement('canvas');
        this.el = canvas;

        this.context2d = canvas.getContext('2d');

        this.size.onChanged.add(this.__handleSizeChange, this);
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @private
     */
    __handleSizeChange(x, y) {
        this.el.width = x;
        this.el.height = y;
    }

    clear() {
        this.context2d.clearRect(0, 0, this.size.x, this.size.y);
    }
}
