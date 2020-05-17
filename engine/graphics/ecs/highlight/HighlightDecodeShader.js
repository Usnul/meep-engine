import { NormalBlending, ShaderMaterial, Vector2 } from "three";
import { ScreenSpaceQuadShader } from "../../shaders/ScreenSpaceQuadShader.js";

const fragmentShader = `

                uniform sampler2D tObjects;
                uniform sampler2D tParameters;
                uniform vec2 resolution;
                
                varying vec2 vUv;
                
                const float OBJECT_COUNT = 255.0;
                
                const int   c_samplesX    = 5;  // must be odd
                const int   c_samplesY    = 5;  // must be odd
        
                const float   c_halfSamplesX = floor( float(c_samplesX) / 2.0 );
                const float   c_halfSamplesY = floor( float(c_samplesY) / 2.0 );
        
                const float radius = 6.0;
                const vec2 samplingBias = vec2(float(c_halfSamplesX),float(c_halfSamplesY))/radius;
                        
                const vec2 sigma = vec2(15.0, 15.0);
                        
                float Gaussian (float sigma, float x){
                    return exp(-(x*x) / (2.0 * sigma*sigma));
                }
                
                vec4 readColor( const in vec2 uv){
                    
                    float id = texture2D( tObjects, uv ).x;
                    
                        
                    if(id == 1.0){
                        //no object
                        return vec4(0.0);
                    }
                   
                    float param_v = id+ 0.5/ OBJECT_COUNT;
                        
                    //read parameters
                    vec4 color = texture2D( tParameters, vec2(0.5 , param_v));
                        
                    return color;
                }
                
                vec4 BlurredPixel (in vec2 uv){

                    float total = 0.0;
                    vec4 ret = vec4(0.0);
                    vec2 sampleResolution = resolution * samplingBias;
        
                    for (int iy = 0; iy < c_samplesY; ++iy){
                        
                        float pixel_offset_y = float(iy) - float(c_halfSamplesY);
                    
                        float fy = Gaussian (sigma.y, pixel_offset_y);
                        float offsety = pixel_offset_y / sampleResolution.y;
                        
                        for (int ix = 0; ix < c_samplesX; ++ix){
                            float pixel_offset_x =float(ix) - float(c_halfSamplesX);
                        
                            float fx = Gaussian (sigma.x, pixel_offset_x);
                            float offsetx = pixel_offset_x / sampleResolution.x;
                            
                            
                            float p = fx * fy;
                            
                            total += p;
                            
                            ret += readColor( uv + vec2(offsetx, offsety)) * p;
                        }
                        
                    }
                    
                    return ret*1.7 / total;
                }
                
                           
                void main(){
                    if(texture2D( tObjects, vUv ).x != 1.0){
                        discard;
                    }else{
                        gl_FragColor = BlurredPixel(  vUv );
                    }
                }
`;

export function makeHighlightDecodeShader() {
    const uniforms = {
        tObjects: {
            type: 't',
            value: null
        },
        resolution: {
            type: 'v2',
            value: new Vector2(1, 1)
        },
        tParameters: {
            type: 't',
            value: null
        }
    };

    const material = new ShaderMaterial({
        uniforms,
        vertexShader: ScreenSpaceQuadShader.vertexShader(),
        fragmentShader: fragmentShader,
        blending: NormalBlending,
        lights: false,
        fog: false,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        vertexColors: false
    });

    return material;
}
