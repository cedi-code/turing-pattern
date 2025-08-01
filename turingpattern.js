import { myWebglUtils } from "./utils/myWebglUtils.js";
import { myMath } from "./utils/myMathUtils.js";
const sliderSpeed = document.getElementById('speed-slider');
const btnReset = document.getElementById('reset-btn');
const btnPause = document.getElementById('pause-btn');
const btnStart = document.getElementById('start-btn');
const inputArate = document.getElementById('A-rate');
const inputBrate = document.getElementById('B-rate');
const inputFeedrate = document.getElementById('feed-rate');
const inputKillrate = document.getElementById('kill-rate');
const inputInvert = document.getElementById('invert-check');
const inputDeltaT = document.getElementById('delta-t');
const canvas = document.getElementById('my_canvas');
const gl = canvas?.getContext('webgl');
if (!gl) {
    throw new Error('WebGL not supported');
}
const programPre = await myWebglUtils.createProgramFromScripts(gl, 'shaders/vertex.glsl', 'shaders/fragmentPre.glsl');
if (!programPre) {
    throw new Error('shader program failed');
}
const uniformSetterPre = myWebglUtils.createUniformSetters(gl, programPre);
const attributeSetterPre = myWebglUtils.createAttributeSetters(gl, programPre);
const programPost = await myWebglUtils.createProgramFromScripts(gl, 'shaders/vertex.glsl', 'shaders/fragmentPost.glsl');
if (!programPost) {
    throw new Error('shader program failed');
}
const uniformSetterPost = myWebglUtils.createUniformSetters(gl, programPost);
const attributeSetterPost = myWebglUtils.createAttributeSetters(gl, programPost);
const programPostAction = await myWebglUtils.createProgramFromScripts(gl, 'shaders/vertex.glsl', 'shaders/fragmentPostAction.glsl');
if (!programPostAction) {
    throw new Error('shader program failed');
}
const uniformSetterPostAction = myWebglUtils.createUniformSetters(gl, programPostAction);
const attributeSetterPostAction = myWebglUtils.createAttributeSetters(gl, programPostAction);
const ratio = gl.canvas.width / gl.canvas.height;
let isMouseDown = false;
const pixelSize = 10;
const pixelAmount = gl.canvas.width / pixelSize;
// ==== set up data
const octagonData = {
    a_position: { dataArray: [
            -4, -4, 0, // bottom left
            4, -4, 0, // bottom right
            -4, 4, 0, // top left
            4, 4, 0 // top right
        ],
        numComponents: 3 },
    a_texCoord: { dataArray: [0, 0, 1, 0, 0, 1, 1, 1], numComponents: 2 },
    indices: [0, 1, 2, 2, 1, 3],
};
// primitives.createOctagon(100);
const planeData = {
    a_position: { dataArray: [
            -1, -1, 0, // bottom left
            1, -1, 0, // bottom right
            -1, 1, 0, // top left
            1, 1, 0 // top right
        ],
        numComponents: 3 },
    a_texCoord: { dataArray: [0, 0, 1, 0, 0, 1, 1, 1], numComponents: 2 },
    indices: [0, 1, 2, 2, 1, 3],
};
let projectionMatrix = myMath.identity(4);
resizeCanvasToDisplaySize(gl.canvas);
console.log("canvas:" + gl.canvas.width + "," + gl.canvas.height);
const bufferInfoOctagon = myWebglUtils.createBufferInfoFromArrays(gl, octagonData);
const bufferInfoPlane = myWebglUtils.createBufferInfoFromArrays(gl, planeData); // this binds indicies!
const left = 0;
const right = gl.canvas.width;
const bottom = gl.canvas.height; // gl.canvas.height is 'bottom' to invert Y-axis
const top = 0;
const near = 100;
const far = -100;
projectionMatrix = myMath.ortographic(left, right, bottom, top, near, far);
let viewMatrix = myMath.identity(4);
// == Create a texture to render to==
let targetTextureWidth = gl.canvas.width / 4;
let targetTextureHeight = gl.canvas.height / 4;
const textureA = gl.createTexture();
setTextureProps(textureA);
const textureB = gl.createTexture();
setTextureProps(textureB);
// == ==
// // ==  create frame buffers and bind them ==
const fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
// attach the texture as first color attachment
const attachmentPoint = gl.COLOR_ATTACHMENT0;
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, textureA, 0);
const depthBuffer = gl.createRenderbuffer();
setDepthBufferProps(depthBuffer, fb);
const fb2 = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
// attach the texture as first color attachment
gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, textureB, 0);
const depthBuffer2 = gl.createRenderbuffer();
setDepthBufferProps(depthBuffer2, fb2);
// ====
let targetTexture = textureA;
let isTextureB = false;
let worldM = myMath.identity(4); //myMath.translation(gl.canvas.width/2.0,gl.canvas.height/2.0,0); //myMath.identity(4);
const octagonUniforms = {
    u_projection: projectionMatrix,
    u_view: viewMatrix,
    u_world: worldM,
    u_color: [0, 0, 1, 1],
};
let laplacianM = [
    0.05, 0.2, 0.05,
    0.2, -1.0, 0.2,
    0.05, 0.2, 0.05,
];
const planeUniforms = {
    u_projection: myMath.identity(4),
    u_view: myMath.identity(4),
    u_world: myMath.identity(4),
    u_texture: targetTexture,
    u_color: [1, 1, 1, 1],
    u_feedRate: 0.08,
    u_killRate: 0.065,
    u_aRate: 1.0,
    u_bRate: 0.25,
    u_t: 1.0, // this one gets updated in the main loop
    u_laplacian: laplacianM,
    u_textureSize: [targetTextureWidth, targetTextureHeight],
};
sliderSpeed.oninput = (event) => {
    const target = event.target;
    const value = parseInt(target.value);
    simSteps = value;
};
inputArate.oninput = (event) => {
    const target = event.target;
    const value = parseFloat(target.value);
    planeUniforms.u_aRate = value;
    console.log("set A-rate:" + value);
};
inputBrate.oninput = (event) => {
    const target = event.target;
    const value = parseFloat(target.value);
    planeUniforms.u_bRate = value;
    console.log("set B-rate:" + value);
};
inputKillrate.oninput = (event) => {
    const target = event.target;
    const value = parseFloat(target.value);
    planeUniforms.u_killRate = value;
    console.log("set kill-rate:" + value);
};
inputFeedrate.oninput = (event) => {
    const target = event.target;
    const value = parseFloat(target.value);
    planeUniforms.u_feedRate = value;
    console.log("set feed-rate:" + value);
};
inputDeltaT.oninput = (event) => {
    const target = event.target;
    const value = parseFloat(target.value);
    planeUniforms.u_t = value;
    console.log("set delta T:" + value);
};
inputInvert.oninput = (event) => {
    octagonUniforms.u_color = !inputInvert.checked ? [0, 0, 1, 1] : [0, 1, 0, 1];
    worldM = !inputInvert.checked ? myMath.identity(4) : myMath.scaling(10, 10, 10);
};
btnReset.onclick = (event) => {
    resetCanvasAndTexture();
    runningSim = false;
    doSimStep = false;
};
btnStart.onclick = (event) => {
    runningSim = true;
    doSimStep = true;
};
btnPause.onclick = (event) => {
    runningSim = false;
    doSimStep = false;
};
resetCanvasAndTexture();
let prevT = 0;
let simSteps = 10;
let runningSim = false;
let doSimStep = false;
function drawScene(time) {
    let deltaT = (time - prevT) / 10.0;
    prevT = time;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    for (let i = 0; i < simSteps; ++i) {
        const currentDestFB = isTextureB ? fb : fb2;
        const currentSourceTexture = isTextureB ? textureB : textureA;
        // render to our targetTexture by binding frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, currentDestFB);
        // tell webgl how to convert from clip space to pixels
        gl.viewport(0, 0, targetTextureWidth, targetTextureHeight);
        // clear the attachments
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // add the blurr to the texture too!
        planeUniforms.u_texture = currentSourceTexture;
        // planeUniforms.u_t = deltaT;
        if (time !== 0) {
            draw(programPostAction, attributeSetterPostAction, uniformSetterPostAction, bufferInfoPlane, planeUniforms); // <- draws texture
        }
        if (isMouseDown) {
            console.log("inital draw call");
            draw(programPre, attributeSetterPre, uniformSetterPre, bufferInfoOctagon, octagonUniforms); // <- draw square on texture
        }
        isTextureB = !isTextureB; // flip 
    }
    // render to canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // normal clip space
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    planeUniforms.u_texture = targetTexture;
    // clear canvas and reset buffers
    // gl.clearColor(1,0,0,1);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    planeUniforms.u_texture = (isTextureB) ? textureA : textureB; // displays the thing we just renderd too
    draw(programPost, attributeSetterPost, uniformSetterPost, bufferInfoPlane, planeUniforms); // <- draws texture
    requestAnimationFrame(drawScene);
}
function draw(program, attribSetter, uniSetter, buffer, uniforms) {
    gl.useProgram(program);
    myWebglUtils.setBuffersAndAttribs(attribSetter, buffer.attribs);
    myWebglUtils.bindIndicies(gl, buffer);
    myWebglUtils.setUniforms(uniSetter, uniforms);
    myWebglUtils.drawBufferInfo(gl, buffer);
}
drawScene(0.0);
document.addEventListener('mousedown', function (e) {
    isMouseDown = true;
    handleMouseClick(e); // trigger immediately when pressed
});
document.addEventListener('mouseup', function (e) {
    isMouseDown = false;
});
document.addEventListener('mousemove', function (e) {
    if (isMouseDown) {
        handleMouseClick(e); // continuously trigger while held
    }
});
let xRelativ = 0;
let yRelativ = 0;
function handleMouseClick(event) {
    // const rect = gl.canvas. // Get canvas position and size on screen
    const dpr = window.devicePixelRatio || 1; // Get device pixel ratio
    // Calculate mouse coordinates relative to the canvas's top-left corner (CSS pixels)
    let xDisplayRelativ = event.pageX;
    let yDisplayRelativ = event.pageY;
    // Convert to drawing buffer coordinates (device pixels)
    let xDrawingRelativ = xDisplayRelativ * dpr;
    let yDrawingRelativ = yDisplayRelativ * dpr;
    // Optional: Add bounds check if you don't want clicks outside the drawing area
    if (xDrawingRelativ < 0 || xDrawingRelativ > gl.canvas.width ||
        yDrawingRelativ < 0 || yDrawingRelativ > gl.canvas.height) {
        return;
    }
    octagonUniforms.u_world = myMath.multiply(myMath.translation(xDrawingRelativ, yDrawingRelativ, 0.0), worldM);
    //octagonUniforms.u_color = [0,0,1,1];
    // draw(programPre,attributeSetterPre,uniformSetterPre,bufferInfoOctagon,octagonUniforms); // <- draw square on texture
}
function setTextureProps(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, targetTextureWidth, targetTextureHeight, border, format, type, data);
    // set becaue we dont hav emips and its not filterd?
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}
function setDepthBufferProps(dbuffer, fBuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.bindRenderbuffer(gl.RENDERBUFFER, dbuffer);
    // make a dpeth buffer and the same size as targetTexture
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dbuffer);
}
function resetCanvasAndTexture() {
    console.log("reset canvas");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
window.onresize = (event) => {
    resizeCanvasToDisplaySize(gl.canvas);
    targetTextureWidth = gl.canvas.width / 4.0;
    targetTextureHeight = gl.canvas.height / 4.0;
    setTextureProps(textureA);
    setTextureProps(textureB);
    setDepthBufferProps(depthBuffer, fb);
    setDepthBufferProps(depthBuffer2, fb2);
    planeUniforms.u_textureSize = [targetTextureWidth, targetTextureHeight];
    worldM = myMath.identity(4);
    octagonUniforms.u_world = worldM;
    octagonUniforms.u_projection = projectionMatrix;
    resetCanvasAndTexture();
};
function resizeCanvasToDisplaySize(canv) {
    console.log("resize canvas!");
    const dpr = window.devicePixelRatio;
    const { width, height } = canv.getBoundingClientRect();
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
    const resize = canv.width !== displayWidth || canv.height !== displayHeight;
    if (resize) {
        // resize
        canv.width = displayWidth;
        canv.height = displayHeight;
        projectionMatrix = myMath.ortographic(0, canv.width, canv.height, 0, 100, -100);
    }
    return resize;
}
