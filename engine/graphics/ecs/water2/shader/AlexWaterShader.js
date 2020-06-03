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
uniform vec3 shoreColor;

uniform float fScattering;

uniform sampler2D tHeightTexture;
uniform sampler2D tDepthTexture;

uniform vec2 vHeightTextureResolution;

uniform vec2 vScreenResolution;

uniform float fCameraNear;
uniform float fCameraFar;

uniform vec4 vHeightUv;

uniform float time;

uniform float fWaveAmplitude;
uniform float fWaveSpeed;

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

vec4 blur9(sampler2D image, vec2 uv, vec2 texelSize, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3846153846) * direction;
  vec2 off2 = vec2(3.2307692308) * direction;
  color += texture2D(image, uv) * 0.2270270270;
  color += texture2D(image, uv + (off1 * texelSize )) * 0.3162162162;
  color += texture2D(image, uv - (off1 * texelSize )) * 0.3162162162;
  color += texture2D(image, uv + (off2 * texelSize )) * 0.0702702703;
  color += texture2D(image, uv - (off2 * texelSize )) * 0.0702702703;
  return color;
}

vec4 blur13(sampler2D image, vec2 uv, vec2 texelSize, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.411764705882353) * direction;
  vec2 off2 = vec2(3.2941176470588234) * direction;
  vec2 off3 = vec2(5.176470588235294) * direction;
  color += texture2D(image, uv) * 0.1964825501511404;
  color += texture2D(image, uv + (off1 * texelSize)) * 0.2969069646728344;
  color += texture2D(image, uv - (off1 * texelSize)) * 0.2969069646728344;
  color += texture2D(image, uv + (off2 * texelSize)) * 0.09447039785044732;
  color += texture2D(image, uv - (off2 * texelSize)) * 0.09447039785044732;
  color += texture2D(image, uv + (off3 * texelSize)) * 0.010381362401148057;
  color += texture2D(image, uv - (off3 * texelSize)) * 0.010381362401148057;
  return color;
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
    
    float height = blur13( tHeightTexture, depthUV, 1.0 / vHeightTextureResolution, vec2(1.0) ).r;
    
    float depth = level - height;
    
    float geoHash = (depthUV.x+ depthUV.y)*313.123;
    
    float waveHeightModifier = sin(geoHash + time*fWaveSpeed) / 3.14159265359;
    
    float waveHeight = depth + fWaveAmplitude * waveHeightModifier;
    
    float deepColorFactor = smoothstep(0.7, 2.0, waveHeight);
    
    vec4 color = mix(
        vec4(shoreColor, 0.8), 
        vec4(waterColor, 1.0), 
        deepColorFactor
    );
    
    //this simulates scattering under water
    float fogAmount = 1.0 - exp( - viewDepth * fScattering );

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
        vHeightTextureResolution: {
            type: 'v2',
            value: new Vector2()
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
        },
        shoreColor: {
            type: 'c',
            value: new Color(0x95cad9)
        },
        fWaveSpeed: {
            type: 'f',
            value: 1.8,
        },
        fScattering: {
            type: 'f',
            value: 1.2
        },
        fWaveAmplitude: {
            type: 'f',
            value: 0.3
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
