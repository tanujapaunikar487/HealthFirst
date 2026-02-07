import { DetailRow } from '@/Components/ui/detail-row';
import { Syringe, ClipboardList, FileText, Users } from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getProcedureSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Surgical Team
  if (meta.surgical_team && meta.surgical_team.length > 0) {
    sections.push({
      id: 'surgical-team',
      title: 'Surgical Team',
      icon: Users,
      content: (
        <div className="divide-y">
          {meta.surgical_team.map((member, i) => (
            <div key={i} className="px-6 py-4">
              <p className="text-caption text-muted-foreground mb-1">{member.role}</p>
              <p className="text-label text-foreground">
                {member.name}
                {member.credentials && (
                  <span className="text-body text-muted-foreground">, {member.credentials}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Procedure Details
  const hasProcDetails = meta.procedure_name || meta.indication || meta.anesthesia || meta.duration || meta.blood_loss || meta.complications;
  if (hasProcDetails) {
    sections.push({
      id: 'procedure-details',
      title: 'Procedure Details',
      icon: Syringe,
      content: (
        <div className="divide-y">
          {meta.procedure_name && <DetailRow label="Procedure">{meta.procedure_name}</DetailRow>}
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.anesthesia && <DetailRow label="Anesthesia">{meta.anesthesia}</DetailRow>}
          {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
          {meta.blood_loss && <DetailRow label="Blood loss">{meta.blood_loss}</DetailRow>}
          {meta.complications && <DetailRow label="Complications">{meta.complications}</DetailRow>}
        </div>
      ),
    });
  }

  // Operative Findings
  if (meta.structured_findings && meta.structured_findings.length > 0) {
    sections.push({
      id: 'findings',
      title: 'Operative Findings',
      icon: FileText,
      content: (
        <div className="p-6">
          <ul className="space-y-2">
            {meta.structured_findings.map((f, i) => (
              <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-3">
                <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                <span>{f.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  } else if (meta.findings) {
    sections.push({
      id: 'findings',
      title: 'Operative Findings',
      icon: FileText,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.findings}</p>
        </div>
      ),
    });
  }

  // Operative Technique
  if (meta.technique) {
    sections.push({
      id: 'technique',
      title: 'Operative Technique',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.technique}</p>
        </div>
      ),
    });
  }

  // Post-operative Instructions (UX fix: keeping this even though template dropped it)
  if (meta.post_op_instructions) {
    sections.push({
      id: 'post-op',
      title: 'Post-operative Instructions',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.post_op_instructions}</p>
        </div>
      ),
    });
  }

  return sections;
}
