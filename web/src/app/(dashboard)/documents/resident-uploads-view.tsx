'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Download, FileText, ExternalLink } from 'lucide-react';

interface ResidentUpload {
  id: string;
  taskTitle: string;
  taskType: string;
  filePath: string;
  fileName: string;
  completedAt: string;
  residentName: string;
  unitName: string;
  buildingName: string;
}

interface Props {
  uploads: ResidentUpload[];
}

type GroupedUploads = Record<string, {
  residentName: string;
  buildingName: string;
  unitName: string;
  files: ResidentUpload[];
}>;

export function ResidentUploadsView({ uploads }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (uploads.length === 0) {
    return (
      <div className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm p-8 text-center text-muted-foreground">
        No resident uploads yet.
      </div>
    );
  }

  const grouped: GroupedUploads = {};
  for (const u of uploads) {
    const key = u.residentName;
    if (!grouped[key]) {
      grouped[key] = {
        residentName: u.residentName,
        buildingName: u.buildingName,
        unitName: u.unitName,
        files: [],
      };
    }
    grouped[key].files.push(u);
  }

  const residents = Object.values(grouped).sort((a, b) =>
    a.residentName.localeCompare(b.residentName),
  );

  function toggleResident(name: string) {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  async function openFile(filePath: string) {
    const supabase = createClient();
    const { data } = await supabase.storage.from('documents').createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="space-y-3">
      {residents.map((group) => {
        const isOpen = expanded[group.residentName] ?? false;
        return (
          <div
            key={group.residentName}
            className="rounded-xl border border-black/5 bg-white/60 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() => toggleResident(group.residentName)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium flex-1">{group.residentName}</span>
              {group.buildingName && (
                <Badge variant="secondary" className="text-xs">
                  {group.buildingName}{group.unitName ? ` · ${group.unitName}` : ''}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {group.files.length} file{group.files.length !== 1 ? 's' : ''}
              </Badge>
            </button>

            {isOpen && (
              <div className="border-t border-black/5">
                {group.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] transition-colors border-b border-black/[0.03] last:border-0"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.taskTitle} · {new Date(file.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => openFile(file.filePath)}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
