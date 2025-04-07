'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { X } from 'lucide-react'

interface ModalProps {
  title?: string
  description?: string
  isOpen: boolean
  open?: boolean
  onClose: () => void
  children?: React.ReactNode
  footer?: React.ReactNode
  isLoading?: boolean
}

export function Modal({
  title,
  description,
  isOpen,
  open = isOpen,
  onClose,
  children,
  footer,
  isLoading = false,
}: ModalProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px]">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            {title && <DialogTitle>{title}</DialogTitle>}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md p-0"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <LoadingSpinner />
            </div>
          )}
          {children}
        </div>
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
