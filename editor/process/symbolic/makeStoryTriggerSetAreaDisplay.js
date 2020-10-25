import { make3DSymbolicDisplay } from "./make3DSymbolicDisplay.js";
import { StoryTriggerSet } from "../../../../model/game/story/triggers/StoryTriggerSet.js";
import { buildThreeJSHelperEntity } from "./buildThreeJSHelperEntity.js";
import { Group } from "three";
import AABB2 from "../../../core/geom/AABB2.js";


//TODO Work in progress

export function makeStoryTriggerSetAreaDisplay(engine) {
    const COORDINATE_X = 'player.position.x';
    const COORDINATE_Y = 'player.position.y';

    /**
     *
     * @param {ReactiveExpression} exp
     */
    function isVarX(exp) {
        return exp.isReference && exp.name === COORDINATE_X;
    }

    /**
     *
     * @param {ReactiveExpression} exp
     */
    function isVarY(exp) {
        return exp.isReference && exp.name === COORDINATE_X;
    }

    /**
     *
     * @param {StoryTriggerSet} triggerSet
     * @param entity
     * @param {SymbolicDisplayInternalAPI} api
     */
    function factory([triggerSet, entity], api) {
        const group = new Group();
        group.frustumCulled = false;

        const ecd = engine.entityManager.dataset;


        /**
         *
         * @param {StoryTrigger} trigger
         */
        function processTrigger(trigger) {
            const constraint = new AABB2(-Infinity, -Infinity, Infinity, Infinity);

            /**
             *
             * @param {ReactiveExpression} constraint
             */
            function gt_x(constraint) {

            }

            /**
             *
             * @param {ReactiveExpression} constraint
             */
            function eq_x(constraint) {

            }

            trigger.condition.getExpression().traverse(exp => {
                if (exp.isBinaryExpression && exp.isComparativeExpression) {
                    if (exp.isReactiveEquals) {
                        if (isVarX(exp.left)) {
                            eq_x(exp.right);
                        } else if (isVarX(exp.right)) {
                            eq_x(exp.right);
                        }
                    }

                }
            });

            const lines = [];

            //  build lines

            //TOP
            if (Number.isFinite(constraint.y0)) {
                lines.push(constraint.x0, constraint.y0, constraint.x1, constraint.y0);
            }
            //Bottom
            if (Number.isFinite(constraint.y1)) {
                lines.push(constraint.x0, constraint.y1, constraint.x1, constraint.y1);
            }
            //LEFT
            if (Number.isFinite(constraint.x0)) {
                lines.push(constraint.x0, constraint.y0, constraint.x0, constraint.y1);
            }
            //RIGHT
            if (Number.isFinite(constraint.x1)) {
                lines.push(constraint.x1, constraint.y0, constraint.x1, constraint.y1);
            }

            if (lines.length === 0) {
                //no lines produced
                return;
            }
        }

        triggerSet.elements.forEach(processTrigger);

        const builder = buildThreeJSHelperEntity(group);

        api.emit(builder);
    }

    return make3DSymbolicDisplay({ engine, components: [StoryTriggerSet], factory });
}
