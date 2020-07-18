import List from "../../../../../../core/collection/list/List.js";
import { ParameterTrack } from "./ParameterTrack.js";

/**
 *
 * @constructor
 */
function ParameterTrackSet() {
    /**
     * @private
     * @type List.<ParameterTrack>
     */
    this.tracks = new List();
}

/**
 *
 * @param {ParameterTrack} track
 */
ParameterTrackSet.prototype.add = function (track) {
    this.tracks.add(track);
};

/**
 *
 * @param {function(ParameterTrack)} visitor
 */
ParameterTrackSet.prototype.forEach = function (visitor) {
    this.tracks.forEach(visitor);
};


/**
 *
 * @param {string} name
 * @returns {ParameterTrack|undefined}
 */
ParameterTrackSet.prototype.getTrackByName = function (name) {
    const tracks = this.tracks;
    const nTracks = tracks.length;

    for (let i = 0; i < nTracks; i++) {
        const parameterTrack = tracks.get(i);

        if(parameterTrack.name === name){
            return parameterTrack;
        }
    }

    return undefined;
};

ParameterTrackSet.prototype.clear = function () {
    this.tracks.reset();
};

ParameterTrackSet.prototype.fromJSON = function (json) {
    this.tracks.fromJSON(json, ParameterTrack);
};

ParameterTrackSet.prototype.toJSON = function () {
    return this.tracks.toJSON();
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParameterTrackSet.prototype.toBinaryBuffer = function (buffer) {
    this.tracks.toBinaryBuffer(buffer);
};

/**
 *
 * @param {BinaryBuffer} buffer
 */
ParameterTrackSet.prototype.fromBinaryBuffer = function (buffer) {
    this.tracks.fromBinaryBuffer(buffer, ParameterTrack);
};

ParameterTrackSet.prototype.hash = function () {
    return this.tracks.hash();
};

/**
 *
 * @param {ParameterTrackSet} other
 * @returns {boolean}
 */
ParameterTrackSet.prototype.equals = function (other) {
    return this.tracks.equals(other.tracks);
};

export { ParameterTrackSet };
