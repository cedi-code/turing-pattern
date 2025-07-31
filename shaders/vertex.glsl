
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;
varying vec3 v_pos;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {

    vec4 position = (u_projection * u_view * u_world * vec4(a_position.xyz,1.0));

    gl_Position = position;

    v_pos = (u_world * vec4(a_position.xyz,1.0)).rgb;

    v_texCoord = a_texCoord;
}