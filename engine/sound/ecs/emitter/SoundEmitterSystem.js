/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 18:36
 */


import { System } from '../../../ecs/System.js';
import { SoundEmitter } from './SoundEmitter.js';
import { Transform } from '../../../ecs/transform/Transform.js';
import { SoundAssetManager } from "../../../asset/loaders/SoundAssetManager.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";
import { BinaryNode } from "../../../../core/bvh2/BinaryNode.js";
import SoundListener from "../SoundListener.js";
import { IncrementalDeltaSet } from "../../../graphics/render/visibility/IncrementalDeltaSet.js";
import { queryBinaryNode_SphereIntersections_Data } from "../../../../core/bvh2/traversal/queryBinaryNode_SphereIntersections.js";
import { tryRotateSingleNode } from "../../../../core/bvh2/transform/RotationOptimizer.js";
import { SoundEmitterComponentContext } from "./SoundEmitterComponentContext.js";
import { SoundEmitterFlags } from "./SoundEmitterFlags.js";

/**
 * @readonly
 * @enum {string}
 */
export const SoundEmitterChannels = {
    Effects: 'effects',
    Music: 'music',
    Ambient: 'ambient'
};

/**
 *
 * @type {Map<NodeDescription, number>}
 */
const leafCount = new Map();

/**
 *
 * @type {SoundEmitterComponentContext[]}
 */
const positionalNodes = [];


export class SoundEmitterSystem extends System {
    /**
     *
     * @param {AssetManager} assetManager
     * @param {AudioNode} destinationNode
     * @param {AudioContext} context
     * @constructor
     * @property {AssetManager} assetManager
     */
    constructor(assetManager, destinationNode, context) {
        super();

        this.componentClass = SoundEmitter;

        this.dependencies = [SoundEmitter, Transform];

        //
        this.destinationNode = destinationNode;
        /**
         *
         * @type {AudioContext}
         */
        this.webAudioContext = context;
        this.assetManager = assetManager;

        this.channels = {};
        this.addChannel(SoundEmitterChannels.Effects)
            .addChannel(SoundEmitterChannels.Music)
            .addChannel(SoundEmitterChannels.Ambient);

        this.channels[SoundEmitterChannels.Effects].gain.setValueAtTime(1.2, 0);
        this.channels[SoundEmitterChannels.Music].gain.setValueAtTime(0.1, 0);

        assetManager.registerLoader(GameAssetType.Sound, new SoundAssetManager(context));


        /**
         *
         * @type {SoundEmitterComponentContext[]}
         */
        this.data = [];

        /**
         *
         * @type {IncrementalDeltaSet<SoundEmitterComponentContext>}
         */
        this.activeSet = new IncrementalDeltaSet();

        /**
         * Spatial index
         * @type {BinaryNode}
         * @private
         */
        this.__bvh = new BinaryNode();

        /**
         *
         * @type {number}
         * @private
         */
        this.__optimizationPointer = 0;
    }

    startup(entityManager, readyCallback, errorCallback) {
        this.activeSet.onAdded.add(this.handleContextActivation, this);
        this.activeSet.onRemoved.add(this.handleContextDeactivation, this);

        super.startup(entityManager, readyCallback, errorCallback);
    }

    shutdown(entityManager, readyCallback, errorCallback) {
        this.activeSet.onAdded.remove(this.handleContextActivation, this);
        this.activeSet.onRemoved.remove(this.handleContextDeactivation, this);

        super.shutdown(entityManager, readyCallback, errorCallback);
    }

    /**
     *
     * @param {SoundEmitterComponentContext} ctx
     */
    handleContextActivation(ctx) {
        ctx.connect();
    }

    /**
     *
     * @param {SoundEmitterComponentContext} ctx
     */
    handleContextDeactivation(ctx) {
        ctx.disconnect();
    }

    /**
     *
     * @param {String} name
     * @returns {number}
     */
    getChannelVolume(name) {
        return this.channels[name].gain.value;
    }

    /**
     *
     * @param {String} name
     * @param {number} value
     */
    setChannelVolume(name, value) {
        this.channels[name].gain.setValueAtTime(value, 0);
    }

    addChannel(name) {
        const channels = this.channels;
        if (!channels.hasOwnProperty(name)) {
            const channel = channels[name] = this.webAudioContext.createGain();
            channel.connect(this.destinationNode);
        } else {
            console.error("Channel " + name + " already exists");
        }
        return this;
    }

