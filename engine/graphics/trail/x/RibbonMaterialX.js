import { ShaderMaterial, Vector2 } from "three";

const vertexShader = `
    varying vec2 vUv;
    varying vec4 vColor;

    attribute float thickness;
    attribute vec3 previous, next;
    attribute float off;
    attribute vec3 color;
    attribute float uv_offset;
    attribute float age;
    attribute float alpha;

    uniform vec2 resolution;
    uniform float maxAge;
    uniform float time;
    
    float pi = 3.141592653589793;

    vec4 transform(vec3 coord){
        return projectionMatrix * modelViewMatrix * vec4(coord, 1.0);
    }

    vec2 project(vec4 device){
        vec3 device_normal = device.xyz/device.w;
        vec2 clip_pos = (device_normal*0.5+0.5).xy;
        return clip_pos * resolution;
    }

    vec4 unproject(vec2 screen, float z, float w){
        vec2 clip_pos = screen/resolution;
        vec2 device_normal = clip_pos*2.0-1.0;
        return vec4(device_normal*w, z, w);
    }

    float estimateScale(vec3 position, vec2 sPosition){
        vec4 view_pos = modelViewMatrix * vec4(position, 1.0);
        float halfWidth = thickness*0.5;
        vec4 scale_pos = view_pos - vec4(normalize(view_pos.xy)*halfWidth, 0.0, 0.0);
        vec2 screen_scale_pos = project(projectionMatrix * scale_pos);
        return distance(sPosition, screen_scale_pos);
    }

    float curvatureCorrection(vec2 a, vec2 b){
        float p = a.x*b.y - a.y*b.x;
        float c = atan(p, dot(a,b))/pi;
        return clamp(c, -1.0, 1.0);
    }

    void main(){
        vec2 sLast = project(transform(previous.xyz));
        vec2 sNext = project(transform(next.xyz));

        vec4 dCurrent = transform(position.xyz);
        vec2 sCurrent = project(dCurrent);

        vec2 normal1 = normalize(sLast - sCurrent);
        vec2 normal2 = normalize(sCurrent - sNext);
        
        vec2 normal = (normal1 + normal2)*0.5;
        
        float offset_signed = off*2.0 - 1.0;
        
        vUv = vec2(uv_offset*0.7, offset_signed*0.5+0.5);
        
        float relativeAge = clamp(age/maxAge, 0.0, 1.0);
        
        vColor = vec4(color/ 255.0, alpha);       
        
        vec2 dir =  vec2(normal.y, -normal.x) * offset_signed;
        
        float comp = length(normal);
        
        dir*= 1.0/ (comp*comp);
        
        float scale = estimateScale(position.xyz, sCurrent);
        
        vec2 pos = sCurrent + dir*scale;

        gl_Position = unproject(pos, dCurrent.z, dCurrent.w);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    varying vec4 vColor;

    uniform sampler2D uTexture;
    
    void main(){
        vec4 diffuseColor = vColor;
        
        #ifdef USE_TEXTURE
            vec4 texel = texture2D(uTexture, vUv);
            diffuseColor *= texel;
        #endif
        
        gl_FragColor = diffuseColor;
        // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;

export class RibbonMaterialX extends ShaderMaterial {
    constructor(params) {
        super({
            fragmentShader,
            vertexShader,
            uniforms: {
                resolution: {
                    value: new Vector2(120, 600)
                }
            }
        });

        this.setValues(params);
    }

    set resolution(v2) {
        this.uniforms.resolution.value.set(v2.x, v2.y);
    }

    get resolution() {
        return this.uniforms.resolution.value;
    }
}
