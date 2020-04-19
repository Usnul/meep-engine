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
     * @param {function} [hookTileAdded]
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
            captureEventTap = true,
        }
    ) {
        super();

        /**
         *
         * @type {TileGrid}
         */
        this.model = model;

        const dRoot = dom("div").addClass("ui-tile-grid-view");
        this.el = dRoot.el;

        const dMarkers = dom('div').addClass('marker-container');
        const vMarkers = new View();
        vMarkers.el = dMarkers.el;

        const dTiles = dom('div').addClass('tile-container');
        const vTiles = new View();
        vTiles.el = dTiles.el;

        this.addChild(vMarkers);
        this.addChild(vTiles);

        this.on.tap = new Signal();

        const self = this;

        const slots = this.slots = [];


        function generateSlots(width, height) {
            function makeSlotView(x, y) {
                const v = new SlotView();
                v.size.copy(tileSize);

                const discretePosition = new Vector2(x, y);

                const pos = TileView.calculatePosition(tileSize, tileSpacing, discretePosition);
                v.position.copy(pos);

                function validateDrop(draggable) {

                    const view = draggable.view;

                    /**
                     * @type {Rectangle}
                     */
                    const tile = view.model;

                    //check if tile will fit in the desired position
                    if (
                        discretePosition.x < 0
                        || tile.size.x + discretePosition.x > model.size.x
                        || discretePosition.y < 0
                        || tile.size.y + discretePosition.y > model.size.y
                    ) {
                        return false;
                    }

                    const domain = draggable.parent.domain;
                    if (domain === self) {
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

                    const overlappingTileCount = model.getOverlappingTilesRaw(overlappingTiles, discretePosition.x, discretePosition.y, tile.size.x, tile.size.y);

                    const tileArea = tile.computeArea();

                    //construct move plan
                    const moveProgram = computeTileGridMove(tile, discretePosition.x, discretePosition.y, sourceGrid, targetGrid);

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

                        for (let j = 0; j < overlappingTileCount; j++) {
                            const overlappingTile = overlappingTiles[j];

                            const tileView = findTileView(overlappingTile);

                            if (tileView.lockDragContext) {
                                //swap target is not allowed to move, prevent this swap
                                return false;
                            }
                        }

                        //it's a tile swap, capacity will not be affected after transaction
                        return true;
                    }
                }

                if (enableDragAndDrop) {

                    /**
                     *
                     * @type {DropTarget}
                     */
                    const target = dragAndDropContext.addTarget(v, self, validateDrop);

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

            let i = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {

                    const v = makeSlotView(x, y);
                    dMarkers.append(v.el);
                    slots[i++] = v;
                }
            }
        }

        function getSlot(x, y) {
            return slots[model.size.x * y + x];
        }

        function addTile(tile) {
            const tileView = new TileView({ model: tile, spacing: tileSpacing, size: tileSize });

            if (typeof hookTileAdded === "function") {
                hookTileAdded(tileView, tile);
            }

            self.addChild(tileView);

            const tileViewEl = tileView.el;
            //sign up drag and drop
            if (enableDragAndDrop) {
                const slot = getSlot(tile.position.x, tile.position.y);
                const dropTarget = slot.dropTarget;
                tileView.draggable = dragAndDropContext.addElement(tileView, dropTarget);
            }
            if (captureEventTap === true) {
                tileViewEl.addEventListener('click', function (event) {
                    self.on.tap.dispatch(tile, tileView, event);
                });
            }
        }

        function findTileView(tile) {
            const children = self.children;
            for (let i = 0; i < children.length; i++) {
                const view = children[i];
                if (view.model === tile) {
                    return view;
                }
            }
        }

        function removeTile(tile) {
            const view = findTileView(tile);
            self.removeChild(view);
        }

        //place markers
        generateSlots(model.size.x, model.size.y);

        model.tiles.forEach(addTile);
        model.tiles.on.added.add(addTile);
        model.tiles.on.removed.add(removeTile);

        const areaForTiles = TileView.calculateSize(tileSize, tileSpacing, model.size);

        this.size.copy(areaForTiles);
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
