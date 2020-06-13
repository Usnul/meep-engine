import {
    ClampToEdgeWrapping,
    Color,
    DataTexture,
    LinearFilter,
    Mesh, MeshBasicMaterial,
    NearestFilter,
    Object3D,
    OrthographicCamera,
    PlaneBufferGeometry,
    RedFormat,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    UnsignedByteType,
    WebGLRenderTarget
} from "three";
import { Sampler2D } from "../../texture/sampler/Sampler2D.js";
import convertSampler2D2Canvas from "../../texture/sampler/Sampler2D2Canvas.js";
import { makeHighlightDecodeShader } from "./HighlightDecodeShader.js";

const material_id_fragment_shader = `
uniform float id;
void main(){
    gl_FragColor = vec4(id / 255.0, 0.0, 0.0, 1.0);
}
`;

const material_id_unskinned = new ShaderMaterial({
    uniforms: {
        id: { value: 0 }
    },
    vertexShader: `
    void main()
    {
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
    }
`,
    fragmentShader: material_id_fragment_shader
});


const material_id_skinned = new ShaderMaterial({
    uniforms: {
        id: { value: 0 }
    },
    vertexShader: `
    #include <common>
    #include <uv_pars_vertex>
    #include <displacementmap_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>

    void main()
    {
        #include <uv_vertex>
        #include <skinbase_vertex>
        #ifdef USE_DISPLACEMENTMAP
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <skinnormal_vertex>
        #endif
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <displacementmap_vertex>
        #include <project_vertex>
        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>
    }
`,
    fragmentShader: material_id_fragment_shader
});
material_id_skinned.skinning = true;


const PARAMETER_COUNT = 5;
const PARAMETER_PER_OBJECT_SLOTS = 4;
const OBJECT_MAX_COUNT = 256;


const tempColor = new Color();

export class OutlineRenderer {

    /**
     *
     * @param {WebGLRenderer} renderer
     * @param {Scene} scene
     * @constructor
     */
    constructor(renderer, scene) {

        /**
         *
         * @type {WebGLRenderer}
         */
        this.renderer = renderer;

        /**
         *
         * @type {Camera}
         */
        this.camera = null;

        /**
         *
         * @type {Scene}
         */
        this.scene = scene;

        /**
         *
         * @type {HighlightRenderGroup}
         * @private
         */
        this.__current_group = null;

        this.__ss_camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.__ss_scene = new Scene();

        this.__material_decode = makeHighlightDecodeShader();

        this.__ss_mesh = new Mesh(new PlaneBufferGeometry(2, 2, 1, 1), this.__material_decode);
        this.__ss_scene.add(this.__ss_mesh);

        this.__id_scene = new Scene();

        //
        const virtual_trigger_group = new Mesh(new PlaneBufferGeometry(0, 0), new MeshBasicMaterial());
        virtual_trigger_group.frustumCulled = false;


        /*
        Three.js allows immediate rendering mode, but it assumes that this is done during scene rendering, so we create a proxy object to piggy back on via onBeforeRender callback
         */
        this.__id_scene.add(virtual_trigger_group);
        virtual_trigger_group.onBeforeRender = () => {
            const group = this.__current_group;
            const elementList = group.elements;

            const n = elementList.length;
            for (let i = 0; i < n; i++) {
                const renderElement = elementList.get(i);

                const object = renderElement.object;

                material_id_skinned.uniforms.id.value = i;
                material_id_unskinned.uniforms.id.value = i;

                //force uniforms to be updated
                material_id_unskinned.uniformsNeedUpdate = true;
                material_id_skinned.uniformsNeedUpdate = true;

                this.renderObjectId(object);
            }
        }


        this.isTargetClear = false;

        this.__textureParametersColor = new DataTexture(
            new Uint8Array(4 * OBJECT_MAX_COUNT),
            1,
            OBJECT_MAX_COUNT,
            RGBAFormat,
            UnsignedByteType
        );
        this.__textureParametersColor.wrapT = ClampToEdgeWrapping;
        this.__textureParametersColor.wrapS = ClampToEdgeWrapping;

        this.__textureParametersColor.minFilter = NearestFilter;
        this.__textureParametersColor.magFilter = NearestFilter;

        this.__textureParametersColor.generateMipmaps = false;

        this.__renderTargetObjectId = new WebGLRenderTarget(1, 1, {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RedFormat,
            depthBuffer: true,
            stencilBuffer: false,
            generateMipmaps: false
        });

        this.__renderTargetFinal = new WebGLRenderTarget(1, 1, {
            format: RGBAFormat,
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            depthBuffer: false,
            stencilBuffer: false,
            generateMipmaps: false
        });


        this.__material_decode.uniforms.tObjects.value = this.__renderTargetObjectId.texture;
        this.__material_decode.uniforms.tParameters.value = this.__textureParametersColor;
    }

