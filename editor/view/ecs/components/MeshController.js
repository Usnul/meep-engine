/**
 * Created by Alex on 16/01/2017.
 */
import GuiControl from '../../../../view/controller/controls/GuiControl.js';

import MeshPreview from '../../../../view/elements/MeshPreview.js';

import { clear } from "../../../../view/controller/dat/DatGuiUtils.js";
import DatGuiController from "./DatGuiController.js";
import Mesh from "../../../../engine/graphics/ecs/mesh/Mesh.js";
import EmptyView from "../../../../view/elements/EmptyView.js";

class MeshController extends GuiControl {
    /**
     *
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(assetManager) {
        super();

        this.addClass("ui-mesh-controller");

        this.assetManager = assetManager;

        this.vPreview = null;

        const self = this;

        this.vDat = new DatGuiController();

        const gui = this.vDat.gui;

        this.vPreviewContainer = new EmptyView();

        this.addChild(this.vPreviewContainer);

        this.addChild(this.vDat);

        function modelSet(meshNew, meshOld) {
            if (self.vPreview !== null) {
                self.vPreview.size.set(200, 200);
                self.removeChild(self.vPreview);
                self.vPreview = null;
            }

            clear(gui);

            if (meshNew !== null) {
                self.createPreview();

                const proxy = {
                    url: typeof meshNew.url === "string" ? meshNew.url : ""
                };

                gui.add(proxy, 'url').onFinishChange(function (v) {
                    meshNew.url = v;

                    self.createPreview();
                    /**
                     * @type {EntityManager}
                     */
                    const entityManager = self.entityManager;

                    /**
                     *
                     * @type {MeshSystem}
                     */
                    const meshSystem = entityManager.getOwnerSystemByComponentClass(Mesh);

                    /**
                     *
                     * @type {Mesh}
                     */
                    const meshComponent = self.model.getValue();

                    meshComponent.mesh = null;

                    meshSystem.process(self.entity, meshComponent);
                });
                gui.add(meshNew, 'castShadow');
                gui.add(meshNew, 'receiveShadow');
                gui.add(meshNew, 'center');
                gui.add(meshNew, 'opacity').min(0).max(1).step(0.0001);
            }
        }

        this.model.onChanged.add(modelSet);

    }

    destroyPreview() {
        if (this.vPreview !== null) {
            this.vPreviewContainer.removeChild(this.vPreview);
            this.vPreview = null;
        }
    }

    createPreview() {
        this.destroyPreview();
        const mesh = this.model.get();
        if (mesh !== null) {

            let meshPreview = null;

            try {
                meshPreview = new MeshPreview({
                    url: mesh.url,
                    assetManager: this.assetManager
                });
            } catch (e) {
                console.error(e);
            }

            this.vPreview = meshPreview;

            if (this.vPreview !== null) {
                this.vPreview.size.set(200, 200);
                this.vPreviewContainer.addChild(this.vPreview);
            }
        }
    }
}


export default MeshController;
