import View from "../../../View.js";
import domify from "../../../DOM.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";
import UnitIconView from "../../UnitIconView.js";
import CombatUnitDetailsView from "../../CombatUnitDetailsView.js";
import { assert } from "../../../../core/assert.js";
import ButtonView from "../../../elements/button/ButtonView.js";
import { PointerDevice } from "../../../../engine/input/devices/PointerDevice.js";
import { TraitsView } from "../../TraitsView.js";

export class ArmyBuilderSlotView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param signals
     * @param {Localization} localization
     * @param {GUIEngine} gui
     * @constructor
     */
    constructor(unit, { signals, localization, gui }) {
        super();

        const dRoot = domify('div');
        this.el = dRoot.addClass('unit-slot').el;

        this.unit = new ObservedValue(unit);

        this.unitType = unit.getUnitType();

        dRoot.addClass(`unit-type-${this.unitType}`);

        const unitIconView = new UnitIconView(unit.description.getValue());

        const unitDetailsView = new CombatUnitDetailsView(
            unit,
            {
                localization,
                tooltip: gui.viewTooltips,
                stats: []
            }
        );


        this.addChild(unitIconView);
        this.addChild(unitDetailsView);
        this.addChild(new TraitsView({ unit, gui, localization }));

        assert.notEqual(signals, undefined, "signals must be defined");
        assert.notEqual(signals, null, "Signals must not be null");

        const bGenderToggle = new ButtonView({
            name: "",
            action: function () {
                signals.toggleGender.dispatch(unit);
            },
            classList: ['gender-toggle']
        });

        this.addChild(bGenderToggle);


        const pointerDevice = new PointerDevice(unitIconView.el);

        const self = this;

        pointerDevice.on.down.add(function (position, event) {
            //prevent default behaviour such as dragging
            event.preventDefault();

            const center = unitIconView.size.clone().multiplyScalar(0.5);

            signals.offerChoices.dispatch(self.unit.getValue(), self, center, position);
        });

        this.on.linked.add(() => {
            pointerDevice.start();
        });

        this.on.unlinked.add(() => {
            pointerDevice.stop();
        });

        this.size.onChanged.add(function (x, y) {
            const iconSize = y;
            unitIconView.size.set(iconSize, iconSize);

            const detailsWidth = x - iconSize;
            unitDetailsView.position.set(unitIconView.position.x + unitIconView.size.x, 0);

            unitDetailsView.size.set(detailsWidth, y);
        });

        let oldGenderClass = null;

        function handleDescription() {
            const classList = bGenderToggle.el.classList;

            if (oldGenderClass !== null) {
                classList.remove(oldGenderClass);
            }

            const u = self.unit.getValue();

            /**
             * @type {CombatUnitDescription}
             */
            const unitDescription = u.description.getValue();

            const gender = unitDescription.gender;

            const genderClass = `gender-${gender}`;

            oldGenderClass = genderClass;

            classList.add(genderClass);

        }

        //react to changes of unit description
        this.bindSignal(unit.description.onChanged, d => {
            unitIconView.model.set(d);
            handleDescription();
        });

        this.on.linked.add(handleDescription);
    }
}




