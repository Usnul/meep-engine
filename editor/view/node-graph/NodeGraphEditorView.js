import View from "../../../view/View.js";
import { NodeGraphCamera, NodeGraphView } from "./NodeGraphView.js";
import { NodeDescriptionVisualRegistry } from "../../../core/model/node-graph/visual/NodeDescriptionVisualRegistry.js";
import AABB2 from "../../../core/geom/AABB2.js";
import { min2 } from "../../../core/math/MathUtils.js";
import ButtonView from "../../../view/elements/button/ButtonView.js";
import EmptyView from "../../../view/elements/EmptyView.js";

export class NodeGraphEditorView extends View {
    /**
     *
     * @param {NodeGraph} graph
     * @param {NodeRegistry} nodeRegistry
     * @param {NodeGraphVisualData} visual
     * @param {NodeGraphCamera} camera
     * @param {InterfaceCommand[]} [actions]
     */
    constructor({ graph, nodeRegistry, visual, camera, actions = [] }) {
        super();

        /**
         *
         * @type {NodeGraphCamera}
         */
        this.camera = camera;
        /**
         *
         * @type {NodeGraphVisualData}
         */
        this.visual = visual;

        /**
         *
         * @type {NodeGraph}
         */
        this.graph = graph;

        this.el = document.createElement('div');
        this.addClass('ui-node-graph-editor-view');


        const visualRegistry = new NodeDescriptionVisualRegistry();
        //generate visual descriptions for registry nodes
        nodeRegistry.nodes.forEach(node => {
            visualRegistry.generate(node);
        });


        const graphView = new NodeGraphView({
            graph: graph,
            visual: visual,
            camera,
            nodeVisualRegistry: visualRegistry
        });

        this.size.onChanged.add((x, y) => graphView.size.set(x, y));
        this.addChild(graphView);

        const self = this;


        //
        const vUserInterface = new EmptyView({
            classList: ['user-interface']
        });

        const vActionBar = new EmptyView({
            classList: ['actions']
        });

        vUserInterface.addChild(vActionBar);

        this.addChild(vUserInterface);

        vActionBar.addChild(new ButtonView({
            action() {
                self.cameraContainAll()
            },
            classList: ["contain-all"]
        }));

        actions.forEach(ic => {
            const b = new ButtonView({
                action() {
                    ic.command.action();
                },
                classList: [ic.command.id]
            });

            vActionBar.addChild(b);
        });

        // ensure point events are enabled
        this.css({
            pointerEvents: 'auto'
        });
    }

    layout() {
        this.visual.layout(this.graph);
    }

    cameraContainAll() {
        /**
         *
         * @type {NodeGraphCamera}
         */
        const camera = this.camera;
        /**
         *
         * @type {NodeGraphVisualData}
         */
        const visual = this.visual;

        //compute bounds of the graph
        const bounds = new AABB2();

        bounds.setNegativelyInfiniteBounds();

        visual.computeBoundingBox(bounds);

        if (bounds.x0 > bounds.x1) {
            bounds.x0 = 0;
            bounds.x1 = 0;
        }
        if (bounds.y0 > bounds.y1) {
            bounds.y0 = 0;
            bounds.y1 = 0;
        }

        //expand bounds a bit
        const PADDING = 32;
        bounds.grow(PADDING);


        //compute largest side scale
        const boundsWidth = bounds.getWidth();
        const boundsHeight = bounds.getHeight();

        const canvas_width = this.size.x;
        const canvas_height = this.size.y;

        const xScale = canvas_width / boundsWidth;
        const yScale = canvas_height / boundsHeight;

        const scale = min2(
            xScale,
            yScale
        );

        if (scale === 0) {
            camera.position.set(bounds.x0, bounds.y0);

            camera.scale.set(1);

        } else {

            const xOffset = (boundsWidth - (canvas_width / scale)) / 2;
            const yOffset = (boundsHeight - (canvas_height / scale)) / 2;

            camera.position.set(bounds.x0 + xOffset, bounds.y0 + yOffset);

            camera.scale.set(scale);
        }


    }
}
