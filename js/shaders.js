define(["text!shaders/vertex/default.glsl", "text!shaders/fragment/test.glsl"], function(vertexShader, fragmentShader) { 

	var uniforms3D = {
                    flatPattern: { type: "f", value: 0.0 },
                };

    var uniforms2D = {
                    flatPattern: { type: "f", value: 1.0 },
                };

    var attributes2D = {
                    position3d: { type: 'v3', value: [] }
    }

    var shaderMaterial3D = new THREE.ShaderMaterial( {
        uniforms: uniforms3D,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide
    } );

    var shaderMaterial2D = new THREE.ShaderMaterial( {
        uniforms: uniforms2D,
        attributes: attributes2D,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide
    } );

    return {
    	shaderMaterial3D: shaderMaterial3D,
    	shaderMaterial2D: shaderMaterial2D
    };
});
