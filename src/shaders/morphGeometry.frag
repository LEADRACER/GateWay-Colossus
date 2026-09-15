uniform float uTime;
uniform float uScrollProgress;
uniform float uWireframe;
uniform float uFresnelPower;
uniform vec3 uFresnelColor;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vDisplacement;
varying vec3 vColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vWorldPosition);
    
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower);
    
    vec3 baseColor = vColor;
    
    float pulse = sin(uTime * 2.0 + vWorldPosition.x * 5.0 + vWorldPosition.y * 3.0) * 0.05 + 0.95;
    baseColor *= pulse;
    
    vec3 fresnelColor = uFresnelColor * fresnel * (1.0 + vDisplacement * 2.0);
    
    float scrollAlpha = mix(1.0, 0.15, uScrollProgress);
    
    vec3 finalColor = baseColor + fresnelColor;
    
    if (uWireframe > 0.5) {
        float edge = step(0.98, abs(vUv.x - 0.5) + abs(vUv.y - 0.5));
        finalColor = mix(finalColor, uFresnelColor, edge * uWireframe);
    }
    
    float scanline = sin(vWorldPosition.y * 50.0 + uTime * 10.0) * 0.02;
    finalColor += scanline;
    
    finalColor *= scrollAlpha;
    
    gl_FragColor = vec4(finalColor, scrollAlpha * (0.3 + fresnel * 0.7));
    
    if (gl_FragColor.a < 0.01) discard;
}