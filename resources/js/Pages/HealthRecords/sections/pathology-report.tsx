import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { Microscope, ClipboardList, FileText, Stethoscope, Check, AlertTriangle } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getPathologySections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Specimen Details
  if (meta.specimen_type || meta.method || meta.collected_date_pathology || meta.lmp) {
    sections.push({
      id: 'specimen',
      title: 'Specimen Details',
      icon: Microscope,
      content: (
        <div className="divide-y">
          {meta.specimen_type && <DetailRow label="Specimen">{meta.specimen_type}</DetailRow>}
          {meta.method && <DetailRow label="Method">{meta.method}</DetailRow>}
          {meta.collected_date_pathology && <DetailRow label="Collected">{meta.collected_date_pathology}</DetailRow>}
          {meta.lmp && <DetailRow label="LMP">{meta.lmp}</DetailRow>}
        </div>
      ),
    });
  }

  // Adequacy
  if (meta.adequacy) {
    const isAdequate = meta.adequacy.toLowerCase().includes('satisfactory');
    sections.push({
      id: 'adequacy',
      title: 'Adequacy',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <Card className={`p-4 ${isAdequate ? 'bg-success-subtle' : 'bg-warning-subtle'}`}>
            <div className="flex items-center gap-3">
              {isAdequate ? (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0">
                  <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                </span>
              ) : (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-warning/10 flex-shrink-0">
                  <AlertTriangle className="h-3 w-3" style={{ color: 'hsl(var(--warning))' }} />
                </span>
              )}
              <span className={`text-label ${isAdequate ? 'text-success-subtle-foreground' : 'text-warning-subtle-foreground'}`}>
                {meta.adequacy}
              </span>
            </div>
          </Card>
        </div>
      ),
    });
  }

  // Result (prominent display)
  if (meta.diagnosis || meta.gross_description) {
    sections.push({
      id: 'result',
      title: 'Result',
      icon: FileText,
      content: (
        <div className="p-6">
          <Card className="p-6 text-center bg-muted/30">
            <div className="flex flex-col items-center gap-3">
              <span className="flex items-center justify-center h-10 w-10 rounded-full bg-success/10">
                <Check className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
              </span>
              {meta.diagnosis && (
                <p className="text-subheading text-foreground">{meta.diagnosis}</p>
              )}
              {meta.grade && (
                <p className="text-body text-muted-foreground">Grade: {meta.grade}</p>
              )}
              {meta.gross_description && (
                <p className="text-body text-muted-foreground leading-relaxed">{meta.gross_description}</p>
              )}
            </div>
          </Card>
        </div>
      ),
    });
  }

  // Findings (bulleted)
  if (meta.microscopic_findings) {
    const findings = meta.microscopic_findings.includes('\n')
      ? meta.microscopic_findings.split('\n').filter(Boolean)
      : [meta.microscopic_findings];

    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="p-6">
          {findings.length > 1 ? (
            <ul className="space-y-2">
              {findings.map((f, i) => (
                <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-3">
                  <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body leading-relaxed text-foreground">{findings[0]}</p>
          )}
        </div>
      ),
    });
  }

  // Recommendation
  if (meta.recommendation) {
    sections.push({
      id: 'recommendation',
      title: 'Recommendation',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <Card className="p-4 bg-muted/30">
            <p className="text-body leading-relaxed text-foreground">
              <span className="text-label">Routine screening:</span> {meta.recommendation}
            </p>
          </Card>
        </div>
      ),
    });
  }

  // Pathologist
  if (meta.pathologist) {
    sections.push({
      id: 'pathologist',
      title: 'Pathologist',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={meta.pathologist}
            credentials={meta.pathologist_credentials}
          />
        </div>
      ),
    });
  }

  return sections;
}
