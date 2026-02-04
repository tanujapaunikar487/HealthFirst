/**
 * PDF Content Generators for Health Records
 *
 * Provides category-specific HTML generators that mirror the React UI components
 * for generating properly formatted PDF content.
 */

/* ─── Types (mirrored from HealthRecords/Show.tsx) ─── */

interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  reference_range: string;
  status: string;
}

interface PftResult {
  parameter: string;
  value: string;
  predicted: string;
  percent_predicted: string;
  status: string;
}

interface Drug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface DischargeMedication {
  name: string;
  dosage: string;
  duration: string;
}

interface FollowUpItem {
  description: string;
  date: string;
  booked: boolean;
}

interface Investigation {
  name: string;
  result: string;
  has_link: boolean;
}

interface VaccinationEntry {
  vaccine_name: string;
  date: string;
  dose_label: string;
  administered_by: string;
  batch_number: string;
  site: string;
}

interface UpcomingVaccine {
  vaccine_name: string;
  due_date: string;
  dose_label: string;
}

interface RecordMetadata {
  ai_summary?: string;
  ai_summary_generated_at?: string;
  diagnosis?: string;
  icd_code?: string;
  symptoms?: string[];
  examination_findings?: string;
  treatment_plan?: string;
  visit_type_label?: string;
  opd_number?: string;
  duration?: string;
  location?: string;
  history_of_present_illness?: string;
  clinical_examination?: string;
  treatment_plan_steps?: string[];
  follow_up_date?: string;
  follow_up_recommendation?: string;
  drugs?: Drug[];
  valid_until?: string;
  test_name?: string;
  test_category?: string;
  results?: (LabResult | PftResult)[];
  lab_name?: string;
  modality?: string;
  body_part?: string;
  indication?: string;
  technique?: string;
  findings?: string;
  impression?: string;
  radiologist?: string;
  contrast?: string;
  sequences?: string;
  sonographer?: string;
  heart_rate?: number;
  rhythm?: string;
  intervals?: { pr?: string; qrs?: string; qt?: string };
  axis?: string;
  specimen_type?: string;
  gross_description?: string;
  microscopic_findings?: string;
  grade?: string | null;
  pathologist?: string;
  interpretation?: string;
  report_type?: string;
  referred_to_doctor?: string;
  referred_to_department?: string;
  reason?: string;
  priority?: string;
  admission_date?: string;
  discharge_date?: string;
  procedures?: string[];
  discharge_instructions?: string;
  length_of_stay?: string;
  treating_doctor?: string;
  room_info?: string;
  ipd_number?: string;
  primary_diagnosis?: string;
  secondary_diagnosis?: string;
  procedure_performed?: string;
  hospital_course?: string;
  vitals_at_discharge?: Record<string, string>;
  discharge_medications?: DischargeMedication[];
  discharge_dos?: string[];
  discharge_donts?: string[];
  warning_signs?: string[];
  emergency_contact?: string;
  follow_up_schedule?: FollowUpItem[];
  procedure_name?: string;
  anesthesia?: string;
  complications?: string;
  post_op_instructions?: string;
  chief_complaint?: string;
  triage_level?: string;
  vitals?: Record<string, string>;
  examination?: string;
  treatment_given?: string;
  disposition?: string;
  follow_up?: string;
  er_number?: string;
  arrival_time?: string;
  discharge_time?: string;
  mode_of_arrival?: string;
  attending_doctor?: string;
  pain_score?: string;
  investigations?: Investigation[];
  treatment_items?: string[];
  disposition_detail?: string;
  visit_type?: string;
  notes?: string;
  drug_name?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  start_date?: string;
  end_date?: string;
  prescribing_doctor?: string;
  condition?: string;
  reason_stopped?: string;
  timing?: string;
  with_food?: boolean;
  medication_duration?: string;
  how_it_works?: string;
  original_quantity?: number;
  side_effects?: string[];
  side_effects_warning?: string;
  vaccine_name?: string;
  dose_number?: number;
  total_doses?: number;
  batch_number?: string;
  administered_by?: string;
  site?: string;
  next_due_date?: string | null;
  vaccination_history?: VaccinationEntry[];
  upcoming_vaccinations?: UpcomingVaccine[];
  certificate_type?: string;
  issued_for?: string;
  valid_from?: string;
  issued_by?: string;
  certificate_number?: string;
  certificate_content?: string;
  examination_findings_list?: string[];
  digitally_signed?: boolean;
  verification_url?: string;
  invoice_number?: string;
  amount?: number;
  payment_status?: string;
  line_items?: { label: string; amount: number }[];
}

