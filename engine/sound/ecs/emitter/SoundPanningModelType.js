/**
 *
 * @enum {number}
 */
export const SoundPanningModelType = {
    /**
     * Head-related transfer function
     * Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects
     */
    HRTF: 0,
    /**
     * Represents the equal-power panning algorithm, generally regarded as simple and efficient.
     */
    EqualPower: 1
};
