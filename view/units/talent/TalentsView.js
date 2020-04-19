/**
 * Created by Alex on 05/09/2016.
 */


import View from "../../View.js";
import TalentCanvasView from "./TalentCanvasView.js";

import dom from "../../DOM.js";
import { canLearnTalent, getLearnedFraction } from "../../../../model/game/logic/combat/unit/talent/TalentLogic.js";
import LabeledValueView from "../../elements/label/LabeledValueView.js";
import TalentPointWatch from "./TalentPointWatch.js";
import ButtonView from "../../elements/button/ButtonView.js";
import { TalentLearningTooltipView } from "./TalentLearningTooltipView.js";
import { MouseEvents } from "../../../engine/input/devices/events/MouseEvents.js";
import { CombatUnitComparisonView } from "../CombatUnitComparisonView.js";

import { CombatUnit } from "../../../../model/game/ecs/component/unit/CombatUnit.js";
import Army from "../../../../model/game/ecs/component/Army.js";

/**
 *
 * @param {CombatUnit} unit
 * @param {function(unit:CombatUnit):Future} resetCommand
 * @param {BoundedValue} points
 * @param {Localization} localization
 * @return {ButtonView}
 */
function createResetButton(unit, resetCommand, points, localization) {
    function updateResetButton() {
        if (points.getUpperLimit() === 0 || points.isValueAtLimit()) {
            bReset.visible = false;
        } else {
            bReset.visible = true;
        }
    }

    const bReset = new ButtonView({
        name: localization.getString('system_talents_reset_confirm_title'),
        action: function () {
            resetCommand(unit).resolve();
        },
        classList: ['reset-talents']
    });


    points.on.changed.add(updateResetButton);
    updateResetButton();

    return bReset;
}

/**
 *
 * @param {CombatUnit} unit
 * @param {TalentDescription} talent
 * @param {View} talentView
 * @param {DomTooltipManager} tooltipManager
 * @param {Localization} localization
 * @param {GMLEngine} gml
 */
function addTalentTooltip(unit, talent, talentView, { tooltipManager, localization, gml }) {
    tooltipManager.manage(talentView, function () {
        const view = new TalentLearningTooltipView({ unit, talent, localization, gml });

        requestAnimationFrame(() => {
            view.on.updated.add(() => {
                requestAnimationFrame(update);
            });
        });

        return view;
    });

    function update() {
        tooltipManager.updatePositions();
    }
}

