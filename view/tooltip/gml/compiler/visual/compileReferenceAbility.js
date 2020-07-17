import { assert } from "../../../../../core/assert.js";
import EmptyView from "../../../../elements/EmptyView.js";
import { CombatAbility } from "../../../../../../model/game/ability/CombatAbility.js";
import { CombatAbilityTooltipView } from "../../../../../../view/units/ability/CombatAbilityTooltipView.js";
import { CombatAbilityDescriptionView } from "../../../../../../view/units/ability/CombatAbilityDescriptionView.js";
import ImageView from "../../../../elements/image/ImageView.js";
import { LocalizedLabelView } from "../../../../common/LocalizedLabelView.js";

/**
 *
 * @param {string} id
 * @param {number} cooldown
 * @param {boolean} showStats
 * @param {boolean} showAuras
 * @param {boolean} showTriggers
 * @param showConsumeTriggers
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceAbility(
    {
        id,
        cooldown = 0,
        showStats = true,
        showAuras = true,
        showTriggers = true,
        showConsumeTriggers = true
    }, database, localization, gml, tooltips) {
    assert.notEqual(id, undefined, 'id was undefined');

    /**
     *
     * @type {StaticKnowledgeDataTable<CombatAbilityDescription>}
     */
    const table = database.getTable('abilities');
    const description = table.get(id);

    if (description === null) {
        console.error(`Ability '${id}' was not found`);
    }

    const ability = new CombatAbility();
    ability.description = description;
    ability.cooldown.set(cooldown);

    const view = new CombatAbilityDescriptionView({ ability: description, localization,gml });

    const result = new EmptyView({ tag: 'span' });

    if (gml.getTooltipsEnabled() && tooltips !== null) {
        tooltips.manage(result, () => new CombatAbilityTooltipView({ ability, localization, gml }));
    }

    result.addChild(new ImageView(description.icon, { classList: ['icon'] }));

    result.addChild(new LocalizedLabelView({
        id: description.getLocalizationIdForName(),
        localization,
        classList: ['name']
    }))

    result.addChild(view);

    return result;
}
