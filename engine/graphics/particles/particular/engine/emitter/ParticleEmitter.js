import Vector3 from "../../../../../../core/geom/Vector3.js";
import List from "../../../../../../core/collection/list/List.js";
import { ParticleAttributeType, ParticleDataType } from "../../group/ParticleGroup.js";
import {
    randomPointInBox,
    randomPointInPoint,
    randomPointInSphere,
    randomPointOnBox,
    randomPointOnSphere
} from "../../../../../../core/geom/GeometryMath.js";
import { Box3, BufferGeometry, Frustum, Matrix4, Points, PointsMaterial } from 'three';
import { frustumFromCamera } from "../../../../ecs/camera/CameraSystem.js";
import { ParticlePool } from "./ParticlePool.js";
import { ParticleParameter } from "../parameter/ParticleParameter.js";
import { ParameterSet } from "../parameter/ParameterSet.js";
import { assert } from "../../../../../../core/assert.js";
import { LeafNode } from "../../../../../../core/bvh2/LeafNode.js";
import { EmissionFromType, EmissionShapeType, ParticleLayer } from "./ParticleLayer.js";
import { ParticleParameters } from "./ParticleParameters.js";
import { BlendingType } from "../../../../texture/sampler/BlendingType.js";
import Quaternion from "../../../../../../core/geom/Quaternion.js";
import { computeHashIntegerArray, lerp, max2, min2 } from "../../../../../../core/math/MathUtils.js";
import { ParticleSpecification } from "../../group/ParticleSpecification.js";
import { ParticleAttribute } from "../../group/ParticleAttribute.js";
import { composeMatrix4 } from "../../../../Utils.js";
import { ParticleEmitterFlag } from "./ParticleEmitterFlag.js";
import { AABB3 } from "../../../../../../core/bvh2/AABB3.js";

const EMPTY_GEOMETRY = new BufferGeometry();

const PARTICLE_ATTRIBUTE_POSITION = 0;
const PARTICLE_ATTRIBUTE_AGE = 1;
const PARTICLE_ATTRIBUTE_DEATH_AGE = 2;
const PARTICLE_ATTRIBUTE_UV = 3;
const PARTICLE_ATTRIBUTE_SIZE = 4;
const PARTICLE_ATTRIBUTE_LAYER_POSITION = 5;
const PARTICLE_ATTRIBUTE_VELOCITY = 6;
const PARTICLE_ATTRIBUTE_ROTATION = 7;
const PARTICLE_ATTRIBUTE_ROTATION_SPEED = 8;


const SERIALIZABLE_FLAGS = ParticleEmitterFlag.PreWarm
    | ParticleEmitterFlag.DepthSorting
    | ParticleEmitterFlag.DepthReadDisabled
    | ParticleEmitterFlag.DepthSoftDisabled
    | ParticleEmitterFlag.AlignOnVelocity
;

/**
 * Used to store AABB3 corners during bounding box calculation
 * @readonly
 * @type {Float64Array}
 */
const corners = new Float64Array(24);

/**
 *
 * @param {EmissionFromType} emissionType
 * @param {EmissionShapeType} emissionShape
 * @returns {function(random: function, result:Vector3):void}
 */
function computeEmissionFunction(emissionType, emissionShape) {
    if (emissionShape === EmissionShapeType.Point) {
        return randomPointInPoint;
    } else if (emissionShape === EmissionShapeType.Sphere) {
        if (emissionType === EmissionFromType.Volume) {
            return randomPointInSphere;
        } else if (emissionType === EmissionFromType.Shell) {
            return randomPointOnSphere;
        } else {
            throw new TypeError(`Unsupported EmissionFrom Type`);
        }
    } else if (emissionShape === EmissionShapeType.Box) {
        if (emissionType === EmissionFromType.Volume) {
            return randomPointInBox;
        } else if (emissionType === EmissionFromType.Shell) {
            return randomPointOnBox;
        } else {
            throw new TypeError(`Unsupported EmissionFrom Type`);
        }
    }
}

/**
 *
 * @param {number} index
 * @param {number[]|Float32Array} positionArray
 * @param {Vector3} planeNormal
 * @return {number}
 */
function distanceToCamera(index, positionArray, planeNormal) {
    const address = index * 3;

    // extract position components of the particle
    const x = positionArray[address];
    const y = positionArray[address + 1];
    const z = positionArray[address + 2];

    const planeNormalX = planeNormal.x;
    const planeNormalY = planeNormal.y;
    const planeNormalZ = planeNormal.z;

    // compute dot product
    const dot = x * planeNormalX + y * planeNormalY + z * planeNormalZ;

    // use dot product instead of the actual distance to save computation. Difference is going to be constant
    return dot;
}

