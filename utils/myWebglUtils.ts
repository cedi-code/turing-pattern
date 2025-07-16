export 
{
    UniformSetter,
    UniformData,
    AttributeSetter,
    AttributeInfo,
    AttributeArrayInfo,
    AttributeData,
    AttributeArrayData,
    BufferInfo,
    AttributeArrayDataWithIndices,

    myWebglUtils
}


type UniformSetter = Record<string, (value : any) => void>;
type AttributeSetter = Record<string, (data : AttributeInfo) => void>;
type AttributeData = {[a_name : string] : AttributeInfo};
type UniformData = {[u_name : string] : any};
type AttributeArrayData = {[a_name : string] : AttributeArrayInfo};

// New type for buffer info that includes indices
type BufferInfo = {
    attribs: AttributeData;
    indices?: WebGLBuffer;
    numElements: number;
    elementType?: GLenum; // For index buffer element type (UNSIGNED_BYTE, UNSIGNED_SHORT, UNSIGNED_INT)
};

type AttributeArrayInfo = {
  dataArray: number[]; 
  numComponents: number; 
  type?: GLenum; // e.g., gl.FLOAT, 
  normalize?: boolean; // Defaults to false
  stride?: number; // Defaults to 0
  offset?: number; // Defaults to 0
  drawType? : GLenum;
};

type AttributeInfo = {
  buffer?: WebGLBuffer; 
  numComponents?: number; 
  type?: GLenum; // e.g., gl.FLOAT, 
  normalize?: boolean; // Defaults to false
  stride?: number; // Defaults to 0
  offset?: number; // Defaults to 0

  // Property for constant value attributes
  value?: Float32List; // Represents a constant value (Float32Array, number[], etc.)
};

// Extended array data type that can include indices
type AttributeArrayDataWithIndices =  {

    indices?: number[];
    [a_name : string] : AttributeArrayInfo | number[] | undefined;
};


const myWebglUtils = 
{
    createProgramFromScripts,
    createBufferInfoFromArrays,
    createAttributeSetters,
    createUniformSetters,
    setBuffersAndAttribs,
    bindIndicies,
    setUniforms,
    drawBufferInfo
}



function createShader(gl : WebGLRenderingContext, type : GLenum, source : string) : WebGLShader | null
{
    const shader = gl.createShader(type) as WebGLShader;
    if(!shader) {
        console.error("failed to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if(success) {
        return shader;
    }

    console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);

    return null;
}

async function loadShader(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
}

function createProgram(gl : WebGLRenderingContext, vertexS : WebGLShader, fragmentS : WebGLShader) : WebGLProgram | null {
    const program = gl.createProgram() as WebGLProgram;
    gl.attachShader(program, vertexS);
    gl.attachShader(program,fragmentS);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if(success) {
        return program;
    }
    console.error('program linking failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
}

async function createProgramFromScripts(gl : WebGLRenderingContext, vertexFile : string, fragmentFile : string) : Promise<WebGLProgram | null>
{
    const vertexShaderSourceCode : string = await loadShader(vertexFile);
    const fragmentShaderSourceCode : string = await loadShader(fragmentFile);

    if(vertexShaderSourceCode.charAt(0) === "<") {
        console.error("vertex shader not found! 404");
    }
    if(fragmentShaderSourceCode.charAt(0) === "<") {
        console.error("fragment shader not found! 404");
    }

    const vertexShader = createShader(gl,gl.VERTEX_SHADER, vertexShaderSourceCode);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceCode);

    if(!vertexShader || !fragmentShader) {
        console.error("shader creation failed");
        return null;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);

    if(!program) {
        console.error("program creation failed!");
        return null;
    }

    return program;
}

function createBufferFromTypedArray(gl : WebGLRenderingContext, array : number[], type : GLenum , drawType : GLenum) : WebGLBuffer {
    type = type || gl.ARRAY_BUFFER;
    const buffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(type,buffer);
    gl.bufferData(type, new Float32Array(array), drawType || gl.STATIC_DRAW);
    return buffer;
}



