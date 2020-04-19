import View from "../../View.js";
import domify from "../../DOM.js";
import LabelView from "../../common/LabelView.js";
import {
    localizationStringTriggerEventNamePresent,
    OccurrenceDefinitionView
} from "../action/OccurrenceDefinitionView.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import { groupArrayBy } from "../../../core/collection/ArrayUtils.js";
import { collectIteratorValueToArray } from "../../../core/collection/IteratorUtils.js";
import { CombatUnitBonusMixinView } from "../bonus/CombatUnitBonusMixinView.js";

/**
 *
 * @param {View} parentView
 * @param {OccurrenceDefinition[]} triggers
 * @param {Localization} localization
 * @param {GMLEngine} gml
 */
function createTriggerSummaryView({parentView, triggers, localization, gml}) {
    // group triggers by event type
    const groups = {};

    triggers.forEach(t => {
        let group = groups[t.eventType];

        if (group === undefined) {
            group = [];
            groups[t.eventType] = group;
        }

        group.push(t);
    });


    for (const eventType in groups) {
        const group = groups[eventType];

        const eventNameId = localizationStringTriggerEventNamePresent(eventType);
        const eventName = localization.getString(eventNameId);

        const l = new LocalizedLabelView({
            id: 'system_occurrence_event_summary',
            seed: {
                event: eventName,
                count: group.length
            },
            localization,
            gml,
            classList: ['event-trigger-summary']
        });

        parentView.addChild(l);
    }
}

/**
 *
 * @param {AfflictionChargeConsumer[]} triggers
 * @param {View} parentView
 * @param {Localization} localization
 * @param {GMLEngine} gml
 */
function makeConsumeTriggers(triggers, {localization, gml, parentView}) {
    const locale = localization.locale.getValue();

    const pluralRules = new Intl.PluralRules(locale, {type: 'cardinal'});

    //group triggers when counts match
    const groupedTriggersMap = groupArrayBy(triggers, t => t.count);

    const groupedTriggersArray = [];
    collectIteratorValueToArray(groupedTriggersArray, groupedTriggersMap.values());

    const groups = groupedTriggersArray
        .map(group => {
            return {
                count: group[0].count,
                events: group.map(t => t.eventType)
            }
        });

    //sort in ascending cost order
    groups.sort((a, b) => a.count - b.count);

    const separator = localization.getString('system_list_delimiter_or');

    groups.forEach(t => {
        const count = t.count;
        const events = t.events;

        const eventText = events.map(eventType => {

            const eventNameId = localizationStringTriggerEventNamePresent(eventType);
            return localization.getString(eventNameId);

        }).join(separator);

        let countText;

        let pluralRule;

        if (!Number.isInteger(count)) {
            countText = localization.getString('system_affliction.consumeTrigger.all.name');
            pluralRule = "other";
        } else {
            countText = count;
            pluralRule = pluralRules.select(count);
        }

        //build locale key
        const localeKey = `system_affliction.consumeTrigger.text.${pluralRule}`;

        const text = localization.getString(localeKey, {
            charges: countText,
            event: eventText
        });

        const labelView = new LabelView(text, {classList: ['consume-trigger']});

        parentView.addChild(labelView);
    });

}

/**
 *
 * @param {View} parentView
 * @param {OccurrenceDefinition[]} triggers
 * @param {Localization} localization
 * @param {GMLEngine} gml
 */
export function createTriggerTooltipDisplay({parentView, triggers, localization, gml}) {

    //group triggers by executable
    const groupedTriggersMap = groupArrayBy(triggers, t => t.executable);

    if (groupedTriggersMap.size > 5) {
        createTriggerSummaryView({triggers, parentView, localization, gml});
    } else {

        groupedTriggersMap.forEach((triggers, executable) => {
            const events = triggers.map(t => t.eventType);


            const triggerView = new OccurrenceDefinitionView({events, executable, localization, gml});

            parentView.addChild(triggerView);
        });

    }
}

/**
 * @extends {View}
 */
export class AfflictionDescriptionView extends View {
    /**
     *
     * @param {AfflictionDescription} model
     * @param {Localization} localization
     * @param {GMLEngine} gml
     * @param {boolean} showStats
     * @param {boolean} showAuras
     * @param {boolean} showTriggers
     * @param {boolean} showConsumeTriggers
     */
    constructor(model, {localization, gml, showStats = true, showAuras = true, showTriggers = true, showConsumeTriggers = true}) {
        super();

        const dRoot = domify();

        this.el = dRoot.el;

        this.addClass('ui-affliction-description-view');

        //Add localized description text
        const sDescription = model.getLocalizedDescription(localization);

        const vDescription = gml.compile(sDescription);
        vDescription.addClass('description-text');
        this.addChild(vDescription);

        this.addChild(new CombatUnitBonusMixinView(model.bonus, {
            gml,
            localization,
            showTriggers,
            showStats,
            showAuras
        }));

        //consume triggers
        if (showConsumeTriggers) {
            makeConsumeTriggers(model.consumeTriggers, {localization, gml, parentView: this});
        }
    }
}