/**
 *
 * @param {ParameterSet} parameters
 */
function generateStandardParameterSet(parameters) {
    const pScale = new ParticleParameter(ParticleParameters.Scale, 1);
    pScale.setDefault([1], [0]);

    const pColor = new ParticleParameter(ParticleParameters.Color, 4);
    pColor.setDefault([1, 1, 1, 1], [0]);

    parameters.add(pScale);
    parameters.add(pColor);
}

export class ParticleEmitter {
    constructor() {
        /**
         * @type {ParameterSet}
         */
        this.parameters = new ParameterSet();
        generateStandardParameterSet(this.parameters);


        /**
         * @private
         * @type {List<ParticleLayer>}
         */
        this.layers = new List();

        /**
         *
         * @type {Vector3}
         */
        this.position = new Vector3(0, 0, 0);
        this.scale = new Vector3(1, 1, 1);
        this.rotation = new Quaternion(0, 0, 0, 1);

        /**
         *
         * @type {Vector3}
         * @private
         */
        this.__lastSpawnPosition = new Vector3(0, 0, 0);

        this.sleepTime = 0;

        /**
         *
         * @type {BlendingType|number}
         */
        this.blendingMode = BlendingType.Normal;

        /**
         *
         * @type {ParticlePool|null}
         */
        this.particles = null;

        /**
         *
         * @type {Object3D|null}
         */
        this.mesh = null;


        /**
         *
         * @type {LeafNode}
         */
        this.bvhLeaf = new LeafNode(this, 0, 0, 0, 0, 0, 0);


        /**
         *
         * @type {AABB3}
         */
        this.particleBounds = new AABB3(Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity);

        /**
         *
         * @type {AABB3}
         */
        this.emisionBounds = new AABB3(0, 0, 0, 0, 0, 0);

        this.position.onChanged.add(this.updateTransform, this);
        this.scale.onChanged.add(this.updateTransform, this);
        this.rotation.onChanged.add(this.updateTransform, this);

        /**
         * Bit Field of {@link ParticleEmitterFlag}
         * @type {number}
         */
        this.flags = ParticleEmitterFlag.DepthSorting | ParticleEmitterFlag.HashNeedUpdate | ParticleEmitterFlag.Emitting;

        /**
         *
         * @type {number}
         * @private
         */
        this.__hash = 0;
    }

    updateTransform() {
        this.setFlag(ParticleEmitterFlag.BaseBoundsNeedUpdate);

        this.computeBoundingBox();
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @param {boolean} value
     */
    writeFlag(flag, value) {
        if (value) {
            this.setFlag(flag);
        } else {
            this.clearFlag(flag);
        }
    }

    /**
     *
     * @param {number|ParticleEmitterFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     * @private
     */
    registerLayerParameters() {
        const self = this;
        this.parameters.setTrackCount(this.layers.length);
        this.layers.forEach(function (layer, index) {
            self.parameters.setTracks(index, layer.parameterTracks);
        });
    }

    toJSON() {
        return {
            position: this.position.toJSON(),
            scale: this.scale.toJSON(),
            rotation: this.rotation.toJSON(),
            parameters: this.parameters.toJSON(),
            preWarm: this.getFlag(ParticleEmitterFlag.PreWarm),
            readDepth: !this.getFlag(ParticleEmitterFlag.DepthReadDisabled),
            softDepth: !this.getFlag(ParticleEmitterFlag.DepthSoftDisabled),
            velocityAlign: this.getFlag(ParticleEmitterFlag.AlignOnVelocity),
            blendingMode: this.blendingMode,
            layers: this.layers.toJSON()
        };
    }

    fromJSON(json) {
        if (typeof json.blendingMode === "number") {
            this.blendingMode = json.blendingMode;
        } else {
            this.blendingMode = BlendingType.Normal;
        }

        if (json.position !== undefined) {
            this.position.fromJSON(json.position);
        }

        if (json.scale !== undefined) {
            this.scale.fromJSON(json.scale);
        }

        if (json.rotation !== undefined) {
            this.rotation.fromJSON(json.rotation);
        }

        if (json.parameters !== undefined) {
            this.parameters.fromJSON(json.parameters);
        }

        if (typeof json.preWarm === "boolean") {
            this.writeFlag(ParticleEmitterFlag.PreWarm, json.preWarm);
        } else {
            this.writeFlag(ParticleEmitterFlag.PreWarm, false);
        }

        if (typeof json.readDepth === 'boolean') {
            this.writeFlag(ParticleEmitterFlag.DepthReadDisabled, !json.readDepth);
        } else {
            this.writeFlag(ParticleEmitterFlag.DepthReadDisabled, false);
        }

        if (typeof json.softDepth === 'boolean') {
            this.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, !json.softDepth);
        } else {
            this.writeFlag(ParticleEmitterFlag.DepthSoftDisabled, false);
        }

        if (typeof json.velocityAlign === "boolean") {
            this.writeFlag(ParticleEmitterFlag.AlignOnVelocity, json.velocityAlign);
        } else {
            this.writeFlag(ParticleEmitterFlag.AlignOnVelocity, false);
        }

        this.layers.fromJSON(json.layers, ParticleLayer);

        this.writeFlag(ParticleEmitterFlag.Built, false);
        this.setFlag(ParticleEmitterFlag.Emitting);

        //register loaded layers
        this.registerLayerParameters();
    }


