import View from "../../View.js";
import { AfflictionDescriptionView } from "./AfflictionDescriptionView.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import ImageView from "../../elements/image/ImageView.js";
import { objectKeyByValue } from "../../../core/model/ObjectUtils.js";
import { CombatUnitBonusSourceType } from "../../../../model/game/logic/combat/CombatUnitBonusSourceType.js";

export class AfflictionTooltipView extends View {
    /**
     *
     * @param {UnitAffliction} affliction
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    constructor({affliction, localization, gml}) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-affliction-tooltip-view');

        const description = affliction.description;

        const icon = new ImageView(description.icon, {classList: ['icon']});

        const lName = new LocalizedLabelView({
            id: description.getLocalizationIdForName(),
            localization,
            classList: ['name']
        });

        const vDescription = new AfflictionDescriptionView(description, {localization, gml});

        //add source type
        this.addClass(affliction.getSourceTypeCssClass());

        const sourceKey = `system_affliction.source.${objectKeyByValue(CombatUnitBonusSourceType, affliction.sourceType)}.name`;

        this.addChild(icon);
        this.addChild(lName);

        this.addChild(
            new LocalizedLabelView({
                id: sourceKey,
                localization,
                classList: ["source-type"]
            })
        );

        this.addChild(vDescription);
    }
}
