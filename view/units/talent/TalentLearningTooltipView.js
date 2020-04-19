import View from "../../View.js";
import LabelView from "../../common/LabelView.js";
import EmptyView from "../../elements/EmptyView.js";
import { TalentLevelDescriptionView } from "./TalentLevelDescriptionView.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import Signal from "../../../core/events/signal/Signal.js";

/**
 *
 * @param {CombatUnit} unit
 * @param {TalentDescription} talent
 * @returns {number}
 */
function getTalentLevel(unit, talent) {
    const learnedTalent = unit.talents.find(t => t.description.id === talent.id);

    let level = 0;

    if (learnedTalent !== undefined) {
        level = learnedTalent.level.getValue();
    }

    return level;
}

export class TalentLearningTooltipView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {TalentDescription} talent
     * @param {Localization} localization
     * @param {GMLEngine} gml
     */
    constructor({ unit, talent, localization, gml }) {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-talent-learning-tooltip-view');

        this.on.updated = new Signal();

        const self = this;

        /**
         *
         * @type {boolean}
         */
        const tooltipsEnabled = gml.getTooltipsEnabled();

        function update() {

            gml.pushState();
            gml.setTooltipsEnabled(tooltipsEnabled);

            self.removeAllChildren();

            const vHeader = new EmptyView({ classList: ['header'] });
            self.addChild(vHeader);

            const currentLevel = getTalentLevel(unit, talent);

            //Talent level
            const vLevel = new EmptyView({ classList: ['level'] });
            vLevel.addChild(new LabelView(currentLevel, { classList: ['current'] }));
            vLevel.addChild(new LabelView('/'));
            vLevel.addChild(new LabelView(talent.levels.length, { classList: ['total'] }));
            vHeader.addChild(vLevel);

            //Talent name
            const sName = localization.getString(talent.getLocalizationKeyForName());

            const lName = new LabelView(sName, { classList: ['talent-name'] });

            vHeader.addChild(lName);

            const sDescription = localization.getString(talent.getLocalizationKeyForDescription());

            const vDescription = gml.compile(sDescription);
            vDescription.addClass('talent-description');
            self.addChild(vDescription);

            if (currentLevel > 0) {
                const vCurrentLevel = new EmptyView({ classList: ['current', 'level-container'] });

                vCurrentLevel.addChild(new LocalizedLabelView({
                    id: `system_talent_current_level_label`,
                    localization,
                    seed: { level: currentLevel },
                    classList: ['level-title']
                }));

                vCurrentLevel.addChild(new TalentLevelDescriptionView(talent.levels[currentLevel - 1], {
                    localization,
                    gml
                }));

                self.addChild(vCurrentLevel);
            }

            if (currentLevel < talent.levels.length) {
                const vNextLevel = new EmptyView({ classList: ['next', 'level-container'] });

                vNextLevel.addChild(new LocalizedLabelView({
                    id: `system_talent_next_level_label`,
                    localization,
                    seed: { level: currentLevel + 1 },
                    classList: ['level-title']
                }));

                vNextLevel.addChild(new TalentLevelDescriptionView(talent.levels[currentLevel], {
                    localization,
                    gml
                }));

                self.addChild(vNextLevel);
            }

            gml.popState();

            //notify
            self.on.updated.dispatch();
        }

        /**
         *
         * @param {Talent} talent
         */
        function handleTalentAdded(talent) {
            update();

            self.bindSignal(talent.level.onChanged, update);
        }

        /**
         *
         * @param {Talent} talent
         */
        function handleTalentRemoved(talent) {
            update();

            self.unbindSignal(talent.level.onChanged, update);
        }

        this.bindSignal(unit.talents.on.added, handleTalentAdded);
        this.bindSignal(unit.talents.on.removed, handleTalentRemoved);


        this.on.linked.add(update);

        this.on.linked.add(function () {
            unit.talents.forEach(t => self.bindSignal(t.level.onChanged, update));
        });

        this.on.unlinked.add(function () {
            unit.talents.forEach(t => self.unbindSignal(t.level.onChanged, update));
        })
    }
}
