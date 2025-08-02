import { AttributeArrayData, AttributeArrayDataWithIndices, AttributeSetter, BufferInfo, myWebglUtils, UniformData, UniformSetter } from "./utils/myWebglUtils.js";
import { Matrix4x4Flat, myMath, Vector3, Vector4, Matrix3x3Flat } from "./utils/myMathUtils.js";
import { primitives } from "./utils/myPrimitives.js";


type RDparams = {
    aRate: number,
    bRate: number,
    killRate: number,
    feedRate: number,
    deltaT: number
}

const PATTERNS : RDparams[] = [
    {
        aRate:1.0,
        bRate:0.25,
        killRate:0.065,
        feedRate:0.08,
        deltaT:1.0
    },
    {
        aRate:1.0,
        bRate:0.3,
        killRate:0.065,
        feedRate:0.07,
        deltaT:0.78
    },
    {
        aRate:1.0,
        bRate:0.25,
        killRate:0.058,
        feedRate:0.015,
        deltaT:1.0
    },
    {
        aRate:1.0,
        bRate:0.3,
        killRate:0.045,
        feedRate:0.149,
        deltaT:1.0
    }

];

const sliderSpeed = document.getElementById('speed-slider') as HTMLInputElement;
const btnOpenSettings = document.getElementById('toggleBtn') as HTMLInputElement;
const mainScreen = document.getElementById('my_canvas') as HTMLElement;
const sideContainer = document.getElementById('sideContainer') as HTMLElement;
const btnReset = document.getElementById('reset-btn') as HTMLButtonElement;

const dropboxParamPatterns = document.getElementById('patterns-select') as HTMLSelectElement;

const colorPickerA = document.getElementById('color-A') as HTMLInputElement;
const colorPickerB = document.getElementById('color-B') as HTMLInputElement;
const colorPicker0 = document.getElementById('color-0') as HTMLInputElement;

const sliderSharpA = document.getElementById('sharp-a-slider') as HTMLInputElement;
const sliderSharpB = document.getElementById('sharp-b-slider') as HTMLInputElement;

const inputArate = document.getElementById('A-rate') as HTMLInputElement;
const inputBrate = document.getElementById('B-rate') as HTMLInputElement;
const inputFeedrate = document.getElementById('feed-rate') as HTMLInputElement;
const inputKillrate = document.getElementById('kill-rate') as HTMLInputElement;
const inputInvert = document.getElementById('invert-check') as HTMLInputElement;
const inputDeltaT = document.getElementById('delta-t') as HTMLInputElement;
const canvas = document.getElementById('my_canvas') as HTMLCanvasElement;
const gl = canvas?.getContext('webgl') as WebGLRenderingContext;

if (!gl) {
    throw new Error('WebGL not supported');
}
const programPre = await myWebglUtils.createProgramFromScripts(gl, 'shaders/vertex.glsl', 'shaders/fragmentPre.glsl');
if (!programPre) {
    throw new Error('shader program failed');
}
const uniformSetterPre = myWebglUtils.createUniformSetters(gl, programPre) as UniformSetter;
const attributeSetterPre = myWebglUtils.createAttributeSetters(gl, programPre) as AttributeSetter;

const programPost = await myWebglUtils.createProgramFromScripts(gl, 'shaders/vertex.glsl', 'shaders/fragmentPost.glsl');
if (!programPost) {
    throw new Error('shader program failed');
}
const uniformSetterPost = myWebglUtils.createUniformSetters(gl, programPost) as UniformSetter;
const attributeSetterPost = myWebglUtils.createAttributeSetters(gl, programPost) as AttributeSetter;

const programPostAction = await myWebglUtils.createProgramFromScripts(gl, 'shaders/vertex.glsl', 'shaders/fragmentPostAction.glsl');
if (!programPostAction) {
    throw new Error('shader program failed');
}
const uniformSetterPostAction = myWebglUtils.createUniformSetters(gl, programPostAction) as UniformSetter;
const attributeSetterPostAction = myWebglUtils.createAttributeSetters(gl, programPostAction) as AttributeSetter;

const ratio : number = gl.canvas.width / gl.canvas.height; 

let isMouseDown = false;
let isSettingsOpen = false;
const pixelSize = 10;
const pixelAmount = gl.canvas.width / pixelSize;

