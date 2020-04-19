/**
 * Created by Alex on 06/09/2016.
 */
import View from "../../View.js";
import dom from "../../DOM.js";
import LabelView from '../../common/LabelView.js';
import EmptyView from '../../elements/EmptyView.js';
import ImageView from '../../elements/image/ImageView.js';
import ObservedValue from '../../../core/model/ObservedValue.js';


class TalentView extends View {
    /**
     *
     * @param {TalentDescription} model
     * @constructor
     */
    constructor(model) {
        super(model);
        this.model = model;
        this.level = new ObservedValue(0);

        const dRoot = dom().addClass('ui-talent-view');

        this.el = dRoot.el;


        const container = new EmptyView();
        container.dRoot.addClass('container');

        this.addChild(container);

        const icon = new ImageView(model.icon, { classList: ['icon'] });

        container.addChild(icon);

        const vLevel = new EmptyView({ classList: ['level'] });


        vLevel.addChild(new LabelView(this.level, {
            classList: ["current"],
            tag: 'span'
        }));

        vLevel.addChild(new LabelView('/', {
            classList: ['separator'],
            tag: 'span'
        }));

        vLevel.addChild(new LabelView(model.levels.length, {
            classList: ['max'],
            tag: 'span'
        }));

        container.addChild(vLevel);
    }
}




export default TalentView;
