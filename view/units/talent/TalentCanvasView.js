import View from "../../View.js";
import { forceLayout } from "../../../../model/diagram/graph/BoxLayouter.js";
import Vector2 from "../../../core/geom/Vector2.js";
import AABB2 from "../../../core/geom/AABB2.js";
import SVG from "../../SVG.js";
import dom from "../../DOM.js";
import TalentView from "./TalentView.js";
import { frameThrottle } from "../../../engine/graphics/FrameThrottle.js";
import TalentPointWatch from "./TalentPointWatch.js";
import {
    getLearnedFraction,
    haveEnoughPoints,
    isTalentLocked
} from "../../../../model/game/logic/combat/unit/talent/TalentLogic.js";
import { assert } from "../../../core/assert.js";
import Circle from "../../../core/geom/Circle.js";
import { layoutCircleGraph } from "../../../../model/diagram/graph/CircleLayout.js";
import { DraggableAspect } from "../../../engine/ui/DraggableAspect.js";
import EmptyView from "../../elements/EmptyView.js";
import { overlap1D, seededRandom } from "../../../core/math/MathUtils.js";
import ButtonView from "../../elements/button/ButtonView.js";
import { returnTrue } from "../../../core/function/Functions.js";
import { spendTalentPoints } from "../../../../model/game/scenes/strategy/army-generator/ArmyGenerator.js";


/**
 *
 * @param talentView
 * @param {CombatUnit} unit
 */
function updateTalentView(talentView, unit) {
    const talent = talentView.model;
    const classList = talentView.el.classList;

    let actualLevel = 0;

    unit.talents.forEach(function (t) {
        if (t.description === talent) {
            actualLevel = t.level.getValue();
        }
    });

    talentView.level.set(actualLevel);

    const learnedFraction = getLearnedFraction(unit, talent);

    const LEARNED_SOME = 'learned-some';
    const LEARNED_NONE = 'learned-none';
    const LEARNED_ALL = 'learned-all';

    if (learnedFraction === 0) {
        classList.add(LEARNED_NONE);
        classList.remove(LEARNED_SOME);
        classList.remove(LEARNED_ALL);
    } else if (learnedFraction < 1) {
        classList.add(LEARNED_SOME);
        classList.remove(LEARNED_NONE);
        classList.remove(LEARNED_ALL);
    } else {
        classList.add(LEARNED_ALL);
        classList.remove(LEARNED_NONE);
        classList.remove(LEARNED_SOME);
    }

    if (isTalentLocked(unit, talent)) {
        classList.add('locked');
    } else {
        classList.remove('locked');
    }

    if (haveEnoughPoints(unit, talent)) {
        classList.add('affordable');
    } else {
        classList.remove('affordable');
    }
}

/**
 *
 * @param {Array.<TalentView>} talentViews
 * @param {Vector2} cellSize
 * @param {Vector2} spacing
 * @param {Vector2} offset
 * @param {TalentTree} talentTree
 * @param obstacles
 * @param center
 */
function layoutTalentViews(talentViews, cellSize, spacing, offset, talentTree, obstacles, center) {

    assert.ok(talentTree !== undefined, "talentTree must be defined");

    const radius = 50;

    const boxes = talentViews.map(function (view, index) {
        const fraction = index / talentViews.length;
        const angle = fraction * Math.PI * 2;

        const x0 = Math.cos(angle) * radius;
        const y0 = Math.sin(angle) * radius;

        const w = cellSize.x + spacing.x;
        const h = cellSize.y + spacing.y;

        const box = new AABB2(x0, y0, x0 + w, y0 + h);

        box.locked = false;
        box.model = view.model;

        return box;
    });

    obstacles.forEach(function (b) {
        const aabb2 = new AABB2(b.x0, b.y0, b.x1, b.y1);
        aabb2.locked = true;

        boxes.push(aabb2);
    });

    forceLayout(boxes, talentTree.graph, center);

    talentViews.forEach(function (view, index) {
        const box = boxes[index];
        view.position.set(offset.x + spacing.x / 2 + box.x0, offset.y + spacing.y / 2 + box.y0);
    });
}

/**
 *
 * @param {Array.<TalentView>} talentViews
 * @param {number} radius
 * @param {Vector2} cellSize
 * @param {Vector2} offset
 * @param {TalentTree} talentTree
 * @param obstacles
 * @param center
 */
