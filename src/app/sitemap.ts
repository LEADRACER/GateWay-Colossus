import { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gateway-colossus.vercel.app'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/trending`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  // Dynamic project pages
  try {
    const supabase = await createServerSupabaseClient()
    const { data: projects } = await supabase
      .from('projects')
      .select('id, updated_at, name')
      .eq('status', 'active')
      .limit(100)

    if (projects) {
      const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
        url: `${baseUrl}/projects/${p.id}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      return [...staticRoutes, ...projectRoutes]
    }
  } catch {}

  return staticRoutes
}
