
function createFloatDataTexture(size) {
	var data = new Float32Array(size * size * 4);
	var texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
	texture.minFilter = THREE.NearestFilter;
	texture.magFilter = THREE.NearestFilter;
	texture.needsUpdate = true;
	texture.flipY = false;
	return texture;
}

function storePolyPoint(data, index, pt) {
	data[index * 4 + 0] = pt[0];
	data[index * 4 + 1] = pt[1];
	data[index * 4 + 2] = 0.0;
	data[index * 4 + 3] = 0.0;
}

function addPolyPoints(data, lastIndex, sides, radius, rotation, centerx, centery, color) {
	var firstPt = [centerx + radius * Math.cos(rotation), centery + radius * Math.sin(rotation)];
	var prevPt = firstPt.slice(0);
	var currPt = null;

	for (var i = 1; i < sides; i++) {
  		currPt = [
  			centerx + radius * Math.cos(2.0 * Math.PI * i / sides + rotation), 
  			centery + radius * Math.sin(2.0 * Math.PI * i / sides + rotation)
  		];
  		var ptIndex = lastIndex + 2 * (i - 1);
  		storePolyPoint(data, ptIndex, prevPt);
  		storePolyPoint(data, ptIndex + 1, currPt);
  		prevPt = currPt;
	}
	var closeIndex = lastIndex + 2 * (sides - 1);
	storePolyPoint(data, closeIndex, currPt); 
	storePolyPoint(data, closeIndex + 1, firstPt);
	lastIndex += 2 * sides;
	return lastIndex;
}

define({
	name: "Mhoonbeam",
	author: "Dewb",
	uniforms: {
		Background: { type: "v3", value: new THREE.Vector3(0.4, 0.1, 0.7) },
		LineWidth: { type: 'f', min: 0.000001, max: 0.0005, value: 0.00005 },
		NumPolys: { type: 'i', min: 1, max: 24, value: 6 },
		PolySides: { type: 'i', min: 3, max: 12, value: 5 },
		Spacing: { type: 'f', min: 0, max: 0.25, value: 0.035 },
		Rotation: { type: 'f', min: 0, max: Math.PI, value: 1 },
		scaleX: { folder: "Position", type: 'f', min:  -4, max: 4,  value: 0  },
		scaleY: { folder: "Position", type: 'f', min:  -4, max: 4,  value: 0  },
		shiftX: { folder: "Position", type: 'f', min:  -2, max: 2,  value: 0  },
		shiftY: { folder: "Position", type: 'f', min:  -2, max: 2,  value: 0  },
		DataTexture: { type: 't', value: createFloatDataTexture(256) },
		NumPoints: { type: 'i', hide: true, value: 0 }
    },
    init: function(shaderMaterial) {
    },
    update: function(shaderMaterial) {
    	var u = shaderMaterial.uniforms;
    	var tex = u.DataTexture.value;
		
		var lastIndex = 0;
    	var radius = 0.1;
    	var rotation = 0;
    	for (var poly = 0; poly < u.NumPolys.value; poly++) {
	    	lastIndex = addPolyPoints(tex.image.data, lastIndex, u.PolySides.value, radius, rotation, 0, 0, null);
	    	radius += u.Spacing.value;
	    	rotation += u.Rotation.value;
	    }

    	tex.needsUpdate = true;
    	shaderMaterial.uniforms.NumPoints.value = lastIndex;
    }
});