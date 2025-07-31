
export {
    primitives
}

import {AttributeArrayData, AttributeArrayDataWithIndices } from "./myWebglUtils";


const primitives = {
    createCube,
    createSphere,
    createTruncatedCone,
    createOctagon,
}


function createOctagon(size : number = 1) : AttributeArrayDataWithIndices 
{
    const s = size/2;
    const s2 = s/3;

    const positions = [
        -s, -s, 0,    // 0
         s, -s, 0,    // 1
         s,  s, 0,    // 2
        -s,  s, 0,    // 3

        -(s +s2), 0, 0, // 4
        s + s2, 0, 0, // 5
        0,-(s +s2), 0,  // 6
        0,s + s2,0, // 7
        
    ];

    const indices: number[] = [
        0,  1,  2,   0,  2,  3,    // Front
        0, 6, 4,  // bottom-left triangle
        0, 1, 6,  // bottom triangle  
        1, 5, 6,  // bottom-right triangle
        1, 2, 5,  // right triangle
        2, 7, 5,  // top-right triangle
        2, 3, 7,  // top triangle
        3, 4, 7,  // top-left triangle
        3, 0, 4   // left triangle
    ];

    return {
        a_position: {
            dataArray: positions,
            numComponents: 3
        },
        indices: indices
    };

}

// Cube geometry
function createCube(size: number = 1, withIndicies : boolean = true): AttributeArrayDataWithIndices {
    const s = size / 2;

    // Expanded positions for proper normals (24 vertices total)
    // The order of these vertices dictates the order of normals and texCoords
    const expandedPositions = [
        // Front face (0, 1, 2, 3 in terms of indices)
        -s, -s, s,    // 0
         s, -s, s,    // 1
         s,  s, s,    // 2
        -s,  s, s,    // 3

        // Back face (4, 5, 6, 7 in terms of indices)
        -s, -s, -s,   // 4
        -s,  s, -s,   // 5
         s,  s, -s,   // 6
         s, -s, -s,   // 7

        // Top face (8, 9, 10, 11 in terms of indices)
        -s, s, -s,    // 8
        -s, s, s,     // 9
         s, s, s,     // 10
         s, s, -s,    // 11

        // Bottom face (12, 13, 14, 15 in terms of indices)
        -s, -s, -s,   // 12
         s, -s, -s,   // 13
         s, -s, s,    // 14
        -s, -s, s,    // 15

        // Right face (16, 17, 18, 19 in terms of indices)
         s, -s, -s,   // 16
         s,  s, -s,   // 17
         s,  s, s,    // 18
         s, -s, s,    // 19

        // Left face (20, 21, 22, 23 in terms of indices)
        -s, -s, -s,   // 20
        -s, -s, s,    // 21
        -s,  s, s,    // 22
        -s,  s, -s    // 23
    ];


    const positions = [
        // Front face (0, 1, 2, 3 in terms of indices)
        -s, -s, s,    // 0
         s, -s, s,    // 1
         s,  s, s,    // 2
        -s, -s, s,    // 0
         s,  s, s,    // 2
        -s,  s, s,    // 3

        // Back face (4, 5, 6, 7 in terms of indices)
        -s, -s, -s,   // 4
        -s,  s, -s,   // 5
         s,  s, -s,   // 6
        -s, -s, -s,   // 4
         s,  s, -s,   // 6
         s, -s, -s,   // 7

        // Top face (8, 9, 10, 11 in terms of indices)
        -s, s, -s,    // 8
        -s, s, s,     // 9
         s, s, s,     // 10
        -s, s, -s,    // 8
         s, s, s,     // 10
         s, s, -s,    // 11

        // Bottom face (12, 13, 14, 15 in terms of indices)
        -s, -s, -s,   // 12
         s, -s, -s,   // 13
         s, -s, s,    // 14
        -s, -s, -s,   // 12
         s, -s, s,    // 14
        -s, -s, s,    // 15

        // Right face (16, 17, 18, 19 in terms of indices)
         s, -s, -s,   // 16
         s,  s, -s,   // 17
         s,  s, s,    // 18
         s, -s, -s,   // 16
         s,  s, s,    // 18
         s, -s, s,    // 19

        // Left face (20, 21, 22, 23 in terms of indices)
        -s, -s, -s,   // 20
        -s, -s, s,    // 21
        -s,  s, s,    // 22
        -s, -s, -s,   // 20
        -s,  s, s,    // 22
        -s,  s, -s    // 23
    ];

    // Normals must correspond to the order of expandedPositions
    const normals = [
        // Front face (all pointing +Z)
        0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
        // Back face (all pointing -Z)
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
        // Top face (all pointing +Y)
        0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
        // Bottom face (all pointing -Y)
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        // Right face (all pointing +X)
        1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
        // Left face (all pointing -X)
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
    ];

    // Texture coordinates must correspond to the order of expandedPositions
    const texCoords = [
        // Front face (0,0), (1,0), (1,1), (0,1) for a quad
        0, 0,   1, 0,   1, 1,   0, 1,
        // Back face (order might be reversed depending on desired mapping)
        1, 0,   1, 1,   0, 1,   0, 0, // Adjusted for back face to match its vertex order
        // Top face
        0, 1,   0, 0,   1, 0,   1, 1, // Adjusted for top face vertex order
        // Bottom face
        0, 0,   1, 0,   1, 1,   0, 1,
        // Right face
        0, 0,   0, 1,   1, 1,   1, 0, // Adjusted for right face vertex order
        // Left face
        1, 0,   0, 0,   0, 1,   1, 1  // Adjusted for left face vertex order
    ];

    // Indices for the cube (2 triangles per face, referring to the 24 expanded vertices)
    const indices: number[] = [
        0,  1,  2,   0,  2,  3,    // Front
        4,  5,  6,   4,  6,  7,    // Back
        8,  9, 10,   8, 10, 11,    // Top
        12, 13, 14,  12, 14, 15,    // Bottom
        16, 17, 18,  16, 18, 19,    // Right
        20, 21, 22,  20, 22, 23     // Left
    ];

    return {
        a_position: {
            dataArray: withIndicies ? expandedPositions : positions,
            numComponents: 3
        },
        a_normal: {
            dataArray: normals,
            numComponents: 3
        },
        a_texCoord: {
            dataArray: texCoords,
            numComponents: 2
        },
        indices: indices
    };
}

