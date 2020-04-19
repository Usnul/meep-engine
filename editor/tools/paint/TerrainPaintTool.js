import Tool from "../engine/Tool.js";
import { Color } from "../../../core/color/Color.js";
import { obtainTerrain } from "../../../../model/game/scenes/SceneUtils.js";
import { Sampler2D } from "../../../engine/graphics/texture/sampler/Sampler2D.js";
import Vector2 from "../../../core/geom/Vector2.js";
import { pick } from "../../../../model/game/util/ScreenGridPicker.js";
import convertSampler2D2Canvas from "../../../engine/graphics/texture/sampler/Sampler2D2Canvas.js";
import ObservedString from "../../../core/model/ObservedString.js";
import { GameAssetType } from "../../../engine/asset/GameAssetType.js";
import Vector1 from "../../../core/geom/Vector1.js";
import { max2 } from "../../../core/math/MathUtils.js";

export class TerrainPaintTool extends Tool {
    constructor() {
        super();

        this.name = 'paint-terrain';

        const marker = Sampler2D.uint8(4, 1, 1);

        marker.data.fill(255);

        this.settings.markerColor = new Color(0, 1, 0.8);
        this.settings.markerOpacity = new Vector1(0.5);

        this.settings.marker = marker;
        this.settings.brushSize = 5;
        this.settings.brushStrength = 1;
        this.settings.brushURL = new ObservedString("data/textures/particle/UETools/x64/Circle_04.png");

        this.__brushPosition = new Vector2();

        this.__brushImage = document.createElement('canvas');
    }

    /**
     *
     * @param {number} timeDelta
     */
    paint(timeDelta) {

    }

    /**
     *
     * @param {number} timeDelta
     */
    update(timeDelta) {

        this.updateBrushPosition();
        this.updateOverlay();

        if (this.isRunning()) {

            this.paint(timeDelta);

        }

    }

    updateBrushImage() {
        /**
         *
         * @type {Sampler2D}
         */
        const marker = this.settings.marker;

        const temp = new Sampler2D(new Uint8ClampedArray(marker.data), marker.itemSize, marker.width, marker.height);

        const markerColor = this.settings.markerColor;
        const markerAlpha = this.settings.markerOpacity.getValue();

        const brushData = temp.data;

        //apply tint
        for (let y = 0; y < temp.height; y++) {
            const lineAddress = y * temp.itemSize * temp.width;

            for (let x = 0; x < temp.width; x++) {

                const address = lineAddress + x * temp.itemSize;

                brushData[address] = brushData[address] * markerColor.r;
                brushData[address + 1] = brushData[address + 1] * markerColor.g;
                brushData[address + 2] = brushData[address + 2] * markerColor.b;
                brushData[address + 3] = brushData[address + 3] * markerAlpha;
            }
        }

        const brushImage = this.__brushImage;

        convertSampler2D2Canvas(temp, 1, 0, brushImage);

    }

    updateBrushPosition() {

        const p = new Vector2(0, 0);
        const engine = this.engine;

        engine.gameView.positionGlobalToLocal(engine.devices.pointer.position, p);

        pick(p.x, p.y, engine.graphics, this.terrain, (gridPosition) => {

            this.__brushPosition.set(gridPosition.x, gridPosition.y);

        });
    }

    updateOverlay() {

        const terrain = this.terrain;

        const overlay = terrain.overlay;

        overlay.clear();

        const dx = overlay.size.x / terrain.size.x;
        const dy = overlay.size.y / terrain.size.y;

        const overlayPositionX = this.__brushPosition.x * dx;
        const overlayPositionY = this.__brushPosition.y * dy;

        const brushSize = this.settings.brushSize;

        const brushRadius = brushSize / 2;

        const brushSizeX = brushRadius * dx;
        const brushSizeY = brushRadius * dy;

        overlay.paintImage(this.__brushImage, overlayPositionX - brushSizeX, overlayPositionY - brushSizeY, brushSize * dx, brushSize * dy);
    }

    /**
     *
     * @param {Vector3} delta
     * @private
     */
    __handleMouseWheel(delta) {

        const settings = this.settings;

        const brushSize = settings.brushSize;

        settings.brushSize = max2(1, brushSize + delta.y);

        // this.updateBrushImage();
        this.updateOverlay();

    }

    initialize() {
        super.initialize();

        const engine = this.engine;
        const editor = this.editor;

        this.terrain = obtainTerrain(engine.entityManager.dataset, (t, entity) => {
            this.terrainEntity = entity;
        });

        const overlay = this.terrain.overlay;

        overlay.push();

        overlay.size.set(this.terrain.size.x * 16, this.terrain.size.y * 16);
        overlay.borderWidth.set(0);
        overlay.tileImage.set("data/textures/utility/white_pixel.png");

        engine.assetManager.promise('data/textures/particle/UETools/x64/Circle_04.png', GameAssetType.Image)
            .then(asset => {
                const image = asset.create();

                this.settings.marker = new Sampler2D(image.data, 4, image.width, image.height);

                this.updateBrushImage();
            });

        this.updateBrushImage();

        engine.devices.pointer.on.wheel.add(this.__handleMouseWheel, this);
    }

    shutdown() {
        super.shutdown();


        this.terrain.overlay.pop();


        engine.devices.pointer.on.wheel.remove(this.__handleMouseWheel, this);
    }

}
