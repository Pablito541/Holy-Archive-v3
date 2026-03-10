-- Secure storage policies for organization isolation

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;

-- Read Access: Since anyone might need to view the images of public showroom items, 
-- read access should remain public for the "images" bucket.
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Insert Access: Users can only upload if the first folder in the path is an organization they belong to
CREATE POLICY "Organization Member Insert Access"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

-- Update Access
CREATE POLICY "Organization Member Update Access"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

-- Delete Access
CREATE POLICY "Organization Member Delete Access"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);
