export class DynamicActor {

    constructor() {


        /**
         * Entities who's blackboards should be included into evaluation context
         * @type {number[]}
         */
        this.context = [];

    }
}

/**
 *
 * @type {boolean}
 */
DynamicActor.serializable = false;


DynamicActor.typeName = "DynamicActor";