// ==== set up data
const octagonData : AttributeArrayDataWithIndices = {
    a_position : { dataArray : [
                            -4,-4,0, // bottom left
                            4,-4,0,   // bottom right
                            -4,4,0, // top left
                            4,4,0  // top right
                         ], 
                    numComponents : 3},
    a_texCoord : { dataArray : [0,0,  1,0,  0,1,  1,1], numComponents : 2},
    indices : [ 0,1,2, 2,1,3 ],
}
 // primitives.createOctagon(100);
const planeData : AttributeArrayDataWithIndices = {
    a_position : { dataArray : [
                            -1,-1,0, // bottom left
                            1,-1,0,   // bottom right
                            -1,1,0, // top left
                            1,1,0  // top right
                         ], 
                    numComponents : 3},
    a_texCoord : { dataArray : [0,0,  1,0,  0,1,  1,1], numComponents : 2},
    indices : [ 0,1,2, 2,1,3 ],
}

let projectionMatrix = myMath.identity(4);
resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

console.log("canvas:" + gl.canvas.width + ","  + gl.canvas.height );

const bufferInfoOctagon = myWebglUtils.createBufferInfoFromArrays(gl, octagonData) as BufferInfo;
const bufferInfoPlane = myWebglUtils.createBufferInfoFromArrays(gl,planeData) as BufferInfo; // this binds indicies!
const left = 0;
const right = gl.canvas.width;
const bottom = gl.canvas.height; // gl.canvas.height is 'bottom' to invert Y-axis
const top = 0;                  
const near = 100;
const far = -100;  

projectionMatrix = myMath.ortographic(left, right, bottom, top, near, far);
let viewMatrix = myMath.identity(4);


// == Create a texture to render to==
let targetTextureWidth : number = gl.canvas.width/4;
let targetTextureHeight : number = gl.canvas.height/4;
const textureA : WebGLTexture = gl.createTexture();

setTextureProps(textureA);


const textureB : WebGLTexture = gl.createTexture();
setTextureProps(textureB);
// == ==

// // ==  create frame buffers and bind them ==
const fb : WebGLFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER,fb);

// attach the texture as first color attachment
const attachmentPoint = gl.COLOR_ATTACHMENT0;
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, textureA, 0
);

const depthBuffer = gl.createRenderbuffer();
setDepthBufferProps(depthBuffer,fb);

const fb2 : WebGLFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER,fb2);

// attach the texture as first color attachment
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, textureB, 0
);

const depthBuffer2 = gl.createRenderbuffer();
setDepthBufferProps(depthBuffer2,fb2);

// ====

let targetTexture : WebGLTexture = textureA;
let isTextureB : boolean = false;
let worldM : Matrix4x4Flat = myMath.identity(4);//myMath.translation(gl.canvas.width/2.0,gl.canvas.height/2.0,0); //myMath.identity(4);

const octagonUniforms : UniformData = {
    u_projection: projectionMatrix,
    u_view: viewMatrix,
    u_world: worldM,
    u_color: [0, 0, 1, 1],
};

let laplacianM : Matrix3x3Flat = [
    0.05, 0.2, 0.05,
    0.2, -1.0, 0.2,
    0.05, 0.2, 0.05,
];

const planeUniforms : UniformData = {
    u_projection: myMath.identity(4),
    u_view: myMath.identity(4),
    u_world: myMath.identity(4),
    u_texture: targetTexture,
    u_color: [1,1,1,1],
    u_feedRate: 0.08,
    u_killRate: 0.065,
    u_aRate: 1.0,
    u_bRate: 0.25,
    u_t: 1.0, // this one gets updated in the main loop
    u_laplacian : laplacianM,
    u_textureSize: [targetTextureWidth, targetTextureHeight],
    u_colorB: [1,0,0],
    u_colorA: [1,1,1],
    u_color0: [1,0,1],
    u_sharpnessA: 0.4,
    u_sharpnessB: 0.1,
};

btnOpenSettings.onclick = () => {
    isSettingsOpen = !isSettingsOpen;
    mainScreen.classList.toggle('pushed');
    sideContainer.classList.toggle('visible');
    btnOpenSettings.textContent = isSettingsOpen ? "X" : "⚙";

}


dropboxParamPatterns.onchange = (object) => {
    const target = object.target as HTMLInputElement;
    changePattern(target);
}
dropboxParamPatterns.onclick = (object) => {
    const target = object.target as HTMLInputElement;
    changePattern(target);
}

