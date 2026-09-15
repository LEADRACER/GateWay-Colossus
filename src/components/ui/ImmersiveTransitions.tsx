'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  duration?: number
  ease?: [number, number, number, number]
}

export function PageTransition({ 
  children, 
  duration = 0.8, 
  ease = [0.4, 0, 0.2, 1] as [number, number, number, number]
}: PageTransitionProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <AnimatePresence mode="wait">
      {isMounted && (
        <motion.div
          initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.05 }}
          transition={{ duration, ease }}
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface StaggerContainerProps {
  children: React.ReactNode
  stagger?: number
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function StaggerContainer({ 
  children, 
  stagger = 0.1, 
  delay = 0, 
  direction = 'up' 
}: StaggerContainerProps) {
  const childArray = Array.isArray(children) ? children : [children]
  
  return (
    <>
      {childArray.map((child, index) => (
        <motion.div
          key={typeof child === 'object' && child !== null && 'key' in child ? (child as any).key : index}
          initial={{ 
            opacity: 0, 
            y: direction === 'up' ? 30 : direction === 'down' ? -30 : 0,
            x: direction === 'left' ? 30 : direction === 'right' ? -30 : 0,
            filter: 'blur(10px)',
          }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            x: 0,
            filter: 'blur(0px)',
          }}
          transition={{ 
            duration: 0.6, 
            delay: delay + index * stagger,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {child}
        </motion.div>
      ))}
    </>
  )
}

interface ScrollRevealProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  once?: boolean
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale'
}

export function ScrollReveal({ 
  children, 
  threshold = 0.1, 
  rootMargin = '0px',
  once = true,
  delay = 0,
  direction = 'up'
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once && elementRef.current) {
            observer.unobserve(elementRef.current)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  const initialStyles: Record<string, any> = {
    up: { y: 50, opacity: 0, filter: 'blur(10px)' },
    down: { y: -50, opacity: 0, filter: 'blur(10px)' },
    left: { x: 50, opacity: 0, filter: 'blur(10px)' },
    right: { x: -50, opacity: 0, filter: 'blur(10px)' },
    scale: { scale: 0.9, opacity: 0, filter: 'blur(10px)' },
  }

  return (
    <motion.div
      ref={elementRef}
      initial={initialStyles[direction]}
      animate={isVisible ? { y: 0, x: 0, scale: 1, opacity: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, delay, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}

interface ParallaxProps {
  children: React.ReactNode
  speed?: number
  offset?: number
  className?: string
}

export function Parallax({ children, speed = 0.5, offset = 0, className = '' }: ParallaxProps) {
  const [position, setPosition] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return
      const rect = elementRef.current.getBoundingClientRect()
      const scrollTop = window.scrollY
      const elementTop = rect.top + scrollTop
      const elementHeight = rect.height
      const viewportHeight = window.innerHeight
      
      const progress = (scrollTop + viewportHeight - elementTop) / (viewportHeight + elementHeight)
      const clampedProgress = Math.max(0, Math.min(1, progress))
      
      setPosition((clampedProgress - 0.5 - offset) * speed * 100)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, offset])

  return (
    <div ref={elementRef} className={className}>
      <motion.div
        style={{ transform: `translateY(${position}px)` }}
        transition={{ duration: 0 }}
      >
        {children}
      </motion.div>
    </div>
  )
}

interface MagneticProps {
  children: React.ReactNode
  strength?: number
  className?: string
}

export function Magnetic({ children, strength = 0.3, className = '' }: MagneticProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!elementRef.current) return
    const rect = elementRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setPosition({ x: x * strength * 20, y: y * strength * 20 })
  }, [strength])

  const handleMouseLeave = useCallback(() => {
    setPosition({ x: 0, y: 0 })
  }, [])

  return (
    <motion.div
      ref={elementRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

interface FloatingProps {
  children: React.ReactNode
  amplitude?: number
  frequency?: number
  className?: string
}

export function Floating({ children, amplitude = 10, frequency = 1, className = '' }: FloatingProps) {
  const [time, setTime] = useState(0)
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const animate = (timestamp: number) => {
      setTime(timestamp / 1000)
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current!)
  }, [])

  const y = Math.sin(time * frequency) * amplitude
  const x = Math.cos(time * frequency * 0.7) * amplitude * 0.5

  return (
    <motion.div
      animate={{ y, x }}
      transition={{ duration: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface CursorFollowerProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function CursorFollower({ children, delay = 0.1, className = '' }: CursorFollowerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const targetRef = useRef({ x: 0, y: 0 })
  const animationRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      setPosition(prev => ({
        x: prev.x + (targetRef.current.x - prev.x) * delay,
        y: prev.y + (targetRef.current.y - prev.y) * delay,
      }))
      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    animate()
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationRef.current!)
    }
  }, [delay])

  return (
    <motion.div
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 9999,
      }}
      transition={{ duration: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface TextRevealProps {
  children: string
  className?: string
  delay?: number
  stagger?: number
}

export function TextReveal({ children, className = '', delay = 0, stagger = 0.03 }: TextRevealProps) {
  const words = children.split(' ')
  
  return (
    <span className={`${className} inline-block`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: '100%', rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.5, delay: delay + i * stagger, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {word}{i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </span>
  )
}

interface LetterRevealProps {
  children: string
  className?: string
  delay?: number
  stagger?: number
}

export function LetterReveal({ children, className = '', delay = 0, stagger = 0.02 }: LetterRevealProps) {
  return (
    <span className={`${className} inline-block`}>
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: '100%', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, delay: delay + i * stagger, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

export function useScrollVelocity() {
  const [velocity, setVelocity] = useState(0)
  const lastScrollRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now()
      const scrollTop = window.scrollY
      const dt = (now - lastTimeRef.current) / 1000
      const currentVelocity = (scrollTop - lastScrollRef.current) / dt
      
      setVelocity(Math.abs(currentVelocity))
      lastScrollRef.current = scrollTop
      lastTimeRef.current = now
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return velocity
}

export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none')
  const lastScrollRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      if (scrollTop > lastScrollRef.current) {
        setDirection('down')
      } else if (scrollTop < lastScrollRef.current) {
        setDirection('up')
      }
      lastScrollRef.current = scrollTop
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return direction
}