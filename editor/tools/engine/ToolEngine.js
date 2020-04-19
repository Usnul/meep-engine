/**
 * Created by Alex on 14/01/2017.
 */


import List from '../../../core/collection/List.js';
import ObservedValue from '../../../core/model/ObservedValue.js';
import { decodeMouseEventButtons, PointerDevice } from '../../../engine/input/devices/PointerDevice.js';

import SelectionTool from '../SelectionTool.js';
import TopDownCameraControlTool from '../TopDownCameraControlTool.js';
import GridPaintTool from "../GridPaintTool.js";
import FoliagePaintTool from "../FoliagePaintTool.js";
import { TransformTool } from "../TransformTool.js";
import { ToolState } from "./ToolState.js";
import Clock from "../../../engine/Clock.js";
import { TerrainHeightPaintTool } from "../paint/TerrainHeightPaintTool.js";
import { TerrainTexturePaintTool } from "../paint/TerrainTexturePaintTool.js";

/**
 *
 * @constructor
 * @property {List.<Tool>} tools
 * @property {ObservedValue.<Tool>} active
 */
function ToolEngine() {
    this.tools = new List();
    this.active = new ObservedValue(null);
    this.engine = null;
    this.isRunning = false;
    this.shutdownCallbacks = [];
    this.pointer = null;
}

ToolEngine.prototype.activate = function (toolName) {
    const self = this;
    this.tools.visitFirstMatch(function (tool) {
        return tool.name === toolName;
    }, function (tool) {
        self.active.set(tool);
    });
};

ToolEngine.prototype.initialize = function () {

    this.active.onChanged.add((newTool, oldTool) => {
        console.log("active tool changed. Old: ", oldTool, ", New :", newTool);

        if (oldTool !== null && typeof oldTool === "object") {
            oldTool.moveToState(ToolState.Initial);
        }

        if (newTool !== null && typeof newTool === "object") {
            newTool.editor = this.editor;
            newTool.engine = this.engine;

            newTool.moveToState(ToolState.Ready);
        }
    });

    const terrainPaintToolRaise = new TerrainHeightPaintTool();
    terrainPaintToolRaise.name = "terrain-height";

    const terrainTexturePaintTool0 = new TerrainTexturePaintTool();
    terrainTexturePaintTool0.name = `terrain-texture-0`;
    terrainTexturePaintTool0.settings.splatIndex = 0;

    const terrainTexturePaintTool1 = new TerrainTexturePaintTool();
    terrainTexturePaintTool1.name = `terrain-texture-1`;
    terrainTexturePaintTool1.settings.splatIndex = 1;

    const terrainTexturePaintTool2 = new TerrainTexturePaintTool();
    terrainTexturePaintTool2.name = `terrain-texture-2`;
    terrainTexturePaintTool2.settings.splatIndex = 2;

    const terrainTexturePaintTool3 = new TerrainTexturePaintTool();
    terrainTexturePaintTool3.name = `terrain-texture-3`;
    terrainTexturePaintTool3.settings.splatIndex = 3;

    const tools = this.tools;
    tools
        .add(new SelectionTool())
        .add(new TopDownCameraControlTool())
        .add(new GridPaintTool())
        .add(new TransformTool())
        .add(terrainPaintToolRaise)
        .add(terrainTexturePaintTool0)
        .add(terrainTexturePaintTool1)
        .add(terrainTexturePaintTool2)
        .add(terrainTexturePaintTool3)
        .add(new FoliagePaintTool());
};

/**
 *
 * @param {Engine} engine
 * @param {Editor} editor
 */
ToolEngine.prototype.startup = function (engine, editor) {
    this.engine = engine;
    this.editor = editor;
    this.isRunning = true;
    const pointer = this.pointer = new PointerDevice(engine.graphics.domElement);

    const self = this;

    const clock = new Clock();

    clock.start();

    function update() {
        if (!self.isRunning) {
            return;
        }
        requestAnimationFrame(update);

        const tool = self.active.get();

        const delta = clock.getDelta();

        if (tool !== null) {
            tool.update(delta);
        }
    }

    //start update loop
    update();

    //hook up interaction controls
    function pointerDown(position, event) {
        const tool = self.active.get();
        if (tool !== null) {
            tool.modifiers.shift = event.shiftKey;

            if (typeof event.buttons === "number") {
                const decodedButtons = decodeMouseEventButtons(event.buttons);

                const isPrimaryPressed = decodedButtons[0];

                if (!isPrimaryPressed) {
                    //when working with mouse, only activate on primary mouse button
                    return;
                }

            }

            tool.moveToState(ToolState.Running);
        }
    }

    function pointerUp(position, event) {
        const tool = self.active.get();
        if (tool !== null) {

            tool.moveToState(ToolState.Ready);
        }
    }


    pointer.on.down.add(pointerDown);
    pointer.on.up.add(pointerUp);
    pointer.start();


    function cleanup() {
        pointer.on.down.remove(pointerDown);
        pointer.on.up.remove(pointerUp);
        pointer.stop();
    }

    this.shutdownCallbacks.push(cleanup);
};

ToolEngine.prototype.shutdown = function () {
    this.isRunning = false;
    const toolProxy = this.active;

    const tool = toolProxy.getValue();

    if (tool !== null) {
        toolProxy.set(null);
    }

    //execute cleanup
    this.shutdownCallbacks.forEach(function (cb) {
        cb();
    });

    this.shutdownCallbacks = [];
};


export default ToolEngine;
