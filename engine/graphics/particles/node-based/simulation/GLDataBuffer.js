export class GLDataBuffer {
    constructor() {
        /**
         *
         * @type {Float32Array}
         */
        this.data_f32 = new Float32Array(0);

        /**
         *
         * @type {WebGLBuffer}
         */
        this.gl_buffer_f32 = null;

        /**
         *
         * @type {WebGLRenderingContext}
         * @private
         */
        this.__context = null;

        /**
         *
         * @type {number}
         * @private
         */
        this.__size = 0;
    }

    /**
     *
     * @param {number} size
     * @return {GLDataBuffer}
     */
    static float32(size) {
        const r = new GLDataBuffer();

        r.data_f32 = new Float32Array(size);
        r.__size = size;

        return r;
    }

    /**
     *
     * @param {WebGLRenderingContext} gl
     */
    initialize(gl) {
        this.__context = gl;

        const buffer = gl.createBuffer();

        this.gl_buffer_f32 = buffer;

        this.write();
    }

    /**
     *
     * @return {number}
     */
    getSize() {
        return this.__size;
    }

    /**
     *
     * @param {number} size
     */
    resize(size) {
        if (this.__size === size) {
            // do nothing
            return;
        }

        this.data_f32 = new Float32Array(size);
        this.__size = size;

        const gl = this.__context;

        if (gl !== null) {
            this.write();
        }

    }

    write() {
        const gl = this.__context;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.gl_buffer_f32);
        gl.bufferData(gl.ARRAY_BUFFER, this.data_f32, gl.DYNAMIC_COPY);

        // unbind buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    read(target){

    }

    dispose() {
        throw new Error('NIY');
    }

}
