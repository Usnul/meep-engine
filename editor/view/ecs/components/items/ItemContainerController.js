import { ItemController } from "./ItemController.js";
import View from "../../../../../view/View.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import { NumericIntervalController } from "../common/NumericIntervalController.js";
import LabelView from "../../../../../view/common/LabelView.js";
import { LineView } from "../common/LineView.js";
import ListView from "../../../../../view/common/ListView.js";
import ButtonView from "../../../../../view/elements/button/ButtonView.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import Item from "../../../../../../model/game/ecs/component/Item.js";
import { NumberController } from "../common/NumberController.js";

/**
 *
 * @param {ItemContainer} itemContainer
 * @param {ItemDescriptionDatabase} items
 * @returns {View}
 */
function makeItemAdder(itemContainer, items) {

    const vInput = new EmptyView({ classList: ['id'], tag: 'input' });

    //item adder
    return new LineView({
        classList: [
            'item-adder'
        ],
        elements: [
            vInput,
            new ButtonView({
                action() {
                    const id = vInput.el.value;
                    const itemDescription = items.get(id);

                    if (itemDescription === null) {

                        console.error(`item '${id}' not found`);

                        return;

                    }

                    const item = new Item();
                    item.description = itemDescription;

                    itemContainer.addItem(item);
                },
                name: 'Add',
                classList: ['add']
            })
        ]
    });
}

export class ItemContainerController extends View {
    /**
     *
     * @param {Localization} localization
     * @param {ItemDescriptionDatabase} itemDatabase
     */
    constructor({ localization, itemDatabase }) {
        super();

        this.el = document.createElement('div');
        this.addClass('ui-item-container-controller');

        this.itemDatabase = itemDatabase;

        this.model = new ObservedValue(null);

        const self = this;


        /**
         *
         * @param {ItemContainer} model
         */
        function setModel(model) {
            self.removeAllChildren();

            if (model !== null) {
                self.addChild(new LineView({
                    elements: [
                        new LabelView('random', { tag: 'span' }),
                        new NumericIntervalController({ interval: model.random, tag: 'span' })
                    ],
                    classList: ['random']
                }));
                const moneyController = new NumberController();

                self.addChild(new LineView({
                    elements: [
                        new LabelView('money', { tag: 'span' }),
                        moneyController
                    ],
                    classList: ['money']
                }));

                moneyController.value.onChanged.add((v) => model.money.set(v));
                moneyController.bindSignal(model.money.onChanged, (v) => {
                    moneyController.value.set(v);
                });
                moneyController.value.set(model.money.getValue());

                self.addChild(new LabelView('Items:'));
                const items = model.items;

                const vList = new ListView(items, {
                    classList: ['items'],
                    elementFactory(item) {

                        const itemController = new ItemController({
                            item,
                            localization,
                            requestRemoval() {
                                items.removeOneOf(item);
                            }
                        });

                        return itemController;
                    }
                });

                self.addChild(vList);

                self.addChild(makeItemAdder(model, self.itemDatabase));
            }
        }

        this.model.onChanged.add(setModel);
    }
}
