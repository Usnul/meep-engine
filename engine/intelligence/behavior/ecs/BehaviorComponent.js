import { assert } from "../../../../core/assert.js";
import { ClockChannelType } from "./ClockChannelType.js";

export const BehaviorComponentFlag = {
    AllowSleep: 1
};

export class BehaviorComponent {
    constructor() {
        /**
         *
         * @type {Behavior[]}
         */
        this.list = [];

        /**
         *
         * @type {ClockChannelType|number}
         */
        this.clock = ClockChannelType.Simulation;

        /**
         *
         * @type {number}
         */
        this.flags = 0;
    }
}

/**
 *
 * @param {Behavior} b
 * @returns {BehaviorComponent}
 */
BehaviorComponent.fromOne = function (b) {
    assert.notEqual(b, undefined, 'behavior is undefined');
    assert.notEqual(b, null, 'behavior is null');

    const result = new BehaviorComponent();

    result.list.push(b);

    return result;
};

/**
 * @readonly
 * @type {boolean}
 */
BehaviorComponent.serializable = true;

/**
 * @readonly
 * @type {string}
 */
BehaviorComponent.typeName = 'BehaviorComponent';


