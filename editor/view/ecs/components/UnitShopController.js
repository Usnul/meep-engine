import View from "../../../../view/View.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";
import ListView from "../../../../view/common/ListView.js";
import DatGuiController from "./DatGuiController.js";
import { ShopGoodType, UnitShopElement } from "../../../../../model/game/ecs/component/shop/UnitShop.js";
import ObservedString from "../../../../core/model/ObservedString.js";

export class UnitShopController extends View {
    constructor() {
        super();

        this.el = document.createElement('div');
        this.addClass('unit-shop-controller');

        /**
         *
         * @type {ObservedValue<UnitShop>}
         */
        this.model = new ObservedValue(null);


        this.model.onChanged.add(shop => {

            this.removeAllChildren();

            let lock = false;
            const json = new ObservedString(makeJSON());

            json.onChanged.add(v => {
                if (lock) {
                    return;
                }
                lock = true;

                try {
                    const j = JSON.parse(v);
                    shop.fromJSON(j);
                } catch (e) {
                    console.error(e);
                } finally {
                    lock = false;
                }
            });

            const list = new ListView(shop.elements, {
                classList: ['elements'],
                elementFactory(el) {
                    const view = new DatGuiController();

                    function update() {
                        updateJSON();
                    }

                    view.addEnumRaw(el, 'goodType', ShopGoodType).onChange(update);
                    view.addControl(el, 'good').onChange(update);

                    view.add(el, 'supply').onChange(update);
                    view.add(el, 'supplyLimit').onChange(update);
                    view.add(el, 'cooldown').onChange(update);
                    view.add(el, 'cooldownCounter').onChange(update);

                    view.addControl({
                        remove() {
                            shop.elements.removeOneOf(el);
                        }
                    }, 'remove');


                    return view;
                }
            });

            function makeJSON() {
                return JSON.stringify(shop.toJSON(), 3, 3);
            }

            function updateJSON() {
                lock = true;
                try {
                    const str = makeJSON();
                    json.set(str);
                } catch (e) {
                    console.error(e);
                } finally {
                    lock = false;
                }
            }

            list.bindSignal(shop.elements.on.added, updateJSON);
            list.bindSignal(shop.elements.on.removed, updateJSON);

            this.addChild(list);

            const dat = new DatGuiController();

            dat.addControl({
                add() {
                    const el = new UnitShopElement();

                    shop.elements.add(el);
                }
            }, "add").name("+new");

            dat.add({
                json
            }, 'json');

            this.addChild(dat);

        });
    }
}
