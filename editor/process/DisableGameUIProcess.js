import { EditorProcess } from "./EditorProcess.js";
import GUIElementSystem from "../../engine/ecs/gui/GUIElementSystem.js";

class DisableGameUIProcess extends EditorProcess {

    constructor() {
        super();

        this.name = DisableGameUIProcess.Id;
    }

    initialize(editor) {
        super.initialize(editor);
    }

    startup() {
        super.startup();

        const em = this.editor.engine.entityManager;

        const guiElementSystem = em.getSystem(GUIElementSystem);

        if (guiElementSystem !== null) {
            guiElementSystem.view.visible = false;
        }
    }

    shutdown() {
        super.shutdown();

        const em = this.editor.engine.entityManager;

        const guiElementSystem = em.getSystem(GUIElementSystem);

        if (guiElementSystem !== null) {
            guiElementSystem.view.visible = true;
        }
    }
}

DisableGameUIProcess.Id = 'disable-game-user-interface';

export { DisableGameUIProcess };
