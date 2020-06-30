import { Mesh, PlaneBufferGeometry } from "three";
import Task from "../../../core/process/task/Task.js";
import TaskSignal from "../../../core/process/task/TaskSignal.js";
import { collectIteratorValueToArray } from "../../../core/collection/IteratorUtils.js";
import { clamp } from "../../../core/math/MathUtils.js";

/**
 * Compile all materials found in the dataset
 * @param {GraphicsEngine} graphics
 * @param {number} timeout
 * @param includeHiddenLayers
 * @returns {Task}
 */
export function compileAllMaterials({ graphics, timeout = 0, includeHiddenLayers = true }) {
    /**
     *
     * @type {Set<Material>}
     */
    const materials = new Set();

    const materialsArray = [];

    /**
     *
     * @param {Object3D|Mesh|SkinnedMesh} object3d
     */
    function extractMaterialFromObject(object3d) {
        if (object3d === null) {
            return;
        }

        if (object3d === undefined) {
            return;
        }

        const material = object3d.material;

        if (material !== undefined) {
            materials.add(material);
        }
    }


    const geometry = new PlaneBufferGeometry(1, 1, 1, 1);

    const mesh = new Mesh(geometry, null);

    mesh.frustumCulled = false;

    let index = 0;

    const task = new Task({
        name: 'Compiling materials',
        estimatedDuration: 5,
        initializer() {
            //extract all materials
            graphics.layers.traverse(renderLayer => {

                if (!renderLayer.visible && !includeHiddenLayers) {
                    //hidden, ignore
                    return;
                }

                /**
                 *
                 * @param {LeafNode} node
                 */
                function visitLeaf(node) {
                    const object3D = renderLayer.extractRenderable(node.object);

                    extractMaterialFromObject(object3D);
                }

                const n0 = materials.size;

                renderLayer.bvh.traverseLeavesPreOrderUsingStack(visitLeaf);

                const n1 = materials.size;

                const mCount = n1 - n0;

                if (mCount > 0) {
                    console.log(`Materials in layer '${renderLayer.name}': ${mCount}`);
                }
            });

            index = 0;

            materialsArray.splice(0, materialsArray.length);

            collectIteratorValueToArray(materialsArray, materials.values());
        },

        computeProgress() {
            const n = materialsArray.length;

            if (n === 0) {
                return 0;
            } else {

                const f = index / n;

                return clamp(f, 0, 1);

            }
        },

        cycleFunction() {
            if (index >= materials.size) {
                console.log(`Compiled ${materials.size} materials`);

                return TaskSignal.EndSuccess;
            }

            const material = materialsArray[index];

            mesh.material = material;

            //add group to the scene
            graphics.scene.add(mesh);

            graphics.graphics.compile(graphics.scene, graphics.camera);

            //remove group from the scene
            graphics.scene.remove(mesh);

            index++;

            return TaskSignal.Continue;
        }
    });

    task.on.completed.add(() => {
        //clean up geometry
        geometry.dispose();
    });

    return task;
}
