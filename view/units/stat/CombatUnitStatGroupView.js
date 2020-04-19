import View from "../../View.js";

export class CombatUnitStatGroupView extends View {
    constructor() {
        super();

        this.el = document.createElement('div');

        this.addClass('combat-unit-stat-group-view');
    }
}
