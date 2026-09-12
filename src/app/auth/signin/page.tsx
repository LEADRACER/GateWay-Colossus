'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { GithubIcon } from '@/components/ui/GithubIcon'

function SignInPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/projects'

  useEffect(() => {
    signIn('github', { callbackUrl })
  }, [signIn, callbackUrl])

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <Card className="w-full max-w-sm p-6">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-accent/25 bg-accent-subtle mx-auto">
            <GithubIcon className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text">Sign in with GitHub</h1>
            <p className="text-sm text-text-dim mt-1">Redirecting you to GitHub...</p>
          </div>
          <Spinner size="lg" className="mx-auto" />
          <p className="text-xs text-text-dim">If not redirected, click the button below</p>
          <Button 
            variant="secondary" 
            className="w-full" 
            onClick={() => signIn('github', { callbackUrl })}
          >
            <GithubIcon className="w-4 h-4 mr-2" />
            Continue with GitHub
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[80vh]"><Spinner size="lg" /></div>}>
      <SignInPageContent />
    </Suspense>
  )
}