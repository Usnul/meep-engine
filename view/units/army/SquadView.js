/**
 * Created by Alex on 17/05/2016.
 */
import ArmyView from "./ArmyView.js";

import { CombatUnit } from "../../../../model/game/ecs/component/unit/CombatUnit.js";

import View from "../../View.js";
import dom from "../../DOM.js";
import ButtonView from "../../elements/button/ButtonView.js";
import { CombatUnitType } from "../../../../model/game/ecs/component/unit/CombatUnitType.js";
import ObservedValue from "../../../core/model/ObservedValue.js";
import { LocalizedLabelView } from "../../common/LocalizedLabelView.js";
import EmptyView from "../../elements/EmptyView.js";
import { UnitRolesBadgeView } from "../UnitRolesBadgeView.js";
import { CombatUnitStatsView } from "../stat/CombatUnitStatsView.js";
import { CombatUnitEquipmentView } from "../../../../view/game/items/equipement/CombatUnitEquipmentView.js";
import { noop } from "../../../core/function/Functions.js";
import { MouseEvents } from "../../../engine/input/devices/events/MouseEvents.js";
import { createEquipmentMenuForSlot } from "../../../../view/game/items/equipement/createEquipmentMenuForSlot.js";
import Vector2 from "../../../core/geom/Vector2.js";
import ItemContainer from "../../../../model/game/ecs/component/ItemContainer.js";
import Team from "../../../../model/game/ecs/component/Team.js";
import { DomSizeObserver } from "../../util/DomSizeObserver.js";
import { CombatUnitFlag } from "../../../../model/game/ecs/component/unit/CombatUnitFlag.js";

const PADDING_FRAME_WIDTH = 24;

class SquadView extends View {
    /**
     *
     * @param {Army} army
     * @param {number} [entity]
     * @param {StrategyCommandExecutor} [commandExecutor]
     * @param {EntityComponentDataset} [ecd]
     * @param handlers
     * @param {boolean} enableEdit
     * @param {DragAndDropContext} dragAndDropContext
     * @param {GUIEngine} gui
     * @param {Localization} localization
     * @param {function(entity:number, CombatUnit):Future} dismissUnit
     * @param {ObservedInteger} team
     * @param {boolean} [autoSelect=false]
     * @constructor
     */
    constructor(army, {
        entity,
        commandExecutor,
        ecd,
        handlers,
        enableEdit,
        dragAndDropContext,
        gui,
        localization,
        dismissUnit,
        team,
        autoSelect = true
    }) {

        super();

        this.model = army;

        const dRoot = dom('div').addClass('ui-combat-squad-view');

        //set dom element
        this.el = dRoot.el;

        const selectedUnit = new ObservedValue(null);

        this.__ecd = ecd;

        /**
         *
         * @type {StrategyCommandExecutor}
         * @private
         */
        this.__commandExecutor = commandExecutor;

        /**
         *
         * @type {number}
         * @private
         */
        this.__entity = entity;

        /**
         *
         * @type {ObservedValue<CombatUnit>}
         * @private
         */
        this.__selectedUnit = selectedUnit;

        /**
         *
         * @type {Localization}
         * @private
         */
        this.__localization = localization;

        /**
         *
         * @type {DomTooltipManager}
         * @private
         */
        this.__tooltips = gui.viewTooltips;

        /**
         *
         * @type {function(entity:number, CombatUnit): Future}
         * @private
         */
        this.__dismissCallback = dismissUnit;

        /**
         *
         * @param {View} tileView
         * @param {Rectangle} tile
         * @param {CombatUnit} unit
         * @param {View} unitView
         */
        function tileAddedHook(tileView, tile, unitView, unit) {

            function update() {
                if (unit === selectedUnit.getValue()) {
                    tileView.el.classList.add('selected');
                } else {
                    tileView.el.classList.remove('selected');
                }
            }

            tileView.bindSignal(selectedUnit.onChanged, update);
            tileView.on.linked.add(update);
        }

        const armyView = new ArmyView(
            army,
            {
                gui,
                handlers,
                enableEdit,
                dragAndDropContext,
                team,
                localization,
                hookTileViewCreated: tileAddedHook
            });

        this.addChild(armyView);

        this.details = [];

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__enableEdit = enableEdit;

        /**
         *
         * @param {CombatUnit} unit
         * @param view
         */
        function interactWithUnit(unit, view) {

            selectedUnit.set(unit);

        }

        armyView.on.interaction.add(interactWithUnit);


        this.bindSignal(this.__selectedUnit.onChanged, this.update, this);
        this.on.linked.add(() => {
            const units = army.units;
            if (autoSelect && selectedUnit.getValue() === null && units.length > 0) {

                let unit = units.find(u => u.getFlag(CombatUnitFlag.Leader));

                if (unit === undefined) {
                    unit = army.findHeroUnit();
                }

                if (unit === undefined) {
                    //use first unit as fallback
                    unit = units.get(0);
                }

                selectedUnit.set(unit);

            }

            this.update();
        });
    }