    /**
     *
     * @param {String} name
     * @returns {boolean}
     */
    hasChannel(name) {
        return this.channels.hasOwnProperty(name);
    }

    /**
     *
     * @param {SoundEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     */
    link(emitter, transform, entity) {
        const context = this.webAudioContext;

        //what channel do we use?
        let channelName = emitter.channel;

        if (!this.hasChannel(channelName)) {
            console.error(`channel named '${channelName}' does not exist, defaulting to '${SoundEmitterChannels.Effects}'`);

            channelName = SoundEmitterChannels.Effects;

        }

        const targetNode = this.channels[channelName];

        const nodes = emitter.nodes;

        if (nodes.volume === null) {
            emitter.buildNodes(context);
        }

        const ctx = new SoundEmitterComponentContext();

        ctx.system = this;
        ctx.transform = transform;
        ctx.emitter = emitter;

        ctx.targetNode = targetNode;

        ctx.link();

        ctx.update();

        this.data[entity] = ctx;

        //attach bvh
        this.__bvh.insertNode(ctx.leaf);

        leafCount.clear();
    }

    /**
     *
     * @param {SoundEmitter} emitter
     * @param {Transform} transform
     * @param {number} entity
     */
    unlink(emitter, transform, entity) {
        //stop all tracks
        emitter.stopAllTracks();

        const ctx = this.data[entity];

        if (ctx !== undefined) {

            delete this.data[entity];

            ctx.unlink();

            ctx.leaf.disconnect();

        }


        leafCount.clear();
    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const ecd = entityManager.dataset;

        if (ecd === null) {
            return;
        }

        const activeSet = this.activeSet;
        activeSet.initializeUpdate();

        const soundListener = ecd.getAnyComponent(SoundListener);

        let listenerTransform;

        if (soundListener.entity !== -1) {
            listenerTransform = ecd.getComponent(soundListener.entity, Transform);

            const listenerPosition = listenerTransform.position;

            const matchCount = queryBinaryNode_SphereIntersections_Data(positionalNodes, 0, this.__bvh, listenerPosition.x, listenerPosition.y, listenerPosition.z, 0);

            for (let i = 0; i < matchCount; i++) {
                /**
                 * @type {SoundEmitterComponentContext}
                 */
                const ctx = positionalNodes[i];

                const emitter = ctx.emitter;

                if (emitter.tracks.isEmpty()) {
                    // no tracks to play, don't render
                    continue;
                }

                if (emitter.getFlag(SoundEmitterFlags.Attenuation)) {
                    const distance = listenerPosition.distanceTo(ctx.transform.position);

                    if (distance > emitter.distanceMax) {
                        //emitter is too far away
                        continue;
                    }

                    emitter.writeAttenuationVolume(distance);
                }

                activeSet.push(ctx);

            }

        }


        for (let entity in this.data) {
            /**
             *
             * @type {SoundEmitterComponentContext}
             */
            const ctx = this.data[entity];

            /**
             *
             * @type {SoundEmitter}
             */
            const emitter = ctx.emitter;

            /**
             *
             * @type {List<SoundTrack>}
             */
            const tracks = emitter.tracks;

            const trackCount = tracks.length;


            //update play time
            for (let i = 0; i < trackCount; i++) {
                const soundTrack = tracks.get(i);

                if (soundTrack.playing) {
                    soundTrack.time += timeDelta;
                }
            }

        }

        activeSet.finalizeUpdate();

        this.optimize(1);
    }

    optimize(budget) {
        let ctx;

        const data = this.data;
        const length = data.length;

        if (length === 0) {
            return;
        }

        const t0 = performance.now();

        while (true) {

            //find next entity
            this.__optimizationPointer++;

            while ((ctx = data[this.__optimizationPointer]) === undefined) {
                this.__optimizationPointer++

                if (this.__optimizationPointer >= length) {
                    this.__optimizationPointer = 0;
                }

            }

            let n = ctx.leaf.parentNode;

            while (n !== null) {

                tryRotateSingleNode(n, leafCount);

                if (Math.random() < 0.5) {
                    //random exit
                    break;
                }

                n = n.parentNode;
            }

            const t1 = performance.now();

            const time = t1 - t0;

            if (time > budget) {
                break;
            }
        }
    }


}

