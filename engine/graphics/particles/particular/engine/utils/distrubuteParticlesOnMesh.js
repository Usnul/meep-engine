import { ParticleEmitterFlag } from "../emitter/ParticleEmitterFlag.js";
import { computeMeshSurfaceArea } from "../../../../geometry/computeMeshSurfaceArea.js";
import { computeSkinnedMeshVertices } from "../../../../Utils.js";
import { ParticleEmitter } from "../emitter/ParticleEmitter.js";
import { roundFair, seededRandom } from "../../../../../../core/math/MathUtils.js";

/**
 *
 * @param {ParticleEmitter} emitter
 * @param {Mesh|SkinnedMesh} mesh
 * @param {Matrix4} transform
 * @param {number} randomSeed
 */
export function distributeParticlesOnMesh(emitter, mesh, transform, randomSeed) {
    if (!emitter.getFlag(ParticleEmitterFlag.Built)) {
        //particle pool needs to be set up first
        emitter.build();
    }

    if (!emitter.getFlag(ParticleEmitterFlag.Initialized)) {
        //particles are not initialized, do that
        emitter.initialize();
    }

    const random = seededRandom(randomSeed);

    /**
     *
     * @type {number[]}
     */
    const m4_tx = transform.elements;

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


    /**
     *
     * @type {BufferGeometry}
     */
    const geometry = mesh.geometry;

    //compute total surface area of the mesh
    const attributes = geometry.attributes;

    const aPosition = attributes.position;
    const aIndex = geometry.index;

    const polygonCount = aIndex.count / 3;


    const areas = new Float32Array(polygonCount);

    const indices = aIndex.array;
    let points;

    if (mesh.isSkinnedMesh) {
        points = new Float32Array(aPosition.array.length);
        computeSkinnedMeshVertices(points, mesh);
    } else {
        points = aPosition.array;
    }

    const meshSurfaceArea = computeMeshSurfaceArea(areas, points, indices);


    const particles = emitter.particles;

    const particleCount = particles.size();

    const surfaceSpacing = meshSurfaceArea / particleCount;
    const invSurfaceSpacing = 1 / surfaceSpacing;

    let placedPoints = 0;

    const PARTICLE_ATTRIBUTE_POSITION = ParticleEmitter.Attributes.PARTICLE_ATTRIBUTE_POSITION;

    poly: for (let i = 0; i < polygonCount; i++) {
        const area = areas[i];

        const placementCount = area * invSurfaceSpacing;

        const roundedPlacementCount = roundFair(placementCount, random);

        for (let j = 0; j < roundedPlacementCount; j++) {

            //pick a point
            const index3 = i * 3;

            const a = indices[index3];
            const b = indices[index3 + 1];
            const c = indices[index3 + 2];

            //read triangle points
            const a3 = a * 3;

            const ax = points[a3];
            const ay = points[a3 + 1];
            const az = points[a3 + 2];

            const b3 = b * 3;

            const bx = points[b3];
            const by = points[b3 + 1];
            const bz = points[b3 + 2];

            const c3 = c * 3;

            const cx = points[c3];
            const cy = points[c3 + 1];
            const cz = points[c3 + 2];

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

            //apply transform
            const _x = tx0 * x + tx4 * y + tx8 * z + tx12;
            const _y = tx1 * x + tx5 * y + tx9 * z + tx13;
            const _z = tx2 * x + tx6 * y + tx10 * z + tx14;

            //place the point
            particles.writeAttributeVector3(placedPoints, PARTICLE_ATTRIBUTE_POSITION, _x, _y, _z);

            placedPoints++;

            if (placedPoints >= particleCount) {
                break poly;
            }
        }
    }

}
