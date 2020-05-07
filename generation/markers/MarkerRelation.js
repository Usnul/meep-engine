import { Edge } from "../../core/graph/Edge.js";

export class MarkerRelation extends Edge {
    constructor() {
        super();

        /**
         * Relation type
         * @type {String}
         */
        this.type = null;
    }
}
