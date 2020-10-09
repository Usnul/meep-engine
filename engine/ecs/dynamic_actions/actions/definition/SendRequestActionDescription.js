import { AbstractActionDescription } from "./AbstractActionDescription.js";
import { assert } from "../../../../../core/assert.js";
import { SendRequestAction } from "../execution/SendRequestAction.js";

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
        return new SendRequestAction(this, actor, dataset, system, context);
    }
}

SendRequestActionDescription.prototype.type = 'SendRequest';
