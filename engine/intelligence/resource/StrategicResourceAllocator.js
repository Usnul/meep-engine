import { ResourceAllocationSolver } from "./ResourceAllocationSolver.js";
import { assert } from "../../../core/assert.js";
import { buildPromiseChain } from "../../../core/process/buildPromiseChain.js";

export class StrategicResourceAllocator {
    constructor() {
        /**
         *
         * @type {TacticalModule[]}
         */
        this.modules = [];

        /**
         * @private
         * @type {Array<function(ActionSequence[]):Promise<ActionSequence[]>>}
         */
        this.sequenceTransformers = [];
    }

    /**
     * Add a sequence transformer, these are applied as a final step during resource allocation
     * @param {function(ActionSequence[]):Promise<ActionSequence[]>} t
     */
    addTransformer(t) {
        this.sequenceTransformers.push(t);
    }

    /**
     *
     * @param {TacticalModule} module
     */
    addTacticalModule(module) {
        assert.defined(module, 'module');

        this.modules.push(module);
    }

    /**
     * @template A
     * @param {Resource[]} resources
     * @returns {Promise<A[]>} actions
     */
    allocate(resources) {

        /**
         *
         * @type {Map<ResourceAllocationBid, TacticalModule>}
         */
        const bids = new Map();


        return new Promise((resolve, reject) => {
            const moduleResults = this.modules.map(m => {
                const promise = m.collectBids(resources);

                assert.notEqual(promise, undefined, 'promise is undefined');
                assert.notEqual(promise, null, 'promise is null');
                assert.typeOf(promise.then, 'function', "promise.then");

                promise.then(moduleBids => {

                    assert.ok(Array.isArray(moduleBids), `moduleBids expected to be an array, was something else (typeof='${typeof moduleBids}')`);

                    moduleBids.forEach(b => bids.set(b, m));

                });

                return promise;
            });

            resolve(moduleResults);
        })
            .then(moduleResults => Promise.all(moduleResults))
            .then(() => {
                /**
                 *
                 * @type {ResourceAllocationSolver}
                 */
                const solver = new ResourceAllocationSolver();

                //set resources
                solver.addResources(resources);
                //set bids
                bids.forEach((m, b) => solver.addBid(b));

                /**
                 *
                 * @type {ResourceAllocationBid[]}
                 */
                const allocations = solver.solve();

                const actionSequences = allocations.map(a => a.actions);

                //sort action sequences based on their priorities, higher priority sequences first
                actionSequences.sort((a, b) => {

                    const aPriority = a.getPriority();
                    const bPriority = b.getPriority();

                    return bPriority - aPriority
                });

                return actionSequences;
            })
            .then(sequences => {
                // Apply sequence transformers
                const sequenceTransformers = this.sequenceTransformers;
                const nSequenceTransformers = sequenceTransformers.length;

                const factories = [];

                for (let i = 0; i < nSequenceTransformers; i++) {
                    const sequenceProcessor = sequenceTransformers[i];

                    factories.push(input => sequenceProcessor(input));
                }

                return buildPromiseChain({ factories, head: Promise.resolve(sequences) });
            })
            .then(sequences => {
                //extract actions from sequences in order
                const actions = sequences.map(s => s.actions).flat();

                return actions;
            });
    }
}
