import { DetailRow } from '@/Components/ui/detail-row';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Alert } from '@/Components/ui/alert';
import { SpecialistCard } from '@/Components/ui/specialist-card';
import { QRCodeSVG } from 'qrcode.react';
import {
  Award,
  User,
  ClipboardList,
  Calendar,
  Check,
  X,
  Stethoscope,
  ShieldCheck,
} from '@/Lib/icons';
import type { CategorySection, RecordMetadata } from '../types';

export function getMedicalCertificateSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Certificate Type
  if (meta.certificate_type) {
    sections.push({
      id: 'certificate-type',
      title: 'Certificate Type',
      icon: Award,
      content: (
        <div className="p-6">
          <Badge variant="info" size="lg">{meta.certificate_type}</Badge>
        </div>
      ),
    });
  }

  // Patient Details
  if (meta.patient_age_cert || meta.patient_gender || meta.patient_id) {
    sections.push({
      id: 'patient-details',
      title: 'Patient Details',
      icon: User,
      content: (
        <div className="divide-y">
          {meta.patient_age_cert && <DetailRow label="Age">{meta.patient_age_cert} years</DetailRow>}
          {meta.patient_gender && <DetailRow label="Gender">{meta.patient_gender}</DetailRow>}
          {meta.patient_id && <DetailRow label="ID">{meta.patient_id}</DetailRow>}
        </div>
      ),
    });
  }

  // Certificate Details (varies by sub-type)
  const subType = meta.certificate_sub_type || meta.certificate_type || '';

  if (subType.toLowerCase().includes('fitness')) {
    // Fitness Certificate
    sections.push({
      id: 'certificate-details',
      title: 'Certificate Details',
      icon: ClipboardList,
      content: (
        <div className="space-y-0">
          {meta.purpose && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-1">Purpose</p>
              <p className="text-label text-foreground">{meta.purpose}</p>
            </div>
          )}
          {meta.examination_date && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-1">Examination date</p>
              <p className="text-label text-foreground">{meta.examination_date}</p>
            </div>
          )}
          {meta.system_findings && meta.system_findings.length > 0 && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-2">Findings</p>
              <ul className="space-y-1">
                {meta.system_findings.map((f, i) => (
                  <li key={i} className="text-body text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                    <span>{f.system}: <span className="text-label">{f.status}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meta.conclusion && (
            <div className="p-6">
              <Card className="p-4 bg-success-subtle">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0">
                    <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                  </span>
                  <span className="text-label text-success-subtle-foreground">{meta.conclusion}</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      ),
    });
  } else if (subType.toLowerCase().includes('sick') || subType.toLowerCase().includes('leave')) {
    // Sick Leave Certificate
    sections.push({
      id: 'certificate-details',
      title: 'Certificate Details',
      icon: ClipboardList,
      content: (
        <div className="space-y-0">
          {meta.leave_diagnosis && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-1">Diagnosis</p>
              <p className="text-label text-foreground">{meta.leave_diagnosis}</p>
            </div>
          )}
          {(meta.leave_from || meta.leave_to) && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-1">Leave period</p>
              <p className="text-label text-foreground">
                {meta.leave_from && <span>From: {meta.leave_from}</span>}
                {meta.leave_from && meta.leave_to && <span> — </span>}
                {meta.leave_to && <span>To: {meta.leave_to}</span>}
              </p>
              {meta.leave_duration && (
                <p className="text-body text-muted-foreground">Duration: {meta.leave_duration}</p>
              )}
            </div>
          )}
          {meta.certificate_content && (
            <div className="p-6">
              <Card className="p-4 bg-muted/30">
                <p className="text-body leading-relaxed text-foreground">{meta.certificate_content}</p>
              </Card>
            </div>
          )}
        </div>
      ),
    });
  } else if (subType.toLowerCase().includes('clearance')) {
    // Medical Clearance
    sections.push({
      id: 'certificate-details',
      title: 'Certificate Details',
      icon: ClipboardList,
      content: (
        <div className="space-y-0">
          {meta.clearance_for && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-1">Clearance for</p>
              <p className="text-label text-foreground">{meta.clearance_for}</p>
            </div>
          )}
          {meta.relevant_history && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-1">Relevant history</p>
              <p className="text-body text-foreground">{meta.relevant_history}</p>
            </div>
          )}
          {meta.tests_performed && meta.tests_performed.length > 0 && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-overline text-muted-foreground mb-2">Tests performed</p>
              <ul className="space-y-1">
                {meta.tests_performed.map((t, i) => (
                  <li key={i} className="text-body text-foreground flex items-start gap-2">
                    <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                    <span>{t.name}: <span className="text-label">{t.result}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meta.clearance_status && (
            <div className="p-6">
              {meta.clearance_conditions && meta.clearance_conditions.length > 0 ? (
                <Alert variant="warning">
                  <p className="text-label mb-2">Cleared with conditions:</p>
                  <ul className="space-y-1">
                    {meta.clearance_conditions.map((c, i) => (
                      <li key={i} className="text-body flex items-start gap-2">
                        <span className="flex-shrink-0 mt-1">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </Alert>
              ) : (
                <Card className="p-4 bg-success-subtle">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10 flex-shrink-0">
                      <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                    </span>
                    <span className="text-label text-success-subtle-foreground">{meta.clearance_status}</span>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      ),
    });
  } else {
    // Fallback: generic certificate content
    if (meta.certificate_content || meta.examination_findings_list) {
      sections.push({
        id: 'certificate-details',
        title: 'Certificate Details',
        icon: ClipboardList,
        content: (
          <div className="space-y-0">
            {meta.issued_for && (
              <DetailRow label="Issued for">{meta.issued_for}</DetailRow>
            )}
            {meta.certificate_content && (
              <div className="p-6">
                <p className="text-body leading-relaxed text-foreground">{meta.certificate_content}</p>
              </div>
            )}
            {meta.examination_findings_list && meta.examination_findings_list.length > 0 && (
              <div className="p-6">
                <p className="text-overline text-muted-foreground mb-2">Examination findings</p>
                <ul className="space-y-1">
                  {meta.examination_findings_list.map((f, i) => (
                    <li key={i} className="text-body text-foreground flex items-start gap-2">
                      <span className="text-muted-foreground flex-shrink-0 mt-1">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ),
      });
    }
  }

  // Validity
  if (meta.valid_from || meta.valid_until) {
    const isValid = meta.valid_until ? new Date(meta.valid_until) > new Date() : true;
    sections.push({
      id: 'validity',
      title: 'Validity',
      icon: Calendar,
      content: (
        <div className="p-6">
          <Card className="p-4">
            <div className="space-y-2">
              {meta.valid_from && (
                <p className="text-body text-muted-foreground">
                  Valid from: <span className="text-label text-foreground">{meta.valid_from}</span>
                </p>
              )}
              {meta.valid_until && (
                <p className="text-body text-muted-foreground">
                  Valid until: <span className="text-label text-foreground">{meta.valid_until}</span>
                </p>
              )}
              <div className="pt-2 border-t border-border">
                {isValid ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-success/10">
                      <Check className="h-3 w-3" style={{ color: 'hsl(var(--success))' }} />
                    </span>
                    <span className="text-label" style={{ color: 'hsl(var(--success))' }}>Currently valid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10">
                      <X className="h-3 w-3" style={{ color: 'hsl(var(--destructive))' }} />
                    </span>
                    <span className="text-label" style={{ color: 'hsl(var(--destructive))' }}>
                      Expired on {meta.valid_until}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      ),
    });
  }

  // Issuing Authority
  if (meta.issued_by) {
    sections.push({
      id: 'issuing-authority',
      title: 'Issuing Authority',
      icon: Stethoscope,
      content: (
        <div className="p-6">
          <SpecialistCard
            name={meta.issued_by}
            registrationNo={meta.registration_no}
          />
        </div>
      ),
    });
  }

  // Verification with QR Code
  if (meta.certificate_number || meta.digitally_signed || meta.qr_code_data) {
    sections.push({
      id: 'verification',
      title: 'Verification',
      icon: ShieldCheck,
      content: (
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {meta.certificate_number && (
              <p className="text-body text-muted-foreground">
                Certificate No: <span className="text-label text-foreground">{meta.certificate_number}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-8 pt-2">
            {meta.qr_code_data && (
              <div className="flex flex-col items-center">
                <QRCodeSVG value={meta.qr_code_data} size={100} />
                <p className="text-caption text-muted-foreground mt-2">Scan to verify</p>
              </div>
            )}
            {meta.digitally_signed && (
              <div className="flex flex-col items-center">
                <div className="h-16 w-24 border border-border rounded-lg flex items-center justify-center bg-muted/30">
                  <p className="text-micro text-muted-foreground italic">Digital signature</p>
                </div>
                <p className="text-caption text-muted-foreground mt-2">{meta.issued_by}</p>
              </div>
            )}
          </div>
        </div>
      ),
    });
  }

  return sections;
}
