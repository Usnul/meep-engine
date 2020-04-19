import { ViewEntity } from "../../engine/ecs/gui/view/ViewEntity.js";
import UnitRadialPreview from "./UnitRadialPreview.js";
import Army from "../../../model/game/ecs/component/Army.js";

export class HeroRadialHUDView extends ViewEntity {
    constructor() {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-hud-element');
    }

    initialize(
        {
            healthBarThickness = 4,
            width = 50,
            height = 50
        },
        entity,
        dataset,
        engine
    ) {
        /**
         *
         * @type {Army}
         */
        const army = dataset.getComponent(entity, Army);

        const unit = army.findHeroUnit();

        const unitRadialPreview = new UnitRadialPreview(unit, { healthBarThickness });

        unitRadialPreview.size.set(width, height);

        this.size.set(width, height);

        this.addChild(unitRadialPreview);
    }

    finalize() {
        this.removeAllChildren();
    }
}
