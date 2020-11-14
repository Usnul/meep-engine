import { ParticleAttributeSpecification } from "./ParticleAttributeSpecification.js";
import { ParticleDataTypes } from "../nodes/ParticleDataTypes.js";

export const GeometryAttributes = {
    Color: ParticleAttributeSpecification.from('color', ParticleDataTypes.Vector4),
    Position: ParticleAttributeSpecification.from('position', ParticleDataTypes.Vector3),
    Rotation: ParticleAttributeSpecification.from('rotation', ParticleDataTypes.Vector4),
    Scale: ParticleAttributeSpecification.from('scale', ParticleDataTypes.Float),
    Age: ParticleAttributeSpecification.from('age', ParticleDataTypes.Float)
}
