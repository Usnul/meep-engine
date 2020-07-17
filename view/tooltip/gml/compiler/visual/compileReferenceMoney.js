import LabelView from "../../../../common/LabelView.js";

/**
 *
 * @param {number} value
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceMoney({ value }, database, localization, gml, tooltips) {

    return new LabelView(value, {
        tag: 'span'
    });
}
