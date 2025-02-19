declare module '@/components/ui/card' {
  import { HTMLAttributes } from 'react'

  export const Card: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >

  export const CardHeader: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >

  export const CardFooter: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >

  export const CardTitle: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLParagraphElement>
  >

  export const CardDescription: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
  >

  export const CardContent: React.ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  >
} 