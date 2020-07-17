import { LocalizedLabelView } from "../../../../common/LocalizedLabelView.js";

/**
 * @param {object} values
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceStat(values, database, localization, gml, tooltips) {
    const id = values.id;
    const _case = values.case !== undefined ? values.case : "nominative";

    let key = `system_combat_unit_stat.${id}.name.case.${_case}`;

    if (!localization.hasString(key)) {
        //drop the case

        console.warn(`Key not found ${key}, dropping the case`);

        key = `system_combat_unit_stat.${id}.name`;
    }

    const view = new LocalizedLabelView({
        id: key,
        localization,
        tag: 'span'
    });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        const code = localization.getString(`system_combat_unit_stat.${id}.tip`, {
            reduction: ''
        });

        tooltips.manage(view, () => gml.compile(code));
    }

    return view;
}
