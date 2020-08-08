import { AnimationState } from "./AnimationState.js";
import { AnimationTransition } from "./AnimationTransition.js";
import { AnimationStateType } from "./AnimationStateType.js";
import { AnimationMixer } from "three";
import { threeUpdateTransform } from "../../../../Utils.js";
import { AnimationGraphFlag } from "./AnimationGraphFlag.js";
import { computeHashFloat, computeHashIntegerArray } from "../../../../../../core/math/MathUtils.js";
import { writeAnimationGraphDefinitionToJSON } from "./definition/serialization/writeAnimationGraphDefinitionToJSON.js";
import { readAnimationGraphDefinitionFromJSON } from "./definition/serialization/readAnimationGraphDefinitionFromJSON.js";
import { assert } from "../../../../../../core/assert.js";

export class AnimationGraph {
    constructor() {
        /**
         *
         * @type {AnimationGraphDefinition}
         */
        this.def = null;

        /**
         *
         * @type {AnimationState}
         */
        this.state = null;

        /**
         *
         * @type {AnimationTransition[]}
         */
        this.transitions = [];

        /**
         *
         * @type {AnimationState[]}
         */
        this.states = [];

        /**
         *
         * @type {AnimationTransition[]}
         */
        this.activeTransitions = [];

        /**
         *
         * @type {AnimationState[]}
         */
        this.simulatedStates = [];

        /**
         *
         * @type {BlendStateMatrix}
         */
        this.blendState = null;

        /**
         *
         * @type {number}
         */
        this.debtTime = 0;

        /**
         *
         * @type {EntityComponentDataset}
         * @private
         */
        this.__dataset = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__entity = -1;

        /**
         *
         * @type {AnimationMixer}
         * @private
         */
        this.__mixer = null;

        /**
         *
         * @type {AnimationAction[]}
         * @private
         */
        this.__actions = [];

        /**
         *
         * @type {Object3D}
         * @private
         */
        this.__mesh = null;

        /**
         *
         * @type {number}
         */
        this.flags = AnimationGraphFlag.MeshSizeCulling;
    }

    /**
     *
     * @param {AnimationGraph} other
     * @returns {boolean}
     */
    equals(other) {
        if (this === other) {
            return true;
        }

        return this.flags === other.flags
            && this.debtTime === other.debtTime
            && this.state.equals(other.state)
            && this.def.equals(other.def)
            ;
    }

    /**
     * @returns {number}
     */
    hash() {
        return computeHashIntegerArray(
            this.flags,
            computeHashFloat(this.debtTime),
            this.state.hash(),
            this.def.hash()
        );
    }

    toJSON() {
        return {
            def: writeAnimationGraphDefinitionToJSON(this.def),
            state: this.def.states.indexOf(this.state.def),
            debtTime: this.debtTime,
            flags: this.flags
        };
    }

    fromJSON({ def, state, debtTime, flags }) {
        const graphDefinition = readAnimationGraphDefinitionFromJSON(def);

        this.debtTime = debtTime;
        this.flags = flags;
        this.initialize(graphDefinition);

        this.state = this.states[state];
    }

    /**
     *
     * @param {number|AnimationGraphFlag} flag
     * @returns {void}
     */
    setFlag(flag) {
        this.flags |= flag;
    }

    /**
     *
     * @param {number|AnimationGraphFlag} flag
     * @returns {void}
     */
    clearFlag(flag) {
        this.flags &= ~flag;
    }

    /**
     *
     * @param {number|AnimationGraphFlag} flag
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
     * @param {number|AnimationGraphFlag} flag
     * @returns {boolean}
     */
    getFlag(flag) {
        return (this.flags & flag) === flag;
    }

    /**
     *
     * @param {AnimationStateDefinition} stateDefinition
     * @returns {AnimationState}
     */
    getStateByDefinition(stateDefinition) {
        return this.states.find(s => s.def === stateDefinition);
    }

    /**
     *
     * @param {string} name
     * @return {AnimationState}
     */
    getStateByClipName(name) {
        const animationStates = this.states;
        const n = animationStates.length;
        for (let i = 0; i < n; i++) {
            const state = animationStates[i];

            /**
             * @type {AnimationStateDefinition}
             */
            const stateDefinition = state.def;

            if (stateDefinition.type !== AnimationStateType.Clip) {
                continue;
            }

            if (stateDefinition.motion.def.name === name) {
                return state;
            }
        }
    }

