import EntityBuilder from "../../EntityBuilder.js";
import { loadFoliageLayer } from "./Foliage2System.js";
import Mesh, { MeshFlags } from "../../../graphics/ecs/mesh/Mesh.js";
import { Transform } from "../../transform/Transform.js";
import { Foliage2, FoliageLayer } from "./Foliage2.js";
import { InstancedFoliage } from "../InstancedFoliage.js";
import { buildTreeOptimizationTask } from "../../../../core/bvh2/BVHTasks.js";
import Task from "../../../../core/process/task/Task.js";
import TaskSignal from "../../../../core/process/task/TaskSignal.js";
import { countTask, promiseTask } from "../../../../core/process/task/TaskUtils.js";
import { assert } from "../../../../core/assert.js";

/**
 * Convert all existing instanced mesh components to individual Transform+Mesh pairs
 * @param {EntityComponentDataset} dataset
 * @param assetManager
 */
export function convertInstancedMeshComponents2Entities(dataset, assetManager) {
    assert.notEqual(dataset, undefined, 'dataset is undefined');
    assert.notEqual(assetManager, undefined, 'assetManager is undefined');

    const entitiesToStrip = [];

    /**
     *
     * @param {Foliage2} foliage2
     * @param entity
     */
    function visitFoliageEntities(foliage2, entity) {
        foliage2.layers.forEach(function (layer) {
            const modelURL = layer.modelURL.getValue();

            loadFoliageLayer(layer, assetManager)
                .then(function (instancedFoliage) {

                    const data = instancedFoliage.data;
                    const numInstances = data.length;

                    for (let i = 0; i < numInstances; i++) {
                        const transform = new Transform();

                        instancedFoliage.read(i, transform.position, transform.rotation, transform.scale);

                        const mesh = new Mesh();
                        mesh.url = modelURL;

                        mesh.castShadow = layer.castShadow.getValue();
                        mesh.receiveShadow = layer.receiveShadow.getValue();

                        //TODO Consider moving BVH info here also, to make this process faster

                        const entityBuilder = new EntityBuilder();

                        entityBuilder.add(transform).add(mesh).build(dataset);
                    }
                });
        });

        entitiesToStrip.push(entity);
    }

    dataset.traverseEntities([Foliage2], visitFoliageEntities);

    //remove converted foliage components
    entitiesToStrip.forEach(function (entity) {
        dataset.removeComponentFromEntity(entity, Foliage2);
    });
}

/**
 *
 * @param {EntityComponentDataset} dataset
 * @param {number} threshold minimum number of instances required before conversion happens
 * @returns {{main:Task, tasks:Task[]}}
 */
export function optimizeIndividualMeshesEntitiesToInstances(dataset, threshold = 30) {
    //get all entities that have a translation and mesh only
    const candidates = {};

    /**
     *
     * @param {Mesh} mesh
     * @param {Transform} transform
     * @param {int} entity
     */
    function visitMeshTransformEntity(mesh, transform, entity) {
        const model_url = mesh.url;

        if (model_url === undefined || model_url === null || model_url.trim().length === 0) {
            //not a valid URL
            return;
        }

        if (mesh.getFlag(MeshFlags.Loaded) && (mesh.mesh.isMesh !== true || mesh.mesh.isSkinnedMesh === true)) {
            // mesh is not compatible with instancing
            return;
        }

        let list;
        if (!candidates.hasOwnProperty(model_url)) {
            list = [];
            candidates[model_url] = {
                mesh,
                list
            };
        } else {
            list = candidates[model_url].list;
        }

        list.push({
            entity,
            position: transform.position,
            rotation: transform.rotation,
            scale: transform.scale
        });
    }

    // traverse entities that have only Mesh and a Transform
    dataset.traverseEntitiesExact([Mesh, Transform], visitMeshTransformEntity);

    const tasks = [];

    const foliage2 = new Foliage2();

    const tBuild = new Task({
        name: "Build Meshes",
        cycleFunction: function () {
            const entityBuilder = new EntityBuilder();

            entityBuilder.add(foliage2);

            entityBuilder.build(dataset);

            return TaskSignal.EndSuccess;
        },
        computeProgress: function () {
            return 1;
        }
    });

    tasks.push(tBuild);

    let modelURL;


    function createLayerForInstances(group, modelURL) {
        const instances = group.list;
        const numInstances = instances.length;

        if (numInstances < threshold) {
            //too new instances to convert
            return;
        }

        //build up instanced mesh
        const instancedFoliage = new InstancedFoliage();

        const tLoadGeometry = promiseTask(new Promise(function (resolve, reject) {

            const mesh = group.mesh.mesh;
            const geometry = mesh.geometry;

            instancedFoliage.setInstance(geometry, mesh.material);

            resolve();
        }), 'Loading Instance Geometry');

        tasks.push(tLoadGeometry);


        const tPopulate = countTask(0, numInstances, function (i) {
            const instance = instances[i];

            //check for 0 scale
            if (instance.scale.isZero()) {
                //ignore an instance with 0 scale, it is not visible.
                return;
            }

            //check for duplicates before
            for (let j = i - 1; j >= 0; j--) {

                const instanceTemp = instances[j];

                if (instance.position.equals(instanceTemp.position) && instance.rotation.equals(instanceTemp.rotation) && instance.scale.equals(instanceTemp.scale)) {
                    //identical instance was found in the past, skip
                    return;
                }
            }

            instancedFoliage.add(instance.position, instance.rotation, instance.scale);
        });

        tPopulate.addDependency(tLoadGeometry);

        tPopulate.name = `Populate instanced of '${modelURL}'`;

        tasks.push(tPopulate);

        //
        const tOptimization = buildTreeOptimizationTask(instancedFoliage.bvh, instancedFoliage.data.length * 4);
        tOptimization.addDependency(tPopulate);

        tasks.push(tOptimization);

        const tGenerateLayer = new Task({
            name: "Serialize data",
            cycleFunction: function () {

                //create foliage layer
                const layer = new FoliageLayer();

                layer.data = instancedFoliage;
                layer.modelURL.set(modelURL);

                //TODO shadow settings are just assumptions
                layer.castShadow.set(true);
                layer.receiveShadow.set(true);

                instancedFoliage.instances.mesh.castShadow = layer.castShadow.getValue();
                instancedFoliage.instances.mesh.receiveShadow = layer.receiveShadow.getValue();

                foliage2.layers.add(layer);

                return TaskSignal.EndSuccess;
            },
            computeProgress: function () {
                return 1;
            }
        });

        tGenerateLayer.addDependency(tOptimization);

        tasks.push(tGenerateLayer);

        //make layer building task a dependency to the main task
        tBuild.addDependency(tGenerateLayer);

        //make a task to destroy original entities
        const tCleanup = countTask(0, numInstances, function (i) {
            const instance = instances[i];

            const entity = instance.entity;

            dataset.removeEntity(entity);
        });

        tCleanup.name = `Remove Original Instances of '${modelURL}'`;

        tCleanup.addDependency(tBuild);

        tasks.push(tCleanup);
    }

    for (modelURL in candidates) {

        if (!candidates.hasOwnProperty(modelURL)) {
            //by some black magic - the candidates don't have this modelURL. This is a sanity check
            continue;
        }

        const instances = candidates[modelURL];

        createLayerForInstances(instances, modelURL);

    }

    return {
        main: tBuild,
        tasks
    };
}
