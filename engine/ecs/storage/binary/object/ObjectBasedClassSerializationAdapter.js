import { BinaryClassSerializationAdapter } from "../BinaryClassSerializationAdapter.js";

export class ObjectBasedClassSerializationAdapter extends BinaryClassSerializationAdapter{
    constructor(){
        super();

        /**
         *
         * @type {BinaryObjectSerializationAdapter}
         */
        this.objectAdapter = null;
    }

    /**
     *
     * @param {BinaryObjectSerializationAdapter} objectAdapter
     */
    initialize(objectAdapter) {
        this.objectAdapter = objectAdapter;
    }
}
