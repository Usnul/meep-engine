import View from "../../../../../view/View.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import { LineView } from "../common/LineView.js";
import ButtonView from "../../../../../view/elements/button/ButtonView.js";
import Aura from "../../../../../../model/game/logic/combat/unit/aura/Aura.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import LabelView from "../../../../../view/common/LabelView.js";
import ListView from "../../../../../view/common/ListView.js";
import { AuraController } from "../unit/AuraController.js";

/**
 *
 * @param {Army} army
 * @param {AfflictionDescriptionDatabase} afflictions
 * @return {View}
 */
function makeAuraAdder(army, afflictions) {

    const vInput = new EmptyView({ classList: ['id'], tag: 'input' });

    //item adder
    return new LineView({
        classList: [
            'aura-adder'
        ],
        elements: [
            vInput,
            new ButtonView({
                action() {
                    const id = vInput.el.value;
                    const description = afflictions.get(id);

                    if (description === null) {

                        console.error(`affliction '${id}' not found`);

                        return;

                    }

                    const aura = new Aura();

                    aura.affliction = description;

                    if (army.auras.find(a => a.equals(aura))) {
                        //aura already exists, prevent duplicates
                        console.warn(`Army already has aura '${description.id}', preventing duplication`);
                        return;
                    }

                    army.auras.add(aura);
                },
                name: 'Add',
                classList: ['add']
            })
        ]
    });
}

export class CombatUnitController extends View {

    /**
     *
     * @param {CombatUnit} unit
     * @param {function} remove
     * @param {StaticKnowledgeDatabase} database
     */
    constructor({ unit, remove, database }) {
        super();

        this.el = document.createElement('div');
        this.addClass('el-combat-unit-controller');


    }
}

export class ArmyController extends View {
    /**
     *
     * @param {Localization} localization
     * @param {AfflictionDescriptionDatabase} afflictionDatabase
     */
    constructor({ localization, afflictionDatabase }) {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-army-controller');

        this.model = new ObservedValue(null);

        const self = this;

        /**
         *
         * @param {Army} model
         */
        function setModel(model) {
            self.removeAllChildren();

            if (model === null) {
                return;
            }

            self.addChild(new LabelView('Auras:'));

            const vList = new ListView(model.auras, {
                classList: ['auras'],
                elementFactory(aura) {

                    const elementController = new AuraController({
                        aura,
                        localization,
                        requestRemoval() {
                            model.auras.removeOneOf(aura);
                        }
                    });

                    return elementController;
                }
            });

            self.addChild(vList);

            self.addChild(makeAuraAdder(model, afflictionDatabase));
        }

        this.model.onChanged.add(setModel);
    }
}