class TalentsView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {boolean} enableEdit
     * @param {function(CombatUnit, TalentDescription)} learn
     * @param {function} resetAll
     * @param {AABB2[]} obstacles
     * @param {Localization} localization
     * @param {StaticKnowledgeDatabase} database
     * @param {GUIEngine} gui
     * @param {boolean} allowReset
     * @constructor
     */
    constructor(unit, {
        enableEdit = false,
        learn,
        resetAll,
        obstacles = [],
        localization,
        database,
        gui,
        allowReset = false
    }) {
        super();

        const dRoot = dom().addClass('ui-talents-view');

        this.el = dRoot.el;

        let selectedTalentView = null;

        /**
         * NOTE: Have to be careful not to pass any complex objects here, Vue will instrument everything with watchers which can kill performance
         * @type {{talent: {level: number, description: TalentDescription}, active: boolean}}
         */
        const selectionData = {
            talent: {
                level: 0,
                description: null
            },
            active: false
        };

        /**
         *
         * @type {Localization}
         * @private
         */
        this.__localization = localization;

        /**
         *
         * @type {GMLEngine}
         * @private
         */
        this.__gml = gui.gml;

        /**
         *
         * @type {StaticKnowledgeDatabase}
         * @private
         */
        this.__database = database;

        /**
         *
         * @type {CombatUnit}
         * @private
         */
        this.__unit = unit;

        /**
         *
         * @type {TalentDescription}
         */
        this.hoverTalent = null;

        /**
         *
         * @type {View}
         */
        this.hoverTalentComparisonView = null;


        /**
         *
         * @param {TalentView} talentView
         */
        function focusTalent(talentView) {
            clearFocus();

            /**
             * @type {TalentDescription}
             */
            const talent = talentView.model;

            selectionData.active = true;

            selectionData.talent = {
                description: talent,
                level: talentView.level
            };

            selectedTalentView = talentView;

            dRoot.el.classList.toggle('talent-focused', true);

            talentView.el.classList.add('focused');
        }

        function clearFocus() {
            //clear selection
            if (selectedTalentView !== null) {
                selectedTalentView.el.classList.remove('focused');
                selectedTalentView = null;
            }

            selectionData.active = false;

            dRoot.el.classList.toggle('talent-focused', false);
        }


        /**
         *
         * @param {TalentDescription} talent
         */
        function attemptLearning(talent) {
            //talent is already focused, learn
            if (enableEdit === true && canLearnTalent(unit, talent)) {
                //can learn
                const future = learn(unit, talent);

                future.then(() => self.updateComparisonPreview());

                if (typeof future.resolve === "function") {
                    future.resolve();

                }
            }
        }

        function interactWithTalent(talentView) {
            const talent = talentView.model;
            if (selectionData.talent.description === talent && selectionData.active) {
                attemptLearning(talent);
            } else {
                focusTalent(talentView);
            }
        }

        const self = this;

        /**
         *
         * @param {TalentDescription} talent
         * @param talentView
         */
        function talentCreatedCallback(talent, talentView) {
            //add tooltip
            addTalentTooltip(unit, talent, talentView, {
                tooltipManager: gui.viewTooltips,
                localization,
                gml: gui.tooltips.gml
            });

            talentView.el.addEventListener(MouseEvents.Click, function (event) {
                event.stopPropagation();
                interactWithTalent(talentView);

            });

            talentView.el.addEventListener(MouseEvents.Enter, event => {
                self.hoverTalent = talent;
                self.updateComparisonPreview();
            });

            talentView.el.addEventListener(MouseEvents.Leave, event => {
                self.hideComparisonPreview();
            });
        }

        const canvasView = new TalentCanvasView(unit, {
            enableEdit: enableEdit,
            talentCreatedCallback,
            learn: learn,
            obstacles
        });

        this.el.addEventListener('click', clearFocus);

        this.pointWatch = new TalentPointWatch(unit);

        this.addChild(
            new LabeledValueView({
                klass: 'points',
                label: localization.getString('system_talent_points_label') + ":",
                value: this.pointWatch.points
            })
        );

        if (enableEdit === true && allowReset) {
            const bReset = createResetButton(unit, resetAll, this.pointWatch.points, localization);
            this.addChild(bReset);
        }

        this.addChild(canvasView);

        this.size.onChanged.add(function (x, y) {
            canvasView.size.set(x, y);
        });
    }

    hideComparisonPreview() {

        if (this.hoverTalentComparisonView !== null) {
            this.removeChild(this.hoverTalentComparisonView);
        }

        this.hoverTalentComparisonView = null;
        this.hoverTalent = null;
    }

    updateComparisonPreview() {
        if (this.hoverTalent === null) {
            return;
        }

        if (this.hoverTalentComparisonView !== null) {
            this.removeChild(this.hoverTalentComparisonView);
        }

        const unit = this.__unit;

        if (getLearnedFraction(unit, this.hoverTalent) >= 1) {
            //talent is fully learned
            return;
        }

        const before = CombatUnit.factory.create();
        const after = CombatUnit.factory.create();


        before.copy(unit);

        after.copy(unit);
        after.levelUpTalent(this.hoverTalent);

        //army manages auras, so for the sake of auras working correctly we need to place this unit inside an army
        const armyBefore = new Army();
        armyBefore.units.add(before);

        const armyAfter = new Army();
        armyAfter.units.add(after);

        const comparisonView = new CombatUnitComparisonView({
            before: before,
            after: after,
            localization: this.__localization,
            gml: this.__gml,
            database: this.__database
        });

        this.hoverTalentComparisonView = comparisonView;

        this.addChild(comparisonView);
    }

    link() {
        super.link();

        this.pointWatch.start();
    }

    unlink() {
        super.unlink();

        this.pointWatch.stop();
    }
}


export default TalentsView;
