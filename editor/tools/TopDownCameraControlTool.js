/**
 * Created by Alex on 16/01/2017.
 */
import Tool from './engine/Tool.js';
import TopDownCameraControllerSystem from "../../engine/graphics/ecs/camera/TopDownCameraControllerSystem.js";
import { makeOrbitalCameraController } from "../../engine/graphics/camera/makeOrbitalCameraController.js";
import EditorEntity from "../ecs/EditorEntity.js";

class TopDownCameraControlTool extends Tool {
    constructor() {
        super();
        this.name = "camera_control";
        this.system = null;


        /**
         *
         * @type {EntityBuilder}
         * @private
         */
        this.__controller = null;

    }

    initialize() {
        super.initialize();

        const engine = this.engine;
        const editor = this.editor;

        const em = engine.entityManager;


        this.system = em.getSystem(TopDownCameraControllerSystem);
        this.system.enabled.set(true);

        const ecd = em.dataset;

        this.__controller = makeOrbitalCameraController({
            ecd: ecd,
            camera_entity: editor.cameraEntity.entity,
            dom_element: engine.graphics.domElement
        });

        this.__controller.add(new EditorEntity());

        this.__controller.build(ecd);
    }

    shutdown() {
        this.system.enabled.set(false);

        this.__controller.destroy();
    }
}


export default TopDownCameraControlTool;
