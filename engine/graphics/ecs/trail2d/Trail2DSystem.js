/**
 * Created by Alex on 14/06/2017.
 */


import { System } from '../../../ecs/System.js';
import { Transform } from '../../../ecs/transform/Transform.js';
import Vector3 from '../../../../core/geom/Vector3.js';
import { clamp, computeHashFloat, computeHashIntegerArray, max2 } from '../../../../core/math/MathUtils.js';

import Trail2D, { Trail2DFlags } from './Trail2D.js';
import { ClampToEdgeWrapping, DoubleSide, LinearFilter, TextureLoader } from 'three';

import { LeafNode } from '../../../../core/bvh2/LeafNode.js';
import ThreeFactory from '../../three/ThreeFactory.js';
import { GraphicsEngine } from "../../GraphicsEngine.js";
import { ReferenceManager } from "../../../ReferenceManager.js";
import { AssetManager } from "../../../asset/AssetManager.js";
import { Cache } from "../../../../core/Cache.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";
import { RibbonXFixedPhysicsSimulator } from "../../trail/x/simulator/RibbonXFixedPhysicsSimulator.js";
import { RibbonX } from "../../trail/x/RibbonX.js";
import {
    RIBBON_ATTRIBUTE_ADDRESS_AGE,
    RIBBON_ATTRIBUTE_ADDRESS_UV_OFFSET
} from "../../trail/x/ribbon_attributes_spec.js";
import { RibbonMaterialX } from "../../trail/x/RibbonMaterialX.js";

const v3Temp1 = new Vector3();

const v3_array = [];

