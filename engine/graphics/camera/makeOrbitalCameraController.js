import TopDownCameraController from "../ecs/camera/TopDownCameraController.js";
import InputController from "../../input/ecs/components/InputController.js";
import { decodeMouseEventButtons } from "../../input/devices/PointerDevice.js";
import EntityBuilder from "../../ecs/EntityBuilder.js";
import { Camera } from "../ecs/camera/Camera.js";

/**
 *
 * @param {number} camera_entity
 * @param {EntityComponentDataset} ecd
 * @param {HTMLElement} dom_element
 * @param {number} [sensitivity]
 * @return {EntityBuilder}
 */
export function makeOrbitalCameraController({
                                                camera_entity,
                                                ecd,
                                                dom_element,
                                                sensitivity = 0.01
                                            }) {
    function getCameraController() {
        return ecd.getComponent(camera_entity, TopDownCameraController)
    }

    function getCamera() {
        return ecd.getComponent(camera_entity, Camera)
    }

    /**
     *
     * @param {Vector2} delta
     */
    function orbit(delta) {

        const cameraController = getCameraController();

        cameraController.yaw += delta.x * sensitivity;
        cameraController.pitch += delta.y * sensitivity;
    }

    /**
     *
     * @param {Vector2} delta
     */
    function pan(delta) {

        const d = delta.clone();

        const cameraController = getCameraController();
        const camera = getCamera();

        TopDownCameraController.pan(d, camera.object, dom_element, cameraController.distance, camera.object.fov, cameraController.target);

    }

    function zoom(delta) {
        const cameraController = getCameraController();

        cameraController.distance += delta;
    }

    const inputController = new InputController([
        {
            path: 'pointer/on/tap',
            listener(position, event) {
                // event.preventDefault();
            }
        },
        {
            path: 'pointer/on/down',
            listener(position, event) {
                // event.preventDefault();
            }
        },
        {
            path: 'pointer/on/drag',
            listener: function (position, origin, lastDragPosition, event) {
                const delta = lastDragPosition.clone().sub(position);

                const buttons = decodeMouseEventButtons(event.buttons);

                if (buttons[0]) {
                    pan(delta);
                } else {
                    orbit(delta);
                }

                event.preventDefault();
            }
        },
        {
            path: 'pointer/on/wheel',
            listener(delta, event) {
                zoom(delta.y);
            }
        }
    ]);

    const eb = new EntityBuilder();
    eb.add(inputController);

    return eb;
}