interface HealthRecord {
  id: number;
  category: string;
  title: string;
  description: string | null;
  doctor_name: string | null;
  department_name: string | null;
  record_date_formatted: string;
  metadata: RecordMetadata | null;
}

/* ─── Hidden Fields (internal/UI-only, should not appear in PDF) ─── */

const HIDDEN_FIELDS = new Set([
  'ai_summary',
  'ai_summary_generated_at',
  'linked_records',
  'adherence_this_week',
  'vitals_status',
  'attached_certificates',
]);

/* ─── Acronyms to preserve ─── */

const ACRONYMS = new Set(['AI', 'ECG', 'IPD', 'OPD', 'ER', 'MRI', 'CT', 'PFT', 'ICD', 'BP', 'HR', 'PR', 'QRS', 'QT']);

/* ─── Utility Functions ─── */

/** Escape HTML entities to prevent XSS */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Convert snake_case or camelCase to Title Case, preserving acronyms */
export function toTitleCase(str: string): string {
  if (!str) return '';

  // Replace underscores with spaces
  let result = str.replace(/_/g, ' ');

  // Split on spaces and capitalize each word
  result = result
    .split(' ')
    .map(word => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return result;
}

/** Format date for PDF display */
export function formatDateForPdf(date: string | undefined): string {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return date;
  }
}

/** Get status color class */
function getStatusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'normal' || s === 'completed' || s === 'paid') return 'normal';
  if (s === 'abnormal' || s === 'high' || s === 'low' || s === 'pending') return 'abnormal';
  if (s === 'critical' || s === 'failed') return 'critical';
  return 'normal';
}

/* ─── HTML Building Blocks ─── */

/** Build a styled HTML table */
function buildTableHtml(headers: string[], rows: string[][]): string {
  if (!rows.length) return '';

  const headerHtml = headers.map(h => `<th>${escapeHtml(h)}</th>`).join('');
  const rowsHtml = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
  ).join('');

  return `
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;
}

/** Build a key-value row */
function buildKeyValueRow(label: string, value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  return `<div class="row"><span class="row-label">${escapeHtml(label)}</span><span class="row-value">${escapeHtml(String(value))}</span></div>`;
}

/** Build a section with title */
function buildSection(title: string, content: string): string {
  if (!content.trim()) return '';
  return `<div class="section"><h2>${escapeHtml(title)}</h2>${content}</div>`;
}

/** Build a callout box */
function buildCallout(content: string, variant: 'purple' | 'blue' | 'green' | 'amber' | 'red' = 'blue'): string {
  if (!content) return '';
  return `<div class="callout callout-${variant}"><p>${escapeHtml(content)}</p></div>`;
}

/** Build status dot HTML */
function buildStatusDot(status: string): string {
  const color = getStatusColor(status);
  return `<span class="status-dot status-${color}" title="${escapeHtml(toTitleCase(status))}"></span>`;
}

/** Build a list */
function buildList(items: string[] | undefined): string {
  if (!items?.length) return '';
  return `<ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

