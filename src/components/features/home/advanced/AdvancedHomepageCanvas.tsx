'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { useCanvasData } from '@/hooks/useCanvasData'
import { useScrollProgress } from '@/hooks/useScrollProgress'

const particleVert = `#version 300 es
precision highp float;

in vec3 position;
in vec3 velocity;
in vec3 acceleration;
in float life;
in float maxLife;
in vec3 colorStart;
in vec3 colorEnd;
in float sizeStart;
in float sizeEnd;
in float noiseSeed;
in vec3 curlOffset;

uniform float uTime;
uniform float uDeltaTime;
uniform vec2 uResolution;
uniform vec2 uCursor;
uniform float uCursorForce;
uniform float uScrollProgress;
uniform float uAudioLevel;

out float vLife;
out vec3 vColorStart;
out vec3 vColorEnd;
out float vSizeStart;
out float vSizeEnd;
out vec3 vPosition;
out vec3 vVelocity;
out float vNoiseSeed;

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

float rand(float n) {
    return fract(sin(n) * 43758.5453);
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
`

const particleFrag = `#version 300 es
precision highp float;

in float vLife;
in vec3 vColorStart;
in vec3 vColorEnd;
in float vSizeStart;
in float vSizeEnd;
in vec3 vPosition;
in vec3 vVelocity;
in float vNoiseSeed;

uniform float uTime;
uniform float uScrollProgress;

out vec4 fragColor;

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
    
    fragColor = vec4(color, alpha);
    
    if (fragColor.a < 0.01) discard;
}
`

const morphVert = `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform float uTime;
uniform float uMorphFactor;
uniform float uNoiseScale;
uniform float uDisplacement;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uScrollProgress;
uniform float uWireframe;
uniform float uFresnelPower;
uniform vec3 uFresnelColor;

out vec3 vNormal;
out vec3 vWorldPosition;
out vec2 vUv;
out float vDisplacement;
out vec3 vColor;

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
`

const morphFrag = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;
in vec2 vUv;
in float vDisplacement;
in vec3 vColor;

uniform float uTime;
uniform float uScrollProgress;
uniform float uWireframe;
uniform float uFresnelPower;
uniform vec3 uFresnelColor;

out vec4 fragColor;

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
    
    fragColor = vec4(finalColor, scrollAlpha * (0.3 + fresnel * 0.7));
    
    if (fragColor.a < 0.01) discard;
}
`

const trailVert = `#version 300 es
precision highp float;

in vec3 position;
in vec3 nextPosition;
in float index;
in float length;
in vec3 color;

uniform float uTime;
uniform float uTrailLength;
uniform float uWidth;
uniform vec2 uResolution;

