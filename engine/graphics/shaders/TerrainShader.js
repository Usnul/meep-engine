/**
 * Created by Alex on 22/06/2015.
 */

import ShaderChunks from './lib/ShaderChunks.js';

function vertex() {
    return `
    #version 300 es
    
    #define PHYSICAL
    #define STANDARD
    
    uniform vec2 gridResolution;
    
    uniform vec4 uGridTransform;
    
    varying vec3 vViewPosition;
    varying vec2 vGridPosition;
    
    #ifndef FLAT_SHADED
        varying vec3 vNormal;
    #endif
    
    varying vec2 vUv;
    varying vec2 vUvGrid;
    uniform vec4 offsetRepeat;
    
    #include <common>
    #include <uv_pars_vertex>
    #include <uv2_pars_vertex>
    #include <color_pars_vertex>
    #include <fog_pars_vertex>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>
    #include <clipping_planes_pars_vertex>
    
    ${ShaderChunks.clouds_pars_vertex}
    
    #include <clipping_planes_pars_vertex>
    void main() {
    
        vUv = uv;
        #if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
        vUv2 = uv;
        #endif
        
        vGridPosition = (position.xz - uGridTransform.zw) / uGridTransform.xy;
        vUvGrid = vGridPosition / gridResolution;
        
        #include <color_vertex>
        #include <beginnormal_vertex>
        #include <morphnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        
        #ifndef FLAT_SHADED // Normal computed with derivatives when FLAT_SHADED
            vNormal = normalize( transformedNormal );
        #endif
        
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <project_vertex>
        #include <logdepthbuf_vertex>
        #include <clipping_planes_vertex>
	    
	    vViewPosition = - mvPosition.xyz;
        
        #if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined( SHADOWMAP_CLOUDS )
            vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
        #endif
        
        #include <shadowmap_vertex>
        #include <fog_vertex>
        
        ${ShaderChunks.clouds_vertex}
        
    }
    `;
}

