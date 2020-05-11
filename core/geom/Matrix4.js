import { v3Length_i } from "./Vector3.js";

export class Matrix4 {
    /**
     *
     * @constructor
     * @class
     */
    constructor() {
        this.a0 = 1;
        this.a1 = 0;
        this.a2 = 0;
        this.a3 = 0;

        this.b0 = 0;
        this.b1 = 1;
        this.b2 = 0;
        this.b3 = 0;

        this.c0 = 0;
        this.c1 = 0;
        this.c2 = 1;
        this.c3 = 0;

        this.d0 = 0;
        this.d1 = 0;
        this.d2 = 0;
        this.d3 = 1;
    }

    /**
     *
     * @returns {number}
     */
    determinant() {

        var n11 = this.a0, n12 = this.b0, n13 = this.c0, n14 = this.d0;
        var n21 = this.a1, n22 = this.b1, n23 = this.c1, n24 = this.d1;
        var n31 = this.a2, n32 = this.b2, n33 = this.c2, n34 = this.d2;
        var n41 = this.a3, n42 = this.b3, n43 = this.c3, n44 = this.d3;

        //TODO: make this more efficient
        //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

        return (
            n41 * (
                +n14 * n23 * n32
                - n13 * n24 * n32
                - n14 * n22 * n33
                + n12 * n24 * n33
                + n13 * n22 * n34
                - n12 * n23 * n34
            ) +
            n42 * (
                +n11 * n23 * n34
                - n11 * n24 * n33
                + n14 * n21 * n33
                - n13 * n21 * n34
                + n13 * n24 * n31
                - n14 * n23 * n31
            ) +
            n43 * (
                +n11 * n24 * n32
                - n11 * n22 * n34
                - n14 * n21 * n32
                + n12 * n21 * n34
                + n14 * n22 * n31
                - n12 * n24 * n31
            ) +
            n44 * (
                -n13 * n22 * n31
                - n11 * n23 * n32
                + n11 * n22 * n33
                + n13 * n21 * n32
                - n12 * n21 * n33
                + n12 * n23 * n31
            )

        );

    }

    /**
     *
     * @param {Vector3} position
     * @param {Quaternion} rotation
     * @param {Vector3} scale
     */
    compose(position, rotation, scale) {
        var x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;

        var x2 = x + x, y2 = y + y, z2 = z + z;
        var xx = x * x2, xy = x * y2, xz = x * z2;
        var yy = y * y2, yz = y * z2, zz = z * z2;
        var wx = w * x2, wy = w * y2, wz = w * z2;

        var sx = scale.x, sy = scale.y, sz = scale.z;

        this.a0 = (1 - (yy + zz)) * sx;
        this.a1 = (xy + wz) * sx;
        this.a2 = (xz - wy) * sx;
        this.a3 = 0;

        this.b0 = (xy - wz) * sy;
        this.b1 = (1 - (xx + zz)) * sy;
        this.b2 = (yz + wx) * sy;
        this.b3 = 0;

        this.c0 = (xz + wy) * sz;
        this.c1 = (yz - wx) * sz;
        this.c2 = (1 - (xx + yy)) * sz;
        this.c3 = 0;

        this.d0 = position.x;
        this.d1 = position.y;
        this.d2 = position.z;
        this.d3 = 1;
    }

    decompose(position, rotation, scale) {


        var sx = v3Length_i(this.a0, this.a1, this.a2);
        var sy = v3Length_i(this.b0, this.b1, this.b2);
        var sz = v3Length_i(this.c0, this.c1, this.c2);

        // if determine is negative, we need to invert one scale
        var det = this.determinant();
        if (det < 0) sx = -sx;

        position.set(
            this.d0,
            this.d1,
            this.d2
        );

        // scale the rotation part
        var invSX = 1 / sx;
        var invSY = 1 / sy;
        var invSZ = 1 / sz;

        const i_a0 = this.a0 * invSX;
        const i_a1 = this.a1 * invSX;
        const i_a2 = this.a2 * invSX;

        const i_b0 = this.b0 * invSY;
        const i_b1 = this.b1 * invSY;
        const i_b2 = this.b2 * invSY;

        const i_c0 = this.c0 * invSZ;
        const i_c1 = this.c1 * invSZ;
        const i_c2 = this.c2 * invSZ;

        rotation.__setFromRotationMatrix(i_a0, i_b0, i_c0, i_a1, i_b1, i_c1, i_a2, i_b2, i_c2);

        scale.set(sx, sy, sz);
    }

    /**
     *
     * @param {Matrix4} a
     * @param {Matrix4} b
     */
    multiplyMatrices(a, b) {

        const a11 = a.a0, a12 = a.b0, a13 = a.c0, a14 = a.d0;
        const a21 = a.a1, a22 = a.b1, a23 = a.c1, a24 = a.d1;
        const a31 = a.a2, a32 = a.b2, a33 = a.c2, a34 = a.d2;
        const a41 = a.a3, a42 = a.b3, a43 = a.c3, a44 = a.d3;

        const b11 = b.a0, b12 = b.b0, b13 = b.c0, b14 = b.d0;
        const b21 = b.a1, b22 = b.b1, b23 = b.c1, b24 = b.d1;
        const b31 = b.a2, b32 = b.b2, b33 = b.c2, b34 = b.d2;
        const b41 = b.a3, b42 = b.b3, b43 = b.c3, b44 = b.d3;

        this.a0 = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        this.b0 = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        this.c0 = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        this.d0 = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        this.a1 = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        this.b1 = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        this.c1 = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        this.d1 = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        this.a2 = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        this.b2 = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        this.c2 = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        this.d2 = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        this.a3 = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        this.b3 = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        this.c3 = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        this.d3 = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    }

}
