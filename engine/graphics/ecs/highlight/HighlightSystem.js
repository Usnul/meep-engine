/**
 * Created by Alex on 20/09/2015.
 */


import { System } from '../../../ecs/System.js';
import Highlight from './Highlight.js';
import Mesh, { MeshFlags } from '../mesh/Mesh.js';
import { Scene as ThreeScene } from 'three';
import { OutlineRenderer } from "./OutlineRenderer.js";
import { BlendingType } from "../../texture/sampler/BlendingType.js";
import { max2 } from "../../../../core/math/MathUtils.js";
import { HighlightRenderGroup } from "./HighlightRenderGroup.js";
import { HighlightRenderElement } from "./HighlightRenderElement.js";

class HighlightSystem extends System {
    /**
     *
     * @param {GraphicsEngine} graphicsEngine
     * @constructor
     */
    constructor(graphicsEngine) {
        super();

        this.componentClass = Highlight;
        this.dependencies = [Highlight, Mesh];

        this.entityManager = null;

        const scene = this.scene = new ThreeScene();

        /**
         *
         * @type {GraphicsEngine}
         */
        this.graphicsEngine = graphicsEngine;
        const self = this;

        this.outlineRenderer = new OutlineRenderer(graphicsEngine.graphics, scene, graphicsEngine.camera);
        this.boundRender = this.render.bind(this);


        /**
         *
         * @type {HighlightRenderGroup}
         * @private
         */
        this.__highlightRenderGroup = new HighlightRenderGroup();


        this.setViewportSize = function (x, y) {
            const width = max2(0, x);
            const height = max2(0, y);

            self.outlineRenderer.resize(width, height);
        };
    }


    /**
     *
     * @param {EntityManager} entityManager
     * @param {function} readyCallback
     * @param {function} errorCallback
     */
    shutdown(entityManager, readyCallback, errorCallback) {
        try {
            this.graphicsEngine.on.preRender.remove(this.boundRender);
            this.graphicsEngine.viewport.size.onChanged.remove(this.setViewportSize);

            readyCallback();
        } catch (e) {
            errorCallback();
        }
    }

    /**
     *
     * @param {EntityManager} entityManager
     * @param {function} readyCallback
     * @param {function} errorCallback
     */
    startup(entityManager, readyCallback, errorCallback) {
        /**
         *
         * @type {EntityManager}
         */
        this.entityManager = entityManager;

        this.graphicsEngine.viewport.size.process(this.setViewportSize);

        this.graphicsEngine.on.preComposite.add(this.boundRender);

        //this.graphicsEngine.renderTargets.push(this.outlineRenderer.composer.renderTarget2);
        const compositLayer = this.graphicsEngine.layerComposer.addLayer(this.outlineRenderer.__renderTargetFinal, BlendingType.Add);

        //render at half the resolution
        compositLayer.setRenderTargetScale(1);

        readyCallback();
    }

    /**
     *
     * @param {Highlight} highlight
     * @param {Mesh} model
     * @param {number} entity
     * @private
     */
    __visitHighlightMeshPreRender(highlight, model, entity) {
        if (!model.hasMesh()) {
            return;
        }

        if (!model.getFlag(MeshFlags.InView)) {
            return;
        }

        const renderElement = new HighlightRenderElement();

        renderElement.definitions = highlight.elements.asArray();
        renderElement.object = model.mesh;

        this.__highlightRenderGroup.elements.add(renderElement);
    }

    render(renderer, camera, scene) {
        const em = this.entityManager;

        const dataset = em.dataset;

        if (dataset !== null) {
            this.__highlightRenderGroup.clear();

            //swap materials of scene objects
            dataset.traverseEntities([Highlight, Mesh], this.__visitHighlightMeshPreRender, this);

            if (this.__highlightRenderGroup.isEmpty()) {
                this.outlineRenderer.clearRenderTarget();
                //nothing to render
                return;
            } else {
                this.outlineRenderer.setCamera(camera);
                this.outlineRenderer.render(this.__highlightRenderGroup);
            }

        }
    }

    /**
     *
     * @param {Highlight} highlight
     * @param {Mesh} model
     * @param {int} entityId
     */
    link(highlight, model, entityId) {

    }

    /**
     *
     * @param {Highlight} highlight
     * @param {Mesh} model
     * @param {int} entityId
     */
    unlink(highlight, model, entityId) {


    }

    update(timeDelta) {
    }
}


export default HighlightSystem;
