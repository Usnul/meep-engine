import { assert } from "../../../../../../core/assert.js";
import Graph from "../../../../../../core/graph/Graph.js";
import { Edge, EdgeDirectionType } from "../../../../../../core/graph/Edge.js";
import { FunctionModuleReference } from "./FunctionModuleReference.js";

export class FunctionModuleRegistry {
    constructor() {

        /**
         *
         * @type {Object<FunctionModule>}
         */
        this.modules = {};

    }

    /**
     * Materialize entire dependency graph for the registry.
     * Dependency relationship edges have direction from dependant towards dependency
     * @private
     * @returns {Graph<FunctionModule>}
     */
    __buildDependencyGraph() {
        /**
         *
         * @type {Graph<FunctionModule>}
         */
        const result = new Graph();

        /**
         *
         * @type {FunctionModule[]}
         */
        const open = [];

        this.traverse(open.push, open);

        const module_count = open.length;

        // ingest nodes
        for (let i = 0; i < module_count; i++) {
            const module = open[i];

            result.addNode(module);
        }

        // build dependency edges
        while (open.length > 0) {

            /**
             *
             * @type {FunctionModule}
             */
            const module = open.pop();

            // get dependencies
            const dependencies = module.dependencies;

            const dependency_count = dependencies.length;

            for (let i = 0; i < dependency_count; i++) {
                const reference = dependencies[i];

                const dependency_module = this.getModuleByReference(reference);

                if (dependency_module === undefined) {
                    throw new Error(`Failed to satisfy dependency for module ${module.id}, dependency reference: ${reference}`);
                }

                // create dependency edge
                const edge = new Edge(module, dependency_module);

                edge.direction = EdgeDirectionType.Forward;

                result.addEdge(edge);
            }

        }


        return result;
    }

    /**
     *
     * @param {FunctionModuleReference} reference
     * @returns {FunctionModule|undefined}
     */
    getModuleByReference(reference) {
        assert.defined(reference, 'reference');
        assert.equal(reference.isFunctionModuleReference, true, 'reference.isFunctionModuleReference !== true');

        const match_by_id = this.getModule(reference.id);

        if (match_by_id === undefined) {
            // no ID match
            return undefined;
        }

        if (!match_by_id.signature.equals(reference.signature)) {
            // no signature match
            return undefined;
        }

        return match_by_id;
    }

    /**
     *
     * @param {FunctionModuleReference[]} references
     * @returns {FunctionModuleReference[]} full list of references involved
     */
    resolveDependencyTreeForReferences(references) {
        /**
         *
         * @type {FunctionModuleReference[]}
         */
        const result = [];

        /**
         *
         * @type {FunctionModule[]}
         */
        const open = [];

        /**
         *
         * @type {FunctionModule[]}
         */
        const unordered = [];

        function addToOpen(module) {
            if (open.includes(module)) {
                return;
            }

            if (unordered.includes(module)) {
                return;
            }

            open.push(module);
        }

        const n = references.length;
        for (let i = 0; i < n; i++) {
            const reference = references[i];

            const module = this.getModuleByReference(reference);

            if (module === undefined) {
                throw new Error(`Module not found: ${reference}`);
            }

            addToOpen(module);
        }

        const graph = this.__buildDependencyGraph();

        /**
         *
         * @param {FunctionModule} dependency
         * @param {Edge} edge
         */
        function visitDependencyEdge(dependency, edge) {
            addToOpen(dependency);
        }

        while (open.length > 0) {
            const module = open.pop();
            // move to closed
            unordered.push(module);


            graph.traverseSuccessors(module, visitDependencyEdge);
        }

        /**
         *
         * @type {FunctionModule[]}
         */
        const ordered = [];

        ordering_loop:while (unordered.length > 0) {
            const n = unordered.length;

            module_loop: for (let i = 0; i < n; i++) {
                const module = unordered[i];

                const moduleDependencies = module.dependencies;

                const dependency_count = moduleDependencies.length;

                for (let j = 0; j < dependency_count; j++) {
                    const dependency = moduleDependencies[j];

                    const dependency_module = this.getModuleByReference(dependency);

                    if (dependency_module === undefined) {
                        throw  new Error(`Dependency not found, dependent=${reference}, dependency=${dependency}`);
                    }

                    if (!ordered.includes(dependency_module)) {
                        continue module_loop;
                    }

                }

                ordered.push(module);
                unordered.splice(i, 1);

                continue ordering_loop;
            }

            // if we got here, no module was ordered this time around, meaning we're stuck

            throw new Error(`No ordering found for modules: ${unordered.map(m => FunctionModuleReference.from(m.id, m.signature)).join(', ')}`);
        }

        const ordered_count = ordered.length;
        for (let i = 0; i < ordered_count; i++) {
            const module = ordered[i];

            const ref = FunctionModuleReference.from(module.id, module.signature);

            result.push(ref);
        }

        return result;
    }

    /**
     *
     * @param {FunctionModule} module
     * @returns {boolean}
     */
    add(module) {
        assert.defined(module, 'module');
        assert.equal(module.isFunctionModule, true, 'module.isFunctionModule !== true');

        if (this.getModule(module.id) !== undefined) {
            // id collision
            return false;
        }


        this.modules[module.id] = module;

        return true;
    }

    /**
     *
     * @param {string} id
     * @returns {FunctionModule|undefined}
     */
    getModule(id) {
        assert.typeOf(id, 'string', 'id');

        return this.modules[id];
    }

    /**
     *
     * @param {function(FunctionModule)} visitor
     * @param {*} [thisArg]
     */
    traverse(visitor, thisArg) {
        for (const module_id in this.modules) {
            const module = this.modules[module_id];

            visitor.call(thisArg, module)
        }
    }

}