    /**
     *
     * @param {ParticleLayer} layer
     */
    addLayer(layer) {
        this.layers.add(layer);

        const numLayers = this.layers.length;
        this.parameters.setTrackCount(numLayers);

        this.parameters.setTracks(numLayers - 1, layer.parameterTracks);
    }

    /**
     *
     * @param {function(layer:ParticleLayer,index:number)} visitor
     * @param {*} [thisArg]
     */
    traverseLayers(visitor, thisArg) {
        const layers = this.layers;

        const l = layers.length;

        for (let i = 0; i < l; i++) {
            const layer = layers.get(i);

            visitor.call(thisArg, layer, i);
        }
    }

    /**
     * Causes all active particles from a given layer to be destroyed immediately
     * @param {ParticleLayer} layer
     * @return {number} number of particles destroyed
     */
    destroyParticlesFromLayer(layer) {
        const layers = this.layers;

        const targetLayerIndex = layers.indexOf(layer);

        if (targetLayerIndex === -1) {
            //layer doesn't exist
            throw new Error('Layer not found');
        }

        const numLayers = layers.length;

        const particles = this.particles;
        const occupancy = particles.occupancy;

        let removeCount = 0;

        for (let i = occupancy.nextSetBit(0); i !== -1; i = occupancy.nextSetBit(i + 1)) {
            const layerPosition = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const layerIndex = Math.round(layerPosition * numLayers);

            if (layerIndex !== targetLayerIndex) {
                // not the layer we want
                continue;
            }

            //destroy the particle
            occupancy.set(i, false);

            removeCount++;
        }

        if (removeCount > 0) {
            //remove dead particles from the pool
            particles.compact();
        }

        return removeCount;
    }

    computeEmissionBounds() {

        let bounds_x0 = Infinity;
        let bounds_y0 = Infinity;
        let bounds_z0 = Infinity;

        let bounds_x1 = -Infinity;
        let bounds_y1 = -Infinity;
        let bounds_z1 = -Infinity;

        const layers = this.layers;
        const numLayers = layers.length;

        const position = this.position;
        const rotation = this.rotation;
        const scale = this.scale;

        composeMatrix4(matrix4, position, rotation, scale);

        const m4 = matrix4.elements;

        for (let i = 0; i < numLayers; i++) {
            const particleLayer = layers.get(i);

            particleLayer.computeBoundsAttributes();

            const s_2 = particleLayer.scaledSpriteHalfSize;

            const baseBoundingBox = particleLayer.baseBoundingBox;
            baseBoundingBox.getCorners(corners);

            for (let j = 0; j < 24; j += 3) {

                const x = corners[j];
                const y = corners[j + 1];
                const z = corners[j + 2];

                //apply matrix transform
                const _x = m4[0] * x + m4[4] * y + m4[8] * z + m4[12];
                const _y = m4[1] * x + m4[5] * y + m4[9] * z + m4[13];
                const _z = m4[2] * x + m4[6] * y + m4[10] * z + m4[14];


                //update bounds
                bounds_x0 = min2(bounds_x0, _x - s_2);
                bounds_y0 = min2(bounds_y0, _y - s_2);
                bounds_z0 = min2(bounds_z0, _z - s_2);

                bounds_x1 = max2(bounds_x1, _x + s_2);
                bounds_y1 = max2(bounds_y1, _y + s_2);
                bounds_z1 = max2(bounds_z1, _z + s_2);
            }
        }

        this.emisionBounds.setBounds(bounds_x0, bounds_y0, bounds_z0, bounds_x1, bounds_y1, bounds_z1);

        this.clearFlag(ParticleEmitterFlag.BaseBoundsNeedUpdate);
    }

