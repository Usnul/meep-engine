import { ShaderManager } from "./ShaderManager.js";
import { BinaryNode } from "../../../../../core/bvh2/BinaryNode.js";
import List from "../../../../../core/collection/list/List.js";
import { ParticleEmitterFlag } from "./emitter/ParticleEmitterFlag.js";
import { SimulationStepFixedPhysics } from "./simulator/SimulationStepFixedPhysics.js";
import { SimulationStepCurlNoiseAcceleration } from "./simulator/SimulationStepCurlNoiseAcceleration.js";
import { SimulationStepApplyForce } from "./simulator/SimulationStepApplyForce.js";
import { SimulationStepCurlNoiseVelocity } from "./simulator/SimulationStepCurlNoiseVelocity.js";


function ParticularEngine(assetManager) {
    this.shaderManager = new ShaderManager(assetManager);

    /**
     *
     * @type {THREE.Camera|null}
     */
    this.camera = null;

    /**
     * Managed emitters
     * @type {List.<ParticleEmitter>}
     */
    this.emitters = new List();

    this.bvh = new BinaryNode();
    this.bvh.setNegativelyInfiniteBounds();


    /**
     *
     * @type {AbstractSimulationStep[]}
     */
    this.steps = [
        new SimulationStepFixedPhysics(),
        new SimulationStepCurlNoiseAcceleration(),
        new SimulationStepCurlNoiseVelocity(),
        new SimulationStepApplyForce()
    ];
}

/**
 *
 * @param {ParticleEmitter} emitter
 */
ParticularEngine.prototype.add = function (emitter) {
    if (!emitter.getFlag(ParticleEmitterFlag.Built)) {
        emitter.build();
    }

    //mark sprites for update as their UVs might have changed since last usage
    emitter.setFlag(ParticleEmitterFlag.SpritesNeedUpdate);

    this.emitters.add(emitter);

    this.shaderManager.register(emitter);

    this.bvh.insertNode(emitter.bvhLeaf);
};

/**
 *
 * @param {ParticleEmitter} emitter
 */
ParticularEngine.prototype.remove = function (emitter) {
    const i = this.emitters.indexOf(emitter);

    if (i !== -1) {
        this.emitters.remove(i);
    }

    this.shaderManager.deregister(emitter);

    emitter.bvhLeaf.disconnect();
};

/**
 *
 * @param {THREE.Camera} camera
 */
ParticularEngine.prototype.setCamera = function (camera) {
    this.camera = camera;
    this.shaderManager.setCamera(camera);
};

ParticularEngine.prototype.setDepthTexture = function (texture) {
    this.shaderManager.setDepthTexture(texture);
};

ParticularEngine.prototype.setViewportSize = function (x, y) {
    this.shaderManager.setViewportSize(x, y);
};

/**
 * @private
 * @param {ParticleEmitter} emitter
 * @param {number} timeDelta
 */
ParticularEngine.prototype.advanceEmitter = function (emitter, timeDelta) {
    let i, j;


    /**
     *
     * @type {List<ParticleLayer>}
     */
    const layers = emitter.layers;

    const layer_count = layers.length;

    let step_mask = 0;

    const steps = this.steps;

    for (j = 0; j < layer_count; j++) {
        const particleLayer = layers.get(j);

        const simulationStepDefinitions = particleLayer.steps;

        const n = simulationStepDefinitions.length;

        for (i = 0; i < n; i++) {
            /**
             *
             * @type {SimulationStepDefinition}
             */
            const stepDefinition = simulationStepDefinitions.get(i);

            const type = stepDefinition.type;

            step_mask |= 1 << type;

            const step = steps[type];

            step.timeDelta = timeDelta;
            step.particles = emitter.particles;
            step.layer_parameters[j] = stepDefinition.parameters;
            step.includeLayer(j);

        }
    }

    // apply simulation steps
    const step_index_limit = steps.length;

    for (i = 0; i < step_index_limit; i++) {
        const m = 1 << i;
        const is_used = (step_mask & m) !== 0;

        if (is_used) {
            const step = steps[i];

            step.layer_count = layer_count;

            step.execute();

            step.clear();
        }
    }

    emitter.advance(timeDelta);

};

/**
 * @private
 * @param {ParticleEmitter} emitter
 * @param {number} timeDelta
 */
ParticularEngine.prototype.updateEmitter = function (emitter, timeDelta) {
    if (emitter.getFlag(ParticleEmitterFlag.Sleeping)) {
        emitter.sleepTime += timeDelta;
    } else {

        if (!emitter.getFlag(ParticleEmitterFlag.Initialized)) {
            emitter.initialize();
        }

        if (emitter.sleepTime > 0) {
            //emitter was sleeping, need to catch up the simulation
            const maxParticleLife = emitter.computeMaxEmittingParticleLife();

            let wakingTime = Math.min(emitter.sleepTime, maxParticleLife - timeDelta);

            const minWakingIncrement = 0.15;

            const maxWakingSteps = 10;

            const wakingIncrement = Math.max(wakingTime / maxWakingSteps, minWakingIncrement);

            while (wakingTime > 0) {
                const wakingStep = Math.min(wakingIncrement, wakingTime);

                this.advanceEmitter(emitter, wakingStep);

                wakingTime -= wakingStep;
            }

            //consume the sleep time
            emitter.sleepTime = 0;
        }
        //advance simulation
        this.advanceEmitter(emitter, timeDelta);

        //update bounding box
        emitter.computeBoundingBox();
    }
};

ParticularEngine.prototype.update = function () {
    const emitters = this.emitters;

    const numEmitters = emitters.length;

    for (let i = 0; i < numEmitters; i++) {
        const emitter = emitters.get(i);
        if (!emitter.getFlag(ParticleEmitterFlag.Sleeping)) {

            emitter.update();
        }
    }
};

ParticularEngine.prototype.sortParticles = function () {
    const emitters = this.emitters;

    const numEmitters = emitters.length;

    for (let i = 0; i < numEmitters; i++) {
        const emitter = emitters.get(i);
        if (!emitter.getFlag(ParticleEmitterFlag.Sleeping) && emitter.getFlag(ParticleEmitterFlag.DepthSorting)) {
            //sort particles by position from camera
            emitter.sort(this.camera);
        }
    }
};

/**
 *
 * @param {number} timeDelta
 */
ParticularEngine.prototype.advance = function (timeDelta) {
    const emitters = this.emitters;

    const numEmitters = emitters.length;

    for (let i = 0; i < numEmitters; i++) {
        const emitter = emitters.get(i);
        this.updateEmitter(emitter, timeDelta);
    }
};

export { ParticularEngine };