    /**
     *
     * @param {string} name
     * @return {AnimationState|undefined}
     */
    getStateByName(name) {

        const animationStates = this.states;
        const n = animationStates.length;
        for (let i = 0; i < n; i++) {
            const state = animationStates[i];

            /**
             * @type {AnimationStateDefinition}
             */
            const stateDefinition = state.def;

            if (stateDefinition.name === name) {
                return state;
            }
        }
    }

    /**
     *
     * @param {AnimationTransitionDefinition} transitionDefinition
     * @returns {AnimationTransition}
     */
    getTransitionByDefinition(transitionDefinition) {
        return this.transitions.find(t => t.def === transitionDefinition);
    }

    /**
     *
     * @param {AnimationGraphDefinition} def
     */
    initialize(def) {
        this.def = def;

        this.blendState = def.createBlendState();

        //build states
        this.states = [];

        const animationStateDefinitions = def.states;
        const stateCount = animationStateDefinitions.length;

        for (let i = 0; i < stateCount; i++) {
            const stateDefinition = animationStateDefinitions[i];

            const state = new AnimationState();

            state.def = stateDefinition;
            state.graph = this;

            this.states[i] = state;
        }

        this.transitions = [];

        const animationTransitionDefinitions = def.transitions;
        const transitionCount = animationTransitionDefinitions.length;

        for (let i = 0; i < transitionCount; i++) {
            const animationTransitionDefinition = animationTransitionDefinitions[i];

            const transition = new AnimationTransition();

            transition.def = animationTransitionDefinition;
            transition.graph = this;

            this.transitions[i] = transition;
        }

        this.state = this.getStateByDefinition(def.startingSate);


        //link transitions
        for (let i = 0; i < transitionCount; i++) {
            const transition = this.transitions[i];

            const d = transition.def;

            transition.source = this.getStateByDefinition(d.source);
            transition.target = this.getStateByDefinition(d.target);

            transition.initialize();
        }

        //link states
        for (let i = 0; i < stateCount; i++) {
            const state = this.states[i];

            const d = state.def;

            state.inEdges = d.inEdges.map(this.getTransitionByDefinition, this);
            state.outEdges = d.outEdges.map(this.getTransitionByDefinition, this);

            //initialize states
            state.initialize();
        }

    }

    /**
     *
     * @param {Object3D} mesh
     */
    attach(mesh) {

        assert.defined(mesh, 'mesh');
        assert.notNull(mesh, 'mesh');
        assert.equal(mesh.isObject3D, true, 'Mesh.isMesh !== true');

        if (this.__mesh === mesh) {
            return;
        }

        this.__mesh = mesh;

        this.__mixer = new AnimationMixer(mesh);

        /**
         *
         * @type {AnimationGraphDefinition}
         */
        const graphDefinition = this.def;

        /**
         *
         * @type {AnimationClipDefinition[]}
         */
        const clipIndex = graphDefinition.clipIndex;
        const nClips = clipIndex.length;


        /**
         * @type {AnimationClip[]}
         */
        const animations = mesh.animations;

        if (animations === undefined) {
            throw new Error('Mesh.animations is undefined, no animations');
        }

        const animationCount = animations.length;

        main: for (let i = 0; i < nClips; i++) {
            /**
             *
             * @type {AnimationClipDefinition}
             */
            const animationClipDefinition = clipIndex[i];

            for (let j = 0; j < animationCount; j++) {
                const animation = animations[j];

                if (animation.name === animationClipDefinition.name) {
                    const animationAction = this.__mixer.clipAction(animation, null);

                    this.__actions[i] = animationAction;
                    animationClipDefinition.duration = animation.duration;

                    continue main;
                }
            }

            throw new Error(`Animation '${animationClipDefinition.name}' not found`);
        }
    }

    link(entity, ecd) {
        if (this.getFlag(AnimationGraphFlag.Linked)) {
            //already linked
            if (this.__entity === entity && this.__dataset === ecd) {
                //everything is the same, nothing to do
                return;
            } else {
                throw new Error('Graph is already linked to another source, must call .unlink first');
            }
        }

        this.__entity = entity;
        this.__dataset = ecd;

        this.enterState(this.state);

        this.setFlag(AnimationGraphFlag.Linked);
    }

    unlink() {
        if (!this.getFlag(AnimationGraphFlag.Linked)) {
            //not linked, do nothing
            return;
        }

        this.exitState(this.state);

        this.clearFlag(AnimationGraphFlag.Linked);
    }

    /**
     *
     * @param {AnimationState} state
     * @returns {boolean}
     */
    stopStateSimulation(state) {
        const j = this.simulatedStates.indexOf(state);

        if (j !== -1) {
            this.simulatedStates.splice(j, 1);

            return true;
        } else {
            return false;
        }

    }

