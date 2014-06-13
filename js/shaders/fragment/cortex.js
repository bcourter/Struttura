define({
	name: "Cortex",
	author: "morphogen",
	uniforms: {
        Time:            { type: "f", min:   0, max:  25, value:  0.5 },
        sVert:           { type: "f", min:   0, max:   1, value:  0.7 },
        sRings:          { type: "f", min:   0, max:   1, value:  0.7 },
        sSpiral:         { type: "f", min:   0, max:   1, value:  0.7 },
        sSpiralAlt:      { type: "f", min:   0, max:   1, value:  0.7 },
        vertPeriod:      { type: "f", min: -20, max:  10, value:  4.0 },
        ringPeriod:      { type: "f", min: -20, max:  20, value: 20.0 },
        spiralPeriod:    { type: "f", min: -20, max:  20, value:  4.0 },
        spiralAltPeriod: { type: "f", min: -20, max:  20, value:  4.0 },
        numVert:         { type: "f", min:   0, max: 100, value:  5.0 },
        numRings:        { type: "f", min:   0, max:  24, value:  5.0 },
        numSpiral:       { type: "f", min:   0, max:  24, value: 24.0, step: 1 },
        numSpiralAlt:    { type: "f", min:   0, max:  24, value:  7.0, step: 1 }
    }
});
