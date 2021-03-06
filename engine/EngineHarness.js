import Engine from "./Engine.js";
import { MouseEvents } from "./input/devices/events/MouseEvents.js";
import { Transform } from "./ecs/transform/Transform.js";
import TopDownCameraController from "./graphics/ecs/camera/TopDownCameraController.js";
import { Camera } from "./graphics/ecs/camera/Camera.js";
import EntityBuilder from "./ecs/EntityBuilder.js";
import { Light } from "./graphics/ecs/light/Light.js";
import Vector3 from "../core/geom/Vector3.js";
import Terrain from "./ecs/terrain/ecs/Terrain.js";
import Vector2 from "../core/geom/Vector2.js";
import Water from "./graphics/ecs/water/Water.js";
import { loadGameClassRegistry } from "../../model/game/GameClassRegistry.js";
import { WebEnginePlatform } from "./platform/WebEnginePlatform.js";
import Tag from "./ecs/components/Tag.js";
import { SerializationMetadata } from "./ecs/components/SerializationMetadata.js";
import { TerrainLayer } from "./ecs/terrain/ecs/layers/TerrainLayer.js";
import { makeOrbitalCameraController } from "./graphics/camera/makeOrbitalCameraController.js";

/**
 *
 * @param {Engine} engine
 * @returns {Promise}
 */
function setLocale(engine) {
    function getURLHash() {
        const result = {};

        if (window === undefined) {
            return result;
        }

        const location = window.location;

        const hash = location.hash;

        const hashRegEx = /([a-zA-Z0-9\-\_]+)\=([a-zA-Z0-9\-\_]+)/g;

        let match;
        while ((match = hashRegEx.exec(hash)) !== null) {
            const variableName = match[1];
            const value = match[2];

            result[variableName] = value;
        }

        return result;
    }

    const urlHash = getURLHash();

    let locale;
    if (urlHash.lang !== undefined) {
        locale = urlHash.lang;
    } else {
        locale = 'en-gb';
    }

    return engine.localization.loadLocale(locale);
}

export class EngineHarness {
    constructor() {
        /**
         *
         * @type {Engine}
         */
        this.engine = new Engine(new WebEnginePlatform());

        window.engine = this.engine;

        this.p = null;
    }

    /**
     *
     * @returns {Promise<Engine>}
     */
    initialize() {

        if (this.p !== null) {
            return this.p;
        }

        const engine = this.engine;

        const promise = new Promise(async function (resolve, reject) {
            await engine.start();

            await setLocale(engine);

            loadGameClassRegistry(engine.classRegistry);

            engine.sceneManager.create('test');
            engine.sceneManager.set('test');


            document.body.appendChild(engine.viewStack.el);
            engine.viewStack.link();

            function handleInput() {
                window.removeEventListener(MouseEvents.Down, handleInput);

                engine.sound.resumeContext();
            }

            window.addEventListener(MouseEvents.Down, handleInput);

            resolve(engine);
        });

        this.p = promise;

        return promise;
    }

    /**
     *
     * @param {Engine} engine
     * @param {EntityComponentDataset} ecd
     * @param {Vector3} [target]
     * @param {number} [distance]
     * @param {number} [pitch]
     * @param {number} [yaw]
     * @param {boolean} [autoClip]
     * @param {number} [distanceMin]
     * @param {number} [distanceMax]
     * @returns {EntityBuilder}
     */
    static buildCamera(
        {
            engine,
            ecd = engine.entityManager.dataset,
            target = new Vector3(),
            distance = 10,
            pitch = -1.4,
            yaw = 0,
            autoClip = true,
            distanceMin = 0,
            distanceMax = 1000
        }
    ) {
        const transform = new Transform();

        const cameraController = new TopDownCameraController();
        cameraController.pitch = pitch;
        cameraController.yaw = yaw;
        cameraController.distance = distance;
        cameraController.distanceMin = distanceMin;
        cameraController.distanceMax = distanceMax;
        cameraController.target.copy(target);

        const camera = new Camera();

        camera.active.set(true);
        camera.autoClip = autoClip;

        const entityBuilder = new EntityBuilder();

        entityBuilder
            .add(transform)
            .add(cameraController)
            .add(camera)
            .add(Tag.fromJSON(['Camera']))
            .build(ecd);

        console.log('build camera', entityBuilder);

        return entityBuilder;
    }