    computeParticleBounds() {
        //retire dead particles
        const particles = this.particles;

        const liveParticleCount = particles.size();

        let bounds_x0 = Infinity;
        let bounds_y0 = Infinity;
        let bounds_z0 = Infinity;

        let bounds_x1 = -Infinity;
        let bounds_y1 = -Infinity;
        let bounds_z1 = -Infinity;

        for (let i = 0; i < liveParticleCount; i++) {

            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position);

            const p_x = position[0];
            const p_y = position[1];
            const p_z = position[2];

            //update bounds
            bounds_x0 = min2(bounds_x0, p_x);
            bounds_y0 = min2(bounds_y0, p_y);
            bounds_z0 = min2(bounds_z0, p_z);

            bounds_x1 = max2(bounds_x1, p_x);
            bounds_y1 = max2(bounds_y1, p_y);
            bounds_z1 = max2(bounds_z1, p_z);
        }

        //expand bounds by maximum sprite size
        const extents = this.computeSpriteMaxHalfSize();

        bounds_x0 -= extents;
        bounds_y0 -= extents;
        bounds_z0 -= extents;

        bounds_x1 += extents;
        bounds_y1 += extents;
        bounds_z1 += extents;

        //write updated bonds
        const bb = this.particleBounds;

        bb.setBounds(bounds_x0, bounds_y0, bounds_z0, bounds_x1, bounds_y1, bounds_z1);

        this.updateGeometryBounds();

