uniform float uTime;
uniform float uMorphFactor;
uniform float uNoiseScale;
uniform float uDisplacement;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uScrollProgress;
uniform float uWireframe;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vDisplacement;
varying vec3 vColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289((x * 34.0 + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

vec3 snoiseVec3(vec3 x) {
    return vec3(snoise(x), snoise(x + 17.0), snoise(x + 43.0));
}

float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    return value;
}

mat3 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(
        oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
    );
}

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    vec3 pos = position;
    vec3 normal = normalize(normal);
    
    float time = uTime * 0.3;
    vec3 noisePos = pos * uNoiseScale + time;
    
    float noise = fbm(noisePos, 4);
    vec3 noiseVec = snoiseVec3(noisePos);
    
    float morph = uMorphFactor * (0.5 + 0.5 * sin(uTime * 0.5));
    float displacement = uDisplacement * noise * morph;
    
    vec3 displacedPos = pos + normal * displacement + noiseVec * displacement * 0.3;
    
    vec3 axis = normalize(vec3(0.3, 1.0, 0.2));
    float rotationAngle = uTime * 0.1 * uMorphFactor;
    mat3 rot = rotationMatrix(axis, rotationAngle);
    displacedPos = rot * displacedPos;
    
    vWorldPosition = (modelMatrix * vec4(displacedPos, 1.0)).xyz;
    vDisplacement = displacement;
    
    float colorMix = (displacement / uDisplacement + 1.0) * 0.5;
    vColor = mix(uColorA, uColorB, colorMix * uMorphFactor);
    
    float scrollScale = mix(1.0, 0.3, uScrollProgress);
    displacedPos *= scrollScale;
    
    vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}