/** Build grid of vitals */
function buildVitalsGrid(vitals: Record<string, string> | undefined): string {
  if (!vitals || Object.keys(vitals).length === 0) return '';

  const entries = Object.entries(vitals).filter(([, v]) => v);
  if (!entries.length) return '';

  return `
    <div class="vitals-grid">
      ${entries.map(([key, value]) => `
        <div class="vital-item">
          <span class="vital-label">${escapeHtml(toTitleCase(key))}</span>
          <span class="vital-value">${escapeHtml(value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/* ─── Category-Specific Generators ─── */

/** Lab Report - Results table with status dots */
function generateLabReportContent(meta: RecordMetadata): string {
  let html = '';

  // Test info
  const testInfo = [
    buildKeyValueRow('Test Name', meta.test_name),
    buildKeyValueRow('Category', meta.test_category),
    buildKeyValueRow('Laboratory', meta.lab_name),
  ].filter(Boolean).join('');

  if (testInfo) {
    html += buildSection('Test Information', testInfo);
  }

  // Results table
  if (meta.results?.length) {
    const isLabResult = (r: LabResult | PftResult): r is LabResult => 'unit' in r;

    if (isLabResult(meta.results[0])) {
      const rows = (meta.results as LabResult[]).map(r => [
        escapeHtml(r.parameter),
        `${escapeHtml(r.value)} ${escapeHtml(r.unit || '')}`.trim(),
        escapeHtml(r.reference_range || '-'),
        buildStatusDot(r.status),
      ]);
      html += buildSection('Results', buildTableHtml(['Parameter', 'Value', 'Reference Range', 'Status'], rows));
    } else {
      // PFT results
      const rows = (meta.results as PftResult[]).map(r => [
        escapeHtml(r.parameter),
        escapeHtml(r.value),
        escapeHtml(r.predicted || '-'),
        escapeHtml(r.percent_predicted || '-'),
        buildStatusDot(r.status),
      ]);
      html += buildSection('Results', buildTableHtml(['Parameter', 'Value', 'Predicted', '% Predicted', 'Status'], rows));
    }
  }

  return html;
}

/** Prescription - Medications table */
function generatePrescriptionContent(meta: RecordMetadata): string {
  let html = '';

  if (meta.drugs?.length) {
    const rows = meta.drugs.map(drug => [
      escapeHtml(drug.name),
      escapeHtml(drug.dosage || '-'),
      escapeHtml(drug.frequency || '-'),
      escapeHtml(drug.duration || '-'),
      escapeHtml(drug.instructions || '-'),
    ]);
    html += buildSection('Prescriptions', buildTableHtml(['Prescription', 'Dosage', 'Frequency', 'Duration', 'Instructions'], rows));
  }

  if (meta.valid_until) {
    html += buildKeyValueRow('Valid Until', formatDateForPdf(meta.valid_until));
  }

  return html;
}

/** Imaging reports (X-ray, MRI, CT, Ultrasound) */
function generateImagingContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Body Part', meta.body_part),
    buildKeyValueRow('Indication', meta.indication),
    buildKeyValueRow('Technique', meta.technique),
    buildKeyValueRow('Contrast', meta.contrast),
    buildKeyValueRow('Sequences', meta.sequences),
    buildKeyValueRow('Radiologist', meta.radiologist),
    buildKeyValueRow('Sonographer', meta.sonographer),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Study Details', details);
  }

  if (meta.findings) {
    html += buildSection('Findings', `<p>${escapeHtml(meta.findings)}</p>`);
  }

  if (meta.impression) {
    html += buildSection('Impression', buildCallout(meta.impression, 'blue'));
  }

  return html;
}

/** ECG Report */
function generateEcgContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Indication', meta.indication),
    buildKeyValueRow('Heart Rate', meta.heart_rate ? `${meta.heart_rate} bpm` : undefined),
    buildKeyValueRow('Rhythm', meta.rhythm),
    buildKeyValueRow('Axis', meta.axis),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('ECG Details', details);
  }

  // Intervals
  if (meta.intervals && (meta.intervals.pr || meta.intervals.qrs || meta.intervals.qt)) {
    const intervalRows = [
      meta.intervals.pr ? ['PR Interval', meta.intervals.pr] : null,
      meta.intervals.qrs ? ['QRS Duration', meta.intervals.qrs] : null,
      meta.intervals.qt ? ['QT Interval', meta.intervals.qt] : null,
    ].filter(Boolean) as string[][];

    if (intervalRows.length) {
      html += buildSection('Intervals', buildTableHtml(['Interval', 'Value'], intervalRows));
    }
  }

  if (meta.findings) {
    html += buildSection('Findings', `<p>${escapeHtml(meta.findings)}</p>`);
  }

  if (meta.impression) {
    html += buildSection('Impression', buildCallout(meta.impression, 'blue'));
  }

  return html;
}

/** Pathology Report */
function generatePathologyContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Specimen Type', meta.specimen_type),
    buildKeyValueRow('Pathologist', meta.pathologist),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Specimen Details', details);
  }

  if (meta.gross_description) {
    html += buildSection('Gross Description', `<p>${escapeHtml(meta.gross_description)}</p>`);
  }

  if (meta.microscopic_findings) {
    html += buildSection('Microscopic Findings', `<p>${escapeHtml(meta.microscopic_findings)}</p>`);
  }

  if (meta.diagnosis) {
    html += buildSection('Diagnosis', buildCallout(meta.diagnosis, 'purple'));
  }

  if (meta.grade) {
    html += buildKeyValueRow('Grade', meta.grade);
  }

  return html;
}

