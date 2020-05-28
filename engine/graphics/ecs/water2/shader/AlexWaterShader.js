import { Color, NormalBlending, ShaderMaterial, Vector2, Vector4 } from "three";

const vs = `

varying vec2 vUv; 
varying float level;

void main(){

    vUv = uv;
   
    level = (modelMatrix * vec4(position, 1.0)).y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const fs = `
uniform vec3 waterColor;
uniform sampler2D tHeightTexture;
uniform sampler2D tDepthTexture;

uniform vec2 vScreenResolution;

uniform float fCameraNear;
uniform float fCameraFar;

uniform vec4 vHeightUv;

varying vec2 vUv;
varying float level;

float depthToLinear( float z, float cameraNear, float cameraFar ) {
    float z_n = 2.0 * z - 1.0;
    
    float z_e = 2.0 * cameraNear * cameraFar / (cameraFar + cameraNear - z_n * (cameraFar - cameraNear));

    return z_e;
}
	        
vec4 sampleTextureGaussian( sampler2D tex,vec2 uv, vec2 texelSize){
    float r = 1.0;
    
    float dx0 = - texelSize.x * r;
    float dy0 = - texelSize.y * r;
    float dx1 = + texelSize.x * r;
    float dy1 = + texelSize.y * r;
    
    return (
        texture2D(tex, uv + vec2( dx0, dy0 ) ) +
        texture2D(tex, uv + vec2( 0.0, dy0 ) ) +
        texture2D(tex, uv + vec2( dx1, dy0 ) ) +
        texture2D(tex, uv + vec2( dx0, 0.0 ) ) +
        texture2D(tex, uv) +
        texture2D(tex, uv + vec2( dx1, 0.0 ) ) +
        texture2D(tex, uv + vec2( dx0, dy1 ) ) +
        texture2D(tex, uv + vec2( 0.0, dy1 ) ) +
        texture2D(tex, uv + vec2( dx1, dy1 ) )
    ) * ( 1.0 / 9.0 );
}
        
void main(){

    //compute view depth
    float screenEnvDepth = texture2D(tDepthTexture, gl_FragCoord.xy / vScreenResolution ).x;
    
    float screenEnvDepthLinear = depthToLinear(screenEnvDepth, fCameraNear, fCameraFar);
    
    float objectDepth = gl_FragCoord.z;
    
    float objectDepthLinear = depthToLinear(objectDepth, fCameraNear, fCameraFar);

    float viewDepth = screenEnvDepthLinear - objectDepthLinear;
    
    if(viewDepth < 0.0){
        discard;
    }
    
    //sample water depth relative to the sky
    vec2 depthUV = (vUv + vHeightUv.xy) * vHeightUv.zw;
    
    float height = texture2D(tHeightTexture, depthUV).r;
    
    float depth = level - height;
    
    vec4 shoreColor = vec4(0.219, 0.474, 0.572, 1.0);
    
    vec4 color = mix(
        shoreColor, 
        vec4(waterColor,1.0), 
        smoothstep(0.5, 1.5, depth)
    );
    
    //this simulates scattering under water
    float fogAmount = 1.0 - exp(-viewDepth);

    gl_FragColor = color;
    
    gl_FragColor.a *= fogAmount;
}
`;

/**
 *
 * @returns {ShaderMaterial}
 */
export function makeAlexWaterMaterial() {
    const uniforms = {
        time: {
            type: 'f',
            value: 0
        },
        fCameraNear: {
            type: 'f',
            value: 0
        },
        fCameraFar: {
            type: 'f',
            value: 0
        },
        vHeightUv: {
            type: 'v4',
            value: new Vector4()
        },
        tHeightTexture: {
            type: 't',
            value: null
        },
        tDepthTexture: {
            type: 't',
            value: null
        },
        vScreenResolution: {
            type: 'v2',
            value: new Vector2()
        },
        waterColor: {
            type: 'c',
            value: new Color()
        }
    };

    const material = new ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        uniforms,
        blending: NormalBlending,
        lights: false,
        fog: false,
        depthTest: true,
        transparent: true,
        vertexColors: false
    });

    return material;
}
