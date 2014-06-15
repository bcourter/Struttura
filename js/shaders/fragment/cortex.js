define({
	name: "Cortex",
	author: "morphogen",
	uniforms: {
		Color1:          { type: "v3", value: new THREE.Vector3(1.0, 0.0, 0.0) },
        Color2:          { type: "v3", value: new THREE.Vector3(0.0, 0.0, 1.0) },
        Shift:           { type: "f", min:  -1, max:   1, value:  0.0 },
        Time:            { type: "f", min:   0, max:  25, value:  0.5 },
        sVert:           { folder: "Lines",  type: "f", min:   0, max:   1, value:  0.7 },
        sHorizon:        { folder: "Lines",  type: "f", min:   0, max:   1, value:  0.0 },
        sDiag:           { folder: "Lines",  type: "f", min:   0, max:   1, value:  0.0 },
        sDiagAlt:        { folder: "Lines",  type: "f", min:   0, max:   1, value:  0.0 },
        sArms:           { folder: "Curves", type: "f", min:   0, max:   1, value:  0.0 },
        sRings:          { folder: "Curves", type: "f", min:   0, max:   1, value:  0.7 },
        sSpiral:         { folder: "Curves", type: "f", min:   0, max:   1, value:  0.7 },
        sSpiralAlt:      { folder: "Curves", type: "f", min:   0, max:   1, value:  0.7 },
        vertPeriod:      { folder: "Lines",  type: "f", min: -20, max:  10, value:  4.0 },
        horizonPeriod:   { folder: "Lines",  type: "f", min: -20, max:  20, value:  4.0 },
        diagPeriod:      { folder: "Lines",  type: "f", min: -20, max:  20, value:  4.0 },
        diagAltPeriod:   { folder: "Lines",  type: "f", min: -20, max:  20, value:  4.0 },
        armPeriod:       { folder: "Curves", type: "f", min: -20, max:  20, value:  4.0 },
        ringPeriod:      { folder: "Curves", type: "f", min: -20, max:  20, value: 20.0 },
        spiralPeriod:    { folder: "Curves", type: "f", min: -20, max:  20, value:  4.0 },
        spiralAltPeriod: { folder: "Curves", type: "f", min: -20, max:  20, value:  4.0 },
        numVert:         { folder: "Lines",  type: "f", min:   0, max:  20, value: 10.0 },
        numHorizon:      { folder: "Lines",  type: "f", min:   0, max:  20, value:  2.0 },
        numDiag:         { folder: "Lines",  type: "f", min:   0, max:  20, value:  2.0 },
        numDiagAlt:      { folder: "Lines",  type: "f", min:   0, max:  20, value:  2.0 },
        numArms:         { folder: "Curves", type: "f", min:   0, max:  24, value:  2.0 },
        numRings:        { folder: "Curves", type: "f", min:   0, max:  24, value:  4.0 },
        numSpiral:       { folder: "Curves", type: "f", min:   0, max:  24, value: 24.0, step: 1 },
        numSpiralAlt:    { folder: "Curves", type: "f", min:   0, max:  24, value:  7.0, step: 1 }
    }
});

