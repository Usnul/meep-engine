import { LeafNode } from "../../../../core/bvh2/LeafNode.js";
import { SoundTrackNodes } from "./SoundTrackNodes.js";
import { GameAssetType } from "../../../asset/GameAssetType.js";
import { SoundEmitterFlags } from "./SoundEmitterFlags.js";
import { SoundTrackFlags } from "./SoundTrackFlags.js";

export class SoundEmitterComponentContext {
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

        if (emitter.getFlag(SoundEmitterFlags.Spatialization)) {
            //update position of the panner node
            const nodes = emitter.nodes;

            /**
             *
             * @type {PannerNode}
             */
            const panner = nodes.panner;

            if (panner !== null) {
                panner.setPosition(x, y, z);
            }
        }

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
     * @param {SoundTrack} soundTrack
     */
    addTrack(soundTrack) {
        const system = this.system;

        const emitter = this.emitter;

        const context = system.webAudioContext;
        const assetManager = system.assetManager;
        const targetNode = emitter.nodes.volume;

        const nodes = soundTrack.nodes = new SoundTrackNodes(context);

        //connect to target
        nodes.volume.connect(targetNode);

        nodes.source.loop = soundTrack.getFlag(SoundTrackFlags.Loop);
        nodes.volume.gain.setValueAtTime(soundTrack.volume, 0);

        //
        const track_url = soundTrack.url;

        let asset_path;

        if (soundTrack.getFlag(SoundTrackFlags.UsingAliasURL)) {
            asset_path = assetManager.resolveAlias(track_url);
        } else {
            asset_path = track_url;
        }

        assetManager.get(asset_path, GameAssetType.Sound, function (asset) {
            /**
             *
             * @type {AudioBuffer}
             */
            const buffer = asset.create();

            // Make the sound source use the buffer and start playing it.
            if (nodes.source.buffer !== buffer) {
                nodes.source.buffer = buffer;
            }

            if (soundTrack.getFlag(SoundTrackFlags.StartWhenReady)) {
                //TODO: figure out a way to use AudioBuffer.playbackRate.value to control speed of playback
                nodes.source.start(0, soundTrack.time);
                soundTrack.setFlag(SoundTrackFlags.Playing);
            }

        }, console.error);

        nodes.source.onended = function () {
            if (!nodes.source.loop) {
                soundTrack.clearFlag(SoundTrackFlags.Playing);

                soundTrack.on.ended.dispatch();

                //remove track
                emitter.tracks.removeOneOf(soundTrack);
            }
        };
    }

    /**
     *
     * @param {SoundTrack} track
     */
    removeTrack(track) {
        /**
         *
         * @type {GainNode}
         */
        const volume = track.nodes.volume;

        volume.disconnect();
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
