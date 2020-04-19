/**
 * Created by Alex on 15/03/2016.
 */
import View from "../../View.js";
import dom from "../../DOM.js";

import UUID from "../../../core/UUID.js";
import Vector2 from "../../../core/geom/Vector2.js";

class TileView extends View {
    /**
     *
     * @param {Rectangle} model
     * @param {Vector2} [spacing]
     * @param {Vector2} [size]
     */
    constructor({ model, spacing = Vector2.zero, size = new Vector2(50, 50) }) {
        super();

        this.model = model;
        this.uuid = UUID.generate();

        this.__cellSize = size;
        this.__spacing = spacing;

        this.el = dom("div").addClass("ui-tile-grid-element-view").el;

        this.updateSize();

        //listen to position changes
        this.bindSignal(model.position.onChanged, this.updatePosition, this);
        this.on.linked.add(() => {
            this.updateSize();
            this.updatePosition();
        });
    }

    updatePosition() {

        this.position.copy(this.calculatePosition());
    }

    updateSize() {

        this.size.copy(this.calculateSize());
    }

    calculatePosition() {
        const spacing = this.__spacing;
        const cellSize = this.__cellSize;

        const discretePosition = this.model.position;
        return TileView.calculatePosition(cellSize, spacing, discretePosition);
    }

    calculateSize() {
        const spacing = this.__spacing;
        const cellSize = this.__cellSize;

        const discreteSize = this.model.size;

        return TileView.calculateSize(cellSize, spacing, discreteSize);
    }

    render() {
        const size = this.model.size.clone().multiply(this.__cellSize);
        this.size.copy(size);
    }

    static calculatePosition(cellSize, spacing, discretePosition) {
        return cellSize.clone().add(spacing).multiply(discretePosition);
    }

    static calculateSize(cellSize, spacing, discreteSize) {
        const result = cellSize.clone().multiply(discreteSize);

        const gaps = discreteSize.clone().addScalar(-1).clampLow(0, 0);
        result.add(gaps.multiply(spacing));
        return result;
    }
}


export default TileView;
