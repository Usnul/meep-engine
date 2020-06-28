/**
 * Created by Alex on 14/03/14.
 */


import {
    CubeTextureLoader,
    DepthTexture,
    Group,
    NearestFilter,
    NoToneMapping,
    Raycaster as ThreeRaycaster,
    RGBFormat,
    Scene as ThreeScene,
    sRGBEncoding,
    UnsignedShortType,
    Vector3 as ThreeVector3,
    VSMShadowMap,
    WebGLRenderer,
    WebGLRenderTarget
} from 'three';

import Signal from '../../core/events/signal/Signal.js';

import { BinaryNode } from '../../core/bvh2/BinaryNode.js';

import Postprocess from "./postprocess/Postprocess.js";

import LayerCompositer from './composit/LayerCompositer.js';
import { Camera } from "./ecs/camera/Camera.js";
import View from "../../view/View.js";
import EmptyView from "../../view/elements/EmptyView.js";
import { assert } from "../../core/assert.js";
import Vector2 from "../../core/geom/Vector2.js";
import { RenderLayerManager } from "./render/layers/RenderLayerManager.js";
import { FrameBufferManager } from "./render/buffer/FrameBufferManager.js";
import { VisibilityComputer } from "./render/visibility/VisibilityComputer.js";
import { ColorAndDepthFrameBuffer } from "./render/buffer/buffers/ColorAndDepthFrameBuffer.js";
import { RenderPassType } from "./render/RenderPassType.js";
import { renderTextureToScreenQuad } from "./render/utils/renderTextureToScreenQuad.js";
import { globalMetrics } from "../metrics/GlobalMetrics.js";
import { MetricsCategory } from "../metrics/MetricsCategory.js";
import { max2 } from "../../core/math/MathUtils.js";
import Vector1 from "../../core/geom/Vector1.js";

/**
 *
 * @enum {string}
 */
export const StandardFrameBuffers = {
    Depth: 'depth',
    ColorAndDepth: 'color-and-depth'
};

/**
 *
 * @param {String} path
 * @param {String} format
 * @returns {String[]}
 */
function buildCubeURLs(path, format) {
    return [
        path + 'posx' + format, path + 'negx' + format,
        path + 'posy' + format, path + 'negy' + format,
        path + 'posz' + format, path + 'negz' + format
    ];
}

/**
 *
 * @param {WebGLRenderer} webGLRenderer
 */
function configureThreeRenderer(webGLRenderer) {

    webGLRenderer.autoClear = false;
    webGLRenderer.setClearColor(0xBBBBFF, 0.0);
    webGLRenderer.outputEncoding = sRGBEncoding;
    webGLRenderer.toneMapping = NoToneMapping;
    // webGLRenderer.toneMappingExposure = 1.3;

    webGLRenderer.state.setFlipSided(false);

    webGLRenderer.shadowMap.enabled = true;
    webGLRenderer.shadowMap.type = VSMShadowMap;

    webGLRenderer.sortObjects = true;

    //turn off automatic info reset, we use multi-pass rendering, so we manually reset the render info
    webGLRenderer.info.autoReset = false;

    if (ENV_PRODUCTION) {
        //disable shader error checking in production build
        webGLRenderer.debug.checkShaderErrors = false;
    } else {
        webGLRenderer.debug.checkShaderErrors = true;
    }
}


/**
 *
 * @param {Camera} camera
 * @param {EntityManager} entityManger
 * @constructor
 */
