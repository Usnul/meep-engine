import ObservedValue from "../../../../core/model/ObservedValue.js";
import View from "../../../../view/View.js";
import { CanvasView } from "../../../../view/elements/CanvasView.js";
import DatGuiController from "./DatGuiController.js";
import convertSampler2D2Canvas from "../../../../engine/graphics/texture/sampler/Sampler2D2Canvas.js";
import { Sampler2D } from "../../../../engine/graphics/texture/sampler/Sampler2D.js";
import { scaleSampler2D } from "../../../../engine/graphics/texture/sampler/scaleSampler2D.js";
import Vector2 from "../../../../core/geom/Vector2.js";

/**
 *
 * @param {GridObstacle} grid
 * @param {HTMLCanvasElement} canvas
 */
function buildPreview(grid, canvas) {
    const source = new Sampler2D(grid.data, 1, grid.size.x, grid.size.y);

    const target = Sampler2D.uint8(1, canvas.width, canvas.height);

    scaleSampler2D(source, target);

    convertSampler2D2Canvas(target, 255, 0, canvas);
}

export class GridObstacleController extends View {
    constructor() {
        super();

        this.el = document.createElement('div');

        this.model = new ObservedValue(null);

        const self = this;

        /**
         *
         * @param {GridObstacle} model
         */
        function setModel(model) {
            self.removeAllChildren();

            const vPreview = new CanvasView();

            vPreview.size.set(200, 200);

            buildPreview(model, vPreview.el);

            self.addChild(vPreview);

            const controller = new DatGuiController();

            self.addChild(controller);

            const proxy = {
                size: new Vector2(model.size.x, model.size.y)
            };

            controller.add(proxy, 'size');
            controller.addAction(() => {
                buildPreview(model, vPreview.el);
            }, 'update preview');

            proxy.size.onChanged.add((x, y) => {
                model.resize(x, y);

                buildPreview(model, vPreview.el);
            });
        }

        this.model.onChanged.add(setModel);
    }
}
