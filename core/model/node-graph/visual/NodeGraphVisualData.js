import { NodeVisualData } from "./NodeVisualData.js";
import { Color } from "../../../color/Color.js";
import AABB2 from "../../../geom/AABB2.js";
import { assert } from "../../../assert.js";
import { ConnectedBoxLayouter } from "./layout/ConnectedBoxLayouter.js";
import { BoxLayoutSpec } from "./layout/BoxLayoutSpec.js";
import { ConnectionLayoutSpec } from "./layout/ConnectionLayoutSpec.js";
import { HashMap } from "../../../collection/HashMap.js";
import { ConnectionEndpointLayoutSpec } from "./layout/ConnectionEndpointLayoutSpec.js";

export class NodeGraphVisualData {
    constructor() {

        /**
         *
         * @type {Map<number, NodeVisualData>}
         */
        this.nodes = new Map();

        /**
         *
         * @type {Map<number, Color>}
         */
        this.dataColors = new Map();
    }

    /**
     *
     * @param {AABB2} result
     */
    computeBoundingBox(result) {

        this.nodes.forEach(node => {

            /**
             *
             * @type {Rectangle}
             */
            const dimensions = node.dimensions;

            const p = dimensions.position;
            const s = dimensions.size;

            result._expandToFit(p.x, p.y, p.x + s.x, p.y + s.y)

        });
    }

    /**
     *
     * @param {NodeGraph} graph
     */
    layout(graph) {
        //collect node data

        /**
         *
         * @type {NodeVisualData[]}
         */
        const nodes = [];

        this.nodes.forEach(v => {
            nodes.push(v);
        });

        const PADDING = 30;

        const layouter = new ConnectedBoxLayouter();

        /**
         *
         * @type {ConnectionLayoutSpec[]}
         */
        const connections = [];

        /**
         *
         * @type {Map<number, BoxLayoutSpec>}
         */
        const node_id_to_box_map = new Map();

        /**
         *
         * @type {BoxLayoutSpec[]}
         */
        const boxes = nodes.map(v => {
            const d = v.dimensions;

            const p = d.position;
            const s = d.size;

            const box = new BoxLayoutSpec();

            box.bounds.set(
                p.x - PADDING,
                p.y - PADDING,
                p.x + s.x + PADDING,
                p.y + s.y + PADDING
            );

            node_id_to_box_map.set(v.id, box);

            return box;
        });

        /**
         *
         * @type {HashMap<NodeInstancePortReference,ConnectionEndpointLayoutSpec>}
         */
        const endpoints = new HashMap();

        /**
         *
         * @param {NodeInstancePortReference} ref
         */
        const getEndpointLayputSpec = (ref) => {
            const endpoint = endpoints.get(ref);

            if (endpoint !== undefined) {
                return endpoint;
            } else {


                const r = new ConnectionEndpointLayoutSpec();

                const id = ref.instance.id;

                const node_visual_data = this.getNode(id);
                const port_visual_data = node_visual_data.getPort(ref.port.id);

                const box = node_id_to_box_map.get(id);

                r.box = box;
                r.point = port_visual_data.position;


                endpoints.set(ref, r);

                return r;

            }
        }

        graph.traverseConnections(connection => {
            const source = getEndpointLayputSpec(connection.source);
            const target = getEndpointLayputSpec(connection.target);

            const spec = ConnectionLayoutSpec.from(
                source,
                target
            );

            source.box.connections.push(spec);
            target.box.connections.push(spec);

            connections.push(spec);
        });

        layouter.initialize(boxes, connections);

        layouter.layout();


        boxes.forEach((box, i) => {

            const bounds = box.bounds;

            const node = nodes[i];

            node.dimensions.position.set(bounds.x0 + PADDING, bounds.y0 + PADDING);
            node.dimensions.size.set(bounds.getWidth() - PADDING * 2, bounds.getHeight() - PADDING * 2);
        });
    }

    /**
     *
     * @param {number} id
     * @param {Color} color
     */
    addDataColor(id, color) {
        assert.isNumber(id, 'id');

        this.dataColors.set(id, color);
    }

    /**
     *
     * @param {number} id
     * @returns {Color}
     */
    getDataColor(id) {
        return this.dataColors.get(id);
    }

    /**
     *
     * @param {number} id
     * @param {NodeVisualData} node
     */
    addNode(id, node) {
        this.nodes.set(id, node);
    }

    /**
     *
     * @param {number} id
     * @returns {NodeVisualData|undefined}
     */
    getNode(id) {
        return this.nodes.get(id);
    }

    toJSON() {
        const nodes = {};

        for (const [id, node] of this.nodes) {
            nodes[id] = node.toJSON()
        }

        const dataColors = {};

        for (const [id, dataColor] of this.dataColors) {
            dataColors[id] = dataColor.toJSON();
        }

        return {
            nodes
        };
    }

    fromJSON(json) {
        this.nodes.clear();

        for (const prop in json.nodes) {
            const nodeElement = json.nodes[prop];

            const node = new NodeVisualData();

            node.fromJSON(nodeElement);

            this.nodes.set(node.id, node);
        }

        this.dataColors.clear();

        for (const prop in json.dataColors) {
            const id = parseInt(prop);

            const jColor = json.dataColors[prop];

            const color = new Color();

            color.fromJSON(jColor);

            this.dataColors.set(id, color);
        }
    }
}
