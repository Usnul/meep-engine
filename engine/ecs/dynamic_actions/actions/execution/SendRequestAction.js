import { AsynchronousAction } from "../../../../../core/process/action/AsynchronousAction.js";
import { Transform } from "../../../transform/Transform.js";

export class SendRequestAction extends AsynchronousAction {

    /**
     *
     * @param {SendRequestActionDescription} def
     * @param {number} actor
     * @param {EntityComponentDataset} dataset
     * @param {DynamicActorSystem} system
     * @param {*} context
     */
    constructor(def, actor, dataset, system, context) {
        super();

        this.def = def;

        this.actor = actor;
        this.system = system;
        this.context = context;
        this.dataset = dataset;
    }

    /**
     *
     * @param {number} entity
     * @param {EntityComponentDataset} ecd
     */
    filter(entity, ecd) {
        const distance = this.def.distance;

        if (!Number.isFinite(distance)) {
            return true;
        }

        const actor_transform = ecd.getComponent(this.actor, Transform);


        if (actor_transform === undefined) {
            return true;
        }

        const target_transform = ecd.getComponent(entity, Transform);

        if (target_transform === undefined) {
            return false;
        }

        return target_transform.position.distanceTo(actor_transform.position) <= distance;
    }

    start() {
        super.start();

        const dataset = this.dataset;
        const system = this.system;

        const bestActors = system.requestBestActors(this.def.context, this.filter, this, this.def.responders);

        bestActors.forEach((match) => {
            /**
             *
             * @type {DynamicRuleDescription}
             */
            const rule = match.rule;

            console.log(`Requested response from ${match.entity}, because rule matched: ${match.rule.condition.toCode()}`);

            rule.action.execute(match.entity, dataset, match.scope.proxy, system).start();
        });

        this.__succeed();
    }

}
