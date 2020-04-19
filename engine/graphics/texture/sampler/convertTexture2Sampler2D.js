import { WebGLRendererPool } from "../../render/RendererPool.js";
import ImageFilter, { flipArrayInPlace } from "../../filter/ImageFilter.js";
import { Sampler2D } from "./Sampler2D.js";
import CopyShader from "../../postprocess/threejs/shaders/CopyShader.js";


const DEFAULT_TEXTURE_WIDTH = 512;
const DEFAULT_TEXTURE_HEIGHT = 512;

/**
 *
 * @param {Texture} texture
 * @param {number} [width]
 * @param {number} [height]
 * @return {Sampler2D}
 */
export function convertTexture2Sampler2D(texture, width, height) {


    if (width === undefined || height === undefined) {

        //figure out texture size
        const image = texture.image;

        if (image !== undefined && image !== null) {
            if (width === undefined) {
                if (typeof image.width === "number") {
                    width = image.width;
                } else {
                    width = DEFAULT_TEXTURE_WIDTH;
                }
            }
            if (height === undefined) {
                if (typeof image.height === "number") {
                    height = image.height;
                } else {
                    height = DEFAULT_TEXTURE_HEIGHT;
                }
            }
        } else {
            if (width === undefined) {
                width = DEFAULT_TEXTURE_WIDTH;
            }

            if (height === undefined) {
                height = DEFAULT_TEXTURE_HEIGHT;
            }
        }

    }

    const renderer = WebGLRendererPool.global.get({});

    const ctx = renderer.getContext();

    //support for compressed textures
    ctx.getExtension("WEBGL_compressed_texture_s3tc");

    const built = ImageFilter(renderer, width, height, {
        vertexShader: CopyShader.vertexShader,
        fragmentShader: CopyShader.fragmentShader,
        uniforms: {
            tDiffuse: {
                value: texture,
                type: 't'
            },
            "opacity": { value: 1.0 }
        }
    });

    WebGLRendererPool.global.release(renderer);

    flipArrayInPlace(built.array, width, height);

    const sampler = new Sampler2D(built.array, 4, width, height);

    return sampler;
}
