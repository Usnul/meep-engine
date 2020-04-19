/**
 * Created by Alex on 06/03/2017.
 */


import View from "../../View.js";
import dom from "../../DOM.js";
import RectangleView from '../../elements/EmptyView.js';
import { clamp, sign } from '../../../core/math/MathUtils.js';

const StrengthType = { Weak: "weak", Weaker: "weaker", Equals: "equal", Stronger: "stronger", Strong: "strong" };

class ArmyStrengthView extends View {
    constructor(army, options) {
        super(army, options);

        this.model = army;
        this.opponentArmy = options.opponentArmy;

        const dRoot = dom();
        dRoot.addClass('ui-army-strength-view');
        this.el = dRoot.el;

        let proportion = 0.5;

        let vOwnStrength = new RectangleView();
        let vOpponentStrength = new RectangleView();

        this.addChild(vOwnStrength);
        this.addChild(vOpponentStrength);

        vOwnStrength.dRoot.addClass('own');
        vOpponentStrength.dRoot.addClass('opponent');

        const self = this;


        function update() {
            const opponentArmy = self.opponentArmy;

            const ownStrength = army.computeStrength();
            const opponentStrength = opponentArmy.computeStrength();

            proportion = clamp(ownStrength / opponentStrength, 0, 2) / 2;

            let classList = self.el.classList;
            for (let st in StrengthType) {
                let strengthType = StrengthType[st];
                classList.remove(strengthType);
            }

            if (proportion < 0.2) {
                classList.add(StrengthType.Weak);
            } else if (proportion < 0.4) {
                classList.add(StrengthType.Weaker);
            } else if (proportion > 0.75) {
                classList.add(StrengthType.Strong);
            } else if (proportion > 0.6) {
                classList.add(StrengthType.Stronger);
            } else {
                classList.add(StrengthType.Equals);
            }

            layout();
        }

        function layout() {

            const signedProportion = proportion * 2 - 1;

            const visualProportion = (Math.pow(Math.abs(signedProportion), 3) * sign(signedProportion) + 1) / 2;

            vOwnStrength.size.setY(self.size.y);
            vOpponentStrength.size.setY(vOwnStrength.size.y);

            vOwnStrength.size.setX(self.size.x * visualProportion);
            vOpponentStrength.size.setX(self.size.x * (1 - visualProportion));

            vOpponentStrength.position.setX(vOwnStrength.position.x + vOwnStrength.size.x);

        }

        function unitAdded(unit) {
            unit.level.onChanged.add(update);
        }

        function unitRemoved(unit) {
            unit.level.onChanged.remove(update);
        }

        this.handlers = {
            update,
            unitAdded,
            unitRemoved
        };
    }

    link() {
        super.link();

        const handlers = this.handlers;

        function watchArmy(army) {
            army.units.forEach(handlers.unitAdded);
            army.units.on.added.add(handlers.unitAdded);
            army.units.on.removed.add(handlers.unitRemoved);
        }

        watchArmy(this.model);
        watchArmy(this.opponentArmy);

        this.handlers.update();
    }

    unlink() {
        super.unlink();


        const handlers = this.handlers;

        function unwatchArmy(army) {
            army.units.forEach(handlers.unitRemoved);
            army.units.on.added.remove(handlers.unitAdded);
            army.units.on.removed.remove(handlers.unitRemoved);
        }

        unwatchArmy(this.model);
        unwatchArmy(this.opponentArmy);
    }
}


export default ArmyStrengthView;
