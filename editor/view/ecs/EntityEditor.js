/**
 * Created by Alex on 15/01/2017.
 */
import View from "../../../view/View.js";
import dom from "../../../view/DOM.js";

import List from '../../../core/collection/list/List.js';
import ObservedValue from '../../../core/model/ObservedValue.js';
import LabelView from '../../../view/common/LabelView.js';
import ButtonView from '../../../view/elements/button/ButtonView.js';
import DropDownSelectionView from '../../../view/elements/DropDownSelectionView.js';

import TransformController from './components/TransformController.js';
import MeshController from './components/MeshController.js';
import { datify } from "../../../view/controller/dat/DatGuiUtils.js";
import EmptyView from "../../../view/elements/EmptyView.js";
import { EntityManager, EventType } from "../../../engine/ecs/EntityManager.js";
import HighlightController from "./components/HighlightController.js";
import { GridPositionController } from "./components/GridPositionController.js";
import { ParticleEmitterController } from "./components/particles/ParticleEmitterController.js";
import { TerrainController } from "./components/TerrainController.js";
import { TagController } from "./components/TagController.js";
import { ItemContainerController } from "./components/items/ItemContainerController.js";
import { FogOfWarRevealerController } from "./components/FogOfWarRevealerController.js";
import { FogOfWarController } from "./components/FogOfWarController.js";
import { GeneratedArmyController } from "./components/GeneratedArmyController.js";
import { ArmyController } from "./components/army/ArmyController.js";
import { PathFollowerController } from "./components/PathFollowerController.js";
import ComponentRemoveAction from "../../actions/concrete/ComponentRemoveAction.js";
import ComponentAddAction from "../../actions/concrete/ComponentAddAction.js";
import { StoryTriggerSetController } from "./components/story/StoryTriggerSetController.js";
import { UnitShopController } from "./components/UnitShopController.js";
import { SoundEmitterController } from "./components/sound/SoundEmitterController.js";
import { GUIElementController } from "./components/gui/GUIElementController.js";
import { LineView } from "./components/common/LineView.js";
import { ComponentControlView } from "./ComponentControlView.js";
import { HeadsUpDisplayController } from "./components/HeadsUpDisplayController.js";
import { BlackboardController } from "./components/BlackboardController.js";
import { GridObstacleController } from "./components/GridObstacleController.js";

/**
 *
 * @param {ComponentControlFactory} factory
 * @param {Editor} editor
 */
function prepareComponentFactory(factory, editor) {
    factory
        .register('Transform', () => new TransformController())
        .register('Mesh', () => new MeshController(editor.engine.assetManager))
        .register('GridPosition', () => new GridPositionController())
        .register('Name', datify)
        .register('Tag', () => new TagController())
        .register('Team', datify)
        .register('HeadsUpDisplay', () => new HeadsUpDisplayController())
        .register('GeneratedArmy', () => new GeneratedArmyController())
        .register('Army', () => new ArmyController({
            localization: editor.engine.localization,
            afflictionDatabase: editor.engine.staticKnowledge.afflictions
        }))
        .register('ClingToTerrain', datify)
        .register('Commander', datify)
        .register('MinimapMarker', datify)
        .register('Camera', datify)
        .register('FacingDirection', datify)
        .register('GridObstacle', () => new GridObstacleController())
        .register('Terrain', () => new TerrainController(editor.engine.assetManager))
        .register('TopDownCameraController', datify)
        .register('Light', datify)
        .register('FogOfWar', () => new FogOfWarController(editor.engine.entityManager))
        .register('FogOfWarRevealer', () => new FogOfWarRevealerController())
        .register('PathFollower', () => new PathFollowerController())
        .register('Highlight', () => new HighlightController())
        .register('Blackboard', () => new BlackboardController())
        .register('StoryTriggerSet', () => new StoryTriggerSetController())
        .register('UnitShop', () => new UnitShopController())
        .register('ItemContainer', () => new ItemContainerController({
            localization: editor.engine.localization,
            itemDatabase: editor.engine.staticKnowledge.items
        }))
        .register('ParticleEmitter', () => {
            const em = editor.engine.entityManager;
            const particleEmitterSystem = em.getOwnerSystemByComponentClass(em.getComponentClassByName('ParticleEmitter'));
            return new ParticleEmitterController(particleEmitterSystem);
        })
        .register('SoundEmitter', () => new SoundEmitterController(editor.engine))
        .register('GUIElement', () => new GUIElementController())
        .register('ViewportPosition', datify)
    ;
}


