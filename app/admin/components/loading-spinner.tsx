'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: number
}

export function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', className)}
      size={size}
    />
  )
}

interface LoadingStateProps {
  className?: string
  text?: string
}

export function LoadingState({ className, text = 'Loading...' }: LoadingStateProps) {
  return (
    <div className={cn('flex min-h-[400px] w-full flex-col items-center justify-center space-y-4', className)}>
      <LoadingSpinner size={32} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
