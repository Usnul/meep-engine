import { System } from "../../../ecs/System.js";
import { ParticleEmitter } from "../particular/engine/emitter/ParticleEmitter.js";
import { ParticularEngine } from "../particular/engine/ParticularEngine.js";
import { StandardFrameBuffers } from "../../GraphicsEngine.js";
import { Transform } from "../../../ecs/transform/Transform.js";
import { Frustum } from "three";
import { ParticleEmitterFlag } from "../particular/engine/emitter/ParticleEmitterFlag.js";
import { RenderPassType } from "../../render/RenderPassType.js";
import { ParticleEmitterLibrary } from "../ParticleEmitterLibrary.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";

const frustum = new Frustum();

/**
 *
 * @param {ParticleEmitter} emitter
 * @returns {Group|Object3D}
 */
function extractRenderable(emitter) {


    return emitter.mesh;
}

/**
 *
 * @param {ParticleEmitter} emitter
 */
function putEmitterToSleep(emitter) {
    emitter.setFlag(ParticleEmitterFlag.Sleeping);
}

export class ParticleEmitterSystem2 extends System {
    /**
     *
     * @extends {System.<ParticleEmitter>}
     * @constructor
     * @param {AssetManager} assetManager
     * @param {GraphicsEngine} graphicsEngine
     */
    constructor(assetManager, graphicsEngine) {
        super();

        this.componentClass = ParticleEmitter;
        this.dependencies = [ParticleEmitter, Transform];

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphicsEngine = graphicsEngine;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        /**
         *
         * @type {ParticularEngine}
         */
        this.particleEngine = new ParticularEngine(assetManager);

        /**
         *
         * @type {RenderLayer|null}
         */
        this.renderLayer = null;

        /**
         *
         * @type {BinaryNode}
         */
        this.bvh = null;

        /**
         *
         * @type {ParticleEmitterLibrary}
         */
        this.library = new ParticleEmitterLibrary(assetManager);

        this.__handlers = [];
    }

    startup(entityManager, readyCallback, errorCallback) {
        const self = this;

        this.entityManager = entityManager;

        const graphicsEngine = this.graphicsEngine;

        const renderLayer = graphicsEngine.layers.create('particles-system');

        this.renderLayer = renderLayer;

        renderLayer.renderPass = RenderPassType.Transparent;

        renderLayer.extractRenderable = extractRenderable;
        renderLayer.visibleSet.onAdded.add((points) => {
            /**
             *
             * @type {ParticleEmitter}
             */
            const emitter = points.__meep_ecs_component;

            // wake up
            emitter.clearFlag(ParticleEmitterFlag.Sleeping);

            console.log('Added', emitter, renderLayer.visibleSet.version);
        });

        renderLayer.visibleSet.onRemoved.add((points) => {
            /**
             *
             * @type {ParticleEmitter}
             */
            const emitter = points.__meep_ecs_component;

            emitter.setFlag(ParticleEmitterFlag.Sleeping);

            console.log('Removed', emitter, renderLayer.visibleSet.version);
        });

        this.bvh = renderLayer.bvh;
        this.bvh.insertNode(this.particleEngine.bvh);


        const depthBuffer = graphicsEngine.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);

        const depthTexture = depthBuffer.renderTarget.depthTexture;

        this.particleEngine.setDepthTexture(depthTexture);


        function updateViewportSize() {
            const size = graphicsEngine.viewport.size;

            const pixelRatio = graphicsEngine.computeTotalPixelRatio();

            self.particleEngine.setViewportSize(size.x * pixelRatio, size.y * pixelRatio);
        }

        graphicsEngine.viewport.size.process(updateViewportSize);
        graphicsEngine.pixelRatio.onChanged.add(updateViewportSize);

        function preRenderHook(renderer, camera, scene) {
            //update camera
            self.particleEngine.setCamera(camera);
            //update shaders
            self.particleEngine.shaderManager.update();

            const visibleSet = renderLayer.visibleSet;
            const visibleEmitters = visibleSet.size;

            if (visibleEmitters > 0) {
                depthBuffer.referenceCount++;
                self.graphicsEngine.on.postRender.addOne(function () {
                    depthBuffer.referenceCount--;
                });
            }


            for (let i = 0; i < visibleEmitters; i++) {
                /**
                 *
                 * @type {Object3D}
                 */
                const points = visibleSet.elements[i];

                /**
                 *
                 * @type {ParticleEmitter}
                 */
                const emitter = points.__meep_ecs_component;


                //update particle geometry
                emitter.update();


                if (emitter.getFlag(ParticleEmitterFlag.DepthSorting)) {

                    /*
                     sort particles.

                     NOTE: It is important that update is done first before sort, as sort assumes that all particles in the
                     pool are alive. If this assumption is broken - corruption of the pool may occur
                     */
                    emitter.sort(camera);
                }
            }
        }

        graphicsEngine.on.preRender.add(preRenderHook);

        const library = this.library;

        this.assetManager.promise('data/database/particles/data.json', GameAssetType.JSON)
            .then(asset => {
                const particleSet = asset.create();

                return library.load(particleSet);
            })
            .then(readyCallback, errorCallback);
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphicsEngine.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {ParticleEmitter} emitter
     * @param {Transform} transform
     * @param entity
     */
    link(emitter, transform, entity) {
        function handlePositionChange(x, y, z) {
            emitter.position.set(x, y, z);
        }

        transform.position.process(handlePositionChange);

        function handleRotationChange(x, y, z, w) {
            emitter.rotation.set(x, y, z, w);
        }

        transform.rotation.process(handleRotationChange);

        function handleScaleChange(x, y, z) {
            emitter.scale.set(x, y, z);
        }

        transform.scale.process(handleScaleChange);

        this.__handlers[entity] = {
            handlePositionChange,
            handleRotationChange,
            handleScaleChange
        };

        //initialize emitter as suspended to prevent needless updates
        emitter.setFlag(ParticleEmitterFlag.Sleeping);

        // emitter.bvhLeaf.entity = entity; //this line makes emitter selectable via bounding box in editor

        this.particleEngine.add(emitter);
    }

    /**
     *
     * @param {ParticleEmitter} emitter
     * @param {Transform} transform
     * @param entity
     */
    unlink(emitter, transform, entity) {
        const handler = this.__handlers[entity];

        transform.position.onChanged.remove(handler.handlePositionChange);
        transform.rotation.onChanged.remove(handler.handleRotationChange);
        transform.scale.onChanged.remove(handler.handleScaleChange);

        delete this.__handlers[entity];

        this.particleEngine.remove(emitter);
    }

    update(timeDelta) {
        this.particleEngine.advance(timeDelta);
    }
}
