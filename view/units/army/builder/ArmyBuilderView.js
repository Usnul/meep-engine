import View from "../../../View.js";
import { CombatUnit } from "../../../../../model/game/ecs/component/unit/CombatUnit.js";
import UnitIconView from "../../UnitIconView.js";
import domify from "../../../DOM.js";
import Signal from "../../../../core/events/signal/Signal.js";
import { makeMenu } from "../../../../../model/game/util/RadialContextMenu.js";
import Vector2 from "../../../../core/geom/Vector2.js";
import GUIElement from "../../../../engine/ecs/gui/GUIElement.js";
import { assert } from "../../../../core/assert.js";
import { ArmyBuilderSlotView } from "./ArmyBuilderSlotView.js";
import { UnitRole } from "../../../../../model/game/ecs/component/unit/UnitRole.js";
import { RadialMenuSettings } from "../../../../../model/game/util/RadialMenuSettings.js";
import { RadialMenuElementDefinition } from "../../../elements/radial/RadialMenuElementDefinition.js";

/**
 *
 * @param {Army} army
 * @param {CombatUnit} unit
 * @param {CombatUnitDescription} offer
 * @returns {boolean}
 */
function validateOffer({ army, unit, offer }) {
    const unitsAfterChoice = army.units.map(u => {
        if (u === unit) {
            return offer;
        } else {
            return u.description.getValue();
        }
    });

    /**
     * Compute number of units with DAMAGE role
     * @type {number}
     */
    const countRoleDamage = unitsAfterChoice.reduce((s, d) => {
        const roles = d.roles;

        if (roles.indexOf(UnitRole.DAMAGE) !== -1) {
            return s + 1;
        } else {
            return s;
        }
    }, 0);

    if (countRoleDamage === 0) {
        //no damage dealers in the group
        return false;
    }

    return true;
}

class ArmyBuilderView extends View {
    /**
     *
     * @param {Army} army
     * @param {string[][]} genders
     * @param {CombatUnit[]} units
     * @param {CombatUnitDescriptionDatabase} database
     * @param {EntityComponentDataset} entityDataset
     * @param {Localization} localization
     * @param {GUIEngine} gui
     * @constructor
     */
    constructor(army, {
        genders,
        units,
        database,
        entityDataset,
        localization,
        gui
    }) {
        super();

        assert.notEqual(genders, undefined, 'genders are undefined');
        assert.notEqual(units, undefined, 'units are undefined');
        assert.notEqual(database, undefined, 'database is undefined');
        assert.notEqual(entityDataset, undefined, 'entityDataset is undefined');
        assert.notEqual(localization, undefined, 'entityDataset is undefined');

        this.el = domify('div')
            .addClass('ui-army-builder-view')
            .el;

        const signals = {
            offerChoices: new Signal(),
            toggleGender: new Signal()
        };

        /**
         *
         * @param {String} id
         * @returns {string[]}
         */
        function genderGroupById(id) {
            return genders.find(function (group) {
                return group.indexOf(id) !== -1;
            });
        }

        let slotSize = 0;


        /**
         *
         * @param {CombatUnit} unit
         * @param {CombatUnitDescription} description
         */
        function changeUnitDescription(unit, description) {
            unit.description.set(description);
        }

        /**
         *
         * @param {CombatUnit} unit
         * @param {ArmyBuilderSlotView} view
         * @param {Vector2} point
         * @param {Vector2} pointerPosition
         */
        function handleChoiceOffer(unit, view, point, pointerPosition) {
            const description = unit.description.getValue();

            //filter available options
            const offer = units
                .filter(function (unit) {
                    //remove self
                    return unit.description !== description.id;
                })
                .map(function (unit) {
                    return database.get(unit.description);
                })
                .filter(function (d) {
                    //remove different unit types
                    return d.type === unit.getUnitType();
                })
                .filter(function (d) {
                    //remove other genders
                    return d.gender === description.gender;
                })
                .filter(function (d) {
                    return validateOffer({ army, unit, offer: d });
                });


            /**
             * @type {RadialMenuElementDefinition[]}
             */
            const menuItems = offer.map(function (description, index) {

                const imageView = new UnitIconView(description);

                imageView.el.classList.add('ui-unit-avatar');

                return RadialMenuElementDefinition.from({
                    iconView: imageView,
                    fill: 'rgba(100,100,100,0.8)',
                    action: function () {
                        changeUnitDescription(unit, description);
                    },
                    name: localization.getString(description.getLocalizationKeyForName()),
                    nameFill: RadialMenuSettings.nameFill
                });
            });

            const slotRadius = slotSize / 2;
            const innerRadius = slotRadius + 4;
            const outerRadius = innerRadius + 70;
            const menuEntity = makeMenu(entityDataset, view.positionLocalToGlobal(point, new Vector2(0, 0)), menuItems, {
                innerRadius: innerRadius,
                outerRadius: outerRadius,
                autoLayout: true,
                padding: RadialMenuSettings.padding,
                pointerPosition,
                selectionDistance: slotRadius
            });

            const gui = menuEntity.getComponent(GUIElement);
            gui.view.el.classList.add('ui-army-builder-view-offer-menu');
        }

        signals.offerChoices.add(handleChoiceOffer);


        function handleToggleGender(unit) {
            const unitId = unit.description.getValue().id;
            const group = genderGroupById(unitId);

            const otherGenderId = group.find(function (id) {
                return unitId !== id;
            });

            if (otherGenderId !== undefined) {
                const d = database.get(otherGenderId);
                changeUnitDescription(unit, d);
            }
        }

        signals.toggleGender.add(handleToggleGender);

        const self = this;

        const armyUnits = army.units;
        const slotViews = armyUnits.map(function (unit, index) {
            const slotView = new ArmyBuilderSlotView(unit, {
                signals,
                gui,
                localization
            });

            self.addChild(slotView);

            return slotView;
        });

        this.size.onChanged.add(function (x, y) {


            const SLOT_SPACING = 24;
            slotSize = 128;

            slotViews.forEach(function (slotView, index) {
                slotView.position.set(0, (slotSize + SLOT_SPACING) * index);
                slotView.size.set(x, slotSize);
            });
        });
    }
}


export default ArmyBuilderView;
