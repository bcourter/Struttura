define({
	name: "Marble",
	author: "bcourter",
	uniforms: {

        PaleBlue:           { type: "v3", value: new THREE.Vector3(0.25, 0.25, 0.35) },
        MediumBlue:         { type: "v3", value: new THREE.Vector3(0.10, 0.10, 0.30) },
        DarkBlue:           { type: "v3", value: new THREE.Vector3(0.05, 0.05, 0.26) },
		DarkerBlue:         { type: "v3", value: new THREE.Vector3(0.03, 0.03, 0.20) },

        scale:              { type: "f", min:   0, max:   200, value:  33 },
        texture:            { type: "f", min:   0, max:   4, value:  2.17 },
        brightness:         { type: "f", min:   0, max:   5, value:  2.85 },

    }
});
