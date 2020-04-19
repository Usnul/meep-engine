/**
 * Created by Alex on 10/11/2014.
 */



const CopyShader = function () {
    return {


        uniforms: {

            "tDiffuse": { type: "t", value: null },
            "opacity": { type: "f", value: 1.0 }

        },

        vertexShader: [

            "varying vec2 vUv;",

            "void main() {",

            "vUv = uv;",
            "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

            "}"

        ].join("\n"),

        fragmentShader: [

            "uniform float opacity;",

            "uniform sampler2D tDiffuse;",

            "varying vec2 vUv;",

            "void main() {",

            "vec4 texel = texture2D( tDiffuse, vUv );",
            "gl_FragColor = opacity * texel;",

            "}"

        ].join("\n")

    }
};
export default CopyShader;
