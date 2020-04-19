import { AnimationUtils, InterpolateSmooth } from "three";

function copyArray(array) {
    return new array.constructor(array);
}

export class AnimationOptimizer {
    constructor() {

    }

    /**
     *
     * @param {KeyframeTrack} track
     */
    optimizeTrack(track) {

        var times = copyArray(track.times),
            values = copyArray(track.values),
            stride = track.getValueSize(),

            smoothInterpolation = track.getInterpolation() === InterpolateSmooth,

            writeIndex = 1,
            lastIndex = times.length - 1;

        for (var i = 1; i < lastIndex; ++i) {

            var keep = false;

            var time = times[i];
            var timeNext = times[i + 1];

            // remove adjacent keyframes scheduled at the same time

            if (time !== timeNext && (i !== 1 || time !== time[0])) {

                if (!smoothInterpolation) {

                    // remove unnecessary keyframes same as their neighbors

                    var offset = i * stride,
                        offsetP = offset - stride,
                        offsetN = offset + stride;

                    for (var j = 0; j !== stride; ++j) {

                        var value = values[offset + j];

                        if (value !== values[offsetP + j] ||
                            value !== values[offsetN + j]) {

                            keep = true;
                            break;

                        }

                    }

                } else {

                    keep = true;

                }

            }

            // in-place compaction

            if (keep) {

                if (i !== writeIndex) {

                    times[writeIndex] = times[i];

                    var readOffset = i * stride,
                        writeOffset = writeIndex * stride;

                    for (var j = 0; j !== stride; ++j) {

                        values[writeOffset + j] = values[readOffset + j];

                    }

                }

                ++writeIndex;

            }

        }

        // flush last keyframe (compaction looks ahead)

        if (lastIndex > 0) {

            times[writeIndex] = times[lastIndex];

            for (var readOffset = lastIndex * stride, writeOffset = writeIndex * stride, j = 0; j !== stride; ++j) {

                values[writeOffset + j] = values[readOffset + j];

            }

            ++writeIndex;

        }

        if (writeIndex !== times.length) {

            this.times = AnimationUtils.arraySlice(times, 0, writeIndex);
            this.values = AnimationUtils.arraySlice(values, 0, writeIndex * stride);

        }

        return this;
    }

    /**
     *
     * @param {AnimationClip} clip
     */
    optimize(clip) {
        const tracks = clip.tracks;
        const n = tracks.length;
        for (let i = 0; i < n; i++) {
            const keyframeTrack = tracks[i];

            this.optimizeTrack(keyframeTrack);
        }
    }
}
