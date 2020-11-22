export class ConnectionLayoutSpec {
    constructor() {

        /**
         *
         * @type {ConnectionEndpointLayoutSpec}
         */
        this.source = null;
        /**
         *
         * @type {ConnectionEndpointLayoutSpec}
         */
        this.target = null;

    }



    /**
     * @param {ConnectionEndpointLayoutSpec} source
     * @param {ConnectionEndpointLayoutSpec} target
     * @returns {ConnectionLayoutSpec}
     */
    static from(source, target) {
        const r = new ConnectionLayoutSpec();

        r.source = source;
        r.target = target;

        return r;
    }
}
