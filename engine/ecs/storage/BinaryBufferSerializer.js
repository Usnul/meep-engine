import { SerializationFlags, SerializationMetadata } from "../components/SerializationMetadata.js";
import { assert } from "../../../core/assert.js";
import { BinaryCollectionSerializer } from "./binary/collection/BinaryCollectionSerializer.js";
import { COMPONENT_SERIALIZATION_TRANSIENT_FIELD } from "./COMPONENT_SERIALIZATION_TRANSIENT_FIELD.js";
import { currentTimeInSeconds } from "../../Clock.js";


class BinaryBufferSerialization {
    constructor() {
        /**
         *
         * @type {BinarySerializationRegistry}
         */
        this.registry = null;
    }

    /**
     *
     * @param {EntityComponentDataset} dataset
     * @param {BinaryBuffer} buffer
     */
    process(buffer, dataset) {

        console.groupCollapsed('Serialization');
        console.time('serializing');

        const smComponentIndex = dataset.computeComponentTypeIndex(SerializationMetadata);

        const serializableComponentTypes = dataset.getComponentTypeMap().filter(function (componentClass) {
            return componentClass.serializable !== false;
        });

        const numSerializableTypes = serializableComponentTypes.length;

        const typeCountAddress = buffer.position;

        buffer.writeUint32(numSerializableTypes);

        const collectionSerializer = new BinaryCollectionSerializer();

        collectionSerializer.setRegistry(this.registry);
        collectionSerializer.setBuffer(buffer);


        let numTypesWritten = 0;

        let i;

        for (i = 0; i < numSerializableTypes; i++) {

            const componentType = serializableComponentTypes[i];

            const positionComponentsStart = buffer.position;

            const className = componentType.typeName;


            collectionSerializer.setClass(className);
            collectionSerializer.initialize();

            const __start_time = currentTimeInSeconds();

            let lastEntity = 0;

            dataset.traverseComponents(componentType, function (componentInstance, entity) {
                if (isEntityTransient(entity, dataset, smComponentIndex, componentInstance)) {
                    //skip
                    return;
                }

                assert.ok(entity >= lastEntity, `entity(=${entity}) < lastEntity(=${lastEntity})`)

                //write only the entity step
                const step = entity - lastEntity;

                lastEntity = entity;

                collectionSerializer.write(step, componentInstance);
            });

            const numComponentsWritten = collectionSerializer.getElementCount();

            const __end_time = currentTimeInSeconds();

            collectionSerializer.finalize();

            if (numComponentsWritten > 0) {
                numTypesWritten++;

                const currentPosition = buffer.position;

                //print size of the component set
                const componentsByteSize = currentPosition - positionComponentsStart;
                console.log(`Component ${componentType.typeName} written. Count: ${numComponentsWritten}, Bytes: ${componentsByteSize}, Bytes/component: ${Math.ceil(componentsByteSize / numComponentsWritten)}. Time taken: ${((__end_time - __start_time) * 1000).toFixed(2)}ms`);
            } else {
                //no elements written, lets re-wind to skip the type
                buffer.position = positionComponentsStart;
            }
        }

        //go back and patch actual number of written classes
        const p = buffer.position;

        buffer.position = typeCountAddress;
        buffer.writeUint32(numTypesWritten);

        //restore position
        buffer.position = p;

        console.timeEnd('serializing');
        console.groupEnd();
    }
}

/**
 * Whether or not an entity should be serialized at all
 * @param {number} entity
 * @param {EntityComponentDataset} dataset
 * @param {number} smComponentIndex
 * @param {Object} componentInstance
 * @returns {boolean}
 */
function isEntityTransient(entity, dataset, smComponentIndex, componentInstance) {
    if (smComponentIndex === -1) {
        return false;
    }

    //check component instance flag
    if (componentInstance[COMPONENT_SERIALIZATION_TRANSIENT_FIELD] === true) {
        return true;
    }


    /**
     *
     * @type {SerializationMetadata}
     */
    const serializationMetadata = dataset.getComponentByIndex(entity, smComponentIndex);

    if (serializationMetadata === undefined) {
        return false;
    }

    const isTransient = serializationMetadata.getFlag(SerializationFlags.Transient);

    return isTransient;
}

export default BinaryBufferSerialization;
