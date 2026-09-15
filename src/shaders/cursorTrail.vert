attribute vec3 position;
attribute vec3 nextPosition;
attribute float index;
attribute float length;
attribute vec3 color;

uniform float uTime;
uniform float uTrailLength;
uniform float uWidth;
uniform vec2 uResolution;

varying float vIndex;
varying float vLength;
varying vec3 vColor;
varying float vProgress;

void main() {
    vIndex = index;
    vLength = length;
    vColor = color;
    vProgress = index / length;
    
    float trailProgress = vProgress;
    float wave = sin(uTime * 3.0 + index * 0.5) * 0.1;
    
    vec3 pos = mix(position, nextPosition, trailProgress);
    pos.z += wave;
    
    float width = uWidth * (1.0 - vProgress) * (0.5 + 0.5 * sin(uTime * 5.0 + index * 0.3));
    
    vec3 dir = normalize(nextPosition - position);
    vec3 perp = normalize(cross(dir, vec3(0.0, 0.0, 1.0)));
    if (length(perp) < 0.1) perp = normalize(cross(dir, vec3(0.0, 1.0, 0.0)));
    
    vec3 offset = perp * width * (gl_InstanceID % 2 == 0 ? 1.0 : -1.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos + offset, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}