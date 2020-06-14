import { WebGLRenderer } from 'three';
import { assert } from "../../../core/assert.js";

function WebGLRendererPool() {
    this.used = new Set();
}

WebGLRendererPool.prototype.get = function (options) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('webgl2', { antialias: true });

    const renderer = new WebGLRenderer({
        alpha: true,
        context,
        canvas
    });

    assert.equal(renderer.domElement, canvas, 'renderer.domElement !== canvas');

    this.used.add(renderer);
    return renderer;
};

/**
 *
 * @param {THREE.WebGLRenderer} renderer
 * @returns {boolean}
 */
WebGLRendererPool.prototype.release = function (renderer) {
    if (!this.used.has(renderer)) {
        //not from this pool
        return false;
    }
    this.used.delete(renderer);

    renderer.forceContextLoss();
    renderer.dispose();
    renderer.domElement = null;

    return true;
};

WebGLRendererPool.global = new WebGLRendererPool();


export {
    WebGLRendererPool
};
