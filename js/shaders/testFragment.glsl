varying vec3 vVertexPosition;

void main( void ) {
    
    gl_FragColor = vec4(1.0, mod(1.0 - vVertexPosition.y, 0.1)/0.25, vVertexPosition.x * 5.0, 1.0);
}
