varying vec3 vVertexPosition;
uniform vec3 Background;
uniform float scaleX;
uniform float scaleY;
uniform float shiftX;
uniform float shiftY;
uniform float LineWidth;
uniform int NumPolys;
uniform int PolySides;
uniform float Spacing;
uniform float Rotation;

uniform sampler2D DataTexture;
uniform int NumPoints;

float expScaleX = exp(scaleX);
float expScaleY = exp(scaleY);

float DOUBLE_EPS = 0.00000001;

float sqr(float x) { return x * x; }
float dist2(vec2 v, vec2 w) { return sqr(v.x - w.x) + sqr(v.y - w.y); }
float distToSegmentSquared(vec2 v, vec2 w, vec2 p) {
  float l2 = dist2(v, w);
  if (l2 < DOUBLE_EPS) { return dist2(p, v); }
  float t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  if (t < 0.0) return dist2(p, v);
  if (t > 1.0) return dist2(p, w);
  return dist2(p, vec2(v.x + t * (w.x - v.x),
                       v.y + t * (w.y - v.y)));
}

float illuminationFromLine(vec2 p1, vec2 p2, vec2 p, float thickness) {
	return thickness/distToSegmentSquared(p1, p2, p);
}

void main(void)
{
    vec2 p = vVertexPosition.xy * vec2(expScaleX, expScaleY) + vec2(shiftX, shiftY);
	p -= vec2(0.0, 0.40);
	
	float dist = 0.0;
	for (int i = 0; i < 256; i += 2) {
		if (i >= NumPoints) {
			break;
		}
		dist += illuminationFromLine(
			texture2D(DataTexture, vec2(float(i)/256.0, 0)).rg,
			texture2D(DataTexture, vec2(float(i+1)/256.0, 0)).rg,
			p,
			LineWidth);
	}
	gl_FragColor = vec4(dist*vec3(0.36,0.32,0.15) + Background,1.0);	
}

