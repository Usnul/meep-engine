/**
 *
 * @param {ParticleAttributeSpecification} attribute
 * @return {string}
 */
export function genAttributeInputName(attribute){
    return `in_${attribute.name}`;
}
