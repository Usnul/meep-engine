import View from "../../View.js";
import List from "../../../core/collection/List.js";
import ListView from "../../common/ListView.js";
import AfflictionView from "./AfflictionView.js";
import ObservedBoolean from "../../../core/model/ObservedBoolean.js";
import { computeCombatUnitBonusPowerScore } from "../../../../model/game/logic/combat/unit/afflictions/computeAfflictionStength.js";
import ButtonView from "../../elements/button/ButtonView.js";
import ObservedInteger from "../../../core/model/ObservedInteger.js";
import { max2 } from "../../../core/math/MathUtils.js";
import LabelView from "../../common/LabelView.js";
import { frameThrottle } from "../../../engine/graphics/FrameThrottle.js";


export class AfflictionListSmartView extends View {
    /**
     *
     * @param {List<UnitAffliction>} afflictions
     * @param {CombatUnit} subject
     * @param {GUIEngine} gui
     * @param {Localization} localization
     * @param {number} [shortLimit]
     * @param {number} [foldThreshold] affliction count beyond which folding occurs
     * @param {boolean} [folded]
     */
    constructor({
                    afflictions,
                    subject,
                    gui,
                    localization,
                    shortLimit = 5,
                    foldThreshold = shortLimit + 1,
                    folded = true
                }) {
        super();

        const self = this;

        this.el = document.createElement('div');

        this.addClass('ui-affliction-list-smart-view');

        const visibleList = new List();

        const isFolded = new ObservedBoolean(folded);

        const hiddenCount = new ObservedInteger(0);


        const vAfflictions = new ListView(visibleList, {
            classList: ['afflictions'],
            elementFactory(affliction) {
                return new AfflictionView(affliction, { gui, localization });
            },
            /**
             *
             * @param element
             * @param {View} view
             */
            removeHook(element, view) {
                view.destroy();
            }
        });

        this.addChild(vAfflictions);

        /**
         *
         * @param {UnitAffliction} affliction
         * @returns {number}
         */
        function scoreAffliction(affliction) {
            const bonus = affliction.description.bonus;

            const power = computeCombatUnitBonusPowerScore(bonus, subject);

            return Math.abs(power);
        }

        /**
         *
         * @param {UnitAffliction} a
         * @param {UnitAffliction} b
         * @return {number}
         */
        function byAfflictionScore(a, b) {

            const v0 = scoreAffliction(a);
            const v1 = scoreAffliction(b);

            return v1 - v0;

        }

        function updateVisible() {
            const candidates = afflictions.asArray().slice();

            candidates.sort(byAfflictionScore);

            const numCandidates = candidates.length;

            const belowFoldThreshold = numCandidates <= foldThreshold;

            if (isFolded.getValue() && !belowFoldThreshold) {

                //drop everything beyond the limit
                const hidden = max2(0, numCandidates - shortLimit);

                candidates.splice(shortLimit, hidden);

                hiddenCount.set(hidden);

            } else {

                hiddenCount.set(0);

            }

            self.setClass('below-fold-threshold', belowFoldThreshold);
            self.setClass('folded', isFolded.getValue());

            visibleList.reset();
            visibleList.addAll(candidates);
        }

        const bToggle = new ButtonView({
            action() {
                isFolded.invert();
            },
            classList: ['fold-toggle']
        });

        gui.viewTooltips.manage(bToggle, () => {
            if (isFolded.getValue()) {
                return localization.getString('system_affliction_smart_list_display.unfold.tooltip', { count: hiddenCount.getValue() });
            } else {
                return localization.getString('system_affliction_smart_list_display.fold.tooltip');
            }
        });

        bToggle.addChild(new LabelView(hiddenCount, {
            classList: ['hidden-count'],
            format(v) {
                return `${v}`;
            }
        }));

        vAfflictions.addChild(bToggle);

        const throttledUpdate = frameThrottle(updateVisible);

        this.on.linked.add(updateVisible);
        this.bindSignal(isFolded.onChanged, updateVisible);
        this.bindSignal(afflictions.on.added, throttledUpdate);
        this.bindSignal(afflictions.on.removed, throttledUpdate);
    }
}
