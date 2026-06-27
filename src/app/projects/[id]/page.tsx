import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProjectDetailClient } from './ProjectDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  try {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase.from('projects').select('name, repo_description, owner, repo_name').eq('id', id).single()
    if (data) {
      return {
        title: data.name,
        description: data.repo_description || `${data.owner}/${data.repo_name} — Browse on GateWay:Colossus`,
        openGraph: {
          title: `${data.name} — GateWay:Colossus`,
          description: data.repo_description || `${data.owner}/${data.repo_name}`,
        },
      }
    }
  } catch {}
  return { title: 'Project' }
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  return <ProjectDetailClient id={id} />
}
