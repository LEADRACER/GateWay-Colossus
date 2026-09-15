varying float vLife;
varying vec3 vColorStart;
varying vec3 vColorEnd;
varying float vSizeStart;
varying float vSizeEnd;
varying vec3 vPosition;
varying vec3 vVelocity;
varying float vNoiseSeed;

uniform float uTime;
uniform float uScrollProgress;

void main() {
    float life = vLife;
    if (life <= 0.0) discard;
    
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv) * 2.0;
    
    float alpha = smoothstep(1.0, 0.0, dist) * life;
    
    float pulse = sin(uTime * 3.0 + vNoiseSeed * 10.0) * 0.1 + 0.9;
    alpha *= pulse;
    
    float velocityAlpha = min(length(vVelocity.xy) * 10.0, 1.0);
    alpha *= 0.5 + velocityAlpha * 0.5;
    
    vec3 color = mix(vColorEnd, vColorStart, life);
    
    float fresnel = pow(1.0 - abs(uv.y), 2.0);
    color += vec3(fresnel * 0.3, fresnel * 0.5, fresnel * 0.8) * life;
    
    float scrollFade = 1.0 - uScrollProgress * 0.8;
    alpha *= scrollFade;
    
    gl_FragColor = vec4(color, alpha);
    
    if (gl_FragColor.a < 0.01) discard;
}