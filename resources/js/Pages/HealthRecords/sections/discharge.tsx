import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Alert } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible';
import {
  FileText,
  ClipboardList,
  HeartPulse,
  Pill,
  Calendar,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
} from '@/Lib/icons';
import { useState } from 'react';
import type { CategorySection, RecordMetadata } from '../types';

export function getDischargeSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Admission Details
  const hasAdmission = meta.admission_date || meta.discharge_date || meta.length_of_stay || meta.room_info;
  if (hasAdmission) {
    sections.push({
      id: 'admission',
      title: 'Admission Details',
      icon: ClipboardList,
      content: (
        <div className="divide-y">
          {meta.admission_date && <DetailRow label="Admission">{meta.admission_date}</DetailRow>}
          {meta.discharge_date && <DetailRow label="Discharge">{meta.discharge_date}</DetailRow>}
          {meta.length_of_stay && <DetailRow label="Total stay">{meta.length_of_stay}</DetailRow>}
          {meta.room_info && <DetailRow label="Room">{meta.room_info}</DetailRow>}
        </div>
      ),
    });
  }

  // Diagnosis
  if (meta.primary_diagnosis) {
    sections.push({
      id: 'diagnosis',
      title: 'Diagnosis',
      icon: FileText,
      content: (
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="info" size="lg">{meta.primary_diagnosis}</Badge>
            {meta.secondary_diagnosis && (
              <Badge variant="neutral" size="lg">{meta.secondary_diagnosis}</Badge>
            )}
          </div>
        </div>
      ),
    });
  }

  // Procedure Performed
  if (meta.procedure_performed) {
    sections.push({
      id: 'procedure',
      title: 'Procedure Performed',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <Card className="px-6 py-4 bg-muted/30">
            <p className="text-label text-foreground">{meta.procedure_performed}</p>
          </Card>
        </div>
      ),
    });
  }

  // Condition at Discharge
  if (meta.condition_at_discharge) {
    sections.push({
      id: 'condition',
      title: 'Condition at Discharge',
      icon: HeartPulse,
      content: (
        <div className="p-6">
          <Card className="p-4 bg-success-subtle">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0">
                <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
              </span>
              <span className="text-label text-success-subtle-foreground">{meta.condition_at_discharge}</span>
            </div>
          </Card>
        </div>
      ),
    });
  }

  // Discharge Medications
  if (meta.discharge_medications && meta.discharge_medications.length > 0) {
    sections.push({
      id: 'medications',
      title: 'Discharge Medications',
      icon: Pill,
      content: (
        <div className="divide-y">
          {meta.discharge_medications.map((med, i) => (
            <div key={i} className="px-6 py-4">
              <p className="text-label text-foreground">{med.name}</p>
              <p className="text-body text-muted-foreground">
                {med.dosage} · {med.duration}
              </p>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Follow-up
  if (meta.follow_up_schedule && meta.follow_up_schedule.length > 0) {
    sections.push({
      id: 'follow-up',
      title: 'Follow-up',
      icon: Calendar,
      content: (
        <div className="divide-y">
          {meta.follow_up_schedule.map((item, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <p className="text-label text-foreground">{item.date} — {item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      ),
    });
  }

  // Warning Signs
  if (meta.warning_signs && meta.warning_signs.length > 0) {
    sections.push({
      id: 'warning-signs',
      title: 'Warning Signs',
      icon: AlertTriangle,
      content: (
        <div className="p-6 space-y-4">
          <Alert variant="warning">
            <p className="text-label mb-2">Return to hospital immediately if:</p>
            <ul className="space-y-1">
              {meta.warning_signs.map((sign, i) => (
                <li key={i} className="text-body flex items-start gap-2">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </Alert>

          {/* Do's and Don'ts merged here */}
          {meta.discharge_dos && meta.discharge_dos.length > 0 && (
            <div>
              <p className="text-overline text-muted-foreground mb-2">Do&apos;s</p>
              <ul className="space-y-1">
                {meta.discharge_dos.map((item, i) => (
                  <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meta.discharge_donts && meta.discharge_donts.length > 0 && (
            <div>
              <p className="text-overline text-muted-foreground mb-2">Don&apos;ts</p>
              <ul className="space-y-1">
                {meta.discharge_donts.map((item, i) => (
                  <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    });
  }

  // Hospital Course (collapsible — UX fix: keeping this)
  if (meta.hospital_course) {
    sections.push({
      id: 'hospital-course',
      title: 'Hospital Course',
      icon: FileText,
      content: <HospitalCourse text={meta.hospital_course} />,
    });
  }

  return sections;
}

function HospitalCourse({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center justify-between w-full px-6 py-4 h-auto rounded-none">
          <span className="text-label text-foreground">View hospital course</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-6 pb-6 border-t border-border pt-4">
          <p className="text-body leading-relaxed text-foreground">{text}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
