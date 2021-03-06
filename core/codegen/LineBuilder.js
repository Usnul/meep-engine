/**
 * Created by Alex on 08/06/2015.
 */


/**
 *
 * @param {String} text
 * @param {Number} indent
 * @constructor
 */
const Line = function (text, indent) {
    this.text = text;
    this.indentation = indent;
};

const LineBuilder = function () {
    /**
     *
     * @type {Array.<Line>}
     */
    this.lines = [];
    this.indentation = 0;
    this.indentSpaces = 4;
};

/**
 *
 * @param {string} text
 * @returns {LineBuilder}
 */
LineBuilder.fromText = function (text) {
    const r = new LineBuilder();

    const lines = text.split('\n');

    const n = lines.length;

    for (let i = 0; i < n; i++) {

        r.add(lines[i]);

    }

    return r;
}

/**
 *
 * @return {boolean}
 * @param {string} term
 */
LineBuilder.prototype.containsSubstring = function (term) {
    const lines = this.lines;
    const n = lines.length;
    for (let i = 0; i < n; i++) {
        const line = lines[i];

        const termIndex = line.text.indexOf(term);

        if (termIndex !== -1) {
            return true;
        }
    }

    return false;
};

/**
 *
 * @returns {LineBuilder}
 */
LineBuilder.prototype.indent = function () {
    this.indentation++;
    return this;
};

/**
 *
 * @returns {LineBuilder}
 */
LineBuilder.prototype.dedent = function () {
    this.indentation--;
    return this;
};

/**
 *
 * @param {string} l
 * @returns {LineBuilder}
 */
LineBuilder.prototype.add = function (l) {
    const line = new Line(l, this.indentation);
    this.lines.push(line);
    return this;
};

/**
 *
 * @param {LineBuilder} lines
 */
LineBuilder.prototype.addLines = function (lines) {

    const other_lines = lines.lines;

    const other_line_count = other_lines.length;

    for (let i = 0; i < other_line_count; i++) {
        const otherLine = other_lines[i];

        const line = new Line(otherLine.text, otherLine.indentation + this.indentation);

        this.lines.push(line);
    }

}

LineBuilder.prototype.clear = function () {
    this.lines = [];
    this.indentation = 0;
    this.indentSpaces = 4;
};

/**
 *
 * @returns {string}
 */
LineBuilder.prototype.build = function () {
    const result = [];
    let i, j, l;


    const lines = this.lines;
    for (i = 0, l = lines.length; i < l; i++) {
        const line = lines[i];

        let indentString = '';
        for (j = 0; j < line.indentation * this.indentSpaces; j++) {
            indentString += ' ';
        }

        result.push(indentString + line.text);
    }

    return result.join('\n');
};

export default LineBuilder;
