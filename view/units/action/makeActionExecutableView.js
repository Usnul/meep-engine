/**
 *
 * @param {ActionExecutable} executable
 * @returns {View}
 */
import { EventActionBindingGroupView } from "./EventActionBindingGroupView.js";
import { assert } from "../../../core/assert.js";
import { OptionSelectorIndependent } from "../../../../model/game/logic/combat/unit/actions/execution/selector/OptionSelectorIndependent.js";
import { OptionSelectorIndependentView } from "./OptionSelectorIndependentView.js";
import { OptionSelectorExclusiveView } from "./OptionSelectorExclusiveView.js";
import { ExecutableGroupView } from "./ExecutableGroupView.js";
import EmptyView from "../../elements/EmptyView.js";

/**
 *
 * @param {ActionExecutable|ExecutableGroup|EventActionBindingGroup|OptionSelectorIndependent|OptionSelectorExclusive} executable
 * @param {GMLEngine} gml
 * @param {Localization} localization
 * @returns {View}
 */
export function makeActionExecutableView({ executable, gml, localization }) {
    assert.notEqual(executable, undefined, 'executable is undefined');
    assert.notEqual(executable, null, 'executable is null');

    if (executable.secret) {
        //secret executable
        return new EmptyView({ classList: ['ui-secret-action-executable'] });
    }

    if (executable.isEventActionBindingGroup) {
        return new EventActionBindingGroupView({ model: executable, gml, localization });
    } else if (executable.isOptionSelectorIndependent) {
        return new OptionSelectorIndependentView({ model: executable, gml, localization });
    } else if (executable.isOptionSelectorExclusive) {
        return new OptionSelectorExclusiveView({ model: executable, gml, localization });
    } else if (executable.isExecutableGroup) {
        return new ExecutableGroupView({ model: executable, gml, localization });
    } else {
        throw new Error(`Unknown executable type`);
    }
}
