/**
 * NOTE, trying to keep to IANA registry: https://www.iana.org/assignments/media-types/media-types.xhtml
 * @enum {string}
 */
export const GameAssetType = {
    ModelGLTF: "model/gltf",
    ModelGLTF_JSON: "model/gltf+json",
    ModelThreeJs: "three.js",
    ArrayBuffer: "arraybuffer",
    Texture: "texture",
    DeferredTexture: "texture-deferred",
    JSON: "json",
    Text: "text",
    Image: "image",
    ImageSvg: "image/svg",
    AnimationGraph: 'x-meep/animation-graph',
    AttachmentSockets: 'x-meep/attachment-sockets',
    JavaScript: "text/javascript",
    Sound: 'audio'
};
