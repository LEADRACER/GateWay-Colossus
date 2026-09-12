import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.githubId = (profile as unknown as { id: number }).id
        token.githubLogin = (profile as unknown as { login: string }).login
        token.avatarUrl = (profile as unknown as { avatar_url: string }).avatar_url
      }

      // Update token when session is updated (e.g., after fetching role)
      if (trigger === 'update' && session?.user?.role) {
        token.role = session.user.role
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.user.githubId = token.githubId as number
      session.user.githubLogin = token.githubLogin as string
      session.user.avatarUrl = token.avatarUrl as string
      if (token.role) {
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
})

// Server-side function to get user role from database
export async function getUserRole(githubId: number): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('github_id', githubId)
    .single()
  return profile?.role || null
}

declare module 'next-auth' {
  interface Session {
    accessToken: string
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      githubId: number
      githubLogin: string
      avatarUrl: string
      role?: string
    }
  }
}