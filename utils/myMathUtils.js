export { myMath };
const myMath = {
    toRad,
    lerp,
    clamp,
    add,
    subtract,
    multiply,
    multiplyScalar,
    inverse,
    transpose,
    norm,
    squaredNorm,
    normalize,
    lerpV,
    identity,
    // mat3x3
    projection2D,
    // mat4x4 exclusive 
    translation,
    zRotation,
    yRotation,
    xRotation,
    scaling,
    translate,
    zRotate,
    yRotate,
    xRotate,
    scale,
    ortographic,
    perspective,
    lookAt,
};
function toRad(deg) {
    return (deg * Math.PI) / 180.0;
}
function lerp(a, b, t) {
    t = clamp(t, 0.0, 1.0);
    return a * (1.0 - t) + b * t;
}
function clamp(a, min, max) {
    return Math.max(Math.min(a, max), min);
}
function lookAt(position, target, up) {
    let zAxis = normalize(subtract(position, target));
    let xAxis = normalize(cross(up, zAxis));
    let yAxis = normalize(cross(zAxis, xAxis));
    return [
        xAxis[0], xAxis[1], xAxis[2], 0,
        yAxis[0], yAxis[1], yAxis[2], 0,
        zAxis[0], zAxis[1], zAxis[2], 0,
        position[0], position[1], position[2], 1,
    ];
}
function ortographic(left, right, bottom, top, near, far) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
        2.0 / (right - left), 0, 0, 0,
        0, 2.0 / (top - bottom), 0, 0,
        0, 0, 2.0 / (near - far), 0,
        (left + right) / (left - right),
        (bottom + top) / (bottom - top),
        (near + far) / (near - far),
        1,
    ];
}
function perspective(fieldOfViewInRadians, aspect, near, far) {
    let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    let rangeInv = 1.0 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0,
    ];
}
function projection2D(width, height) {
    return [
        2.0 / width, 0, 0,
        0, -2.0 / height, 0,
        -1.0, 1.0, 1,
    ];
}
function translate(m, tx, ty, tz) {
    return multiply(m, translation(tx, ty, tz));
}
function xRotate(m, angleInRad) {
    return multiply(m, xRotation(angleInRad));
}
function yRotate(m, angleInRad) {
    return multiply(m, yRotation(angleInRad));
}
function zRotate(m, angleInRad) {
    return multiply(m, zRotation(angleInRad));
}
function scale(m, sx, sy, sz) {
    return multiply(m, scaling(sx, sy, sz));
}
function scaling(sx, sy, sz) {
    return [
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0,
        0, 0, 0, 1,
    ];
}
function xRotation(angleInRad) {
    let c = Math.cos(angleInRad);
    let s = Math.sin(angleInRad);
    return [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1,
    ];
}
function yRotation(angleInRad) {
    let c = Math.cos(angleInRad);
    let s = Math.sin(angleInRad);
    return [
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1,
    ];
}
function zRotation(angleInRad) {
    let c = Math.cos(angleInRad);
    let s = Math.sin(angleInRad);
    return [
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}
function translation(tx, ty, tz) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        tx, ty, tz, 1,
    ];
}
function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]];
}
function identity(size) {
    if (size === 4) {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    else if (size === 3) {
        return [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
    }
    else if (size === 2) {
        return [
            1, 0,
            0, 1,
        ];
    }
    throw new Error("Invalid matrix size.");
}
function lerpV(a, b, t) {
    if (a.length === 2 && b.length === 2) {
        return [
            lerp(a[0], b[0], t),
            lerp(a[1], b[1], t)
        ];
    }
    if (a.length === 3 && b.length === 3) {
        return [
            lerp(a[0], b[0], t),
            lerp(a[1], b[1], t),
            lerp(a[2], b[2], t)
        ];
    }
    if (a.length === 4 && b.length === 4) {
        return [
            lerp(a[0], b[0], t),
            lerp(a[1], b[1], t),
            lerp(a[2], b[2], t),
            lerp(a[3], b[3], t)
        ];
    }
    throw new Error("Vector sizes do not match.");
}
function add(a, b) {
    if (a.length === 2 && b.length === 2) {
        return [
            a[0] + b[0],
            a[1] + b[1]
        ];
    }
    if (a.length === 3 && b.length === 3) {
        return [
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2]
        ];
    }
    if (a.length === 4 && b.length === 4) {
        return [
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2],
            a[3] + b[3]
        ];
    }
    throw new Error("Vector sizes do not match.");
}
function subtract(a, b) {
    if (a.length === 2 && b.length === 2) {
        return [
            a[0] - b[0],
            a[1] - b[1]
        ];
    }
    if (a.length === 3 && b.length === 3) {
        return [
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2]
        ];
    }
    if (a.length === 4 && b.length === 4) {
        return [
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2],
            a[3] - b[3]
        ];
    }
    throw new Error("Vector sizes do not match.");
}
function normalize(a) {
    let length = norm(a);
    if (a.length === 2) {
        if (length > 0.001) {
            return [
                a[0] / length,
                a[1] / length,
            ];
        }
        else {
            return [0, 0];
        }
    }
    if (a.length === 3) {
        if (length > 0.001) {
            return [
                a[0] / length,
                a[1] / length,
                a[2] / length,
            ];
        }
        else {
            return [0, 0, 0];
        }
    }
    if (a.length === 4) {
        if (length > 0.001) {
            return [
                a[0] / length,
                a[1] / length,
                a[2] / length,
                a[3] / length,
            ];
        }
        else {
            return [0, 0, 0, 0];
        }
    }
    throw new Error("Vector sizes do not match.");
}
function norm(a) {
    return Math.sqrt(squaredNorm(a));
}
function squaredNorm(a) {
    let res = 0;
    for (let i = 0; i < a.length; ++i) {
        res += a[i] * a[i];
    }
    return res;
}
function transpose(m) {
    if (m.length === 16) {
        return [
            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15],
        ];
    }
    if (m.length === 9) {
        return [
            m[0], m[3], m[6],
            m[1], m[4], m[7],
            m[2], m[5], m[8],
        ];
    }
    throw new Error("Matrix sizes do not match.");
}
function inverse(m) {
    if (m.length === 16) {
        let m00 = m[0 * 4 + 0];
        let m01 = m[0 * 4 + 1];
        let m02 = m[0 * 4 + 2];
        let m03 = m[0 * 4 + 3];
        let m10 = m[1 * 4 + 0];
        let m11 = m[1 * 4 + 1];
        let m12 = m[1 * 4 + 2];
        let m13 = m[1 * 4 + 3];
        let m20 = m[2 * 4 + 0];
        let m21 = m[2 * 4 + 1];
        let m22 = m[2 * 4 + 2];
        let m23 = m[2 * 4 + 3];
        let m30 = m[3 * 4 + 0];
        let m31 = m[3 * 4 + 1];
        let m32 = m[3 * 4 + 2];
        let m33 = m[3 * 4 + 3];
        let tmp_0 = m22 * m33;
        let tmp_1 = m32 * m23;
        let tmp_2 = m12 * m33;
        let tmp_3 = m32 * m13;
        let tmp_4 = m12 * m23;
        let tmp_5 = m22 * m13;
        let tmp_6 = m02 * m33;
        let tmp_7 = m32 * m03;
        let tmp_8 = m02 * m23;
        let tmp_9 = m22 * m03;
        let tmp_10 = m02 * m13;
        let tmp_11 = m12 * m03;
        let tmp_12 = m20 * m31;
        let tmp_13 = m30 * m21;
        let tmp_14 = m10 * m31;
        let tmp_15 = m30 * m11;
        let tmp_16 = m10 * m21;
        let tmp_17 = m20 * m11;
        let tmp_18 = m00 * m31;
        let tmp_19 = m30 * m01;
        let tmp_20 = m00 * m21;
        let tmp_21 = m20 * m01;
        let tmp_22 = m00 * m11;
        let tmp_23 = m10 * m01;
        var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
            (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
        var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
            (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
        var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
            (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
        var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
            (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);
        var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
        return [
            d * t0,
            d * t1,
            d * t2,
            d * t3,
            d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
                (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
            d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
                (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
            d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
                (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
            d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
                (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
            d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
                (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
            d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
                (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
            d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
                (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
            d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
                (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
            d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
                (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
            d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
                (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
            d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
                (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
            d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
                (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
        ];
    }
    if (m.length === 9) {
        let m00 = m[0 * 3 + 0];
        let m01 = m[0 * 3 + 1];
        let m02 = m[0 * 3 + 2];
        let m10 = m[1 * 3 + 0];
        let m11 = m[1 * 3 + 1];
        let m12 = m[1 * 3 + 2];
        let m20 = m[2 * 3 + 0];
        let m21 = m[2 * 3 + 1];
        let m22 = m[2 * 3 + 2];
        let det = m00 * (m11 * m22 - m12 * m21) -
            m01 * (m10 * m22 - m12 * m20) +
            m02 * (m10 * m21 - m11 * m20);
        if (Math.abs(det) < 1e-10) {
            throw new Error("Matrix is singular and cannot be inverted.");
        }
        let invDet = 1.0 / det;
        return [
            invDet * (m11 * m22 - m12 * m21),
            invDet * (m02 * m21 - m01 * m22),
            invDet * (m01 * m12 - m02 * m11),
            invDet * (m12 * m20 - m10 * m22),
            invDet * (m00 * m22 - m02 * m20),
            invDet * (m02 * m10 - m00 * m12),
            invDet * (m10 * m21 - m11 * m20),
            invDet * (m01 * m20 - m00 * m21),
            invDet * (m00 * m11 - m01 * m10)
        ];
    }
    throw new Error("Matrix sizes do not match.");
}
function multiplyScalar(a, s) {
    for (let i = 0; i < a.length; i++) {
        a[i] = s * a[i];
    }
    return a;
}
function multiply(a, b) {
    /// Mat3x3 * Vec3 
    if (a.length === 3 && b.length === 9) {
        let dst = [0, 0, 0];
        for (let i = 0; i < 3; ++i) {
            dst[i] = 0.0;
            for (var j = 0; j < 3; ++j) {
                dst[i] += a[j] * b[j * 4 + i];
            }
        }
        return dst;
    }
    // Mat4x4 * Vec4
    if (a.length === 4 && b.length === 16) {
        let dst = [0, 0, 0, 0];
        for (let i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (var j = 0; j < 4; ++j) {
                dst[i] += a[j] * b[j * 4 + i];
            }
        }
        return dst;
    }
    // Mat3x3 * Mat3x3
    if (a.length === 9 && b.length === 9) {
        let a00 = a[0 * 3 + 0];
        let a01 = a[0 * 3 + 1];
        let a02 = a[0 * 3 + 2];
        let a10 = a[1 * 3 + 0];
        let a11 = a[1 * 3 + 1];
        let a12 = a[1 * 3 + 2];
        let a20 = a[2 * 3 + 0];
        let a21 = a[2 * 3 + 1];
        let a22 = a[2 * 3 + 2];
        let b00 = b[0 * 3 + 0];
        let b01 = b[0 * 3 + 1];
        let b02 = b[0 * 3 + 2];
        let b10 = b[1 * 3 + 0];
        let b11 = b[1 * 3 + 1];
        let b12 = b[1 * 3 + 2];
        let b20 = b[2 * 3 + 0];
        let b21 = b[2 * 3 + 1];
        let b22 = b[2 * 3 + 2];
        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    }
    // Mat4x4 * Mat4x4
    if (a.length === 16 && b.length === 16) {
        let b00 = b[0 * 4 + 0];
        let b01 = b[0 * 4 + 1];
        let b02 = b[0 * 4 + 2];
        let b03 = b[0 * 4 + 3];
        let b10 = b[1 * 4 + 0];
        let b11 = b[1 * 4 + 1];
        let b12 = b[1 * 4 + 2];
        let b13 = b[1 * 4 + 3];
        let b20 = b[2 * 4 + 0];
        let b21 = b[2 * 4 + 1];
        let b22 = b[2 * 4 + 2];
        let b23 = b[2 * 4 + 3];
        let b30 = b[3 * 4 + 0];
        let b31 = b[3 * 4 + 1];
        let b32 = b[3 * 4 + 2];
        let b33 = b[3 * 4 + 3];
        let a00 = a[0 * 4 + 0];
        let a01 = a[0 * 4 + 1];
        let a02 = a[0 * 4 + 2];
        let a03 = a[0 * 4 + 3];
        let a10 = a[1 * 4 + 0];
        let a11 = a[1 * 4 + 1];
        let a12 = a[1 * 4 + 2];
        let a13 = a[1 * 4 + 3];
        let a20 = a[2 * 4 + 0];
        let a21 = a[2 * 4 + 1];
        let a22 = a[2 * 4 + 2];
        let a23 = a[2 * 4 + 3];
        let a30 = a[3 * 4 + 0];
        let a31 = a[3 * 4 + 1];
        let a32 = a[3 * 4 + 2];
        let a33 = a[3 * 4 + 3];
        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    }
    throw new Error("Matrix sizes do not match.");
}
