import Item from "../../../../../../model/game/ecs/component/Item.js";
import ItemView from "../../../../../../view/game/items/ItemView.js";

/**
 *
 * @param {string} id
 * @param {StaticKnowledgeDatabase} database
 * @param {Localization} localization
 * @param {GMLEngine} gml
 * @param {DomTooltipManager} tooltips
 */
export function compileReferenceItem({ id }, database, localization, gml, tooltips) {

    /**
     *
     * @type {ItemDescription}
     */
    const itemDescription = database.items.get(id);

    const item = new Item();
    item.description = itemDescription;

    const viewOptions = {
        localization
    };

    if (gml.getTooltipsEnabled()) {
        viewOptions.tooltips = tooltips;
    }

    const view = new ItemView(item, viewOptions);

    return view;
}
