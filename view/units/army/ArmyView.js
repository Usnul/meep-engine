/**
 * Created by Alex on 07/03/2016.
 */
import Signal from "../../../core/events/signal/Signal.js";
import Vector2 from "../../../core/geom/Vector2.js";
import ObservedValue from "../../../core/model/ObservedValue.js";

import View from "../../View.js";
import dom from "../../DOM.js";

import UnitCardView from "../UnitCard.js";

import Rectangle from "../../../core/geom/Rectangle.js";
import TileGrid from "../../../engine/ui/tiles2d/TileGrid.js";
import TileGridView from "../../elements/tiles2d/TileGrid.js";

import LabelView from '../../common/LabelView.js';
import ObservedInteger from "../../../core/model/ObservedInteger.js";
import { noop } from "../../../core/function/Functions.js";

class ArmyView extends View {
    /**
     *
     * @param {Army} army
     * @param handlers
     * @param {boolean} [enableEdit=false]
     * @param {DragAndDropContext} [dragAndDropContext]
     * @param {GUIEngine} gui
     * @param {Localization} localization
     * @param {ObservedInteger} [team=0]
     * @param {function(View)} [hookTileViewCreated]
     * @constructor
     */
    constructor(army, {
        handlers,
        enableEdit = false,
        dragAndDropContext,
        gui,
        localization,
        team = new ObservedInteger(0),
        hookTileViewCreated = noop
    }) {

        super();

        /**
         *
         * @type {Army}
         */
        this.model = army;

        const tileGrid = new TileGrid(2, 3);

        /**
         *
         * @type {TileGrid}
         */
        this.tileGrid = tileGrid;

        tileGrid.capacity.copy(army.capacity);

        const signals = this.on;

        this.on.interaction = new Signal();


        this.on.linked.add(() => {
            this.unwatchUnits();

            army.units.forEach(this.addUnit, this);

            this.watchUnits();
        });

        this.on.unlinked.add(() => {

            this.unwatchUnits();

            army.units.forEach(this.removeUnit, this);

        });

        this.bindSignal(tileGrid.tiles.on.removed, tile => {
            this.unwatchUnits();

            const index = army.units.indexOf(tile.unit);

            if (index !== -1) {
                //tile was removed, but army didn't know
                army.units.remove(index);
            }

            this.watchUnits();
        });

        this.bindSignal(tileGrid.tiles.on.added, tile => {
            this.unwatchUnits();

            const index = army.units.indexOf(tile.unit);

            if (index === -1) {
                //tile was removed, but army didn't know
                army.units.add(tile.unit);
            }

            this.watchUnits();
        });

        /**
         *
         * @param {TileView} tileView
         * @returns {UnitCardView}
         */
        function hookTileViewAdded(tileView) {
            //mark tiles
            const tile = tileView.model;

            /**
             * @type {CombatUnit}
             */
            const unit = tile.unit;

            const opts = {
                size: tileView.size,
                handlers,
                gui,
                team,
                localization
            };

            const unitCardView = new UnitCardView(unit, opts);

            /**
             *
             * @type {CombatUnitDescription|string}
             */
            const ud = unit.description.getValue();

            if (ud.allowSquadMigration === false) {
                //units are not allowed to move between armies
                tileView.lockDragContext = true;
            }

            tileView.addChild(unitCardView);

            hookTileViewCreated(tileView, tile, unitCardView, unit);

            return unitCardView;
        }

        const tileGridView = new TileGridView({
            model: tileGrid,
            tileSize: new Vector2(160, 160),
            tileSpacing: new Vector2(8, 8),
            enableDragAndDrop: enableEdit,
            dragAndDropContext,
            captureEventTap: true,
            hookTileAdded: hookTileViewAdded,
        });

        tileGridView.on.tap.add(function (rectangle, tileView) {
            signals.interaction.dispatch(rectangle.unit, tileView);

        });


        //build dom tree
        const dRoot = dom('div').addClass("ui-army-card");

        dRoot.addClass('team-' + team);

        //set dom element
        this.el = dRoot.el;

        const capacityLabel = new ObservedValue("");

        const capacityLabelView = new LabelView(capacityLabel, {
            classList: ["capacity"]
        });

        function computeCurrentCapacity() {
            return army.getOccupiedSlotCount();
        }

        function computeTotalCapacity() {
            return army.capacity.getValue();
        }

        function updateCapacity() {
            const current = computeCurrentCapacity();
            const limit = computeTotalCapacity();

            tileGrid.capacity.set(limit);

            capacityLabel.set(current + "/" + limit);

            const f = current / limit;
            const cl = dRoot.el.classList;

            const CLASS_ENUM = {
                UNDER: 'capacity-under',
                FULL: 'capacity-full',
                OVER: 'capacity-over'
            };

            function setEnumClass(c) {
                for (let n in CLASS_ENUM) {
                    const cn = CLASS_ENUM[n];
                    if (cn === c) {
                        cl.add(cn);
                    } else {
                        cl.remove(cn);
                    }
                }
            }

            if (f < 1) {
                setEnumClass(CLASS_ENUM.UNDER);
            } else if (f === 1) {
                setEnumClass(CLASS_ENUM.FULL);
            } else {
                setEnumClass(CLASS_ENUM.OVER);
            }
        }

        this.on.linked.add(updateCapacity);


        this.bindSignal(army.units.on.added, updateCapacity);
        this.bindSignal(army.units.on.removed, updateCapacity);
        this.bindSignal(army.capacity.onChanged, updateCapacity);

        this.addChild(capacityLabelView);
        this.addChild(tileGridView);

        this.size.copy(tileGridView.size);

        this.resizeToFitChildren();

        //tooltips
        if (gui !== undefined) {
            gui.viewTooltips.add(capacityLabelView, () => localization.getString('system_army.capacity.tip', {
                current: computeCurrentCapacity(),
                total: computeTotalCapacity()
            }))
        }
    }

