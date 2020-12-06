/**
 * Created by Alex on 15/01/2017.
 */
import View from '../View.js';
import dom from '../DOM.js';
import List from '../../core/collection/list/List.js';
import { frameThrottle } from '../../engine/graphics/FrameThrottle.js';
import { max2 } from "../../core/math/MathUtils.js";

class VirtualListView extends View {
    /**
     * @template T
     * @param {List.<T>} list
     * @param {number} [lineSize=20]
     * @param {number} [lineSpacing=0]
     * @param {function(element:T, index:number):View} elementFactory
     * @param classList
     * @constructor
     */
    constructor(list, { lineSize = 20, lineSpacing = 0, elementFactory, classList = [] }) {

        super();

        this.data = list;

        if (elementFactory === undefined) {
            throw new Error("Element factory was not supplied");
        }

        const dRoot = dom('div');
        dRoot.addClass('list');
        dRoot.css({
            overflowY: "visible",
            overflowX: "visible"
        });

        this.el = dRoot.el;

        classList.forEach(c => this.addClass(c));

        const vScrollArea = new View();
        const dScrollArea = dom('div');
        dScrollArea.addClass('scroll-area');
        dScrollArea.css({
            userSelect: "none"
        });
        vScrollArea.el = dScrollArea.el;

        this.addChild(vScrollArea);

        this.renderedViews = new List();

        this.__v_scroll_area = vScrollArea;

        this.__first_visible_line = -1;
        this.__last_visible_line = -1;

        this.__is_scroll_bar_visible = false;

        /**
         *
         * @type {number}
         * @private
         */
        this.__line_size = lineSize;

        /**
         *
         * @type {number}
         * @private
         */
        this.__line_spacing = lineSpacing;

        /**
         *
         * @type {function(T, number): View}
         * @private
         */
        this.__element_factory = elementFactory;


        const throttledUpdate = frameThrottle(this.update, this);

        this.handlers = {
            addOne: function (el) {
                throttledUpdate();
            },
            removeOne: function (el) {
                throttledUpdate();
            },
            update: throttledUpdate
        };

        this.el.addEventListener('scroll', throttledUpdate);
        vScrollArea.el.addEventListener('scroll', throttledUpdate);
    }


    update() {
        const vScrollArea = this.__v_scroll_area;
        const lineSize = this.__line_size;
        const lineSpacing = this.__line_spacing;

        const numTotalElements = this.data.length;
        const maxLength = lineSize * numTotalElements + lineSpacing * max2(0, numTotalElements - 1);

        const rowHeight = lineSize + lineSpacing;


        vScrollArea.size.setY(maxLength);
        //figure out currently visible lines
        const scrollY = this.el.scrollTop;

        const y0 = scrollY;
        const y1 = Math.min(scrollY + this.size.y, maxLength);

        const l0 = Math.floor(y0 / rowHeight);
        const l1 = Math.min(Math.ceil(y1 / rowHeight), numTotalElements - 1);

        //update cache
        this.__first_visible_line = l0;
        this.__last_visible_line = l1;

        //clear existing lines
        this.renderedViews.forEach(function (c) {
            vScrollArea.removeChild(c);
        });
        this.renderedViews.reset();

        let rowWidth = this.size.x;
        if (this.__first_visible_line === 0 && this.__last_visible_line === numTotalElements - 1 && rowHeight * (this.__last_visible_line - this.__first_visible_line) < this.size.y) {
            //entire set of data is visible, disable scroll bar
            this.__setScrollBar(false);
        } else {
            rowWidth -= 17;
            this.__setScrollBar(true);
        }

        let elementWidth = this.size.x;

        //generate views for visible lines
        for (let i = this.__first_visible_line; i <= this.__last_visible_line; i++) {
            const elementData = this.data.get(i);
            const lineView = this.__element_factory(elementData, i);

            if (lineView === undefined) {
                console.error('Line view produced by element factory was undefined');
                continue;
            }

            lineView.el.style.position = "absolute";
            //mark odd rows
            if (i % 2 === 1) {
                lineView.el.classList.add('odd-row');
            }

            lineView.position.setY(i * rowHeight);
            lineView.size.set(rowWidth, lineSize);

            vScrollArea.addChild(lineView);
            this.renderedViews.add(lineView);
        }
    }

    /**
     *
     * @param {number} index
     * @returns {number}
     * @private
     */
    __computeElementYPosition(index) {
        const rowHeight = this.__line_size + this.__line_spacing;

        return rowHeight * index;
    }

    __setScrollBar(flag) {
        if (this.__is_scroll_bar_visible && !flag) {
            this.css({
                overflowY: "visible"
            });
        } else if (!this.__is_scroll_bar_visible && flag) {
            this.css({
                overflowY: "scroll"
            });
        } else {
            //no change
            return;
        }

        this.__is_scroll_bar_visible = flag;
    }

    scrollToEnd() {
        const target = this.__computeElementYPosition(this.data.length);

        this.el.scrollTo(0, target);
    }

    link() {
        super.link();

        this.data.on.added.add(this.handlers.addOne);
        this.data.on.removed.add(this.handlers.removeOne);

        this.size.onChanged.add(this.handlers.update);

        this.data.forEach(this.handlers.addOne);
    }

    unlink() {
        super.unlink();

        this.data.on.added.remove(this.handlers.addOne);
        this.data.on.removed.remove(this.handlers.removeOne);

        this.size.onChanged.remove(this.handlers.update);
    }
}


export default VirtualListView;