// New function to create BufferInfo from arrays, credit: claude
function createBufferInfoFromArrays(gl: WebGLRenderingContext, arrays: AttributeArrayDataWithIndices): BufferInfo {
    const bufferInfo: BufferInfo = {
        attribs: createAttributeBuffersFromArrays(gl, arrays),
        numElements: 0
    };
    
    if (arrays.indices) {
        bufferInfo.indices = createIndexBuffer(gl, arrays.indices);
        bufferInfo.numElements = arrays.indices.length;
        bufferInfo.elementType = WebGLRenderingContext.UNSIGNED_SHORT;
    } else {
        bufferInfo.numElements = getNumElementsFromNonIndexedArrays(arrays);
    }
    
    return bufferInfo;
}

function createAttributeBuffersFromArrays(gl : WebGLRenderingContext, arrays : AttributeArrayDataWithIndices)  : AttributeData
{
    const data : AttributeData = {};
    Object.keys(arrays).forEach(key => 
    {
        // Skip indices as they're handled separately
        if (key === 'indices') 
        {         
            return;
        }
        
        const attribInfo : AttributeArrayInfo = arrays[key] as AttributeArrayInfo;

        data[key] = 
        {
            buffer : createBufferFromTypedArray(gl,attribInfo.dataArray, gl.ARRAY_BUFFER, attribInfo.drawType ?? gl.STATIC_DRAW),
            numComponents : attribInfo.numComponents,
            type : attribInfo.type,
            normalize : attribInfo.normalize,
            stride : attribInfo.stride,
            offset : attribInfo.offset
        };
    });
    return data;
}

/**
 * @typedef {Object.<string, function>} Setters
 */
function createAttributeSetters(gl : WebGLRenderingContext, program : WebGLProgram) : AttributeSetter {
    
    function createAttributeSetter(
        gl: WebGLRenderingContext,
        program: WebGLProgram,
        attribInfo: WebGLActiveInfo
        ) : (data : AttributeInfo) => void {

        const location = gl.getAttribLocation(program, attribInfo.name);
        if (location === -1) {
            throw new Error(`Cannot find attribute location for ${attribInfo.name}`);
        }

        return (data : AttributeInfo) => {
             if (data.value) {
                // This path is for setting a constant attribute value
                gl.disableVertexAttribArray(location);
                switch (data.value.length) {
                    case 1:
                    gl.vertexAttrib1fv(location, data.value);
                    break;
                    case 2:
                    gl.vertexAttrib2fv(location, data.value);
                    break;
                    case 3:
                    gl.vertexAttrib3fv(location, data.value);
                    break;
                    case 4:
                    gl.vertexAttrib4fv(location, data.value);
                    break;
                    default:
                    throw new Error(`The length of a constant attribute value for ${attribInfo.name} must be between 1 and 4. Got ${data.value.length}.`);
                }
            } 
            // normal
            else if (data.buffer) {
                gl.bindBuffer(gl.ARRAY_BUFFER, data.buffer);
                gl.enableVertexAttribArray(location); 


                const type: GLenum = data.type ?? gl.FLOAT;
                const numComponents: number = data.numComponents ?? attribInfo.size; 
                const normalize: boolean = data.normalize ?? false;
                const stride: number = data.stride ?? 0;
                const offset: number = data.offset ?? 0;

                gl.vertexAttribPointer(location, numComponents, type,normalize,stride,offset);
            } 
            else {
                throw new Error(`Attribute data for ${attribInfo.name} must provide either 'value' or 'buffer'.`);
            }
        }
        }

    const attributeSetter : AttributeSetter = { };
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

    for(let ii : number = 0; ii < numAttributes; ++ii) {
        const attribInfo = gl.getActiveAttrib(program, ii) as WebGLActiveInfo;
        if(!attribInfo) { break; }


        attributeSetter[attribInfo.name] = createAttributeSetter(gl,program,attribInfo);
    }

    return attributeSetter;
}

