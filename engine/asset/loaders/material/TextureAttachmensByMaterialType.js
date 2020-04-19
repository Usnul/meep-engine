import { TextureAttachment } from "./TextureAttachment.js";

const taDiffuse = new TextureAttachment({
    name: 'diffuse',
    read(m) {
        return m.map;
    },
    write(m, t) {
        m.map = t;
    }
});

const taAlphaMap = new TextureAttachment({
    name: "alpha",
    read(m) {
        return m.alphaMap;
    },
    write(m, t) {
        m.alphaMap = t;
    }
});

const taDisplacement = new TextureAttachment({
    name: "displacement",
    read(m) {
        return m.displacementMap;
    },
    write(m, t) {
        m.displacementMap = t;
    }
});

/**
 *
 * @type {Object<TextureAttachment[]>}
 */
export const TextureAttachmentsByMaterialType = {
    MeshDepthMaterial: [
        taDiffuse,
        taDisplacement,
        taAlphaMap
    ],
    MeshStandardMaterial: [
        taDiffuse,
        new TextureAttachment({
            name: "light",
            read(m) {
                return m.lightMap;
            },
            write(m, t) {
                m.lightMap = t;
            }
        }),
        new TextureAttachment({
            name: "ao",
            read(m) {
                return m.aoMap;
            },
            write(m, t) {
                m.aoMap = t;
            }
        }),
        new TextureAttachment({
            name: "emissive",
            read(m) {
                return m.emissiveMap;
            },
            write(m, t) {
                m.emissiveMap = t;
            }
        }),
        new TextureAttachment({
            name: "bump",
            read(m) {
                return m.bumpMap;
            },
            write(m, t) {
                m.bumpMap = t;
            }
        }),
        new TextureAttachment({
            name: "normal",
            read(m) {
                return m.normalMap;
            },
            write(m, t) {
                m.normalMap = t;
            }
        }),
        taDisplacement,
        new TextureAttachment({
            name: "roughness",
            read(m) {
                return m.roughnessMap;
            },
            write(m, t) {
                m.roughnessMap = t;
            }
        }),
        new TextureAttachment({
            name: "metalness",
            read(m) {
                return m.metalnessMap;
            },
            write(m, t) {
                m.metalnessMap = t;
            }
        }),
        taAlphaMap,
        new TextureAttachment({
            name: "environment",
            read(m) {
                return m.envMap;
            },
            write(m, t) {
                m.envMap = t;
            }
        })
    ]
};
