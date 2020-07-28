/**
 *
 * @param {ReactiveReference} r
 * @returns {string}
 */
function compileReference(r) {
    return `this.${r.name}`;
}

/**
 *
 * @param {ReactiveLiteralNumber} l
 * @return {string}
 */
function compileLiteralNumber(l) {
    return `${l.getValue()}`;
}

/**
 *
 * @param {ReactiveLiteralBoolean} l
 * @return {string}
 */
function compileLiteralBoolean(l) {
    return `${l.getValue()}`;
}

/**
 *
 * @param {ReactiveLiteralString} l
 * @return {string}
 */
function compileLiteralString(l) {
    return `'${l.getValue()}'`;
}


/**
 *
 * @param {ReactiveGreaterThan} gt
 * @returns {string}
 */
function compileComparisonGT(gt) {
    return `( ${compileExpression(gt.left)} > ${compileExpression(gt.right)} )`;
}

/**
 *
 * @param {ReactiveGreaterThanOrEqual} gte
 * @returns {string}
 */
function compileComparisonGTE(gte) {
    return `( ${compileExpression(gte.left)} >= ${compileExpression(gte.right)} )`;
}

/**
 *
 * @param {ReactiveLessThan} gt
 * @returns {string}
 */
function compileComparisonLT(gt) {
    return `( ${compileExpression(gt.left)} < ${compileExpression(gt.right)} )`;
}

/**
 *
 * @param {ReactiveLessThanOrEqual} gt
 * @returns {string}
 */
function compileComparisonLTE(gt) {
    return `( ${compileExpression(gt.left)} <= ${compileExpression(gt.right)} )`;
}

/**
 *
 * @param {ReactiveEquals} exp
 * @returns {string}
 */
function compileComparisonEQ(exp) {
    return `( ${compileExpression(exp.left)} === ${compileExpression(exp.right)} )`;
}

/**
 *
 * @param {ReactiveNotEquals} exp
 * @returns {string}
 */
function compileComparisonNEQ(exp) {
    return `( ${compileExpression(exp.left)} !== ${compileExpression(exp.right)} )`;
}

/**
 *
 * @param {ReactiveExpression} exp
 * @returns {string}
 */
function compileExpression(exp) {
    if (exp.isReactiveLiteralNumber) {
        return compileLiteralNumber(exp);
    } else if (exp.isReactiveLiteralBoolean) {
        return compileLiteralBoolean(exp);
    } else if (exp.isReactiveLiteralString) {
        return compileLiteralString(exp);
    } else if (exp.isReference) {
        return compileReference(exp);
    } else if (exp.isReactiveGreaterThan) {
        return compileComparisonGT(exp);
    } else if (exp.isReactiveGreaterThanOrEqual) {
        return compileComparisonGTE(exp);
    } else if (exp.isReactiveLessThan) {
        return compileComparisonLT(exp);
    } else if (exp.isReactiveLessThanOrEqual) {
        return compileComparisonLTE(exp);
    } else if (exp.isReactiveEquals) {
        return compileComparisonEQ(exp);
    } else if (exp.isReactiveNotEquals) {
        return compileComparisonNEQ(exp);
    } else {
        throw new Error(`Unknown node`);
    }
}

/**
 *
 * @param {ReactiveExpression} exp
 * @return {string}
 */
export function compileReactiveToJS(exp) {
    return compileExpression(exp);
}
