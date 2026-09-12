'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useCanvasData } from '@/hooks/useCanvasData'
import { useScrollProgress } from '@/hooks/useScrollProgress'

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

export function HomepageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: feed, isLoading } = useCanvasData()
  const scrollProgress = useScrollProgress()
  const [isReady, setIsReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const animationRef = useRef<number | undefined>(undefined)

  const particleSystemRef = useRef<THREE.Points | null>(null)
  const constellationRef = useRef<THREE.Group | null>(null)
  const projectOrbitsRef = useRef<THREE.Group | null>(null)
  const teamNodesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const projectRingsRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const edgesRef = useRef<THREE.LineSegments | null>(null)

  const cursorRef = useRef({ x: 0.5, y: 0.5, force: 0 })
  const timeRef = useRef(0)

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
  }, [])

  const handleTouchEnd = useCallback(() => {
    cursorRef.current.force = 0
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100)
    camera.position.set(0.5, 0.5, 1.2)
    camera.lookAt(0.5, 0.5, 0)
    cameraRef.current = camera

    // Groups
    const constellation = new THREE.Group()
    constellationRef.current = constellation
    scene.add(constellation)

    const projectOrbits = new THREE.Group()
    projectOrbitsRef.current = projectOrbits
    scene.add(projectOrbits)

    // Particle System (Layer 1)
    const particleCount = prefersReducedMotion ? 5000 : (window.innerWidth < 768 ? 8000 : 20000)
    const particleGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const phases = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = Math.random()
      positions[i * 3 + 1] = Math.random()
      positions[i * 3 + 2] = Math.random() * 0.5
      sizes[i] = Math.random() * 1.5 + 0.5
      phases[i] = Math.random() * Math.PI * 2
      // Base color (will be animated in shader)
      colors[i * 3] = 0.1
      colors[i * 3 + 1] = 0.15
      colors[i * 3 + 2] = 0.25
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    particleGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1))

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    particleSystemRef.current = particles
    scene.add(particles)

    // Constellation Nodes (Layer 2)
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
        mesh.position.set(team.position[0], team.position[1], team.position[2])
        mesh.userData = { teamCode: team.code, teamData: team }
        constellation.add(mesh)
        teamNodesRef.current.set(team.code, mesh)
      })
    }

    // Edges (Layer 2)
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
        constellation.add(edges)
      }
    }

    // Project Orbits (Layer 3)
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
        projectOrbits.add(ring)
        projectRingsRef.current.set(project.id, ring)
      })
    }

    // Lights (subtle)
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)

    const pointLight = new THREE.PointLight(0x00d4ff, 0.3, 2)
    pointLight.position.set(0.5, 0.5, 1)
    scene.add(pointLight)

    setIsReady(true)

    // Animation Loop
    let lastTime = 0
    const animate = (time: number) => {
      animationRef.current = requestAnimationFrame(animate)
      const dt = (time - lastTime) / 1000
      lastTime = time
      timeRef.current = time / 1000

      if (!prefersReducedMotion) {
        updateParticles(dt)
        updateOrbits(dt)
        updateCursorInfluence()
        updateCamera()
      }

      renderer.render(scene, camera)
    }

    animate(0)

    // Resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animationRef.current!)
      window.removeEventListener('resize', handleResize)

      // Cleanup
      particleGeometry.dispose()
      particleMaterial.dispose()
      renderer.dispose()
    }
  }, [feed, prefersReducedMotion])

  const updateParticles = (dt: number) => {
    if (!particleSystemRef.current) return
    const geometry = particleSystemRef.current.geometry
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute
    const phases = geometry.getAttribute('phase') as THREE.BufferAttribute
    const count = positions.count

    const cursor = cursorRef.current
    const t = timeRef.current

    for (let i = 0; i < count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      const phase = phases.getX(i)

      // Curl noise flow field (simplified)
      const flowX = Math.sin(y * 10 + t * 0.2) * 0.0003
      const flowY = Math.cos(x * 10 + t * 0.15) * 0.0003

      // Cursor influence
      const dx = cursor.x - x
      const dy = cursor.y - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const influence = cursor.force > 0 ? Math.max(0, 1 - dist / 0.3) * 0.0005 : 0

      positions.setX(i, x + flowX + dx * influence)
      positions.setY(i, y + flowY + dy * influence)

      // Wrap around
      if (positions.getX(i) < 0) positions.setX(i, 1)
      if (positions.getX(i) > 1) positions.setX(i, 0)
      if (positions.getY(i) < 0) positions.setY(i, 1)
      if (positions.getY(i) > 1) positions.setY(i, 0)

      // Color animation
      const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute
      const hue = (Math.sin(t * 0.1 + phase) * 0.5 + 0.5) * 0.3 + 0.55 // 0.55-0.85 (blue-cyan)
      const sat = 0.6 + Math.sin(t * 0.05 + phase) * 0.2
      const light = 0.3 + Math.sin(t * 0.08 + phase) * 0.15
      const color = new THREE.Color().setHSL(hue, sat, light)
      colorAttr.setXYZ(i, color.r, color.g, color.b)
      colorAttr.needsUpdate = true
    }

    positions.needsUpdate = true
  }

  const updateOrbits = (dt: number) => {
    if (!feed?.projects) return
    const t = timeRef.current

    feed.projects.forEach(project => {
      const ring = projectRingsRef.current.get(project.id)
      const team = project.teamId ? teamNodesRef.current.get(project.teamId!) : null
      if (!ring) return

      const phase = project.orbitPhase + t * project.orbitSpeed
      const radius = project.orbitRadius

      const x = (team?.position.x ?? 0.5) + Math.cos(phase) * radius
      const y = (team?.position.y ?? 0.5) + Math.sin(phase) * radius * 0.6
      const z = (team?.position.z ?? 0) + Math.sin(phase * 2) * radius * 0.3

      ring.position.set(x, y, z)
    })
  }

  const updateCursorInfluence = () => {
    if (!constellationRef.current) return
    const cursor = cursorRef.current
    const t = timeRef.current

    constellationRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.userData.teamCode) {
        const dx = cursor.x - child.position.x
        const dy = cursor.y - child.position.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (cursor.force > 0 && dist < 0.25) {
          const force = (1 - dist / 0.25) * 0.002
          child.position.x += dx * force
          child.position.y += dy * force
        }

        // Subtle hover scale
        if (dist < 0.08) {
          child.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.1)
        } else {
          child.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05)
        }
      }
    })
  }

  const updateCamera = () => {
    if (!cameraRef.current) return
    const progress = scrollProgress

    // Camera dolly based on scroll
    const targetZ = THREE.MathUtils.lerp(1.2, 0.4, progress * 0.8)
    cameraRef.current.position.z = THREE.MathUtils.lerp(cameraRef.current.position.z, targetZ, 0.05)
    cameraRef.current.lookAt(0.5, 0.5, 0)

    // Parallax for constellation
    if (constellationRef.current) {
      constellationRef.current.position.x = (cursorRef.current.x - 0.5) * 0.05 * (1 - progress)
      constellationRef.current.position.y = (cursorRef.current.y - 0.5) * 0.05 * (1 - progress)
    }

    // Fade particles as scroll progresses
    if (particleSystemRef.current) {
      const mat = particleSystemRef.current.material as THREE.PointsMaterial
      mat.opacity = THREE.MathUtils.lerp(0.6, 0.1, progress)
    }
  }

  if (isLoading || !isReady) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-0 bg-bg" aria-hidden="true">
        <div className="flex items-center justify-center h-full w-full">
          <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
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
    </div>
  )
}