function layoutTalentViews_Circles(talentViews, radius, cellSize, offset, talentTree, obstacles, center) {

    assert.notEqual(talentTree, undefined, "talentTree must be defined");

    const LAYOUT_SPRAY_RADIUS = 50;

    const circles = talentViews.map(function (view, index) {
        const fraction = index / talentViews.length;
        const angle = fraction * Math.PI * 2;

        const x0 = Math.cos(angle) * LAYOUT_SPRAY_RADIUS;
        const y0 = Math.sin(angle) * LAYOUT_SPRAY_RADIUS;

        const box = new Circle(x0, y0, radius);

        box.locked = false;
        box.model = view.model;

        return box;
    });

    obstacles.forEach(function (b) {
        //TODO this is a hack, converting AABBs to Circles
        const w = b.getWidth();
        const h = b.getHeight();

        const c = new Circle((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, Math.sqrt(w * w + h * h));
        c.locked = true;

        circles.push(c);
    });

    layoutCircleGraph(circles, talentTree.graph, center);

    talentViews.forEach(function (view, index) {
        const c = circles[index];

        const x = c.x - cellSize.x / 2;
        const y = c.y - cellSize.y / 2;

        view.position.set(x, y);
    });
}


/**
 *
 * @param {View} view
 * @returns {AABB2}
 */
export function view2aabb(view) {
    const p = view.position;
    const s = view.size;
    return new AABB2(p.x, p.y, s.x + p.x, s.y + p.y);
}

function expandBoxByScalar(box, v) {
    box.x0 -= v;
    box.x1 += v;
    box.y0 -= v;
    box.y1 += v;
}

function computeConnections(talentViews, graph) {
    function node2view(node) {
        return talentViews.find(function (view) {
            return view.model === node;
        });
    }

    function edge2connection(edge) {
        const offset = 4;

        const first = node2view(edge.first);
        const second = node2view(edge.second);

        const p0 = new Vector2();
        const p1 = new Vector2();

        const box0 = view2aabb(first);
        const box1 = view2aabb(second);

        const markerSize = 8;

        expandBoxByScalar(box0, offset);
        expandBoxByScalar(box1, offset + markerSize);

        AABB2.computeLineBetweenTwoBoxes(box0, box1, p0, p1);

        const points = [p1, p0];

        return {
            points,
            edge
        };
    }

    const result = [];
    graph.traverseEdges(function (edge) {
        const connection = edge2connection(edge);
        result.push(connection);
    });

    return result;
}

function drawConnections(talentViews, talentTree, connectionCallback) {
    const graph = talentTree.graph;

    const STROKE_COLOR = "#eeeeee";

    function makeMarker() {
        const defs = SVG.createElement('defs');

        const marker = SVG.createElement('marker');
        marker.setAttribute("id", "arrow");
        marker.setAttribute("markerWidth", "4");
        marker.setAttribute("markerHeight", "4");
        marker.setAttribute("refX", "2");
        marker.setAttribute("refY", "1.5");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");

        const path = SVG.createElement('path');
        path.setAttribute("d", "M0,0 L0,3 L4,1.5 z");
        path.setAttribute("fill", STROKE_COLOR);
        // path.setAttribute("fill", "context-stroke");

        defs.appendChild(marker);
        marker.appendChild(path);

        return defs;
    }

    function makeConnectionElement(connection) {
        const el = SVG.createElement('path');
        const points = connection.points;

        let pathString = "M";

        pathString += points.map(function (point) {
            return point.x + "," + point.y
        }).join("L");
        pathString += "Z";

        el.setAttribute("d", pathString);
        el.setAttribute("stroke", STROKE_COLOR);
        el.setAttribute("stroke-width", "5");
        el.setAttribute("marker-end", "url(#arrow)");

        el.classList.add("dependency-connection");

        return el;
    }


    const bounds = new AABB2();

    bounds.setNegativelyInfiniteBounds();
    talentViews.forEach(function (view) {
        const p = view.position;
        const s = view.size;

        bounds._expandToFit(p.x, p.y, p.x + s.x, p.y + s.y);
    });

    const svg = SVG.createElement('svg');
    svg.appendChild(makeMarker());

    svg.setAttribute("width", bounds.x1);
    svg.setAttribute("height", bounds.y1);

    const connections = computeConnections(talentViews, graph);

    connections.forEach(function (connection) {
        const el = makeConnectionElement(connection);

        connectionCallback(el, connection);

        svg.appendChild(el);
    });

    return svg;
}

const CELL_SIZE = new Vector2(60, 60);

class TalentCanvasView extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param options
     * @constructor
     */
    constructor(unit, options) {
        super();

        let self = this;

        this.model = unit;

        const unitDescription = unit.description.get();
        const talentTree = unitDescription.talentTree;

        /**
         *
         * @type {AABB2[]}
         * @private
         */
        this.__obstacles = options.obstacles || [];

        if (talentTree === null) {
            //no talent tree found
            console.error("No talent tree found by for unit : ", unitDescription);
        }

        const dRoot = dom().addClass('ui-talents-canvas-view');

        const vCanvas = new EmptyView({ classList: ['canvas-container'] });

        this.__containerView = vCanvas;

        this.el = dRoot.el;

        this.addChild(vCanvas);

        /**
         *
         * @type {Array<TalentDescription>}
         */
        const talents = talentTree.getTalents();

        this.pointWatch = new TalentPointWatch(unit);

        const connections = [];

        this.__connectionsElement = null;
        this.__connections = connections;

        /**
         *
         * @type {TalentView[]}
         */
        const talentViews = talents.map(function (talent) {
            const talentView = new TalentView(talent);

            const treeEntry = talentTree.getEntryById(talent.id);

            talentView.position.copy(treeEntry.visual.position);

            return talentView;
        });

        /**
         *
         * @type {TalentView[]}
         * @private
         */
        this.__talentViews = talentViews;

        talentViews.forEach(function (talentView) {
            const talent = talentView.model;
            //collect dependencies

            const dependencies = [];

            talentTree.graph.traversePredecessors(talent, function (dependency) {
                dependencies.push(dependency);
            });

            talentView.dependcyTalents = dependencies;

            if (typeof options.talentCreatedCallback === "function") {
                options.talentCreatedCallback(talent, talentView);
            }
        });

        //check if unit has some talents that are not part of the tree

        /**
         *
         * @type {Array<Talent>}
         */
        const orphanTalents = unit.talents.filter(t => {
            const notInTree = talents.indexOf(t.description) === -1;
            return notInTree;
        });

        if (orphanTalents.length > 0) {
            console.warn('found orphaned talents');
        }

        talentViews.forEach(function (v) {
            v.size.copy(CELL_SIZE);
            vCanvas.addChild(v);
        });

        //layout talents


        const throttledUpdate = frameThrottle(() => self.update());

        this.pointWatch.points.on.changed.add(throttledUpdate);

        this.size.onChanged.add(function () {
            // self.layout();
        });

        this.routeConnection();
        this.update();


        if (!ENV_PRODUCTION) {
            enableLayoutEditor(this);
        }
    }

    computeLayout() {

        const center = this.size.clone().multiplyScalar(0.5);

        const talentViews = this.__talentViews;

        const unit = this.model;

        const unitDescription = unit.description.get();
        const talentTree = unitDescription.talentTree;

        const offset = new Vector2(16, 16);
        const spacing = new Vector2(45, 45);

        const self = this;

        /**
         *
         * @type {AABB2[]}
         */
        const obstacles = this.__obstacles;


        // layoutTalentViews(talentViews, cellSize, spacing, offset, talentTree, obstacles, center);
        layoutTalentViews_Circles(talentViews, CELL_SIZE.length() / 2 + 15, CELL_SIZE, offset, talentTree, obstacles, center);

        /**
         *
         * @param {TalentView} view
         */
        function writePositionToTree(view) {

            const talent = view.model;
            const entry = talentTree.getEntryById(talent.id);

            const p = view.position.clone().sub(self.size.clone().multiplyScalar(0.5));

            entry.visual.position.copy(p);
        }

        //write current layout into the tree
        this.__talentViews.forEach(writePositionToTree);

        this.routeConnection();

        this.update();
    }

    update() {
        this.updateTalentViews();
        this.updateConnections();
    }

    routeConnection() {

        const unit = this.model;

        const unitDescription = unit.description.get();
        const talentTree = unitDescription.talentTree;

        if (this.__connectionsElement !== null) {
            this.__containerView.el.removeChild(this.__connectionsElement);
            this.__connectionsElement = null;
        }

        const connections = this.__connections;

        this.__connectionsElement = drawConnections(this.__talentViews, talentTree, function (el, connection) {
            connections.push({
                el,
                edge: connection.edge
            });
        });

        this.__connectionsElement.classList.add('connection-canvas');
        this.__containerView.el.appendChild(this.__connectionsElement);

        this.updateConnections();
    }

    updateTalentViews() {
        /**
         *
         * @type {CombatUnit}
         */
        const unit = this.model;

        this.__talentViews.forEach(function (view) {
            updateTalentView(view, unit);
        });
    }

    updateConnections() {
        /**
         *
         * @type {CombatUnit}
         */
        const unit = this.model;

        this.__connections.forEach(function (c) {
            const edge = c.edge;
            const locked = isTalentLocked(unit, edge.second);
            const el = c.el;
            if (locked) {
                el.classList.add('locked');
            } else {
                el.classList.remove('locked');
            }
        });
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

/**
 *
 * @param {TalentCanvasView} canvasView
 */
function enableLayoutEditor(canvasView) {
    const GRID_SIZE = 16;

    /**
     *
     * @param {Vector2} v
     */
    function snapVertexToGrid(v) {

        const x = v.x;
        const y = v.y;

        const _x = Math.round(x / GRID_SIZE) * GRID_SIZE;
        const _y = Math.round(y / GRID_SIZE) * GRID_SIZE;

        v.set(_x, _y);
    }

    /**
     *
     * @param {View[]} all
     */
    function computeElementsForLayout(all) {
        const result = [];

        const numTalentViews = all.length;

        l0: for (let i = 0; i < numTalentViews; i++) {
            const t0 = all[i];

            const box0 = view2aabb(t0);
            for (let j = i + 1; j < numTalentViews; j++) {

                const t1 = all[j];

                const box1 = view2aabb(t1);

                if (box0.computeOverlap(box1, new AABB2())) {
                    result.push(t0);
                    continue l0;
                }
            }
        }

        return result;
    }

    /**
     *
     * @param {TalentView[]} views
     */
    function layoutPartial(views) {

        const center = Vector2.zero;

        const talentViews = canvasView.__talentViews;
        // layoutTalentViews(talentViews, cellSize, spacing, offset, talentTree, obstacles, center);
        const cellSize = CELL_SIZE;
        const radius = cellSize.length() / 2 + 15;

        const LAYOUT_SPRAY_RADIUS = 50;

        const circles = talentViews.map(function (view, index) {
            const locked = !views.includes(view);
            let x0;
            let y0;

            if (locked) {
                x0 = view.position.x + view.size.x / 2;
                y0 = view.position.y + view.size.y / 2;
            } else {
                const fraction = index / talentViews.length;
                const angle = fraction * Math.PI * 2;

                x0 = Math.cos(angle) * LAYOUT_SPRAY_RADIUS;
                y0 = Math.sin(angle) * LAYOUT_SPRAY_RADIUS;
            }

            const box = new Circle(x0, y0, radius);

            box.locked = locked;
            box.model = view.model;

            return box;
        });

        /**
         *
         * @type {AABB2[]}
         */
        const obstacles = canvasView.__obstacles.slice();
        obstacles.forEach(function (b) {
            //TODO this is a hack, converting AABBs to Circles
            const w = b.getWidth();
            const h = b.getHeight();

            const c = new Circle((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, Math.sqrt(w * w + h * h));
            c.locked = true;

            circles.push(c);
        });

        layoutCircleGraph(circles, talentTree.graph, center);

        talentViews.forEach(function (view, index) {
            const c = circles[index];

            const x = c.x - cellSize.x / 2;
            const y = c.y - cellSize.y / 2;

            view.position.set(x, y);
        });

        assert.notEqual(talentTree, undefined, "talentTree must be defined");

        //write current layout into the tree
        views.forEach(writePositionToTree);

        canvasView.routeConnection();

        canvasView.update();
    }

    /**
     *
     */
    function layoutMess() {
        const talentViews = canvasView.__talentViews;

        /**
         *
         * @type {TalentView[]}
         */
        const mess = computeElementsForLayout(talentViews);

        layoutPartial(mess);

    }

    canvasView.addChild(new ButtonView({
        action() {
            layoutMess(canvasView);
        },
        name: "Fix Layout",
        classList: ["ui-button-rectangular"],
        css: {
            position: "absolute",
            left: "16px",
            bottom: "16px"
        }
    }));

    canvasView.addChild(new ButtonView({
        action() {
            layoutPartial(canvasView.__talentViews);
        },
        name: "Layout",
        classList: ["ui-button-rectangular"],
        css: {
            position: "absolute",
            left: "16px",
            bottom: "60px"
        }
    }));

    canvasView.addChild(new ButtonView({
        action() {
            const unit = canvasView.model;

            unit.talents.reset();
        },
        name: "Reset Talents",
        classList: ["ui-button-rectangular"],
        css: {
            position: "absolute",
            left: "16px",
            bottom: "104px"
        }
    }));

    canvasView.addChild(new ButtonView({
        action() {

            /**
             *
             * @type {StaticKnowledgeDatabase}
             */
            const db = engine.staticKnowledge;

            const talentTrees = db.talentTrees.filter(returnTrue);

            const j = talentTrees.map(t => t.toJSON());

            const data = JSON.stringify(j, 3, 3);

            navigator.clipboard.writeText(data).then(
                () => console.log(`Talents copied to clip`)
            );
        },
        name: "Copy Database",
        classList: ["ui-button-rectangular"],
        css: {
            position: "absolute",
            right: "16px",
            bottom: "104px"
        }
    }));
    canvasView.addChild(new ButtonView({
        action() {

            const random = seededRandom(1);

            spendTalentPoints(unit, random);

        },
        name: "Auto Learn",
        classList: ["ui-button-rectangular"],
        css: {
            position: "absolute",
            right: "16px",
            bottom: "60px"
        }
    }));

    /**
     * @type {CombatUnit}
     */
    const unit = canvasView.model;

    const unitDescription = unit.description.get();
    const talentTree = unitDescription.talentTree;


    console.log("editing talent tree", talentTree);


    /**
     *
     * @param {TalentView} view
     */
    function writePositionToTree(view) {

        const talent = view.model;
        const entry = talentTree.getEntryById(talent.id);

        const p = view.position.clone();

        entry.visual.position.copy(p);
    }

    const selection = [];

    function selectOne(v) {
        selection.push(v);

        v.addClass('editor-selection');
    }

    function clearSelection() {
        selection.forEach(v => {
            v.removeClass('editor-selection');
        });

        selection.splice(0, selection.length);
    }

    const selectionView = new EmptyView({ classList: ['editor-selection-view'] });

    const containerView = canvasView.__containerView;

    const draggableAspect = new DraggableAspect({
        el: canvasView.el,
        drag(p, s) {
            const px = p.x;
            const py = p.y;
            const sx = s.x;
            const sy = s.y;

            const x0 = Math.min(px, sx);
            const y0 = Math.min(py, sy);

            const x1 = Math.max(px, sx);
            const y1 = Math.max(py, sy);


            const el = containerView.el;

            const offsetX = el.offsetLeft;
            const offsetY = el.offsetTop;

            selectionView.position.set(x0 - offsetX, y0 - offsetY);
            selectionView.size.set(x1 - x0, y1 - y0);
        },
        dragStart() {

            containerView.addChild(selectionView);
        },
        dragEnd() {
            containerView.removeChild(selectionView);

            clearSelection();

            const sx0 = selectionView.position.x;
            const sx1 = sx0 + selectionView.size.x;
            const sy0 = selectionView.position.y;
            const sy1 = sy0 + selectionView.size.y;

            canvasView.__talentViews.forEach(v => {
                const vx0 = v.position.x;
                const vx1 = vx0 + v.size.x;
                const vy0 = v.position.y;
                const vy1 = vy0 + v.size.y;

                if (
                    overlap1D(sx0, sx1, vx0, vx1)
                    && overlap1D(sy0, sy1, vy0, vy1)) {
                    selectOne(v);
                }
            });
        }
    });

    draggableAspect.start();

    canvasView.__talentViews.forEach(v => {

        /**
         *
         * @param p
         * @param origin
         */
        function drag(p, origin) {
            dragStartPositions.forEach((o) => {
                const v = o.v;

                const x = p.x - origin.x + o.p.x;
                const y = p.y - origin.y + o.p.y;

                v.position.set(x, y);
            });

            canvasView.routeConnection();
        }

        let dragStartPositions;

        function dragStart() {
            if (selection.indexOf(v) === -1) {
                clearSelection();
                selectOne(v);
            }

            dragStartPositions = selection.map(v => {
                return { v, p: v.position.clone() }
            });
        }

        function dragEnd() {
            //snap elements to grid
            selection.forEach(v => {
                snapVertexToGrid(v.position);
            });

            canvasView.routeConnection();

            //write visual position into the tree
            selection.forEach(writePositionToTree);
        }

        const draggableAspect = new DraggableAspect({
            el: v.el,
            drag,
            dragStart,
            dragEnd
        });

        v.on.linked.add(draggableAspect.start, draggableAspect);
        v.on.unlinked.add(draggableAspect.stop, draggableAspect);

        if (v.isLinked) {
            draggableAspect.start();
        }
    });
}


export default TalentCanvasView;
