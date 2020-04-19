/**
 * Created by Alex on 07/03/2016.
 */
import Signal from '../../core/events/signal/Signal.js';
import Vector2 from '../../core/geom/Vector2.js';

import ProgressBar from '../elements/SmoothProgressBar.js';
import View from '../View.js';
import dom from '../DOM.js';


import UnitIconView from './UnitIconView.js';
import ButtonView from "../elements/button/ButtonView.js";
import { computeUnspentPoints } from "../../../model/game/logic/combat/unit/talent/TalentLogic.js";
import { assert } from "../../core/assert.js";
import { noop } from "../../core/function/Functions.js";
import LabelView from "../common/LabelView.js";
import { AfflictionListSmartView } from "./affliction/AfflictionListSmartView.js";
import EmptyView from "../elements/EmptyView.js";
import { prettyPrint } from "../../core/NumberFormat.js";
import { LocalizedLabelView } from "../common/LocalizedLabelView.js";

function makeTalentsButton(unit, callback) {

    const buttonView = new ButtonView({
        action: function () {
            callback(unit);
        },
        name: '',
        classList: ['talents']
    });

    function canLearn() {
        let result = false;
        const unitDescription = unit.description.get();
        const talentTree = unitDescription.talentTree;

        talentTree.traverseValidLevelUps(unit, function () {
            result = true;
            //stop traversal
            return false;
        });

        return result;
    }


    const cl = buttonView.el.classList;

    function updateState() {
        cl.toggle('have-points', computeUnspentPoints(unit));
        cl.toggle('can-learn', canLearn());
    }

    buttonView.bindSignal(unit.talents.on.added, updateState);
    buttonView.bindSignal(unit.talents.on.removed, updateState);
    buttonView.bindSignal(unit.level.onChanged, updateState);
    buttonView.bindSignal(buttonView.on.linked, updateState);

    return buttonView;
}

class UnitCardView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {Vector2} [size]
     * @param [handlers]
     * @param {GUIEngine} [gui]
     * @param {Team} team
     * @param {Localization} localization
     * @param {boolean} [showAfflictions]
     * @constructor
     */
    constructor(unit, {
        size = new Vector2(50, 50),
        handlers,
        gui,
        team,
        localization,
        showAfflictions = true,
    }) {
        super();

        assert.notEqual(localization, undefined, 'localization was undefined');

        const self = this;

        /**
         *
         * @type {CombatUnit}
         */
        this.model = unit;

        this.on.moveEnded = new Signal();

        //build dom tree
        const dRoot = dom('div').addClass("ui-unit-card");
        //set dom element
        this.el = dRoot.el;


        const unitDescription = unit.description.getValue();

        const vName = new LocalizedLabelView({
            localization,
            id: unitDescription.getLocalizationKeyForName(),
            classList: ['label', 'name']
        });

        this.addChild(vName);

        const vLevel = new LabelView(unit.level, { classList: ['level'] });

        this.addChild(vLevel);


        //set team
        dRoot.addClass('team-' + team);

        //set type
        dRoot.addClass("unit-type-" + unit.getUnitType());

        const vHealth = new ProgressBar([unit.healthCurrent, unit.stats.healthMax]);
        vHealth.el.classList.add("health");
        this.addChild(vHealth);

        const vExperience = new ProgressBar(unit.experience);
        vExperience.el.classList.add("experience");
        this.addChild(vExperience);


        //
        //dRoot.css({ position: "absolute" });

        if (showAfflictions) {
            const vAfflictions = new AfflictionListSmartView({
                afflictions: unit.afflictions,
                subject: unit,
                gui,
                localization,
                foldThreshold: 9,
                shortLimit: 5
            });

            vAfflictions.el.classList.add('afflictions');
            this.addChild(vAfflictions);
        }

        this.size.copy(size);
        //

        //talent button
        const bTalents = makeTalentsButton(unit, handlers !== undefined ? handlers.inspectTalents : noop);


        this.addChild(bTalents);

        const vIcon = new UnitIconView(unitDescription);
        vIcon.size.copy(size);

        this.size.onChanged.add(function (x, y) {
            vIcon.size.set(x, y);
        });

        this.addChild(vIcon);

        function processDeath() {
            dRoot.setClass('dead', unit.isDead.getValue());
        }

        const vTagBadMeleePlacement = new EmptyView({ classList: ['bad-melee-placement'] });


        function updateProblems() {
            self.setClass('has-problems', isBadMeleePlacement());
        }


        function isBadMeleePlacement() {
            const d = unitDescription;

            const isMelee = d.abilityTargetRespectCover;

            const isBackRow = unit.position.x === 1;

            const isLargeUnit = unit.isLargeUnit();

            return isMelee && isBackRow && !isLargeUnit;
        }

        function updateUnitPosition() {
            const badPlacement = isBadMeleePlacement();

            const hasTag = self.hasChild(vTagBadMeleePlacement);

            if (badPlacement && !hasTag) {
                self.addChild(vTagBadMeleePlacement);
            } else if (!badPlacement && hasTag) {
                self.removeChild(vTagBadMeleePlacement);
            }

            updateProblems();
        }

        if (gui !== undefined) {
            gui.viewTooltips.manage(vTagBadMeleePlacement, () => localization.getString('system_combat_unit.bad_melee_placement.tip'));
            gui.viewTooltips.manage(bTalents, () => localization.getString('system_command_inspect_talents_tooltip'));
            gui.viewTooltips.manage(vLevel, () => localization.getString('system_combat_unit.level.tip'));
            gui.viewTooltips.manage(vHealth, () => {

                const hpCurrent = Math.floor(unit.healthCurrent.getValue());
                const hpMax = Math.floor(unit.stats.healthMax.getValue());

                const value = prettyPrint(hpCurrent);
                const maximum = prettyPrint(hpMax);

                return localization.getString('system_combat_unit.health.current.tip', {
                    value,
                    maximum
                });
            });
        }

        this.on.linked.add(processDeath);
        this.on.linked.add(updateUnitPosition);

        this.bindSignal(unit.position.onChanged, updateUnitPosition);
        this.bindSignal(unit.isDead.onChanged, processDeath);
    }
}


export default UnitCardView;