        this.clearFlag(ParticleEmitterFlag.ParticleBoundsNeedUpdate);
    }

    computeBoundingBox() {

        if (this.getFlag(ParticleEmitterFlag.BaseBoundsNeedUpdate)) {
            //emission bounds need update
            this.computeEmissionBounds();
        }

        if (this.getFlag(ParticleEmitterFlag.ParticleBoundsNeedUpdate)) {
            //particle bounds need update
            this.computeParticleBounds();
        }

        const ebb = this.emisionBounds;
        const pbb = this.particleBounds;

        const bounds_x0 = min2(ebb.x0, pbb.x0);
        const bounds_y0 = min2(ebb.y0, pbb.y0);
        const bounds_z0 = min2(ebb.z0, pbb.z0);

        const bounds_x1 = max2(ebb.x1, pbb.x1);
        const bounds_y1 = max2(ebb.y1, pbb.y1);
        const bounds_z1 = max2(ebb.z1, pbb.z1);

        const bvhLeaf = this.bvhLeaf;

        bvhLeaf.setBounds(bounds_x0, bounds_y0, bounds_z0, bounds_x1, bounds_y1, bounds_z1);

        if (bvhLeaf.parentNode !== null) {
            bvhLeaf.parentNode.bubbleRefit();
        }

    }

    updateGeometryBounds() {

        const particles = this.particles;

        if (particles === null) {
            return;
        }

        const geometry = particles.geometry.getValue();

        if (geometry !== null) {
            const bvh = this.particleBounds;

            const bb = geometry.boundingBox;

            bb.min.set(bvh.x0, bvh.y0, bvh.z0);
            bb.max.set(bvh.x1, bvh.y1, bvh.z1);
        }
    }

    /**
     * @param {number} limit longest maximum life per layer, layers that exceed this value are ignored. Measured in seconds
     * @returns {number} in seconds
     */
    computeMaxEmittingParticleLife(limit = 60) {
        const layers = this.layers;

        const numLayers = layers.length;

        let i;
        let result = 0;

        for (i = 0; i < numLayers; i++) {
            const layer = layers.get(i);

            if (layer.emissionRate <= 0 && layer.emissionImmediate <= 0) {
                //skip layers with no emission
                continue;
            }

            const maxLifeTime = layer.particleLife.max;

            if (maxLifeTime > limit) {
                //ignore layer, it's above limit
                continue;
            }

            if (maxLifeTime > result) {
                result = maxLifeTime;
            }
        }

        return result;
    }

    build() {

        this.particles = new ParticlePool(particleSpecification);

        //make overallocation a bit more aggressive to prevent frequent resizing
        this.particles.shrinkFactor = 0.5;

        this.particles.build();

        const points = new Points(EMPTY_GEOMETRY, defaultPointsMaterial);
        points.frustumCulled = false;
        points.matrixAutoUpdate = false;

        //back link
        points.__meep_ecs_component = this;

        this.mesh = points;

        //subscribe to geometry changes
        this.particles.geometry.process((geometry) => {
            points.geometry = geometry;

            //set bounding box
            geometry.boundingBox = new Box3();

            this.updateGeometryBounds();
        });

        //build parameters
        this.parameters.build();

        //mark bounds for update
        this.writeFlag(ParticleEmitterFlag.BaseBoundsNeedUpdate, true);

        //update bounding box
        this.computeBoundingBox();

        // mark as built
        this.setFlag(ParticleEmitterFlag.Built | ParticleEmitterFlag.HashNeedUpdate);
    }

    initialize() {
        //set buffered position to current position
        this.__lastSpawnPosition.copy(this.position);

        //emit immediate
        let i;
        const numLayers = this.layers.length;

        if (this.getFlag(ParticleEmitterFlag.PreWarm)) {
            //pre-warm the emitter
            for (i = 0; i < numLayers; i++) {
                const layer = this.layers.get(i);
                if (layer.emissionRate > 0 && layer.isEmitting) {
                    const averageLifetime = (layer.particleLife.max + layer.particleLife.min) / 2;
                    this.spawnLayerParticlesContinuous(i, averageLifetime);
                }
            }
        }

        for (i = 0; i < numLayers; i++) {
            //immediate emission
            const layer = this.layers.get(i);
            if (layer.emissionImmediate > 0 && layer.isEmitting) {
                this.spawnLayerParticlesImmediate(i, layer.emissionImmediate);
            }
        }

        // Mark as initialized
        this.setFlag(ParticleEmitterFlag.Initialized);
    }

    computeHash() {
        const parametersHash = this.parameters.hash();
        const layersHash = this.layers.hash();

        /**
         * Extract relevant flags
         * @type {number}
         */
        const flags = this.flags & (SERIALIZABLE_FLAGS);

        return computeHashIntegerArray(parametersHash, layersHash, this.blendingMode, flags);
    }

    hash() {
        if (this.getFlag(ParticleEmitterFlag.HashNeedUpdate)) {
            this.__hash = this.computeHash();
            this.clearFlag(ParticleEmitterFlag.HashNeedUpdate);
        }

        return this.__hash;
    }

    /**
     *
     * @param {ParticleEmitter} other
     * @returns {boolean}
     */
    equals(other) {
        return this.blendingMode === other.blendingMode
            && this.parameters.equals(other.parameters)
            && this.layers.equals(other.layers)
            && this.getFlag(ParticleEmitterFlag.DepthSorting) === other.getFlag(ParticleEmitterFlag.DepthSorting)
            && this.getFlag(ParticleEmitterFlag.PreWarm) === other.getFlag(ParticleEmitterFlag.PreWarm);
    }

    /**
     * PRECONDITION: no dead particles may exist in the pool. Make sure to call {@link ParticlePool#compact} before sorting
     * @private
     * @param {Camera} camera THREE.js camera object
     */
    sort(camera) {
        assert.notEqual(camera, undefined, 'camera is undefined');
        assert.notEqual(camera, null, 'camera is null');

        //sort particles by distance from camera to ensure proper rendering order

        /**
         *
         * @type {ParticlePool}
         */
        const particles = this.particles;

        const particleCount = particles.size();

        //test pre-condition: NO DEAD PARTICLES IN THE POOL
        assert.notOk(this.particles.hasHoles(), 'Broken pre-condition: particle pool must not have holes. Make sure to call "compact" before sorting');

        //get font plane of camera
        frustumFromCamera(camera, frustum);
        const nearPlane = frustum.planes[0];
        const nearPlaneNormal = nearPlane.normal;

        //Bind attribute array directly for faster access
        const positionAttribute = particles.attributes[PARTICLE_ATTRIBUTE_POSITION];
        const positionArray = positionAttribute.array;


        if (particleCount <= 1) {
            //nothing to sort
            return;
        }

        //Stack-based implementation, avoiding recursion for performance improvement
        const stack = [0, particleCount - 1];

        let stackPointer = 2;
        let i, j;

        while (stackPointer > 0) {
            stackPointer -= 2;

            const right = stack[stackPointer + 1];
            const left = stack[stackPointer];

            i = left;
            j = right;

            const pivotIndex = (left + right) >> 1;

            const pivot = distanceToCamera(pivotIndex, positionArray, nearPlaneNormal);

            /* partition */
            while (i <= j) {
                while (distanceToCamera(i, positionArray, nearPlaneNormal) > pivot)
                    i++;
                while (distanceToCamera(j, positionArray, nearPlaneNormal) < pivot)
                    j--;
                if (i <= j) {

                    if (i !== j) {
                        //do swap
                        particles.swap(i, j);
                    }

                    i++;
                    j--;
                }
            }

            /* recursion */
            if (left < j) {
                stack[stackPointer++] = left;
                stack[stackPointer++] = j;
            }
            if (i < right) {
                stack[stackPointer++] = i;
                stack[stackPointer++] = right;
            }
        }
    }

    update() {
        this.particles.update();

        //check if sprites need updating
        if (this.getFlag(ParticleEmitterFlag.SpritesNeedUpdate)) {
            this.updateSprites();
        }
    }

    /**
     *
     * @return {number}
     */
    computeSpriteMaxHalfSize() {
        const layers = this.layers;
        const n = layers.length;

        let result = 0;

        for (let i = 0; i < n; i++) {
            const particleLayer = layers.get(i);

            result = max2(result, particleLayer.computeScaledSpriteHalfSize());
        }

        return result;
    }

    /**
     *
     * @param {number} timeDelta
     */
    advance(timeDelta) {
        let i;

        //retire dead particles
        const particles = this.particles;

        const liveParticleCount = particles.size();

        for (i = 0; i < liveParticleCount; i++) {

            const age = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_AGE);

            const deathAge = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_DEATH_AGE);

            const newAge = age + timeDelta;

            if (newAge >= deathAge) {
                //add to trash
                particles.remove(i);
                //we're done with this particle
                continue;
            }

            //make older
            particles.writeAttributeScalar(i, PARTICLE_ATTRIBUTE_AGE, newAge);

            //update rotation
            const rotationSpeed = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION_SPEED);
            const oldRotation = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION);

            particles.writeAttributeScalar(i, PARTICLE_ATTRIBUTE_ROTATION, oldRotation + rotationSpeed * timeDelta);

            //advance position based on velocity
            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_VELOCITY, velocity);

            particles.readAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, position);

            const p_x = position[0] + velocity[0] * timeDelta;
            const p_y = position[1] + velocity[1] * timeDelta;
            const p_z = position[2] + velocity[2] * timeDelta;

            particles.writeAttributeVector3(i, PARTICLE_ATTRIBUTE_POSITION, p_x, p_y, p_z);
        }

        this.emit(timeDelta);

        this.setFlag(ParticleEmitterFlag.ParticleBoundsNeedUpdate);
    }

    /**
     * Write sprite UVs
     */
    updateSprites() {
        const particles = this.particles;

        const occupancy = particles.occupancy;

        const layers = this.layers;

        const numLayers = layers.length;

        let missingFlag = false;

        //cycle through each particle
        for (let i = occupancy.nextSetBit(0); i !== -1; i = occupancy.nextSetBit(i + 1)) {
            const layerPosition = particles.readAttributeScalar(i, PARTICLE_ATTRIBUTE_LAYER_POSITION);

            const layerIndex = Math.round(layerPosition * numLayers);

            const layer = layers.get(layerIndex);

            const atlasPatch = layer.__atlasPatch;

            if (atlasPatch !== null) {
                const uv = atlasPatch.uv;

                const u0 = uv.position.x;
                const v0 = uv.position.y;
                const u1 = uv.size.x;
                const v1 = uv.size.y;

                particles.writeAttributeVector4(i, PARTICLE_ATTRIBUTE_UV, u0, v0, u1, v1);
            } else {
                missingFlag = true;
            }
        }

        this.writeFlag(ParticleEmitterFlag.SpritesNeedUpdate, missingFlag);
    }

    /**
     * @private
     * @param {int} layerIndex
     * @param {number} timeDelta period over which particles are being spawned, this will ensure that spawned particles have different initial age
     */
    spawnLayerParticlesContinuous(layerIndex, timeDelta) {
        assert.ok(layerIndex < this.layers.length && layerIndex >= 0, `layerIndex(=${layerIndex}) is out of bounds`);

        const layer = this.layers.get(layerIndex);

        const random = Math.random;

        /**
         *
         * @type {ParticlePool}
         */
        const particles = this.particles;


        const emissionFunction = computeEmissionFunction(layer.emissionFrom, layer.emissionShape);

        const emissionPeriod = 1 / layer.emissionRate;

        const layerPosition = layerIndex / this.layers.length;

        //compute transform matrix of the emitter
        composeMatrix4(matrix4, this.position, this.rotation, this.scale);

        let time = -layer.timeSinceLastEmission;

        while (time + emissionPeriod < timeDelta) {
            time += emissionPeriod;

            const ref = particles.create();

            // randomize position across the supplied time interval
            const f = time / timeDelta;

            //compute position for particle
            emissionFunction(random, v3position);

            //apply layer transform
            v3position.multiply(layer.scale);
            v3position.add(layer.position);

            if (this.getFlag(ParticleEmitterFlag.PositionChanged)) {
                //compute position in between
                matrix4.elements[12] = lerp(this.position.x, this.__lastSpawnPosition.x, f);
                matrix4.elements[13] = lerp(this.position.y, this.__lastSpawnPosition.y, f);
                matrix4.elements[14] = lerp(this.position.z, this.__lastSpawnPosition.z, f);
            }

            //apply emitter transform
            v3position.applyMatrix4_three(matrix4);


            //randomize initial age across time delta
            const initialAge = f * timeDelta;

            //write age
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_AGE, initialAge);

            //write rotation
            const rotation = layer.particleRotation.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION, rotation);

            //write rotation speed
            const rotationSpeed = layer.particleRotationSpeed.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION_SPEED, rotationSpeed);

            //initialize velocity
            layer.particleVelocityDirection.sampleRandomDirection(random, v3velocity);
            const speed = layer.particleSpeed.sampleRandom(random);

            v3velocity.multiplyScalar(speed);

            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_VELOCITY, v3velocity.x, v3velocity.y, v3velocity.z);

            //write position
            const p_x = v3position.x + v3velocity.x * initialAge;
            const p_y = v3position.y + v3velocity.y * initialAge;
            const p_z = v3position.z + v3velocity.z * initialAge;

            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_POSITION, p_x, p_y, p_z);

            //write death age
            const deathAge = layer.particleLife.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_DEATH_AGE, deathAge);

            //write particle size
            const size = layer.particleSize.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_SIZE, size);

            //write UV
            const atlasPatch = layer.__atlasPatch;
            if (atlasPatch !== null) {
                const uv = atlasPatch.uv;

                const u0 = uv.position.x;
                const v0 = uv.position.y;
                const u1 = uv.size.x;
                const v1 = uv.size.y;

                particles.writeAttributeVector4(ref, PARTICLE_ATTRIBUTE_UV, u0, v0, u1, v1);
            } else {
                this.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);
            }

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_LAYER_POSITION, layerPosition);
        }

        //update time buffer
        layer.timeSinceLastEmission = timeDelta - time;

        this.setFlag(ParticleEmitterFlag.ParticleBoundsNeedUpdate);
    }

    /**
     * @private
     * @param {int} layerIndex
     * @param {number} count how many particles to spawn
     */
    spawnLayerParticlesImmediate(layerIndex, count) {
        if (count <= 0) {
            return;
        }

        assert.ok(layerIndex < this.layers.length && layerIndex >= 0, `layerIndex(=${layerIndex}) is out of bounds`);

        const layer = this.layers.get(layerIndex);

        const random = Math.random;

        /**
         *
         * @type {ParticlePool}
         */
        const particles = this.particles;

        const emissionFunction = computeEmissionFunction(layer.emissionFrom, layer.emissionShape);

        const layerPosition = layerIndex / this.layers.length;

        //compute transform matrix of the emitter
        composeMatrix4(matrix4, this.position, this.rotation, this.scale);

        //pre-grow particle pool
        particles.growCapacity(particles.capacity + count);

        let spritesNeedUpdate = false;

        for (let j = 0; j < count; j++) {
            const ref = particles.create();

            //compute position for particle
            emissionFunction(random, v3position);

            //apply layer transform
            v3position.multiply(layer.scale);
            v3position.add(layer.position);

            //apply emitter transform
            v3position.applyMatrix4_three(matrix4);


            //randomize initial age across time delta
            const initialAge = 0;

            //write age
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_AGE, initialAge);

            //write rotation
            const rotation = layer.particleRotation.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION, rotation);

            //write rotation speed
            const rotationSpeed = layer.particleRotationSpeed.sampleRandom(random);
            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_ROTATION_SPEED, rotationSpeed);

            //initialize velocity
            layer.particleVelocityDirection.sampleRandomDirection(random, v3velocity);
            const speed = layer.particleSpeed.sampleRandom(random);

            v3velocity.multiplyScalar(speed);

            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_VELOCITY, v3velocity.x, v3velocity.y, v3velocity.z);

            //write position
            const p_x = v3position.x + v3velocity.x * initialAge;
            const p_y = v3position.y + v3velocity.y * initialAge;
            const p_z = v3position.z + v3velocity.z * initialAge;

            particles.writeAttributeVector3(ref, PARTICLE_ATTRIBUTE_POSITION,
                p_x,
                p_y,
                p_z
            );

            //write death age
            const deathAge = layer.particleLife.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_DEATH_AGE, deathAge);

            //write size
            const size = layer.particleSize.sampleRandom(random);

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_SIZE, size);

            //write UV
            const atlasPatch = layer.__atlasPatch;

            if (atlasPatch !== null) {
                //patch exists, write it
                const uv = atlasPatch.uv;

                const u0 = uv.position.x;
                const v0 = uv.position.y;
                const u1 = uv.size.x;
                const v1 = uv.size.y;

                particles.writeAttributeVector4(ref, PARTICLE_ATTRIBUTE_UV, u0, v0, u1, v1);
            } else {
                //patch is not loaded yet, request update
                spritesNeedUpdate = true;
            }

            particles.writeAttributeScalar(ref, PARTICLE_ATTRIBUTE_LAYER_POSITION, layerPosition);

        }

        if (spritesNeedUpdate) {
            this.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);
        }

        this.setFlag(ParticleEmitterFlag.ParticleBoundsNeedUpdate);
    }

    /**
     * @private
     * @param {number} timeDelta
     */
    emit(timeDelta) {
        if (!this.getFlag(ParticleEmitterFlag.Emitting)) {
            return;
        }

        const layers = this.layers;
        const numLayers = layers.length;

        if (!this.position.equals(this.__lastSpawnPosition)) {
            this.setFlag(ParticleEmitterFlag.PositionChanged);
        }

        //emit new  particles
        for (let i = 0; i < numLayers; i++) {
            /**
             * @type {ParticleLayer}
             */
            const layer = layers.get(i);

            if (!layer.isEmitting) {
                //this layer is not spawning any particles, ignore it
                continue;
            }

            const averageLifetime = (layer.particleLife.max + layer.particleLife.min) / 2;

            //emitting more than averageLifetime lifetime is unproductive, so we'll crop the emission
            let emissionDelta;
            if (timeDelta > averageLifetime) {
                emissionDelta = averageLifetime;
                layer.timeSinceLastEmission = 0;
            } else {
                emissionDelta = timeDelta;
            }

            this.spawnLayerParticlesContinuous(i, emissionDelta);
        }

        if (this.getFlag(ParticleEmitterFlag.PositionChanged)) {
            this.__lastSpawnPosition.copy(this.position);
            this.clearFlag(ParticleEmitterFlag.PositionChanged);
        }
    }

    /**
     *
     * @param json
     * @returns {ParticleEmitter}
     */
    static fromJSON(json) {
        const result = new ParticleEmitter();
        result.fromJSON(json);
        return result
    }
}

