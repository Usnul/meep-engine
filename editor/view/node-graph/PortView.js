import View from "../../../view/View.js";
import { objectKeyByValue } from "../../../core/model/ObjectUtils.js";
import { PortDirection } from "../../../core/model/node-graph/node/PortDirection.js";
import { camelToKebab } from "../../../core/primitives/strings/StringUtils.js";
import LabelView from "../../../view/common/LabelView.js";
import EmptyView from "../../../view/elements/EmptyView.js";
import { Color } from "../../../core/color/Color.js";

const DEFAULT_TYPE_COLOR = new Color(1, 1, 1);

export class PortView extends View {
    /**
     *
     * @param {Port} port
     * @param {PortVisualData} visual
     * @param {NodeGraphVisualData} visualData
     */
    constructor({ port, visual, visualData }) {
        super();

        /**
         *
         * @type {Port}
         */
        this.port = port;
        /**
         *
         * @type {PortVisualData}
         */
        this.visual = visual;

        this.el = document.createElement('div');

        this.addClass('ui-port-view');

        this.addClass(`direction-${objectKeyByValue(PortDirection, port.direction).toLocaleLowerCase()}`);

        this.addClass(`data-type-${camelToKebab(port.dataType.name)}`);

        //add port name label
        const vName = new LabelView(port.name, {
            classList: ['name']
        });

        this.addChild(vName);

        let color = visualData.getDataColor(port.dataType.id);

        if (color === undefined) {
            console.warn(`No color for data type ${port.dataType}, using default`);

            color = DEFAULT_TYPE_COLOR;
        }

        this.addChild(new EmptyView({
            classList: ['marker'],
            css: {
                backgroundColor: `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`
            }
        }));

        this.on.linked.add(this.update, this);
        this.bindSignal(visual.position.onChanged, this.update, this);
    }

    update() {
        this.position.copy(this.visual.position);
    }
}
