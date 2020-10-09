import { AsynchronousAction } from "./AsynchronousAction.js";
import EntityBuilder from "../../../engine/ecs/EntityBuilder.js";
import { SequenceBehavior } from "../../../engine/intelligence/behavior/composite/SequenceBehavior.js";
import { BehaviorComponent } from "../../../engine/intelligence/behavior/ecs/BehaviorComponent.js";
import { DelayBehavior } from "../../../../model/game/util/behavior/DelayBehavior.js";
import { DieBehavior } from "../../../../model/game/util/behavior/DieBehavior.js";
import TaskState from "../task/TaskState.js";
import { ActionBehavior } from "../../../engine/intelligence/behavior/primitive/ActionBehavior.js";
import { assert } from "../../assert.js";

export class AsynchronousDelayAction extends AsynchronousAction {

    /**
     *
     * @param {EntityComponentDataset} ecd
     * @param {number} time in seconds
     */
    constructor(ecd, time) {
        super();

        assert.isNumber(time, 'time');

        this.__ecd = ecd;
        this.__time = time;

        this.__entity = new EntityBuilder();

        this.__entity.add(BehaviorComponent.fromOne(
            SequenceBehavior.from([
                DelayBehavior.from(time),
                new ActionBehavior(() => {
                    this.__succeed();
                }),
                DieBehavior.create()
            ])
        ));
    }

    cancel() {
        if (this.status === TaskState.RUNNING) {
            this.__entity.destroy();
        }

        return Promise.resolve();
    }

    start() {
        super.start();

        this.__entity.build(this.__ecd);
    }
}
