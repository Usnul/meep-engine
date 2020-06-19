import View from "../View.js";
import domify from "../DOM.js";
import { assert } from "../../core/assert.js";

/**
 * @extends View
 */
export class LocalizedLabelView extends View {
    /**
     *
     * @param {string} id
     * @param {object} [seed]
     * @param {Localization} [localization]
     * @param {string[]} [classList]
     * @param {GMLEngine} [gml] if supplied, string will be compiled first
     * @param {string} [tag=div] HTML element tag
     */
    constructor({ id, seed, localization = null, classList = [], gml, tag = 'div' }) {
        super();

        assert.typeOf(id, 'string', 'id');

        /**
         * @private
         * @type {Localization}
         */
        this.localization = null;

        /**
         *
         * @type {GMLEngine}
         */
        this.gml = gml;

        /**
         *
         * @type {Object}
         */
        this.seed = seed;

        /**
         *
         * @type {string}
         */
        this.key = id;

        const $el = domify(tag);

        this.$el = $el;

        this.el = $el.el;

        this.addClass('label');
        classList.forEach(c => this.addClass(c));

        this.needsUpdate = true;

        this.on.linked.add(() => {
            if (this.localization !== null && this.localization.locale.getValue() !== this.__localeKey) {
                //locale key has changed
                this.needsUpdate = true;
            }

            if (this.needsUpdate) {
                this.update();
            }
        });

        /**
         * Cached locale key
         * @type {String}
         * @private
         */
        this.__localeKey = null;

        // watch for locale changes
        this.setLocalization(localization);
    }

    updateLocale() {

        if (this.isLinked) {
            this.update();
        } else {
            this.needsUpdate = true;
        }
    }

    setLocalization(localization) {
        if (localization === this.localization) {
            return;
        }


        if (this.localization !== null) {
            this.unbindSignal(this.localization.locale.onChanged, this.updateLocale, this);
        }

        this.localization = localization;

        if (localization !== null) {
            this.bindSignal(localization.locale.onChanged, this.updateLocale, this);
        }
    }

    setKey(key) {
        if (key === this.key) {
            //no change
            return;
        }

        this.key = key;

        if (this.isLinked) {
            this.update();
        } else {
            this.needsUpdate = true;
        }
    }

    update() {
        const localization = this.localization;
        const gml = this.gml;
        const seed = this.seed;
        const id = this.key;

        const $el = this.$el;

        assert.notEqual(localization, undefined, 'localization is undefined');
        assert.notEqual(localization, null, 'localization is null');

        const value = localization.getString(id, seed);

        this.__localeKey = localization.locale.getValue();

        if (gml === undefined) {
            $el.text(value);
        } else {
            this.removeAllChildren();
            //compile
            gml.compile(value, this);
        }

        this.needsUpdate = false;
    }
}
