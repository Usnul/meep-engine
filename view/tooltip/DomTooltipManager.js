import { DomTooltipObserver } from "./DomTooltipObserver.js";


/**
 *
 */
export class DomTooltipManager {
    /**
     *
     * @param {TooltipManager} tipManager
     */
    constructor(tipManager) {
        /**
         * @readonly
         * @private
         * @type {TooltipManager}
         */
        this.tipManager = tipManager;

        /**
         * @readonly
         * @private
         * @type {WeakMap<View, DomTooltipObserver>}
         */
        this.live = new WeakMap();


        /**
         * Delay before tooltip is displayed, in milliseconds
         * @type {number}
         * @private
         */
        this.__showDelay = 128;

        /**
         * setTimeout handle for showDelay value
         * @type {number}
         * @private
         */
        this.__showDelayTimeout = -1;
    }

    /**
     *
     * @returns {TooltipManager}
     */
    getTipManager() {
        return this.tipManager;
    }

    /**
     *
     * @param {DomTooltipObserver} observer
     */
    show(observer) {
        const tip = observer.tip;

        this.tipManager.add(tip);
    }

    /**
     *
     * @param {DomTooltipObserver} observer
     */
    hide(observer) {
        const tip = observer.tip;

        this.tipManager.remove(tip)
    }

    updatePositions() {
        const tipManager = this.tipManager;

        tipManager.tips.forEach(tip => {

            tipManager.positionTip(tip.view);

        });
    }

    /**
     * Update tooltip for a given view
     * @param {View} view
     * @returns {boolean}
     */
    updateTip(view) {
        const observer = this.live.get(view);

        if (observer === undefined) {
            //not live
            return false;
        }

        if (observer.isEntered.getValue()) {
            //re-draw
            this.hide(observer);
            this.show(observer);
        }
    }

    /**
     * Completely manage tooltip for a given view. Tooltip will be added and removed based on View's linked status
     * @param {View} view
     * @param {function} factory
     */
    manage(view, factory) {
        view.on.linked.add(() => {
            this.add(view, factory);
        });

        view.on.unlinked.add(() => {
            this.remove(view);
        });
    }

    /**
     * @private
     * @param {DomTooltipObserver} observer
     */
    requestShow(observer) {
        this.cancelShowRequest();

        this.__showDelayTimeout = setTimeout(() => {
            this.show(observer);
        }, this.__showDelay);
    }

    cancelShowRequest() {

        if (this.__showDelayTimeout !== -1) {
            //cancel timeout
            clearTimeout(this.__showDelayTimeout);
            this.__showDelayTimeout = -1;
        }
    }

    /**
     * @private
     * @param {DomTooltipObserver} observer
     */
    initializeHide(observer) {
        this.cancelShowRequest();

        this.hide(observer);
    }

    /**
     * Added view will be automatically tracked and will continue on as long as the view exists or until it is
     * de-registered via "remove" method
     * @param {View} view View for which the tool tip will exist
     * @param {function} factory Tooltip factory function
     */
    add(view, factory) {
        const observer = new DomTooltipObserver(view, factory);

        this.live.set(view, observer);

        observer.on.entered.add(() => {
            this.requestShow(observer);
        });

        observer.on.exited.add(() => {
            this.initializeHide(observer);
        });


        observer.link();
    }

    /**
     *
     * @param {View} element
     */
    remove(element) {
        const observer = this.live.get(element);

        if (observer === undefined) {
            //observer not found for this element
            return;
        }

        //hide if shown
        this.hide(observer);

        //remove from the internal store
        this.live.delete(element);

        //unlink observer
        observer.unlink();
    }
}
