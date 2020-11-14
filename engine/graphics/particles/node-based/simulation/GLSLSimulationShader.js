import { GLSLCodeGenerator } from "../codegen/glsl/GLSLCodeGenerator.js";
import { genAttributeInputName } from "../codegen/glsl/genAttributeInputName.js";
import { genAttributeOutputName } from "../codegen/glsl/genAttributeOutputName.js";
import { getTypeByteSize } from "../codegen/glsl/getTypeByteSize.js";
import { GLDataBuffer } from "./GLDataBuffer.js";

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

/**
 *
 * @param {string} string
 * @return {string}
 */
function addLineNumbers(string) {

    const lines = string.split('\n');

    for (let i = 0; i < lines.length; i++) {

        lines[i] = (i + 1) + ': ' + lines[i];

    }

    return lines.join('\n');

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
         * How much space does a single vertex require
         * @type {number}
         * @private
         */
        this.__attribute_byte_size = 0;

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

        /**
         *
         * @type {WebGLTransformFeedback}
         * @private
         */
        this.__transform_feedback = null;

        /**
         *
         * @type {WebGLRenderingContext}
         * @private
         */
        this.__context = null;


        /**
         *
         * @type {GLDataBuffer}
         * @private
         */
        this.__output_buffer = new GLDataBuffer();
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
     * @param {NodeGraph} graph
     * @param {ParticleAttributeSpecification[]} attributes
     * @param {ParticleAttributeSpecification[]} uniforms
     * @returns {GLSLSimulationShader}
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

        // compute byte size for attribute set

        let offset = 0;
        for (let i = 0; i < this.attributes.length; i++) {
            const attribute = this.attributes[i];

            offset += getTypeByteSize(attribute.type);
        }

        this.__attribute_byte_size = offset;
    }

    /**
     *
     * @param {EmitterAttributeData} attribute_source
     * @private
     */
    __prepareOutputBuffer(attribute_source) {
        this.__output_buffer.resize(attribute_source.data.getSize());
    }

    /**
     *
     * @param {[]} uniform_values
     * @param {EmitterAttributeData} attributeSource
     */
    execute(uniform_values, attributeSource) {
        const gl = this.__context;

        gl.useProgram(this.__program);

        // write uniforms
        const uniform_locations = this.__uniform_locations;
        const uniform_count = uniform_locations.length;

        for (let i = 0; i < uniform_count; i++) {
            const location = uniform_locations[i];

            // TODO support other uniform types
            gl.uniform1f(location, uniform_values[i]);
        }

        // bind attributes
        const attributes = this.attributes;
        const attribute_count = attributes.length;

        let offset = 0;

        for (let i = 0; i < attribute_count; i++) {
            const attribute = attributes[i];

            const size = getTypeByteSize(attribute.type);

            gl.enableVertexAttribArray(i);
            gl.bindBuffer(gl.ARRAY_BUFFER, attributeSource.data.gl_buffer_f32);
            gl.vertexAttribPointer(i, 4, gl.FLOAT, false, this.__attribute_byte_size, offset);

            offset += size;
        }

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.__transform_feedback);

        this.__prepareOutputBuffer(attributeSource);

        // bind target buffer
        gl.bindBufferRange(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.__output_buffer.gl_buffer_f32, 0, attributeSource.count * this.__attribute_byte_size);

        //
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);

        gl.drawArrays(gl.POINTS, 0, attributeSource.count);

        gl.endTransformFeedback();
        gl.disable(gl.RASTERIZER_DISCARD);

        // Unbind the transform feedback buffer so subsequent attempts
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);

        // unbind transform feedback
        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

        this.__copyFromOutput(attributeSource);
    }

    /**
     * GL context uses it's own internal buffers that are not shared with JS context, because of this - it is necessary to copy data out
     * @param {EmitterAttributeData} target
     * @private
     */
    __copyFromOutput(target) {
        /**
         *
         * @type {WebGLRenderingContext}
         */
        const gl = this.__context;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.__output_buffer.gl_buffer_f32);
        gl.getBufferSubData(gl.ARRAY_BUFFER, 0, target.data.data_f32);
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

    dispose() {
        if (this.__program !== null) {
            this.__context.deleteProgram(this.__program);

            this.__program = null;
            this.__context = null;
        }

        this.__output_buffer.dispose();
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

        // We use interleaved attributes for cache coherence
        gl.transformFeedbackVaryings(program, output_names, gl.INTERLEAVED_ATTRIBS);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

            const error_message = "Shader program failed to link" + gl.getProgramInfoLog(program);

            gl.deleteProgram(program);

            throw new Error(error_message);
        }

        this.__context = gl;
        this.__program = program;


        this.__buildUniformPointers(gl);

        this.__output_buffer.initialize(gl);

        this.__transform_feedback = gl.createTransformFeedback();
    }
}
