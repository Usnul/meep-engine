import View from "../../view/View.js";
import { pick } from "../../../model/game/util/ScreenGridPicker.js";
import { obtainTerrain } from "../../../model/game/scenes/SceneUtils.js";
import domify from "../../view/DOM.js";
import { PointerDevice } from "../../engine/input/devices/PointerDevice.js";

class GridPickCoordinateView extends View {
    /**
     *
     * @param {Editor} editor
     * @constructor
     */
    constructor(editor) {
        super();

        this.$el = domify('div');

        this.el = this.$el.el;

        this.addClass('ui-grid-pick-coordinate-view');

        this.pointer = new PointerDevice(null);

        this.editor = editor;

    }

    pick(x, y) {
        const $el = this.$el;
        const engine = this.editor.engine;

        const vp = engine.gameView.position;

        const em = engine.entityManager;

        const ecd = em.dataset;

        if (ecd === null) {
            return;
        }

        const terrain = obtainTerrain(ecd);

        if (terrain === null) {
            //no terrain
            return;
        }

        pick(x - vp.x, y - vp.y, engine.graphics, terrain, function (v2, v3, normal) {
            v2.floor();
            $el.text(`x: ${v2.x}, y: ${v2.y}`);
        });
    }

    /**
     *
     * @return {PointerDevice}
     */
    getPointer() {
        return this.editor.engine.devices.pointer;
    }

    link() {
        super.link();

        const viewport = this.editor.engine.graphics.viewport;

        this.pointer.domElement = viewport.el;

        this.pointer.start();

        const position = this.getPointer().position;
        this.pick(position.x, position.y);

        position.onChanged.add(this.pick, this);
    }

    unlink() {
        super.unlink();

        this.pointer.stop();

        this.getPointer().position.onChanged.remove(this.pick, this);
    }
}


export default GridPickCoordinateView;