    watchUnits() {
        const army = this.model;

        this.bindSignal(army.units.on.added, this.addUnit, this);
        this.bindSignal(army.units.on.removed, this.removeUnit, this);
    }

    unwatchUnits() {
        const army = this.model;

        this.unbindSignal(army.units.on.added, this.addUnit, this);
        this.unbindSignal(army.units.on.removed, this.removeUnit, this);
    }

    /**
     *
     * @param {CombatUnit} unit
     * @returns {boolean}
     */
    tileExists(unit) {
        return this.tileGrid.tiles.some(t => t.unit === unit);
    }

    /**
     *
     * @param {CombatUnit} unit
     */
    addUnit(unit) {
        //check if tile exists for this unit
        if (this.tileExists(unit)) {
            //tile already exists
            return false;
        }

        const tileGrid = this.tileGrid;


        const invertPlacementX = true;

        /**
         *
         * @type {Rectangle}
         */
        const rectangle = new Rectangle();

        rectangle.position.copy(unit.position);
        //
        if (invertPlacementX) {
            rectangle.position.x = (tileGrid.size.x - 1) - rectangle.position.x;
        }

        if (unit.isLargeUnit()) {
            rectangle.size.set(2, 1);
            rectangle.position.setX(0);
        } else {
            rectangle.size.set(1, 1);
        }


        rectangle.unit = unit;
        //subscribe to tile position changes
        rectangle.position.onChanged.add(function (x, y) {
            if (invertPlacementX) {
                unit.position.set((tileGrid.size.x - 1) - x, y);
            } else {
                unit.position.set(x, y);
            }
        });
        tileGrid.add(rectangle);
    }

    /**
     *
     * @param {CombatUnit} unit
     */
    removeUnit(unit) {

        const rectangles = this.tileGrid.tiles;

        const n = rectangles.length;

        for (let i = 0; i < n; i++) {

            const rectangle = rectangles.get(i);

            if (rectangle.unit === unit) {
                rectangles.remove(i);
                break;
            }

        }
    }
}


export default ArmyView;
