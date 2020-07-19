import { SegmentDefinition } from "./SegmentDefinition.js";

/**
 *
 * @type {SegmentDefinition[]}
 */
export const RESOURCE_BAR_SEGMENTS = [
    SegmentDefinition.from(10,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, Math.ceil(height * 0.5));

            ctx.stroke();
        }),
    SegmentDefinition.from(40,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            ctx.stroke();
        }),
    SegmentDefinition.from(200,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, 2);

            ctx.moveTo(x, height);
            ctx.lineTo(x, height - 2);

            ctx.stroke();


            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(x, 2);
            ctx.lineTo(x, height - 2);

            ctx.stroke();
        }),
    SegmentDefinition.from(1000,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            ctx.stroke();

        }),
    SegmentDefinition.from(5000,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 4;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, 2);

            ctx.moveTo(x, height);
            ctx.lineTo(x, height - 2);

            ctx.stroke();

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(x, 2);
            ctx.lineTo(x, height - 2);

            ctx.stroke();
        }),
    SegmentDefinition.from(25000,
        /**
         *
         * @param {CanvasRenderingContext2D} ctx
         * @param {number} x
         * @param {number} height
         */
        (ctx, x, height) => {

            ctx.strokeStyle = "rgba(0,0,0,0.7)";
            ctx.lineWidth = 4;

            ctx.beginPath();

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            ctx.stroke();
        })
];