/**
 * Creates setter functions for all uniforms of a shader
 * program.
 *
 * @see {@link module:webgl-utils.setUniforms}
 *
 * @param {WebGLProgram} program the program to create setters for.
 * @returns {Object.<string, function>} an object with a setter by name for each uniform
 * @memberOf module:webgl-utils
 */
function createUniformSetters(gl : WebGLRenderingContext, program : WebGLProgram) : UniformSetter {

/**
 * Creates a setter for a uniform of the given program with it's
 * location embedded in the setter.
 * @param {WebGLProgram} program
 * @param {WebGLActiveInfo} uniformInfo
 * @returns {function} the created setter.
 */
function createUniformSetter(
    gl: WebGLRenderingContext,
    program: WebGLProgram,
    uniformInfo: WebGLActiveInfo
    ): (v: any) => void {

    
    const location = gl.getUniformLocation(program, uniformInfo.name);
    let textureUnit : number = 0;
    if (location === -1) {
        throw new Error(`Cannot find uniform location for ${uniformInfo.name}`);
    }

    const type = uniformInfo.type;
    const isArray = uniformInfo.size > 1 && uniformInfo.name.slice(-3) === "[0]";

    switch (type) {
        case gl.FLOAT: return isArray
        ? (v: Float32List) => gl.uniform1fv(location, v)
        : (v: number) => gl.uniform1f(location, v);

        case gl.FLOAT_VEC2: return (v: Float32List) => gl.uniform2fv(location, v);
        case gl.FLOAT_VEC3: return (v: Float32List) => gl.uniform3fv(location, v);
        case gl.FLOAT_VEC4: return (v: Float32List) => gl.uniform4fv(location, v);

        case gl.INT: return isArray
        ? (v: Int32List) => gl.uniform1iv(location, v)
        : (v: number) => gl.uniform1i(location, v);

        case gl.INT_VEC2: return (v: Int32List) => gl.uniform2iv(location, v);
        case gl.INT_VEC3: return (v: Int32List) => gl.uniform3iv(location, v);
        case gl.INT_VEC4: return (v: Int32List) => gl.uniform4iv(location, v);

        case gl.BOOL: return (v: Int32List) => gl.uniform1iv(location, v);
        case gl.BOOL_VEC2: return (v: Int32List) => gl.uniform2iv(location, v);
        case gl.BOOL_VEC3: return (v: Int32List) => gl.uniform3iv(location, v);
        case gl.BOOL_VEC4: return (v: Int32List) => gl.uniform4iv(location, v);

        case gl.FLOAT_MAT2: return (v: Float32List) => gl.uniformMatrix2fv(location, false, v);
        case gl.FLOAT_MAT3: return (v: Float32List) => gl.uniformMatrix3fv(location, false, v);
        case gl.FLOAT_MAT4: return (v: Float32List) => gl.uniformMatrix4fv(location, false, v);

        case gl.SAMPLER_2D:
        case gl.SAMPLER_CUBE:
        if (isArray) {
            const units : number[] = [];
            for (let ii = 0; ii < uniformInfo.size; ++ii) {
                units.push(textureUnit++);
            }
            return (textures : WebGLTexture[]) => {
                gl.uniform1iv(location, units);
                textures.forEach((texture, index) => {
                    gl.activeTexture(gl.TEXTURE0 + units[index]);
                    gl.bindTexture(getBindPointForSamplerType(gl, type), texture);
                });
            };
        }
        else {
            const currTextureUnit = textureUnit++;
            return (texture : WebGLTexture) => {
                gl.uniform1i(location, currTextureUnit);
                gl.activeTexture(gl.TEXTURE0 + currTextureUnit);
                gl.bindTexture(getBindPointForSamplerType(gl, type), texture);
            };
      }

        default:
        throw new Error(`Unknown uniform type: 0x${type.toString(16)}`);
    }
}
/**
 * Returns the corresponding bind point for a given sampler type, from webgl-fundamentals
 */
function getBindPointForSamplerType(gl : WebGLRenderingContext, type : number) : number {
    if (type === gl.SAMPLER_2D)   return gl.TEXTURE_2D;        // eslint-disable-line
    if (type === gl.SAMPLER_CUBE) return gl.TEXTURE_CUBE_MAP;  // eslint-disable-line
    throw new Error(`Unknown uniform type: 0x${type.toString(16)}`);
    return -1;
}

const uniformSetters : UniformSetter = { };
const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

for (let ii : number = 0; ii < numUniforms; ++ii) {
    const uniformInfo = gl.getActiveUniform(program, ii) as WebGLActiveInfo;
    if (!uniformInfo) {
    break;
    }
    let name : string = uniformInfo.name;
    // remove the array suffix.
    if (name.slice(-3) === '[0]') {
    name = name.slice(0, name.length - 3);
    }
    const setter = createUniformSetter(gl,program, uniformInfo);
    uniformSetters[name] = setter;
}
return uniformSetters;
}


