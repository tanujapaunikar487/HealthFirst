import { DetailRow } from '@/Components/ui/detail-row';
import { Badge } from '@/Components/ui/badge';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { UserPlus, Stethoscope, FileText } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getReferralSections(meta: RecordMetadata, doctorName?: string | null): CategorySection[] {
  const sections: CategorySection[] = [];

  // Referring Doctor
  if (doctorName) {
    sections.push({
      id: 'referring-doctor',
      title: 'Referring Doctor',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard name={doctorName} />
        </div>
      ),
    });
  }

  // Referral Details
  const hasDetails = meta.referred_to_doctor || meta.referred_to_department || meta.priority;
  if (hasDetails) {
    sections.push({
      id: 'referral-details',
      title: 'Referral Details',
      icon: UserPlus,
      content: (
        <div className="divide-y">
          {meta.referred_to_doctor && <DetailRow label="Referred to">{meta.referred_to_doctor}</DetailRow>}
          {meta.referred_to_department && <DetailRow label="Department">{meta.referred_to_department}</DetailRow>}
          {meta.priority && (
            <DetailRow label="Priority">
              <Badge variant={meta.priority === 'urgent' ? 'danger' : 'neutral'} size="lg">
                {meta.priority.charAt(0).toUpperCase() + meta.priority.slice(1)}
              </Badge>
            </DetailRow>
          )}
        </div>
      ),
    });
  }

  // Reason
  if (meta.reason) {
    sections.push({
      id: 'reason',
      title: 'Reason',
      icon: FileText,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.reason}</p>
        </div>
      ),
    });
  }

  return sections;
}
