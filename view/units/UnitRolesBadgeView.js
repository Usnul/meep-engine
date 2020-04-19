import View from "../View.js";
import LabelView from "../common/LabelView.js";

export class UnitRolesBadgeView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {Localization} localization
     */
    constructor({ unit, localization }) {
        super();

        this.el = document.createElement('div');

        this.addClass('combat-unit-roles-badge-view');

        this.model = unit;
        this.__localization = localization;

        this.on.linked.add(this.update, this);
        this.bindSignal(unit.description.onChanged, this.update, this);
    }

    update() {

        this.removeAllChildren();

        const localization = this.__localization;

        /**
         *
         * @type {CombatUnit}
         */
        const unit = this.model;

        const unitDescription = unit.description.getValue();

        const roles = unitDescription.roles;

        roles.sort();
        roles.forEach((role) => {

            const roleName = localization.getString(`system_combat_unit_role.${role}`);

            const lRole = new LabelView(roleName, { classList: ['unit-role', 'unit-role-' + role] });

            this.addChild(lRole);
        });
    }
}
