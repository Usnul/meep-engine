/**
 * Created by Alex on 10/11/2014.
 */
import { Vector2 } from "three";


const samplesPerPixel = 37;

const AmbientOcclusionShader = function () {
    return {

        uniforms: {

            "normalMap": { type: "t", value: null },
            "heightMap": { type: "t", value: null },
            "resolution": { type: "v2", value: new Vector2(512, 512) },
            "rayLength": { type: 'f', value: 17 }

        },

        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),

        fragmentShader: [
            `
            uniform vec2 resolution;
            uniform sampler2D normalMap;
            uniform sampler2D heightMap;
            uniform float rayLength;

            varying vec2 vUv;

            vec3 get(float x, float y){
               vec2 _uv = vUv.xy + vec2(x,y)/resolution;
               float h = texture2D(heightMap, _uv).x;
               return vec3(_uv.x, h, _uv.y);
            }
            
            float hash1( float n )
            {
                return fract( n*17.0*fract( n*0.3183099 ) );
            }
            
            float hash1( vec2 p )
            {
                p  = 50.0*fract( p*0.3183099 );
                return fract( p.x*p.y*(p.x+p.y) );
            }

            
            float noise( in vec2 x )
            {
                vec2 p = floor(x);
                vec2 w = fract(x);
                vec2 u = w*w*w*(w*(w*6.0-15.0)+10.0);
                
                float a = hash1(p+vec2(0,0));
                float b = hash1(p+vec2(1,0));
                float c = hash1(p+vec2(0,1));
                float d = hash1(p+vec2(1,1));
                
                return -1.0+2.0*( a + (b-a)*u.x + (c-a)*u.y + (a - b - c + d)*u.x*u.y );
            }
            
            float noise_01(in vec2 x){
                return (noise(x) + 1.0)*0.5;
            }
            
            vec3 sampleDirectionFromConicRay(float angle, vec3 direction, vec2 seed){
                float random_0 = noise_01( seed + vec2(1.123, 3.1)  );
                float random_1 = noise_01( seed + vec2(3.123, 7.8913)  );
            
            
                float angleCosine = cos(angle);
                
                float z = random_0 * (1.0 - angleCosine) + angleCosine;
            
                float phi = random_1 * 6.28318530718; //2*pi
                
                float zSqr = z*z;
                
                float zSqrtNeg = sqrt(1.0 - zSqr);
                
                float x = zSqrtNeg * cos(phi);
                float y = zSqrtNeg * sin(phi);
                
                float dX = direction.x;
                float dY = direction.y;
                float dZ = direction.z;
                
                float rot = acos(dZ);
               
                float c = dZ;
                float s = sin(rot);
                float t = 1.0 - c;
                float tx = -t * dY;
                float ty = t * dX;
                
                float n11 = c - tx * dY;
                float n12 = tx * dX;
                float n22 = ty * dX + c;
                float n13 = s * dX;
                float n32 = -s * dY;
                
                float _x = n11 * x + n12 * y + n13 * z;
                float _y = n12 * x + n22 * y + -n32 * z;
                float _z = -n13 * x + n32 * y + c * z;
                
                return vec3(_x, _y, _z);
            }

            void main() {
               float occlusion = 0.0;
               vec3 pos = get(0.0, 0.0);
               vec3 normal = texture2D( normalMap, vUv ).xyz;

               for(int i=1; i< ${samplesPerPixel}; i++){
                 float s = float(i)/${samplesPerPixel - 1}.0;
                 float a = sqrt(s*512.0);
                 float b = sqrt(s)*rayLength;
                 float x = sin(a)*b;
                 float y = cos(a)*b;
            
                 vec3 sample_pos = get(x, y);

                 vec3 sample_dir = normalize(sample_pos - pos);
                 float vDot = dot(normal, sample_dir);
                 float lambert = clamp(vDot, 0.0, 1.0);
                 float dist_factor = 0.23/sqrt(length(sample_pos - pos));
                 occlusion += dist_factor*lambert;
               }
               
               float incident = 1.0 - occlusion/${samplesPerPixel - 1}.0;
               gl_FragColor = vec4(incident, incident, incident, 1.0);
            }
            `
        ].join('\n')

    }
};
export default AmbientOcclusionShader;
