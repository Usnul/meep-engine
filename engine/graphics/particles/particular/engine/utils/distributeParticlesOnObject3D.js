import { computeMeshSurfaceArea } from "../../../../geometry/computeMeshSurfaceArea.js";
import { ParticleEmitter } from "../emitter/ParticleEmitter.js";
import { roundFair, seededRandom } from "../../../../../../core/math/MathUtils.js";
import { ParticleEmitterFlag } from "../emitter/ParticleEmitterFlag.js";
import { computeSkinnedMeshVertices } from "../../../../Utils.js";

let buffer_points = new Float32Array();
let buffer_indices = new Uint32Array();

let cursor_points = 0;
let cursor_indices = 0;

let offset_indices = 0;

/**
 *
 * @param {Object3D} object
 */
function visitObject(object) {

    if (object.isMesh || object.isSkinnedMesh) {

        /**
         * @type {BufferGeometry}
         */
        const geometry = object.geometry;

        // copy indices
        const index = geometry.index;
        const index_count = index.count;
        const index_data = index.array;

        const indices_buffer_size = index_count;

        const final_buffer_index_size = cursor_indices + indices_buffer_size;

        if (buffer_indices.length < final_buffer_index_size) {
            const new_index_buffer = new Uint32Array(final_buffer_index_size);

            new_index_buffer.set(buffer_indices);

            buffer_indices = new_index_buffer;
        }

        for (let i = 0; i < indices_buffer_size; i++) {
            buffer_indices[cursor_indices + i] = index_data[i] + offset_indices;
        }

        cursor_indices = final_buffer_index_size;

        const positions = geometry.getAttribute('position');
        const positions_count = positions.count;
        const positions_buffer_size = positions_count * 3;


        offset_indices += positions_count;

        const final_buffer_positions_size = cursor_points + positions_buffer_size;

        if (buffer_points.length < final_buffer_positions_size) {
            const new_point_buffer = new Float32Array(final_buffer_positions_size);

            new_point_buffer.set(buffer_points);

            buffer_points = new_point_buffer;
        }

        if (object.isSkinnedMesh) {
            computeSkinnedMeshVertices(buffer_points, object, cursor_points);

        } else {
            const positions_data = positions.array;


            for (let i = 0; i < positions_buffer_size; i++) {
                buffer_points[cursor_points + i] = positions_data[i];
            }
        }

        // apply matrix transform on points

        /**
         *
         * @type {number[]}
         */
        const m4_tx = object.matrixWorld.elements;

        //read out relevant transform matrix elements for faster access
        const tx0 = m4_tx[0];
        const tx1 = m4_tx[1];
        const tx2 = m4_tx[2];

        const tx4 = m4_tx[4];
        const tx5 = m4_tx[5];
        const tx6 = m4_tx[6];

        const tx8 = m4_tx[8];
        const tx9 = m4_tx[9];
        const tx10 = m4_tx[10];

        const tx12 = m4_tx[12];
        const tx13 = m4_tx[13];
        const tx14 = m4_tx[14];

        for (let i = cursor_points; i < final_buffer_positions_size; i += 3) {

            const x = buffer_points[i];
            const y = buffer_points[i + 1];
            const z = buffer_points[i + 2];

            const _x = tx0 * x + tx4 * y + tx8 * z + tx12;
            const _y = tx1 * x + tx5 * y + tx9 * z + tx13;
            const _z = tx2 * x + tx6 * y + tx10 * z + tx14;

            buffer_points[i] = _x;
            buffer_points[i + 1] = _y;
            buffer_points[i + 2] = _z;
        }

        cursor_points = final_buffer_positions_size;
    }

}

/**
 *
 * @param {ParticleEmitter} emitter
 * @param {number} seed
 * @param {Object3D} object
 */
export function distributeParticlesOnObject3D(emitter, seed, object) {
    if (!emitter.getFlag(ParticleEmitterFlag.Built)) {
        //particle pool needs to be set up first
        emitter.build();
    }

    if (!emitter.getFlag(ParticleEmitterFlag.Initialized)) {
        //particles are not initialized, do that
        emitter.initialize();
    }

    cursor_indices = 0;
    cursor_points = 0;

    offset_indices = 0;

    object.traverse(visitObject);

    const polygonCount = cursor_indices / 3;

    const areas = new Float32Array(polygonCount);

    const meshSurfaceArea = computeMeshSurfaceArea(areas, buffer_points, buffer_indices, polygonCount);

    const pool = emitter.particles;

    const particleCount = pool.size();

    const surfaceSpacing = meshSurfaceArea / particleCount;
    const invSurfaceSpacing = 1 / surfaceSpacing;

    let placedPoints = 0;

    const PARTICLE_ATTRIBUTE_POSITION = ParticleEmitter.Attributes.PARTICLE_ATTRIBUTE_POSITION;

    const random = seededRandom(seed);

    poly: for (let i = 0; i < polygonCount; i++) {
        const area = areas[i];

        const placementCount = area * invSurfaceSpacing;

        const roundedPlacementCount = roundFair(placementCount, random);

        for (let j = 0; j < roundedPlacementCount; j++) {

            //pick a point
            const index3 = i * 3;

            const a = buffer_indices[index3];
            const b = buffer_indices[index3 + 1];
            const c = buffer_indices[index3 + 2];

            //read triangle points
            const a3 = a * 3;

            const ax = buffer_points[a3];
            const ay = buffer_points[a3 + 1];
            const az = buffer_points[a3 + 2];

            const b3 = b * 3;

            const bx = buffer_points[b3];
            const by = buffer_points[b3 + 1];
            const bz = buffer_points[b3 + 2];

            const c3 = c * 3;

            const cx = buffer_points[c3];
            const cy = buffer_points[c3 + 1];
            const cz = buffer_points[c3 + 2];

            //pick random point on the triangle
            // method from here: https://math.stackexchange.com/questions/538458/triangle-point-picking-in-3d
            const cax = cx - ax;
            const cay = cy - ay;
            const caz = cz - az;

            const bax = bx - ax;
            const bay = by - ay;
            const baz = bz - az;

            //pick two random numbers
            const r0 = random();
            const r1 = random() * (1 - r0);


            //compute random point
            const x = ax + r0 * bax + r1 * cax;
            const y = ay + r0 * bay + r1 * cay;
            const z = az + r0 * baz + r1 * caz;

            //place the point
            pool.writeAttributeVector3(placedPoints, PARTICLE_ATTRIBUTE_POSITION, x, y, z);

            placedPoints++;

            if (placedPoints >= particleCount) {
                break poly;
            }
        }
    }
}
