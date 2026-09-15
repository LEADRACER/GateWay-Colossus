uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float uTime;
uniform float uScrollProgress;
uniform float uIntensity;
uniform vec2 uResolution;

varying vec2 vUv;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float rand(vec3 co) {
    return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 53.539))) * 43758.5453);
}

vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
    vec2 offset = amount * (uv - 0.5) * 0.01;
    float r = texture2D(tex, uv + offset).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - offset).b;
    return vec3(r, g, b);
}

float vignette(vec2 uv, float strength) {
    float dist = distance(uv, vec2(0.5));
    return 1.0 - smoothstep(0.3, 0.8, dist) * strength;
}

float filmGrain(vec2 uv, float time, float intensity) {
    float grain = rand(uv * 100.0 + time * 0.1) * 2.0 - 1.0;
    return grain * intensity;
}

vec3 acesFilmic(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec3 colorGrade(vec3 color, float scrollProgress) {
    float contrast = mix(1.0, 1.15, scrollProgress);
    float saturation = mix(1.0, 1.2, scrollProgress);
    float lift = mix(0.0, 0.02, scrollProgress);
    
    color = (color - 0.5) * contrast + 0.5 + lift;
    
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, saturation);
    
    return color;
}

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    vec4 bloomColor = texture2D(tBloom, vUv);
    
    color.rgb += bloomColor.rgb * uIntensity;
    
    float caAmount = mix(0.0, 0.8, uScrollProgress * 0.5);
    color.rgb = chromaticAberration(tDiffuse, vUv, caAmount);
    color.rgb += bloomColor.rgb * uIntensity;
    
    color.rgb = colorGrade(color.rgb, uScrollProgress);
    
    float vig = vignette(vUv, mix(0.15, 0.35, uScrollProgress));
    color.rgb *= vig;
    
    float grainIntensity = mix(0.015, 0.03, uScrollProgress);
    color.rgb += filmGrain(vUv, uTime, grainIntensity);
    
    color.rgb = acesFilmic(color.rgb);
    
    float exposure = mix(1.0, 1.2, uScrollProgress * 0.3);
    color.rgb *= exposure;
    
    gl_FragColor = vec4(color.rgb, 1.0);
}