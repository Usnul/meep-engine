/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 18:36
 */


import { System } from '../../../ecs/System.js';
import { SoundEmitter } from './SoundEmitter.js';
import { Transform } from '../../../ecs/transform/Transform.js';
import { SoundTrackNodes } from "./SoundTrackNodes.js";
import { SoundAssetManager } from "../../../asset/loaders/SoundAssetManager.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";
import { BinaryNode } from "../../../../core/bvh2/BinaryNode.js";
import SoundListener from "../SoundListener.js";
import { IncrementalDeltaSet } from "../../../graphics/render/visibility/IncrementalDeltaSet.js";
import { queryBinaryNode_SphereIntersections_Data } from "../../../../core/bvh2/traversal/queryBinaryNode_SphereIntersections.js";
import { LeafNode } from "../../../../core/bvh2/LeafNode.js";
import { tryRotateSingleNode } from "../../../../core/bvh2/transform/RotationOptimizer.js";

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

class SoundEmitterComponentContext {
    constructor() {

        /**
         *
         * @type {SoundEmitter}
         */
        this.emitter = null;

        /**
         *
         * @type {Transform}
         */
        this.transform = null;

        /**
         *
         * @type {SoundEmitterSystem}
         */
        this.system = null;

        /**
         *
         * @type {AudioNode}
         */
        this.targetNode = null;

        /**
         *
         * @type {LeafNode}
         */
        this.leaf = new LeafNode(this, 0, 0, 0, 0, 0, 0);

        /**
         *
         * @type {boolean}
         * @private
         */
        this.__isConnected = false;
    }

    update() {

        const position = this.transform.position;

        /**
         *
         * @type {SoundEmitter}
         */
        const emitter = this.emitter;

        const x = position.x;
        const y = position.y;
        const z = position.z;

        setEmitterPosition(emitter, x, y, z);

        /**
         *
         * @type {LeafNode}
         */
        const bvhLeaf = this.leaf;

        const distanceMax = emitter.distanceMax;

        bvhLeaf.resize(
            x - distanceMax,
            y - distanceMax,
            z - distanceMax,
            x + distanceMax,
            y + distanceMax,
            z + distanceMax
        );
    }

    /**
     *
     * @param {SoundTrack} track
     */
    addTrack(track) {
        const system = this.system;

        const context = system.webAudioContext;
        const assetManager = system.assetManager;

        registerTrack(context, assetManager, this.emitter, track);
    }

    /**
     *
     * @param {SoundTrack} track
     */
    removeTrack(track) {
        unregisterTrack(track);
    }

    connect() {
        if (this.__isConnected) {
            return;
        }

        const targetNode = this.emitter.getTargetNode();

        targetNode.connect(this.targetNode);

        this.__isConnected = true;
    }

    disconnect() {
        if (!this.__isConnected) {
            return;
        }

        const targetNode = this.emitter.getTargetNode();

        if (targetNode !== null) {
            targetNode.disconnect();
        }

        this.__isConnected = false;
    }

    link() {
        this.transform.position.onChanged.add(this.update, this);

        this.emitter.tracks.forEach(this.addTrack, this);

        this.emitter.tracks.on.added.add(this.addTrack, this);
        this.emitter.tracks.on.removed.add(this.removeTrack, this);
    }

    unlink() {
        this.transform.position.onChanged.remove(this.update, this);

        this.emitter.tracks.on.added.remove(this.addTrack, this);
        this.emitter.tracks.on.removed.remove(this.removeTrack, this);

        this.emitter.tracks.forEach(this.removeTrack, this);

        this.disconnect();
    }


}


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

                if (emitter.isPositioned) {
                    const distance = listenerPosition.distanceTo(ctx.transform.position);

                    if (distance > emitter.distanceMax) {
                        //emitter is too far away
                        continue;
                    }

                    emitter.writePannerVolume(distance);
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

            if (!emitter.isPositioned) {
                activeSet.push(ctx);
            }

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


/**
 *
 * @param {SoundTrack} soundTrack
 */
function unregisterTrack(soundTrack) {
    soundTrack.nodes.volume.disconnect();
}

/**
 *
 * @param {AudioContext} context
 * @param {AssetManager} assetManager
 * @param {SoundEmitter} soundEmitter
 * @param {SoundTrack} soundTrack
 */
function registerTrack(context, assetManager, soundEmitter, soundTrack) {
    const targetNode = soundEmitter.nodes.volume;

    const nodes = soundTrack.nodes = new SoundTrackNodes(context);
    //connect to target
    nodes.volume.connect(targetNode);

    nodes.source.loop = soundTrack.loop;
    nodes.volume.gain.setValueAtTime(soundTrack.volume, 0);
    //
    assetManager.get(soundTrack.url, GameAssetType.Sound, function (asset) {
        /**
         *
         * @type {AudioBuffer}
         */
        const buffer = asset.create();

        // Make the sound source use the buffer and start playing it.
        if (nodes.source.buffer !== buffer) {
            nodes.source.buffer = buffer;
        }

        if (soundTrack.startWhenReady) {
            //TODO: figure out a way to use AudioBuffer.playbackRate.value to control speed of playback
            nodes.source.start(0, soundTrack.time);
            soundTrack.playing = true;
        }

    }, function (error) {
        console.error(`failed to load sound track '${soundTrack.url}' : `, error);
    });

    nodes.source.onended = function () {
        if (!nodes.source.loop) {
            soundTrack.playing = false;
            soundTrack.on.ended.dispatch();

            //remove track
            soundEmitter.tracks.removeOneOf(soundTrack);
        }
    };
}


/**
 *
 * @param {SoundEmitter} emitter
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function setEmitterPosition(emitter, x, y, z) {
    const nodes = emitter.nodes;
    if (nodes.panner !== null) {
        const panner = nodes.panner;
        panner.setPosition(x, y, z);
    }
}
