/**
 * Created by Alex on 10/11/2014.
 */


//var current = getValue(x, y);
////
//var top = getValue(x, y - 1);
//var bottom = getValue(x, y + 1);
//var left = getValue(x - 1, y);
//var right = getValue(x + 1, y);
////
//var topLeft = getValue(x - 1, y - 1);
//var topRight = getValue(x + 1, y - 1);
//var bottomLeft = getValue(x - 1, y + 1);
//var bottomRight = getValue(x + 1, y + 1);
////
//var xm = (right - current) + (current - left) + (topRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (bottomRight - current) / sqrt2 + (current - bottomLeft) / sqrt2;
//var ym = (bottom - current) + (current - top) + (bottomLeft - current) / sqrt2 + (bottomRight - current) / sqrt2 + (current - topLeft) / sqrt2 + (current - topRight) / sqrt2;
//if (Number.isNaN(xm)) {
//    xm = 0;
//}
//if (Number.isNaN(ym)) {
//    ym = 0;
//}
//xm /= 6;
//ym /= 6;
//var f = Math.sqrt(xm * xm + ym * ym);
//var a = Math.acos(f);
//var d = Math.sin(a);
//result.set(xm, ym, d);
//result.normalize();
import * as THREE from 'three';

const NormalMapShader = function () {
    return {

        uniforms: {

            "heightMap": { type: "t", value: null },
            "resolution": { type: "v2", value: new THREE.Vector2(512, 512) }

        },

        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),

        /**
         * Reference: https://stackoverflow.com/questions/49640250/calculate-normals-from-heightmap
         */
        fragmentShader: [
            "uniform vec2 resolution;",
            "uniform sampler2D heightMap;",

            "#define sqrt2 1.41421356237;",

            "varying vec2 vUv;",

            "void main() {",
            "   float uStep = 1.0/resolution.x;",
            "   float vStep = 1.0/resolution.y;",
            //
            //
            "   float top = texture2D( heightMap, vUv + vec2(0, -vStep)).x;",
            "   float bottom = texture2D( heightMap, vUv + vec2(0, +vStep)).x;",
            "   float left = texture2D( heightMap, vUv + vec2(-uStep, 0)).x;",
            "   float right = texture2D( heightMap, vUv + vec2(+uStep, 0)).x;",
            //

            "   float dX = (right ) - ( left);",
            "   float dY = (  bottom ) - (  top);",
            "   float dZ = 2.0;",
            "   vec3 n = normalize(vec3(dX, dY, dZ));",

            "   gl_FragColor = vec4( n*0.5+0.5, 1.0 );",

            "}"

        ].join('\n')

    }
};
export default NormalMapShader;
