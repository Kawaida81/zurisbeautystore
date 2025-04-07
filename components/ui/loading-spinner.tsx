"use client";

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  variant?: "default" | "primary" | "secondary";
}

const variantClasses = {
  default: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
} as const;

const LoadingSpinner = ({ 
  size = 24, 
  className = "", 
  variant = "default" 
}: LoadingSpinnerProps) => {
  return (
    <Loader2
      className={cn('animate-spin', variantClasses[variant], className)}
      size={size}
    />
  );
};

export { LoadingSpinner };
