/**
 * Created by Alex on 06/03/2017.
 */

import View from "../View.js";
import dom from "../DOM.js";

class EmptyView extends View {
    /**
     *
     * @param options
     * @extends {View}
     * @constructor
     */
    constructor({ classList = [], tag = 'div', css } = {}) {
        super();

        this.dRoot = dom(tag);

        const elClassList = this.dRoot.el.classList;

        for (let i = 0, l = classList.length; i < l; i++) {
            const className = classList[i];
            elClassList.add(className);
        }

        this.el = this.dRoot.el;

        if (css !== undefined) {
            this.css(css);
        }
    }

    /**
     *
     * @param {View[]} elements
     * @param {{classList:string[],tag:string,css:{}}} options
     * @return {EmptyView}
     */
    static group(elements, options = {}) {
        const v = new EmptyView(options);

        elements.forEach(v.addChild, v);

        return v;
    }
}


export default EmptyView;
