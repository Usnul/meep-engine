import { LocalizedLabelView } from "../../../../common/LocalizedLabelView.js";
import { TalentLevelDescriptionView } from "../../../../../../view/units/talent/TalentLevelDescriptionView.js";

/**
 *
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceTalent({ id }, database, localization, gml, tooltips) {
    /**
     *
     * @type {TalentDescription}
     */
    const talentDescription = database.talents.get(id);

    const key = talentDescription.getLocalizationKeyForName();

    const view = new LocalizedLabelView({ id: key, localization, gml, tag: 'span' });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        tooltips.manage(view, () => {
            const v = new TalentLevelDescriptionView(talentDescription.levels[0], { localization, gml });

            return v;
        });
    }

    return view;
}
