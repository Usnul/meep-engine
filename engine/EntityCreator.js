/**
 * Created by Alex on 02/04/2014.
 */
import Transform from './ecs/components/Transform.js';
import { SoundEmitter } from './sound/ecs/SoundEmitter.js';
import Timer from './ecs/components/Timer.js';
import EntityBuilder from './ecs/EntityBuilder.js';
import Vector3 from "../core/geom/Vector3.js";
import { SoundEmitterChannels } from "./sound/ecs/SoundEmitterSystem.js";
import { BehaviorComponent } from "./intelligence/behavior/ecs/BehaviorComponent.js";
import { SequenceBehavior } from "./intelligence/behavior/composite/SequenceBehavior.js";
import { DelayBehavior } from "../../model/game/util/behavior/DelayBehavior.js";
import { DieBehavior } from "../../model/game/util/behavior/DieBehavior.js";
import { SerializationMetadata } from "./ecs/components/SerializationMetadata.js";

/**
 *
 * @param {Vector3} [position]
 * @param {number} [timeout]
 * @param {String} [url]
 * @param {SoundTrack} [track]
 * @param {boolean} [positioned]
 * @param {String|SoundEmitterChannels} [channel]
 * @param {number} [volume]
 * @returns {EntityBuilder}
 */
function createSound(
    {
        position = Vector3.zero,
        timeout = 60,
        url,

        track,
        positioned = true,
        channel = SoundEmitterChannels.Effects,
        volume = 1
    }
) {

    const builder = new EntityBuilder();

    let trackJSON;

    if (url !== undefined) {
        trackJSON = {
            url: url,
            startWhenReady: true
        };
    } else {
        trackJSON = track.toJSON();
    }

    const soundEmitter = SoundEmitter.fromJSON({
        tracks: [trackJSON],
        isPositioned: positioned,
        volume: volume,
        loop: false,
        channel
    });


    const soundTrack = soundEmitter.tracks.last();
    soundTrack.on.ended.add(builder.destroy, builder);

    builder
        .add(SerializationMetadata.Transient) //make sound transient
        .add(BehaviorComponent.fromOne(SequenceBehavior.from([
            DelayBehavior.from(timeout),
            DieBehavior.create()
        ])))
        .add(Transform.fromJSON({ position: position }))
        .add(soundEmitter);
    return builder;
}

/**
 *
 * @param timeout
 * @param action
 * @returns {EntityBuilder}
 */
export function createTimer({ timeout, action }) {
    const builder = new EntityBuilder();

    function suicide() {
        builder.destroy();
    }

    builder.add(new Timer({
        timeout,
        actions: [
            action,
            suicide
        ]
    }));

    return builder;
}

export { createSound };
