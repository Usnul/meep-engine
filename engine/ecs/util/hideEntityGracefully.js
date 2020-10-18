import { ParticleEmitter } from "../../graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import { ParticleEmitterFlag } from "../../graphics/particles/particular/engine/emitter/ParticleEmitterFlag.js";
import { max2, min2 } from "../../../core/math/MathUtils.js";
import Trail2D, { Trail2DFlags } from "../../graphics/ecs/trail2d/Trail2D.js";
import { Transform } from "../transform/Transform.js";
import Mesh, { MeshFlags } from "../../graphics/ecs/mesh/Mesh.js";
import { TweenVector3Behavior } from "../../../../model/game/util/behavior/TweenVector3Behavior.js";
import { BehaviorComponent } from "../../intelligence/behavior/ecs/BehaviorComponent.js";
import { SequenceBehavior } from "../../intelligence/behavior/composite/SequenceBehavior.js";
import { DieBehavior } from "../../../../model/game/util/behavior/DieBehavior.js";
import { SoundEmitter } from "../../sound/ecs/emitter/SoundEmitter.js";
import { TweenVector1Behavior } from "../../../../model/game/util/behavior/TweenVector1Behavior.js";
import { DelayBehavior } from "../../../../model/game/util/behavior/DelayBehavior.js";

const SHUTDOWN_GRACE_PERIOD = 10;
/**
 *
 * @param {EntityBuilder} builder
 * @param {function():EntityBuilder} createEntity
 * @param {*} [createEntityThisArg]
 * @return {number} duration in seconds until the entity is completely hidden
 */
export function hideEntityGracefully(builder, createEntity, createEntityThisArg) {
    let delay = 0;

    /**
     *
     * @type {ParticleEmitter}
     */
    const emitter = builder.getComponent(ParticleEmitter);

    if (emitter !== null) {

        //stop emission
        emitter.clearFlag(ParticleEmitterFlag.Emitting);

        //figure out how long the emitter should stay alive
        const maxLife = emitter.computeMaxEmittingParticleLife();

        if (Number.isFinite(maxLife)) {
            delay = max2(maxLife, delay);
        }
    }

    /**
     *
     * @type {Trail2D}
     */
    const trail = builder.getComponent(Trail2D);

    if (trail !== null) {
        trail.clearFlag(Trail2DFlags.Spawning);

        if (Number.isFinite(trail.maxAge)) {
            delay = max2(trail.maxAge, delay);
        }
    }

    /**
     *
     * @type {Transform}
     */
    const transform = builder.getComponent(Transform);

    /**
     *
     * @type {Mesh}
     */
    const mesh = builder.getComponent(Mesh);

    if (mesh !== null && transform !== null) {

        if (mesh.getFlag(MeshFlags.Loaded | MeshFlags.InView) && !transform.scale.isZero()) {
            const scale = new TweenVector3Behavior();

            scale.startValue.copy(transform.scale);
            scale.targetValue.set(0, 0, 0);
            scale.target = transform.scale;

            scale.duration = 0.2;

            delay = max2(scale.duration, delay);

            const eb = createEntity.call(createEntityThisArg);

            eb.add(BehaviorComponent.fromOne(SequenceBehavior.from([
                scale,
                DieBehavior.create()
            ])));

        } else {
            transform.scale.set(0, 0, 0);
        }

    }

    /**
     *
     * @type {SoundEmitter}
     */
    const soundEmitter = builder.getComponent(SoundEmitter);

    if (soundEmitter !== null && soundEmitter.volume.getValue() > 0) {

        const tracks = soundEmitter.tracks.asArray();

        const n = tracks.length;


        for (let i = 0; i < n; i++) {
            const soundTrack = tracks[i];

            if (soundTrack.volume > 0) {

                const setVolume = new TweenVector1Behavior();

                setVolume.startValue = soundEmitter.volume.getValue();
                setVolume.targetValue = 0;

                setVolume.target = soundEmitter.volume;

                setVolume.duration = 2.7;

                delay = SHUTDOWN_GRACE_PERIOD;

                const eb = createEntity.call(createEntityThisArg);

                eb.add(BehaviorComponent.fromOne(SequenceBehavior.from([
                    DelayBehavior.from(SHUTDOWN_GRACE_PERIOD - setVolume.duration),
                    setVolume,
                    DieBehavior.create()
                ])));

                break;
            }
        }
    }

    delay = min2(delay, SHUTDOWN_GRACE_PERIOD);

    return delay;
}
