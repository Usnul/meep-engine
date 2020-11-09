export function serializeSoundMaterialToJSON(material) {
    return {
        type: material.__proto__.typeName,
        data: material.toJSON()
    };
}
