import { Button } from '@/Components/ui/button';
import { Download, Share2 } from '@/Lib/icons';
import { HStack } from '@/Components/ui/stack';

interface ActionFooterProps {
  onDownload: () => void;
  onShare: () => void;
  showDownload?: boolean;
}

export function ActionFooter({ onDownload, onShare, showDownload = true }: ActionFooterProps) {
  return (
    <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 -mx-0 mt-4">
      <HStack gap={3}>
        {showDownload && (
          <Button variant="secondary" onClick={onDownload} className="flex-1">
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
        <Button variant="secondary" onClick={onShare} className="flex-1">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </HStack>
    </div>
  );
}
