import GuiControl from "../../../../../view/controller/controls/GuiControl.js";
import { NativeListController } from "../../../../../view/controller/controls/NativeListController.js";
import { AttachmentSocket } from "../../../../../engine/ecs/sockets/AttachmentSocket.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import DatGuiController from "../DatGuiController.js";
import TransformController from "../TransformController.js";

export class AttachmentSocketsController extends GuiControl {
    constructor() {
        super();

        this.model.onChanged.add(this.__handleModelChange, this);
    }

    /**
     *
     * @param {AttachmentSockets} model
     * @param {AttachmentSockets} model_old
     * @private
     */
    __handleModelChange(model, model_old) {

        if (model_old !== null) {
            this.removeAllChildren();
        }

        if (model !== null) {
            this.addChild(new NativeListController({
                model: model.elements,
                elementFactory() {
                    return new AttachmentSocket();
                },
                elementViewFactory(socket) {
                    const v = new EmptyView();

                    const c = new DatGuiController();

                    c.add(socket, 'id');

                    v.addChild(c);
                    const tc = new TransformController();
                    tc.model.set(socket.transform);
                    v.addChild(tc);

                    return v;
                }
            }));
        }
    }

}
