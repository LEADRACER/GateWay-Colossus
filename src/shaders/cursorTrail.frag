uniform float uTime;
uniform float uTrailLength;

varying float vIndex;
varying float vLength;
varying vec3 vColor;
varying float vProgress;

void main() {
    float progress = vProgress;
    float life = 1.0 - progress;
    
    float alpha = life * life * 0.8;
    alpha *= sin(progress * 3.14159);
    
    float pulse = sin(uTime * 4.0 + vIndex * 0.2) * 0.2 + 0.8;
    alpha *= pulse;
    
    vec3 color = vColor * (1.0 + progress * 0.5);
    color += vec3(progress * 0.3, progress * 0.1, 0.0);
    
    gl_FragColor = vec4(color, alpha);
    
    if (gl_FragColor.a < 0.01) discard;
}