import View from "../../View.js";
import ListView from "../../common/ListView.js";
import List from "../../../core/collection/List.js";
import TalentView from "./TalentView.js";
import { TalentLearningTooltipView } from "./TalentLearningTooltipView.js";

/**
 * Total number of talent points invested up-to and including a certain talents. Computes investment into predecessors also.
 * @param {Talent} talent
 * @param {CombatUnit} unit
 * @returns {number}
 */
function computeTalentPointInvestment(talent, unit) {
    /**
     *
     * @type {CombatUnitDescription}
     */
    const unitDescription = unit.description.getValue();

    /**
     *
     * @type {TalentTree}
     */
    const talentTree = unitDescription.talentTree;


    let result = 0;

    const openSet = [talent.description];
    const closedSet = [];

    while (openSet.length > 0) {
        const talentDescription = openSet.pop();
        closedSet.push(talentDescription);

        const t = unit.talents.find(t => t.description === talentDescription);

        if (t !== undefined) {
            result += t.level;
        }

        //find predecessors in talent tree
        talentTree.graph.traversePredecessors(talentDescription, function (predecessor) {
            if (closedSet.indexOf(predecessor) === -1 && openSet.indexOf(predecessor) === -1) {
                openSet.push(predecessor);
            }
        });
    }

    return result;
}

/**
 * @extends {View}
 */
export class LearnedTalentsView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {GUIEngine} gui
     * @param {Localization} localization
     */
    constructor({ unit, gui, localization }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-learned-talents-view');

        /**
         *
         * @type {List<TalentDescription>}
         */
        const talents = new List();

        function updateList() {
            talents.reset();

            const unitTalents = unit.talents.asArray().slice();

            unitTalents.sort(function (a, b) {
                const i0 = computeTalentPointInvestment(a, unit);
                const i1 = computeTalentPointInvestment(b, unit);

                return i1 - i0;
            });

            talents.addAll(unitTalents.map(t => t.description));
        }

        const vTalents = new ListView(talents, {
            classList: ['talents'],
            elementFactory(td) {
                const talent = unit.talents.find(t => t.description === td);

                const talentView = new TalentView(td);

                talentView.level.set(talent.level.getValue());

                gui.viewTooltips.manage(talentView, () => {
                    const tip = new TalentLearningTooltipView({
                        unit,
                        talent: td,
                        localization,
                        gml: gui.gml
                    });

                    return tip
                });

                return talentView;
            }
        });

        this.addChild(vTalents);


        this.on.linked.add(updateList);

        this.bindSignal(unit.talents.on.added, updateList);
        this.bindSignal(unit.talents.on.removed, updateList);
    }
}
