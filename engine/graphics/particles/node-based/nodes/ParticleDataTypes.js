import { DataType } from "../../../../../core/model/node-graph/DataType.js";

export const ParticleDataTypes = {
    Void: DataType.from(5, 'void'),
    Float: DataType.from(0, 'float'),
    Vector2: DataType.from(1, 'vec2'),
    Vector3: DataType.from(2, 'vec3'),
    Vector4: DataType.from(3, 'vec4'),
    Color: DataType.from(4, 'color'),
}
