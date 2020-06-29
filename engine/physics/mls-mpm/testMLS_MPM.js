import { MLS_MPMSolver } from "./MLS_MPM.js";

const renderEvery = 5;
const enableTiming = false;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d', { alpha: false });

canvas.setAttribute('width', 600);
canvas.setAttribute('height', 600);

document.body.appendChild(canvas);

let iter = 0;

const solver = new MLS_MPMSolver();

function display() {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, 600, 600);

    context.lineWidth = 0.5;
    context.strokeStyle = '#CCCCCC';
    context.strokeRect(24, 24, 552, 552);

    for (let p of solver.particles) {
        context.fillStyle = `#${p.c.toString(16)}`;
        context.fillRect(600 * p.x[0] - 1, 600 - 600 * p.x[1] - 1, 2, 2);
    }
}


function step() {
    requestAnimationFrame(step);
    iter++;

    const mustRender = iter % renderEvery === 0;
    const mustTime = mustRender && enableTiming;

    // Advance simulation
    mustTime && console.time('advance');

    solver.advance(0.0001);

    mustTime && console.timeEnd('advance');

    if (mustRender) {
        mustTime && console.time('display');
        display();
        mustTime && console.timeEnd('display');
    }
}

enableTiming && console.time('setup');
solver.add_rnd_square([0.55, 0.45], 0xED553B);
solver.add_rnd_square([0.45, 0.65], 0xF2B134);
solver.add_rnd_square([0.55, 0.85], 0x168587);
enableTiming && console.timeEnd('setup');

step();

console.time('simulation');
for (let i = 0; i < 1000; i++) {
    solver.advance(0.0001);
}
console.timeEnd('simulation');