    /**
     *
     * @param {Engine} engine
     * @param {Vector3} [focus]
     * @param heightMap
     * @param heightRange
     * @param pitch
     * @param yaw
     * @param distance
     * @param {Vector2} [terrainSize]
     * @param {number} [terrainResolution]
     */
    static buildBasics({
                           engine,
                           focus = new Vector3(10, 0, 10),
                           heightMap,
                           heightRange,
                           pitch = -0.7,
                           yaw = 1.2,
                           distance = 10,
                           terrainSize = new Vector2(10, 10),
                           terrainResolution = 10
                       }) {
        EngineHarness.buildLights({ engine: engine });

        const camera = EngineHarness.buildCamera({
            engine,
            target: focus,
            pitch,
            yaw,
            distance
        });

        const cameraEntity = camera.entity;

        EngineHarness.buildTerrain({
            engine,
            heightMap,
            heightRange,
            resolution: terrainResolution,
            size: terrainSize
        });

        EngineHarness.buildOrbitalCameraController({ engine, cameraEntity: cameraEntity });
    }


    /**
     *
     * @param {Engine} engine
     * @param {EntityComponentDataset} ecd
     */
    static buildLights({ engine, ecd = engine.entityManager.dataset }) {
        const key = new Light();
        key.type.set(Light.Type.DIRECTION);
        key.color.setRGB(1, 1, 1);
        key.intensity.set(0.8);
        key.castShadow.set(true);

        const transform = new Transform();
        transform.position.set(30, 70, 30);
        transform.rotation.set(
            -0.18780341950959473,
            0.8049745556929917,
            -0.4533975611897181,
            -0.3334313787830773
        );

        new EntityBuilder()
            .add(key)
            .add(transform)
            .add(Tag.fromJSON(['Light', 'Key']))
            .build(ecd);


        const fill = new Light();
        fill.type.set(Light.Type.AMBIENT);
        fill.color.setRGB(1, 1, 1);
        fill.intensity.set(0.4);


        new EntityBuilder()
            .add(fill)
            .add(new Transform())
            .add(Tag.fromJSON(['Light', 'Ambient']))
            .build(ecd);
    }

    /**
     *
     * @param {number} cameraEntity
     * @param {Engine} engine
     * @param {number} [sensitivity]
     * @param {Element} domElement
     * @param {EntityComponentDataset} [ecd]
     * @returns {EntityBuilder}
     */
    static buildOrbitalCameraController({ cameraEntity, engine, ecd = engine.entityManager.dataset, sensitivity = 0.01 }) {

        const domElement = engine.graphics.domElement;


        domElement.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        const eb = makeOrbitalCameraController({
            camera_entity: cameraEntity,
            ecd,
            dom_element: domElement,
            sensitivity
        });

        eb.add(SerializationMetadata.Transient);

        eb.build(ecd);

        return eb;
    }


    /**
     *
     * @param {Engine} engine
     * @param {Vector2} [size]
     * @param {String} [diffuse0]
     * @param heightMap
     * @param heightRange
     * @param resolution
     * @param waterLevel
     * @param enableWater
     * @returns {Terrain}
     */
    static buildTerrain(
        {
            engine,
            size = new Vector2(10, 10),
            diffuse0 = "data/textures/utility/checkers_dark_grey_256x256.png",
            heightMap = "data/textures/utility/white_pixel.png",
            heightRange = 0,
            resolution = 10,
            waterLevel = 0,
            enableWater = true,
        }
    ) {

        const terrain = new Terrain();

        terrain.size.copy(size);
        terrain.resolution = resolution;
        terrain.gridScale = 2;
        terrain.layers.addLayer(TerrainLayer.from(
            diffuse0,
            5,
            5
        ));
        terrain.splat.resize(1, 1, 1);
        terrain.splat.fillLayerWeights(0, 255);
        terrain.heightMapURL = heightMap;

        terrain.build(engine.assetManager);


        const eb = new EntityBuilder();

        eb.add(terrain);

        if (enableWater) {
            const water = new Water();

            water.level.set(waterLevel);

            eb.add(water);
        }

        eb.build(engine.entityManager.dataset);

        return terrain;

    }
}

let singleton = null;

/**
 *
 * @returns {EngineHarness}
 */
EngineHarness.getSingleton = function () {
    if (singleton === null) {
        singleton = new EngineHarness();
    }

    return singleton;
};