ParticleEmitter.typeName = "ParticleEmitter";

ParticleEmitter.Attributes = {
    PARTICLE_ATTRIBUTE_AGE,
    PARTICLE_ATTRIBUTE_DEATH_AGE,
    PARTICLE_ATTRIBUTE_LAYER_POSITION,
    PARTICLE_ATTRIBUTE_POSITION,
    PARTICLE_ATTRIBUTE_ROTATION,
    PARTICLE_ATTRIBUTE_ROTATION_SPEED,
    PARTICLE_ATTRIBUTE_SIZE,
    PARTICLE_ATTRIBUTE_UV,
    PARTICLE_ATTRIBUTE_VELOCITY
};

ParticleEmitter.SERIALIZABLE_FLAGS = SERIALIZABLE_FLAGS;


const matrix4 = new Matrix4();

const defaultPointsMaterial = new PointsMaterial({ color: 0xFFFFFF });


//build particle spec
const particleSpecification = new ParticleSpecification();

particleSpecification.add(new ParticleAttribute('position', ParticleAttributeType.Vector3, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('age', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('deathAge', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('atlasPatch', ParticleAttributeType.Vector4, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('size', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('layerPosition', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('velocity', ParticleAttributeType.Vector3, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('rotation', ParticleAttributeType.Scalar, ParticleDataType.Float32));
particleSpecification.add(new ParticleAttribute('rotationSpeed', ParticleAttributeType.Scalar, ParticleDataType.Float32));


const frustum = new Frustum();

const velocity = [];
const position = [];

const v3 = new Vector3();

const v3position = new Vector3();
const v3velocity = new Vector3();
