/**
 *
 * @param {ParticleAttributeSpecification} attribute
 * @return {string}
 */
export function genAttributeOutputName(attribute) {
    return `out_${attribute.name}`;
}
