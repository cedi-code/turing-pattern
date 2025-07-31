precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_textureSize;
// simulation parameters
uniform float u_feedRate;
uniform float u_killRate;
uniform float u_aRate;
uniform float u_bRate;
uniform float u_t;
uniform mat3  u_laplacian;

varying vec2 v_texCoord;


vec4 correlation(mat3 k);

void main() {

    
    vec4 currColor = texture2D(u_texture,v_texCoord);

    vec4 laplacianVec = correlation(u_laplacian);  

    float A = currColor.g;
    float B = currColor.b;
    float dA = laplacianVec.g;
    float dB = laplacianVec.b;

    float nA = A + (u_aRate * dA - A * B * B + u_feedRate * (1.0 - A)) * u_t;
    float nB = B + (u_bRate * dB + A * B * B - (u_feedRate + u_killRate) * B) * u_t;

    
    gl_FragColor = vec4(0.0,nA,nB,1.0);

}

// convolution just not flipped
vec4 correlation(mat3 k) {

    vec2 oneP = vec2(1.0,1.0) / u_textureSize;
    vec4 c00 = texture2D(u_texture,v_texCoord + oneP);
    vec4 c01 = texture2D(u_texture,v_texCoord + vec2(0,oneP.y));
    vec4 c02 = texture2D(u_texture,v_texCoord + vec2(-oneP.x,oneP.y));
    vec4 c10 = texture2D(u_texture,v_texCoord + vec2(oneP.x,0));
    // we are pixel 11
    vec4 c11 = texture2D(u_texture,v_texCoord);

    vec4 c12 = texture2D(u_texture, v_texCoord + vec2(-oneP.x,0));
    vec4 c20 = texture2D(u_texture, v_texCoord + vec2(oneP.x,-oneP.y));
    vec4 c21 = texture2D(u_texture, v_texCoord + vec2(0,-oneP.y));
    vec4 c22 = texture2D(u_texture, v_texCoord - oneP);


    return  c00 * k[0][0] + c01 * k[1][0] + c02 * k[2][0] +
            c10 * k[0][1] + c11 * k[1][1] + c12 * k[2][1] +
            c20 * k[0][2] + c21 * k[1][2] + c22 * k[2][2];
}