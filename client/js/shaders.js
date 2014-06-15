var shaderNames = [
	"test", 
	"cortex",
	"eggholder",
    "noise",
    "noisebands",
    "spiral",
    "cocoon",
	//"grainmarch"
];

var dependencies = [ "text!shaders/vertex/default.glsl" ];
shaderNames.forEach(function (name) { 
	dependencies.push("js/shaders/fragment/" + name + ".js");
	dependencies.push("text!shaders/fragment/" + name + ".glsl");
});

define(dependencies, function(defaultVertexShader) { 

	var shaders = {};

	for (var ii = 1; ii < arguments.length; ii += 2) {
		var shader = arguments[ii];
		shader.fragment = arguments[ii+1];
		shaders[shader.name] = shader;
	}

    function getShaderNames()
    {
    	var names = [];
    	for (key in shaders) {
    		names.push(key);
    	}
    	return names;
    }

    function createShaderMaterial(name) {
    	if (!(name in shaders)) {
    		return null;
    	}
    	return new THREE.ShaderMaterial({
        	uniforms: shaders[name].uniforms,
	        attributes: {
                    position3d: { type: 'v3', value: [] }
    		},
    	    vertexShader: defaultVertexShader,
        	fragmentShader: shaders[name].fragment,
        	side: THREE.DoubleSide
    	});
    }

    function createShaderControls(name) {
		if (!(name in shaders)) {
    		return null;
    	}
    	var uniforms = shaders[name].uniforms;

        var options = { autoPlace: false };
        if ("presets" in shaders[name]) {
            options.load = shaders[name].presets;
        }

    	var gui = new dat.GUI(options);

    	var adapter = {};
        var folders = {};

    	for (uniformName in uniforms) {
    		var uniform = uniforms[uniformName];
    		var param = null;
            var guiContainer = gui;

            if ("folder" in uniform) {
                if (!(uniform.folder in folders)) {
                    folders[uniform.folder] = gui.addFolder(uniform.folder);
                }
                guiContainer = folders[uniform.folder];
            }

    		if (uniform.value instanceof THREE.Vector3) {
    			// color picker, convert from GLSL rep
    			Object.defineProperty(adapter, uniformName, {
		    		get: (function(u) { return function() { 
		    			return u.value.toArray().map(function (e) { return e*255; }); 
		    		}})(uniform),
		    		set: (function(u) { return function(newValue) { 
		    			u.value.set(newValue[0]/255, newValue[1]/255, newValue[2]/255);
		    		}})(uniform)
		    	});
		    	param = guiContainer.addColor(adapter, uniformName);
    		} else {
		    	Object.defineProperty(adapter, uniformName, {
		    		get: (function(u) { return function() { return u.value; }})(uniform),
		    		set: (function(u) { return function(newValue) { u.value = newValue; }})(uniform)
		    	});
		    	param = guiContainer.add(adapter, uniformName);
		    }


	    	if ("min" in uniform) {
	    		param.min(uniform.min);
	    	}
	    	if ("max" in uniform) {
	    		param.max(uniform.max);
	    	}
	    	if ("step" in uniform) {
	    		param.step(uniform.step);
	    	}
	    }

        gui.remember(adapter);
	    return gui;
    }

    return {
    	getShaderNames: getShaderNames,
    	createShaderMaterial: createShaderMaterial,
    	createShaderControls: createShaderControls
    };
});
