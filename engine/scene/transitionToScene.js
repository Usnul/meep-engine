import { wrapTaskIgnoreFailure } from "../../core/process/task/TaskUtils.js";
import { loadVisibleTerrainTiles } from "../../../model/game/scenes/SceneUtils.js";
import TaskGroup from "../../core/process/task/TaskGroup.js";
import Task from "../../core/process/task/Task.js";
import TaskState from "../../core/process/task/TaskState.js";
import { noop } from "../../core/function/Functions.js";
import { compileAllMaterials } from "../graphics/ecs/compileAllMaterials.js";
import { createTaskWaitForMeshesToLoad } from "../graphics/ecs/mesh/createTaskWaitForMeshesToLoad.js";


/**
 *
 * @param {Task[]} [tasks]
 * @param {Scene} scene
 * @param {Engine} engine
 * @param {string} [name]
 * @return {Promise}
 */
export function transitionToScene({ tasks = [], scene, engine, name }) {
    if (name === undefined) {
        if (tasks.length > 0) {
            //assume name of the first task
            name = tasks[0].name;
        } else {
            name = `Loading ${scene.name} Scene`;
        }
    }


    //wait for visible terrain tiles to be loaded
    const tWaitForVisibleTerrainTiles = wrapTaskIgnoreFailure(loadVisibleTerrainTiles(engine.entityManager, scene.dataset));
    tWaitForVisibleTerrainTiles.name = "Waiting for visible terrain tiles";

    const tWaitForMeshes = wrapTaskIgnoreFailure(createTaskWaitForMeshesToLoad(scene.dataset, 7000));

    /**
     *
     * @type {GraphicsEngine}
     */
    const graphics = engine.graphics;

    const tCompileMaterials = compileAllMaterials({ graphics });
    tCompileMaterials.addDependency(tWaitForVisibleTerrainTiles);
    tCompileMaterials.addDependency(tWaitForMeshes);

    const extraTasks = [
        tWaitForMeshes,
        tWaitForVisibleTerrainTiles,
        tCompileMaterials
    ];

    const allTasks = tasks.concat(extraTasks);

    const taskGroup = new TaskGroup(allTasks, name);

    Task.joinAll(allTasks,
        () => {
            taskGroup.state.set(TaskState.SUCCEEDED);

            taskGroup.on.completed.send0();

        },
        () => {
            taskGroup.state.set(TaskState.FAILED);

            taskGroup.on.failed.send0();
        }
    );


    const promise = engine.loadSlowTask(taskGroup);

    Task.joinAll(tasks, () => {
        engine.executor.runMany(extraTasks);
    }, noop);

    return promise;
}
