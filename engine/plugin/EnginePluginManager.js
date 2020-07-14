import { BaseProcess } from "../../core/process/BaseProcess.js";
import { ProcessState } from "../../core/process/ProcessState.js";

export class EnginePluginManager extends BaseProcess {
    constructor() {
        super();

        /**
         *
         * @type {EnginePlugin[]}
         */
        this.plugins = [];

        /**
         *
         * @type {Engine}
         */
        this.engine = null;
    }

    /**
     *
     * @param {Engine} engine
     */
    initialize(engine) {
        this.engine = engine;

        super.initialize();

        //start up all the plugins
        const enginePlugins = this.plugins;
        const n = enginePlugins.length;


        for (let i = 0; i < n; i++) {
            const plugin = enginePlugins[i];

            plugin.initialize(engine);

        }

    }

    async finalize() {
        super.finalize();

        //start up all the plugins
        const enginePlugins = this.plugins;
        const n = enginePlugins.length;

        for (let i = 0; i < n; i++) {
            const plugin = enginePlugins[i];

            plugin.finalize();

        }

    }

    async startup() {

        //start up all the plugins
        const enginePlugins = this.plugins;
        const n = enginePlugins.length;

        const promises = [];

        for (let i = 0; i < n; i++) {
            const plugin = enginePlugins[i];

            const promise = plugin.startup();

            promises.push(promise);
        }

        await Promise.all(promises);

        super.startup();
    }

    async shutdown() {

        //start up all the plugins
        const enginePlugins = this.plugins;
        const n = enginePlugins.length;

        const promises = [];

        for (let i = 0; i < n; i++) {
            const plugin = enginePlugins[i];

            const promise = plugin.shutdown();

            promises.push(promise);
        }

        await Promise.all(promises);

        super.shutdown();
    }

    /**
     *
     * @param {EnginePlugin} plugin
     */
    async add(plugin) {
        const existing = this.getById(plugin.id);

        if (existing !== undefined) {
            throw new Error(`Plugin with id '${plugin.id}' already exists`);
        }

        this.plugins.push(plugin);

        const state = this.getState().getValue();

        if (state === ProcessState.Initialized) {

            await plugin.initialize(this.engine);

        } else if (state === ProcessState.Running) {

            await plugin.initialize(this.engine).then(() => {
                return plugin.startup();
            });

        }
    }

    /**
     * @template T
     * @param {string} id
     * @returns {EnginePlugin|T|undefined}
     */
    getById(id) {
        const plugins = this.plugins;
        const n = plugins.length;
        for (let i = 0; i < n; i++) {
            const enginePlugin = plugins[i];

            if (enginePlugin.id === id) {
                return enginePlugin;
            }
        }
    }
}
