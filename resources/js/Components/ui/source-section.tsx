import { DetailSection } from '@/Components/ui/detail-section';
import { DetailRow } from '@/Components/ui/detail-row';
import { Building2 } from '@/Lib/icons';

interface SourceSectionProps {
  name: string;
  location?: string;
  title?: string;
  id?: string;
  icon?: React.ElementType;
}

export function SourceSection({
  name,
  location,
  title = 'Source',
  id = 'source',
  icon: Icon = Building2,
}: SourceSectionProps) {
  return (
    <DetailSection id={id} title={title} icon={Icon} noPadding>
      <div className="divide-y">
        <DetailRow label="Facility">{name}</DetailRow>
        {location && <DetailRow label="Location">{location}</DetailRow>}
      </div>
    </DetailSection>
  );
}
