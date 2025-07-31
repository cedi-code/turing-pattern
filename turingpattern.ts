import { AttributeArrayData, AttributeArrayDataWithIndices, AttributeSetter, BufferInfo, myWebglUtils, UniformData, UniformSetter } from "./utils/myWebglUtils.js";
import { Matrix4x4Flat, myMath, Vector3, Vector4, Matrix3x3Flat } from "./utils/myMathUtils.js";
import { primitives } from "./utils/myPrimitives.js";


const sliderSpeed = document.getElementById('speed-slider') as HTMLInputElement;
const btnReset = document.getElementById('reset-btn') as HTMLButtonElement;
const btnPause = document.getElementById('pause-btn') as HTMLButtonElement;
const btnStart = document.getElementById('start-btn') as HTMLButtonElement;
const inputArate = document.getElementById('A-rate') as HTMLInputElement;
const inputBrate = document.getElementById('B-rate') as HTMLInputElement;
const inputFeedrate = document.getElementById('feed-rate') as HTMLInputElement;
const inputKillrate = document.getElementById('kill-rate') as HTMLInputElement;
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
const pixelSize = 10;
const pixelAmount = gl.canvas.width / pixelSize;

// ==== set up data
const octagonData : AttributeArrayDataWithIndices = {
    a_position : { dataArray : [
                            -3,-3,0, // bottom left
                            3,-3,0,   // bottom right
                            -3,3,0, // top left
                            3,3,0  // top right
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

const bufferInfoOctagon = myWebglUtils.createBufferInfoFromArrays(gl, octagonData) as BufferInfo;
const bufferInfoPlane = myWebglUtils.createBufferInfoFromArrays(gl,planeData) as BufferInfo; // this binds indicies!
const left = 0;
const right = gl.canvas.width;
const bottom = gl.canvas.height; // gl.canvas.height is 'bottom' to invert Y-axis
const top = 0;                  
const near = 100;
const far = -100;  

let projectionMatrix = myMath.ortographic(left, right, bottom, top, near, far);
let viewMatrix = myMath.identity(4);


// == Create a texture to render to==
const targetTextureWidth : number = gl.canvas.width;
const targetTextureHeight : number = gl.canvas.height;
const textureA : WebGLTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, textureA);

{
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
const textureB : WebGLTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, textureB);

{
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
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

// make a dpeth buffer and the same size as targetTexture
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

const fb2 : WebGLFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER,fb2);

// attach the texture as first color attachment
gl.framebufferTexture2D(
    gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, textureB, 0
);

const depthBuffer2 = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer2);

// make a dpeth buffer and the same size as targetTexture
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, targetTextureWidth, targetTextureHeight);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer2);

// ====

let targetTexture : WebGLTexture = textureA;
let isTextureB : boolean = false;
let worldM : Matrix4x4Flat = myMath.translation(gl.canvas.width/2.0,gl.canvas.height/2.0,0); //myMath.identity(4);

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
};

sliderSpeed.oninput = (event) => {
    const target = event.target as HTMLInputElement;
    const value : number = parseInt(target.value);

    simSpeed = value;
    simSpeedT = simSpeed * 100;
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
btnReset.onclick = (event) => {
    resetCanvasAndTexture();
    runningSim = false;
    doSimStep = false;
}
btnStart.onclick = (event) => {
    runningSim = true;
    doSimStep = true;
}
btnPause.onclick = (event) => {
    runningSim = false;
    doSimStep = false;
}
resetCanvasAndTexture();

let prevT = 0;
let simSpeed = 10;
let simSpeedT = simSpeed * 100;
let runningSim : boolean = false;
let doSimStep : boolean = false;

function drawScene(time : number) {



    // Setting the difference between timestamp 
    // and the set start point as our progress
    let deltaT = (time - prevT) / 10.0;
    // console.log(deltaT);
    
    prevT = time;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.disable(gl.DEPTH_TEST);

    // gl.enable(gl.CULL_FACE);

    const currentDestFB: WebGLFramebuffer = isTextureB ? fb : fb2; 
    const currentSourceTexture: WebGLTexture = isTextureB ? textureB : textureA; 

    
        // render to our targetTexture by binding frame buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, currentDestFB);


        // tell webgl how to convert from clip space to pixels
        gl.viewport(0,0,targetTextureWidth,targetTextureHeight);

        // clear the attachments
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if(isMouseDown) {
            console.log("inital draw call");
            octagonUniforms.u_color = [0,0,1,1];
            // octagonUniforms.u_world = myMath.multiply(worldM, myMath.scaling(1,1,1));
            draw(programPre,attributeSetterPre,uniformSetterPre,bufferInfoOctagon,octagonUniforms); // <- draw square on texture

            octagonUniforms.u_color = [0,1,0,1];
            // octagonUniforms.u_world = myMath.multiply(worldM, myMath.scaling(0.9,0.9,1));
            
            // draw(programPre,attributeSetterPre,uniformSetterPre,bufferInfoOctagon,octagonUniforms); // <- draw square on texture
        }


        
        // add the blurr to the texture too!
        planeUniforms.u_texture = currentSourceTexture;
        // planeUniforms.u_t = deltaT;
        if(time !== 0 && !isMouseDown)  {
            draw(programPostAction, attributeSetterPostAction, uniformSetterPostAction, bufferInfoPlane, planeUniforms); // <- draws texture
        }

        

        // render to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // normal clip space
        gl.viewport(0,0,gl.canvas.width, gl.canvas.height);

        planeUniforms.u_texture = targetTexture;
        // clear canvas and reset buffers
        // gl.clearColor(1,0,0,1);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        planeUniforms.u_texture = (currentDestFB === fb) ? textureA : textureB; // displays the thing we just renderd too
        
        draw(programPost, attributeSetterPost, uniformSetterPost, bufferInfoPlane, planeUniforms); // <- draws texture

        
    

    isTextureB = !isTextureB; // flip 
    
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
    
    xRelativ = event.pageX;
    yRelativ = event.pageY;

    if(xRelativ > gl.canvas.width || yRelativ > gl.canvas.height) {
        return;
    }

    xRelativ -= gl.canvas.width/2;
    yRelativ -= gl.canvas.height/2;

    let xPixel = Math.round(xRelativ * pixelAmount);
    let yPixel = Math.round(yRelativ * pixelAmount);

    octagonUniforms.u_world =  myMath.multiply(myMath.translation(xRelativ,yRelativ,0.0),worldM);

    //octagonUniforms.u_color = [0,0,1,1];
    
    // draw(programPre,attributeSetterPre,uniformSetterPre,bufferInfoOctagon,octagonUniforms); // <- draw square on texture

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


function bindFramebufferAndSetViewport(fb : WebGLFramebuffer, width : number, height : number) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, width, height);
}


