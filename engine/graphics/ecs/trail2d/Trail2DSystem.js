/**
 * Created by Alex on 14/06/2017.
 */


import { System } from '../../../ecs/System.js';
import { Transform } from '../../../ecs/transform/Transform.js';
import Vector3 from '../../../../core/geom/Vector3.js';
import { clamp, computeHashFloat, computeHashIntegerArray, max2 } from '../../../../core/math/MathUtils.js';

import Trail2D, { Trail2DFlags } from './Trail2D.js';
import TrailMaterial from './CodeflowTrailMaterial.js';
import { BufferAttribute, ClampToEdgeWrapping, DynamicDrawUsage, LinearFilter, StaticDrawUsage } from 'three';
import Ribbon from '../../geometry/Ribbon.js';

import { LeafNode } from '../../../../core/bvh2/LeafNode.js';
import ThreeFactory from '../../three/ThreeFactory.js';
import { GraphicsEngine } from "../../GraphicsEngine.js";
import { ReferenceManager } from "../../../ReferenceManager.js";
import { AssetManager } from "../../../asset/AssetManager.js";
import { Cache } from "../../../../core/Cache.js";
import { computeStringHash } from "../../../../core/primitives/strings/StringUtils.js";

/**
 *
 * @param {Trail2D} component
 * @param {Vector2} size
 */
function setViewportSize(component, size) {
    const material = component.mesh.material;
    material.uniforms.viewport.value.set(size.x, size.y);
}

/**
 *
 * @param {number} numSegments
 * @returns {Ribbon}
 */
function createRibbon(numSegments) {

    const ribbon = new Ribbon(numSegments, 1);

    /**
     *
     * @type {BufferGeometry}
     */
    const geometry = ribbon.geometry;

    /*
     attribute vec3 last, current, next;
     attribute vec3 barycentric;
     attribute float off;
     attribute float uvOffset;
     */

    const position = geometry.attributes.position;
    const vertexCount = position.count;


    const last = new Float32Array(vertexCount * 3);
    const next = new Float32Array(vertexCount * 3);
    const off = new Int8Array(vertexCount);
    const uvOffset = new Float32Array(vertexCount);
    const age = new Float32Array(vertexCount);

    const aLast = new BufferAttribute(last, 3);
    const aNext = new BufferAttribute(next, 3);
    const aOff = new BufferAttribute(off, 1);
    const aUvOffset = new BufferAttribute(uvOffset, 1);
    const aAge = new BufferAttribute(age, 1);


    geometry.setAttribute("last", aLast);
    geometry.setAttribute("next", aNext);
    geometry.setAttribute("off", aOff);
    geometry.setAttribute("uvOffset", aUvOffset);
    geometry.setAttribute("age", aAge);


    aLast.needsUpdate = true;
    aNext.needsUpdate = true;
    aOff.needsUpdate = true;
    aUvOffset.needsUpdate = true;
    aAge.needsUpdate = true;
    aAge.usage = DynamicDrawUsage;


    //set offsets
    aOff.usage = StaticDrawUsage;

    //offset attribute
    geometry.setAttribute("off", aOff);

    ribbon.traverseEdges(function (a, b, index, maxIndex) {
        off[a] = 1;
        off[b] = -1;
    });

    return ribbon;
}

/**
 *
 * @param {string} url
 * @param {Material} material
 * @param {ReferenceManager<string,Promise.<THREE.Texture>>} textures
 */
function initializeTexture(url, material, textures) {
    if (url === null) {
        material.defines.USE_TEXTURE = false;
    } else {
        material.defines.USE_TEXTURE = true;

        textures.acquire(url).then(function (texture) {

            material.uniforms.uTexture.value = texture;

        });
    }

    material.needsUpdate = true;
}

/**
 *
 * @param {BufferAttribute} source
 * @param {int} sourceIndex
 * @param {BufferAttribute} target
 * @param {int} targetIndex
 * @param {int} count
 */
