import View from "../../View.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import LabelView from "../../common/LabelView.js";
import { StatValueView } from "./StatValueView.js";
import { assert } from "../../../core/assert.js";

/**
 * @extends {View}
 */
export class StatView extends View {
    /**
     *
     * @param {Stat} stat
     * @param {string} id
     * @param {Localization} localization
     * @param {GMLEngine} [gml]
     */
    constructor(stat, { id, localization, gml }) {
        super();

        assert.notEqual(stat, undefined, 'stat is undefined');
        assert.ok(stat.isStat, `Supplied argument is not a Stat`);

        this.el = document.createElement('div');

        this.addClass('ui-combat-unit-stat-view');

        // Stat name
        this.addChild(new LocalizedLabelView({
            id: `system_combat_unit_stat.${id}.name`,
            localization,
            classList: ['stat-name'],
            gml,
            tag: 'span'
        }));

        // Separator
        this.addChild(new LabelView(':', { classList: ['separator'], tag: 'span' }));

        this.addChild(new StatValueView(stat, { tag: 'span' }));
    }
}
