import { clamp } from "../../../core/math/MathUtils.js";

function add2D(a, b) {
    return [a[0] + b[0], a[1] + b[1]]
}

/**
 *
 * @param {number[]} a
 * @param {number[]} r
 * @param {number} t
 * @return {number[]}
 */
function v2_multiply_scalar(r, a, t) {
    const x = a[0] * t;
    const y = a[1] * t;

    r[0] = x;
    r[1] = y;
}

/**
 *
 *
 * @param {number[]} a
 * @param {number[]} r
 */
function v2_floor(r, a) {
    const x = a[0] | 0;
    const y = a[1] | 0;

    r[0] = x;
    r[1] = y;
}

/**
 *
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 * @return {number[]}
 */
function v2_subtract(r, a, b) {
    const x = a[0] - b[0];
    const y = a[1] - b[1];

    r[0] = x;
    r[1] = y;
}

function add3D(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function sca3D(a, t) {
    return [a[0] * t, a[1] * t, a[2] * t]
}

function determinant(a) {
    return a[0] * a[3] - a[1] * a[2]
}

function transposed(a) {
    return [a[0], a[2], a[1], a[3]]
}

/**
 *
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function m2_multiply(r, a, b) {
    const v0 = a[0] * b[0] + a[1] * b[2];
    const v1 = a[0] * b[1] + a[1] * b[3];
    const v2 = a[2] * b[0] + a[3] * b[2];
    const v3 = a[2] * b[1] + a[3] * b[3];

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}

/**
 * Second argument will be transposed before multiplication
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function m2_multiply_t(r, a, b) {
    const v0 = a[0] * b[0] + a[1] * b[1];
    const v1 = a[0] * b[2] + a[1] * b[3];
    const v2 = a[2] * b[0] + a[3] * b[1];
    const v3 = a[2] * b[2] + a[3] * b[3];

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}

/**
 *
 * @param {number[]} r
 * @param {number[]} a
 * @param {number} s
 */
function m2_multiply_scalar(r, a, s) {

    const v0 = a[0] * s;
    const v1 = a[1] * s;
    const v2 = a[2] * s;
    const v3 = a[3] * s;

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}

/**
 *
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function m2_add(r, a, b) {
    const v0 = a[0] + b[0];
    const v1 = a[1] + b[1];
    const v2 = a[2] + b[2];
    const v3 = a[3] + b[3];

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}


/**
 *
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function m2_sub(r, a, b) {
    const v0 = a[0] - b[0];
    const v1 = a[1] - b[1];
    const v2 = a[2] - b[2];
    const v3 = a[3] - b[3];

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}

/**
 * Trasposes second matrix before subtraction
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function m2_sub_tb(r, a, b) {
    const v0 = a[0] - b[0];
    const v1 = a[1] - b[2];
    const v2 = a[2] - b[1];
    const v3 = a[3] - b[3];

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}

/**
 * Trasposes second matrix before subtraction
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function m2_sub_ta(r, a, b) {
    const v0 = a[0] - b[0];
    const v1 = a[2] - b[1];
    const v2 = a[1] - b[2];
    const v3 = a[3] - b[3];

    r[0] = v0;
    r[1] = v1;
    r[2] = v2;
    r[3] = v3;
}

function outer_product(a, b) { // transposed, as for taichi's convention
    return [
        a[0] * b[0], a[1] * b[0],
        a[0] * b[1], a[1] * b[1]
    ]
}


/**
 * transposed as in taichi
 * @param {number[]} R
 * @param {number[]} S
 * @param {number[]} m
 */
function polar_decomp(R, S, m) {
    const x = m[0] + m[3];
    const y = m[2] - m[1];

    const scale = 1.0 / Math.sqrt(x * x + y * y);

    const c = x * scale;
    const s = y * scale;

    R[0] = c;
    R[1] = s;
    R[2] = -s;
    R[3] = c;

    m2_multiply(S, m, R);
}

function polar_decomp_noS(R, m) { // transposed as in taichi
    const x = m[0] + m[3];
    const y = m[2] - m[1];

    const scale = 1.0 / Math.sqrt(x * x + y * y);

    const c = x * scale;
    const s = y * scale;

    R[0] = c;
    R[1] = s;
    R[2] = -s;
    R[3] = c;

}

/**
 *
 * @param {number[]} U
 * @param {number[]} S
 * @param {number[]} V
 * @param {number[]} sig
 * @param {number[]} m
 */
function svd(U, S, V, sig, m) { // transposed as in taichi

    polar_decomp(U, S, m);

    let c, s;

    if (Math.abs(S[1]) < 1e-6) {


        sig[0] = S[0];
        sig[1] = S[1];
        sig[2] = S[2];
        sig[3] = S[3];

        c = 1;
        s = 0;

    } else {
        const tao = 0.5 * (S[0] - S[3]);

        const w = Math.sqrt(tao * tao + S[1] * S[1]);

        const t = tao > 0 ? S[1] / (tao + w) : S[1] / (tao - w);

        c = 1.0 / Math.sqrt(t * t + 1);

        s = -t * c;

        const s2 = s * s;
        const c2 = c * c;

        const cs_2 = 2 * c * s;

        sig[0] = c2 * S[0] - cs_2 * S[1] + s2 * S[3];
        sig[1] = 0;
        sig[2] = 0;
        sig[3] = s2 * S[0] + cs_2 * S[1] + c2 * S[3];
    }

    if (sig[0] < sig[3]) {

        const tmp = sig[0];

        sig[0] = sig[3];
        sig[3] = tmp;

        V[3] = -s;
        V[2] = -c;
        V[1] = c;
        V[0] = -s;

    } else {

        V[3] = c;
        V[2] = -s;
        V[1] = s;
        V[0] = c;

    }

    m2_multiply(U, U, V);
}

/**
 * @description Hadamard product of vectors
 * @param {number[]} r
 * @param {number[]} a
 * @param {number[]} b
 */
function had2D(r, a, b) {
    const x = a[0] * b[0];
    const y = a[1] * b[1];

    r[0] = x;
    r[1] = y;
}

const dimensions = 2;

const m2_indentity = [1, 0, 0, 1];

export class MLS_MPMSolver {
    constructor() {

        this.particles = [];

        /**
         * velocity + mass, node_res = cell_res + 1
         * @type {*[]}
         */
        this.grid = [];

    }

    /**
     *
     * @param {number} dt
     */
    advance(dt) {
        const particles = this.particles;
        const grid = this.grid;

        // Reset grid
        const gridSize = (n + 1) * (n + 1);

        for (let i = 0; i < gridSize; i++) {
            grid[i] = [0, 0, 0];
        }

        /**
         * M2
         * @type {number[]}
         */
        const m2_temp0 = [];

        const w = new Float32Array(dimensions * 3);

        /**
         *
         * @type {number[]}
         */
        const r = [];

        /**
         * M2
         * @type {number[]}
         */
        const stress = [];

        /**
         * M2
         * @type {number[]}
         */
        const affine = [];


        /**
         * v3
         * @type {number[]}
         */
        const mv = [];

        /**
         * M2
         * @type {number[]}
         */
        const F = [];

        /**
         * M2
         * @type {number[]}
         */
        const svd_u = [];

        /**
         * M2
         * @type {number[]}
         */
        const sig = [];

        /**
         * M2
         * @type {number[]}
         */
        const svd_v = [];

        // 1. Particles to grid
        for (let p of particles) {
            const particle_position = p.x;

            const particle_position_x = particle_position[0];
            const particle_position_y = particle_position[1];

            // element-wise floor
            const base_coordinate_x = (particle_position_x * inv_dx - 0.5) | 0;
            const base_coordinate_y = (particle_position_y * inv_dx - 0.5) | 0;

            // base position in grid units
            const fx_x = particle_position_x * inv_dx - base_coordinate_x;
            const fx_y = particle_position_y * inv_dx - base_coordinate_y;

            // Quadratic kernels  [http://mpm.graphics   Eqn. 123, with x=fx, fx-1,fx-2]

            const w0_x0 = (1.5 - fx_x);
            w[0] = 0.5 * w0_x0 * w0_x0;

            const w0_y0 = (1.5 - fx_y);
            w[1] = 0.5 * w0_y0 * w0_y0;

            const w1_x0 = (fx_x - 1);
            w[2] = 0.75 - w1_x0 * w1_x0;

            const w1_y0 = (fx_y - 1);
            w[3] = 0.75 - w1_y0 * w1_y0;

            const w2_x0 = (fx_x - 0.5);
            w[4] = 0.5 * w2_x0 * w2_x0;

            const w2_y0 = (fx_y - 0.5);
            w[5] = 0.5 * w2_y0 * w2_y0;

            // Snow-like hardening
            const e = Math.exp(hardening * (1.0 - p.Jp));
            const mu = mu_0 * e;
            const lambda = lambda_0 * e;

            // Cauchy stress times dt and inv_dx
            // original taichi: stress = -4*inv_dx*inv_dx*dt*vol*( 2*mu*(p.F-r)*transposed(p.F) + lambda*(J-1)*J )
            // (in taichi matrices are coded transposed)
            const J = determinant(p.F); // Current volume
            polar_decomp_noS(r, p.F); // Polar decomp. for fixed corotated model
            const k1 = -4 * inv_dx * inv_dx * dt * vol;
            const k2 = lambda * (J - 1) * J;


            //compute stress
            m2_sub_ta(m2_temp0, p.F, r);

            m2_multiply(m2_temp0, m2_temp0, p.F);

            m2_multiply_scalar(stress, m2_temp0, 2 * mu);

            m2_temp0[0] = k2;
            m2_temp0[1] = 0;
            m2_temp0[2] = 0;
            m2_temp0[3] = k2;

            m2_add(stress, stress, m2_temp0);
            m2_multiply_scalar(stress, stress, k1);

            //compute affine
            m2_multiply_scalar(m2_temp0, p.C, particle_mass);
            m2_add(affine, stress, m2_temp0);

            // translational momentum
            mv[0] = p.v[0] * particle_mass;
            mv[1] = p.v[1] * particle_mass;
            mv[2] = particle_mass;

            for (let i = 0; i < 3; i++) {
                const grid_x = base_coordinate_x + i;

                if (grid_x < 0 || grid_x >= n) {
                    continue;
                }

                const i2 = i * 2;
                const dpos_x = (i - fx_x) * dx;


                for (let j = 0; j < 3; j++) { // scatter to grid

                    const grid_y = base_coordinate_y + j;


                    if (grid_y < 0 || grid_y >= n) {
                        continue;
                    }

                    const j2 = j * 2;

                    const dpos_y = (j - fx_y) * dx;

                    const ii = gridIndex(grid_x, grid_y);

                    const weight = w[i2] * w[j2 + 1];

                    const grid_cell = grid[ii];

                    grid_cell[0] = grid_cell[0] + (mv[0] + affine[0] * dpos_x + affine[2] * dpos_y) * weight;
                    grid_cell[1] = grid_cell[1] + (mv[1] + affine[1] * dpos_x + affine[3] * dpos_y) * weight;
                    grid_cell[2] = grid_cell[2] + mv[2] * weight;

                }
            }
        }

        // Modify grid velocities to respect boundaries
        const boundary = 0.05;
        for (let i = 0; i <= n; i++) {
            for (let j = 0; j <= n; j++) { // for all grid nodes
                const ii = gridIndex(i, j);
                const cell = grid[ii];

                if (cell[2] > 0) { // no need for epsilon here

                    // normalize by mass
                    cell[0] = cell[0] / cell[2];
                    cell[1] = cell[1] / cell[2];
                    cell[2] = cell[2] / cell[2];

                    // add gravity
                    cell[1] = cell[1] - 200 * dt;

                    const x = i / n;
                    const y = j / n; // boundary thickness, node coord

                    // stick
                    if (x < boundary || x > 1 - boundary || y > 1 - boundary) {
                        cell[0] = 0;
                        cell[1] = 0;
                        cell[2] = 0;
                    }

                    // separate
                    if (y < boundary && cell[1] < 0) {
                        cell[1] = 0.0;
                    }
                }
            }
        }

        // 2. Grid to particle
        for (let p of particles) {

            const particle_position = p.x;

            const particle_position_x = particle_position[0];
            const particle_position_y = particle_position[1];

            // element-wise floor
            const base_coordinate_x = (particle_position_x * inv_dx - 0.5) | 0;
            const base_coordinate_y = (particle_position_y * inv_dx - 0.5) | 0;

            // base position in grid units
            const fx_x = particle_position_x * inv_dx - base_coordinate_x;
            const fx_y = particle_position_y * inv_dx - base_coordinate_y;

            // Quadratic kernels  [http://mpm.graphics   Eqn. 123, with x=fx, fx-1,fx-2]

            const w0_x0 = (1.5 - fx_x);
            w[0] = 0.5 * w0_x0 * w0_x0;

            const w0_y0 = (1.5 - fx_y);
            w[1] = 0.5 * w0_y0 * w0_y0;

            const w1_x0 = (fx_x - 1);
            w[2] = 0.75 - w1_x0 * w1_x0;

            const w1_y0 = (fx_y - 1);
            w[3] = 0.75 - w1_y0 * w1_y0;

            const w2_x0 = (fx_x - 0.5);
            w[4] = 0.5 * w2_x0 * w2_x0;

            const w2_y0 = (fx_y - 0.5);
            w[5] = 0.5 * w2_y0 * w2_y0;

            //clear
            p.C[0] = 0;
            p.C[1] = 0;
            p.C[2] = 0;
            p.C[3] = 0;

            p.v[0] = 0;
            p.v[1] = 0;

            for (let i = 0; i < 3; i++) {
                const i2 = i * 2;
                const dpos_x = i - fx_x;

                for (let j = 0; j < 3; j++) {

                    const j2 = j * 2;
                    const dpos_y = j - fx_y;

                    const ii = gridIndex(base_coordinate_x + i, base_coordinate_y + j);

                    const grid_cell = grid[ii];

                    const weight = w[i2] * w[j2 + 1];

                    // velocity
                    const wx = grid_cell[0] * weight;
                    const wy = grid_cell[1] * weight;

                    p.v[0] = p.v[0] + wx;
                    p.v[1] = p.v[1] + wy;

                    const inv_dx4 = 4 * inv_dx;

                    // APIC (affine particle-in-cell); p.C is the affine momentum
                    // outer product
                    p.C[0] = p.C[0] + wx * dpos_x * inv_dx4;
                    p.C[1] = p.C[1] + wy * dpos_x * inv_dx4;
                    p.C[2] = p.C[2] + wx * dpos_y * inv_dx4;
                    p.C[3] = p.C[3] + wy * dpos_y * inv_dx4;

                }
            }

            // advection
            p.x[0] = p.x[0] + p.v[0] * dt;
            p.x[1] = p.x[1] + p.v[1] * dt;

            // MLS-MPM F-update
            // original taichi: F = (Mat(1) + dt * p.C) * p.F
            m2_multiply_scalar(m2_temp0, p.C, dt);
            m2_add(m2_temp0, m2_indentity, m2_temp0);
            m2_multiply(F, p.F, m2_temp0);

            // Snow-like plasticity
            svd(svd_u, m2_temp0, svd_v, sig, F);

            for (let i = 0; i < 2 * plastic; i++) {
                sig[i + 2 * i] = clamp(sig[i + 2 * i], 1.0 - 2.5e-2, 1.0 + 7.5e-3);
            }

            const oldJ = determinant(F);
            // original taichi: F = svd_u * sig * transposed(svd_v)
            m2_multiply(m2_temp0, svd_u, sig);
            m2_multiply_t(p.F, m2_temp0, svd_v);
            const Jp_new = clamp(p.Jp * oldJ / determinant(p.F), 0.6, 20.0);
            p.Jp = Jp_new;
        }
    }

    add_rnd_square(center, c) {
        const particles = this.particles;

        for (let i = 0; i < 2000; i++) {
            // Randomly sample 1000 particles in the square
            particles.push(new Particle(add2D([(Math.random() * 2 - 1) * 0.08, (Math.random() * 2 - 1) * 0.08], center), c));
        }
    }
}

const n = 80; // grid resolution (cells)
const dt = 1e-4; // time step for simulation
const dx = 1.0 / n; // cell width
const inv_dx = 1.0 / dx; // number of cells as a real number

// material constants
const particle_mass = 1.0;
const vol = 1.0; // particle volume
const hardening = 10.0; // hardening constant for snow plasticity under compression
const E = 1e+4; // Young's modulus
const nu = 0.2; // Poisson's ratio
const mu_0 = E / (2 * (1 + nu)); // Shear modulus (or Dynamic viscosity in fluids)
const lambda_0 = E * nu / ((1 + nu) * (1 - 2 * nu)); // Lamé's 1st parameter \lambda=K-(2/3)\mu, where K is the Bulk modulus
const plastic = 1; // whether (1=true) or not (0=false) to simulate plasticity

function Particle(x, c) {
    return {
        x: x, // position
        v: [0, 0], // velocity
        F: [1, 0, 0, 1], // Deformation tensor
        C: [0, 0, 0, 0], // Cauchy tensor
        Jp: 1, // Jacobian determinant (scalar)
        c: c // color (int)
    }
}

function gridIndex(i, j) {
    return i + (n + 1) * j;
}

