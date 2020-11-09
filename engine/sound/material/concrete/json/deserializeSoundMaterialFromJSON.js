import { RandomSoundMaterial } from "../RandomSoundMaterial.js";
import { SingleSoundMaterial } from "../SingleSoundMaterial.js";
import { SoundMaterialComposition } from "../SoundMaterialComposition.js";


/**
 *
 * @param {string} type
 * @param {*} data
 * @return {AbstractSoundMaterialDefinition}
 */
export function deserializeSoundMaterialFromJSON({ type, data }) {
    let instance;
    switch (type) {
        case RandomSoundMaterial.typeName:
            instance = new RandomSoundMaterial();
            break;
        case SingleSoundMaterial.typeName:
            instance = new SingleSoundMaterial();
            break;
        case SoundMaterialComposition.typeName:
            instance = new SoundMaterialComposition();
            break;
        default:
            throw new Error(`Unsupported material type '${type}'`);
    }

    instance.fromJSON(data);

    return instance;
}
