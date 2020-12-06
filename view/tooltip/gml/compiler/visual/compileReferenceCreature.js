import { LocalizedLabelView } from "../../../../common/LocalizedLabelView.js";

/**
 *
 * @param {string} id
 * @param {string} team
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceCreature({ id, team }, database, localization, gml, tooltips) {
    /**
     *
     * @type {CombatUnitDescription}
     */
    const unitDescription = database.units.get(id);

    const unitName = unitDescription.getLocalizationKeyForName();

    const result = new LocalizedLabelView({ id: unitName, localization });

    if (team !== undefined) {
        result.addClass(`team-${team}`);
    }

    result.addClass(`unit-type-${unitDescription.type}`);

    return result;
}
