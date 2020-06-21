/**
 * Created by Alex on 15/03/2016.
 */


import TileView from './Tile.js';

import View from "../../View.js";
import dom from "../../DOM.js";

import Vector2 from "../../../core/geom/Vector2.js";
import Signal from "../../../core/events/signal/Signal.js";

import { DragAndDropContext } from '../../common/dnd/DragAndDropContext.js';
import { computeTileGridMove } from "../../../engine/ui/tiles2d/computeTileGridMove.js";
import { assert } from "../../../core/assert.js";

const slotElementPrototype = dom('div').addClass('marker').el;

class SlotView extends View {
    constructor() {
        super();
        this.el = slotElementPrototype.cloneNode(false);
    }
}


class TileGridView extends View {
    /**
     * @param {TileGrid} model
     * @param {DragAndDropContext} [dragAndDropContext]
     * @param {boolean} [enableDragAndDrop]
     * @param {Vector2} [tileSize]
     * @param {Vector2} [tileSpacing]
     * @param {function(View, Rectangle)} [hookTileAdded]
     * @param {function(View, Rectangle)} [hookTileRemoved]
     * @param {boolean} [captureEventTap]
     * @constructor
     */
    constructor(
        {
            model,
            dragAndDropContext = new DragAndDropContext(),
            enableDragAndDrop = false,
            tileSize = new Vector2(50, 50),
            tileSpacing = Vector2.zero,
            hookTileAdded,
            hookTileRemoved,
            captureEventTap = true,
        }
    ) {
        super();

        /**
         *
         * @type {TileGrid}
         */
        this.model = model;

        /**
         *
         * @type {DragAndDropContext}
         * @private
         */
        this.__dragAndDropContext = dragAndDropContext;
        /**
         *
         * @type {boolean}
         * @private
         */
        this.__enableDragAndDrop = enableDragAndDrop;
        /**
         *
         * @type {Vector2}
         * @private
         */
        this.__tileSize = tileSize;
        /**
         *
         * @type {Vector2}
         * @private
         */
        this.__tileSpacing = tileSpacing;
        /**
         *
         * @type {Function}
         * @private
         */
        this.__hookTileAdded = hookTileAdded;

        /**
         *
         * @type {Function}
         * @private
         */
        this.__hookTileRemoved = hookTileRemoved;
        /**
         *
         * @type {boolean}
         * @private
         */
        this.__captureEventTap = captureEventTap;

        const dRoot = dom("div").addClass("ui-tile-grid-view");
        this.el = dRoot.el;

        const dMarkers = dom('div').addClass('marker-container');
        const vMarkers = new View();

        this.__markerCountainer = vMarkers;

        vMarkers.el = dMarkers.el;

        const dTiles = dom('div').addClass('tile-container');
        const vTiles = new View();
        vTiles.el = dTiles.el;

        this.addChild(vMarkers);
        this.addChild(vTiles);

        this.on.tap = new Signal();


        this.slots = [];

        //place markers
        this.generateSlots(model.size.x, model.size.y);

        model.tiles.forEach(this.addTile, this);
        model.tiles.on.added.add(this.addTile, this);
        model.tiles.on.removed.add(this.removeTile, this);

        const areaForTiles = TileView.calculateSize(tileSize, tileSpacing, model.size);

        this.size.copy(areaForTiles);
    }

    /**
     *
     * @param {Draggable} draggable
     * @param {number} cell_x
     * @param {number} cell_y
     * @return {boolean}
     * @private
     */
    __validateDrop(draggable, cell_x, cell_y) {
        assert.defined(draggable, 'draggable');
        assert.isNumber(cell_x, 'cell_x');
        assert.isNumber(cell_y, 'cell_y');

        /**
         *
         * @type {TileGrid}
         */
        const model = this.model;

        const view = draggable.view;

        /**
         * @type {Rectangle}
         */
        const tile = view.model;

        //check if tile will fit in the desired position
        if (
            cell_x < 0
            || tile.size.x + cell_x > model.size.x
            || cell_y < 0
            || tile.size.y + cell_y > model.size.y
        ) {
            return false;
        }

        const domain = draggable.parent.domain;

        if (domain === this) {
            //all well
            return true;
        }


        if (view.lockDragContext === true) {
            //item is not allowed to move to another context
            return false;
        }

        /**
         *
         * @type {TileGrid}
         */
        const targetGrid = model;

        /**
         * @type {TileGrid}
         */
        const sourceGrid = domain.model;

        const overlappingTiles = [];

        const overlappingTileCount = model.getOverlappingTilesRaw(overlappingTiles, cell_x, cell_y, tile.size.x, tile.size.y);

        const tileArea = tile.computeArea();

        //construct move plan
        const moveProgram = computeTileGridMove(tile, cell_x, cell_y, sourceGrid, targetGrid);

        if (moveProgram === null) {
            //move is impossible
            return false;
        }

        if (overlappingTileCount === 0) {
            // slot is unoccupied, validation depends on capacity constraint
            return model.capacity.getValue() >= model.computeTotalTileArea() + tileArea;
        } else {
            // slot is occupied

            // compute total overlap area
            let overlappingTileArea = 0;


            for (let j = 0; j < overlappingTileCount; j++) {
                const rectangle = overlappingTiles[j];
                overlappingTileArea += rectangle.computeArea();
            }

            if (model.capacity.getValue() < model.computeTotalTileArea() + tileArea - overlappingTileArea) {
                //grid can't take this tile
                return false;
            }

            if (sourceGrid.capacity.getValue() < sourceGrid.computeTotalTileArea() - tileArea + overlappingTileArea) {
                //old grid can't fit swapped tiles
                return false;
            }

            const instructions = moveProgram.instructions;

            const instructionCount = instructions.length;

            for (let i = 0; i < instructionCount; i++) {
                /**
                 *
                 * @type {TileMoveInstruction}
                 */
                const moveInstruction = instructions[i];

                /**
                 *
                 * @type {Rectangle}
                 */
                const moveTile = moveInstruction.tile;

                if (moveTile.lockDragContext === true && moveInstruction.source !== moveInstruction.target) {
                    //attempting to move a tile across contexts, but the tile doesn't allow that
                    return false;
                }
            }

            //it's a tile swap, capacity will not be affected after transaction
            return true;
        }
    }