class EntityEditor extends View {
    /**
     *
     * @param {ComponentControlFactory} componentControlFactory
     * @param {Editor} editor
     * @constructor
     */
    constructor(componentControlFactory, editor) {

        super();


        const dRoot = dom('div');

        dRoot.addClass('entity-editor-view');

        this.el = dRoot.el;
        const self = this;

        this.model = new ObservedValue(null);
        /**
         * @type {ObservedValue<EntityManager>}
         */
        this.entityManager = new ObservedValue(null);
        this.components = new List();

        const vComponentList = new EmptyView({ classList: ['component-list'] });

        prepareComponentFactory(componentControlFactory, editor);

        /**
         *
         * @type {Map<Object, ComponentControlView>}
         */
        this.componentControllers = new Map();

        function addComponent(event) {
            if (event.instance === undefined) {
                return;
            }

            self.components.add(event.instance);
        }

        function removeComponent(event) {
            // console.log('removeComponent.Event',event, self.components);

            if (event.instance === undefined) {
                return;
            }

            try {
                self.components.removeOneOf(event.instance);
            } catch (e) {
                console.error(e);
            }
        }

        function watchEntity(entity) {
            /**
             *
             * @type {EntityManager}
             */
            const entityManager = self.entityManager.get();

            const dataset = entityManager.dataset;

            if (!dataset.entityExists(entity)) {
                //doesn't exist, nothing to do
                return;
            }

            dataset.addEntityEventListener(entity, EventType.ComponentAdded, addComponent);
            dataset.addEntityEventListener(entity, EventType.ComponentRemoved, removeComponent);
            dataset.addEntityEventListener(entity, EventType.EntityRemoved, unwatchEntity);
        }

        function unwatchEntity(entity) {
            /**
             *
             * @type {EntityManager}
             */
            const entityManager = self.entityManager.get();

            const dataset = entityManager.dataset;

            if (!dataset.entityExists(entity)) {
                //doesn't exist, nothing to do
                return;
            }

            dataset.removeEntityEventListener(entity, EventType.ComponentAdded, addComponent);
            dataset.removeEntityEventListener(entity, EventType.ComponentRemoved, removeComponent);
            dataset.removeEntityEventListener(entity, EventType.EntityRemoved, unwatchEntity);
        }

        this.model.onChanged.add(function (entity, oldEntity) {
            if (oldEntity !== undefined && oldEntity !== null) {
                unwatchEntity(oldEntity);
            }
            watchEntity(entity);

            self.components.reset();

            const entityManager = self.entityManager.get();

            /**
             *
             * @type {EntityComponentDataset}
             */
            const dataset = entityManager.dataset;

            const components = dataset.getAllComponents(entity);
            components.forEach(function (c) {
                self.components.add(c);
            });
        });

        this.vLabelEntity = new LabelView(this.model, {
            classList: ['id', 'label']
        });

        this.addChild(vComponentList);


        const unattachedTypes = new List();

        function updateList() {
            /**
             *
             * @type {EntityManager}
             */
            const em = self.entityManager.get();

            //all systems
            const allTypeNames = em.getComponentTypeMap()
                .map(c => c.typeName)
                .filter(typeName => typeof typeName === "string")
                .sort();

            function has(typeName) {
                let result = false;

                self.components.visitFirstMatch(c => c.constructor.typeName === typeName, () => result = true);

                return result;
            }

            //remove already attached
            const unattachedTypeNames = allTypeNames.filter(typeName => !has(typeName));

            unattachedTypes.reset();
            unattachedTypes.addAll(unattachedTypeNames);
        }

        /**
         * @template T
         * @param {T} component
         */
        function handleComponentAdded(component) {
            // console.log("handleComponentAdded",c);
            const Klass = component.constructor;
            if (!self.componentControllers.has(Klass)) {
                /**
                 *
                 * @type {EntityManager}
                 */
                const entityManager = self.entityManager.getValue();

                const entityId = self.model.getValue();

                const controlView = new ComponentControlView(entityId, component, entityManager, componentControlFactory);

                controlView.signal.remove.add(function () {

                    editor.actions.mark('Remove Component');
                    editor.actions.do(new ComponentRemoveAction(entityId, Klass));
                });


                self.componentControllers.set(Klass, controlView);
                vComponentList.addChild(controlView);
            }
            updateList();
        }

        function handleComponentRemoved(c) {
            // console.log("handleComponentRemoved",c);
            const key = c.constructor;
            if (self.componentControllers.has(key)) {
                const controlView = self.componentControllers.get(key);
                self.componentControllers.delete(key);
                vComponentList.removeChild(controlView);
            }
            updateList();
        }

        this.components.on.added.add(handleComponentAdded);
        this.components.on.removed.add(handleComponentRemoved);


        const typeSelection = new DropDownSelectionView(unattachedTypes);

        const buttonView = new ButtonView({
            classList: ['add-component'],
            name: "Add",
            action: function () {
                const selectedValue = typeSelection.getSelectedValue();
                const em = self.entityManager.get();
                const ComponentClass = em.getComponentClassByName(selectedValue);
                const component = new ComponentClass();

                const entityIndex = self.model.get();

                editor.actions.mark('Add Component');
                editor.actions.do(new ComponentAddAction(entityIndex, component));
            }
        });

        this.addChild(new LineView({
            elements: [this.vLabelEntity, buttonView, typeSelection],
            classList: ['component-adder']
        }));

        this.handlers = {};
    }

    link() {
        super.link()


    }

    unlink() {
        super.unlink();
    }
}


export default EntityEditor;
