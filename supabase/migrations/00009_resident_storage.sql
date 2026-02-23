-- Allow residents to upload task files to their own folder in the documents bucket

create policy "Residents can upload task files"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'tasks'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Residents can update their task files"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'tasks'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
