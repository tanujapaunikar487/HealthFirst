import { DetailRow } from '@/Components/ui/detail-row';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { DocumentPreview } from '@/Components/ui/document-preview';
import { FileText, ClipboardList, Pencil, Plus } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getDocumentSections(meta: RecordMetadata, fileUrl?: string | null, fileType?: string | null): CategorySection[] {
  const sections: CategorySection[] = [];

  // Document Info
  sections.push({
    id: 'document-info',
    title: 'Document Info',
    icon: FileText,
    content: (
      <div className="divide-y">
        {meta.document_type && <DetailRow label="Type">{meta.document_type}</DetailRow>}
        {meta.original_date && <DetailRow label="Original date">{meta.original_date}</DetailRow>}
        {meta.upload_date && <DetailRow label="Uploaded">{meta.upload_date}</DetailRow>}
        {meta.file_name && (
          <DetailRow label="File">
            {meta.file_name}
            {meta.file_size && <span className="text-muted-foreground"> · {meta.file_size}</span>}
          </DetailRow>
        )}
      </div>
    ),
  });

  // User Notes
  if (meta.user_notes) {
    sections.push({
      id: 'user-notes',
      title: 'Notes',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-body leading-relaxed text-foreground">{meta.user_notes}</p>
            <Button variant="ghost" iconOnly size="sm">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ),
    });
  }

  // Document Preview
  sections.push({
    id: 'preview',
    title: 'Document Preview',
    icon: FileText,
    content: (
      <div className="p-6">
        <DocumentPreview
          fileUrl={fileUrl}
          fileType={fileType}
          fileName={meta.file_name}
        />
      </div>
    ),
  });

  // Tags
  if (meta.tags && meta.tags.length > 0) {
    sections.push({
      id: 'tags',
      title: 'Tags',
      icon: FileText,
      content: (
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {meta.tags.map((tag, i) => (
              <Badge key={i} variant="neutral" size="lg">{tag}</Badge>
            ))}
            <Button variant="ghost" size="xs">
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        </div>
      ),
    });
  }

  return sections;
}
