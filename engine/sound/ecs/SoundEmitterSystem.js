/**
 * User: Alex Goldring
 * Date: 11/6/2014
 * Time: 18:36
 */


import { System } from '../../ecs/System.js';
import { SoundEmitter } from './SoundEmitter.js';
import { Transform } from '../../ecs/components/Transform.js';
import { SoundTrackNodes } from "./SoundTrackNodes.js";
import { SoundAssetManager } from "../../asset/loaders/SoundAssetManager.js";
import { GameAssetType } from "../../asset/GameAssetType.js";
import { BinaryNode } from "../../../core/bvh2/BinaryNode.js";

/**
 * @readonly
 * @enum {string}
 */
export const SoundEmitterChannels = {
    Effects: 'effects',
    Music: 'music',
    Ambient: 'ambient'
};

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
        const bvhLeaf = emitter.__bvhLeaf;

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
         * Spatial index
         * @type {BinaryNode}
         * @private
         */
        this.__bvh = new BinaryNode();
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
        nodes.volume = context.createGain();

        if (emitter.isPositioned) {
            nodes.panner = context.createPanner();
            nodes.volume.connect(nodes.panner);
            nodes.panner.connect(targetNode);
            //
            nodes.panner.panningModel = 'HRTF';
            nodes.panner.rolloffFactor = emitter.distanceRolloff;
            nodes.panner.refDistance = emitter.distanceMin;
            nodes.panner.maxDistance = emitter.distanceMax;
        } else {
            nodes.volume.connect(targetNode);
        }


        //volume
        nodes.volume.gain.setValueAtTime(emitter.volume.getValue(), 0);

        const ctx = new SoundEmitterComponentContext();

        ctx.system = this;
        ctx.transform = transform;
        ctx.emitter = emitter;

        ctx.link();

        ctx.update();

        this.data[entity] = ctx;

        //attach bvh
        this.__bvh.insertNode(emitter.__bvhLeaf);
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

        }

        emitter.__bvhLeaf.disconnect();

        const nodes = emitter.nodes;

        if (nodes.panner !== null) {
            //doesn't require destination
            nodes.panner.disconnect();
        } else if (nodes.volume !== null) {
            //doesn't require destination
            nodes.volume.disconnect();
        }

    }

    update(timeDelta) {
        const entityManager = this.entityManager;
        const ecd = entityManager.dataset;

        /**
         *
         * @param {SoundTrack} track
         */
        function updateTrack(track) {
            if (track.playing) {
                track.time += timeDelta;
            }
        }

        /**
         *
         * @param {SoundEmitter} soundEmitter
         */
        function visitSoundEmitter(soundEmitter) {
            soundEmitter.tracks.forEach(updateTrack);
        }

        if (ecd !== null) {
            ecd.traverseComponents(SoundEmitter, visitSoundEmitter);
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
