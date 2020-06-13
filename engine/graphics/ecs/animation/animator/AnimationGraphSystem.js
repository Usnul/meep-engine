import { System } from "../../../../ecs/System.js";
import { AnimationGraph } from "./graph/AnimationGraph.js";
import Mesh, { MeshFlags } from "../../mesh/Mesh.js";
import { EventMeshSet } from "../../mesh/MeshSystem.js";
import { assert } from "../../../../../core/assert.js";
import { max3 } from "../../../../../core/math/MathUtils.js";
import { projectSphere } from "../../../Utils.js";
import Vector4 from "../../../../../core/geom/Vector4.js";
import Vector2 from "../../../../../core/geom/Vector2.js";
import { Matrix4 } from "three";
import { CameraSystem } from "../../camera/CameraSystem.js";
import { AnimationGraphFlag } from "./graph/AnimationGraphFlag.js";

/**
 *
 * @param {AnimationGraph} graph
 * @param {Mesh} mesh
 * @param {number} entity
 * @param {EntityComponentDataset} ecd
 */
function attach(graph, mesh, entity, ecd) {
    graph.attach(mesh);

    graph.link(entity, ecd);


}

/**
 * @type {Vector4}
 */
const v4boundingSphere = new Vector4();

export class AnimationGraphSystem extends System {
    /**
     *
     * @param {Vector2} viewportSize
     */
    constructor(viewportSize) {
        super();

        this.componentClass = AnimationGraph;

        this.dependencies = [AnimationGraph, Mesh];

        /**
         *
         * @type {number}
         * @private
         */
        this.__timeDelta = 0;

        /**
         *
         * @type {number}
         * @private
         */
        this.__animationGraphComponentIndex = 0;

        /**
         *
         * @type {number}
         * @private
         */
        this.__focalLength = 0;

        /**
         *
         * @type {Vector2}
         * @private
         */
        this.__viewportSize = viewportSize;

        /**
         *
         * @type {Matrix4}
         * @private
         */
        this.__projectionMatrix = new Matrix4();
    }

    /**
     * @private
     * @param {Mesh} component
     * @param {number} entity
     */
    handleMeshSetEvent({ component, entity }) {
        const ecd = this.entityManager.dataset;

        if (!component.getFlag(MeshFlags.Loaded)) {
            // mesh is not yet loaded
            return;
        }

        const graph = ecd.getComponent(entity, AnimationGraph);

        attach(graph, component.mesh, entity, ecd);
    }

    /**
     *
     * @param {AnimationGraph} graph
     * @param {Mesh} mesh
     * @param {number} entity
     */
    link(graph, mesh, entity) {
        const ecd = this.entityManager.dataset;

        if (mesh.getFlag(MeshFlags.Loaded)) {
            attach(graph, mesh.mesh, entity, ecd);
        } else {
            ecd.addEntityEventListener(entity, EventMeshSet, this.handleMeshSetEvent, this);
        }
    }

    /**
     *
     * @param {AnimationGraph} graph
     * @param {Mesh} mesh
     * @param {number} entity
     */
    unlink(graph, mesh, entity) {
        const ecd = this.entityManager.dataset;

        graph.unlink();

        ecd.removeEntityEventListener(entity, EventMeshSet, this.handleMeshSetEvent, this);
    }

    /**
     *
     * @param {AnimationGraph} graph
     * @param {number} entity
     */
    advanceGraphTime(graph, entity) {
        graph.debtTime += this.__timeDelta;
    }

    /**
     *
     * @param {Mesh} mesh
     * @param {number} entity
     */
    visitVisibleMesh(mesh, entity) {
        /**
         *
         * @type {EntityComponentDataset}
         */
        const ecd = this.entityManager.dataset;

        /**
         *
         * @type {AnimationGraph}
         */
        const graph = ecd.getComponentByIndex(entity, this.__animationGraphComponentIndex);

        if (graph === undefined) {
            //mesh has no animation, skip
            return true;
        }

        if (!this.shouldEntityBeAnimated(entity, graph, mesh)) {
            return;
        }

        const dt = graph.debtTime;

        if (dt > 0) {
            graph.tick(dt);

            graph.debtTime = 0;
        }
    }

    /**
     *
     * @param {number} entity
     * @param {AnimationGraph} graph
     * @param {Mesh} meshComponent
     */
    shouldEntityBeAnimated(entity, graph, meshComponent) {

        if (meshComponent === undefined) {
            //no mesh component
            return false;
        }

        const mesh = meshComponent.mesh;

        if (mesh === null) {
            //no renderable object
            return false;
        }

        if (graph.getFlag(AnimationGraphFlag.MeshSizeCulling)) {

            //check the size of the mesh in screen space, culling animation of tiny objects
            const areaInPixel = this.screenSpaceSize(mesh, this.__projectionMatrix);
            if (areaInPixel < 32) {
                //too tiny
                return false;
            }

        }

        //passed all filters, visible
        return true;
    }


    /**
     *
     * @param {Mesh} mesh trhee.js Mesh instance
     * @param {Matrix4} cameraMatrix
     */
    screenSpaceSize(mesh, cameraMatrix) {
        /**
         * @type {Vector4}
         */
        const source = mesh.boundingSphere;

        if (source === undefined) {
            return 0;
        }

        assert.notEqual(cameraMatrix, null, 'camera matrix is null');

        v4boundingSphere.copy(source);

        const position = mesh.position;
        const scale = mesh.scale;
        const scaleMax = max3(scale.x, scale.y, scale.z);


        v4boundingSphere.multiplyScalar(scaleMax);
        v4boundingSphere.add3(position);

        const area = projectSphere(v4boundingSphere, cameraMatrix, this.__focalLength);

        /**
         *
         * @type {Vector2}
         */
        const vs = this.__viewportSize;

        const viewportWidth = vs.x;
        const viewportHeight = vs.y;

        const inPixels = area * viewportWidth * viewportHeight;

        return inPixels;
    }


    update(timeDelta) {
        this.__timeDelta = timeDelta;

        /**
         *
         * @type {EntityManager}
         */
        const em = this.entityManager;

        /**
         *
         * @type {EntityComponentDataset}
         */
        const ecd = em.dataset;

        if (ecd === null) {
            return;
        }

        const meshSystemId = em.getOwnerSystemIdByComponentClass(Mesh);

        if (meshSystemId === -1) {
            throw  new Error('Mesh system not found');
        }

        this.__meshSystemId = meshSystemId;


        const firstActiveCamera = CameraSystem.getFirstActiveCamera(ecd);

        if (firstActiveCamera === null) {
            //no active camera found
            return;
        }

        /**
         * @type {THREE.PerspectiveCamera}
         */
        const c = firstActiveCamera.object;

        this.__projectionMatrix.getInverse(c.matrixWorld);

        this.__focalLength = c.fov / 180; //convert to Radians

        ecd.traverseComponents(AnimationGraph, this.advanceGraphTime, this);

        this.__animationGraphComponentIndex = ecd.computeComponentTypeIndex(AnimationGraph);

        /**
         *
         * @type {MeshSystem}
         */
        const meshSystem = em.getOwnerSystemByComponentClass(Mesh);

        //update animations for visible meshes
        meshSystem.traverseVisible(this.visitVisibleMesh, this);
    }
}
