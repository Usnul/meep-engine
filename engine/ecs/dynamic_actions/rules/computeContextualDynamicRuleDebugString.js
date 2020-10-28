import LineBuilder from "../../../../core/codegen/LineBuilder.js";

/**
 *
 * @param {DynamicRuleDescription} rule
 * @param {*} context
 * @returns {string}
 */
export function computeContextualDynamicRuleDebugString(rule, context) {

    const lb = new LineBuilder();
    lb.add(`rule: ${rule.id}`);

    lb.indent();

    lb.add(rule.condition.toCode());

    rule.references.forEach(r => {
        const value = r.evaluate(context);

        const s = `${r.name} : ${value}`;

        lb.add(s);
    });

    return lb.build();
}
