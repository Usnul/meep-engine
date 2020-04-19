import View from "../../View.js";
import { CombatUnitBonusMixinView } from "../bonus/CombatUnitBonusMixinView.js";

/**
 * @extends {View}
 */
export class TalentLevelDescriptionView extends View {
    /**
     *
     * @param {TalentLevel} model
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    constructor(model, {localization, gml}) {
        super();

        this.model = model;

        this.el = document.createElement('div');

        this.addClass('ui-combat-unit-talent-level-description');

        this.addChild(new CombatUnitBonusMixinView(model.bonus, {localization, gml}));
    }
}
