import View from "../View.js";
import List from "../../core/collection/List.js";
import ListView from "../common/ListView.js";
import UnitAffliction from "../../../model/game/logic/combat/unit/afflictions/UnitAffliction.js";
import AfflictionView from "./affliction/AfflictionView.js";
import { CombatUnitBonusSourceType } from "../../../model/game/logic/combat/CombatUnitBonusSourceType.js";

export class TraitsView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {GUIEngine} gui
     * @param {Localization} localization
     */
    constructor({unit, gui, localization}) {
        super();
        this.el = document.createElement('div');
        this.addClass('ui-combat-unit-traits-view');


        /**
         *
         * @type {List<AfflictionDescription>}
         */
        const traits = new List();
        this.addChild(new ListView(traits, {
            classList: ['traits'],
            elementFactory(t) {
                const affliction = new UnitAffliction();
                affliction.description = t;
                affliction.sourceType = CombatUnitBonusSourceType.Trait;

                return new AfflictionView(affliction, {gui, localization});
            }
        }));

        function update() {
            const unitDescription = unit.description.getValue();

            //update traits
            traits.reset();
            unitDescription.afflictions.forEach(a => traits.add(a));
        }

        this.bindSignal(unit.description.onChanged, update);
        this.on.linked.add(update);
    }
}
