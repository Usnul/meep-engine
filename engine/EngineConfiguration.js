export class EngineConfiguration {
    constructor() {
        /**
         *
         * @type {System[]}
         */
        this.systems = [];

        /**
         *
         * @type {EnginePlugin[]}
         */
        this.plugins = [];

        /**
         *
         * @type {StaticKnowledgeDataTableDescriptor[]}
         */
        this.knowledge = [];
    }

    /**
     *
     * @param {Engine} engine
     */
    async apply(engine) {
        // Knowledge tables

        const knowledgeTableCount = this.knowledge.length;
        for (let i = 0; i < knowledgeTableCount; i++) {
            const tableDescriptor = this.knowledge[i];

            engine.staticKnowledge.add(tableDescriptor.id, tableDescriptor.source, tableDescriptor.table);
        }

        // Plugins

        const plugins = engine.plugins;

        const pluginCount = this.plugins.length;
        for (let i = 0; i < pluginCount; i++) {
            const enginePlugin = this.plugins[i];

            await plugins.add(enginePlugin);
        }

        // Systems

        const em = engine.entityManager;

        const systemCount = this.systems.length;
        for (let i = 0; i < systemCount; i++) {
            const system = this.systems[i];

            em.addSystem(system);
        }


    }
}
