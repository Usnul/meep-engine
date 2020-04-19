/**
 * Created by Alex on 13/03/2017.
 */


import UnitIconView from './UnitIconView.js';
import RadialProgressView from '../elements/radial/RadialProgressView.js';
import LabelView from '../common/LabelView.js'
import View from "../View.js";

class UnitRadialPreview extends View {
    /**
     *
     * @param {CombatUnit} unit
     * @param {number} healthBarThickness
     * @constructor
     */
    constructor(unit, { healthBarThickness = 4 } = {}) {
        super(unit, healthBarThickness);


        const iconView = new UnitIconView(unit.description.getValue());

        this.el = document.createElement('div');
        this.el.classList.add('ui-unit-radial-preview');
        this.addChild(iconView);

        const health = new RadialProgressView([unit.healthCurrent, unit.stats.healthMax], {
            fill: 'red',
            thickness: healthBarThickness
        });

        health.el.classList.add('health');

        const vLevel = new LabelView(unit.level, { classList: ['level'] });

        this.addChild(health);
        this.addChild(vLevel);

        this.el.classList.add("unit-type-" + unit.getUnitType());

        this.bindSignal(unit.description.onChanged, (d) => iconView.model.set(d));
        this.on.linked.add(() => iconView.model.set(unit.description.getValue()));

        this.size.onChanged.add(function (x, y) {

            const t = healthBarThickness;

            const t2 = t * 2;

            iconView.size.set(x - t2, y - t2);
            iconView.position.set(t, t);

            health.size.set(x, y);
            vLevel.position.set(0, 0);
        });
    }
}



export default UnitRadialPreview;
