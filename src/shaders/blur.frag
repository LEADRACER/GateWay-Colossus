uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform vec2 uDirection;
uniform float uRadius;

varying vec2 vUv;

void main() {
    vec4 sum = vec4(0.0);
    float totalWeight = 0.0;
    
    int samples = 16;
    float halfSamples = float(samples) * 0.5;
    
    for (int i = 0; i < 16; i++) {
        float offset = float(i) - halfSamples + 0.5;
        vec2 sampleUv = vUv + uDirection * offset * uRadius / uResolution;
        
        float weight = exp(-0.5 * (offset * offset) / (halfSamples * halfSamples * 0.25));
        sum += texture2D(tDiffuse, sampleUv) * weight;
        totalWeight += weight;
    }
    
    gl_FragColor = sum / totalWeight;
}