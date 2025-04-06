'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Trash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  disabled?: boolean
  onChange: (value: string) => void
  onRemove?: (value: string) => void
  value: string
}

export function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value
}: ImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true)
      
      const file = e.target.files?.[0]
      if (!file) return

      const supabase = createClient()
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (error) throw error

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path)

      onChange(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="mb-4 flex items-center gap-4">
      <Button
        type="button"
        variant="secondary"
        onClick={() => document.getElementById('image-upload')?.click()}
        disabled={disabled || isUploading}
        className="relative"
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        Upload an Image
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onUpload}
          disabled={disabled || isUploading}
        />
      </Button>
      {value && (
        <div className="relative h-[100px] w-[100px]">
          <div className="z-10 absolute top-2 right-2">
            <Button
              type="button"
              onClick={() => onRemove?.(value)}
              variant="destructive"
              size="sm"
              disabled={disabled}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          <Image
            fill
            className="object-cover rounded-md"
            alt="Product image"
            src={value}
          />
        </div>
      )}
    </div>
  )
}
