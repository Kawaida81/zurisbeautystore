-- Create product-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to product images
CREATE POLICY "Give public access to product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload product images
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND owner = auth.uid()
);

-- Allow authenticated users to update their own product images
CREATE POLICY "Allow authenticated users to update their own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'product-images'
  AND owner = auth.uid()
);

-- Allow authenticated users to delete their own product images
CREATE POLICY "Allow authenticated users to delete their own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND owner = auth.uid()
);