class Trail2DSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphics
     * @param {AssetManager} assetManager
     * @constructor
     */
    constructor(graphics, assetManager) {
        super();

        this.componentClass = Trail2D;
        this.dependencies = [Trail2D, Transform];

        if (!(graphics instanceof GraphicsEngine)) {
            throw new Error("'graphics' must be of type GraphicsEngine");
        }

        if (!(assetManager instanceof AssetManager)) {
            throw new Error("'assetManager' must be of type AssetManager");
        }

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphics = graphics;

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = assetManager;

        function constructTexture(url) {
            const assetPromise = assetManager.promise(url, "texture");

            const texturePromise = assetPromise
                .then(function (asset) {

                    const texture = asset.create();

                    texture.wrapS = ClampToEdgeWrapping;
                    texture.wrapT = ClampToEdgeWrapping;

                    texture.magFilter = LinearFilter;
                    texture.minFilter = LinearFilter;

                    return texture;
                });

            return texturePromise;
        }

        function destructTexture(url, texturePromise) {
            texturePromise.then(function (t) {
                //release used resourced
                t.dispose();
            });
        }

        /**
         *
         * @type {ReferenceManager<string,Promise.<THREE.Texture>>}
         */
        this.textures = new ReferenceManager(constructTexture, destructTexture);


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
         * @type {RibbonXFixedPhysicsSimulator}
         */
        this.simulator = new RibbonXFixedPhysicsSimulator();

        /**
         * @private
         * @readonly
         * @type {Cache<Trail2D, Material>}
         */
        this.materialCache = new Cache({
            maxWeight: 100,
            keyHashFunction(trail) {
                return computeHashIntegerArray(
                    computeStringHash(trail.textureURL),
                    computeHashFloat(trail.width),
                    computeHashFloat(trail.maxAge),
                    trail.color.hash()
                );
            },
            keyEqualityFunction(a, b) {
                return a.textureURL === b.textureURL
                    && a.width === b.width
                    && a.maxAge === b.maxAge
                    && a.color.equals(b.color)
                    ;
            }
        });


        /**
         *
         * @type {number}
         * @private
         */
        this.__timeDelta = 0;
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.entityManager = entityManager;

        this.renderLayer = this.graphics.layers.create('trail-2d-system');

        this.renderLayer.extractRenderable = function (trail) {
            return trail.mesh;
        };

        this.bvh = this.renderLayer.bvh;


        this.graphics.viewport.size.onChanged.add((x, y) => {
            this.entityManager.dataset.traverseComponents(Trail2D, trail => {
                trail.material.uniforms.resolution.value.set(x, y);
            });
        });

        readyCallback();
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.graphics.layers.remove(this.renderLayer);

        readyCallback();
    }

    /**
     *
     * @param {Trail2D} trail
     * @returns {Material}
     */
    obtainMaterial(trail) {

        const material = new RibbonMaterialX({
            transparent: true,
            depthWrite: false,
            wireframe: false,
            side: DoubleSide,
            defines: {
                USE_TEXTURE: false
            }
        });

        if (trail.textureURL !== null) {
            material.uniforms.uDiffuse.value = new TextureLoader().load(trail.textureURL);
            material.defines.USE_TEXTURE = true;
        }

        return material;
    }

    /**
     *
     * @param {Transform} transform
     * @param {Trail2D} trail
     * @param {number} entityId
     */
    link(trail, transform, entityId) {
        const segmentsPerSecond = 60;
        const maxSegments = 1000;
        //instantiation

        //make a mesh
        const numSegments = Math.ceil(clamp(trail.maxAge * segmentsPerSecond, 2, maxSegments));

        const ribbon = new RibbonX();

        ribbon.buildGeometry();
        ribbon.setCount(numSegments);


        const geometry = ribbon.getGeometry();

        const material = this.obtainMaterial(trail);

        material.uniforms.resolution.value.copy(this.graphics.viewport.size);

        const mesh = ThreeFactory.createMesh(geometry, material);

        trail.time = 0;
        trail.trailingIndex = 0;
        trail.ribbon = ribbon;
        trail.mesh = mesh;
        trail.timeSinceLastUpdate = 0;

        const leafNode = new LeafNode();

        trail.bvhLeaf = leafNode;
        trail.material = material;

        leafNode.object = trail;
        leafNode.setInfiniteBounds();

        const position = trail.offset.clone().add(transform.position);

        const color = trail.color;

        //initialize segments
        for (let i = 0; i < numSegments; i++) {
            const f = i / (numSegments - 1);

            ribbon.setPointColor(i, color.x * 255, color.y * 255, color.z * 255);
            ribbon.setPointPosition(i, position.x, position.y, position.z);
            ribbon.setPointThickness(i, trail.width);
            ribbon.setPointAttribute_Scalar(i, RIBBON_ATTRIBUTE_ADDRESS_UV_OFFSET, f);
            ribbon.setPointAlpha(i, color.w);
            ribbon.setPointAttribute_Scalar(i, RIBBON_ATTRIBUTE_ADDRESS_AGE, trail.maxAge);

        }

        leafNode.setBounds(position.x, position.y, position.z);

        this.bvh.insertNode(trail.bvhLeaf);
    }

    unlink(component, transform, entity) {
        component.bvhLeaf.disconnect();
    }

    /**
     *
     * @param {Trail2D} trail
     * @param {Transform} transform
     */
    updateTrailEntity(trail, transform) {
        const timeDelta = this.__timeDelta;

        /**
         *
         * @type {RibbonX|null}
         */
        const ribbon = trail.ribbon;

        const newPosition = v3Temp1;
        newPosition.copy(transform.position);
        newPosition.add(trail.offset);

        trail.timeSinceLastUpdate += timeDelta;
        trail.time += timeDelta;

        const ageOffset = max2(0, trail.maxAge - trail.time);

        if (trail.getFlag(Trail2DFlags.Spawning)) {
            const refitTimeDelta = trail.maxAge / trail.ribbon.getCount();


            if (trail.timeSinceLastUpdate >= refitTimeDelta) {

                ribbon.getPointPosition(v3_array, ribbon.getHeadIndex());

                if (newPosition.x !== v3_array[0] || newPosition.y !== v3_array[1] || newPosition.z !== v3_array[2]) {
                    //make sure that this is a new position before rotating new segment
                    trail.timeSinceLastUpdate = 0;
                    //rotating segment

                    ribbon.rotate();
                }
            }

            const head_index = ribbon.getHeadIndex();

            ribbon.setPointPosition(head_index, newPosition.x, newPosition.y, newPosition.z);

            //set head to fresh value
            ribbon.setPointAttribute_Scalar(head_index, RIBBON_ATTRIBUTE_ADDRESS_AGE, ageOffset);

        }

        ribbon.computeBoundingBox(trail.bvhLeaf);

        this.simulator.update(ribbon, trail.maxAge, timeDelta);
    }

    update(timeDelta) {

        const em = this.entityManager;

        const dataset = em.dataset;

        this.__timeDelta = timeDelta;

        if (dataset !== null) {
            dataset.traverseEntities([Trail2D, Transform], this.updateTrailEntity, this);
        }
    }
}

export default Trail2DSystem;
