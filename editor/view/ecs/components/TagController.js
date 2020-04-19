import EmptyView from "../../../../view/elements/EmptyView.js";
import ButtonView from "../../../../view/elements/button/ButtonView.js";
import ObservedValue from "../../../../core/model/ObservedValue.js";
import View from "../../../../view/View.js";

function makeTag({ index, values, update }) {
    const vValue = new EmptyView({ classList: ['value'], tag: 'input' });
    const elValue = vValue.el;

    elValue.setAttribute('type', 'text');
    elValue.value = values[index];


    elValue.addEventListener('input', () => {
        const v = elValue.value;

        values[index] = v;
    });

    const vRemove = new ButtonView({
        action() {
            values.splice(index, 1);

            update();
        },
        classList: ['remove']
    });


    const vTag = new EmptyView({ classList: ['tag'] });

    vTag.addChild(vValue);
    vTag.addChild(vRemove);

    return vTag;
}

export class TagController extends View {
    constructor() {
        super();

        this.el = document.createElement('div');
        this.addClass('controller');
        this.addClass('tag-controller');

        const self = this;

        function update() {
            /**
             *
             * @type {Tag}
             */
            const model = self.model.getValue();


            self.removeAllChildren();

            if (model !== null) {
                const values = model.values;

                values.forEach((v, i) => {
                    const vTag = makeTag({ index: i, values, update });
                    self.addChild(vTag);
                });

                self.addChild(new ButtonView({
                    action() {
                        values.push("");
                        update();
                    },
                    name: 'Create'
                }));
            }
        }

        this.model = new ObservedValue(null);

        this.model.onChanged.add(update);
    }
}
