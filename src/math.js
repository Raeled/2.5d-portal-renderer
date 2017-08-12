function rads(degree) { return degree * (Math.PI / 180.0); }

function vec3DivS(vec, s) { return { x: vec.x / s, y: vec.y / s, z: vec.z / s }; }

function mat4Identity() { return [1,0,0,0,  0,1,0,0,  0,0,1,0,  0,0,0,1]; }
function mat4Translation(vec) { return [1,0,0,vec.x,  0,1,0,vec.y,  0,0,1,vec.z,  0,0,0,1]; }
function mat4Rotation(angle) { return [
    Math.cos(angle), -Math.sin(angle), 0, 0,
    Math.sin(angle),  Math.cos(angle), 0, 0,
                  0,                0, 1, 0,
                  0,                0, 0, 1]; }

function mat4Projection(fov, aspect, near, far) {
    var xx =  0; var xy =  1; var xz =  2; var xw =  3;
    var yx =  4; var yy =  5; var yz =  6; var yw =  7;
    var zx =  8; var zy =  9; var zz = 10; var zw = 11;
    var wx = 12; var wy = 13; var wz = 14; var ww = 15;

    var result = mat4Identity();

    var oneOverDepth = 1.0 / (far - near);

    result[yy] = 1.0 / Math.tan(0.5 * fov);
    result[xx] = 1.0 * result[yy] / aspect;
    result[zz] = far * oneOverDepth;
    result[wz] = (-far * near) * oneOverDepth;
    result[zw] = 1.0;
    result[ww] = 0.0;

    return result;
}

function mat4MulVec2(mat, vec) {
    return {
        x: mat[ 0] * vec.x + mat[ 1] * vec.y + mat[ 2] * 1.0 + mat[ 3] * 1.0,
        y: mat[ 4] * vec.x + mat[ 5] * vec.y + mat[ 6] * 1.0 + mat[ 7] * 1.0,
        z: mat[ 8] * vec.x + mat[ 9] * vec.y + mat[10] * 1.0 + mat[11] * 1.0,
        w: mat[12] * vec.x + mat[13] * vec.y + mat[14] * 1.0 + mat[15] * 1.0
    }
}

function mat4MulVec3(mat, vec) {
    return {
        x: mat[ 0] * vec.x + mat[ 1] * vec.y + mat[ 2] * vec.z + mat[ 3] * 1.0,
        y: mat[ 4] * vec.x + mat[ 5] * vec.y + mat[ 6] * vec.z + mat[ 7] * 1.0,
        z: mat[ 8] * vec.x + mat[ 9] * vec.y + mat[10] * vec.z + mat[11] * 1.0,
        w: mat[12] * vec.x + mat[13] * vec.y + mat[14] * vec.z + mat[15] * 1.0
    }
}

function mat4MulVec4(mat, vec) {
    return {
        x: mat[ 0] * vec.x + mat[ 1] * vec.y + mat[ 2] * vec.z + mat[ 3] * vec.w,
        y: mat[ 4] * vec.x + mat[ 5] * vec.y + mat[ 6] * vec.z + mat[ 7] * vec.w,
        z: mat[ 8] * vec.x + mat[ 9] * vec.y + mat[10] * vec.z + mat[11] * vec.w,
        w: mat[12] * vec.x + mat[13] * vec.y + mat[14] * vec.z + mat[15] * vec.w
    }
}

function mat4MulMat4(left, right) {
    var xx =  0; var xy =  1; var xz =  2; var xw =  3;
    var yx =  4; var yy =  5; var yz =  6; var yw =  7;
    var zx =  8; var zy =  9; var zz = 10; var zw = 11;
    var wx = 12; var wy = 13; var wz = 14; var ww = 15;
    return [
        left[xx] * right[xx] + left[xy] * right[yx] + left[xz] * right[zx] + left[xw] * right[wx],
        left[xx] * right[xy] + left[xy] * right[yy] + left[xz] * right[zy] + left[xw] * right[wy],
        left[xx] * right[xz] + left[xy] * right[yz] + left[xz] * right[zz] + left[xw] * right[wz],
        left[xx] * right[xw] + left[xy] * right[yw] + left[xz] * right[zw] + left[xw] * right[ww],

        left[yx] * right[xx] + left[yy] * right[yx] + left[yz] * right[zx] + left[yw] * right[wx],
        left[yx] * right[xy] + left[yy] * right[yy] + left[yz] * right[zy] + left[yw] * right[wy],
        left[yx] * right[xz] + left[yy] * right[yz] + left[yz] * right[zz] + left[yw] * right[wz],
        left[yx] * right[xw] + left[yy] * right[yw] + left[yz] * right[zw] + left[yw] * right[ww],

        left[zx] * right[xx] + left[zy] * right[yx] + left[zz] * right[zx] + left[zw] * right[wx],
        left[zx] * right[xy] + left[zy] * right[yy] + left[zz] * right[zy] + left[zw] * right[wy],
        left[zx] * right[xz] + left[zy] * right[yz] + left[zz] * right[zz] + left[zw] * right[wz],
        left[zx] * right[xw] + left[zy] * right[yw] + left[zz] * right[zw] + left[zw] * right[ww],

        left[wx] * right[xx] + left[wy] * right[yx] + left[wz] * right[zx] + left[ww] * right[wx],
        left[wx] * right[xy] + left[wy] * right[yy] + left[wz] * right[zy] + left[ww] * right[wy],
        left[wx] * right[xz] + left[wy] * right[yz] + left[wz] * right[zz] + left[ww] * right[wz],
        left[wx] * right[xw] + left[wy] * right[yw] + left[wz] * right[zw] + left[ww] * right[ww]
    ]
}

function linesIntersect(p0, p1, p2, p3) {
    var s1_x = p1.x - p0.x;
    var s1_y = p1.y - p0.y;
    var s2_x = p3.x - p2.x;
    var s2_y = p3.y - p2.y;

    var s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
    var t = ( s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}