    resize(x, y) {
        this.isTargetClear = false;
        this.clearRenderTarget();

        this.__renderTargetObjectId.setSize(x, y);
        this.__renderTargetFinal.setSize(x, y);
        this.__material_decode.uniforms.resolution.value.set(x, y);
    }

    /**
     *
     * @param {PerspectiveCamera|OrthographicCamera} camera
     */
    setCamera(camera) {
        this.camera = camera;
    }


    /**
     *
     * @param {HighlightRenderGroup} group
     */
    renderObjectIDs(group) {
        this.__current_group = group;

        this.renderer.setRenderTarget(this.__renderTargetObjectId);

        tempColor.copy(this.renderer.getClearColor());

        const __clearAlpha = this.renderer.getClearAlpha();

        this.renderer.setClearColor(0xFFFFFF, 1);

        this.renderer.clearDepth();
        this.renderer.clearColor();


        try {
            this.renderer.render(this.__id_scene, this.camera);
        } catch (e) {
            console.warn(e);
        }


        this.renderer.setClearColor(tempColor);
        this.renderer.setClearAlpha(__clearAlpha);


        this.renderer.setRenderTarget(null);

    }

    debugObjectIDs() {

        const s = Sampler2D.uint8(4, this.__renderTargetObjectId.width, this.__renderTargetObjectId.height);

        this.renderer.readRenderTargetPixels(this.__renderTargetObjectId, 0, 0, this.__renderTargetObjectId.width, this.__renderTargetObjectId.height, s);


        const htmlCanvasElement = convertSampler2D2Canvas(s, 1, 0);

        htmlCanvasElement.style.zIndex = 10000;
        htmlCanvasElement.style.position = "absolute";

        document.body.appendChild(htmlCanvasElement);
    }

    /**
     *
     * @param {Object3D} object
     */
    renderObjectId(object) {
        if (object.isMesh || object.isSkinnedMesh) {

            const geometry = object.geometry;

            if (geometry === undefined) {
                return;
            }

            if (object.isSkinnedMesh) {

                this.renderer.renderBufferDirect(this.camera, null, geometry, material_id_skinned, object, null);

            } else {
                this.renderer.renderBufferDirect(this.camera, null, geometry, material_id_unskinned, object, null);
            }

        }

        const children = object.children;

        const childCount = children.length;

        for (let i = 0; i < childCount; i++) {
            const child = children[i];

            this.renderObjectId(child);
        }
    }

    /**
     * Requires object ID texture as input, produces rendering of outlines
     */
    renderMainPass() {
        const renderer = this.renderer;

        renderer.setRenderTarget(this.__renderTargetFinal);

        //record state
        const __autoClear = renderer.autoClear;
        const __clearAlpha = renderer.getClearAlpha();

        renderer.setClearAlpha(0);
        renderer.autoClear = false;

        renderer.clearColor();

        renderer.render(this.__ss_scene, this.__ss_camera);

        //restore state
        renderer.autoClear = __autoClear;
        renderer.setClearAlpha(__clearAlpha);

        renderer.setRenderTarget(null);
    }

    /**
     *
     * @param {HighlightRenderGroup} group
     */
    writeParameters(group) {
        const elements = group.elements;
        const n = elements.length;


        const dataTexture = this.__textureParametersColor;
        /**
         *
         * @type {Uint8ClampedArray}
         */
        const parameterData = dataTexture.image.data;

        for (let i = 0; i < n; i++) {
            /**
             *
             * @type {HighlightRenderElement}
             */
            const renderElement = elements.get(i);

            renderElement.merge();

            const objectOffset = i * 4;

            const def = renderElement.merged;


            parameterData[objectOffset + 0] = def.color.r * 255;
            parameterData[objectOffset + 1] = def.color.g * 255;
            parameterData[objectOffset + 2] = def.color.b * 255;
            parameterData[objectOffset + 3] = def.opacity * 255;

        }

        dataTexture.needsUpdate = true;
    }


    /**
     *
     * @param {HighlightRenderGroup} group
     */
    render(group) {
        this.writeParameters(group);
        this.renderObjectIDs(group);
        this.renderMainPass();

        this.isTargetClear = false;
    }

    clearRenderTarget() {
        if (!this.isTargetClear) {
            const renderer = this.renderer;

            const oldRenderTarget = renderer.getRenderTarget();

            renderer.setRenderTarget(this.__renderTargetFinal);
            renderer.clearColor();

            //clear render target
            renderer.setRenderTarget(oldRenderTarget);

            this.isTargetClear = true;
        }
    }
}
