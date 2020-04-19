/**
 * Created by Alex on 26/05/2016.
 * @copyright Alex Goldring 2016
 */
import View from "../View.js";
import { prettyPrint } from "../../core/NumberFormat.js";
import ObservedValue from "../../core/model/ObservedValue.js";
import Vector1 from "../../core/geom/Vector1.js";
import LinearValue from "../../core/model/LinearValue.js";
import ObservedString from "../../core/model/ObservedString.js";
import BoundedValue from "../../core/model/BoundedValue.js";
import ObservedBoolean from "../../core/model/ObservedBoolean.js";
import Stat from "../../core/model/stat/Stat.js";
import { isInstanceOf, isTypeOf, or } from "../../core/process/matcher/Matchers.js";
import { frameThrottle } from "../../engine/graphics/FrameThrottle.js";
import { assert } from "../../core/assert.js";
import ObservedInteger from "../../core/model/ObservedInteger.js";
import { noop } from "../../core/function/Functions.js";
import { isTypedArray } from "../../core/json/JsonUtils.js";


/**
 *
 * @param {Number|String|Boolean} value
 * @returns {*}
 */
function format(value) {
    if (typeof value === 'number') {
        return prettyPrint(value);
    } else {
        return value;
    }
}

/**
 *
 * @param {string} v
 * @returns {string|number}
 */
function formatNumber(v) {
    return prettyPrint(v);
}

function formatArray(arr) {
    return format(arr[0]) + " / " + format(arr[1]);
}

function extractorGetValue(m) {
    return m.getValue();
}

function extractFunction(f) {
    return f();
}

/**
 *
 * @param {BoundedValue} m
 */
function extractBoundedValue(m) {
    return [m.getValue(), m.getUpperLimit()];
}

function arrayUnwrap(elements) {
    return elements.map(function (element) {
        const processor = findProcessor(element);
        const extractor = processor.extractor;
        return extractor(element);
    });
}

/**
 *
 * @param model
 * @returns {ValueProcessor | undefined}
 */
function findProcessor(model) {
    return processors.find(function (p) {
        return p.matcher(model);
    });
}

/**
 * @template T
 * @param {T} v
 * @returns {T}
 */
function passThrough(v) {
    return v;
}


/**
 * @template Container, Value
 * @param {function(Container):boolean} matcher
 * @param {function(Container):Value} extractor
 * @param {function(Value):string} formatter
 * @constructor
 */
function ValueProcessor(matcher, extractor, formatter) {
    /**
     *
     * @type {function(*): boolean}
     */
    this.matcher = matcher;
    /**
     *
     * @type {function(*): *}
     */
    this.extractor = extractor;
    /**
     *
     * @type {function(*): string}
     */
    this.formatter = formatter;
}

/**
 *
 * @param {function(*):boolean} m
 * @param {function(*):*} e
 * @param {function(*):string} f
 * @returns {ValueProcessor}
 */
function p(m, e, f) {
    return new ValueProcessor(m, e, f);
}

/**
 *
 * @type {Array.<ValueProcessor>}
 */
const processors = [
    p(isInstanceOf(ObservedBoolean), extractorGetValue, format),
    p(isInstanceOf(ObservedValue), extractorGetValue, format),
    p(isInstanceOf(ObservedString), extractorGetValue, format),
    p(isInstanceOf(LinearValue), extractorGetValue, formatNumber),
    p(isInstanceOf(BoundedValue), extractBoundedValue, formatArray),
    p(isInstanceOf(Stat), extractorGetValue, formatNumber),
    p(isInstanceOf(Vector1), extractorGetValue, formatNumber),
    p(isInstanceOf(ObservedInteger), extractorGetValue, formatNumber),
    p(or(isTypedArray, Array.isArray), arrayUnwrap, formatArray),
    p(isTypeOf("number"), passThrough, formatNumber),
    p(isTypeOf("string"), passThrough, passThrough),
    p(isTypeOf("boolean"), passThrough, passThrough),
    p(isTypeOf("function"), extractFunction, format),
    p(isTypeOf("undefined"), passThrough, passThrough)
];

class LabelView extends View {
    constructor(model, {
        classList = [],
        transform = passThrough,
        format = noop,
        tag = 'div',
        css
    } = {}) {
        super();

        this.model = model;

        const processor = findProcessor(model);
        const extractor = processor.extractor;
        const formatter = format !== noop ? format : processor.formatter;

        assert.notEqual(extractor, null, `No extractor was found for ${typeof model}(${model})`);
        assert.notEqual(formatter, null, `No formatter was found for ${typeof model}(${model})`);

        this.__extractor = extractor;
        this.__formatter = formatter;
        this.__transform = transform;

        this.el = document.createElement(tag);
        this.el.classList.add('label');

        for (const c of classList) {
            this.el.classList.add(c);
        }

        this.size.onChanged.add(this.updateSize, this);

        if (typeof this.model === "object" && this.model.onChanged !== undefined) {

            const throttledUpdate = frameThrottle(this.updateTransform, this);

            this.bindSignal(this.model.onChanged, throttledUpdate);

        }

        if (css !== undefined) {
            this.css(css);
        }
    }

    /**
     * @private
     * @param {number} x
     * @param {number} y
     */
    updateSize(x, y) {
        this.el.style.lineHeight = y + "px";
    }


    /**
     *
     * @param {string} v
     */
    updateText(v) {
        this.el.textContent = v;
    }

    updateTransform() {

        const model = this.model;

        const data = this.__extractor(model);

        const transformed = this.__transform(data);

        const text = this.__formatter(transformed);

        this.updateText(text);

    }

    link() {
        super.link();

        this.updateTransform();
    }
}


export default LabelView;
