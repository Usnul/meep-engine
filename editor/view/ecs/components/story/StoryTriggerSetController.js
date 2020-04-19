import DatGuiController from "../DatGuiController.js";
import { StoryTrigger } from "../../../../../../model/game/story/triggers/StoryTrigger.js";
import { StoryActionType } from "../../../../../../model/game/story/action/StoryActionType.js";
import ListView from "../../../../../view/common/ListView.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import { StoryAction } from "../../../../../../model/game/story/action/StoryAction.js";

const storyActionControllerParamFactories = {
    [StoryActionType.Delay]: {
        duration: 1,
    },
    [StoryActionType.AddItem]: {
        id: "",
        count: 1
    },
    [StoryActionType.RemoveItem]: {
        id: "",
        count: 1
    },
    [StoryActionType.AddMoney]: {
        amount: 0
    },
    [StoryActionType.RemoveMoney]: {
        amount: 0
    },
    [StoryActionType.ShowStoryPage]: {
        id: ""
    },
    [StoryActionType.IncrementVariable]: {
        variable: ""
    },
    [StoryActionType.DecrementVariable]: {
        variable: ""
    },
    [StoryActionType.SetBooleanVariable]: {
        variable: "",
        value: false
    },
    [StoryActionType.SetNumberVariable]: {
        variable: "",
        value: 0
    },
    [StoryActionType.CameraFocusEntity]: {
        entity: 0,
        distance: 40,
        duration: 0
    },
    [StoryActionType.CameraFocusEntity]: {
        entity: 0,
        distance: 40,
        duration: 0
    },
    [StoryActionType.CameraFocusPoint]: {
        x: 0,
        y: 0,
        distance: 0
    },
    [StoryActionType.UnitAdd]: {
        id: "",
        level: 1,
        target: 0
    },
    [StoryActionType.ScenePush]: {
        id: ""
    },
    [StoryActionType.SceneDestroy]: {
        id: ""
    },
    [StoryActionType.FogRevealCircle]: {
        x: 0,
        y: 0,
        radius: 0
    },
    [StoryActionType.FogConcealCircle]: {
        x: 0,
        y: 0,
        radius: 0
    },
    [StoryActionType.GridPositionSet]: {
        x: 0,
        y: 0
    },
    [StoryActionType.ActionPointRemove]: {
        value: 1
    },
    [StoryActionType.RotationEulerSetDegrees]: {
        angleX: 0,
        angleY: 0,
        angleZ: 0,
        ignoreX: false,
        ignoreY: false,
        ignoreZ: false,
        duration: 0
    },
    [StoryActionType.Effect]: {
        id: "",
        parameters: ""
    }
};

class StoryActionController extends DatGuiController {
    /**
     *
     * @param {StoryAction} action
     * @param {function} remove
     */
    constructor(action, remove) {
        super();

        this.addClass('story-action');

        const proxy = {
            remove
        };

        const control = this.addControl(action, 'type', StoryActionType);

        //disable control
        control.domElement.style.pointerEvents = "none";

        //build parameters based on type
        const params = storyActionControllerParamFactories[action.type];

        const paramClone = Object.assign({}, params);

        //merge default parameters with actual ones
        const paramProxy = Object.assign({}, Object.assign(paramClone, action.parameters));

        for (let propName in paramProxy) {
            const parameterName = propName;
            this.addControl(paramProxy, propName).onFinishChange(v => {
                action.parameters[parameterName] = v;
            });
        }

        this.addControl(proxy, 'remove');
    }
}

class StoryTriggerController extends EmptyView {
    /**
     *
     * @param {StoryTrigger} trigger
     * @param {function} remove
     */
    constructor(trigger, remove) {
        super({ classList: ['story-trigger'] });

        const proxy = {
            remove,
            actionType: StoryActionType.Unknown,
            active: trigger.active.getValue(),
            addAction() {

                const action = new StoryAction();

                action.type = proxy.actionType;

                trigger.actions.add(action);
            }
        };


        const dat = new DatGuiController();
        dat.addControl(proxy, 'remove');
        dat.addControl(trigger, "code").onFinishChange(() => trigger.compile());
        dat.addControl(proxy, 'active').onChange(() => trigger.active.set(proxy.active));

        dat.addControl(proxy, 'actionType', StoryActionType);
        dat.addControl(proxy, 'addAction').name('+action');


        this.addChild(dat);

        this.addChild(new ListView(trigger.actions, {
            classList: ["actions"],
            elementFactory(action) {
                return new StoryActionController(action, () => {
                    trigger.actions.removeOneOf(action);
                });
            }
        }));
    }
}

export class StoryTriggerSetController extends EmptyView {
    /**
     *
     */
    constructor() {
        super({ classList: ['story-trigger-set-controller'] });

        const model = new ObservedValue(null);

        this.model = model;


        const proxy = {
            code: "true",
            addTrigger() {
                const trigger = new StoryTrigger();

                trigger.code = proxy.code;

                model.getValue().elements.add(trigger);
            }
        };

        const dat = new DatGuiController();


        dat.addControl(proxy, 'code');
        dat.addControl(proxy, 'addTrigger').name('+trigger');

        this.model.onChanged.add((triggers) => {
            this.removeAllChildren();

            this.addChild(dat);

            if (triggers !== null) {
                const view = new ListView(triggers.elements, {
                    elementFactory(trigger) {
                        return new StoryTriggerController(trigger, () => {
                            triggers.elements.removeOneOf(trigger);
                        });
                    },
                    classList: ['triggers']
                });

                this.addChild(view);
            }
        });
    }
}
