/**
 * Created by Alex on 17/02/2017.
 */
import { BackSide, Plane, PlaneBufferGeometry, Vector3 as ThreeVector3 } from 'three';
import { System } from '../../../ecs/System.js';
import Water from './Water.js';
import { Light } from '../light/Light.js';
import { Transform } from '../../../ecs/components/Transform.js';
import { LeafNode } from '../../../../core/bvh2/LeafNode.js';
import { buildPlanarRenderLayerClipPlaneComputationMethod } from "../../render/RenderLayerUtils.js";
import ThreeFactory from "../../three/ThreeFactory.js";
import { threeUpdateTransform } from "../../Utils.js";
import { NodeWaterShader } from "../water2/NodeWaterShader1.js";
import { NodeFrame } from "three/examples/jsm/nodes/core/NodeFrame.js";
import { StandardFrameBuffers } from "../../GraphicsEngine.js";
import { RenderPassType } from "../../render/RenderPassType.js";
import { obtainTerrain } from "../../../../../model/game/scenes/SceneUtils.js";

const WATER_SIZE = 800;

class WaterSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @constructor
     */
    constructor(graphics) {
        super();

        this.componentClass = Water;
        this.dependencies = [Water];

        this.graphicsEngine = graphics;

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

        //TODO override "computeFrustumClippingPlanes", this is a hack to get camera system to work as indeded when computing clipping planes
        //TODO come up with a less convoluted design

        this.cleaup = [];

        this.frame = new NodeFrame();

        /**
         *
         * @type {Water[]}
         */
        this.updateQueue = [];
    }


    shutdown(entityManager, readyCallback, errorCallback) {
        try {
            this.graphicsEngine.size.onChanged.remove(this.setViewportSize);

            this.graphicsEngine.layers.remove(this.renderLayer);

            readyCallback();
        } catch (e) {
            errorCallback(e);
        }
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphicsEngine.layers.create(WaterSystem.RENDER_LAYER_NAME);

        this.renderLayer.extractRenderable = function (component) {
            return component.__threeObject;
        };

        this.renderLayer.renderPass = RenderPassType.Transparent;

        /**
         *
         * @param {Frustum} frustum
         * @param {function(near:number, far:number)} visitor
         */
        this.renderLayer.computeNearFarClippingPlanes = buildPlanarRenderLayerClipPlaneComputationMethod(function (visitor) {

            /**
             *
             * @type {EntityComponentDataset}
             */
            const dataset = entityManager.dataset;

            /**
             *
             * @param {Water} water
             * @param entity
             */
            function componentVisitor(water, entity) {

                //determinate the plane
                const plane = new Plane(new ThreeVector3(0, 1, 0), water.level.getValue());

                visitor(plane);
            }

            dataset.traverseComponents(Water, componentVisitor);
        });


        this.bvh = this.renderLayer.bvh;


        const self = this;

        function preRenderHook(renderer, camera, scene) {

            const em = self.entityManager;

            const dataset = em.dataset;

            if (dataset === null) {
                return;
            }
            dataset.traverseComponents(Water, function (component, entity) {
                const shader = component.__shader;

                shader.cameraNear.value = camera.near;
                shader.cameraFar.value = camera.far;

            });
        }

        this.graphicsEngine.on.preRender.add(preRenderHook);

        readyCallback();
    }

    /**
     *
     * @param {Water} component
     * @param {number} entity
     */
    link(component, entity) {
        const frameBuffer = this.graphicsEngine.frameBuffers.getById(StandardFrameBuffers.ColorAndDepth);

        /**
         * @type {NodeWaterShader}
         */
        let water;

        if (component.__shader === null) {
            water = new NodeWaterShader(
                frameBuffer.renderTarget.depthTexture
            );

            component.__shader = water;

            component.writeColorToShader();

        } else {
            water = component.__shader;
        }

        water.level.value = component.level.getValue();

        const width = WATER_SIZE;
        const height = WATER_SIZE;

        water.textureRepeat.value.set(width / 6, height / 6);
        water.material.side = BackSide;

        /**
         * @type {Object3D}
         */
        let mesh;
        if (component.__threeObject === null) {
            const geometry = new PlaneBufferGeometry(width, height, 1, 1);

            mesh = ThreeFactory.createMesh(
                geometry,
                water.material
            );


            component.__threeObject = mesh;
        } else {
            mesh = component.__threeObject;
        }

        mesh.rotation.x = Math.PI * 0.5;
        mesh.position.x = width / 4;
        mesh.position.z = height / 4;
        mesh.position.y = component.level.getValue();

        threeUpdateTransform(mesh);

        const leafNode = new LeafNode(
            component,

            -width / 4,
            component.level.getValue(),
            -height / 4,
            width * (3 / 4),
            component.level.getValue(),
            height * (3 / 4)
        );

        component.bvh = leafNode;

        function processLevelValue(v, oldV) {
            mesh.position.y = v;
            threeUpdateTransform(mesh);

            leafNode.move(0, 0, v - oldV);

            water.level.value = v;
        }

        component.level.onChanged.add(processLevelValue);

        this.bvh.insertNode(leafNode);

        this.cleaup[entity] = function () {
            component.level.onChanged.remove(processLevelValue);
        };

        this.updateQueue.push(component);
    }

    unlink(component, entity) {
        component.bvh.disconnect();

        const cleaup = this.cleaup[entity];
        cleaup();
        delete this.cleaup[entity];


        //remove from update queue
        const i = this.updateQueue.indexOf(component);

        if (i !== -1) {
            this.updateQueue.splice(i, 1);
        }
    }

    processUpdateQueue() {

        //do updates
        const updateQueue = this.updateQueue;

        let l = updateQueue.length;

        if (l === 0) {
            return;
        }

        const dataset = this.entityManager.dataset;

        if (dataset === null) {
            return;
        }

        const terrain = obtainTerrain(dataset);

        if (terrain === null) {
            return;
        }

        for (let i = 0; i < l; i++) {
            const water = updateQueue[i];

            water.updateShaderForTerrain(terrain, WATER_SIZE);

            updateQueue.splice(i, 1);
            i--;
            l--;
        }
    }

    update(timeDelta) {
        const em = this.entityManager;

        const dataset = em.dataset;

        if (dataset === null) {
            return;
        }

        /**
         *
         * @type {WebGLRenderer}
         */
        const renderer = this.graphicsEngine.graphics;

        this.processUpdateQueue();

        const frame = this.frame;

        frame.setRenderer(renderer).update(timeDelta);

        dataset.traverseComponents(Water, function (component, entity) {
            const shader = component.__shader;
            const material = shader.material;

            if (material === undefined) {
                console.error('Mater undefined on WaterComponent', entity, component);
                //skip
                return;
            }

            frame.updateNode(material);

            dataset.traverseEntities([Light, Transform], function (light, transform, lightEntity) {
                if (light.type === Light.Type.DIRECTION && light.castShadow) {
                    //stop traversal
                    return false;
                }
            });
        });
    }
}


WaterSystem.RENDER_LAYER_NAME = 'water-system';

export default WaterSystem;
