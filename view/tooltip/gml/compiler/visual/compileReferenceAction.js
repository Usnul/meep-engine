import LabelView from "../../../../common/LabelView.js";

/**
 *
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceAction(values, database, localization, gml, tooltips) {
    const actionDescription = database.actions.get(id);

    const name = actionDescription.name;

    return new LabelView(name);
}