function copyAttributeValue(source, sourceIndex, target, targetIndex, count) {
    const targetArray = target.array;

    const sourceArray = source.array;

    for (let i = 0; i < count; i++) {
        targetArray[targetIndex + i] = sourceArray[sourceIndex + i];
    }
}

/**
 *
 * @param {BufferAttribute} source
 * @param {int} sourceIndex
 * @param {BufferAttribute} target
 * @param {int} targetIndex
 */
function copyAttributeV3(source, sourceIndex, target, targetIndex) {
    copyAttributeValue(source, sourceIndex * 3, target, targetIndex * 3, 3);
}

/**
 *
 * @param {BufferAttribute} first
 * @param {int} firstIndex
 * @param {BufferAttribute} second
 * @param {int} secondIndex
 * @param {int} count
 * @returns {boolean}
 */
function equalAttributeValue(first, firstIndex, second, secondIndex, count) {
    const firstArray = first.array;

    const secondArray = second.array;

    for (let i = 0; i < count; i++) {
        const vFirst = firstArray[firstIndex + i];
        const vSecond = secondArray[secondIndex + i];
        if (vFirst !== vSecond) {
            return false;
        }
    }

    return true;
}

/**
 *
 * @param {BufferAttribute} first
 * @param {int} firstIndex
 * @param {BufferAttribute} second
 * @param {int} secondIndex
 * @returns {boolean}
 */
function equalAttributeV3(first, firstIndex, second, secondIndex) {
    return equalAttributeValue(first, firstIndex * 3, second, secondIndex * 3, 3);
}

/**
 *
 * @param {Ribbon} ribbon
 */
function rotateRibbon(ribbon) {
    ribbon.rotate();

    const newHead = ribbon.head();
    const neck = newHead.previous;

    const geometry = ribbon.geometry;

    const attributes = geometry.attributes;

    const next = attributes.next;
    const prev = attributes.last;
    const position = attributes.position;


    //set head segment
    if (equalAttributeV3(position, neck.getA(), position, neck.getC())) {
        //neck had 0 length, clone "prev" from it
        copyAttributeV3(prev, newHead.getA(), prev, newHead.getC());
        copyAttributeV3(prev, newHead.getB(), prev, newHead.getD());
    } else {
        copyAttributeV3(position, newHead.getA(), prev, newHead.getC());
        copyAttributeV3(position, newHead.getB(), prev, newHead.getD());

    }


    next.needsUpdate = true;
    prev.needsUpdate = true;
}

const vPreviousPosition = new Vector3();