function GraphicsEngine(camera, entityManger) {
    const self = this;

    this.entityManager = entityManger;

    this.postprocessingEnabled = false;

    this.on = {
        preRender: new Signal(),
        postRender: new Signal(),

        preComposite: new Signal(),
        postComposite: new Signal(),

        buffersRendered: new Signal(),
        visibilityConstructionStarted: new Signal(),
        visibilityConstructionEnded: new Signal()
    };

    /**
     * @type {Vector1}
     */
    this.pixelRatio = new Vector1(1);

    /**
     *
     * @type {RenderLayerManager}
     */
    this.layers = new RenderLayerManager();

    /**
     *
     * @type {BinaryNode}
     */
    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();

    //renderer setup
    const scene = new ThreeScene();
    //prevent automatic updates to all descendants of the scene, such updates are very wasteful
    scene.autoUpdate = false;
    //prevent scene matrix from automatically updating, as it would result in updates to the entire scene graph
    scene.matrixAutoUpdate = false;
    //setup environment
    const cubeTextureLoader = new CubeTextureLoader();

    const envMap = cubeTextureLoader.load(buildCubeURLs("data/textures/cubemaps/hip_miramar/32/", '.png'));

    scene.environment = envMap;


    /**
     *
     * @type {Scene}
     */
    this.scene = scene;


    /**
     *
     * @type {Group}
     */
    this.visibleGroup = new Group();
    this.visibleGroup.matrixAutoUpdate = false;

    /**
     *
     * @type {VisibilityComputer}
     */
    this.visibilitySet = new VisibilityComputer();

    this.scene.add(this.visibleGroup);

    /**
     *
     * @type {Camera}
     */
    this.camera = camera;

    this.graphics = null;

    //webGLRenderer.shadowMapDebug = true;
    this.layerComposer = new LayerCompositer();

    this.initGUI = function (folder) {
        const ge = this;
        if (ge.effects === void 0) {
            return;
        }
        ge.effects.initializeGUI(folder);
    };

    Object.defineProperties(this, {
        info: {
            get: function () {
                return self.graphics.info;
            }
        }
    });

    /**
     * @type {View}
     */
    this.viewport = new EmptyView();
    this.viewport.size.onChanged.add(this.updateSize, this);
    this.pixelRatio.onChanged.add(this.updateSize, this);

    this.frameBuffers = new FrameBufferManager();
}

GraphicsEngine.prototype.updateSize = function () {
    const size = this.viewport.size;

    const renderer = this.graphics;

    const pixelRatio = this.pixelRatio.getValue();

    const _w = max2(0, size.x * pixelRatio);
    const _h = max2(0, size.y * pixelRatio);

    renderer.setSize(_w, _h);
    renderer.setPixelRatio(window.devicePixelRatio);


    renderer.domElement.style.width = size.x + 'px';
    renderer.domElement.style.height = size.y + 'px';


    this.layerComposer.setSize(_w, _h);
    this.frameBuffers.setSize(_w, _h);

    this.frameBuffers.setPixelRatio(window.devicePixelRatio);
};

/**
 *
 * @returns {number}
 */
GraphicsEngine.prototype.computeTotalPixelRatio = function () {
    return this.pixelRatio.getValue() * window.devicePixelRatio;
};

GraphicsEngine.prototype.initializeFrameBuffers = function () {
    const viewportSize = this.viewport.size;

    const target = new WebGLRenderTarget(viewportSize.x, viewportSize.y);
    target.texture.format = RGBFormat;
    target.texture.minFilter = NearestFilter;
    target.texture.magFilter = NearestFilter;
    target.texture.generateMipmaps = false;
    target.stencilBuffer = false;
    target.depthBuffer = true;
    target.depthTexture = new DepthTexture(viewportSize.x, viewportSize.y);
    target.depthTexture.type = UnsignedShortType;

    const colorAndDepthFrameBuffer = new ColorAndDepthFrameBuffer(StandardFrameBuffers.ColorAndDepth);

    //whole renderer relies on color+depth buffer, so we flag it as always in use to ensure it's always being drawn
    colorAndDepthFrameBuffer.referenceCount += 1;

    this.frameBuffers.add(colorAndDepthFrameBuffer);

    //initialize buffers
    this.frameBuffers.initialize(this.graphics);
};

/**
 * @returns {Texture}
 */
GraphicsEngine.prototype.getDepthTexture = function () {
    const frameBuffer = this.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);
    return frameBuffer.renderTarget.depthTexture;
};

