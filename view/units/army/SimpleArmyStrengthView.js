/**
 * Created by Alex on 07/03/2017.
 */


import dom from "../../DOM.js";
import { clamp } from '../../../core/math/MathUtils.js';
import { ViewEntity } from "../../../engine/ecs/gui/view/ViewEntity.js";
import Army from "../../../../model/game/ecs/component/Army.js";

/**
 *
 * @enum {string}
 */
const StrengthType = { Weak: "weak", Weaker: "weaker", Equals: "equal", Stronger: "stronger", Strong: "strong" };

class ArmyStrengthView extends ViewEntity {
    /**
     *
     * @constructor
     */
    constructor() {
        super();

        /**
         *
         * @type {Army}
         */
        this.model = null;
        /**
         *
         * @type {Army}
         */
        this.opponentArmy = null;

        const dRoot = dom();
        dRoot.addClass('ui-simple-army-strength-view');
        this.el = dRoot.el;
    }

    initialize(parameters, entity, dataset, engine) {
        //find opponent
        const opponent = parameters.opponent;

        this.opponentArmy = dataset.getComponent(opponent, Army);

        this.model = dataset.getComponent(entity, Army);

        if (typeof parameters.width === "number" && typeof parameters.height === "number") {
            this.size.set(parameters.width, parameters.height);
        }

        // this.watchArmy(this.opponentArmy);
    }

    finalize() {

        // this.unwatchArmy(this.opponentArmy);
    }


    /**
     *
     * @param {CombatUnit} unit
     */
    unitAdded(unit) {
        this.unitWatch(unit);
        this.update();
    }

    /**
     *
     * @param {CombatUnit} unit
     */
    unitRemoved(unit) {
        this.unitUnwatch(unit);
        this.update();
    }

    /**
     *
     * @param {CombatUnit} unit
     */
    unitWatch(unit) {
        unit.healthCurrent.onChanged.add(this.update, this);
        unit.level.onChanged.add(this.update, this);
    }

    /**
     *
     * @param {CombatUnit} unit
     */
    unitUnwatch(unit) {
        unit.healthCurrent.onChanged.remove(this.update, this);
        unit.level.onChanged.remove(this.update, this);
    }

    /**
     *
     * @param {Army} army
     */
    watchArmy(army) {
        army.units.forEach(this.unitWatch, this);
        army.units.on.added.add(this.unitAdded, this);
        army.units.on.removed.add(this.unitRemoved, this);
    }

    /**
     *
     * @param {Army} army
     */
    unwatchArmy(army) {
        army.units.forEach(this.unitUnwatch, this);
        army.units.on.added.remove(this.unitAdded, this);
        army.units.on.removed.remove(this.unitRemoved, this);
    }

    update() {
        /**
         *
         * @type {Army}
         */
        const army = this.model;

        /**
         *
         * @type {Army}
         */
        const opponentArmy = this.opponentArmy;

        const ownStrength = army.computeStrength();
        const opponentStrength = opponentArmy.computeStrength();

        const proportion = clamp(ownStrength / opponentStrength, 0, 2) ;

        const classList = this.el.classList;

        for (let st in StrengthType) {
            let strengthType = StrengthType[st];
            classList.remove(strengthType);
        }

        if (proportion < 0.4) {
            classList.add(StrengthType.Weak);
        } else if (proportion < 0.8) {
            classList.add(StrengthType.Weaker);
        } else if (proportion > 1.5) {
            classList.add(StrengthType.Strong);
        } else if (proportion > 1.2) {
            classList.add(StrengthType.Stronger);
        } else {
            classList.add(StrengthType.Equals);
        }
    }

    link() {
        super.link();

        this.watchArmy(this.model);
        this.watchArmy(this.opponentArmy);

        this.update();
    }

    unlink() {
        super.unlink();

        this.unwatchArmy(this.model);
        this.unwatchArmy(this.opponentArmy);
    }
}


export default ArmyStrengthView;