/**
 *
 * @param {Ribbon} ribbon
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function updateTipPosition(ribbon, x, y, z) {
    const geometry = ribbon.geometry;

    const attributes = geometry.attributes;
    const next = attributes.next;
    const prev = attributes.last;


    const head = ribbon.head();

    head.setVertexC(x, y, z);
    head.setVertexD(x, y, z);

    head.getVertexA(vPreviousPosition);

    //special case when new head is at the same place as the old one
    if (vPreviousPosition.x === x && vPreviousPosition.y === y && vPreviousPosition.z === z) {
        copyAttributeV3(prev, head.getA(), prev, head.getC());
        copyAttributeV3(prev, head.getB(), prev, head.getD());

        copyAttributeV3(next, head.getA(), next, head.getC());
        copyAttributeV3(next, head.getB(), next, head.getD());
    } else {
        //compute next offset from position
        let tX = x - vPreviousPosition.x + x;
        let tY = y - vPreviousPosition.y + y;
        let tZ = z - vPreviousPosition.z + z;

        //update head tip
        next.setXYZ(head.getC(), tX, tY, tZ);
        next.setXYZ(head.getD(), tX, tY, tZ);

        //update neck
        next.setXYZ(head.getA(), x, y, z);
        next.setXYZ(head.getB(), x, y, z);
    }

    next.needsUpdate = true;
    prev.needsUpdate = true;
}

const v3Temp0 = new Vector3();
const v3Temp1 = new Vector3();

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

        //
        this.dying = [];

        const self = this;
        //watch viewport size changes
        const viewportSize = this.graphics.viewport.size;
        viewportSize.onChanged.add(function () {
            const em = self.entityManager;
            if (em !== null && em !== undefined) {
                em.traverseComponents(Trail2D, function (component) {
                    setViewportSize(component, viewportSize);
                });
            }
        });

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
        let material = this.materialCache.get(trail);

        if (material === null) {

            material = new TrailMaterial();

            initializeTexture(trail.textureURL, material, this.textures);

            material.uniforms.color.value.copy(trail.color);
            material.uniforms.width.value = trail.width;
            material.uniforms.maxAge.value = trail.maxAge;

            material.needsUpdate = true;

            this.materialCache.put(trail, material);
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
        const numSegments = Math.ceil(clamp(trail.maxAge * segmentsPerSecond, 1, maxSegments));
        const ribbon = createRibbon(numSegments);
        const geometry = ribbon.geometry;

        const material = this.obtainMaterial(trail);

        const mesh = ThreeFactory.createMesh(geometry, material);

        trail.time = 0;
        trail.trailingIndex = 0;
        trail.ribbon = ribbon;
        trail.mesh = mesh;
        trail.timeSinceLastUpdate = 0;

        const leafNode = new LeafNode();

        trail.bvhLeaf = leafNode;

        leafNode.object = trail;
        leafNode.setInfiniteBounds();

        setViewportSize(trail, this.graphics.viewport.size);

        //set BVH bounds to a single point at transform's position to ensure better BVH placement
        // trail.bvhLeaf.setBounds(transform.position.x, transform.position.y, transform.position.z, transform.position.x, transform.position.y, transform.position.z);
        trail.bvhLeaf.setInfiniteBounds();

        const position = trail.offset.clone().add(transform.position);

        trail.ribbon.moveToPoint(position);
        const attributes = trail.ribbon.geometry.attributes;
        const last = attributes.last;
        const next = attributes.next;
        const age = attributes.age;
        trail.ribbon.traverseEdges(function (a, b) {
            next.setXYZ(a, position.x, position.y, position.z);
            next.setXYZ(b, position.x, position.y, position.z);

            last.setXYZ(a, position.x, position.y, position.z);
            last.setXYZ(b, position.x, position.y, position.z);

            age.array[a] = trail.maxAge;
            age.array[b] = trail.maxAge;
        });

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

        const ribbon = trail.ribbon;

        const newPosition = v3Temp1;
        newPosition.copy(transform.position);
        newPosition.add(trail.offset);

        trail.timeSinceLastUpdate += timeDelta;
        trail.time += timeDelta;

        const attributes = ribbon.geometry.attributes;

        /**
         *
         * @type {BufferAttribute}
         */
        const age = attributes.age;
        const ageArray = age.array;

        const ageOffset = max2(0, trail.maxAge - trail.time);

        if (trail.getFlag(Trail2DFlags.Spawning)) {
            const refitTimeDelta = trail.maxAge / trail.ribbon.length;


            if (trail.timeSinceLastUpdate < refitTimeDelta) {
                //refitting
            } else {

                const head = ribbon.head();

                head.getVertexA(v3Temp0);

                if (!v3Temp0.equals(newPosition)) {
                    //make sure that this is a new position before rotating new segment
                    trail.timeSinceLastUpdate -= refitTimeDelta;
                    //rotating segment
                    rotateRibbon(ribbon);
                }
            }

            const head = ribbon.head();

            updateTipPosition(ribbon, newPosition.x, newPosition.y, newPosition.z);

            //set head to fresh value
            ageArray[head.getC()] = ageOffset;
            ageArray[head.getD()] = ageOffset;

        }

        const ageArrayLength = ageArray.length;

        for (let i = 0; i < ageArrayLength; i++) {
            //make older
            ageArray[i] += timeDelta;
        }

        age.needsUpdate = true;
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
