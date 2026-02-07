import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { VitalsGrid } from '@/Components/ui/vitals-grid';
import {
  Ambulance,
  ClipboardList,
  HeartPulse,
  FileText,
  Stethoscope,
} from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getErVisitSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Arrival
  const hasArrival = meta.arrival_time || meta.mode_of_arrival || meta.triage_level || meta.er_number;
  if (hasArrival) {
    sections.push({
      id: 'arrival',
      title: 'Arrival',
      icon: Ambulance,
      content: (
        <div className="divide-y">
          {meta.arrival_time && <DetailRow label="Time">{meta.arrival_time}</DetailRow>}
          {meta.mode_of_arrival && <DetailRow label="Mode">{meta.mode_of_arrival}</DetailRow>}
          {meta.triage_level && (
            <DetailRow label="Triage">
              <Badge variant={meta.triage_level.includes('1') || meta.triage_level.includes('Critical') ? 'danger' : meta.triage_level.includes('2') || meta.triage_level.includes('Emergent') ? 'warning' : 'info'} size="lg">
                {meta.triage_level}
              </Badge>
            </DetailRow>
          )}
          {meta.er_number && <DetailRow label="ER number">{meta.er_number}</DetailRow>}
        </div>
      ),
    });
  }

  // Chief Complaint
  if (meta.chief_complaint) {
    sections.push({
      id: 'chief-complaint',
      title: 'Chief Complaint',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.chief_complaint}</p>
        </div>
      ),
    });
  }

  // Vitals on Arrival
  if (meta.vitals) {
    const v = meta.vitals;
    const st = meta.vitals_status || {};
    const vitalsArr = [];
    if (v.temperature || v.temp) vitalsArr.push({ label: 'Temp', value: (v.temperature || v.temp || '').replace('°F', ''), unit: '°F', status: (st.temperature || st.temp)?.toLowerCase() as any });
    if (v.bp) vitalsArr.push({ label: 'BP', value: v.bp.replace(' mmHg', ''), unit: 'mmHg', status: st.bp?.toLowerCase() as any });
    if (v.pulse || v.heart_rate) vitalsArr.push({ label: 'Pulse', value: (v.pulse || v.heart_rate || '').replace(' bpm', ''), unit: 'bpm', status: (st.pulse || st.heart_rate)?.toLowerCase() as any });
    if (v.spo2) vitalsArr.push({ label: 'SpO₂', value: v.spo2.replace('%', ''), unit: '%', status: st.spo2?.toLowerCase() as any });

    if (vitalsArr.length > 0) {
      sections.push({
        id: 'vitals',
        title: 'Vitals on Arrival',
        icon: HeartPulse,
        content: (
          <div className="p-6">
            <VitalsGrid vitals={vitalsArr} />
          </div>
        ),
      });
    }
  }

  // Examination Findings
  if (meta.structured_examination && meta.structured_examination.length > 0) {
    sections.push({
      id: 'examination',
      title: 'Examination Findings',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <ul className="space-y-2">
            {meta.structured_examination.map((f, i) => (
              <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-3">
                <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  } else if (meta.examination) {
    sections.push({
      id: 'examination',
      title: 'Examination Findings',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.examination}</p>
        </div>
      ),
    });
  }

  // ER Diagnosis
  if (meta.diagnosis) {
    sections.push({
      id: 'diagnosis',
      title: 'ER Diagnosis',
      icon: FileText,
      content: (
        <div className="p-6">
          <Badge variant="danger" size="lg">{meta.diagnosis}</Badge>
        </div>
      ),
    });
  }

  // Treatment Given (UX fix: keeping this)
  if (meta.treatment_given || (meta.treatment_items && meta.treatment_items.length > 0)) {
    sections.push({
      id: 'treatment',
      title: 'Treatment Given',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          {meta.treatment_items && meta.treatment_items.length > 0 ? (
            <ul className="space-y-2">
              {meta.treatment_items.map((item, i) => (
                <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-3">
                  <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body leading-relaxed text-foreground">{meta.treatment_given}</p>
          )}
        </div>
      ),
    });
  }

  // Disposition
  if (meta.disposition) {
    sections.push({
      id: 'disposition',
      title: 'Disposition',
      icon: FileText,
      content: (
        <div className="p-6">
          <Card className="px-6 py-4 bg-muted/30">
            <p className="text-label text-foreground">{meta.disposition}</p>
            {meta.disposition_detail && (
              <p className="text-body text-muted-foreground mt-1">{meta.disposition_detail}</p>
            )}
          </Card>
        </div>
      ),
    });
  }

  return sections;
}
