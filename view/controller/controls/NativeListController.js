import View from "../../View.js";
import ListView from "../../common/ListView.js";
import ButtonView from "../../elements/button/ButtonView.js";
import EmptyView from "../../elements/EmptyView.js";

export class NativeListController extends View {
    /**
     *
     * @param {List} model
     * @param {function} elementViewFactory
     * @param {function} elementFactory
     * @param {string[]} [classList]
     */
    constructor({ model, elementViewFactory, elementFactory, classList=[] }) {
        super();

        this.el = document.createElement('div');

        this.addClass('ui-native-list-controller');

        this.addClasses(classList);

        this.addChild(new ListView(model, {
            elementFactory(el) {
                const elementView = elementViewFactory(el);

                const vWrapper = new EmptyView({ classList: ['element-wrapper'] });

                elementView.addClass('wrapped-element');
                vWrapper.addChild(elementView);

                vWrapper.addChild(new ButtonView({
                    action() {
                        model.removeOneOf(el);
                    },
                    classList: ['remove']
                }));


                return vWrapper;
            }
        }));

        this.addChild(new ButtonView({
            action() {
                const element = elementFactory();

                model.add(element);
            },
            classList: ['add']
        }))
    }
}
