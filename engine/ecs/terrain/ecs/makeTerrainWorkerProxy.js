import WorkerBuilder from "../../../../core/process/worker/WorkerBuilder.js";

/**
 *
 * @return {WorkerProxy}
 */
export function makeTerrainWorkerProxy() {
    const workerBuilder = new WorkerBuilder();
    workerBuilder.importScript('bundle-1.js');

    function useSampler(callback) {
        if (globalScope.samplerHeight !== undefined) {
            callback(globalScope.samplerHeight);
        } else {
            if (globalScope.useSampleCallbacks === undefined) {
                globalScope.useSampleCallbacks = [callback];
            } else {
                globalScope.useSampleCallbacks.push(callback);
            }
        }
    }

    workerBuilder.importFunction(useSampler);

    workerBuilder.addMethod('computeHeightRange', function () {
        return new Promise(function (resolve, reject) {

            useSampler(function (sampler) {

                const min = sampler.computeMin();
                const max = sampler.computeMax();

                resolve({
                    min: min.value,
                    max: max.value
                });

            });

        });
    });

    workerBuilder.addMethod('setHeightSampler', function setHeightSampler(data, itemSize, width, height) {
        return new Promise(function (resolve, reject) {
            globalScope.samplerHeight = new Lib.Sampler2D(data, itemSize, width, height);
            if (globalScope.useSampleCallbacks !== undefined) {
                globalScope.useSampleCallbacks.forEach(function (c) {
                    c(globalScope.samplerHeight);
                })
            }
            resolve();
        });
    });

    workerBuilder.addMethod('buildTile', function (position, size, scale, totalSize, resolution) {
        return new Promise(function (resolve, reject) {
            useSampler(function (sampler) {
                try {
                    const geometry = Lib.BufferedGeometryArraysBuilder.build(sampler, position, size, scale, totalSize, resolution);

                    // console.time("Optimizing UVs");
                    Lib.tensionOptimizeUV(geometry.vertices, geometry.uvs, geometry.indices, 21);
                    // console.timeEnd("Optimizing UVs");

                    // var timerName = 'building bvh '+(geometry.indices.length/3);
                    // console.time(timerName);
                    const bvh = Lib.BinaryBVHFromBufferGeometry.buildUnsorted(geometry.vertices, geometry.indices);
                    // console.timeEnd(timerName);

                    resolve({
                        geometry: geometry,
                        bvh: bvh
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });
    });

    return workerBuilder.build();
}
