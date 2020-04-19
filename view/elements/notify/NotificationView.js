/**
 * Created by Alex on 17/04/2016.
 */
import dom from '../../DOM.js';
import View from "../../View.js";
import { assert } from "../../../core/assert.js";
import ImageView from "../image/ImageView.js";

class NotificationView extends View {
    /**
     *
     * @param {Notification} model
     * @param options
     * @constructor
     */
    constructor(model, options) {
        super();

        assert.notEqual(model, undefined, 'model is undefined');
        assert.notEqual(model, null, 'model is null');

        /**
         *
         * @type {Notification}
         */
        this.model = model;

        const dRoot = dom('div').addClass('ui-notification-view');

        this.el = dRoot.el;


        this.addClasses(model.classList);


        this.vImage = new ImageView(model.image, { classList: ['image'] });
        this.addChild(this.vImage);

        this.dTitle = dRoot.createChild('div').addClass('title');
        this.dDescription = dRoot.createChild('div').addClass('description');

        this.bindSignal(model.image.onChanged, this.updateImage, this);
    }

    link() {
        super.link();

        const model = this.model;

        this.dTitle.text(model.title);
        this.dDescription.text(model.description);

        this.updateImage();
    }

    updateImage() {
        const model = this.model;
        const src = model.image.getValue();

        if (src === undefined || src === "") {
            this.vImage.visible = false;
        } else {
            this.vImage.visible = true;
        }

    }
}


export default NotificationView;
