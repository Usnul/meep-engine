import { Sampler2D } from "../../../../graphics/texture/sampler/Sampler2D.js";
import convertSampler2D2Canvas from "../../../../graphics/texture/sampler/Sampler2D2Canvas.js";
import { CanvasView } from "../../../../../../view/ui/elements/CanvasView.js";
import EmptyView from "../../../../../../view/ui/elements/EmptyView.js";
import { scaleSampler2D } from "../../../../graphics/texture/sampler/scaleSampler2D.js";
import { arrayPickBestElement } from "../../../../../core/collection/ArrayUtils.js";
import { passThrough } from "../../../../../core/function/Functions.js";
import AABB2 from "../../../../../core/geom/AABB2.js";
import View from "../../../../../../view/View.js";
import SVG from "../../../../../../view/SVG.js";
import Vector2 from "../../../../../core/geom/Vector2.js";
import Vector4 from "../../../../../core/geom/Vector4.js";
import { MersenneTwister } from "../../../../../core/math/MersenneTwister.js";
import { hsv2rgb } from "../../../../../core/color/ColorUtils.js";

function removeAllChildren(node) {
    const children = node.children;

    for (let i = children.length - 1; i >= 0; i--) {
        const element = children.item(i);
        //trash
        try {
            node.removeChild(element);
        } catch (e) {
        }
    }
}

/**
 * @template T
 * @param {SVGElement} svg
 * @param {Edge<T>} edges
 * @param {Graph<T>} graph
 * @param {AABB2[]} boxes
 */
function drawConnections(svg, edges, graph, boxes) {


    /**
     *
     * @param {SplatMapMaterialPatch} node
     * @returns {AABB2}
     */
    function node2focus(node) {
        const index = graph.nodes.indexOf(node);

        const box = boxes[index];

        const focus = box.focus;

        const x0 = box.x0 + focus.x0;
        const y0 = box.y0 + focus.y0;

        const bb = new AABB2(x0, y0, x0 + focus.getWidth(), y0 + focus.getHeight());

        bb.grow(1);

        return bb;
    }


    const p0 = new Vector2();
    const p1 = new Vector2();

    edges.forEach(edge => {
        const bb0 = node2focus(edge.first);
        const bb1 = node2focus(edge.second);

        AABB2.computeLineBetweenTwoBoxes(bb0, bb1, p0, p1);


        const el = SVG.createElement('path');

        let pathString = "M";

        pathString += [p0, p1].map(function (point) {
            return point.x + "," + point.y
        }).join("L");
        pathString += "Z";

        el.setAttribute("d", pathString);
        el.setAttribute("stroke", 'rgba(255,0,0,0.8)');
        el.setAttribute("stroke-width", "1");

        svg.appendChild(el);
    });
}

/**
 *
 * @param {SplatMapMaterialPatch} node
 */
function paintPatchOnTerrain(node) {
    if (engine !== undefined) {
        const ecd = engine.entityManager.dataset;

        const Terrain = ecd.getComponentClassByName('Terrain');

        const terrain = ecd.getAnyComponent(Terrain).component;

        if (terrain !== undefined) {
            const overlay = terrain.overlay;

            overlay.push();

            overlay.size.set(node.width, node.height);

            overlay.borderWidth.set(0.1);

            overlay.tileImage.set("data/textures/utility/white_pixel.png");

            const color = new Vector4();


            const color0 = new Vector4();
            const color1 = new Vector4();

            color0.set(0, 0, 1, 0.8);
            color1.set(1, 0, 0, 0.3);

            const x0 = node.aabb.x0;
            const y0 = node.aabb.y0;

            const x1 = node.aabb.x1;
            const y1 = node.aabb.y1;

            const _w = x1 - x0;

            for (let y = y0; y < y1; y++) {
                for (let x = x0; x < x1; x++) {
                    const t = node.test(x, y);

                    if (t) {
                        const _x = x - x0;
                        const _y = y - y0;

                        const w = node.weights[_y * _w + _x];

                        const nW = w / 255;

                        color.lerpVectors(color0, color1, nW);

                        overlay.paintPoint(x, y, color);
                    }
                }
            }
        }
    }
}


export class SplatMapOptimizerDebugger {
    constructor() {

    }


