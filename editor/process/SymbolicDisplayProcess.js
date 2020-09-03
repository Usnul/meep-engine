import { EditorProcess } from "./EditorProcess.js";
import { ParticleEmitter } from "../../engine/graphics/particles/particular/engine/emitter/ParticleEmitter.js";
import RenderSystem from "../../engine/ecs/systems/RenderSystem.js";
import { Camera } from "../../engine/graphics/ecs/camera/Camera.js";
import { Light } from "../../engine/graphics/ecs/light/Light.js";
import { ComponentSymbolicDisplay } from "./symbolic/ComponentSymbolicDisplay.js";
import { makeSocketsSymbolicDisplay } from "./symbolic/makeSocketsSymbolicDisplay.js";
import { makeParticleEmitterSymbolicDisplay } from "./symbolic/makeParticleEmitterSymbolicDisplay.js";
import { assert } from "../../core/assert.js";
import { makeSoundEmitterSymbolicDisplay } from "./symbolic/makeSoundEmitterSymbolicDisplay.js";
import { SoundEmitter } from "../../engine/sound/ecs/emitter/SoundEmitter.js";
import { makeCameraSymbolicDisplay } from "./symbolic/makeCameraSymbolicDisplay.js";
import { makePathSymbolicDisplay } from "./symbolic/makePathSymbolicDisplay.js";
import { makePositionedIconDisplaySymbol } from "./symbolic/makePositionedIconDisplaySymbol.js";
import { makeLightSymbolicDisplay } from "./symbolic/makeLightSymbolicDisplay.js";
import { makeGridPositionSymbolDisplay } from "./symbolic/makeGridPositionSymbolDisplay.js";


class SymbolicDisplayProcess extends EditorProcess {
    constructor() {
        super();

        this.name = SymbolicDisplayProcess.Id;

        const self = this;
        this.requiredSystems = [{
            klass: RenderSystem,
            factory: function () {
                return new RenderSystem(self.editor.engine.graphics);
            }
        }];

        this.displays = [];

        this.spawnedSystems = [];
    }

    initialize(editor) {
        super.initialize(editor);

        const engine = editor.engine;

        assert.defined(engine, 'engine');

        /**
         *
         * @type {ComponentSymbolicDisplay[]}
         */
        this.displays = [
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/particles.png", ParticleEmitter),
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/camera.png", Camera),
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/light.png", Light),
            makePositionedIconDisplaySymbol(engine, "data/textures/icons/editor/sound.png", SoundEmitter),

            makeCameraSymbolicDisplay(engine),
            makeLightSymbolicDisplay(engine),
            makeGridPositionSymbolDisplay(engine),
            makePathSymbolicDisplay(engine),
            makeSocketsSymbolicDisplay(engine),
            makeParticleEmitterSymbolicDisplay(engine),
            makeSoundEmitterSymbolicDisplay(engine)
        ];

        this.displays.forEach(d => d.initialize(editor));
    }

    startup() {
        super.startup();


        const self = this;

        const entityManager = this.editor.engine.entityManager;

        this.requiredSystems.forEach(systemDescriptor => {

            const foundSystem = entityManager.systems.find(system => system instanceof systemDescriptor.klass);

            if (foundSystem === undefined) {
                const system = systemDescriptor.factory();

                self.spawnedSystems.push(system);

                entityManager.addSystem(system);
            }
        });

        this.displays.forEach(d => d.startup());
    }

    shutdown() {
        super.shutdown();

        const entityManager = this.editor.engine.entityManager;


        this.displays.forEach(d => d.shutdown());


        this.spawnedSystems.forEach(s => {
            entityManager.removeSystem(s);
        });

        this.spawnedSystems = [];
    }
}

SymbolicDisplayProcess.Id = 'symbolic-display-process';

export { SymbolicDisplayProcess };
