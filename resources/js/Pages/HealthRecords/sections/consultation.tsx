import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { VitalsGrid } from '@/Components/ui/vitals-grid';
import { Button } from '@/Components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible';
import {
  Stethoscope,
  ClipboardList,
  HeartPulse,
  FileText,
  Calendar,
  ChevronDown,
} from '@/Lib/icons';
import { useState } from 'react';
import type { CategorySection, RecordMetadata } from '../types';

export function getConsultationSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Doctor
  if (meta.prescribing_doctor || meta.doctor_specialty || meta.clinic_name) {
    sections.push({
      id: 'doctor',
      title: 'Doctor',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={meta.prescribing_doctor || ''}
            specialty={meta.doctor_specialty}
            clinicName={meta.clinic_name}
          />
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

  // Vitals
  if (meta.vitals) {
    const vitalsArr = [];
    const v = meta.vitals;
    const st = meta.vitals_status || {};
    if (v.bp) vitalsArr.push({ label: 'BP', value: v.bp.replace(' mmHg', ''), unit: 'mmHg', status: st.bp?.toLowerCase() as any });
    if (v.pulse) vitalsArr.push({ label: 'Pulse', value: v.pulse.replace(' bpm', ''), unit: 'bpm', status: st.pulse?.toLowerCase() as any });
    if (v.weight) vitalsArr.push({ label: 'Weight', value: v.weight.replace(' kg', ''), unit: 'kg' });
    if (v.bmi) vitalsArr.push({ label: 'BMI', value: v.bmi, unit: 'kg/m²' });
    if (v.spo2) vitalsArr.push({ label: 'SpO₂', value: v.spo2.replace('%', ''), unit: '%', status: st.spo2?.toLowerCase() as any });
    if (v.temperature) vitalsArr.push({ label: 'Temp', value: v.temperature.replace('°F', ''), unit: '°F', status: st.temperature?.toLowerCase() as any });

    if (vitalsArr.length > 0) {
      sections.push({
        id: 'vitals',
        title: 'Vitals',
        icon: HeartPulse,
        content: (
          <div className="p-6">
            <VitalsGrid vitals={vitalsArr} />
          </div>
        ),
      });
    }
  }

  // Examination
  if (meta.clinical_examination || meta.examination_findings) {
    sections.push({
      id: 'examination',
      title: 'Examination',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">
            {meta.clinical_examination || meta.examination_findings}
          </p>
        </div>
      ),
    });
  }

  // Diagnosis
  if (meta.diagnosis) {
    sections.push({
      id: 'diagnosis',
      title: 'Diagnosis',
      icon: FileText,
      content: (
        <div className="p-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="info" size="lg">{meta.diagnosis}</Badge>
            {meta.icd_code && (
              <Badge variant="neutral" size="sm">{meta.icd_code}</Badge>
            )}
          </div>
        </div>
      ),
    });
  }

  // Plan
  if (meta.treatment_plan_steps && meta.treatment_plan_steps.length > 0) {
    sections.push({
      id: 'plan',
      title: 'Plan',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <ul className="space-y-2">
            {meta.treatment_plan_steps.map((step, i) => (
              <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-3">
                <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  } else if (meta.treatment_plan) {
    sections.push({
      id: 'plan',
      title: 'Plan',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed text-foreground">{meta.treatment_plan}</p>
        </div>
      ),
    });
  }

  // Clinical Details (collapsible — symptoms + history)
  const hasClinicalDetails = (meta.symptoms && meta.symptoms.length > 0) || meta.history_of_present_illness;
  if (hasClinicalDetails) {
    sections.push({
      id: 'clinical-details',
      title: 'Clinical Details',
      icon: FileText,
      content: <ClinicalDetails meta={meta} />,
    });
  }

  // Follow-up
  if (meta.follow_up_date || meta.follow_up_recommendation) {
    sections.push({
      id: 'follow-up',
      title: 'Follow-up',
      icon: Calendar,
      content: (
        <div className="p-6">
          <Card className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  {meta.follow_up_date && (
                    <p className="text-label text-foreground">
                      Follow-up: {new Date(meta.follow_up_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {meta.follow_up_recommendation && (
                    <p className="text-body text-muted-foreground">{meta.follow_up_recommendation}</p>
                  )}
                </div>
              </div>
              <Button variant="primary" size="sm">Book now</Button>
            </div>
          </Card>
        </div>
      ),
    });
  }

  return sections;
}

function ClinicalDetails({ meta }: { meta: RecordMetadata }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center justify-between w-full px-6 py-4 h-auto rounded-none">
          <span className="text-label text-foreground">View clinical details</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border space-y-6 p-6">
          {meta.symptoms && meta.symptoms.length > 0 && (
            <div>
              <p className="text-overline text-muted-foreground mb-2">Symptoms</p>
              <div className="flex flex-wrap gap-2">
                {meta.symptoms.map((s, i) => (
                  <Badge key={i} variant="neutral" size="lg">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {meta.history_of_present_illness && (
            <div>
              <p className="text-overline text-muted-foreground mb-2">History of present illness</p>
              <p className="text-body leading-relaxed text-foreground">{meta.history_of_present_illness}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
