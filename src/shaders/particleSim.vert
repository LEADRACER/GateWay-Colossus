attribute vec3 position;
attribute vec3 velocity;
attribute vec3 acceleration;
attribute float life;
attribute float maxLife;
attribute vec3 colorStart;
attribute vec3 colorEnd;
attribute float sizeStart;
attribute float sizeEnd;
attribute float noiseSeed;
attribute vec3 curlOffset;

uniform float uTime;
uniform float uDeltaTime;
uniform vec2 uResolution;
uniform vec2 uCursor;
uniform float uCursorForce;
uniform float uScrollProgress;
uniform float uAudioLevel;

varying float vLife;
varying vec3 vColorStart;
varying vec3 vColorEnd;
varying float vSizeStart;
varying float vSizeEnd;
varying vec3 vPosition;
varying vec3 vVelocity;
varying float vNoiseSeed;

vec3 curlNoise(vec3 p) {
    const float eps = 0.01;
    vec3 dx = vec3(eps, 0.0, 0.0);
    vec3 dy = vec3(0.0, eps, 0.0);
    vec3 dz = vec3(0.0, 0.0, eps);
    
    float n = snoise(p);
    float nx = snoise(p + dx);
    float ny = snoise(p + dy);
    float nz = snoise(p + dz);
    
    return vec3(nx - n, ny - n, nz - n) / eps;
}

float snoise(vec3 uv) {
    const vec3 s = vec3(1e0, 1e2, 1e3);
    uv *= 0.5;
    vec3 i = floor(uv);
    vec3 f = fract(uv);
    f = f * f * (3.0 - 2.0 * f);
    vec3 a = fract(sin(i.yzx + i.xzy) * s);
    vec3 b = fract(sin((i + vec3(1.0)).yzx + (i + vec3(1.0)).xzy) * s);
    return 2.0 * mix(mix(mix(a.x, b.x, f.x), mix(a.y, b.y, f.x), f.y),
                     mix(mix(a.z, b.z, f.x), mix(a.w, b.w, f.x), f.y), f.z) - 1.0;
}

vec3 snoiseVec3(vec3 x) {
    const vec3 s = vec3(1e0, 1e2, 1e3);
    x *= 0.5;
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec3 a = fract(sin(i.yzx + i.xzy) * s);
    vec3 b = fract(sin((i + vec3(1.0)).yzx + (i + vec3(1.0)).xzy) * s);
    vec3 c = mix(mix(a.xyz, b.xyz, f.x), mix(a.yzx, b.yzx, f.x), f.y);
    return 2.0 * mix(c.xyz, c.yzx, f.z) - 1.0;
}

void main() {
    vLife = life / maxLife;
    vColorStart = colorStart;
    vColorEnd = colorEnd;
    vSizeStart = sizeStart;
    vSizeEnd = sizeEnd;
    vNoiseSeed = noiseSeed;
    
    vec3 pos = position;
    vec3 vel = velocity;
    vec3 acc = acceleration;
    
    float dt = uDeltaTime;
    
    vec3 noisePos = pos * 2.0 + uTime * 0.1 + curlOffset + noiseSeed;
    vec3 noiseForce = curlNoise(noisePos) * 0.5;
    
    vec2 cursorDist = uCursor - pos.xy;
    float cursorDistLen = length(cursorDist);
    float cursorInfluence = uCursorForce > 0.5 ? smoothstep(0.3, 0.0, cursorDistLen) * 0.8 : 0.0;
    vec3 cursorForce = vec3(cursorDist * cursorInfluence, 0.0);
    
    float scrollInfluence = uScrollProgress * 0.3;
    vec3 gravity = vec3(0.0, -0.1 * scrollInfluence, 0.0);
    
    float audioReact = uAudioLevel * 0.5;
    vec3 audioForce = snoiseVec3(pos * 3.0 + uTime * 2.0) * audioReact;
    
    acc += noiseForce + cursorForce + gravity + audioForce;
    
    vel += acc * dt;
    vel *= 0.98;
    pos += vel * dt;
    
    float bounds = 1.5;
    if (pos.x < -bounds) pos.x = bounds;
    if (pos.x > bounds) pos.x = -bounds;
    if (pos.y < -bounds) pos.y = bounds;
    if (pos.y > -bounds) pos.y = -bounds;
    if (pos.z < -bounds) pos.z = bounds;
    if (pos.z > bounds) pos.z = -bounds;
    
    life -= dt;
    if (life <= 0.0) {
        pos = vec3(
            (rand(noiseSeed + uTime) - 0.5) * 2.0,
            (rand(noiseSeed * 1.3 + uTime) - 0.5) * 2.0,
            (rand(noiseSeed * 1.7 + uTime) - 0.5) * 1.0
        );
        vel = vec3(0.0);
        acc = vec3(0.0);
        life = maxLife;
    }
    
    vPosition = pos;
    vVelocity = vel;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = mix(sizeStart, sizeEnd, 1.0 - vLife) * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}

float rand(float n) {
    return fract(sin(n) * 43758.5453);
}