/** Consultation Notes */
function generateConsultationContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Visit Type', meta.visit_type_label),
    buildKeyValueRow('OPD Number', meta.opd_number),
    buildKeyValueRow('Duration', meta.duration),
    buildKeyValueRow('Location', meta.location),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Visit Details', details);
  }

  if (meta.chief_complaint) {
    html += buildSection('Chief Complaint', `<p>${escapeHtml(meta.chief_complaint)}</p>`);
  }

  if (meta.history_of_present_illness) {
    html += buildSection('History of Present Illness', `<p>${escapeHtml(meta.history_of_present_illness)}</p>`);
  }

  if (meta.symptoms?.length) {
    html += buildSection('Symptoms', buildList(meta.symptoms));
  }

  if (meta.examination_findings || meta.clinical_examination) {
    html += buildSection('Examination Findings', `<p>${escapeHtml(meta.examination_findings || meta.clinical_examination || '')}</p>`);
  }

  if (meta.diagnosis) {
    html += buildSection('Diagnosis', buildCallout(meta.diagnosis, 'blue'));
    if (meta.icd_code) {
      html += `<p class="small-text">ICD Code: ${escapeHtml(meta.icd_code)}</p>`;
    }
  }

  if (meta.treatment_plan) {
    html += buildSection('Treatment Plan', `<p>${escapeHtml(meta.treatment_plan)}</p>`);
  }

  if (meta.treatment_plan_steps?.length) {
    html += buildList(meta.treatment_plan_steps);
  }

  if (meta.follow_up_date || meta.follow_up_recommendation) {
    html += buildSection('Follow-Up', `
      ${meta.follow_up_date ? `<p><strong>Date:</strong> ${escapeHtml(formatDateForPdf(meta.follow_up_date))}</p>` : ''}
      ${meta.follow_up_recommendation ? `<p>${escapeHtml(meta.follow_up_recommendation)}</p>` : ''}
    `);
  }

  return html;
}

/** Discharge Summary */
function generateDischargeContent(meta: RecordMetadata): string {
  let html = '';

  // Admission info
  const admissionInfo = [
    buildKeyValueRow('IPD Number', meta.ipd_number),
    buildKeyValueRow('Admission Date', formatDateForPdf(meta.admission_date)),
    buildKeyValueRow('Discharge Date', formatDateForPdf(meta.discharge_date)),
    buildKeyValueRow('Length of Stay', meta.length_of_stay),
    buildKeyValueRow('Room', meta.room_info),
    buildKeyValueRow('Treating Doctor', meta.treating_doctor),
  ].filter(Boolean).join('');

  if (admissionInfo) {
    html += buildSection('Admission Details', admissionInfo);
  }

  // Diagnosis
  if (meta.primary_diagnosis || meta.secondary_diagnosis || meta.diagnosis) {
    let diagContent = '';
    if (meta.primary_diagnosis) {
      diagContent += `<p><strong>Primary:</strong> ${escapeHtml(meta.primary_diagnosis)}</p>`;
    }
    if (meta.secondary_diagnosis) {
      diagContent += `<p><strong>Secondary:</strong> ${escapeHtml(meta.secondary_diagnosis)}</p>`;
    }
    if (meta.diagnosis && !meta.primary_diagnosis) {
      diagContent += `<p>${escapeHtml(meta.diagnosis)}</p>`;
    }
    html += buildSection('Diagnosis', diagContent);
  }

  // Procedures
  if (meta.procedure_performed || meta.procedures?.length) {
    let procContent = '';
    if (meta.procedure_performed) {
      procContent += `<p>${escapeHtml(meta.procedure_performed)}</p>`;
    }
    if (meta.procedures?.length) {
      procContent += buildList(meta.procedures);
    }
    html += buildSection('Procedures', procContent);
  }

  // Hospital course
  if (meta.hospital_course) {
    html += buildSection('Hospital Course', `<p>${escapeHtml(meta.hospital_course)}</p>`);
  }

  // Vitals at discharge
  if (meta.vitals_at_discharge) {
    html += buildSection('Vitals at Discharge', buildVitalsGrid(meta.vitals_at_discharge));
  }

  // Discharge medications
  if (meta.discharge_medications?.length) {
    const rows = meta.discharge_medications.map(med => [
      escapeHtml(med.name),
      escapeHtml(med.dosage || '-'),
      escapeHtml(med.duration || '-'),
    ]);
    html += buildSection('Discharge Prescriptions', buildTableHtml(['Prescription', 'Dosage', 'Duration'], rows));
  }

  // Instructions
  if (meta.discharge_instructions) {
    html += buildSection('Instructions', `<p>${escapeHtml(meta.discharge_instructions)}</p>`);
  }

  if (meta.discharge_dos?.length) {
    html += buildSection("Do's", buildList(meta.discharge_dos));
  }

  if (meta.discharge_donts?.length) {
    html += buildSection("Don'ts", buildList(meta.discharge_donts));
  }

  if (meta.warning_signs?.length) {
    html += buildSection('Warning Signs', buildList(meta.warning_signs));
  }

  // Follow-up
  if (meta.follow_up_schedule?.length) {
    const rows = meta.follow_up_schedule.map(f => [
      escapeHtml(f.description),
      escapeHtml(formatDateForPdf(f.date)),
      f.booked ? 'Booked' : 'Pending',
    ]);
    html += buildSection('Follow-Up Schedule', buildTableHtml(['Description', 'Date', 'Status'], rows));
  }

  if (meta.emergency_contact) {
    html += buildSection('Emergency Contact', `<p>${escapeHtml(meta.emergency_contact)}</p>`);
  }

  return html;
}

