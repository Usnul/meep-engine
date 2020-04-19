import { FrameBuffer } from "../FrameBuffer.js";
import { DepthTexture, FloatType, NearestFilter, RGBFormat, sRGBEncoding, Vector2, WebGLRenderTarget } from "three";

/**
 *
 * @param {WebGL2RenderingContext|WebGLRenderingContext} context
 * @returns {boolean}
 */
function isWebGL2(context) {
    if (WebGL2RenderingContext === undefined) {
        return false;
    }

    if (context instanceof WebGL2RenderingContext) {
        return true;
    }

    return false;
}

export class ColorAndDepthFrameBuffer extends FrameBuffer {
    initialize(renderer) {

        //attach depth buffer
        if (!isWebGL2(renderer.getContext()) && !renderer.extensions.get('WEBGL_depth_texture')) {
            //missing depth texture extension
            throw new Error(`renderer does not support required 'WEBGL_depth_texture' extension`);
        }

        const size = new Vector2();

        renderer.getSize(size);

        const target = new WebGLRenderTarget(size.x, size.y);

        target.texture.format = RGBFormat;
        target.texture.minFilter = NearestFilter;
        target.texture.magFilter = NearestFilter;
        target.texture.generateMipmaps = false;
        target.texture.encoding = sRGBEncoding;

        target.stencilBuffer = false;
        target.depthBuffer = true;
        target.depthTexture = new DepthTexture();
        target.depthTexture.type = FloatType;
        target.depthTexture.internalFormat = 'DEPTH_COMPONENT32F';

        this.renderTarget = target;
    }
}
