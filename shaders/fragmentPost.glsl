precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_textureSize;
uniform vec2 u_pixelSize;

varying vec2 v_texCoord;

void main() {

    vec4 texValue = texture2D(u_texture,v_texCoord);

    float greenFac = ceil(texValue.g-0.3);
    float blueFac = ceil(texValue.b-0.3);

    gl_FragColor = texValue;
    // gl_FragColor =  vec4(0.71, 0.2, 0.52, 1.0) * texValue.b + vec4(0.51, 0.0, 0.71, 1.0) * texValue.g;

    // gl_FragColor = vec4(0.0,greenFac, blueFac, 1.0);

}