/** ER Visit */
function generateErVisitContent(meta: RecordMetadata): string {
  let html = '';

  const visitInfo = [
    buildKeyValueRow('ER Number', meta.er_number),
    buildKeyValueRow('Arrival Time', meta.arrival_time),
    buildKeyValueRow('Discharge Time', meta.discharge_time),
    buildKeyValueRow('Mode of Arrival', meta.mode_of_arrival),
    buildKeyValueRow('Triage Level', meta.triage_level),
    buildKeyValueRow('Attending Doctor', meta.attending_doctor),
  ].filter(Boolean).join('');

  if (visitInfo) {
    html += buildSection('Visit Details', visitInfo);
  }

  if (meta.chief_complaint) {
    html += buildSection('Chief Complaint', buildCallout(meta.chief_complaint, 'red'));
  }

  if (meta.pain_score) {
    html += buildKeyValueRow('Pain Score', meta.pain_score);
  }

  if (meta.vitals) {
    html += buildSection('Vitals', buildVitalsGrid(meta.vitals));
  }

  if (meta.examination) {
    html += buildSection('Examination', `<p>${escapeHtml(meta.examination)}</p>`);
  }

  if (meta.investigations?.length) {
    const rows = meta.investigations.map(inv => [
      escapeHtml(inv.name),
      escapeHtml(inv.result || '-'),
    ]);
    html += buildSection('Investigations', buildTableHtml(['Investigation', 'Result'], rows));
  }

  if (meta.diagnosis) {
    html += buildSection('Diagnosis', buildCallout(meta.diagnosis, 'blue'));
  }

  if (meta.treatment_given || meta.treatment_items?.length) {
    let treatContent = '';
    if (meta.treatment_given) {
      treatContent += `<p>${escapeHtml(meta.treatment_given)}</p>`;
    }
    if (meta.treatment_items?.length) {
      treatContent += buildList(meta.treatment_items);
    }
    html += buildSection('Treatment Given', treatContent);
  }

  if (meta.disposition || meta.disposition_detail) {
    html += buildSection('Disposition', `<p>${escapeHtml(meta.disposition || meta.disposition_detail || '')}</p>`);
  }

  if (meta.follow_up) {
    html += buildSection('Follow-Up', `<p>${escapeHtml(meta.follow_up)}</p>`);
  }

  return html;
}

/** Procedure Notes */
function generateProcedureContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Procedure', meta.procedure_name),
    buildKeyValueRow('Anesthesia', meta.anesthesia),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Procedure Details', details);
  }

  if (meta.findings) {
    html += buildSection('Findings', `<p>${escapeHtml(meta.findings)}</p>`);
  }

  if (meta.complications) {
    html += buildSection('Complications', `<p>${escapeHtml(meta.complications)}</p>`);
  }

  if (meta.post_op_instructions) {
    html += buildSection('Post-Operative Instructions', `<p>${escapeHtml(meta.post_op_instructions)}</p>`);
  }

  return html;
}

