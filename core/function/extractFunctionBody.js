/**
 *
 * @param {function} f
 * @returns {string}
 */
export function extractFunctionBody(f) {

    const entire = f.toString();

    const body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}")).trim();

    return body;
}