GraphicsEngine.prototype.start = function () {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('webgl2', { antialias: false });

    const rendererParameters = {
        antialias: true,
        logarithmicDepthBuffer: false,
        canvas,
        context
    };

    const webGLRenderer = this.graphics = new WebGLRenderer(rendererParameters);
    //print GPU info
    const GPU_NAME = this.getGPUName();

    console.log('GL renderer : ', GPU_NAME);

    globalMetrics.record("gpu-type", {
        category: MetricsCategory.System,
        label: GPU_NAME
    });


    webGLRenderer.domElement.addEventListener('webglcontextrestored', function (event) {
        console.warn('webgl cotnext restored', event);
    }, false);

    webGLRenderer.domElement.addEventListener('webglcontextlost', function (event) {
        // By default when a WebGL program loses the context it never gets it back.  To recover, we prevent default behaviour
        event.preventDefault();

        console.warn('webgl context lost', event);
    }, false);

    const domElement = this.domElement = webGLRenderer.domElement;
    //disable selection
    const style = domElement.style;
    domElement.classList.add('graphics-engine-render-canvas');
    style.userSelect = style.webkitUserSelect = style.mozUserSelect = "none";
    // see : https://www.w3.org/TR/pointerevents/#the-touch-action-css-property
    style.touchAction = "none";

    configureThreeRenderer(webGLRenderer);

    this.enableExtensions();

    this.initializeFrameBuffers();


    const viewport = this.viewport;
    const viewportSize = viewport.size;

    if (this.postprocessingEnabled) {
        this.effects = new Postprocess(this.scene, this.camera, this.graphics);

        try {
            this.effects.init(this.mainLayer);
            this.effects.setViewPortSize(viewportSize.x, viewportSize.y);
        } catch (e) {
            console.error("Failed to initialize post processing", e);
        }
    }

    //initialize size
    webGLRenderer.setSize(viewportSize.x, viewportSize.y);
    this.frameBuffers.setSize(viewportSize.x, viewportSize.y);

    viewport.el = webGLRenderer.domElement;
};

/**
 * Produces GPU identification string via WebGL extension if available
 * @returns {string}
 */
GraphicsEngine.prototype.getGPUName = function () {
    const gl = this.graphics.getContext();

    const ext = gl.getExtension("WEBGL_debug_renderer_info");

    if (ext === null) {
        return "Unknown";
    }

    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
};
/**
 * Shut down graphics engine. After calling this method the engine may no longer be used.
 */
GraphicsEngine.prototype.stop = function () {
    const renderer = this.graphics;
    if (renderer !== undefined) {
        renderer.forceContextLoss();
        renderer.context = null;
        renderer.domElement = null;
        this.graphics = null;
    }
};


/**
 * Enables various WebGL extensions required by the engine
 */
GraphicsEngine.prototype.enableExtensions = function () {
    const ctx = this.graphics.getContext();
    // Standard derivatives are required for Terrain Shader
    ctx.getExtension("OES_standard_derivatives");
    // Depth texture is required for Particle Emitter engine
    ctx.getExtension("WEBGL_depth_texture");
    ctx.getExtension("WEBGL_compressed_texture_s3tc");

};

/**
 * Creates a ray from viewport orthogonally into the view frustum
 * @param {number} x
 * @param {number} y
 * @param {Vector3} source Ray source is written here
 * @param {Vector3} target Ray target is written here
 */
GraphicsEngine.prototype.viewportProjectionRay = function viewportProjectionRay(x, y, source, target) {
    Camera.projectRay(this.camera, x, y, source, target);
};

GraphicsEngine.prototype.intersectObjectUnderViewportPoint = (function () {
    const point = new ThreeVector3();
    const raycaster = new ThreeRaycaster();
    const origin = new ThreeVector3();

    function intersectObject(x, y, object, recurse) {
        this.viewportProjectionRay(x, y, origin, point);
        //
        raycaster.set(origin, point);
        //console.log(x,y,point.x, point.y, point.z);
        return raycaster.intersectObject(object, recurse);
    }

    return intersectObject;
})();

/**
 * Converts screen-space pixel position to normalized clip-space
 * @param {Vector2|Vector3} input
 * @param {Vector2|Vector3} result
 */
GraphicsEngine.prototype.normalizeViewportPoint = function (input, result) {
    assert.notEqual(input, undefined);
    assert.notEqual(result, undefined);

    const viewportSize = this.viewport.size;

    result.x = (input.x / viewportSize.x) * 2 - 1;
    result.y = -(input.y / viewportSize.y) * 2 + 1;
};

/**
 * Compute size of viewport in world-space
 * @param {PerspectiveCamera} camera
 * @param {number} zDistance
 * @param {Vector2} result
 * @returns {Vector2}
 */
