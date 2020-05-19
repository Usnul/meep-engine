import DatGuiController from "../DatGuiController.js";
import { StoryTrigger } from "../../../../../../model/game/story/triggers/StoryTrigger.js";
import { StoryActionType } from "../../../../../../model/game/story/action/StoryActionType.js";
import ListView from "../../../../../view/common/ListView.js";
import ObservedValue from "../../../../../core/model/ObservedValue.js";
import EmptyView from "../../../../../view/elements/EmptyView.js";
import { StoryAction } from "../../../../../../model/game/story/action/StoryAction.js";
import { NativeListController } from "../../../../../view/controller/controls/NativeListController.js";

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
     */
    constructor(action) {
        super();

        this.addClass('story-action');


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

    }
}

class StoryTriggerController extends EmptyView {
    /**
     *
     * @param {StoryTrigger} trigger
     */
    constructor(trigger) {
        super({ classList: ['story-trigger'] });

        const proxy = {
            actionType: StoryActionType.Unknown,
            active: trigger.active.getValue(),
            addAction() {

                const action = new StoryAction();

                action.type = proxy.actionType;

                trigger.actions.add(action);
            }
        };


        const dat = new DatGuiController();
        dat.addControl(trigger, "code").onFinishChange(() => trigger.compile());
        dat.addControl(proxy, 'active').onChange(() => trigger.active.set(proxy.active));

        dat.addControl(proxy, 'actionType', StoryActionType);
        dat.addControl(proxy, 'addAction').name('+action');


        this.addChild(dat);

        this.addChild(new NativeListController({
            model:trigger.actions,
            classList: ["actions"],
            elementFactory() {
                return new StoryAction();
            },
            elementViewFactory(action){
                return new StoryActionController(action);
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


        this.model.onChanged.add((triggers) => {
            this.removeAllChildren();


            if (triggers !== null) {

                /**
                 * @type {List<StoryTrigger>}
                 */
                const list = triggers.elements;

                const view = new NativeListController({
                    model: list,
                    elementFactory() {
                        return new StoryTrigger();
                    },
                    elementViewFactory(trigger) {
                        return new StoryTriggerController(trigger);
                    },
                    classList: ['triggers']
                })

                this.addChild(view);
            }
        });
    }
}
