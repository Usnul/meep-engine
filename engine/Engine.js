/**
 *
 */

import ConcurrentExecutor from '../core/process/executor/ConcurrentExecutor.js';

import { AssetManager } from './asset/AssetManager.js';
import InputEngine from './InputEngine.js';
import { GraphicsEngine } from './graphics/GraphicsEngine.js';
import SoundEngine from './sound/SoundEngine.js';
import { initializeSystems } from '../../model/game/GameSystems.js';
import { PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import { PointerDevice } from "./input/devices/PointerDevice.js";
import KeyboardDevice from "./input/devices/KeyboardDevice.js";
import LevelEngine from '../../model/game/level/LevelEngine.js';
import Grid from './grid/Grid.js';
import Preloader from "./asset/preloader/Preloader.js";
import SceneManager from "./scene/SceneManager.js";

import { StrategyScene } from "../../model/game/scenes/strategy/StrategyScene.js";
import TaskProgressView from '../view/common/TaskProgressView.js';
import CompressionService from "./compression/CompressionService.js";

import GameStateLoader from './save/GameStateLoader.js';

import GUIEngine from './ui/GUIEngine.js';

import dat from 'dat.gui'
import { EntityManager } from "./ecs/EntityManager.js";
import { initAssetManager } from "./asset/GameAssetManager.js";
import { AssetLoaderStatusView } from "../view/asset/AssetLoaderStatusView.js";
import ObservedBoolean from "../core/model/ObservedBoolean.js";
import Vector1 from "../core/geom/Vector1.js";
import { ViewStack } from "../view/elements/navigation/ViewStack.js";
import EmptyView from "../view/elements/EmptyView.js";
import { assert } from "../core/assert.js";
import { makeEngineOptionsModel } from "../../view/game/options/OptionsView.js";
import { StaticKnowledgeDatabase } from "../../model/game/database/StaticKnowledgeDatabase.js";
import Ticker from "./simulation/Ticker.js";
import { Localization } from "../core/Localization.js";
import { TutorialManager } from "../../model/game/tutorial/TutorialManager.js";
import { launchElementIntoFullscreen } from "./graphics/Utils.js";
import { globalMetrics } from "./metrics/GlobalMetrics.js";
import { MetricsCategory } from "./metrics/MetricsCategory.js";
import { AchievementManager } from "./achievements/AchievementManager.js";
import { HelpManager } from "../../model/game/help/HelpManager.js";
import { EffectManager } from "../../model/game/util/effects/script/EffectManager.js";
import { ClassRegistry } from "../core/model/ClassRegistry.js";
import { StoryManager } from "../../model/game/story/dialogue/StoryManager.js";
import { GameSaveStateManager } from "../../view/game/save/GameSaveStateManager.js";
import { BinarySerializationRegistry } from "./ecs/storage/binary/BinarySerializationRegistry.js";
import { EnginePluginManager } from "./plugin/EnginePluginManager.js";


//gui
const gui = new dat.GUI({
    autoPlace: false
});

function EngineSettings() {
    this.graphics_control_viewport_size = new ObservedBoolean(true);
    this.simulation_speed = new Vector1(1);
    this.input_mouse_sensitivity = new Vector1(5);
}

class Engine {
    /**
     *
     * @param {EnginePlatform} platform
     * @constructor
     */
    constructor(platform) {
        assert.defined(platform, 'platform');

        /**
         *
         * @type {EnginePlatform}
         */
        this.platform = platform;

        /**
         *
         * @type {StaticKnowledgeDatabase}
         */
        this.staticKnowledge = new StaticKnowledgeDatabase();

        /**
         *
         * @type {EnginePluginManager}
         */
        this.plugins = new EnginePluginManager();

        this.initialize();
        this.__datGui = gui;

        if (!ENV_PRODUCTION) {
            document.body.appendChild(gui.domElement);
        }

        gui.domElement.classList.add('ui-dev-menu');
    }

    initialize() {

        /**
         *
         * @type {OptionGroup}
         */
        this.options = makeEngineOptionsModel(this);

        /**
         *
         * @type {ClassRegistry}
         */
        this.classRegistry = new ClassRegistry();

        /**
         * @readonly
         * @type {BinarySerializationRegistry}
         */
        this.binarySerializationRegistry = new BinarySerializationRegistry();

        this.settings = new EngineSettings();

        this.executor = new ConcurrentExecutor(0, 10);

        this.services = {
            compression: new CompressionService()
        };

        /**
         *
         * @type {Storage}
         */
        this.storage = this.platform.getStorage();

        /**
         *
         * @type {AssetManager}
         */
        this.assetManager = new AssetManager();
        initAssetManager(this.assetManager);

        this.localization = new Localization();
        this.localization.setAssetManager(this.assetManager);

        this.help = new HelpManager();

        //setup entity component system
        const em = this.entityManager = new EntityManager();


        const innerWidth = window.innerWidth / 3;
        const innerHeight = window.innerHeight / 3;

        this.camera = new ThreePerspectiveCamera(45, innerWidth / innerHeight, 1, 50);


        /**
         *
         * @type {GraphicsEngine}
         */
        const ge = this.graphics = new GraphicsEngine(this.camera, em);

        try {
            ge.start();
        } catch (e) {
            console.log("Failed to start GraphicEngine: ", e);
        }

        this.inputEngine = new InputEngine(ge.domElement, window);

        //sound engine
        const soundEngine = new SoundEngine();
        soundEngine.volume = 1;

        /**
         *
         * @type {SoundEngine}
         */
        this.sound = soundEngine;

        /**
         * Graphical User Interface engine
         * @type {GUIEngine}
         */
        this.gui = new GUIEngine();

        /**
         *
         * @type {TutorialManager}
         */
        this.tutorial = new TutorialManager();
        this.tutorial.attachGUI(this.gui);
        this.tutorial.setLocalization(this.localization);

        this.achievements = new AchievementManager();
        this.achievements.initialize({
            assetManager: this.assetManager,
            gateway: this.platform.getAchievementGateway(),
            localization: this.localization,
            entityManager: this.entityManager
        });

        this.story = new StoryManager();

        this.effects = new EffectManager();
        this.effects.initialize({
            entityManager: this.entityManager,
            assetManager: this.assetManager,
        });

        this.ticker = new Ticker(em);
        this.ticker.subscribe(timeDelta => {
            this.entityManager.simulate(timeDelta);
            this.effects.update(timeDelta);
        });

        /**
         * @readonly
         * @type {SceneManager}
         */
        this.sceneManager = new SceneManager(this.entityManager, this.ticker.clock);

        /**
         * @readonly
         * @type {GameSaveStateManager}
         */
        this.gameSaves = new GameSaveStateManager();
        this.gameSaves.initialize({ storage: this.storage, registry: this.binarySerializationRegistry });

        //
        this.grid = new Grid(this);
        this.levelEngine = new LevelEngine(this.assetManager, this);

        this.devices = {
            pointer: new PointerDevice(window),
            keyboard: new KeyboardDevice(window)
        };
        this.initializeViews();

        //Register game systems
        initializeSystems(this, em, ge, soundEngine, this.assetManager, this.grid, this.devices);

        //init level engine
        this.initDATGUI();

        this.devices.pointer.start();
        this.devices.keyboard.start();

        //process settings
        this.initializeSettings();

        console.log("engine initialized");

        this.gameStateLoader = new GameStateLoader(this);

        /**
         * Toggles GraphicsEngine rendering on and off
         * @type {boolean}
         */
        this.renderingEnabled = true;


        this.plugins.initialize(this);
    }

    initializeViews() {

        const viewport = this.graphics.viewport;

        const gameView = new EmptyView();

        gameView.addClass('game-view');

        gameView.css({
            left: 0,
            top: 0,
            position: "absolute",
            pointerEvents: "none"
        });

        viewport.css({
            pointerEvents: "auto"
        });

        this.gameView = gameView;

        gameView.addChild(viewport);

        this.viewStack = new ViewStack();
        this.viewStack.push(gameView);

        //bind size of renderer viewport to game view
        viewport.bindSignal(gameView.size.onChanged, viewport.size.set.bind(viewport.size));
        gameView.on.linked.add(function () {
            viewport.size.copy(gameView.size);
        });
    }

    initializeSettings() {
        console.log('Initializing engine settings...');

        const engine = this;

        function setViewportToWindowSize() {
            engine.viewStack.size.set(window.innerWidth, window.innerHeight);
        }

        this.settings.graphics_control_viewport_size.process(function (value) {
            if (value) {
                setViewportToWindowSize();
                window.addEventListener("resize", setViewportToWindowSize, false);
            } else {
                window.removeEventListener("resize", setViewportToWindowSize);
            }
        });

        console.log('Engine settings initilized.');
    }

    benchmark() {
        const duration = 2000;
        let count = 0;
        const t0 = Date.now();
        let t1;
        while (true) {
            this.entityManager.simulate(0.0000000001);
            t1 = Date.now();
            if (t1 - t0 > duration) {
                break;
            }
            count++;
        }
        //normalize
        const elapsed = (t1 - t0) / 1000;
        const rate = (count / elapsed);
        return rate;
    }

    initDATGUI() {
        const self = this;

        const ge = this.graphics;
        const fGraphics = gui.addFolder("Graphics");
        fGraphics.add(ge, "postprocessingEnabled").name("Enable post-processing");


        fGraphics.add({
            fullScreen: function () {
                launchElementIntoFullscreen(document.documentElement);
            }
        }, 'fullScreen');
        ge.initGUI(fGraphics);
        //
        const clock = this.ticker.clock;
        const fClock = gui.addFolder("Clock");
        fClock.add(clock, "multiplier", 0, 5, 0.025);
        fClock.add(clock, "pause");
        fClock.add(clock, "start");
        //
        gui.add(this.sound, "volume", 0, 1, 0.025).name("Sound Volume");
        //

        const functions = {
            benchmark: function () {
                const result = self.benchmark();
                window.alert("Benchmark result: " + result + " ticks per second.");
            }
        };
        gui.add(functions, "benchmark").name("Run Benchmark");
        //
        const scenes = {
            combat: function () {
                self.sceneManager.set("combat");
            },
            strategy: function () {
                self.sceneManager.set("strategy");
            }
        };
        gui.add(scenes, "combat").name("Combat Scene");
        gui.add(scenes, "strategy").name("Strategy Scene");

        const datFileLevel = dat_makeFileField(function setLevelAsCurrent(base64URI) {
            function success() {

            }

            function failure() {
                console.error("failed to load level")
            }

            const sm = self.sceneManager;
            sm.set("strategy");
            sm.clear();

            const combatScene = new StrategyScene();
            combatScene.setup(self, {
                levelURL: base64URI
            }, function () {
                //restore scene
                success();
            }, failure);
        });
        gui.add(datFileLevel, "load").name("Load level from disk");
        //
        let entityManager = this.entityManager;
        gui.close();
    }

    /**
     * Returns preloader object
     * @param {String} listURL
     */
    loadAssetList(listURL) {
        const preloader = new Preloader();
        const assetManager = this.assetManager;
        assetManager.get(listURL, "json", function (asset) {
            preloader.addAll(asset.create());
            preloader.load(assetManager);
        });
        return preloader;
    }

    render() {
        if (this.graphics && this.renderingEnabled) {
            this.graphics.render();
        }
    }

    makeLoadingScreen(task) {
        const localization = this.localization;

        const taskProgressView = new TaskProgressView({ task, localization });
        taskProgressView.el.classList.add('loading-screen');

        //add asset manager loading progress
        const loaderStatusView = new AssetLoaderStatusView({ assetManager: this.assetManager, localization });
        taskProgressView.addChild(loaderStatusView);
        taskProgressView.link();

        let __renderingEnabled = this.renderingEnabled;
        this.renderingEnabled = false;


        const domParent = document.body;

        domParent.appendChild(taskProgressView.el);

        const cleanup = () => {
            domParent.removeChild(taskProgressView.el);

            taskProgressView.unlink();

            this.renderingEnabled = __renderingEnabled;
        };

        task.join(cleanup, printError);
    }

    /**
     *
     * @param {Task|TaskGroup} task
     * @returns {Promise<any>}
     */
    loadSlowTask(task) {
        assert.notEqual(task, undefined, 'task was undefined');
        assert.notEqual(task, null, 'task was null');

        const engine = this;

        return new Promise(function (resolve, reject) {

            function cleanup() {
                simulator.resume();
            }

            function success() {
                console.log("Task finished");
                cleanup();
                resolve();
            }

            function failure(e) {
                printError(e);
                cleanup();
                reject();
            }

            const simulator = engine.ticker;
            simulator.pause();

            task.join(success, failure);

            engine.makeLoadingScreen(task);
        });
    }

    /**
     * Startup
     * @returns {Promise}
     */
    start() {
        const self = this;

        function promiseEntityManager() {
            return new Promise(function (resolve, reject) {
                //initialize entity manager
                self.entityManager.startup(resolve, reject);
            });
        }

        return Promise.all([
            this.sound.start()
                .then(promiseEntityManager),
            this.staticKnowledge.load(this.assetManager, this.executor),
            this.tutorial.load(this.assetManager),
            this.help.load(this.assetManager),
            this.gui.startup(this),
            this.achievements.startup(),
            this.effects.startup(),
            this.plugins.startup()
        ]).then(function () {
            self.tutorial.link();

            let frameCount = 0;
            let renderTimeTotal = 0;

            function animate() {
                requestAnimationFrame(animate);
                frameCount++;
                const t0 = performance.now();
                self.render();
                const t1 = performance.now();
                renderTimeTotal += (t1 - t0) / 1000;
            }

            /**
             * Starting the engine
             */
            requestAnimationFrame(animate);
            const frameAccumulationTime = 20;
            setInterval(function () {
                const fpsCPU = frameCount / renderTimeTotal;
                const fpsGPU = frameCount / frameAccumulationTime;
                console.warn("FPS: " + fpsGPU + " [GPU] " + fpsCPU + " [CPU] ");

                //record metric
                const roundedFPS = Math.round(fpsGPU);

                if (roundedFPS > 0) {
                    //only record values where FPS is non-zero
                    globalMetrics.record("frame-rate", {
                        category: MetricsCategory.System,
                        label: roundedFPS.toString(),
                        value: roundedFPS
                    });
                }

                frameCount = 0;
                renderTimeTotal = 0;
            }, frameAccumulationTime * 1000);
            //start simulation
            self.ticker.start({ maxTimeout: 200 });
            //self.uiController.init(self);

            //load options
            self.options.attachToStorage('lazykitty.komrade.options', self.storage);

            console.log("engine started");
        }, function (e) {
            console.error("Engine Failed to start.", e);
        });

    }

    exit() {
        window.close();
    }

    /**
     * @returns {Promise}
     */
    requestExit() {
        return this.gui.confirmTextDialog({
            title: this.localization.getString('system_confirm_exit_to_system.title'),
            text: this.localization.getString('system_confirm_exit_to_system.text')
        }).then(() => {
            this.exit();
        });
    }
}


/**
 * @readonly
 * @type {boolean}
 */
Engine.prototype.isEngine = true;

function dat_makeFileField(callback) {
    const el = document.createElement('input');
    el.type = "file";
    el.style.visibility = "hidden";

    const result = {
        load: function () {
            el.click();
            el.onchange = function () {
                const files = el.files;
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        callback(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };
    return result;
}

function printError(reason) {
    console.error.apply(console, arguments);
}

export default Engine;
