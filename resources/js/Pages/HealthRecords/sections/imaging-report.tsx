import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { ScanLine, ClipboardList, FileText, Stethoscope, Eye, Check } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getImagingSections(meta: RecordMetadata, category: string): CategorySection[] {
  const sections: CategorySection[] = [];

  // Study Information
  const hasStudyInfo = meta.modality || meta.body_part || meta.contrast || meta.sequences || meta.views;
  if (hasStudyInfo) {
    sections.push({
      id: 'study-info',
      title: 'Study Information',
      icon: ScanLine,
      content: (
        <div className="divide-y">
          {meta.modality && <DetailRow label="Modality">{meta.modality}</DetailRow>}
          {meta.body_part && <DetailRow label="Body part">{meta.body_part}</DetailRow>}
          {meta.contrast && <DetailRow label="Contrast">{meta.contrast}</DetailRow>}
          {meta.sequences && <DetailRow label="Sequences">{meta.sequences}</DetailRow>}
          {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
          {meta.views && <DetailRow label="Views">{meta.views}</DetailRow>}
        </div>
      ),
    });
  }

  // Clinical Indication
  if (meta.indication) {
    sections.push({
      id: 'indication',
      title: 'Clinical Indication',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.indication}</p>
        </div>
      ),
    });
  }

  // Findings
  if (meta.structured_findings && meta.structured_findings.length > 0) {
    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="p-6 space-y-3">
          {meta.structured_findings.map((finding, i) => (
            <div key={i}>
              <span className="text-label text-foreground">{finding.region}:</span>{' '}
              <span className="text-body text-foreground">{finding.description}</span>
            </div>
          ))}
        </div>
      ),
    });
  } else if (meta.findings) {
    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.findings}</p>
        </div>
      ),
    });
  }

  // Impression
  if (meta.impression) {
    sections.push({
      id: 'impression',
      title: 'Impression',
      icon: FileText,
      content: (
        <div className="p-6">
          <Card className="p-4 bg-muted/30">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
              </span>
              <p className="text-body leading-relaxed text-foreground">{meta.impression}</p>
            </div>
          </Card>
        </div>
      ),
    });
  }

  // Specialist (Radiologist / Sonographer)
  const specialistName = category === 'ultrasound_report' ? meta.sonographer : meta.radiologist;
  if (specialistName) {
    sections.push({
      id: 'specialist',
      title: category === 'ultrasound_report' ? 'Sonographer' : 'Radiologist',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={specialistName}
            credentials={meta.radiologist_credentials}
          />
        </div>
      ),
    });
  }

  // Images (thumbnail grid)
  if (meta.images && meta.images.length > 0) {
    sections.push({
      id: 'images',
      title: 'Images',
      icon: Eye,
      content: (
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {meta.images.map((img, i) => (
              <button
                key={i}
                className="rounded-2xl overflow-hidden border border-border bg-muted/30 hover:border-primary transition-colors text-left"
                onClick={() => window.open(img.url, '_blank')}
              >
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                </div>
                <div className="px-3 py-2">
                  <p className="text-caption text-muted-foreground truncate">{img.label}</p>
                  <p className="text-micro text-placeholder">Click to view</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ),
    });
  }

  return sections;
}
