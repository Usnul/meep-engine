/**
 * Created by Alex on 16/01/2017.
 */
import Tool from './engine/Tool.js';
import TopDownCameraController from "../../engine/graphics/ecs/camera/TopDownCameraController.js";
import { PointerDevice } from "../../engine/input/devices/PointerDevice.js";
import TopDownCameraControllerSystem from "../../engine/graphics/ecs/camera/TopDownCameraControllerSystem.js";

class TopDownCameraControlTool extends Tool {
    constructor() {
        super();
        this.name = "camera_control";
        this.system = null;

        this.restore = [];
    }

    initialize() {
        super.initialize();

        const engine = this.engine;
        const editor = this.editor;

        const em = engine.entityManager;
        this.system = em.getSystem(TopDownCameraControllerSystem);
        this.system.enabled.set(true);

        function getController() {
            return editor.cameraEntity.getComponent(TopDownCameraController);
        }


        const pointerDevice = new PointerDevice(window);

        pointerDevice.on.drag.add(function (position, origin, previousPosition) {
            const cameraController = getController();
            TopDownCameraController.pan(previousPosition.clone().sub(position), engine.graphics.camera, engine.graphics.domElement, cameraController.distance, engine.graphics.camera.fov, cameraController.target);
        });

        pointerDevice.on.wheel.add(function (delta) {
            const cameraController = getController();
            cameraController.distance += delta.y;
        });

        this.pointerDevice = pointerDevice;
        this.pointerDevice.start();
    }

    shutdown() {
        this.system.enabled.set(false);

        this.pointerDevice.stop();

        this.restore.forEach(function (action) {
            action();
        });

        this.restore = [];
    }
}


export default TopDownCameraControlTool;
