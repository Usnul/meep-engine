/**
 * Created by Alex on 09/02/2017.
 */
import View from "../View.js";
import dom from "../DOM.js";
import ObservedValue from "../../core/model/ObservedValue.js";
import { CombatUnitType } from "../../../model/game/ecs/component/unit/CombatUnitType.js";
import EmptyView from "../elements/EmptyView.js";
import ImageView from "../elements/image/ImageView.js";
import ObservedString from "../../core/model/ObservedString.js";

class UnitIconView extends View {
    /**
     *
     * @param {CombatUnitDescription} unit
     * @constructor
     */
    constructor(unit) {
        super();

        /**
         *
         * @type {ObservedValue<CombatUnitDescription>}
         */
        const model = new ObservedValue(unit);

        /**
         *
         * @type {ObservedValue<CombatUnitDescription>}
         */
        this.model = model;


        const dImage = dom('img');
        /**
         * prevent drag interaction by default. When using this as a part of a larger view with various interactions, drag behaviour is usually unwanted.
         */
        dImage.attr({ draggable: false });

        this.size.onChanged.add(function (x, y) {
            dImage.attr({
                'width': x,
                'height': y,
            });
        });


        const dRoot = dom('div');
        this.el = dRoot.el;

        const vBackground = new EmptyView({ classList: ['background'] });
        const avatarBackgroundImage = new ObservedString("");
        const vBackgroundImage = new ImageView(avatarBackgroundImage);
        vBackground.addChild(vBackgroundImage);
        this.addChild(vBackground);

        function setBackground() {
            const unitDescription = model.getValue();
            avatarBackgroundImage.set(unitDescription.avatarBackgroundImage);
        }

        function typeStyleClass(t) {
            return 'unit-type-' + t;
        }

        dRoot.append(dImage);

        function update() {
            /**
             *
             * @type {CombatUnitDescription}
             */
            const unit = model.getValue();

            //clear markers
            Object.values(CombatUnitType).forEach(t => dRoot.removeClass(typeStyleClass(t)));
            if (typeof unit === "object") {

                //add markers

                const unitType = unit.type;
                dRoot.addClass(typeStyleClass(unitType));

                const iconURL = unit.avatarImage;
                dImage.attr({ 'src': iconURL });
            } else {
                dImage.attr({ 'src': null });
            }

            setBackground();
        }

        this.bindSignal(this.model.onChanged, update);

        this.on.linked.add(update);

        dRoot.addClass('unit-icon-view');
    }
}


export default UnitIconView;
