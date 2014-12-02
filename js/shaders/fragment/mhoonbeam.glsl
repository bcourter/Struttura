varying vec3 vVertexPosition;
uniform vec3 Background;
uniform float scaleX;
uniform float scaleY;
uniform float shiftX;
uniform float shiftY;
uniform float C;
uniform float LineWidth;
uniform int NumPolys;
uniform int PolySides;
uniform float Spacing;
uniform float Rotation;

uniform sampler2D DataTexture;
uniform int NumPoints;

float expScaleX = exp(scaleX);
float expScaleY = exp(scaleY);

/*
float PI = 3.1415926;

vec2 polyPoints[384];
vec3 polyColors[384];
int lastIndex = 0;

void addPolyPoints(const int sides, float radius, vec2 center, vec3 color) {
	vec2 prevPt = vec2(center.x + radius, 0);
	for (int i = 1; i < sides; i++) {
		float fi = float(i);
		float fsides = float(sides);
  		vec2 currPt = vec2(
  			center.x + radius * cos(2.0 * PI * fi / fsides), 
  			center.y + radius * sin(2.0 * PI * fi / fsides)
  		);
  		int ptIndex = lastIndex + 2 * (i - 1);
  		polyPoints[ptIndex] = prevPt;
  		polyPoints[ptIndex + 1] = currPt;
  		polyColors[ptIndex] = color;
  		polyColors[ptIndex + 1] = color;
	}
	int closeIndex = lastIndex + 2 * (sides - 1);
	polyPoints[closeIndex] = polyPoints[lastIndex + 2 * (sides - 1) + 1];
	polyPoints[closeIndex + 1] = polyPoints[lastIndex];
	polyColors[closeIndex] = color;
	polyColors[closeIndex + 1] = color;
	lastIndex += 2 * sides;
}
*/

vec2 rotate(vec2 v, float alpha)
{
	float vx = v.x*cos(alpha)-v.y*sin(alpha);
	float vy = v.x*sin(alpha)+v.y*cos(alpha);
	v.x = vx;
	v.y = vy;
	return v;
}

float distToLineSquare(vec2 p1, vec2 p2, vec2 p, float thickness)
{
	p -= p1;
	vec2 lineVector = p2-p1;
		
	float angle = -atan(lineVector.y,lineVector.x);
	p = rotate(p,angle);
	
	float dx = 0.0;
	if(p.x<0.0)
		dx = abs(p.x);
	else if(p.x>length(lineVector))
		dx = abs(p.x) - length(lineVector);
		
	return thickness/(dx+abs(p.y));
}

float distToLineRound(vec2 p1, vec2 p2, vec2 p, float thickness)
{
	float d = length(p-p2);
	p -= p1;
	vec2 lineVector = p2-p1;
		
	float angle = -atan(lineVector.y,lineVector.x);
	p = rotate(p,angle);

	if(p.x<0.0)
		d = length(p);
	else if(p.x<length(lineVector))
		d = abs(p.y);
		
	return thickness/d;
}


void main(void)
{
    vec2 p = vVertexPosition.xy * vec2(expScaleX, expScaleY) + vec2(shiftX, shiftY);
	//vec2 p = vVertexPosition.xy;
	p -= vec2(0.0,0.40);
	
	float dist = 0.0;
	for (int i = 0; i < 256; i += 2) {
		if (i >= NumPoints) {
			break;
		}
		dist += distToLineRound(texture2D(DataTexture, vec2(float(i)/256.0, 0)).rg,
								texture2D(DataTexture, vec2(float(i+1)/256.0, 0)).rg,
								p,
								LineWidth);
	}
	gl_FragColor = vec4(dist*vec3(0.36,0.32,0.15) + Background,1.0);

/*
	vec2 o1 = vec2(0.15,0.15);
	vec2 o2 = vec2(0.15,0.1);
	vec2 o3 = vec2(0.4,0.0);
	vec2 o4 = vec2(0.25,0.0);
	
	float angle = 1.0 * C;
	o1 = rotate(o1,angle);
	
	angle = 2.0 * C;
	o2 = rotate(o2,angle);
	float thickness = 0.01;
	float dist1 = 0.0;
	dist1 += distToLineSquare(o1,o2,p,thickness);
	dist1 = max(dist1, distToLineSquare(o1,-o2,p,thickness));
	o1.y *= -1.0;
	o2.y *= -1.0;
    float dist2 = 0.0;
	dist2 = max(dist2, distToLineRound(o1,o2,p,thickness));
	dist2 = max(dist2, distToLineRound(o1,-o2,p,thickness));
	gl_FragColor = vec4(dist1*vec3(0.36,0.32,0.15) + dist2*vec3(0.1, 0.2, 0.8) + Background,1.0);
*/
	
}

