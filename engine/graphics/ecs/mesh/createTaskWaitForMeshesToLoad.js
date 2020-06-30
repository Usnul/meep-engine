import Mesh, { MeshFlags } from "./Mesh.js";
import Task from "../../../../core/process/task/Task.js";
import TaskSignal from "../../../../core/process/task/TaskSignal.js";
import { clamp, max2 } from "../../../../core/math/MathUtils.js";
import { assert } from "../../../../core/assert.js";

/**
 * Produces a task that will wait for all existing Meshes of a dataset to be loaded, will fail upon timeout being reached
 * @param {EntityComponentDataset} ecd Dataset
 * @param {number} timeout in milliseconds, measured in wall-clock-time, from initialization of the task
 * @return {Task}
 */
export function createTaskWaitForMeshesToLoad(ecd, timeout) {
    assert.typeOf(timeout, 'number', 'timeout');
    assert.notOk(Number.isNaN(timeout), `timeout is NaN`);

    /**
     *
     * @type {Mesh[]}
     */
    const unfinishedMeshes = [];

    /**
     *
     * @param {Mesh} m
     */
    function collectMesh(m) {
        if (!m.getFlag(MeshFlags.Loaded)) {
            unfinishedMeshes.push(m);
        }
    }

    let cursor = 0;

    let startTime = 0;
    let currentTime = 0;

    const estimatedDuration = timeout / 300;

    const task = new Task({
        name: 'Waiting for meshes to load',
        initializer() {
            unfinishedMeshes.splice(0, unfinishedMeshes.length);

            ecd.traverseComponents(Mesh, collectMesh);

            cursor = 0;

            startTime = performance.now();
            currentTime = startTime;
        },

        estimatedDuration,

        computeProgress() {
            const n = unfinishedMeshes.length;
            if (n === 0) {
                return 1;
            }


            const progress = (n - cursor) / n;

            if (progress >= 1) {
                return 1;
            }

            if (timeout === 0 || !Number.isFinite(timeout)) {
                return progress;
            }


            const relativeExpiredTime = (currentTime - startTime) / timeout;

            const p = max2(progress, relativeExpiredTime);

            return clamp(p, 0, 1);
        },
        cycleFunction() {
            currentTime = performance.now();

            if (cursor >= unfinishedMeshes.length) {
                return TaskSignal.EndSuccess;
            }

            const m = unfinishedMeshes[cursor];

            if (m.getFlag(MeshFlags.Loaded)) {
                cursor++;
                return TaskSignal.Continue;
            } else {

                if ((currentTime - startTime) >= timeout) {
                    return TaskSignal.EndFailure;
                } else {
                    return TaskSignal.Yield;
                }
            }

        }
    });

    return task
}