    clearDetails() {
        if (this.details.length > 0) {
            this.details.forEach(v => {
                this.removeChild(v);
            });

            this.details.splice(0, this.details.length);
        }
    }

    update() {
        this.clearDetails();

        const selectedUnit = this.__selectedUnit;

        const unit = selectedUnit.get();

        if (unit === null) {
            //do nothing
            return;
        }

        const army = this.model;

        const entity = this.__entity;

        const localization = this.__localization;
        const tooltips = this.__tooltips;

        const dismissCallback = this.__dismissCallback;

        this.details.push(new CombatUnitStatsView(unit, {
            localization,
            tooltip: tooltips
        }));

        /**
         *
         * @type {CombatUnitDescription}
         */
        const unitDescription = unit.description.getValue();

        this.details.push(new LocalizedLabelView({
            id: unitDescription.getLocalizationKeyForName(),
            localization,
            classList: ['label', 'unit-name', `unit-type-${unitDescription.type}`]
        }));

        const vCenter = new EmptyView({ classList: ['central-block', `unit-type-${unitDescription.type}`] });

        this.details.push(vCenter);

        const vCenterTop = new EmptyView({ classList: ['center-equip'] });
        const vCenterBottom = new EmptyView({ classList: ['center-description'] });

        vCenter.addChild(vCenterTop);
        vCenter.addChild(vCenterBottom);

        vCenterBottom.addChild(new LocalizedLabelView({
            id: unitDescription.getLocalizationKeyForDescription(),
            localization,
            classList: ['description-text']
        }));

        vCenterBottom.addChild(new UnitRolesBadgeView({ unit, localization }));

        let slotCallback = noop;

        if (this.__enableEdit) {
            //find item container

            const ecd = this.__ecd;

            const team = ecd.getComponent(entity, Team);

            let itemContainer = null;

            ecd.traverseEntities([ItemContainer, Team], (ic, t) => {

                if (t.equals(team)) {
                    itemContainer = ic;
                    return false;
                }

            });

            slotCallback = (slot, view) => {
                view.el.addEventListener(MouseEvents.Down, (event) => {

                    const o = new DomSizeObserver();
                    o.attach(view.el);
                    o.start();
                    o.stop();

                    const position = new Vector2();

                    o.dimensions.computeCenter(position);

                    createEquipmentMenuForSlot({
                        entity: this.__entity,
                        executor: this.__commandExecutor,
                        unit,
                        slot,
                        itemContainer,
                        ecd,
                        position,
                        localization,
                        tooltips: tooltips.getTipManager(),
                        pointerPosition: new Vector2(event.clientX, event.clientY)
                    });
                });
            }
        }

        const equipmentView = new CombatUnitEquipmentView({ unit, localization, tooltips, slotCallback });

        vCenterTop.addChild(equipmentView);


        //add dismiss button
        if (this.__enableEdit === true && unit.getUnitType() !== CombatUnitType.HERO) {

            const dismissButton = new ButtonView({
                name: localization.getString('system_squad_command_dismiss_label'),
                action() {
                    const future = dismissCallback(entity, unit);

                    future.then(function () {
                        if (selectedUnit.getValue() === unit) {
                            //clear selection
                            selectedUnit.set(null);
                        }
                    });

                    future.resolve();
                }
            });

            dismissButton.el.classList.add("dismiss-unit");
            this.details.push(dismissButton);
        }

        this.details.forEach(v => this.addChild(v));
    }

}


export default SquadView;
