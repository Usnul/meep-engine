import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { assert } from "../../../../../core/assert.js";
import { ActionBehavior } from "../../../../intelligence/behavior/primitive/ActionBehavior.js";
import { Transform } from "../../../transform/Transform.js";

export class SendRequestActionDescription extends AbstractActionDescription {
    constructor() {
        super();

        this.distance = Number.POSITIVE_INFINITY;
        this.responders = 1;
        this.context = {};
    }

    fromJSON({
                 distance = Number.POSITIVE_INFINITY,
                 responders = 1,
                 context
             }) {

        assert.defined(context, 'context');
        assert.notNull(context, 'context');
        assert.typeOf(context, 'object', 'context');

        this.distance = distance;
        this.responders = responders;
        this.context = context;
    }

    execute(actor, dataset, context, system) {

        return new ActionBehavior(() => {

            /**
             *
             * @param {number} entity
             * @param {EntityComponentDataset} ecd
             */
            function filter(entity, ecd) {
                const distance = this.distance;

                if (!Number.isFinite(distance)) {
                    return true;
                }

                const actor_transform = ecd.getComponent(actor, Transform);


                if (actor_transform === undefined) {
                    return true;
                }

                const target_transform = ecd.getComponent(entity, Transform);

                if (target_transform === undefined) {
                    return false;
                }

                return target_transform.position.distanceTo(actor_transform.position) <= distance;
            }

            const bestActors = system.requestBestActors(this.context, filter, this, this.responders);


            bestActors.forEach((match) => {
                /**
                 *
                 * @type {DynamicRuleDescription}
                 */
                const rule = match.rule;

                console.log(`Requested response from ${match.entity}, because rule matched: ${match.rule.condition.toCode()}`);

                system.executeRule(match.entity, match.rule, match.scope);

            });
        });
    }
}

SendRequestActionDescription.prototype.type = 'SendRequest';
