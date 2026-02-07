import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { Button } from '@/Components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import {
  Syringe,
  User,
  ClipboardList,
  Calendar,
  Check,
  Stethoscope,
  ShieldCheck,
} from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getVaccinationSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Patient Details
  if (meta.patient_dob || meta.id_type || meta.id_number) {
    sections.push({
      id: 'patient-details',
      title: 'Patient Details',
      icon: User,
      content: (
        <div className="divide-y">
          {meta.patient_dob && <DetailRow label="Date of birth">{meta.patient_dob}</DetailRow>}
          {meta.id_type && <DetailRow label="ID type">{meta.id_type}</DetailRow>}
          {meta.id_number && <DetailRow label="ID number">{meta.id_number}</DetailRow>}
        </div>
      ),
    });
  }

  // Vaccination Status
  if (meta.dose_number !== undefined && meta.total_doses !== undefined) {
    const isComplete = meta.dose_number >= meta.total_doses;
    sections.push({
      id: 'vaccination-status',
      title: 'Vaccination Status',
      icon: ShieldCheck,
      content: (
        <div className="p-6">
          <Card className={`p-4 ${isComplete ? 'bg-success-subtle' : 'bg-info-subtle'}`}>
            <div className="flex items-center gap-3">
              {isComplete ? (
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0">
                  <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                </span>
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-info flex-shrink-0" />
              )}
              <div>
                <p className={`text-label ${isComplete ? 'text-success-subtle-foreground' : 'text-info-subtle-foreground'}`}>
                  {isComplete ? 'Fully vaccinated' : 'Partially vaccinated'}
                </p>
                <p className={`text-body ${isComplete ? 'text-success-subtle-foreground' : 'text-info-subtle-foreground'}`}>
                  {meta.dose_number} of {meta.total_doses} doses completed
                </p>
                {!isComplete && meta.next_due_date && (
                  <p className={`text-body ${isComplete ? 'text-success-subtle-foreground' : 'text-info-subtle-foreground'}`}>
                    Next dose due: {meta.next_due_date}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      ),
    });
  }

  // Vaccine Details
  if (meta.vaccine_name || meta.manufacturer || meta.target_disease) {
    sections.push({
      id: 'vaccine-details',
      title: 'Vaccine Details',
      icon: Syringe,
      content: (
        <div className="divide-y">
          {meta.vaccine_name && (
            <div className="px-6 py-4">
              <p className="text-subheading text-foreground">{meta.vaccine_name}</p>
            </div>
          )}
          {meta.manufacturer && <DetailRow label="Manufacturer">{meta.manufacturer}</DetailRow>}
          {meta.target_disease && <DetailRow label="Disease">{meta.target_disease}</DetailRow>}
        </div>
      ),
    });
  }

  // Dose History
  if (meta.vaccination_history && meta.vaccination_history.length > 0) {
    sections.push({
      id: 'dose-history',
      title: 'Dose History',
      icon: ClipboardList,
      content: (
        <div className="divide-y">
          {meta.vaccination_history.map((entry, i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label text-foreground">{entry.dose_label}</span>
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10">
                  <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                </span>
              </div>
              <div className="space-y-0.5">
                <p className="text-body text-muted-foreground">Date: {entry.date}</p>
                <p className="text-body text-muted-foreground">Batch No: {entry.batch_number}</p>
                <p className="text-body text-muted-foreground">Site: {entry.site}</p>
                <p className="text-body text-muted-foreground">Administered by: {entry.administered_by}</p>
              </div>
            </div>
          ))}

          {/* Pending dose if not fully vaccinated */}
          {meta.dose_number !== undefined && meta.total_doses !== undefined && meta.dose_number < meta.total_doses && meta.next_due_date && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label text-foreground">Dose {meta.dose_number + 1}</span>
                <span className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body text-muted-foreground">Due: {meta.next_due_date}</p>
                  <p className="text-body text-muted-foreground">Status: Pending</p>
                </div>
                <Button variant="primary" size="sm">Schedule</Button>
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  // Next Vaccination
  if (meta.upcoming_vaccinations && meta.upcoming_vaccinations.length > 0) {
    sections.push({
      id: 'next-vaccination',
      title: 'Next Vaccination',
      icon: Calendar,
      content: (
        <div className="divide-y">
          {meta.upcoming_vaccinations.map((vac, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div>
                  <p className="text-label text-foreground">Next dose due: {vac.due_date}</p>
                  <p className="text-body text-muted-foreground">{vac.vaccine_name} — {vac.dose_label}</p>
                </div>
              </div>
              <Button variant="primary" size="sm">Schedule</Button>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Certificate ID with QR Code
  if (meta.certificate_number || meta.qr_code_data) {
    sections.push({
      id: 'certificate',
      title: 'Certificate',
      icon: ShieldCheck,
      content: (
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {meta.certificate_number && (
              <p className="text-body text-muted-foreground">
                Certificate No: <span className="text-label text-foreground">{meta.certificate_number}</span>
              </p>
            )}
            {meta.certificate_issued_date && (
              <p className="text-body text-muted-foreground">
                Issued: <span className="text-label text-foreground">{meta.certificate_issued_date}</span>
              </p>
            )}
            {meta.certificate_valid_for && (
              <p className="text-body text-muted-foreground">
                Valid for: <span className="text-label text-foreground">{meta.certificate_valid_for}</span>
              </p>
            )}
          </div>
          {meta.qr_code_data && (
            <div className="flex flex-col items-center pt-4">
              <QRCodeSVG value={meta.qr_code_data} size={120} />
              <p className="text-caption text-muted-foreground mt-2">Scan to verify</p>
            </div>
          )}
        </div>
      ),
    });
  }

  // Administered By
  if (meta.administered_by) {
    sections.push({
      id: 'administered-by',
      title: 'Administered By',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={meta.administered_by}
            credentials={meta.qualification}
            registrationNo={meta.registration_no}
          />
        </div>
      ),
    });
  }

  return sections;
}