// Sphere geometry
function createSphere(radius: number = 1, latitudeBands: number = 30, longitudeBands: number = 30): AttributeArrayDataWithIndices {
    const positions: number[] = [];
    const normals: number[] = [];
    const texCoords: number[] = [];
    const indices: number[] = [];
    
    // Generate vertices
    for (let latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        const theta = latNumber * Math.PI / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            const phi = longNumber * 2 * Math.PI / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            const u = 1 - (longNumber / longitudeBands);
            const v = 1 - (latNumber / latitudeBands);
            
            positions.push(radius * x, radius * y, radius * z);
            normals.push(x, y, z);
            texCoords.push(u, v);
        }
    }
    
    // Generate indices
    for (let latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (let longNumber = 0; longNumber < longitudeBands; longNumber++) {
            const first = (latNumber * (longitudeBands + 1)) + longNumber;
            const second = first + longitudeBands + 1;
            
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    
    return {
        a_position: {
            dataArray: positions,
            numComponents: 3
        },
        a_normal: {
            dataArray: normals,
            numComponents: 3
        },
        a_texCoord: {
            dataArray: texCoords,
            numComponents: 2
        },
        indices: indices
    };
}

// Truncated cone (frustum) geometry
function createTruncatedCone(
    bottomRadius: number = 1, 
    topRadius: number = 0.5, 
    height: number = 1, 
    radialSegments: number = 16, 
    heightSegments: number = 1
): AttributeArrayDataWithIndices {
    const positions: number[] = [];
    const normals: number[] = [];
    const texCoords: number[] = [];
    const indices: number[] = [];
    
    // Generate vertices
    for (let y = 0; y <= heightSegments; y++) {
        const v = y / heightSegments;
        const yPos = v * height - height / 2;
        const radius = bottomRadius + (topRadius - bottomRadius) * v;
        
        for (let x = 0; x <= radialSegments; x++) {
            const u = x / radialSegments;
            const theta = u * Math.PI * 2;
            
            const xPos = Math.cos(theta) * radius;
            const zPos = Math.sin(theta) * radius;
            
            positions.push(xPos, yPos, zPos);
            
            // Calculate normal
            const slope = (bottomRadius - topRadius) / height;
            const normalX = Math.cos(theta);
            const normalY = slope;
            const normalZ = Math.sin(theta);
            
            // Normalize the normal
            const normalLength = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
            normals.push(normalX / normalLength, normalY / normalLength, normalZ / normalLength);
            
            texCoords.push(u, v);
        }
    }
    
    // Generate side indices
    for (let y = 0; y < heightSegments; y++) {
        for (let x = 0; x < radialSegments; x++) {
            const a = y * (radialSegments + 1) + x;
            const b = a + radialSegments + 1;
            const c = a + 1;
            const d = b + 1;
            
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
    
    // Add bottom cap
    if (bottomRadius > 0) {
        const bottomCenter = positions.length / 3;
        positions.push(0, -height / 2, 0);
        normals.push(0, -1, 0);
        texCoords.push(0.5, 0.5);
        
        for (let i = 0; i < radialSegments; i++) {
            const a = i;
            const b = (i + 1) % radialSegments;
            
            indices.push(bottomCenter, a, b);
        }
    }
    
    // Add top cap
    if (topRadius > 0) {
        const topCenter = positions.length / 3;
        positions.push(0, height / 2, 0);
        normals.push(0, 1, 0);
        texCoords.push(0.5, 0.5);
        
        const topRowStart = heightSegments * (radialSegments + 1);
        for (let i = 0; i < radialSegments; i++) {
            const a = topRowStart + i;
            const b = topRowStart + (i + 1) % radialSegments;
            
            indices.push(topCenter, b, a);
        }
    }
    
    return {
        a_position: {
            dataArray: positions,
            numComponents: 3
        },
        a_normal: {
            dataArray: normals,
            numComponents: 3
        },
        a_texCoord: {
            dataArray: texCoords,
            numComponents: 2
        },
        indices: indices
    };
}

// Export the geometry creation functions
export {
    createCube,
    createSphere,
    createTruncatedCone
};

// Example usage:
/*
const cubeGeometry = createCube(2.0);
const sphereGeometry = createSphere(1.0, 32, 32);
const coneGeometry = createTruncatedCone(1.0, 0.5, 2.0, 16, 4);

// Use with your WebGL utils:
const cubeBufferInfo = myWebglUtils.createBufferInfoFromArrays(gl, cubeGeometry);
const sphereBufferInfo = myWebglUtils.createBufferInfoFromArrays(gl, sphereGeometry);
const coneBufferInfo = myWebglUtils.createBufferInfoFromArrays(gl, coneGeometry);
*/