import View from "../../View.js";
import ListView from "../../common/ListView.js";
import ButtonView from "../../elements/button/ButtonView.js";
import EmptyView from "../../elements/EmptyView.js";


/**
 * @template T
 * @param {List<T>} list
 * @param {T} element
 */
function defaultOperationAdd(list, element) {
    list.add(element);
}

/**
 * @template T
 * @param {List<T>} list
 * @param {T} element
 */
function defaultOperationRemove(list, element) {
    list.removeOneOf(element);
}

export class NativeListController extends View {
    /**
     * @template T
     * @param {List<T>} model
     * @param {function} elementViewFactory
     * @param {function} elementFactory
     * @param {string[]} [classList]
     * @param {function(List<T>, T)} [operationAdd] Allows user to supply a special operation for adding an element to the list
     * @param {function(List<T>, T)} [operationRemove] Allows user to supply a special operation for removing an element from the list
     */
    constructor({
                    model,
                    elementViewFactory,
                    elementFactory,
                    classList = [],
                    operationAdd = defaultOperationAdd,
                    operationRemove = defaultOperationRemove
                }) {
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
                        operationRemove(model, el);
                    },
                    classList: ['remove']
                }));


                return vWrapper;
            }
        }));

        this.addChild(new ButtonView({
            action() {
                const element = elementFactory();

                operationAdd(model, element);
            },
            classList: ['add']
        }))
    }
}