    /**
     *
     * @param {SplatMapMaterialPatch} patch
     */
    buildPatch(patch) {

        const mersenneTwister = new MersenneTwister(patch.materialIndex);

        const hue = ((patch.materialIndex) / 5.3111) % 1;

        const rgb = hsv2rgb(hue, 0.9, 1);

        const w = patch.width;
        const h = patch.height;

        const sampler = Sampler2D.uint8(4, w, h);

        //draw weight
        const aabb = patch.aabb;
        const y0 = aabb.y0;
        const y1 = aabb.y1;
        const x0 = aabb.x0;
        const x1 = aabb.x1;

        const _w = x1 - x0;

        for (let y = y0; y < y1; y++) {
            const _y = y - y0;

            for (let x = x0; x < x1; x++) {
                const _x = x - x0;

                const weight = patch.weights[_y * _w + _x];

                const index = y * w + x;

                const index4 = index * 4;

                const nW = weight / 255;
                sampler.data[index4] = rgb.r * nW;
                sampler.data[index4 + 1] = rgb.g * nW;
                sampler.data[index4 + 2] = rgb.b * nW;
                sampler.data[index4 + 3] = 255;

            }
        }


        const size = 123;

        let rW = size;
        let rH = size;

        if (sampler.width > sampler.height) {
            rW = size;
            rH = (sampler.height / sampler.width) * size;
        } else {
            rW = (sampler.width / sampler.height) * size;
            rH = size;
        }

        const s2 = Sampler2D.uint8(4, rW, rH);

        scaleSampler2D(sampler, s2);

        const canvasView = new CanvasView();
        canvasView.size.set(rW, rH);

        convertSampler2D2Canvas(s2, 1, 0, canvasView.el);

        const ctx = canvasView.context2d;

        ctx.strokeStyle = 'rgba(255,255,255,0.8)';

        const scale_x = rW / sampler.width;
        const scale_y = rH / sampler.height;

        const strokeWidth = 1;
        const halfStrokeWidth = strokeWidth / 2;

        ctx.strokeRect(x0 * (scale_x) - halfStrokeWidth, y0 * (scale_y) - halfStrokeWidth, aabb.getWidth() * scale_x + strokeWidth, aabb.getHeight() * scale_y + strokeWidth);


        const fontHeight = 8;


        function drawLabel(text, x, y) {

            ctx.fillStyle = 'black';
            ctx.font = '10px Tahoma';


            ctx.strokeStyle = `hsla(${hue * 360},90%,70%,0.5)`;
            ctx.lineWidth = 2;

            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        }

        const maxWeight = arrayPickBestElement(patch.weights, passThrough);

        //write stats
        drawLabel(`M: ${patch.materialIndex}`, 0, rH - fontHeight * 2);
        drawLabel(`Max: ${maxWeight}`, 0, rH - fontHeight * 1);
        drawLabel(`Area: ${patch.area}`, 0, rH);


        return canvasView;
    }

    /**
     *
     * @param {Graph<SplatMapMaterialPatch>} graph
     */
    build(graph) {

        const patches = graph.nodes;

        const vContainer = new EmptyView({});

        vContainer.size.set(1024, 1024);

        let w = 512;
        let h = 512;

        const nodeCount = patches.length;
        if (nodeCount > 0) {
            w = patches[0].width;
            h = patches[0].height;
        }

        const boxes = [];

        const columnCount = 8;

        for (let i = 0; i < nodeCount; i++) {
            const patch = patches[i];

            const v = this.buildPatch(patch);

            v.css({
                position: 'absolute',
                border: 'solid 1px black',
                pointerEvents: 'auto'
            });

            v.el.addEventListener('click', () => {
                focusNode(patch);
            });

            vContainer.addChild(v);

            const column = Math.floor(i / columnCount);
            const row = i % columnCount;

            const y0 = column * v.size.x;
            const x0 = row * v.size.y;

            const box = new AABB2(x0, y0, x0 + v.size.x, y0 + v.size.y);

            const sX = v.size.x / patch.width;
            const sY = v.size.y / patch.height;

            const focus = new AABB2();

            focus.copy(patch.aabb);
            focus.multiplyScalar(sX);

            box.view = v;
            box.model = patch;
            box.focus = focus;

            boxes.push(box);
        }

        // forceLayout(boxes, graph);

        for (let i = 0; i < nodeCount; i++) {
            const box = boxes[i];

            const view = box.view;

            view.position.set(box.x0, box.y0);
        }

        //draw connections
        const vConnections = new View();

        const svg = SVG.createElement('svg');
        vConnections.el = svg;

        svg.setAttribute("width", vContainer.size.x);
        svg.setAttribute("height", vContainer.size.y);
        vConnections.css({ position: 'absolute', left: '0', top: '0', overflow: 'visible' });

        vContainer.addChild(vConnections);


        /**
         *
         * @param {SplatMapMaterialPatch} node
         */
        function focusNode(node) {
            removeAllChildren(svg);

            const attachedEdges = graph.getAttachedEdges(node);

            drawConnections(svg, attachedEdges, graph, boxes);

            //paint the patch on terrain
            paintPatchOnTerrain(node);
        }

        vContainer.css({
            pointerEvents: 'none',
            maxWidth: '100vw',
            maxHeight: '100vh',
            overflow: 'scroll',
            flexWrap: 'wrap',
            zIndex: '9999'
        });

        return vContainer;

    }
}
