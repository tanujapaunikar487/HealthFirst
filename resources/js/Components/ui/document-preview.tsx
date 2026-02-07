import { useState } from 'react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { ChevronLeft, ChevronRight, Eye, Download, FileText } from '@/Lib/icons';

interface DocumentPreviewProps {
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string;
}

export function DocumentPreview({ fileUrl, fileType, fileName }: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1; // Mock — real implementation would detect pages

  if (!fileUrl) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-muted mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-label text-foreground mb-1">No preview available</p>
          <p className="text-body text-muted-foreground">
            {fileName ? `${fileName} — ` : ''}Download the file to view its contents
          </p>
        </div>
      </Card>
    );
  }

  const isImage = fileType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  const isPdf = fileType === 'pdf' || /\.pdf$/i.test(fileUrl);

  if (isImage) {
    return (
      <Card className="overflow-hidden">
        <div className="relative bg-muted/30">
          <img
            src={fileUrl}
            alt={fileName || 'Document preview'}
            className="w-full max-h-96 object-contain"
          />
        </div>
        <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
            <Eye className="h-4 w-4" />
            View full screen
          </Button>
        </div>
      </Card>
    );
  }

  if (isPdf) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-muted/30">
          <iframe
            src={fileUrl}
            title={fileName || 'Document preview'}
            className="w-full h-96 border-0"
          />
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              iconOnly
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-caption text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              iconOnly
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
            <Eye className="h-4 w-4" />
            View full screen
          </Button>
        </div>
      </Card>
    );
  }

  // Fallback for unsupported types
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full flex items-center justify-center bg-muted mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-label text-foreground mb-1">{fileName || 'Document'}</p>
        <p className="text-body text-muted-foreground mb-4">Preview not available for this file type</p>
        <Button variant="secondary" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
          <Download className="h-4 w-4" />
          Download to view
        </Button>
      </div>
    </Card>
  );
}
