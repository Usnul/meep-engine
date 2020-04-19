import View from "../View.js";
import { CombatUnitStatNames } from "../../../model/game/ecs/component/unit/CombatUnitStats.js";
import { StatComparisonView } from "./StatComparisonView.js";
import { arraySetDiff } from "../../core/collection/Set.js";
import { invokeObjectEquals } from "../../core/function/Functions.js";
import { localizationStringTriggerEventNamePresent } from "./action/OccurrenceDefinitionView.js";
import EmptyView from "../elements/EmptyView.js";
import { groupArrayBy } from "../../core/collection/ArrayUtils.js";
import { CombatUnit } from "../../../model/game/ecs/component/unit/CombatUnit.js";

export class CombatUnitComparisonView extends View {
    /**
     *
     * @param {CombatUnit} before
     * @param {CombatUnit} after
     * @param {Localization} localization
     * @param {GMLEngine} gml
     * @param {StaticKnowledgeDatabase} database
     */
    constructor(
        {
            before,
            after,
            localization,
            gml,
            database
        }
    ) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-combat-unit-comparison-view');

        for (let name of CombatUnitStatNames) {

            const statBefore = before.stats[name];
            const statAfter = after.stats[name];

            if (statBefore.equals(statAfter)) {
                continue;
            }

            const view = new StatComparisonView({
                id: name,
                before: statBefore,
                after: statAfter,
                localization
            });

            this.addChild(view);
        }

        // Triggers
        const triggerDiff = arraySetDiff(before.triggers.asArray(), after.triggers.asArray(), invokeObjectEquals);


        const addedTriggers = triggerDiff.uniqueB;


        const groupedTriggersMap = groupArrayBy(addedTriggers, t => t.eventType);

        groupedTriggersMap.forEach((triggers, eventType) => {

            const eventText = localization.getString(localizationStringTriggerEventNamePresent(eventType));

            const v = new EmptyView({ classList: ['trigger'] });

            v.addChild(gml.compile(localization.getString('system_occurrence_event_summary', {
                event: eventText,
                count: `+${triggers.length}`
            })));

            this.addChild(v);
        });

    }
}