/*
* Sets all attributes in values
*/
function setBuffersAndAttribs(setter : AttributeSetter, values : AttributeData) 
{
    Object.keys(values).forEach(key => 
    {
        // make sure the key is a attribute that exists 
        if(typeof setter[key] === "function") {
            setter[key](values[key]);
        }
    });  
}

/*
* Set indicies
*/
function bindIndicies(gl : WebGLRenderingContext, bufferInfo: BufferInfo) {
    if(bufferInfo.indices) 
    {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
    }
}




/*
* Sets all the uniforms in values
*/
function setUniforms(setter : UniformSetter, values : UniformData) : void
{
    Object.keys(values).forEach(key => {
        if(typeof setter[key] === "function") {
            setter[key](values[key]);
        }
    });
}


// Helper function to create typed arrays for indices, claude
function makeTypedArrayForIndices(array: number[]): Uint16Array {
    
    return new Uint16Array(array);

}

// Helper function to create index buffer, claude
function createIndexBuffer(gl: WebGLRenderingContext, indices: number[], drawType?: GLenum): WebGLBuffer {
    const buffer = gl.createBuffer() as WebGLBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    
    const typedArray = makeTypedArrayForIndices(indices);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    
    return buffer;
}


// Helper function to get number of elements from non-indexed arrays, claude
function getNumElementsFromNonIndexedArrays(arrays: AttributeArrayDataWithIndices): number {
    let numElements = 0;
    
    for (const key in arrays) {
        const array = arrays[key] as AttributeArrayInfo;
        if (array.dataArray && array.numComponents) {
            const elementsInThisArray = array.dataArray.length / array.numComponents;
            if (numElements === 0) {
                numElements = elementsInThisArray;
            } else if (numElements !== elementsInThisArray) {
                console.warn(`Inconsistent array lengths: ${key} has ${elementsInThisArray} elements, expected ${numElements}`);
            }
        }
    }
    
    return numElements;
}

/*
* Convenience function to draw using BufferInfo, credit claude
*/
function drawBufferInfo(gl: WebGLRenderingContext, bufferInfo: BufferInfo) {
    let primitiveType = gl.TRIANGLES;
    
    if (bufferInfo.indices) {
        const elementCount = bufferInfo.numElements;
        const elementOffset = 0;
        const elementType = bufferInfo.elementType ?? WebGLRenderingContext.UNSIGNED_SHORT;
        
        gl.drawElements(primitiveType, elementCount, elementType, elementOffset);
    } else {
        const vertexCount =  bufferInfo.numElements;
        const vertexOffset = 0;
        
        gl.drawArrays(primitiveType, vertexOffset, vertexCount);
    }
}