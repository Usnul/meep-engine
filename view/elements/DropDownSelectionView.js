/**
 * Created by Alex on 21/03/2017.
 */


import View from '../View.js';
import { passThrough } from "../../core/function/Functions.js";
import UUID from "../../core/UUID.js";

/**
 * @template T
 */
class DropDownSelectionView extends View {
    /**
     * @template T
     * @param {List<T>} model
     * @param {function(T):string} [transform]
     * @param {function(T)} [changeListener]
     */
    constructor(model, { transform, changeListener } = {}) {
        super();

        this.model = model;
        const elRoot = this.el = document.createElement('select');
        elRoot.classList.add('ui-drop-dow-selection-view');

        if (transform === undefined) {
            this.transfrom = passThrough;
        } else {
            this.transfrom = transform;
        }

        this.bindSignal(this.model.on.added, this.handleAdded, this);
        this.bindSignal(this.model.on.removed, this.handleRemoved, this);

        if(changeListener !== undefined) {

            elRoot.addEventListener('change', (event) => {
                const id = event.target.value;

                const v = this.getValueById(id);

                changeListener(v);
            });
        }

        /**
         * ID mapping
         * @private
         * @type {Map<T, string>}
         */
        this.mapping = new Map();
    }

    /**
     * @private
     * @param {String} el
     * @param {number} index
     */
    handleAdded(el, index) {

        const text = this.transfrom(el);

        const id = UUID.generate();

        this.mapping.set(el, id);

        const element = document.createElement('option');
        element.setAttribute('value', id);
        element.innerText = text;

        this.el.appendChild(element);
    }

    /**
     * @private
     * @param {string} el
     */
    handleRemoved(el) {

        const $el = this.el;

        let children = $el.children;
        let length = children.length;

        const id = this.mapping.get(el);

        for (let i = 0; i < length; i++) {

            let child = children[i];

            if (child.value === id) {
                $el.removeChild(child);
                return;
            }

        }
    }

    clearOptions() {

        const children = this.el.children;


        while (children.length > 0) {

            let child = children[0];

            this.el.removeChild(child);

        }

    }

    /**
     *
     * @param {string} id
     * @return {T}
     */
    getValueById(id) {
        let result = null;

        this.mapping.forEach((_id, el) => {
            if (_id === id) {
                result = el;
            }
        });

        return result;
    }

    /**
     *
     * @return {T}
     */
    getSelectedValue() {
        const id = this.el.options[this.el.selectedIndex].value;

        return this.getValueById(id);
    }

    link() {
        super.link();

        this.model.forEach(this.handleAdded, this);
    }

    unlink() {
        super.unlink();

        this.clearOptions();
    }
}


export default DropDownSelectionView;
