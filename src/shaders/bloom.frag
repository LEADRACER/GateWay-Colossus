uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uKnee;

varying vec2 vUv;

void main() {
    vec3 color = texture2D(tDiffuse, vUv).rgb;
    float maxComponent = max(max(color.r, color.g), color.b);
    
    vec3 bloom = max(vec3(0.0), color - uThreshold) * (1.0 / max(uKnee, 0.0001));
    bloom = bloom * bloom;
    
    gl_FragColor = vec4(bloom, 1.0);
}