import {
    FrontSide,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Points,
    PointsMaterial,
    Scene,
    Vector2,
    WebGLRenderer
} from "three";
import { RibbonX } from "./RibbonX.js";
import { randomFloatBetween, randomIntegerBetween, seededRandom } from "../../../../core/math/MathUtils.js";
import { RibbonMaterialX } from "./RibbonMaterialX.js";

const renderer = new WebGLRenderer();

renderer.setSize(800, 600);


const scene = new Scene();
const camera = new PerspectiveCamera(70);


const random = seededRandom(0);

function init() {
    renderer.setClearColor(0x666666);

    camera.position.z = 2;

    updateSize();


    const ribbon = new RibbonX();

    ribbon.buildGeometry();
    ribbon.setCount(5);

    for (let i = 0; i < ribbon.getCount(); i++) {
        const n = i / (ribbon.getCount() - 1);

        ribbon.setPointColor(i, randomIntegerBetween(random, 0, 255), randomIntegerBetween(random, 0, 255), randomIntegerBetween(random, 0, 255));
        ribbon.setPointPosition(i, n * 2.4 - 1.2, randomFloatBetween(random, -0.4, 0.4), 0);
        ribbon.setPointAlpha(i, 1);
        ribbon.setPointThickness(i, 0.2);
    }

    const material = new PointsMaterial({ size: 0.2, vertexColors: true });

    const points = new Points(ribbon.__geometry, material);

    // scene.add(points);


    const trail_material = new RibbonMaterialX({
        transparent: true,
        depthWrite: false,
        // wireframe: true,
        side: FrontSide
    });

    const size = new Vector2();
    renderer.getSize(size);

    trail_material.uniforms.resolution.value.set(size.x, size.y);

    const material_basic = new MeshBasicMaterial({
        wireframe: true,
        vertexColors: true,
        transparent: true,
        opacity: 0.04
    });

    const trail_mesh = new Mesh(ribbon.__geometry, trail_material);

    scene.add(trail_mesh);

    scene.add(new Mesh(ribbon.__geometry, material_basic));

    function loop() {
        ribbon.rotate();

        ribbon.setPointPosition(ribbon.getHeadIndex(), 1, (random() - 0.5) * 0.5, 0);


        // console.log('head:', ribbon.getHeadIndex(), 'tail:', ribbon.getTailIndex());
    }

    function animate() {
        requestAnimationFrame(animate);

        const p = [];

        for (let i = 0; i < ribbon.getCount(); i++) {

            ribbon.getPointPosition(p, i);

            ribbon.setPointPosition(i, p[0] - 0.003, p[1], p[2]);
        }
    }

    // animate();

    // setInterval(loop, 100);

    window.ribbon = ribbon;
}

function updateSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
}

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
});

init();


document.body.appendChild(renderer.domElement);


window.scene = scene;
