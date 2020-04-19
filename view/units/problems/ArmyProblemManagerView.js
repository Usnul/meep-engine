import { ViewEntity } from "../../../engine/ecs/gui/view/ViewEntity.js";
import { StrategicProblemManager } from "../../../../model/game/ecs/component/unit/poblems/StrategicProblemManager.js";
import Army from "../../../../model/game/ecs/component/Army.js";
import { StrategicProblemType } from "../../../../model/game/ecs/component/unit/poblems/StrategicProblemType.js";
import { ProblemGroupView } from "./ProblemGroupView.js";

export class ArmyProblemManagerView extends ViewEntity {

    constructor() {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-army-problem-display');

        /**
         *
         * @type {StrategicProblemManager}
         */
        this.manager = new StrategicProblemManager();

        /**
         *
         * @type {number}
         * @private
         */
        this.__armyEntity = -1;

        /**
         * @private
         * @type {EntityComponentDataset}
         */
        this.ecd = null;

        /**
         * @private
         * @type {Engine}
         */
        this.engine = null;
    }

    initialize({ armyEntity }, entity, dataset, engine) {
        this.__armyEntity = armyEntity;

        this.ecd = dataset;

        this.engine = engine;
    }

    finalize() {

    }

    unlink() {
        super.unlink();

        this.manager.detach();

        this.removeAllChildren();
    }

    link() {
        super.link();

        const entityIndex = this.__armyEntity;

        const army = this.ecd.getComponent(entityIndex, Army);

        if (army === undefined) {
            console.error(`Army not found for entity ${entityIndex}`);
        }

        this.manager.attach(army);

        const localization = this.engine.localization;

        Object.values(StrategicProblemType).forEach(t => {
            const groupView = new ProblemGroupView({
                localization,
                tooltips: this.engine.gui.viewTooltips,
                problems: this.manager.problems,
                type: t
            });

            this.addChild(groupView);
        });
    }
}
