import View from "../../View.js";
import domify from "../../DOM.js";
import { makeActionExecutableView } from "./makeActionExecutableView.js";


/**
 *
 * @param {EventType} eventType
 * @returns {string}
 */
export function localizationStringTriggerEventNamePresent(eventType) {
    return `system_combat_event.${eventType}.name.present`;
}

/**
 * @extends {View}
 */
export class OccurrenceDefinitionView extends View {
    /**
     *
     * @param {OccurrenceDefinition} model
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    constructor({ events, executable, localization, gml }) {
        super();

        const dRoot = domify();

        dRoot.addClass('ui-occurrence-definition-view');

        this.el = dRoot.el;


        const localizedEventNames = events.map(eventType => {
            return localization.getString(localizationStringTriggerEventNamePresent(eventType));
        });

        let eventText;

        if (localizedEventNames.length > 1) {
            const separator = localization.getString('system_list_delimiter_or');

            eventText = localizedEventNames.join(separator);
        } else if (localizedEventNames.length === 1) {
            eventText = localizedEventNames[0];
        } else {
            eventText = "####";
        }


        this.addChild(gml.compile(localization.getString('system_occurrence_definition_condition', {
            event: eventText
        })));

        this.addChild(
            makeActionExecutableView({
                executable,
                gml,
                localization
            })
        );

    }
}
