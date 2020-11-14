import { GLSLCodeGenerator } from "../codegen/glsl/GLSLCodeGenerator.js";
import { genAttributeInputName } from "../codegen/glsl/genAttributeInputName.js";
import { genAttributeOutputName } from "../codegen/glsl/genAttributeOutputName.js";

/**
 * Fragment shader is there to satisfy requirement of 2 shaders to compile shader program in WebGL, in actuality it is unused
 * @type {string}
 */
const FRAGMENT_SHADER = [
    '#version 300 es',
    'precision lowp float;',

    'out vec4 fragColor;',

    'void main() {',
    '   fragColor = vec4(1.0, 1.0, 1.0, 1.0);',
    '}'
].join('\n');

function addLineNumbers( string ) {

    const lines = string.split( '\n' );

    for ( let i = 0; i < lines.length; i ++ ) {

        lines[ i ] = ( i + 1 ) + ': ' + lines[ i ];

    }

    return lines.join( '\n' );

}
/**
 *
 * @param {WebGLRenderingContext} gl
 * @param shader
 * @param type
 * @return {string}
 */
function getShaderErrors(gl, shader, type) {

    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    const log = gl.getShaderInfoLog(shader).trim();

    if (status && log === '') return '';

    // --enable-privileged-webgl-extension
    // console.log( '**' + type + '**', gl.getExtension( 'WEBGL_debug_shaders' ).getTranslatedShaderSource( shader ) );

    const source = gl.getShaderSource(shader);

    return 'THREE.WebGLShader: gl.getShaderInfoLog() ' + type + '\n' + log + addLineNumbers(source);

}

export class GLSLSimulationShader {

    constructor() {

        /**
         *
         * @type {String}
         * @private
         */
        this.__source = null;

        /**
         *
         * @type {WebGLProgram}
         * @private
         */
        this.__program = null;

        /**
         * Uniform location pointers from GL context. Order matches order of uniform specification array
         * @type {number[]}
         * @private
         */
        this.__uniform_locations = [];

        /**
         *
         * @type {ParticleAttributeSpecification[]}
         */
        this.attributes = [];

        /**
         *
         * @type {ParticleAttributeSpecification[]}
         */
        this.uniforms = [];

        /**
         *
         * @type {NodeGraph}
         */
        this.graph = null;
    }

    /**
     *
     * @param {NodeGraph} graph
     */
    setGraph(graph) {
        this.graph = graph;
    }

    /**
     *
     * @param {ParticleAttributeSpecification[]} attributes
     */
    setAttributes(attributes) {
        this.attributes = attributes;
    }

    /**
     *
     * @param {ParticleAttributeSpecification[]} attributes
     */
    setUniforms(attributes) {
        this.uniforms = attributes;
    }

    /**
     * @return {GLSLSimulationShader}
     * @param {NodeGraph} graph
     * @param {ParticleAttributeSpecification[]} attributes
     * @param {ParticleAttributeSpecification[]} uniforms
     */
    static from(graph, attributes = [], uniforms = []) {
        const r = new GLSLSimulationShader();

        r.setGraph(graph);
        r.setAttributes(attributes);
        r.setUniforms(uniforms);

        return r;
    }

    /**
     *
     * @return {String}
     */
    getSourceCode() {
        return this.__source;
    }

    build() {

        const gen = new GLSLCodeGenerator();

        const code = gen.generate(this.graph, this.attributes, this.uniforms);

        this.__source = code;
    }

    /**
     *
     * @param {WebGLRenderingContext} gl
     * @param {[]} uniform_values
     */
    bind(gl, uniform_values) {
        gl.useProgram(this.__program);

        // write uniforms
        const uniform_locations = this.__uniform_locations;
        const uniform_count = uniform_locations.length;

        for (let i = 0; i < uniform_count; i++) {
            const location = uniform_locations[i];

            // TODO support other uniform types
            gl.uniform1f(location, uniform_values[i]);
        }
    }

    /**
     *
     * @param {string} name
     * @return {number}
     * @private
     */
    __getUniformIndexByName(name) {
        return this.uniforms.findIndex(u => u.name === name);
    }

    /**
     *
     * @param {WebGLRenderingContext} gl
     * @private
     */
    __buildUniformPointers(gl) {
        const program = this.__program;

        // obtain uniform pointers
        const active_uniform_count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (let i = 0; i < active_uniform_count; i++) {
            /**
             *
             * @type {WebGLActiveInfo}
             */
            const uniform = gl.getActiveUniform(program, i);

            const name = uniform.name;

            const uniform_index = this.__getUniformIndexByName(name);

            if (uniform_index === -1) {
                throw new Error(`Uniform '${name}' not found`);
            }

            this.__uniform_locations[uniform_index] = gl.getUniformLocation(program, name);
        }
    }

    /**
     *
     * @param {WebGLRenderingContext} gl
     */
    compile(gl) {

        if (this.__source === null) {
            throw new Error('No shader source code, shader must be built before being compiled');
        }

        const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
        const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(vertex_shader, this.__source);
        gl.shaderSource(fragment_shader, FRAGMENT_SHADER);

        gl.compileShader(vertex_shader);
        if (!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)) {
            const error_message = getShaderErrors(gl, vertex_shader, 'VERTEX');

            // cleanup
            gl.deleteShader(vertex_shader);

            throw new Error(error_message);
        }

        gl.compileShader(fragment_shader);

        if (!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)) {
            const error_message = getShaderErrors(gl, fragment_shader, 'FRAGMENT');

            // cleanup
            gl.deleteShader(vertex_shader);
            gl.deleteShader(fragment_shader);

            throw new Error(error_message);
        }

        const program = gl.createProgram();


        gl.attachShader(program, vertex_shader);
        gl.attachShader(program, fragment_shader);

        // clean up allocated shaders, they are now part of the program and can be removed
        gl.deleteShader(vertex_shader);
        gl.deleteShader(fragment_shader);

        // bind attribute inputs
        for (let i = 0; i < this.attributes.length; i++) {
            const attribute = this.attributes[i];

            gl.bindAttribLocation(program, i, genAttributeInputName(attribute));
        }

        // bind outputs
        const output_names = this.attributes.map(genAttributeOutputName);

        // TODO use interleaved attributes instead for access speed
        gl.transformFeedbackVaryings(program, output_names, gl.SEPARATE_ATTRIBS);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

            const error_message = "Shader program failed to link" + gl.getProgramInfoLog(program);

            gl.deleteProgram(program);

            throw new Error(error_message);
        }

        this.__program = program;


        this.__buildUniformPointers(gl);
    }
}