GraphicsEngine.prototype.viewportWorldSize = function (camera, zDistance, result) {
    const size = this.viewport.size;
    const angleY = camera.fov * (Math.PI / 180);
    const cameraZ = camera.position.z;
    const distFromCamToPlane = Math.abs(cameraZ) + zDistance;

    const planeHeight = Math.tan((angleY * 0.5)) * distFromCamToPlane * 2;
    const aspectRatio = size.x / size.y;
    const planeWidth = planeHeight * aspectRatio;

    result.x = planeWidth;
    result.y = planeHeight;
    return result;
};

GraphicsEngine.prototype.constructVisibleScene = function (renderer, camera, scene) {
    this.on.visibilityConstructionStarted.dispatch(renderer, camera, scene);

    const visibilitySet = this.visibilitySet;

    visibilitySet.setCamera(camera);

    visibilitySet.build(this.layers);

    this.on.visibilityConstructionEnded.dispatch(renderer, camera, scene);
};

GraphicsEngine.prototype.clearVisibleGroup = function () {
    this.visibleGroup.children.length = 0;
};

/**
 *
 * @param {RenderPassType} passType
 */
GraphicsEngine.prototype.prepareRenderPass = function (passType) {

    this.clearVisibleGroup();

    const visibleGroup = this.visibleGroup;

    let j = 0;

    this.layers.traverse(layer => {
        if (layer.renderPass !== passType) {
            return;
        }

        /**
         *
         * @type {Object3D[]}
         */
        const visibleSet = layer.visibleSet.elements;

        const visibleSetSize = visibleSet.length;

        for (let i = 0; i < visibleSetSize; i++) {
            const object3D = visibleSet[i];

            //insert object, bypassing Object#add for speed
            //visibleGroup.add(object3D);
            object3D.parent = visibleGroup;
            visibleGroup.children[j++] = object3D;
        }

    });

    visibleGroup.length = j;
};

/**
 * Renders opaque assets
 */
GraphicsEngine.prototype.renderOpaque = function () {
    this.prepareRenderPass(RenderPassType.Opaque);

    const renderer = this.graphics;

    this.frameBuffers.render(renderer, this.camera, this.scene);

    const frameBuffer = this.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);

    renderTextureToScreenQuad(frameBuffer.renderTarget.texture, renderer);
};

/**
 * Renders assets that (may) contain transparent fragments
 */
GraphicsEngine.prototype.renderTransparent = function () {
    this.prepareRenderPass(RenderPassType.Transparent);

    const renderer = this.graphics;

    renderer.render(this.scene, this.camera);
};

/**
 *
 * @param {WebGLRenderTarget} [renderTarget] if not present - renders to screen
 */
GraphicsEngine.prototype.render = function (renderTarget) {

    const renderer = this.graphics;

    //reset renderer statistics (used for debug)
    renderer.info.reset();

    renderer.autoClear = false;
    renderer.clearAlpha = 0;

    //render actual scene
    const scene = this.scene;

    if (scene.children.indexOf(this.camera) < 0) {
        console.log("added camera");
        scene.add(this.camera);
    }

    const camera = this.camera;

    this.constructVisibleScene(renderer, camera, scene);

    //dispatch pre-render event
    this.on.preRender.dispatch(renderer, camera, scene);

    //do the opaque pass
    this.renderOpaque();

    this.on.buffersRendered.dispatch(renderer, camera, scene);

    this.renderTransparent();

    if (this.postprocessingEnabled) {
        this.effects.render(renderer, camera, scene, 0.017);

        this.on.preComposite.send3(renderer, camera, scene);

        this.layerComposer.composite(renderer);

        this.on.postComposite.send3(renderer, camera, scene);

    } else {

        if (renderTarget !== undefined) {
            renderer.setRenderTarget(renderTarget);
        }

        this.on.preComposite.send3(renderer, camera, scene);

        this.layerComposer.composite(renderer);

        this.on.postComposite.send3(renderer, camera, scene);

        if (renderTarget !== undefined) {
            renderer.setRenderTarget(null);
        }
    }

    //dispatch post-render event
    this.on.postRender.dispatch(renderer, camera, scene);
};
export { GraphicsEngine };
