import View from "../../../../../view/View.js";
import { NodeGraphEditorView } from "../../../../../editor/view/node-graph/NodeGraphEditorView.js";
import { NodeGraphCamera } from "../../../../../editor/view/node-graph/NodeGraphView.js";
import ListView from "../../../../../view/common/ListView.js";
import List from "../../../../../core/collection/list/List.js";
import LabelView from "../../../../../view/common/LabelView.js";
import { MouseEvents } from "../../../../input/devices/events/MouseEvents.js";
import InterfaceCommand from "../../../../../view/interaction/InterfaceCommand.js";
import { InteractionCommand } from "../../../../../view/interaction/InteractionCommand.js";
import { serializeNodeGraphToJSON } from "../../../../../core/model/node-graph/serializeNodeGraphToJSON.js";
import { downloadAsFile } from "../../../../../core/binary/ByteArrayTools.js";
import { deserializeNodeGraphFromJSON } from "../../../../../core/model/node-graph/deserializeNodeGraphFromJSON.js";

export class ParticleSpecificationEditorView extends View {
    constructor() {
        super();

        /**
         *
         * @type {ParticleSpecification}
         * @private
         */
        this.__model = null;

        /**
         *
         * @type {NodeGraphVisualData}
         * @private
         */
        this.__visual_graph_data = null;

        /**
         *
         * @type {NodeRegistry}
         * @private
         */
        this.__node_registry = null;

        this.el = document.createElement('div');

        this.addClass('ui-particle-specification-editor-view');
    }

    /**
     *
     * @param {NodeRegistry} registry
     */
    setNodeRegistry(registry) {
        this.__node_registry = registry;
    }

    /**
     *
     * @param {ParticleSpecification} model
     * @param {NodeGraphVisualData} visual
     */
    initialize(model, visual) {

        this.removeAllChildren();

        const nodeGraph = model.model;


        this.__model = model;
        this.__visual_graph_data = visual;


        const camera = new NodeGraphCamera();

        const nodeRegistry = this.__node_registry;
        const vMain = new NodeGraphEditorView({
            graph: nodeGraph,
            visual: visual,
            nodeRegistry: nodeRegistry,
            camera: camera,
            actions: [
                InterfaceCommand.form({
                    command: new InteractionCommand({
                        id: 'serialize-json',
                        action() {
                            const json = serializeNodeGraphToJSON(nodeGraph);


                            downloadAsFile(JSON.stringify(json, 3, 3), 'graph.json', 'application/json');
                        }
                    })
                })
            ]
        });

        function handleDropEvent(ev) {

            ev.preventDefault();

            /**
             *
             * @param {File} file
             */
            function processFile(file) {
                const fr = new FileReader();

                fr.onload = () => {

                    const json = JSON.parse(fr.result);

                    deserializeNodeGraphFromJSON(nodeGraph, json, nodeRegistry);

                    visual.layout(nodeGraph);
                };

                fr.readAsText(file);
            }

            if (ev.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (ev.dataTransfer.items[i].kind === 'file') {
                        var file = ev.dataTransfer.items[i].getAsFile();

                        processFile(file);
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                    const file = ev.dataTransfer.files[i];

                    processFile(file);
                }
            }
        }

        function handleDragOver(ev) {

            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();
        }

        vMain.el.addEventListener('dragover', handleDragOver);
        vMain.el.addEventListener('drop', handleDropEvent);

        vMain.followSize({ size: this.size });

        vMain.layout();
        vMain.cameraContainAll();

        this.addChild(vMain);

        // create registry view
        const vRegistry = new ListView(new List(nodeRegistry.getNodesAsArray()), {
            /**
             *
             * @param {NodeDescription} node
             */
            elementFactory(node) {
                const v = new LabelView(node.name);

                v.el.addEventListener(MouseEvents.Click, () => {

                    const instance_id = nodeGraph.createNode(node);

                    const nodeVisualData = visual.getNode(instance_id);
                });

                return v;
            },

            classList: ['ui-node-registry-view']
        });

        this.addChild(vRegistry);
    }
}