    __makeSlotView(x, y) {
        const v = new SlotView();
        v.size.copy(this.__tileSize);

        const discretePosition = new Vector2(x, y);

        const pos = TileView.calculatePosition(this.__tileSize, this.__tileSpacing, discretePosition);
        v.position.copy(pos);

        /**
         *
         * @type {TileGrid}
         */
        const model = this.model;

        const self = this;

        const validateDrop = (draggable) => {
            return this.__validateDrop(draggable, discretePosition.x, discretePosition.y);
        }

        if (this.__enableDragAndDrop) {

            /**
             *
             * @type {DropTarget}
             */
            const target = this.__dragAndDropContext.addTarget(v, self, validateDrop);

            target.on.added.add(function (draggable, oldParent) {

                /**
                 * @type {TileGrid}
                 */
                const otherGrid = oldParent.domain.model;

                const tile = draggable.view.model;

                const move = computeTileGridMove(tile, discretePosition.x, discretePosition.y, otherGrid, model);

                if (move !== null) {
                    move.execute();

                    move.instructions.forEach(function (instruction) {
                        const tile = instruction.tile;
                        //re-introduce tiles to trigger various updates in visualization chain
                        instruction.target.tiles.removeOneOf(tile);
                        instruction.target.tiles.add(tile);
                    });

                } else {
                    //move is not possible
                    console.error('move is not possible');
                }
            });
            v.dropTarget = target;
        }

        return v;
    }

    /**
     *
     * @param {number} width
     * @param {number} height
     */
    generateSlots(width, height) {

        let i = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {

                const v = this.__makeSlotView(x, y);

                this.__markerCountainer.addChild(v);

                this.slots[i++] = v;
            }
        }
    }

    /**
     *
     * @param {Rectangle} tile
     */
    addTile(tile) {
        const tileView = new TileView({ model: tile, spacing: this.__tileSpacing, size: this.__tileSize });

        if (typeof this.__hookTileAdded === "function") {
            this.__hookTileAdded(tileView, tile);
        }

        this.addChild(tileView);

        const tileViewEl = tileView.el;
        //sign up drag and drop
        if (this.__enableDragAndDrop) {
            const slot = this.getSlot(tile.position.x, tile.position.y);
            const dropTarget = slot.dropTarget;
            tileView.draggable = this.__dragAndDropContext.addElement(tileView, dropTarget);
        }

        if (this.__captureEventTap === true) {
            tileViewEl.addEventListener('click', (event) => {
                this.on.tap.dispatch(tile, tileView, event);
            });
        }
    }

    /**
     *
     * @param {number} x
     * @param {number} y
     * @return {View}
     */
    getSlot(x, y) {
        /**
         *
         * @type {TileGrid}
         */
        const model = this.model;
        const size = model.size;
        return this.slots[size.x * y + x];
    }

    /**
     *
     * @param {Rectangle} tile
     */
    removeTile(tile) {
        const view = this.findTileView(tile);
        this.removeChild(view);

        if (typeof this.__hookTileRemoved === "function") {
            this.__hookTileRemoved(view, tile);
        }

    }

    /**
     *
     * @param {Rectangle} tile
     * @return {View}
     */
    findTileView(tile) {
        const children = this.children;
        for (let i = 0; i < children.length; i++) {
            const view = children[i];
            if (view.model === tile) {
                return view;
            }
        }
    }

    getChildByUUID(uuid) {
        const children = this.children;
        const numChildren = children.length;
        for (let i = 0; i < numChildren; i++) {
            const child = children[i];
            if (child.uuid === uuid) {
                return child;
            }
        }
        //not found
        return null;
    }
}


export default TileGridView;
