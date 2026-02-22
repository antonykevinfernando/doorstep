import { createClient } from '@/lib/supabase/server';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UploadDocumentDialog } from './upload-document-dialog';
import { DeleteDocumentButton } from './delete-document-button';

function formatBytes(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentsPage() {
  const supabase = await createClient();

  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      building:buildings!documents_building_id_fkey(name),
      move:moves!documents_move_id_fkey(
        scheduled_date,
        resident:profiles!moves_resident_id_fkey(full_name)
      )
    `)
    .order('created_at', { ascending: false });

  const { data: buildings } = await supabase.from('buildings').select('id, name');

  const { data: moves } = await supabase
    .from('moves')
    .select('id, scheduled_date, resident:profiles!moves_resident_id_fkey(full_name)')
    .order('scheduled_date', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Share files with residents
          </p>
        </div>
        <UploadDocumentDialog buildings={buildings ?? []} moves={moves ?? []} />
      </div>

      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!documents || documents.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No documents uploaded yet.
                </TableCell>
              </TableRow>
            )}
            {documents?.map((doc: any) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.title}</TableCell>
                <TableCell>
                  {doc.building?.name ? (
                    <Badge variant="secondary">{doc.building.name}</Badge>
                  ) : doc.move?.resident?.full_name ? (
                    <span className="text-sm">{doc.move.resident.full_name}</span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatBytes(doc.file_size)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell>
                  <DeleteDocumentButton id={doc.id} filePath={doc.file_path} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
