/**
 * Created by Alex on 16/01/2017.
 */


import View from "../../../view/View.js";
import dom from "../../../view/DOM.js";

import LabelView from '../../../view/common/LabelView.js';
import ImageView from "../../../view/elements/image/ImageView.js";

class ToolView extends View {
    /**
     *
     * @param {Tool} tool
     * @param {Editor} editor
     * @constructor
     */
    constructor({ tool, editor }) {

        super(tool);

        const dRoot = dom('div');

        dRoot.addClass('tool-view');

        dRoot.addClass(`editor-tool-${tool.name}`);

        this.el = dRoot.el;

        //add tool name
        const lName = new LabelView(tool.name);

        const icon = new ImageView(tool.icon, { classList: ['icon'] });

        icon.size.set(32, 32);
        icon.position.set(2, 2);

        this.addChild(icon);

        this.addChild(lName);


        this.on.linked.add(() => {
            tool.updateIcon(editor);
        });

        function updateIconVisibility() {
            icon.visible = (tool.icon.getValue() !== "");
        }

        tool.icon.onChanged.add(updateIconVisibility);
        this.on.linked.add(updateIconVisibility);
    }
}


export default ToolView;