function changePattern(target : HTMLInputElement) {

    const currParams : number = parseInt(target.value);
    console.log(currParams);

    if(currParams >= PATTERNS.length) {
        return;
    }

    planeUniforms.u_aRate = PATTERNS[currParams].aRate;
    planeUniforms.u_bRate = PATTERNS[currParams].bRate;
    planeUniforms.u_killRate = PATTERNS[currParams].killRate;
    planeUniforms.u_feedRate = PATTERNS[currParams].feedRate;
    planeUniforms.u_t = PATTERNS[currParams].deltaT;

    inputArate.value = PATTERNS[currParams].aRate.toString();
    inputBrate.value = PATTERNS[currParams].bRate.toString();
    inputKillrate.value = PATTERNS[currParams].killRate.toString();
    inputFeedrate.value = PATTERNS[currParams].feedRate.toString();
    inputDeltaT.value = PATTERNS[currParams].deltaT.toString();
}

colorPickerB.oninput = (object) => {
    const selectedColor = colorPickerB.value;


    planeUniforms.u_colorB = hexToRgb(selectedColor);

}

colorPickerA.oninput = (object) => {
    const selectedColor = colorPickerA.value;

    planeUniforms.u_colorA = hexToRgb(selectedColor);
    
}

colorPicker0.oninput = (object) => {

    const selectedColor = colorPicker0.value;
    console.log(selectedColor);
    document.documentElement.style.setProperty('--accent-color', selectedColor);
    document.documentElement.style.setProperty('--accent-color-hover', selectedColor);
    planeUniforms.u_color0 = hexToRgb(selectedColor);
}

sliderSpeed.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseInt(target.value);

    simSteps = value;
}

sliderSharpA.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value) / 100.0;
    planeUniforms.u_sharpnessA = value;
}

sliderSharpB.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value) / 100.0;
    planeUniforms.u_sharpnessB = value;
}

inputArate.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value);

    planeUniforms.u_aRate = value;
    console.log("set A-rate:" + value);
}

inputBrate.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value);

    planeUniforms.u_bRate = value;
    console.log("set B-rate:" + value);
}

inputKillrate.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value);

    planeUniforms.u_killRate = value;
    console.log("set kill-rate:" + value);
}

inputFeedrate.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value);

    planeUniforms.u_feedRate = value;
    console.log("set feed-rate:" + value);
}

inputDeltaT.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseFloat(target.value);

    planeUniforms.u_t = value;
    console.log("set delta T:" + value);
}
inputInvert.oninput = (event) => {
    octagonUniforms.u_color = !inputInvert.checked ? [0,0,1,1] : [0,1,0,1];
    worldM = !inputInvert.checked ? myMath.identity(4) : myMath.scaling(10,10,10);
}
btnReset.onclick = (event) => {
    resetCanvasAndTexture();
}

resetCanvasAndTexture();

let prevT = 0;
let simSteps = 10;

function drawScene(time : number) {


    let deltaT = (time - prevT) / 10.0;
    
    prevT = time;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.disable(gl.DEPTH_TEST);

    for(let i = 0; i < simSteps; ++i) {
        const currentDestFB: WebGLFramebuffer = isTextureB ? fb : fb2; 
        const currentSourceTexture: WebGLTexture = isTextureB ? textureB : textureA; 

        // render to our targetTexture by binding frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, currentDestFB);


        // tell webgl how to convert from clip space to pixels
        gl.viewport(0,0,targetTextureWidth,targetTextureHeight);

        // clear the attachments
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // add the blurr to the texture too!
        planeUniforms.u_texture = currentSourceTexture;

        // planeUniforms.u_t = deltaT;
        if(time !== 0)  {
            draw(programPostAction, attributeSetterPostAction, uniformSetterPostAction, bufferInfoPlane, planeUniforms); // <- draws texture
        }
        if(isMouseDown) {
            console.log("inital draw call");
            draw(programPre,attributeSetterPre,uniformSetterPre,bufferInfoOctagon,octagonUniforms); // <- draw square on texture
        }
        isTextureB = !isTextureB; // flip 
        
    }
        // render to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // normal clip space
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);

        planeUniforms.u_texture = targetTexture;
        // clear canvas and reset buffers
        // gl.clearColor(1,0,0,1);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        planeUniforms.u_texture = (isTextureB) ? textureA : textureB; // displays the thing we just renderd too
        
        draw(programPost, attributeSetterPost, uniformSetterPost, bufferInfoPlane, planeUniforms); // <- draws texture
    
    requestAnimationFrame(drawScene);
}