/** Referral */
function generateReferralContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Referred To', meta.referred_to_doctor),
    buildKeyValueRow('Department', meta.referred_to_department),
    buildKeyValueRow('Priority', meta.priority),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Referral Details', details);
  }

  if (meta.reason) {
    html += buildSection('Reason for Referral', `<p>${escapeHtml(meta.reason)}</p>`);
  }

  if (meta.diagnosis) {
    html += buildSection('Current Diagnosis', `<p>${escapeHtml(meta.diagnosis)}</p>`);
  }

  return html;
}

/** Medication (Active/Past) */
function generateMedicationContent(meta: RecordMetadata, isActive: boolean): string {
  let html = '';

  const details = [
    buildKeyValueRow('Drug Name', meta.drug_name),
    buildKeyValueRow('Dosage', meta.dosage),
    buildKeyValueRow('Frequency', meta.frequency),
    buildKeyValueRow('Route', meta.route),
    buildKeyValueRow('Timing', meta.timing),
    buildKeyValueRow('With Food', meta.with_food ? 'Yes' : meta.with_food === false ? 'No' : undefined),
    buildKeyValueRow('Duration', meta.medication_duration),
    buildKeyValueRow('Start Date', formatDateForPdf(meta.start_date)),
    buildKeyValueRow('End Date', formatDateForPdf(meta.end_date)),
    buildKeyValueRow('Prescribing Doctor', meta.prescribing_doctor),
    buildKeyValueRow('Condition', meta.condition),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Medication Details', details);
  }

  if (!isActive && meta.reason_stopped) {
    html += buildSection('Reason Stopped', `<p>${escapeHtml(meta.reason_stopped)}</p>`);
  }

  if (meta.how_it_works) {
    html += buildSection('How It Works', `<p>${escapeHtml(meta.how_it_works)}</p>`);
  }

  if (meta.side_effects?.length) {
    html += buildSection('Possible Side Effects', buildList(meta.side_effects));
  }

  return html;
}

/** Vaccination */
function generateVaccinationContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Vaccine', meta.vaccine_name),
    buildKeyValueRow('Dose', meta.dose_number && meta.total_doses ? `${meta.dose_number} of ${meta.total_doses}` : undefined),
    buildKeyValueRow('Batch Number', meta.batch_number),
    buildKeyValueRow('Site', meta.site),
    buildKeyValueRow('Administered By', meta.administered_by),
    buildKeyValueRow('Next Due Date', formatDateForPdf(meta.next_due_date ?? undefined)),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Vaccination Details', details);
  }

  // Vaccination history
  if (meta.vaccination_history?.length) {
    const rows = meta.vaccination_history.map(v => [
      escapeHtml(v.vaccine_name),
      escapeHtml(v.dose_label),
      escapeHtml(v.date),
      escapeHtml(v.administered_by || '-'),
    ]);
    html += buildSection('Vaccination History', buildTableHtml(['Vaccine', 'Dose', 'Date', 'Administered By'], rows));
  }

  // Upcoming vaccinations
  if (meta.upcoming_vaccinations?.length) {
    const rows = meta.upcoming_vaccinations.map(v => [
      escapeHtml(v.vaccine_name),
      escapeHtml(v.dose_label),
      escapeHtml(v.due_date),
    ]);
    html += buildSection('Upcoming Vaccinations', buildTableHtml(['Vaccine', 'Dose', 'Due Date'], rows));
  }

  return html;
}

/** Medical Certificate */
function generateCertificateContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Certificate Type', meta.certificate_type),
    buildKeyValueRow('Certificate Number', meta.certificate_number),
    buildKeyValueRow('Issued For', meta.issued_for),
    buildKeyValueRow('Valid From', formatDateForPdf(meta.valid_from)),
    buildKeyValueRow('Issued By', meta.issued_by),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Certificate Details', details);
  }

  if (meta.certificate_content) {
    html += buildSection('Certificate Content', `<p>${escapeHtml(meta.certificate_content)}</p>`);
  }

  if (meta.examination_findings_list?.length) {
    html += buildSection('Examination Findings', buildList(meta.examination_findings_list));
  }

  if (meta.digitally_signed) {
    html += `<p class="small-text"><em>This certificate is digitally signed.</em></p>`;
  }

  return html;
}

