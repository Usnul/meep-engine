/**
 * Created by Alex on 17/05/2016.
 */


import View from "../View.js";
import dom from "../DOM.js";
import ObservedString from "../../core/model/ObservedString.js";
import LabelView from "../common/LabelView.js";
import { assert } from "../../core/assert.js";
import { CombatUnit } from "../../../model/game/ecs/component/unit/CombatUnit.js";
import { CombatUnitType } from "../../../model/game/ecs/component/unit/CombatUnitType.js";
import { CombatUnitStatsView } from "./stat/CombatUnitStatsView.js";
import { UnitRolesBadgeView } from "./UnitRolesBadgeView.js";


class CombatUnitDetailsView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {Localization} localization
     * @param {DomTooltipManager} tooltip
     * @param {string[]} [stats]
     * @constructor
     */
    constructor(unit, {
        localization,
        tooltip,
        stats
    }) {
        super();

        assert.notEqual(localization, undefined, 'localization was undefined');

        this.model = unit;

        const dRoot = dom('div').addClass('combat-unit-details-view');

        //set dom element
        this.el = dRoot.el;

        const sName = new ObservedString('');

        const lName = new LabelView(sName, { classList: ['label', 'name'] });
        this.addChild(lName);

        const sUnitType = new ObservedString("");
        const lUnitType = new LabelView(sUnitType, { classList: ['unit-type'] });
        this.addChild(lUnitType);

        const vStats = new CombatUnitStatsView(unit, {
            localization,
            tooltip,
            stats
        });

        this.addChild(vStats);

        const sDescription = new ObservedString("");

        const lDescription = new LabelView(sDescription, { classList: ['unit-description'] });
        this.addChild(lDescription);


        const roleContainer = new UnitRolesBadgeView({ unit, localization });

        function setUnitTypeStyle() {
            function unitTypeStyle(t) {
                return 'unit-type-' + t;
            }

            Object.values(CombatUnitType).forEach(t => dRoot.removeClass(unitTypeStyle(t)));

            dRoot.addClass(unitTypeStyle(unit.getUnitType()));
        }

        this.addChild(roleContainer);

        function processUnitDescription() {
            /**
             *
             * @type {CombatUnitDescription}
             */
            const d = unit.description.getValue();

            sName.set(unit.getLocalizedName(localization));
            sDescription.set(unit.getLocalizedDescription(localization));
            sUnitType.set(localization.getString(`system_combat_unit_type.${d.type}`));

            setUnitTypeStyle();
        }

        this.on.linked.add(processUnitDescription);
        this.bindSignal(unit.description.onChanged, processUnitDescription);
    }
}


export default CombatUnitDetailsView;
