precision mediump float;

uniform sampler2D u_texture;

uniform vec2 u_textureSize;
uniform vec2 u_pixelSize;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_color0;
uniform float u_sharpnessA;
uniform float u_sharpnessB;

varying vec2 v_texCoord;

void main() {

    vec4 texValue = texture2D(u_texture,v_texCoord);

    float greenFac = smoothstep(0.0+u_sharpnessA,1.0-u_sharpnessA,texValue.g);
    float blueFac = smoothstep(0.0+u_sharpnessB,1.0-u_sharpnessB,texValue.b);

    vec3 AB_bFac = mix(u_colorA,u_colorB,blueFac);
    vec3 B0 = mix(u_color0,u_colorB,blueFac);
    vec3 finalColor = mix(B0,AB_bFac,greenFac);

    

    gl_FragColor = vec4((finalColor),1.0);

    // gl_FragColor = vec4(1.0,greenFac, 1.0-blueFac, 1.0);

}