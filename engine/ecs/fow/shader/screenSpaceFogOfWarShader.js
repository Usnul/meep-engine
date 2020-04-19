import { Matrix4, NormalBlending, ShaderMaterial, Vector2, Vector4 } from "three";

/**
 Shader for drawing fog of war as a screen-space post-process effect
 @returns {ShaderMaterial}
 */
export function buildScreenSpaceFogOfWarShader() {
    function vertexShader() {
        return `        
        varying vec2 vUv;

        void main() {

            vUv = uv;
                
            gl_Position = vec4( (uv - 0.5)*2.0, 0.0, 1.0 );
            
        }`;
    }

    function fragmentShader() {
        return `
        #include <packing>
        uniform sampler2D tDepth;
        uniform sampler2D tFog; 
        uniform vec4 uFogUvTransform;
        
        uniform mat4 uProjectionInverse;
        uniform mat4 uViewInverse;
        uniform vec2 uResolution;
                
        uniform vec4 uColor;
        
        varying vec2 vUv;
        
        const float   c_samplesX    = 7.0;
        const float   c_samplesY    = 7.0;

        const float   c_halfSamplesX = c_samplesX / 2.0;
        const float   c_halfSamplesY = c_samplesY / 2.0;
        
        const vec2 sigma = vec2(23.0, 23.0);
        
        const vec2 sigma2_sq = sigma*sigma*2.0;
        
        const float radius = 0.9;
        
        const vec2 samplingBias = vec2(c_halfSamplesX,c_halfSamplesY)/ vec2( radius );
        
	     vec3 computeWorldPosition(){
                // Convert screen coordinates to normalized device coordinates (NDC)
                
                float normalizedDepth = texture2D( tDepth, vUv).x ; 
                
                vec4 ndc = vec4(
                    (vUv.x - 0.5) * 2.0,
                    (vUv.y - 0.5) * 2.0,
                    (normalizedDepth - 0.5) * 2.0,
                    1.0);
                
                vec4 clip = uProjectionInverse * ndc;
                vec3 result = (uViewInverse* (clip / clip.w) ).xyz;
                
                return result;
	     }
	     
	     
	     float sampleFog(const in vec2 uv){
	       return texture2D( tFog, uv ).r;
	     }
	     
	     float Gaussian(float sigma2_sq, float x){
           return exp(-(x*x) / sigma2_sq);
         }
	     
	     float getFog(const in vec2 uv){
	        
	        vec2 texelSize = samplingBias * uResolution;
	     
			float total = 0.0;
            
            float ret = 0.0;

            for (float iy = 0.0; iy < c_samplesY; ++iy){
            
                float fy = Gaussian(sigma2_sq.y, iy - c_halfSamplesY);
                float offsety = (iy-c_halfSamplesY) / texelSize.y;
                
                for (float ix = 0.0; ix < c_samplesX; ++ix){
                
                    float fx = Gaussian(sigma2_sq.x, ix - c_halfSamplesX);
                    float offsetx = (ix-c_halfSamplesX) / texelSize.x;
                    
                    float weight = fx * fy;
                    
                    total += weight;
                    
                    ret += texture2D(tFog, uv + vec2(offsetx, offsety)).x * weight;
                }
            }
            
            return ret / total;
	     }
	     	        
        void main(){
                //get world fragment position
                vec3 worldPosition = computeWorldPosition();
                
                vec2 fogUv = worldPosition.xz * uFogUvTransform.zw + uFogUvTransform.xy;
                
                float fogValue = getFog( fogUv );
                
                gl_FragColor = vec4(1.0, 1.0, 1.0, fogValue) * uColor;
        }
        `;
    }

    const uniforms = {
        tFog: {
            type: 't',
            /**
             * @type {Texture}
             */
            value: null
        },
        tDepth: {
            type: 't',
            /**
             * @type {Texture}
             */
            value: null
        },
        uViewInverse: { type: 'm4', value: new Matrix4() },
        uProjectionInverse: { type: 'm4', value: new Matrix4() },
        uColor: { type: 'c', value: new Vector4(0, 0, 0, 1) },
        uFogUvTransform: { type: 'v4', value: new Vector4(0, 0, 1, 1) },
        uResolution: { type: 'v2', value: new Vector2(0, 0) }
    };

    const material = new ShaderMaterial({
        uniforms,
        vertexShader: vertexShader(),
        fragmentShader: fragmentShader(),
        blending: NormalBlending,
        lights: false,
        fog: false,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        vertexColors: false,
        extensions: {}
    });

    return material;
}
