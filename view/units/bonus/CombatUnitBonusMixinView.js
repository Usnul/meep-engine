import View from "../../View.js";
import { StatModifierView } from "../stat/StatModifierView.js";
import { AuraDescriptionView } from "../AuraDescriptionView.js";
import { createTriggerTooltipDisplay } from "../affliction/AfflictionDescriptionView.js";
import LabelView from "../../common/LabelView.js";
import { computeCombatUnitBonusDesignScore } from "../../../../model/game/logic/combat/unit/computeCombatUnitBonusDesignScore.js";
import { prettyPrint } from "../../../core/NumberFormat.js";

export class CombatUnitBonusMixinView extends View {
    /**
     *
     * @param {CombatUnitBonusMixin} model
     * @param {Localization} localization
     * @param {GMLEngine} gml
     * @param {boolean} [showAfflictions=true]
     * @param {boolean} [showStats=true]
     * @param {boolean} [showAuras=true]
     * @param {boolean} [showTriggers=true]
     */
    constructor(model, { localization, gml, showAfflictions = true, showStats = true, showAuras = true, showTriggers = true }) {
        super();

        this.model = model;

        this.el = document.createElement('div');

        this.addClass('ui-combat-unit-bonus-description');

        if (!ENV_PRODUCTION) {
            const vDS = new LabelView(`Design Score: ${prettyPrint(computeCombatUnitBonusDesignScore(model))}`, { classList: ['dev-design-score'] });

            this.addChild(vDS);
        }


        // render stats
        if (showStats) {
            model.stats.forEach(s => {
                const modifierView = new StatModifierView(s, { localization, gml });
                this.addChild(modifierView);
            });
        }

        //auras
        if (showAuras) {
            model.auras.forEach(a => {
                const view = new AuraDescriptionView(a, { localization, gml });

                this.addChild(view);
            });
        }

        //afflictions
        if (showAfflictions) {
            model.afflictions.forEach(a => {
                const tip = localization.getString('system_talent_affliction_tip', { id: a.id });

                const view = gml.compile(tip);
                this.addChild(view);
            });
        }

        //render triggers
        if (showTriggers) {
            createTriggerTooltipDisplay({ parentView: this, triggers: model.triggers, localization, gml });
        }
    }
}
