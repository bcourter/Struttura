var shaderNames = [
	"test"
	, "cortex"
	, "eggholder"
    , "noise"
    , "noisebands"
    , "noisegradient"
    , "wood"
    , "mandelbrot"
    , "marblephase"
    , "mhoonbeam"
    //"spiral",
    //"cocoon",
	//"grainmarch"
];

var dependencies = [ "text!shaders/vertex/default.glsl" ];
shaderNames.forEach(function (name) { 
	dependencies.push("js/shaders/fragment/" + name + ".js");
	dependencies.push("text!shaders/fragment/" + name + ".glsl");
});

define(dependencies, function(defaultVertexShader) { 

	var shaders = {};
    window.shaders = shaders;

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
    	var mat = new THREE.ShaderMaterial({
        	uniforms: shaders[name].uniforms,
	        attributes: {
                    position3d: { type: 'v3', value: [] }
    		},
    	    vertexShader: defaultVertexShader,
        	fragmentShader: shaders[name].fragment,
        	side: THREE.DoubleSide
    	});
        if ("init" in shaders[name]) {
            shaders[name].init(mat);
        }
        if (!("materials" in shaders[name])) {
            shaders[name].materials = [];
        }
        shaders[name].materials.push(mat);
        return mat;
    }

    function updateShader(name) {
        if (!(name in shaders)) {
            return;
        }
        var s = shaders[name];
        if ("update" in s && "materials" in s) {
            for (m in s.materials) {
                s.update(s.materials[m]);
            }
        }
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

        window.gui = gui;
        //gui.useLocalStorage = true;
        gui.remember(adapter);

    	for (uniformName in uniforms) {
    		var uniform = uniforms[uniformName];
    		var param = null;
            var guiContainer = gui;

            if (uniform.hide) {
                continue;
            }

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
    		} else if (uniform.type == "t") {
                continue;
            } else {
		    	Object.defineProperty(adapter, uniformName, {
		    		get: (function(u) { return function() { return u.value; }})(uniform),
		    		set: (function(u) { return function(newValue) { u.value = newValue; }})(uniform)
		    	});
		    	param = guiContainer.add(adapter, uniformName);
		    }

            if (uniform.type == "i") {
                param.step(1.0);
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

	    return gui;
    }

    return {
    	getShaderNames: getShaderNames,
    	createShaderMaterial: createShaderMaterial,
    	createShaderControls: createShaderControls,
        updateShader: updateShader
    };
});
