import { HashMap } from "../../../../../core/collection/HashMap.js";
import { NodeInstancePortReference } from "../../../../../core/model/node-graph/node/NodeInstancePortReference.js";

export class CodeContext {
    constructor() {
        this.__identifier_count = 0;

        /**
         *
         * @type {HashMap<NodeInstancePortReference,String>}
         * @private
         */
        this.__port_identifier_map = new HashMap();
    }


    /**
     * @param {NodeInstance} node
     * @param {Port} port
     * @returns {string}
     */
    getIdentifier(node, port) {
        const ref = NodeInstancePortReference.from(node, port);

        /**
         *
         * @type {String|undefined}
         */
        let ident = this.__port_identifier_map.get(ref);

        if (ident === undefined) {
            ident = this.identifier();
            this.__port_identifier_map.set(ref, ident);
        }

        return ident;
    }

    /**
     * @returns {string} new identifier to be used for a variable name etc.
     */
    identifier() {

        const result = `v${this.__identifier_count}`;

        this.__identifier_count++;

        return result;
    }
}
