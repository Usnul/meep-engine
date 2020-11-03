import ObservedString from "../../../../core/model/ObservedString.js";
import List from "../../../../core/collection/list/List.js";
import ObservedBoolean from "../../../../core/model/ObservedBoolean.js";
import { InstancedFoliage } from "../InstancedFoliage.js";
import { Base64 } from "../../../../core/binary/Base64.js";
import { BinaryBuffer } from "../../../../core/binary/BinaryBuffer.js";
import { computeHashIntegerArray } from "../../../../core/math/MathUtils.js";

function FoliageLayer() {
    /**
     *
     * @type {InstancedFoliage}
     */
    this.data = new InstancedFoliage();

    this.modelURL = new ObservedString("");

    /**
     * @deprecated
     * @type {ObservedString}
     */
    this.dataURL = new ObservedString("");

    /**
     *
     * @type {ObservedBoolean}
     */
    this.castShadow = new ObservedBoolean(false);

    /**
     *
     * @type {ObservedBoolean}
     */
    this.receiveShadow = new ObservedBoolean(false);
}

FoliageLayer.prototype.hash = function () {

    return computeHashIntegerArray(
        this.data.hash(),
        this.modelURL.hash(),
        this.castShadow.hashCode(),
        this.receiveShadow.hashCode()
    );

};

FoliageLayer.prototype.fromJSON = function (json) {
    this.modelURL.fromJSON(json.modelURL);
    this.castShadow.fromJSON(json.castShadow);
    this.receiveShadow.fromJSON(json.receiveShadow);

    const data = json.data;

    if (data !== undefined) {
        const arrayBuffer = Base64.decode(data);

        const bb = new BinaryBuffer();
        bb.fromArrayBuffer(arrayBuffer);

        this.data.deserialize(bb);
    } else {

        this.data.clear();

    }
};

FoliageLayer.prototype.toJSON = function () {


    const result = {
        modelURL: this.modelURL.toJSON(),
        castShadow: this.castShadow.toJSON(),
        receiveShadow: this.receiveShadow.toJSON()
    };

    const bb = new BinaryBuffer();
    this.data.serialize(bb);
    bb.trim();

    const data_string = Base64.encode(bb.data);

    result.data = data_string;

    return result;
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
FoliageLayer.prototype.toBinaryBuffer = function (buffer) {
    this.modelURL.toBinaryBuffer(buffer);
    this.castShadow.toBinaryBuffer(buffer);
    this.receiveShadow.toBinaryBuffer(buffer);

    this.data.serialize(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
FoliageLayer.prototype.fromBinaryBuffer = function (buffer) {
    this.modelURL.fromBinaryBuffer(buffer);
    this.castShadow.fromBinaryBuffer(buffer);
    this.receiveShadow.fromBinaryBuffer(buffer);

    this.data.deserialize(buffer);
};

function Foliage2() {
    /**
     *
     * @type {List.<FoliageLayer>}
     */
    this.layers = new List();
}

Foliage2.typeName = "Foliage2";

Foliage2.prototype.toJSON = function () {
    return this.layers.toJSON();
};

Foliage2.prototype.fromJSON = function (data) {
    this.layers.fromJSON(data, FoliageLayer);
};

export { Foliage2, FoliageLayer };

