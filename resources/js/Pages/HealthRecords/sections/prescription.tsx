import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Alert } from '@/Components/ui/alert';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { Button } from '@/Components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible';
import {
  Pill,
  ClipboardList,
  Stethoscope,
  FileText,
  Clock,
  Check,
  ChevronDown,
  AlertTriangle,
} from '@/Lib/icons';
import { useState } from 'react';
import type { CategorySection, RecordMetadata } from '../types';

export function getPrescriptionSections(meta: RecordMetadata, category: string): CategorySection[] {
  const sections: CategorySection[] = [];

  const isActive = category === 'medication_active' || (category === 'prescription' && meta.valid_until && new Date(meta.valid_until) > new Date());
  const isPast = category === 'medication_past';

  // Status Badge
  sections.push({
    id: 'status',
    title: 'Status',
    icon: Pill,
    content: (
      <div className="p-6">
        {isActive ? (
          <Alert variant="info" hideIcon>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-info" />
                <span className="text-label">Active prescription</span>
                {meta.refills_remaining !== undefined && (
                  <span className="text-body text-muted-foreground">{meta.refills_remaining} refills remaining</span>
                )}
              </div>
            </div>
          </Alert>
        ) : isPast ? (
          <Alert variant="success" hideIcon>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
              <span className="text-label">{meta.reason_stopped || 'Course completed'}</span>
            </div>
          </Alert>
        ) : (
          <Alert variant="info" hideIcon>
            <span className="text-label">Prescription</span>
          </Alert>
        )}
      </div>
    ),
  });

  // Prescriber
  if (meta.prescribing_doctor) {
    sections.push({
      id: 'prescriber',
      title: 'Prescriber',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={meta.prescribing_doctor}
            specialty={meta.prescriber_specialty}
          />
        </div>
      ),
    });
  }

  // Diagnosis
  if (meta.prescription_diagnosis || meta.condition || meta.diagnosis) {
    const diagText = meta.prescription_diagnosis || meta.condition || meta.diagnosis;
    sections.push({
      id: 'diagnosis',
      title: 'Diagnosis',
      icon: FileText,
      content: (
        <div className="p-6">
          <Badge variant="info" size="lg">{diagText}</Badge>
        </div>
      ),
    });
  }

  // Medications (for prescription with drugs array)
  if (meta.drugs && meta.drugs.length > 0) {
    sections.push({
      id: 'medications',
      title: 'Medications',
      icon: Pill,
      content: (
        <div className="divide-y">
          {meta.drugs.map((drug, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Pill className="h-4 w-4 text-primary" />
                <span className="text-label text-foreground">{drug.name}</span>
              </div>
              {drug.generic_name && (
                <p className="text-caption text-muted-foreground ml-6">Generic: {drug.generic_name}</p>
              )}
              <div className="ml-6 mt-1 space-y-0.5">
                <p className="text-body text-muted-foreground">Dosage: {drug.dosage} · {drug.frequency}</p>
                <p className="text-body text-muted-foreground">Duration: {drug.duration}</p>
                {drug.instructions && <p className="text-body text-muted-foreground">Timing: {drug.instructions}</p>}
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Single medication details (for medication_active / medication_past)
  if (!meta.drugs && meta.drug_name) {
    sections.push({
      id: 'medication-details',
      title: 'Medication Details',
      icon: Pill,
      content: (
        <div className="divide-y">
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-primary" />
              <span className="text-label text-foreground">{meta.drug_name}</span>
            </div>
            <div className="ml-6 space-y-0.5">
              {meta.dosage && <p className="text-body text-muted-foreground">Dosage: {meta.dosage} · {meta.frequency}</p>}
              {meta.route && <p className="text-body text-muted-foreground">Route: {meta.route}</p>}
              {meta.timing && <p className="text-body text-muted-foreground">Timing: {meta.timing}</p>}
              {meta.medication_duration && <p className="text-body text-muted-foreground">Duration: {meta.medication_duration}</p>}
              {meta.with_food !== undefined && <p className="text-body text-muted-foreground">With food: {meta.with_food ? 'Yes' : 'No'}</p>}
              {meta.start_date && <p className="text-body text-muted-foreground">Start date: {meta.start_date}</p>}
              {meta.end_date && <p className="text-body text-muted-foreground">End date: {meta.end_date}</p>}
            </div>
          </div>
          {meta.how_it_works && (
            <DetailRow label="How it works">{meta.how_it_works}</DetailRow>
          )}
        </div>
      ),
    });
  }

  // General Instructions
  if (meta.general_instructions && meta.general_instructions.length > 0) {
    sections.push({
      id: 'instructions',
      title: 'Instructions',
      icon: ClipboardList,
      content: (
        <div className="p-6">
          <ul className="space-y-2">
            {meta.general_instructions.map((inst, i) => (
              <li key={i} className="text-body leading-relaxed text-foreground flex items-start gap-3">
                <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                <span>{inst}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  // Side Effects (collapsible, for medication records)
  if (meta.side_effects && meta.side_effects.length > 0) {
    sections.push({
      id: 'side-effects',
      title: 'Side Effects',
      icon: AlertTriangle,
      content: <SideEffectsSection meta={meta} />,
    });
  }

  // Adherence (for active medications)
  if (meta.adherence_this_week && category === 'medication_active') {
    sections.push({
      id: 'adherence',
      title: 'Adherence',
      icon: Check,
      content: (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-1">
            {meta.adherence_this_week.map((day, i) => (
              <div
                key={i}
                className={`h-8 w-8 rounded-full flex items-center justify-center text-micro ${
                  day === 'taken' ? 'bg-success/10 text-success' :
                  day === 'missed' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}
              >
                {day === 'taken' ? '✓' : day === 'missed' ? '✗' : '—'}
              </div>
            ))}
          </div>
          {meta.adherence_rate !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-caption text-muted-foreground">Adherence rate</span>
                <span className="text-label text-foreground">{meta.adherence_rate}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-success"
                  style={{ width: `${meta.adherence_rate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  // Refill (active prescriptions only)
  if (isActive && meta.refill_due_date) {
    const dueDate = new Date(meta.refill_due_date);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    sections.push({
      id: 'refill',
      title: 'Refill',
      icon: Clock,
      content: (
        <div className="p-6">
          <Card className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <Clock className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <p className="text-label text-foreground">
                    Refill due: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-body text-muted-foreground">{daysRemaining} days remaining</p>
                </div>
              </div>
              <Button variant="primary" size="sm">Request</Button>
            </div>
          </Card>
        </div>
      ),
    });
  }

  return sections;
}

function SideEffectsSection({ meta }: { meta: RecordMetadata }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center justify-between w-full px-6 py-4 h-auto rounded-none">
          <span className="text-label text-foreground">View side effects</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-6 pb-6 border-t border-border pt-4 space-y-3">
          <ul className="space-y-1">
            {meta.side_effects!.map((effect, i) => (
              <li key={i} className="text-body text-foreground flex items-start gap-2">
                <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                <span>{effect}</span>
              </li>
            ))}
          </ul>
          {meta.side_effects_warning && (
            <Alert variant="warning">{meta.side_effects_warning}</Alert>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
