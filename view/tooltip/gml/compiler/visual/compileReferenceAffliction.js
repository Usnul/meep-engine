import { assert } from "../../../../../core/assert.js";
import UnitAffliction from "../../../../../../model/game/unit/afflictions/UnitAffliction.js";
import AfflictionView from "../../../../../../view/units/affliction/AfflictionView.js";
import EmptyView from "../../../../elements/EmptyView.js";
import { AfflictionTooltipView } from "../../../../../../view/units/affliction/AfflictionTooltipView.js";
import LabelView from "../../../../common/LabelView.js";
import { AfflictionDescriptionView } from "../../../../../../view/units/affliction/AfflictionDescriptionView.js";

/**
 *
 * @param {string} id
 * @param {number} charges
 * @param {boolean} showStats
 * @param {boolean} showAuras
 * @param {boolean} showTriggers
 * @param showConsumeTriggers
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceAffliction(
    {
        id,
        charges = 1,
        showStats = true,
        showAuras = true,
        showTriggers = true,
        showConsumeTriggers = true
    }, database, localization, gml, tooltips) {
    assert.notEqual(id, undefined, 'id was undefined');

    /**
     * @type {AfflictionDescription}
     */
    const afflictionDescription = database.afflictions.get(id);

    if (afflictionDescription === null) {
        console.error(`Affliction '${id}' was not found`);
    }

    const affliction = new UnitAffliction();
    affliction.description = afflictionDescription;
    affliction.charges.set(charges);

    const view = new AfflictionView(affliction);

    const result = new EmptyView({ tag: 'span' });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        tooltips.manage(result, () => new AfflictionTooltipView({ affliction, localization, gml }));
    }

    result.addChild(view);

    const sAfflictionName = afflictionDescription.getLocalizedName(localization);

    result.addChild(new LabelView(sAfflictionName, { classList: ['affliction-name'] }));

    if (gml.getReferenceDepth("AFFLICTION") > 1) {
        //we are more than X levels deep into afflictions
        showTriggers = false;
        showAuras = false;
        showStats = false;
        showConsumeTriggers = false;
    }

    result.addChild(new AfflictionDescriptionView(afflictionDescription, {
        localization,
        gml,
        showStats,
        showAuras,
        showTriggers,
        showConsumeTriggers
    }));

    return result;
}
