/**
 *
 * @enum {number}
 */
export const SoundTrackFlags = {
    Loop: 1,
    Playing: 2,
    StartWhenReady: 4,
    /**
     * URL field is not a path to actual resource, but instead an alias that needs to be resolved
     */
    UsingAliasURL: 8
};