function draw(program : WebGLProgram | null, attribSetter : AttributeSetter, uniSetter : UniformSetter, buffer : BufferInfo, uniforms : UniformData) 
{
    gl.useProgram(program);

    myWebglUtils.setBuffersAndAttribs(attribSetter, buffer.attribs);
    myWebglUtils.bindIndicies(gl,buffer);
    myWebglUtils.setUniforms(uniSetter, uniforms);
    myWebglUtils.drawBufferInfo(gl, buffer);
}

drawScene(0.0);




document.addEventListener('mousedown', function(e) {
    isMouseDown = true;
    handleMouseClick(e); // trigger immediately when pressed
});

document.addEventListener('mouseup', function(e) {
    isMouseDown = false;
});

document.addEventListener('mousemove', function(e) {
    if (isMouseDown) {
        handleMouseClick(e); // continuously trigger while held
    }
});
let xRelativ = 0;
let yRelativ = 0;

function handleMouseClick(event : MouseEvent)
{
    
    // const rect = gl.canvas. // Get canvas position and size on screen
    const dpr = window.devicePixelRatio || 1; // Get device pixel ratio

    // Calculate mouse coordinates relative to the canvas's top-left corner (CSS pixels)
    let xDisplayRelativ = event.pageX ;
    let yDisplayRelativ = event.pageY ;

    // Convert to drawing buffer coordinates (device pixels)
    let xDrawingRelativ = xDisplayRelativ * dpr;
    let yDrawingRelativ = yDisplayRelativ * dpr;

    // Optional: Add bounds check if you don't want clicks outside the drawing area
    if (xDrawingRelativ < 0 || xDrawingRelativ > gl.canvas.width ||
        yDrawingRelativ < 0 || yDrawingRelativ > gl.canvas.height) {
        return;
    }

    
    octagonUniforms.u_world = myMath.multiply(myMath.translation(xDrawingRelativ, yDrawingRelativ, 0.0),worldM);

    //octagonUniforms.u_color = [0,0,1,1];
    
    // draw(programPre,attributeSetterPre,uniformSetterPre,bufferInfoOctagon,octagonUniforms); // <- draw square on texture

}

function setTextureProps(texture : WebGLTexture) 
{

    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level : number = 0;
    const internalFormat = gl.RGBA;
    const border : number = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;

    gl.texImage2D(gl.TEXTURE_2D, level,internalFormat,
                  targetTextureWidth,targetTextureHeight,border,
                  format,type,data);

    // set becaue we dont hav emips and its not filterd?
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function setDepthBufferProps(dbuffer : WebGLRenderbuffer, fBuffer : WebGLFramebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.bindRenderbuffer(gl.RENDERBUFFER, dbuffer);

    // make a dpeth buffer and the same size as targetTexture
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, dbuffer);
}

function resetCanvasAndTexture() {

    console.log("reset canvas");

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.clearColor(0,1,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb2);
    gl.clearColor(0,1,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0,1,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}




window.onresize = (event) => {

    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    targetTextureWidth = gl.canvas.width/4.0;
    targetTextureHeight = gl.canvas.height / 4.0;
    setTextureProps(textureA);
    setTextureProps(textureB);
    setDepthBufferProps(depthBuffer,fb);
    setDepthBufferProps(depthBuffer2,fb2);

    planeUniforms.u_textureSize = [ targetTextureWidth, targetTextureHeight];
    worldM = myMath.identity(4); 
    octagonUniforms.u_world = worldM;
    octagonUniforms.u_projection = projectionMatrix;

    resetCanvasAndTexture();
}


function resizeCanvasToDisplaySize(canv : HTMLCanvasElement) : boolean
{
    console.log("resize canvas!");
    const dpr : number = window.devicePixelRatio;
    const {width, height} = canv.getBoundingClientRect();
    const displayWidth : number = Math.round(width * dpr);
    const displayHeight : number = Math.round(height * dpr);

    const resize : boolean = canv.width !== displayWidth || canv.height !== displayHeight;
    if(resize) {
        // resize

        canv.width = displayWidth;
        canv.height = displayHeight;

        projectionMatrix = myMath.ortographic(0, canv.width, canv.height, 0, 100, -100);
    }
    return resize;
}

function hexToRgb(hex : string) : [number,number,number] {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255.0,
    parseInt(result[2], 16) / 255.0,
    parseInt(result[3], 16) / 255.0
 ] : [1,1,1];
}