    updateBlendState() {
        const nS = this.simulatedStates.length;
        for (let i = 0; i < nS; i++) {
            const s = this.simulatedStates[i];

            s.updateBlendState();
        }


        const animationTransitions = this.activeTransitions;

        const nAT = animationTransitions.length;
        const currentBlendState = this.blendState;
        if (nAT > 0) {


            if (nAT === 1) {
                //special case, only one active transition
                const first = animationTransitions[0];

                first.updateBlendsState();

                currentBlendState.copy(first.blendState);
            } else {
                currentBlendState.zero();

                // accumulate

                for (let i = 0; i < nAT; i++) {
                    const activeTransition = animationTransitions[i];

                    activeTransition.updateBlendsState();

                    currentBlendState.add(activeTransition.blendState);
                }

                // normalize
                currentBlendState.divideScalar(nAT);
            }
        } else {
            //no active transitions, copy current state's blend matrix
            currentBlendState.copy(this.state.blendState);
        }

        //write blend state
        this.writeBlendState();
    }

    writeBlendState() {
        if (this.__mixer == null) {
            return;
        }

        const blendState = this.blendState;

        const n = blendState.weights.length;
        for (let i = 0; i < n; i++) {
            const weight = blendState.weights[i];
            const timeScale = blendState.timeScales[i];

            /**
             *
             * @type {AnimationAction}
             */
            const action = this.__actions[i];

            action.weight = weight;
            action.timeScale = timeScale;
        }
    }

    /**
     *
     * @param {number} timeDelta in seconds
     */
    tick(timeDelta) {
        const activeTransitions = this.activeTransitions;
        let nT = activeTransitions.length;

        transitions: for (let i = 0; i < nT; i++) {
            const activeTransition = activeTransitions[i];

            activeTransition.tick(timeDelta);


            if (activeTransition.isFinished()) {
                //terminate transition
                activeTransitions.splice(i, 1);

                nT--;
                i--;

                //try to stop simulation of linked source state
                for (let j = 0; j < nT; j++) {
                    const t = activeTransitions[j];

                    if (t.source === activeTransition.source || t.target === activeTransition.source) {
                        //state is in use
                        continue transitions;
                    }
                }

                //source is not in use, we can terminate it
                this.stopStateSimulation(activeTransition.source);

            }
        }

        const simulatedStates = this.simulatedStates;
        const nS = simulatedStates.length;

        for (let i = 0; i < nS; i++) {
            const simulatedState = simulatedStates[i];

            simulatedState.tick(timeDelta);
        }

        this.updateBlendState();
        this.writeBlendState();

        const mixer = this.__mixer;

        if (mixer !== null) {
            mixer.update(timeDelta);

            /**
             * get root
             * @type {Object3D}
             */
            const root = mixer.getRoot();

            //update bone matrix hierarchy
            // root.updateWorldMatrix(false, true);

            threeUpdateTransform(root);
        }
    }


    /**
     *
     * @param {AnimationState} state
     */
    enterState(state) {
        this.state = state;

        if (this.simulatedStates.indexOf(state) === -1) {
            this.simulatedStates.push(state);
        }

        //activate new state
        state.activate(this.__entity, this.__dataset);

        const stateDefinition = state.def;

        if (stateDefinition.type === AnimationStateType.Clip) {

            /**
             *
             * @type {AnimationClip}
             */
            const clip = stateDefinition.motion;

            /**
             *
             * @type {AnimationClipDefinition}
             */
            const clipDefinition = clip.def;

            const clipIndex = this.def.getClipIndex(clipDefinition);

            /**
             *
             * @type {AnimationAction}
             */
            const action = this.__actions[clipIndex];

            if (action === undefined) {
                console.warn(`AnimationState does not have action bound. action is undefined.`);
                return;
            }

            clip.initializeThreeAnimationAction(action);
        }
    }

    /**
     *
     * @param {AnimationState} state
     */
    exitState(state) {

        const entity = this.__entity;
        const ecd = this.__dataset;

        //de-activate old state's transitions
        state.deactivate(entity, ecd);
    }

    /**
     *
     * @param {AnimationState} state
     */
    activateState(state) {

        this.exitState(this.state);

        this.enterState(state);

    }

    /**
     *
     * @param {AnimationTransition} transition
     */
    transition(transition) {
        this.activeTransitions.push(transition);

        /**
         *
         * @type {AnimationState}
         */
        const target = transition.target;

        this.activateState(target);
    }
}

/**
 * @readonly
 * @type {string}
 */
AnimationGraph.typeName = "AnimationGraph";
