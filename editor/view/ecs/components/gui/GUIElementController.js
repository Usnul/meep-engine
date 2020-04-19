import View from "../../../../../view/View.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import DatGuiController from "../DatGuiController.js";
import { GUIElementFlag } from "../../../../../engine/ecs/gui/GUIElement.js";

export class GUIElementController extends View {
    constructor() {
        super();

        this.el = document.createElement('div');

        this.addClass('gui-element-controller');

        this.model = new ObservedValue(null);

        /**
         *
         * @param {GUIElement} el
         */
        const update = (el) => {
            this.removeAllChildren();

            const dat = new DatGuiController();

            this.addChild(dat);

            const proxy = {
                klass: "",
                group: "",
                managed: el.getFlag(GUIElementFlag.Managed),
                visible: el.visible.getValue()
            };

            if (typeof el.klass === "string") {
                proxy.klass = el.klass;
            }
            if (typeof el.group === "string") {
                proxy.group = el.group;
            }

            dat.addControl(proxy, 'klass').onChange(v => {
                if (typeof v === "string" && v.trim() !== "") {
                    el.klass = v;
                } else {
                    el.klass = null;
                }
            });

            dat.addControl(proxy, 'group').onChange(v => {
                if (typeof v === "string" && v.trim() !== "") {
                    el.group = v;
                } else {
                    el.group = null;
                }
            });

            dat.addControl(proxy, 'managed').onChange(v => {
                el.writeFlag(GUIElementFlag.Managed, v);
            });

            dat.addControl(proxy, 'visible').onChange(v => {
                el.visible.set(v);
            });

            const params = dat.addFolder('parameter');

            function makeParam(paramName) {

                params.add(el.parameters, paramName);
                params.add({
                    remove() {
                        delete el.parameters[paramName];
                        update(el);
                    }
                }, 'remove');

            }

            const pc = {
                name: "",
                type: "boolean",
                create() {
                    if (pc.name.trim() === "") {
                        console.error("Parameter name is empty");
                        return;
                    }

                    let v;

                    if (pc.type === "boolean") {
                        v = false;
                    } else if (pc.type === "number") {
                        v = 0;
                    } else if (pc.type === "string") {
                        v = "";
                    }

                    el.parameters[pc.name] = v;

                    makeParam(pc.name);
                }
            };

            params.add(pc, 'name');
            params.add(pc, 'type', ["boolean", "number", "string"]);
            params.add(pc, 'create');

            for (let paramName in el.parameters) {
                if (el.parameters.hasOwnProperty(paramName)) {
                    makeParam(paramName);
                }
            }
        };

        this.model.onChanged.add(update);
    }
}
