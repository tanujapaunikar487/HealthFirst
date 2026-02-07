import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { ClipboardCheck, FileText, Calendar } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getOtherVisitSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Visit Details
  if (meta.visit_type || meta.duration) {
    sections.push({
      id: 'visit-details',
      title: 'Visit Details',
      icon: ClipboardCheck,
      content: (
        <div className="divide-y">
          {meta.visit_type && <DetailRow label="Visit type">{meta.visit_type}</DetailRow>}
          {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
        </div>
      ),
    });
  }

  // Notes
  if (meta.notes) {
    sections.push({
      id: 'notes',
      title: 'Notes',
      icon: FileText,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.notes}</p>
        </div>
      ),
    });
  }

  // Follow-up
  if (meta.follow_up) {
    sections.push({
      id: 'follow-up',
      title: 'Follow-up',
      icon: Calendar,
      content: (
        <div className="p-6">
          <Card className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
              </div>
              <p className="text-label text-foreground">{meta.follow_up}</p>
            </div>
          </Card>
        </div>
      ),
    });
  }

  return sections;
}