out float vIndex;
out float vLength;
out vec3 vColor;
out float vProgress;

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
    
    vec3 offset = perp * width * (float(gl_InstanceID % 2) == 0.0 ? 1.0 : -1.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos + offset, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
`

const trailFrag = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uTrailLength;

in float vIndex;
in float vLength;
in vec3 vColor;
in float vProgress;

out vec4 fragColor;

void main() {
    float progress = vProgress;
    float life = 1.0 - progress;
    
    float alpha = life * life * 0.8;
    alpha *= sin(progress * 3.14159);
    
    float pulse = sin(uTime * 4.0 + vIndex * 0.2) * 0.2 + 0.8;
    alpha *= pulse;
    
    vec3 color = vColor * (1.0 + progress * 0.5);
    color += vec3(progress * 0.3, progress * 0.1, 0.0);
    
    fragColor = vec4(color, alpha);
    
    if (fragColor.a < 0.01) discard;
}
`

const postVert = `#version 300 es
precision highp float;

in vec2 uv;
out vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const postFrag = `#version 300 es
precision highp float;

uniform sampler2D tDiffuse;
uniform sampler2D tBloom;
uniform float uTime;
uniform float uScrollProgress;
uniform float uIntensity;
uniform vec2 uResolution;

in vec2 vUv;

out vec4 fragColor;

float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float rand(vec3 co) {
    return fract(sin(dot(co.xyz, vec3(12.9898, 78.233, 53.539))) * 43758.5453);
}

vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
    vec2 offset = amount * (uv - 0.5) * 0.01;
    float r = texture(tex, uv + offset).r;
    float g = texture(tex, uv).g;
    float b = texture(tex, uv - offset).b;
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
    vec4 color = texture(tDiffuse, vUv);
    vec4 bloomColor = texture(tBloom, vUv);
    
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
    
    fragColor = vec4(color.rgb, 1.0);
}
`

interface TeamNode {
  id: string
  code: string
  name: string
  slug: string
  position: [number, number, number]
  memberCount: number
  projectCount: number
  isShowcased: boolean
  showcaseType?: 'homepage' | 'fired' | 'both'
  avatarUrl?: string
  color: string
}

interface ProjectNode {
  id: string
  teamId: string | null
  name: string
  stars: number
  language: string | null
  languageColor: string
  isShowcased: boolean
  position: [number, number, number]
  orbitRadius: number
  orbitSpeed: number
  orbitPhase: number
}

interface CanvasEdge {
  source: string
  target: string
  weight: number
}

interface CanvasFeed {
  teams: TeamNode[]
  projects: ProjectNode[]
  edges: CanvasEdge[]
  metadata: {
    totalTeams: number
    totalProjects: number
    totalStars: number
    lastUpdated: string
  }
}

const PARTICLE_COUNT = 50000
const TRAIL_SEGMENTS = 30
const MAX_TRAILS = 10

export function AdvancedHomepageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: feed, isLoading } = useCanvasData()
  const scrollProgress = useScrollProgress()
  const [isReady, setIsReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [shadersReady, setShadersReady] = useState(false)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const composerRef = useRef<EffectComposer | null>(null)
  const animationRef = useRef<number | undefined>(undefined)

  const particleSystemRef = useRef<THREE.Points | null>(null)
  const particleGeometryRef = useRef<THREE.BufferGeometry | null>(null)
  const morphGeometryRef = useRef<THREE.Mesh | null>(null)
  const trailMeshesRef = useRef<THREE.Mesh[]>([])
  const teamNodesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const projectRingsRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const edgesRef = useRef<THREE.LineSegments | null>(null)

  const cursorRef = useRef({ x: 0.5, y: 0.5, force: 0, trail: [] as THREE.Vector3[] })
  const timeRef = useRef(0)
  const lastTimeRef = useRef(0)

  const particleMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const morphMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const trailMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const postMaterialRef = useRef<THREE.ShaderMaterial | null>(null)
  const bloomPassRef = useRef<UnrealBloomPass | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    cursorRef.current.x = (e.clientX - rect.left) / rect.width
    cursorRef.current.y = (e.clientY - rect.top) / rect.height
    cursorRef.current.force = 1
    cursorRef.current.trail.push(new THREE.Vector3(
      (cursorRef.current.x - 0.5) * 2,
      (0.5 - cursorRef.current.y) * 2,
      0
    ))
    if (cursorRef.current.trail.length > TRAIL_SEGMENTS) {
      cursorRef.current.trail.shift()
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    cursorRef.current.force = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    cursorRef.current.x = (touch.clientX - rect.left) / rect.width
    cursorRef.current.y = (touch.clientY - rect.top) / rect.height
    cursorRef.current.force = 1
    cursorRef.current.trail.push(new THREE.Vector3(
      (cursorRef.current.x - 0.5) * 2,
      (0.5 - cursorRef.current.y) * 2,
      0
    ))
    if (cursorRef.current.trail.length > TRAIL_SEGMENTS) {
      cursorRef.current.trail.shift()
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    cursorRef.current.force = 0
  }, [])

  useEffect(() => {
    particleMaterialRef.current = new THREE.ShaderMaterial({
      vertexShader: particleVert,
      fragmentShader: particleFrag,
      uniforms: {
        uTime: { value: 0 },
        uDeltaTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uCursor: { value: new THREE.Vector2(0.5, 0.5) },
        uCursorForce: { value: 0 },
        uScrollProgress: { value: 0 },
        uAudioLevel: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })

    morphMaterialRef.current = new THREE.ShaderMaterial({
      vertexShader: morphVert,
      fragmentShader: morphFrag,
      uniforms: {
        uTime: { value: 0 },
        uMorphFactor: { value: 1 },
        uNoiseScale: { value: 2.5 },
        uDisplacement: { value: 0.3 },
        uColorA: { value: new THREE.Color(0x00d4ff) },
        uColorB: { value: new THREE.Color(0xff006e) },
        uScrollProgress: { value: 0 },
        uWireframe: { value: 0 },
        uFresnelPower: { value: 3.0 },
        uFresnelColor: { value: new THREE.Color(0x00ffff) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })

    trailMaterialRef.current = new THREE.ShaderMaterial({
      vertexShader: trailVert,
      fragmentShader: trailFrag,
      uniforms: {
        uTime: { value: 0 },
        uTrailLength: { value: TRAIL_SEGMENTS },
        uWidth: { value: 0.02 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    postMaterialRef.current = new THREE.ShaderMaterial({
      vertexShader: postVert,
      fragmentShader: postFrag,
      uniforms: {
        tDiffuse: { value: null },
        tBloom: { value: null },
        uTime: { value: 0 },
        uScrollProgress: { value: 0 },
        uIntensity: { value: 1.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    })

    setShadersReady(true)
  }, [])

  useEffect(() => {
    if (!shadersReady) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100)
    camera.position.set(0, 0, 2)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    const composer = new EffectComposer(renderer)
    composerRef.current = composer

    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,
      0.4,
      0.85
    )
    bloomPass.threshold = 0.3
    bloomPass.strength = 1.5
    bloomPass.radius = 0.5
    composer.addPass(bloomPass)
    bloomPassRef.current = bloomPass

    const postPass = new ShaderPass(postMaterialRef.current!)
    composer.addPass(postPass)

    const particleCount = prefersReducedMotion ? 5000 : PARTICLE_COUNT
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const accelerations = new Float32Array(particleCount * 3)
    const lives = new Float32Array(particleCount)
    const maxLives = new Float32Array(particleCount)
    const colorStarts = new Float32Array(particleCount * 3)
    const colorEnds = new Float32Array(particleCount * 3)
    const sizeStarts = new Float32Array(particleCount)
    const sizeEnds = new Float32Array(particleCount)
    const noiseSeeds = new Float32Array(particleCount)
    const curlOffsets = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
      accelerations[i * 3] = 0
      accelerations[i * 3 + 1] = 0
      accelerations[i * 3 + 2] = 0
      lives[i] = Math.random() * 10 + 5
      maxLives[i] = lives[i]
      
      const hue = 0.55 + Math.random() * 0.3
      const sat = 0.6 + Math.random() * 0.3
      const light = 0.3 + Math.random() * 0.3
      const colorStart = new THREE.Color().setHSL(hue, sat, light)
      const colorEnd = new THREE.Color().setHSL(hue + 0.1, sat, light + 0.2)
      colorStarts[i * 3] = colorStart.r
      colorStarts[i * 3 + 1] = colorStart.g
      colorStarts[i * 3 + 2] = colorStart.b
      colorEnds[i * 3] = colorEnd.r
      colorEnds[i * 3 + 1] = colorEnd.g
      colorEnds[i * 3 + 2] = colorEnd.b
      
      sizeStarts[i] = Math.random() * 2 + 1
      sizeEnds[i] = Math.random() * 0.5 + 0.1
      noiseSeeds[i] = Math.random() * 1000
      curlOffsets[i * 3] = Math.random() * 100
      curlOffsets[i * 3 + 1] = Math.random() * 100
      curlOffsets[i * 3 + 2] = Math.random() * 100
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    particleGeometry.setAttribute('acceleration', new THREE.BufferAttribute(accelerations, 3))
    particleGeometry.setAttribute('life', new THREE.BufferAttribute(lives, 1))
    particleGeometry.setAttribute('maxLife', new THREE.BufferAttribute(maxLives, 1))
    particleGeometry.setAttribute('colorStart', new THREE.BufferAttribute(colorStarts, 3))
    particleGeometry.setAttribute('colorEnd', new THREE.BufferAttribute(colorEnds, 3))
    particleGeometry.setAttribute('sizeStart', new THREE.BufferAttribute(sizeStarts, 1))
    particleGeometry.setAttribute('sizeEnd', new THREE.BufferAttribute(sizeEnds, 1))
    particleGeometry.setAttribute('noiseSeed', new THREE.BufferAttribute(noiseSeeds, 1))
    particleGeometry.setAttribute('curlOffset', new THREE.BufferAttribute(curlOffsets, 3))

    particleGeometryRef.current = particleGeometry

    const particles = new THREE.Points(particleGeometry, particleMaterialRef.current!)
    particleSystemRef.current = particles
    scene.add(particles)

    const morphGeometry = new THREE.IcosahedronGeometry(0.6, 64)
    const morphMesh = new THREE.Mesh(morphGeometry, morphMaterialRef.current!)
    morphGeometryRef.current = morphMesh
    scene.add(morphMesh)

    const trailGeometry = new THREE.BufferGeometry()
    const trailPositions = new Float32Array(TRAIL_SEGMENTS * 3 * 2)
    const trailIndices = new Float32Array(TRAIL_SEGMENTS)
    const trailLengths = new Float32Array(TRAIL_SEGMENTS)
    
    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      trailPositions[i * 6] = 0
      trailPositions[i * 6 + 1] = 0
      trailPositions[i * 6 + 2] = 0
      trailPositions[i * 6 + 3] = 0
      trailPositions[i * 6 + 4] = 0
      trailPositions[i * 6 + 5] = 0
      trailIndices[i] = i
      trailLengths[i] = TRAIL_SEGMENTS
    }
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))
    trailGeometry.setAttribute('nextPosition', new THREE.BufferAttribute(new Float32Array(TRAIL_SEGMENTS * 3), 3))
    trailGeometry.setAttribute('index', new THREE.BufferAttribute(trailIndices, 1))
    trailGeometry.setAttribute('length', new THREE.BufferAttribute(trailLengths, 1))
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TRAIL_SEGMENTS * 3), 3))
    
    const trailMesh = new THREE.Mesh(trailGeometry, trailMaterialRef.current!)
    trailMeshesRef.current = [trailMesh]
    scene.add(trailMesh)

    if (feed?.teams) {
      feed.teams.forEach(team => {
        const size = 0.015 + Math.min(team.memberCount * 0.002, 0.035)
        const geometry = new THREE.SphereGeometry(size, 16, 16)
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(team.color),
          transparent: true,
          opacity: team.isShowcased ? 1 : 0.8,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(team.position[0] - 0.5, team.position[1] - 0.5, team.position[2])
        mesh.userData = { teamCode: team.code, teamData: team }
        scene.add(mesh)
        teamNodesRef.current.set(team.code, mesh)
      })
    }

    if (feed?.edges && feed.edges.length > 0) {
      const edgeGeometry = new THREE.BufferGeometry()
      const edgePositions: number[] = []
      const edgeAlphas: number[] = []

      feed.edges.forEach(edge => {
        const source = teamNodesRef.current.get(edge.source)
        const target = teamNodesRef.current.get(edge.target)
        if (source && target) {
          edgePositions.push(
            source.position.x, source.position.y, source.position.z,
            target.position.x, target.position.y, target.position.z
          )
          edgeAlphas.push(edge.weight * 0.3, edge.weight * 0.3)
        }
      })

      if (edgePositions.length > 0) {
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3))
        edgeGeometry.setAttribute('alpha', new THREE.Float32BufferAttribute(edgeAlphas, 1))

        const edgeMaterial = new THREE.LineBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.15,
          vertexColors: false,
        })

        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
        edgesRef.current = edges
        scene.add(edges)
      }
    }

    if (feed?.projects) {
      feed.projects.forEach(project => {
        const team = teamNodesRef.current.get(project.teamId || '')
        if (!team && project.teamId) return

        const ringGeometry = new THREE.RingGeometry(
          project.orbitRadius * 0.95,
          project.orbitRadius,
          32
        )
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(project.languageColor),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: project.isShowcased ? 0.6 : 0.25,
          depthWrite: false,
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.rotation.x = -Math.PI / 2

        if (team) {
          ring.position.copy(team.position)
        }

        ring.userData = { projectId: project.id, projectData: project, basePhase: project.orbitPhase }
        scene.add(ring)
        projectRingsRef.current.set(project.id, ring)
      })
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambient)

    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.5, 3)
    pointLight1.position.set(-0.5, 0.5, 1)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff006e, 0.3, 3)
    pointLight2.position.set(0.5, -0.5, 1)
    scene.add(pointLight2)

    const pointLight3 = new THREE.PointLight(0x00ffff, 0.2, 3)
    pointLight3.position.set(0, 0, 2)
    scene.add(pointLight3)

    setIsReady(true)

    const animate = (time: number) => {
      animationRef.current = requestAnimationFrame(animate)
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.033)
      lastTimeRef.current = time
      timeRef.current = time / 1000

      if (!prefersReducedMotion) {
        updateScene(dt)
      }

      if (composerRef.current) {
        composerRef.current.render()
      }
    }

    animate(0)

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
      composerRef.current.setSize(window.innerWidth, window.innerHeight)
      
      if (particleMaterialRef.current) {
        particleMaterialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
      }
      if (trailMaterialRef.current) {
        trailMaterialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
      }
      if (postMaterialRef.current) {
        postMaterialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
      }
      if (bloomPassRef.current) {
        bloomPassRef.current.resolution.set(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationRef.current!)
      window.removeEventListener('resize', handleResize)
      
      particleGeometry.dispose()
      particleMaterialRef.current?.dispose()
      morphMaterialRef.current?.dispose()
      trailMaterialRef.current?.dispose()
      postMaterialRef.current?.dispose()
      renderer.dispose()
      composerRef.current?.dispose()
    }
  }, [feed, prefersReducedMotion])

  const updateScene = (dt: number) => {
    const t = timeRef.current
    const cursor = cursorRef.current

    if (particleMaterialRef.current) {
      particleMaterialRef.current.uniforms.uTime.value = t
      particleMaterialRef.current.uniforms.uDeltaTime.value = dt
      particleMaterialRef.current.uniforms.uCursor.value.set(cursor.x * 2 - 1, 1 - cursor.y * 2)
      particleMaterialRef.current.uniforms.uCursorForce.value = cursor.force
      particleMaterialRef.current.uniforms.uScrollProgress.value = scrollProgress
      particleMaterialRef.current.uniforms.uAudioLevel.value = audioLevel
    }

    if (morphMaterialRef.current) {
      morphMaterialRef.current.uniforms.uTime.value = t
      morphMaterialRef.current.uniforms.uScrollProgress.value = scrollProgress
      morphMaterialRef.current.uniforms.uMorphFactor.value = 0.5 + 0.5 * Math.sin(t * 0.2)
    }

    if (trailMaterialRef.current) {
      trailMaterialRef.current.uniforms.uTime.value = t
    }

    if (postMaterialRef.current) {
      postMaterialRef.current.uniforms.uTime.value = t
      postMaterialRef.current.uniforms.uScrollProgress.value = scrollProgress
    }

    if (bloomPassRef.current) {
      bloomPassRef.current.strength = 1.0 + scrollProgress * 1.5
      bloomPassRef.current.threshold = 0.2 + scrollProgress * 0.3
      bloomPassRef.current.radius = 0.4 + scrollProgress * 0.6
    }

    if (morphGeometryRef.current) {
      morphGeometryRef.current.rotation.y += dt * 0.05
      morphGeometryRef.current.rotation.x += dt * 0.02
    }

    if (cursor.trail.length > 1 && trailMeshesRef.current[0]) {
      const trailGeometry = trailMeshesRef.current[0].geometry as THREE.BufferGeometry
      const positions = trailGeometry.getAttribute('position') as THREE.BufferAttribute
      const nextPositions = trailGeometry.getAttribute('nextPosition') as THREE.BufferAttribute
      const colors = trailGeometry.getAttribute('color') as THREE.BufferAttribute
      
      for (let i = 0; i < cursor.trail.length - 1 && i < TRAIL_SEGMENTS; i++) {
        const current = cursor.trail[i]
        const next = cursor.trail[i + 1]
        positions.setXYZ(i, current.x, current.y, current.z)
        nextPositions.setXYZ(i, next.x, next.y, next.z)
        
        const hue = 0.55 + (i / TRAIL_SEGMENTS) * 0.3
        const color = new THREE.Color().setHSL(hue, 0.8, 0.5)
        colors.setXYZ(i, color.r, color.g, color.b)
      }
      
      positions.needsUpdate = true
      nextPositions.needsUpdate = true
      colors.needsUpdate = true
    }

    if (feed?.projects) {
      feed.projects.forEach(project => {
        const ring = projectRingsRef.current.get(project.id)
        const team = project.teamId ? teamNodesRef.current.get(project.teamId!) : null
        if (!ring) return

        const phase = project.orbitPhase + t * project.orbitSpeed
        const radius = project.orbitRadius

        const x = (team?.position.x ?? 0) + Math.cos(phase) * radius
        const y = (team?.position.y ?? 0) + Math.sin(phase) * radius * 0.6
        const z = (team?.position.z ?? 0) + Math.sin(phase * 2) * radius * 0.3

        ring.position.set(x, y, z)
        ring.rotation.z = t * project.orbitSpeed * 0.5
      })
    }

    if (teamNodesRef.current.size > 0) {
      teamNodesRef.current.forEach((mesh) => {
        const dx = (cursor.x - 0.5) * 2 - mesh.position.x
        const dy = (0.5 - cursor.y) * 2 - mesh.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (cursor.force > 0 && dist < 0.3) {
          const force = (1 - dist / 0.3) * 0.003
          mesh.position.x += dx * force
          mesh.position.y += dy * force
        }

        if (dist < 0.1) {
          mesh.scale.lerp(new THREE.Vector3(1.3, 1.3, 1.3), 0.1)
        } else {
          mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05)
        }

        mesh.rotation.y += dt * 0.5
      })
    }

    if (edgesRef.current) {
      edgesRef.current.rotation.z += dt * 0.01
    }

    if (cameraRef.current) {
      const targetZ = THREE.MathUtils.lerp(2, 0.8, scrollProgress * 0.8)
      cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, targetZ, 0.03)
      cameraRef.current.lookAt(0, 0, 0)

      const parallaxX = (cursor.x - 0.5) * 0.1 * (1 - scrollProgress)
      const parallaxY = (0.5 - cursor.y) * 0.1 * (1 - scrollProgress)
      
      if (particleSystemRef.current) {
        particleSystemRef.current.position.x = parallaxX
        particleSystemRef.current.position.y = parallaxY
      }
      
      if (morphGeometryRef.current) {
        morphGeometryRef.current.position.x = parallaxX * 0.5
        morphGeometryRef.current.position.y = parallaxY * 0.5
      }
    }
  }

  if (isLoading || !isReady || !shadersReady) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-0 bg-bg" aria-hidden="true">
        <div className="flex items-center justify-center h-full w-full">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-transparent border-t-[var(--cyber-gold)] rounded-full animate-spin reverse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0"
      style={{ touchAction: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ display: 'block' }}
      />
      {prefersReducedMotion && (
        <div className="absolute inset-0 bg-gradient-to-b from-bg to-bg/90 z-10 pointer-events-none" />
      )}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        .reverse { animation-direction: reverse; }
      `}</style>
    </div>
  )
}