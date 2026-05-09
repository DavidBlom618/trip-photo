-- Create public bucket for static site hosting
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('site', 'site', true, 52428800, ARRAY['text/html', 'text/css', 'application/javascript', 'image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Anyone can read site files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'site');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone can upload site files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'site');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