/** Invoice */
function generateInvoiceContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Invoice Number', meta.invoice_number),
    buildKeyValueRow('Amount', meta.amount ? `₹${meta.amount.toLocaleString()}` : undefined),
    buildKeyValueRow('Payment Status', meta.payment_status),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Invoice Details', details);
  }

  if (meta.line_items?.length) {
    const rows = meta.line_items.map(item => [
      escapeHtml(item.label),
      `₹${item.amount.toLocaleString()}`,
    ]);
    html += buildSection('Line Items', buildTableHtml(['Item', 'Amount'], rows));
  }

  return html;
}

/** Generic content for unknown categories - filtered key-value pairs */
function generateGenericContent(meta: RecordMetadata): string {
  let html = '';

  const entries = Object.entries(meta)
    .filter(([key, value]) => {
      if (HIDDEN_FIELDS.has(key)) return false;
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && !Array.isArray(value)) return false; // Skip nested objects
      return true;
    });

  if (entries.length === 0) return '';

  const rows = entries.map(([key, value]) => {
    let displayValue: string;
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else {
      displayValue = String(value);
    }
    return buildKeyValueRow(toTitleCase(key), displayValue);
  }).filter(Boolean).join('');

  if (rows) {
    html += buildSection('Details', rows);
  }

  return html;
}

/* ─── Main Router Function ─── */

/**
 * Generate PDF content for a health record based on its category.
 * Returns HTML string to be inserted into the PDF template.
 */
export function generateHealthRecordPdfContent(
  record: HealthRecord,
  aiSummary?: string
): string {
  const meta = record.metadata;
  if (!meta) return '';

  let content = '';

  // Add AI summary if present
  if (aiSummary) {
    content += `
      <div class="ai-summary">
        <div class="ai-summary-label">AI Summary</div>
        <div class="callout callout-purple"><p>${escapeHtml(aiSummary)}</p></div>
      </div>
    `;
  }

  // Generate category-specific content
  switch (record.category) {
    case 'lab_report':
      content += generateLabReportContent(meta);
      break;
    case 'prescription':
      content += generatePrescriptionContent(meta);
      break;
    case 'xray_report':
    case 'ct_scan':
    case 'mri_report':
    case 'ultrasound_report':
      content += generateImagingContent(meta);
      break;
    case 'ecg_report':
      content += generateEcgContent(meta);
      break;
    case 'pathology_report':
      content += generatePathologyContent(meta);
      break;
    case 'pft_report':
      content += generateLabReportContent(meta); // PFT uses similar table format
      if (meta.interpretation) {
        content += buildSection('Interpretation', buildCallout(meta.interpretation, 'blue'));
      }
      break;
    case 'consultation_notes':
      content += generateConsultationContent(meta);
      break;
    case 'discharge_summary':
      content += generateDischargeContent(meta);
      break;
    case 'er_visit':
      content += generateErVisitContent(meta);
      break;
    case 'procedure_notes':
      content += generateProcedureContent(meta);
      break;
    case 'referral':
      content += generateReferralContent(meta);
      break;
    case 'medication_active':
      content += generateMedicationContent(meta, true);
      break;
    case 'medication_past':
      content += generateMedicationContent(meta, false);
      break;
    case 'vaccination':
      content += generateVaccinationContent(meta);
      break;
    case 'medical_certificate':
      content += generateCertificateContent(meta);
      break;
    case 'invoice':
      content += generateInvoiceContent(meta);
      break;
    case 'other_report':
    case 'other_visit':
    default:
      content += generateGenericContent(meta);
      break;
  }

  return content;
}

/**
 * Generate PDF content for bulk health records download.
 * Provides a summary view for multiple records.
 */
export function generateBulkRecordsPdfContent(
  records: HealthRecord[],
  categoryLabels: Record<string, string>
): string {
  if (!records.length) return '<p>No records selected.</p>';

  const rows = records.map(record => [
    escapeHtml(record.title),
    escapeHtml(categoryLabels[record.category] || toTitleCase(record.category)),
    escapeHtml(record.record_date_formatted),
    escapeHtml(record.doctor_name || '-'),
  ]);

  return `
    <p class="subtitle">${records.length} record${records.length !== 1 ? 's' : ''} selected</p>
    ${buildTableHtml(['Title', 'Category', 'Date', 'Doctor'], rows)}
  `;
}
