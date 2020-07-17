import { LocalizedLabelView } from "../../../../common/LocalizedLabelView.js";

/**
 *
 * @param {string} id
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceCreature({ id }, database, localization, gml, tooltips) {
    /**
     *
     * @type {CombatUnitDescription}
     */
    const unitDescription = database.units.get(id);

    const unitName = unitDescription.getLocalizationKeyForName();

    return new LocalizedLabelView({ id: unitName, localization });
}
