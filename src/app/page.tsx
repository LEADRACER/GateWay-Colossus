'use client'

import { Suspense, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { RippleButton } from '@/components/ui/RippleButton'
import { StatsSection } from '@/components/features/StatsSection'
import { AdvancedHomepageCanvas } from '@/components/features/home/advanced/AdvancedHomepageCanvas'
import { HolographicCard, HolographicButton, GlowingText, ScanlineOverlay, GridBackground } from '@/components/ui/HolographicUI'
import { ScrollReveal, StaggerContainer, Parallax, Floating, TextReveal, LetterReveal, useScrollVelocity, useScrollDirection } from '@/components/ui/ImmersiveTransitions'
import { Flame, Star, ArrowRight, Sparkles, Zap, Layers, Network } from 'lucide-react'
import type { Project } from '@/lib/types/database'

type FeaturedProject = Project & { featured_note?: string }

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedProject[]>([])
  const [trending, setTrending] = useState<Project[]>([])
  const [mounted, setMounted] = useState(false)
  const scrollVelocity = useScrollVelocity()
  const scrollDirection = useScrollDirection()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return
    let cancelled = false
    Promise.all([
      import('@/lib/supabase/client').then(m => m.createClient),
      import('@/services/discovery').then(m => ({ 
        getFeaturedProjects: m.getFeaturedProjects, 
        getTrendingProjects: m.getTrendingProjects 
      })),
    ]).then(([createClient, { getFeaturedProjects, getTrendingProjects }]) => {
      if (cancelled) return
      const supabase = createClient()
      Promise.all([
        getFeaturedProjects(supabase),
        getTrendingProjects(supabase, 5),
      ])
        .then(([f, t]) => {
          if (!cancelled) {
            setFeatured(f)
            setTrending(t)
          }
        })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [mounted])

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ScanlineOverlay intensity={0.03} speed={4} />
      <GridBackground color="00d4ff" opacity={0.02} animated={true} />
      
      <Suspense fallback={<div className="fixed inset-0 z-0 bg-bg" />}>
        <AdvancedHomepageCanvas />
      </Suspense>

      <div className="relative z-10 min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col">
          <section className="flex-1 flex items-center relative">
            <Parallax speed={0.15} offset={0}>
              <div className="max-w-7xl mx-auto w-full px-6 py-20 md:py-32 relative z-10">
                <StaggerContainer stagger={0.12} delay={0.1} direction="up">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-surface/50 px-4 py-1.5 text-xs text-accent font-medium mb-8 backdrop-blur-xl"
                    style={{ boxShadow: '0 0 30px rgba(0,212,255,0.15)' }}
                  >
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-accent"
                    />
                    <LetterReveal stagger={0.02} delay={0.1} className="tracking-wider">COMMUNITY PROJECT SHOWCASE</LetterReveal>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2, duration: 1 }}
                    className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-text"
                    style={{ lineHeight: 1 }}
                  >
                    <LetterReveal stagger={0.03} delay={0.3} className="relative">GateWay:</LetterReveal>
                    <br />
                    <GlowingText variant="accent" animated={true} className="relative">
                      <LetterReveal stagger={0.03} delay={0.4}>Colossus</LetterReveal>
                    </GlowingText>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
                    className="mt-8 text-lg sm:text-xl text-text-muted leading-relaxed max-w-[50ch]"
                  >
                    <TextReveal stagger={0.02} delay={0.5}>A living archive of community-built projects. Share your work, discover what others are building, and draw inspiration from the collective.</TextReveal>
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.7 }}
                    className="mt-12 flex flex-wrap gap-4"
                  >
                    <Link href="/projects">
                      <HolographicButton variant="primary" size="lg" fullWidth={false}>
                        <TextReveal stagger={0.02}>Explore Projects</TextReveal>
                        <ArrowRight className="w-5 h-5" />
                      </HolographicButton>
                    </Link>
                    <Link href="/projects/new">
                      <HolographicButton variant="accent" size="lg" fullWidth={false}>
                        <Sparkles className="w-5 h-5" />
                        <TextReveal stagger={0.02}>Showcase Your Work</TextReveal>
                      </HolographicButton>
                    </Link>
                    <Link href="/teams">
                      <HolographicButton variant="secondary" size="lg" fullWidth={false}>
                        <Network className="w-5 h-5" />
                        <TextReveal stagger={0.02}>Join Teams</TextReveal>
                      </HolographicButton>
                    </Link>
                  </motion.div>
                </StaggerContainer>

                <ScrollReveal threshold={0.3} delay={0.8} direction="up">
                  <div className="mt-24 relative">
                    <Floating amplitude={20} frequency={0.5}>
                      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto">
                        <div className="absolute inset-0 rounded-full border border-accent/10 animate-pulse-slow" style={{ animationDuration: '6s' }} />
                        <div className="absolute inset-[10%] rounded-full border border-accent/15 animate-pulse-slow" style={{ animationDuration: '8s', animationDelay: '-2s' }} />
                        <div className="absolute inset-[20%] rounded-full border border-accent/20 animate-pulse-slow" style={{ animationDuration: '10s', animationDelay: '-4s' }} />
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                          className="absolute inset-[35%] rounded-full bg-gradient-to-r from-accent to-accent-glow blur-2xl"
                        />
                        <div className="absolute inset-[40%] rounded-full border border-accent/30" />
                        <motion.div
                          animate={{ rotate: 360, scale: [1, 1.02, 1] }}
                          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-[5%] rounded-full border border-dashed border-accent/10"
                        />
                        <div className="absolute inset-[42%] rounded-full bg-gradient-to-br from-accent/50 to-accent-glow/50 blur-md" />
                        <div className="absolute inset-[45%] flex items-center justify-center">
                          <Zap className="w-20 h-20 text-accent filter drop-shadow-[0_0_30px_rgba(0,212,255,0.8)]" />
                        </div>
                      </div>
                    </Floating>
                  </div>
                </ScrollReveal>

                <ScrollReveal threshold={0.2} delay={1} direction="up">
                  <StatsSection />
                </ScrollReveal>
              </div>
            </Parallax>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-text-dim/50 animate-bounce-slow">
              <motion.span
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs tracking-widest uppercase"
              >
                Scroll to descend
              </motion.span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent/50">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </section>

          <ScrollReveal threshold={0.15} direction="up">
            <section id="fired" className="relative border-t border-border/50 bg-gradient-to-b from-transparent via-surface-alt/20 to-transparent">
              <div className="max-w-7xl mx-auto w-full px-6 py-24">
                <div className="flex items-center gap-3 mb-12">
                  <div className="relative w-10 h-10">
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border-2 border-danger/30 border-t-danger"
                    />
                    <Flame size={20} className="text-danger relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-text">FIRED — Showcased Projects</h2>
                    <p className="text-sm text-text-muted">Hand-picked by the community</p>
                  </div>
                  <motion.div
                    animate={{ width: [0, 100, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="h-px bg-gradient-to-r from-transparent via-danger to-transparent flex-1"
                  />
                </div>

                {featured.length > 0 ? (
                  <StaggerContainer stagger={0.08} direction="up">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                      {featured.slice(0, 9).map((project, index) => (
                        <Link key={project.id} href={`/projects/${project.id}`}>
                          <HolographicCard 
                            variant={index < 3 ? 'accent' : 'primary'} 
                            intensity={index < 3 ? 1.2 : 1}
                            interactive
                            className="group h-full min-h-[280px] flex flex-col"
                          >
                            <div className="flex items-start gap-3 mb-4">
                              {project.repo_avatar ? (
                                <Image 
                                  src={project.repo_avatar} 
                                  alt={project.owner} 
                                  width={40} 
                                  height={40}
                                  className="w-10 h-10 rounded-full ring-2 ring-accent/30 shrink-0" 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-surface-alt ring-2 ring-border flex items-center justify-center shrink-0">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-text truncate group-hover:text-accent transition-colors">{project.name}</h3>
                                <p className="text-sm text-text-dim">{project.owner}/{project.repo_name}</p>
                              </div>
                              {index < 3 && (
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-danger to-accent flex items-center justify-center"
                                >
                                  <Star size={10} className="text-white" />
                                </motion.div>
                              )}
                            </div>
                            {project.repo_description && (
                              <p className="text-sm text-text-muted line-clamp-2 mb-4 flex-1">{project.repo_description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-text-dim mb-4">
                              {project.repo_stars > 0 && (
                                <span className="flex items-center gap-1.5 text-accent/80">
                                  <Star size={12} className="fill-current" />
                                  {project.repo_stars.toLocaleString()}
                                </span>
                              )}
                              {project.repo_language && (
                                <span className="px-2 py-0.5 rounded bg-surface/50 border border-border text-xs">{project.repo_language}</span>
                              )}
                            </div>
                            {project.featured_note && (
                              <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-accent italic border-t border-accent/20 pt-3"
                              >
                                ★ {project.featured_note}
                              </motion.p>
                            )}
                          </HolographicCard>
                        </Link>
                      ))}
                    </div>
                  </StaggerContainer>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-text-muted">No featured projects yet.</p>
                  </div>
                )}
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal threshold={0.15} direction="up">
            <section className="relative border-t border-border/50 bg-gradient-to-b from-transparent via-surface-alt/10 to-transparent">
              <div className="max-w-7xl mx-auto w-full px-6 py-24">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center">
                      <Zap size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-text">Trending Now</h2>
                      <p className="text-sm text-text-muted">Most starred this week</p>
                    </div>
                  </div>
                  <Link href="/trending" className="text-sm text-accent hover:underline flex items-center gap-1">
                    View all
                    <ArrowRight size={14} />
                  </Link>
                </div>

                {trending.length > 0 ? (
                  <div className="space-y-3">
                    {trending.slice(0, 8).map((project, index) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <HolographicCard 
                          variant={index < 3 ? 'primary' : 'secondary'} 
                          intensity={0.8}
                          interactive
                          className="group flex items-center gap-4 p-4 min-h-[80px]"
                        >
                          <motion.div
                            initial={{ scale: 0.8 }}
                            whileHover={{ scale: 1.1 }}
                            className={`w-10 h-10 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                              index < 3 
                                ? 'bg-gradient-to-br from-accent to-accent-glow text-white' 
                                : 'bg-surface-alt text-text-dim border border-border'
                            }`}
                          >
                            {index + 1}
                          </motion.div>
                          {project.repo_avatar ? (
                            <Image 
                              src={project.repo_avatar} 
                              alt={project.owner} 
                              width={36} 
                              height={36}
                              className="w-9 h-9 rounded-full ring-2 ring-accent/30 shrink-0" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-surface-alt ring-2 ring-border shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-text truncate block group-hover:text-accent transition-colors">{project.name}</span>
                            <span className="text-xs text-text-dim">{project.owner}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-text-dim shrink-0">
                            {project.repo_stars > 0 && (
                              <span className="flex items-center gap-1.5 text-accent/80">
                                <Star size={12} className="fill-current" />
                                {project.repo_stars.toLocaleString()}
                              </span>
                            )}
                            {project.repo_language && <span className="hidden sm:inline px-2 py-0.5 rounded bg-surface/50 border border-border">{project.repo_language}</span>}
                          </div>
                        </HolographicCard>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-text-muted">No trending projects yet.</p>
                  </div>
                )}
              </div>
            </section>
          </ScrollReveal>

          <ScrollReveal threshold={0.15} direction="up">
            <section className="relative py-24">
              <div className="max-w-7xl mx-auto w-full px-6">
                <HolographicCard variant="secondary" intensity={1.5} className="p-10 md:p-16 text-center">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <Layers size={32} className="text-accent" />
                    <GlowingText variant="primary" animated={true} className="text-3xl font-bold">
                      <TextReveal stagger={0.03}>Build Together</TextReveal>
                    </GlowingText>
                    <Layers size={32} className="text-accent" style={{ transform: 'scaleX(-1)' }} />
                  </div>
                  <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
                    Join teams, collaborate on projects, and level up your skills alongside developers who share your passion.
                  </p>
                  <Link href="/teams">
                    <HolographicButton variant="primary" size="lg">
                      <TextReveal stagger={0.02}>Discover Teams</TextReveal>
                      <ArrowRight className="w-5 h-5" />
                    </HolographicButton>
                  </Link>
                </HolographicCard>
              </div>
            </section>
          </ScrollReveal>
        </main>

        <footer className="border-t border-border/50 bg-surface/50 backdrop-blur-xl py-12">
          <div className="max-w-7xl mx-auto w-full px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <GlowingText variant="accent" animated={true} className="text-xl font-bold">
                  GateWay:Colossus
                </GlowingText>
                <span className="text-xs text-text-dim">v0.1.0</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-text-muted">
                <Link href="/projects" className="hover:text-accent transition-colors">Projects</Link>
                <Link href="/teams" className="hover:text-accent transition-colors">Teams</Link>
                <Link href="/trending" className="hover:text-accent transition-colors">Trending</Link>
                <Link href="/bookmarks" className="hover:text-accent transition-colors">Bookmarks</Link>
              </div>
              <p className="text-xs text-text-dim/50">
                Built with <span className="text-danger">♥</span> by the community
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}