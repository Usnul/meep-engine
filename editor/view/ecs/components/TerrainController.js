import DatGuiController from "./DatGuiController.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import View from "../../../../view/View.js";
import { NativeListController } from "../../../../view/controller/controls/NativeListController.js";
import { TerrainLayer } from "../../../../engine/ecs/terrain/ecs/layers/TerrainLayer.js";
import CheckersTextureURI from "../../../../engine/graphics/texture/CheckersTextureURI.js";
import EmptyView from "../../../../view/elements/EmptyView.js";
import convertSampler2D2Canvas from "../../../../engine/graphics/texture/sampler/Sampler2D2Canvas.js";
import { CanvasView } from "../../../../view/elements/CanvasView.js";
import { scaleSampler2D } from "../../../../engine/graphics/texture/sampler/scaleSampler2D.js";
import { Sampler2D } from "../../../../engine/graphics/texture/sampler/Sampler2D.js";
import Signal from "../../../../core/events/signal/Signal.js";
import Vector2Control from "../../../../view/controller/controls/Vector2Control.js";
import GroupView from "../../../../view/elements/Group.js";
import LabelView from "../../../../view/common/LabelView.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";

class LayersController extends View {
    /**
     *
     * @param {Terrain} terrain
     * @param {TerrainLayers} layers
     * @param {AssetManager} assetManager
     */
    constructor({ terrain, layers, assetManager }) {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-terrain-layers-controller-view');

        const updateBus = new Signal();

        this.bindSignal(layers.layers.on.added, () => {
            terrain.splat.addWeightLayer();
        });

        this.bindSignal(layers.layers.on.removed, (layer, index) => {
            terrain.splat.removeWeightLayer(index);
        });

        this.addChild(
            new NativeListController({
                model: layers.layers,
                elementFactory() {
                    const layer = new TerrainLayer();

                    layer.textureDiffuseURL = CheckersTextureURI;
                    layer.size.set(1, 1);

                    layer.loadTextureData(assetManager)
                        .then(() => {

                            layers.buildTexture();
                            layers.writeAllLayersDataIntoTexture();

                            terrain.updateMaterial();

                            updateBus.send1(layer);
                        });

                    return layer;
                },
                /**
                 *
                 * @param {TerrainLayer} layer
                 * @return {View}
                 */
                elementViewFactory(layer) {
                    const v = new EmptyView();

                    v.bindSignal(updateBus, (l) => {
                        if (l === layer) {
                            update();
                        }
                    });

                    v.addClass('ui-terrain-layer-controller-view');


                    const vCanvas = new CanvasView();
                    vCanvas.size.set(64, 64);

                    const t = Sampler2D.uint8(layer.diffuse.itemSize, 64, 64);


                    function update() {

                        scaleSampler2D(layer.diffuse, t);

                        convertSampler2D2Canvas(t, 1, 0, vCanvas.el);
                    }

                    update();


                    v.addChild(vCanvas);

                    const vURL = new EmptyView({ classList: ['url'], tag: 'input' });
                    const elValue = vURL.el;

                    elValue.setAttribute('type', 'text');
                    elValue.value = layer.textureDiffuseURL;


                    elValue.addEventListener('input', () => {
                        const v = elValue.value;

                        layer.textureDiffuseURL = v;

                        layer.loadTextureData(assetManager).then(() => {
                            update();

                            const index = layers.layers.indexOf(layer);

                            layers.writeLayerDataIntoTexture(index);
                        });
                    });

                    const vSize = new Vector2Control();
                    vSize.model.set(layer.size);

                    v.bindSignal(layer.size.onChanged, terrain.updateMaterial, terrain);

                    const groupView = new GroupView();
                    groupView.add(new LabelView('size'));
                    groupView.add(vSize);

                    v.addChild(groupView);

                    v.addChild(vURL);

                    return v;
                }
            })
        );
    }
}

export class TerrainController extends View {
    /**
     *
     * @param {AssetManager} assetManager
     */
    constructor(assetManager) {
        super();

        this.el = document.createElement('div');

        this.model = new ObservedValue(null);

        const self = this;

        /**
         *
         * @param {Terrain} model
         */
        function setModel(model) {

            self.removeAllChildren();
            const controller = new DatGuiController();
            self.addChild(controller);

            if (model !== null) {
                controller.addAction(() => {
                    model.tiles.rebuild();
                }, 'Rebuild');

                controller.addAction(() => {
                    model.splat.optimize();
                }, 'Optimize Textures');

                controller.add(model, 'size', { step: 1 });
                controller.add(model, 'resolution').step(1);
                controller.add(model, 'gridScale').step(1).name('Gird Size');

                const proxy = {
                    heightResolution: new Vector2(model.samplerHeight.width, model.samplerHeight.height)
                };

                proxy.heightResolution.onChanged.add((x, y) => {
                    model.samplerHeight.resize(x, y);
                });

                controller.add(proxy, 'heightResolution', { step: 1 });

                controller.add(model.preview, 'url').name('preview url');
                controller.add(model.preview, 'offset');
                controller.add(model.preview, 'scale');

                self.addChild(new LayersController({ terrain: model, layers: model.layers, assetManager }));
            }
        }

        this.model.onChanged.add(setModel);
    }
}
