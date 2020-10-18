import { GameAssetType } from "../asset/GameAssetType.js";
import BinaryBufferDeSerializer from "../ecs/storage/BinaryBufferDeSerializer.js";
import { EncodingBinaryBuffer } from "../../core/binary/EncodingBinaryBuffer.js";
import { emptyTask } from "../../core/process/task/TaskUtils.js";
import { assert } from "../../core/assert.js";
import { MirScene } from "../../../model/game/scenes/MirScene.js";

/**
 *
 * @param {string} path
 * @param {EntityComponentDataset} ecd
 * @param {Engine} engine
 * @returns {Promise}
 */
export function loadSerializedScene(path, ecd, engine) {
    const assetManager = engine.assetManager;

    return assetManager.promise(path, GameAssetType.ArrayBuffer)
        .then(asset => {

            /**
             *
             * @type {ArrayBuffer}
             */
            const buffer = asset.create();

            const deSerializer = new BinaryBufferDeSerializer();
            deSerializer.registry = engine.binarySerializationRegistry;

            const binaryBuffer = new EncodingBinaryBuffer();

            binaryBuffer.fromArrayBuffer(buffer);

            const task = deSerializer.process(binaryBuffer, engine, ecd);

            engine.executor.run(task);

            return task.promise();
        });
}

export class SerializedScene extends MirScene {
    /**
     *
     * @param {string} name Unique scene name
     * @param {string} path Path to serialized scene
     */
    constructor({ name, path }) {
        super(name);

        this.path = path;
    }


    setup(options, engine, success, failure) {
        assert.typeOf(success, 'function', 'success');
        assert.typeOf(failure, 'function', 'failure');

        this.__engine = engine;

        const ecd = this.dataset;

        //expand dataset to make sure it can take all components
        ecd.setComponentTypeMap(engine.entityManager.getComponentTypeMap());

        loadSerializedScene(this.path, ecd, engine).then(success, failure);

        return emptyTask();
    }
}
