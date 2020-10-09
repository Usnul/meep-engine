import { DynamicRuleDescriptionTable } from "./rules/DynamicRuleDescriptionTable.js";
import { createRandomReactiveExpression } from "../../../core/model/reactive/model/util/createRandomReactiveExpression.js";
import { ReactiveReference } from "../../../core/model/reactive/model/terminal/ReactiveReference.js";
import { ReactiveLiteralNumber } from "../../../core/model/reactive/model/terminal/ReactiveLiteralNumber.js";
import {
    randomFloatBetween,
    randomFromArray,
    randomIntegerBetween,
    seededRandom
} from "../../../core/math/MathUtils.js";
import { ReactiveLiteralString } from "../../../core/model/reactive/model/terminal/ReactiveLiteralString.js";
import { ReactiveLiteralBoolean } from "../../../core/model/reactive/model/terminal/ReactiveLiteralBoolean.js";
import { DynamicRuleDescription } from "./rules/DynamicRuleDescription.js";
import DataType from "../../../core/parser/simple/DataType.js";

describe.skip('performance', ()=>{

    test('match performance', () => {
        const random = seededRandom(12319);

        const table = new DynamicRuleDescriptionTable();


        const names = [];

        const NAME_COUNT = 100;
        for (let i = 0; i < NAME_COUNT; i++) {
            names.push(`n${i}`);
        }

        const references = names.map(n => {
            const ref = new ReactiveReference(n);

            ref.dataType = DataType.Number;

            return ref;
        });

        const literals = [];

        for (let i = 0; i < 5; i++) {
            literals.push(ReactiveLiteralNumber.from(randomFloatBetween(random, -10, 10)));
        }

        for (let i = 0; i < 5; i++) {
            literals.push(ReactiveLiteralString.from(`string-${i}`));
        }

        literals.push(ReactiveLiteralBoolean.from(true));
        literals.push(ReactiveLiteralBoolean.from(false));

        const terminals = references.concat(literals);

        const expressions = [];

        const EXPRESSION_COUNT = 5000;
        for (let i = 0; i < EXPRESSION_COUNT; i++) {

            const exp = createRandomReactiveExpression(random, terminals, randomIntegerBetween(random, 3, 15));

            expressions.push(exp);


            const r = new DynamicRuleDescription();
            r.id = `id-${i}`;
            r.condition = exp;

            r.build();

            table.add(r);
        }

        table.buildIndex();

        const contexts = [];

        const CONTEXT_COUNT = 5000;

        for (let i = 0; i < CONTEXT_COUNT; i++) {
            const v = {};

            for (let j = 0; j < NAME_COUNT; j++) {
                const roll = random();

                if (roll < 0.5) {
                    continue;
                }

                const name = names[j];

                v[name] = randomIntegerBetween(random, 3, 15);
            }

            contexts[i] = v;
        }

        const prewarm_random = seededRandom(63);

        // pre-warm code
        for (let i = 0; i < 10; i++) {

            const context = randomFromArray(prewarm_random, contexts);

            table.match(context);
        }

        const t0 = performance.now();

        for (let i = 0; i < CONTEXT_COUNT; i++) {
            const context = contexts[i];

            table.matchBest(context);
        }

        const overall_time = (performance.now() - t0) / 1000;


        const overall_time_ps = overall_time * 1e12;

        console.log(`Time per expression: ${Math.round(overall_time_ps / (CONTEXT_COUNT * EXPRESSION_COUNT))}ps(picoseconds)`);
    });
});