function fragment() {
    return `
    #version 300 es
    
    #define PHYSICAL
    #define STANDARD
    
    precision highp sampler2DArray;
    
    uniform sampler2DArray splatWeightMap;
    uniform float splatLayerCount;
    
    uniform vec2 splatResolution;
    
    out vec4 out_FragColor;
   
    uniform sampler2D materialScalesMap;
    
    uniform sampler2DArray diffuseMaps;

    uniform sampler2D diffuseGridOverlaySprite;
    uniform sampler2D diffuseGridOverlayMap;
    
    uniform vec2 gridResolution;
    uniform float gridBorderWidth;
    uniform vec4 offsetRepeat;

    uniform vec3 diffuse;
    uniform vec3 emissive;
    uniform float opacity;
    
    varying vec3 vViewPosition;

    #ifndef FLAT_SHADED
        varying vec3 vNormal;
    #endif

    #include <common>
    #include <packing>
    #include <dithering_pars_fragment>
    #include <color_pars_fragment>
    
    varying vec2 vUv;
    varying vec2 vUvGrid;
    varying vec2 vGridPosition;
    
    #include <uv2_pars_fragment>
    #include <alphamap_pars_fragment>
    #include <aomap_pars_fragment>
    #include <lightmap_pars_fragment>
    #include <emissivemap_pars_fragment>
    #include <bsdfs>
    #include <cube_uv_reflection_fragment>
    #include <envmap_common_pars_fragment>
    #include <envmap_physical_pars_fragment>
    #include <fog_pars_fragment>
    #include <lights_pars_begin>
    #include <lights_physical_pars_fragment>
    #include <shadowmap_pars_fragment>
    #include <specularmap_pars_fragment>
    #include <logdepthbuf_pars_fragment>
    #include <clipping_planes_pars_fragment>
    
    ${ShaderChunks.random}
    
    vec4 blendSplatTextures(const in vec4 tex0, const in vec4 tex1, const in vec4 tex2, const in vec4 tex3, const in vec4 splat){
    
       float b0 = splat[0];
       
       float b1 = splat[1];
       
       float b2 = splat[2];
       
       float b3 = splat[3];
       
       return (tex0*b0 + tex1*b1 + tex2*b2 + tex3*b3) / (b0 + b1 + b2 + b3);
    }
   
    void randomBlend(in vec2 uv, inout vec3 v, float level){
       vec3 noise = vec3( rand(uv.x*12.9898 + uv.y*78.233), rand(uv.x*10.9898 + uv.y*73.233) , rand(uv.x*6.9898 + uv.y*71.233));
       v = v*(1.0 - level) + noise*level;
    }
    
    vec3 AdjustContrastCurve(vec3 color, float contrast) {
        float p = 1.0 / max(contrast, 0.0001);
        vec3 v = abs(color * 2.0 - 1.0);
        return pow(v, vec3(p)) * sign(color - 0.5) + 0.5;
    }
    
    vec3 AdjustSaturation(vec3 rgb, float adjustment){
        const vec3 W = vec3(0.2125, 0.7154, 0.0721);
        vec3 intensity = vec3(dot(rgb, W));
        return mix(intensity, rgb, adjustment);
    }
    
    vec4 blendAlpha(in vec4 source, in vec4 target){
       return source*(1.0 - target.a) + vec4(target.rgb*target.a , target.a);
    }
    
    vec4 blendAdd(in vec4 source, in vec4 target){
        return source + target;
    }   
    
    vec4 blendAddAlpha(in vec4 source, in vec4 target){
        
        vec4 a = blendAlpha(source, target);
        vec4 b = blendAdd(source, target);
        
        return mix(a, b, target.a);
    }
    
    vec3 rgb2hsv(vec3 c){
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }
    
    vec3 hsv2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    const mat3 rgb2yiq = mat3(0.299, 0.587, 0.114, 0.595716, -0.274453, -0.321263, 0.211456, -0.522591, 0.311135);
    const mat3 yiq2rgb = mat3(1.0, 0.9563, 0.6210, 1.0, -0.2721, -0.6474, 1.0, -1.1070, 1.7046);

    vec3 brighten(const in vec3 color, in float factor){
        //vec3 yiq = rgb2yiq*color;
        
        //yiq.x *= factor;
        
        //return yiq2rgb * yiq;
        
        vec3 hsv = rgb2hsv(color);
        
        hsv.z *= factor;
        
        return hsv2rgb(hsv);
    }
    
    vec3 brighten2(const in vec3 color, in float factor, float p){
        vec3 yiq = rgb2yiq*color;
        
        yiq.x *= p;
        yiq.x = pow(yiq.x,factor);
        
        return yiq2rgb * yiq;
    }
    
    vec4 computeGridOverlayTexel(const in vec2 grid_uv, const in vec2 grid_resolution){
        vec2 grid_texel = vGridPosition + 0.5;
        
        vec2 uv = grid_texel / grid_resolution;
        
        vec4 tile_data = texture2D(diffuseGridOverlayMap, uv);
        
        if(tile_data.a == 0.0){
            return vec4(0.0);
        }
        
        vec2 tile_uv = mod(grid_texel , 1.0);
        
        vec4 tile_color = texture2D(diffuseGridOverlaySprite, tile_uv);
        
        if(tile_color.a <= 0.01){
            return vec4(0.0);
        }
        
        return tile_color * tile_data;
    }
    
    vec4 computeSplatMix(vec2 uv){
        
        float weightSum = 0.0;
        vec4 colorSum = vec4(0.0);
        
        float m = 1.0 / splatLayerCount ;
        
        for( float i = 0.0; i < splatLayerCount; i++){
               
            float nI = i * m;
               
            vec2 scale = texture2D(materialScalesMap, vec2(nI, 0.0) ).xy;
            
            vec2 layerUv = vUv * scale;
            
            vec4 diffuseData = texture(diffuseMaps, vec3(layerUv, i) );
            
            float weight = texture(splatWeightMap, vec3(uv, i)).x;
        
            weightSum += weight;
            colorSum += diffuseData*weight;
        }
        
        return colorSum / weightSum;  
    }
    
    ${ShaderChunks.clouds_pars_fragment}
    
    void main() { 
        vec4 splatDiffuseColor = computeSplatMix(vUv);
                
        //decode the texture
        splatDiffuseColor = sRGBToLinear( splatDiffuseColor );
        
        //ensure it is fully opaque
        splatDiffuseColor.a = 1.0;
        
        #ifdef DIFFUSE_GRAIN
            randomBlend(vUv, splatDiffuseColor.rgb, 0.03);
        #endif
      
        vec4 gridOverlayColor = computeGridOverlayTexel(vUvGrid, gridResolution);
        
        #include <clipping_planes_fragment>
        
        vec4 diffuseColor = blendAlpha( splatDiffuseColor, gridOverlayColor );
        
        #ifdef USE_AOMAP
        
            vec4 aoShadowMapTexel = texture2D( aoMap, vUv2 );
            
            diffuseColor *= aoShadowMapTexel.r;
            
        #endif
        
        ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
        vec3 totalEmissiveRadiance = emissive;
        
        #include <logdepthbuf_fragment>
        
        // make surface completely diffuse
        float roughnessFactor = 1.0;
        float metalnessFactor = 0.0;
        
        #include <normal_fragment_begin>
        #include <emissivemap_fragment>
        
        // accumulation
        #include <lights_physical_fragment>
        #include <lights_fragment_begin>
        
        #include <lights_fragment_maps>
        
        
        #include <lights_fragment_end>
        
        ${ShaderChunks.clouds_fragment}
                
        // modulation
        #include <aomap_fragment>
        
        
        vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
                        
        out_FragColor  = vec4( outgoingLight, diffuseColor.a );
      
        #if defined( TONE_MAPPING )
            out_FragColor.rgb = toneMapping( out_FragColor.rgb );
        #endif
        
        //encode fragment
        out_FragColor = linearToOutputTexel( out_FragColor );
        #ifdef USE_FOG
            #ifdef FOG_EXP2
                float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
            #else
                float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
            #endif
            out_FragColor.rgb = mix( out_FragColor.rgb, fogColor, fogFactor );
        #endif
        
        #ifdef PREMULTIPLIED_ALPHA
            // Get get normal blending with premultipled, use with CustomBlending, OneFactor, OneMinusSrcAlphaFactor, AddEquation.
            out_FragColor.rgb *= out_FragColor.a;
        #endif
        
        #ifdef DITHERING
            out_FragColor.rgb = dithering( out_FragColor.rgb );
        #endif
    }
    `;
}

const TerrainShader = {
    vertexShader: vertex(),

    fragmentShader: fragment()
};

export default TerrainShader;
