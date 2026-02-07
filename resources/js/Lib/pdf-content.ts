/**
 * PDF Content Generators for Health Records
 *
 * Provides category-specific HTML generators that mirror the React UI components
 * for generating properly formatted PDF content.
 */

import type {
  HealthRecord,
  RecordMetadata,
  LabResult,
  PftResult,
} from '@/Pages/HealthRecords/types';

/* ─── Hidden Fields (internal/UI-only, should not appear in PDF) ─── */

const HIDDEN_FIELDS = new Set([
  'ai_summary',
  'ai_summary_generated_at',
  'linked_records',
  'adherence_this_week',
  'vitals_status',
  'attached_certificates',
  'qr_code_data',
  'adherence_rate',
  'images',
  'patient_dob',
  'id_type',
  'id_number',
  'structured_findings',
  'ecg_results',
  'patient_status',
  'surgical_team',
  'system_findings',
  'tests_performed',
  'clearance_conditions',
  'structured_examination',
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

/** Source info row */
function buildSourceInfo(meta: RecordMetadata): string {
  const source = meta.source || meta.facility;
  if (!source) return '';
  const rows = [
    buildKeyValueRow('Facility', source.name),
    buildKeyValueRow('Location', source.location),
  ].filter(Boolean).join('');
  return rows ? buildSection('Source', rows) : '';
}

/** Lab Report - Results table with status dots */
function generateLabReportContent(meta: RecordMetadata): string {
  let html = '';

  html += buildSourceInfo(meta);

  // Test info
  const testInfo = [
    buildKeyValueRow('Test Name', meta.test_name),
    buildKeyValueRow('Category', meta.test_category),
    buildKeyValueRow('Laboratory', meta.lab_name || meta.source?.name),
    buildKeyValueRow('Report ID', meta.report_id),
    buildKeyValueRow('Sample Type', meta.sample_type),
    buildKeyValueRow('Collected', formatDateForPdf(meta.collected_date)),
    buildKeyValueRow('Reported', formatDateForPdf(meta.reported_date)),
    buildKeyValueRow('Verified By', meta.verified_by),
    buildKeyValueRow('Fasting', meta.fasting === true ? 'Yes' : meta.fasting === false ? 'No' : undefined),
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

  // Prescriber info
  const prescriberInfo = [
    buildKeyValueRow('Prescriber', meta.prescribing_doctor),
    buildKeyValueRow('Specialty', meta.prescriber_specialty),
    buildKeyValueRow('Diagnosis', meta.prescription_diagnosis),
  ].filter(Boolean).join('');

  if (prescriberInfo) {
    html += buildSection('Prescriber', prescriberInfo);
  }

  if (meta.drugs?.length) {
    const rows = meta.drugs.map(drug => [
      escapeHtml(drug.name),
      escapeHtml(drug.dosage || '-'),
      escapeHtml(drug.frequency || '-'),
      escapeHtml(drug.duration || '-'),
      escapeHtml(drug.instructions || '-'),
    ]);
    html += buildSection('Medications', buildTableHtml(['Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions'], rows));
  }

  if (meta.general_instructions?.length) {
    html += buildSection('Instructions', buildList(meta.general_instructions));
  }

  if (meta.valid_until) {
    html += buildKeyValueRow('Valid Until', formatDateForPdf(meta.valid_until));
  }

  return html;
}

/** Imaging reports (X-ray, MRI, CT, Ultrasound) */
function generateImagingContent(meta: RecordMetadata): string {
  let html = '';

  html += buildSourceInfo(meta);

  const details = [
    buildKeyValueRow('Modality', meta.modality),
    buildKeyValueRow('Body Part', meta.body_part),
    buildKeyValueRow('Views', meta.views),
    buildKeyValueRow('Indication', meta.indication),
    buildKeyValueRow('Technique', meta.technique),
    buildKeyValueRow('Contrast', meta.contrast),
    buildKeyValueRow('Sequences', meta.sequences),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Study Information', details);
  }

  if (meta.indication) {
    html += buildSection('Clinical Indication', `<p>${escapeHtml(meta.indication)}</p>`);
  }

  // Structured findings
  if (meta.structured_findings?.length) {
    const findingsHtml = meta.structured_findings.map(f =>
      `<p><strong>${escapeHtml(f.region)}:</strong> ${escapeHtml(f.description)}</p>`
    ).join('');
    html += buildSection('Findings', findingsHtml);
  } else if (meta.findings) {
    html += buildSection('Findings', `<p>${escapeHtml(meta.findings)}</p>`);
  }

  if (meta.impression) {
    html += buildSection('Impression', buildCallout(meta.impression, 'blue'));
  }

  // Specialist
  const specialist = [
    buildKeyValueRow('Radiologist', meta.radiologist),
    buildKeyValueRow('Credentials', meta.radiologist_credentials),
  ].filter(Boolean).join('');
  if (specialist) {
    html += buildSection('Reporting Specialist', specialist);
  }

  return html;
}

/** ECG Report */
function generateEcgContent(meta: RecordMetadata): string {
  let html = '';

  html += buildSourceInfo(meta);

  // Patient status
  if (meta.patient_status) {
    const statusRows = Object.entries(meta.patient_status).map(([key, value]) =>
      buildKeyValueRow(toTitleCase(key), value)
    ).filter(Boolean).join('');
    if (statusRows) html += buildSection('Patient Status', statusRows);
  }

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

  // ECG results table
  if (meta.ecg_results?.length) {
    const rows = meta.ecg_results.map(r => [
      escapeHtml(r.parameter),
      `${escapeHtml(r.value)} ${escapeHtml(r.unit || '')}`.trim(),
      escapeHtml(r.reference_range || '-'),
      buildStatusDot(r.status),
    ]);
    html += buildSection('ECG Parameters', buildTableHtml(['Parameter', 'Value', 'Reference', 'Status'], rows));
  }

  // Structured findings
  if (meta.structured_findings?.length) {
    const findingsHtml = meta.structured_findings.map(f =>
      `<p><strong>${escapeHtml(f.region)}:</strong> ${escapeHtml(f.description)}</p>`
    ).join('');
    html += buildSection('Detailed Findings', findingsHtml);
  } else if (meta.findings) {
    html += buildSection('Findings', `<p>${escapeHtml(meta.findings)}</p>`);
  }

  if (meta.impression || meta.interpretation) {
    html += buildSection('Interpretation', buildCallout(meta.impression || meta.interpretation || '', 'blue'));
  }

  // Cardiologist
  const cardiologist = [
    buildKeyValueRow('Cardiologist', meta.cardiologist),
    buildKeyValueRow('Credentials', meta.cardiologist_credentials),
  ].filter(Boolean).join('');
  if (cardiologist) html += buildSection('Reporting Specialist', cardiologist);

  return html;
}

/** Pathology Report */
function generatePathologyContent(meta: RecordMetadata): string {
  let html = '';

  html += buildSourceInfo(meta);

  const details = [
    buildKeyValueRow('Specimen Type', meta.specimen_type),
    buildKeyValueRow('Method', meta.method),
    buildKeyValueRow('Collected', formatDateForPdf(meta.collected_date)),
    buildKeyValueRow('Pathologist', meta.pathologist),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Specimen Details', details);
  }

  if (meta.adequacy) {
    html += buildSection('Specimen Adequacy', buildCallout(meta.adequacy, 'green'));
  }

  // Result
  if (meta.result_text) {
    html += buildSection('Result', buildCallout(meta.result_text, 'blue'));
    if (meta.result_interpretation) {
      html += `<p class="small-text">${escapeHtml(meta.result_interpretation)}</p>`;
    }
  }

  if (meta.gross_description) {
    html += buildSection('Gross Description', `<p>${escapeHtml(meta.gross_description)}</p>`);
  }

  if (meta.microscopic_findings) {
    html += buildSection('Microscopic Findings', `<p>${escapeHtml(meta.microscopic_findings)}</p>`);
  }

  // Structured findings
  if (meta.structured_findings?.length) {
    html += buildSection('Findings', buildList(meta.structured_findings.map(f => `${f.region}: ${f.description}`)));
  }

  if (meta.diagnosis) {
    html += buildSection('Diagnosis', buildCallout(meta.diagnosis, 'purple'));
  }

  if (meta.grade) {
    html += buildKeyValueRow('Grade', meta.grade);
  }

  if (meta.recommendation) {
    html += buildSection('Recommendation', buildCallout(meta.recommendation, 'amber'));
  }

  // Pathologist credentials
  const pathologist = [
    buildKeyValueRow('Pathologist', meta.pathologist),
    buildKeyValueRow('Credentials', meta.pathologist_credentials),
  ].filter(Boolean).join('');
  if (pathologist) html += buildSection('Reporting Specialist', pathologist);

  return html;
}

/** Consultation Notes */
function generateConsultationContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Visit Type', meta.visit_type_label),
    buildKeyValueRow('OPD Number', meta.opd_number),
    buildKeyValueRow('Duration', meta.duration),
    buildKeyValueRow('Location', meta.location || meta.clinic_name),
    buildKeyValueRow('Specialty', meta.doctor_specialty),
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

  html += buildSourceInfo(meta);

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

  // Condition at discharge
  if (meta.condition_at_discharge) {
    html += buildSection('Condition at Discharge', buildCallout(meta.condition_at_discharge, 'green'));
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

  html += buildSourceInfo(meta);

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

  if (meta.structured_examination?.length) {
    html += buildSection('Examination Findings', buildList(meta.structured_examination));
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

  html += buildSourceInfo(meta);

  // Surgical team
  if (meta.surgical_team?.length) {
    const teamRows = meta.surgical_team.map(member => [
      escapeHtml(member.role),
      escapeHtml(member.name),
      escapeHtml(member.credentials || '-'),
    ]);
    html += buildSection('Surgical Team', buildTableHtml(['Role', 'Name', 'Credentials'], teamRows));
  }

  const details = [
    buildKeyValueRow('Procedure', meta.procedure_name),
    buildKeyValueRow('Indication', meta.indication),
    buildKeyValueRow('Anesthesia', meta.anesthesia),
    buildKeyValueRow('Duration', meta.duration),
    buildKeyValueRow('Blood Loss', meta.blood_loss),
    buildKeyValueRow('Complications', meta.complications),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Procedure Details', details);
  }

  // Structured findings
  if (meta.structured_findings?.length) {
    html += buildSection('Operative Findings', buildList(meta.structured_findings.map(f => `${f.region}: ${f.description}`)));
  } else if (meta.findings) {
    html += buildSection('Findings', `<p>${escapeHtml(meta.findings)}</p>`);
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
    buildKeyValueRow('Drug Name', meta.drug_name || meta.medication),
    buildKeyValueRow('Dosage', meta.dosage),
    buildKeyValueRow('Frequency', meta.frequency),
    buildKeyValueRow('Route', meta.route),
    buildKeyValueRow('Timing', meta.timing),
    buildKeyValueRow('With Food', meta.with_food ? 'Yes' : meta.with_food === false ? 'No' : undefined),
    buildKeyValueRow('Duration', meta.medication_duration),
    buildKeyValueRow('Start Date', formatDateForPdf(meta.start_date)),
    buildKeyValueRow('End Date', formatDateForPdf(meta.end_date)),
    buildKeyValueRow('Prescribing Doctor', meta.prescribing_doctor),
    buildKeyValueRow('Specialty', meta.prescriber_specialty),
    buildKeyValueRow('Condition', meta.condition),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Medication Details', details);
  }

  if (!isActive && meta.reason_stopped) {
    html += buildSection('Reason Stopped', `<p>${escapeHtml(meta.reason_stopped)}</p>`);
  }

  if (isActive && meta.refills_remaining !== undefined) {
    const refillInfo = [
      buildKeyValueRow('Refills Remaining', String(meta.refills_remaining)),
      buildKeyValueRow('Refill Due', formatDateForPdf(meta.refill_due_date)),
    ].filter(Boolean).join('');
    if (refillInfo) html += buildSection('Refill Information', refillInfo);
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

  html += buildSourceInfo(meta);

  const details = [
    buildKeyValueRow('Vaccine', meta.vaccine_name),
    buildKeyValueRow('Manufacturer', meta.manufacturer),
    buildKeyValueRow('Target Disease', meta.target_disease),
    buildKeyValueRow('Dose', meta.dose_number && meta.total_doses ? `${meta.dose_number} of ${meta.total_doses}` : undefined),
    buildKeyValueRow('Batch Number', meta.batch_number),
    buildKeyValueRow('Site', meta.site),
    buildKeyValueRow('Administered By', meta.administered_by),
    buildKeyValueRow('Next Due Date', formatDateForPdf(meta.next_due_date ?? undefined)),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Vaccine Details', details);
  }

  // Vaccination history
  if (meta.vaccination_history?.length) {
    const rows = meta.vaccination_history.map(v => [
      escapeHtml(v.vaccine_name),
      escapeHtml(v.dose_label),
      escapeHtml(v.date),
      escapeHtml(v.administered_by || '-'),
    ]);
    html += buildSection('Dose History', buildTableHtml(['Vaccine', 'Dose', 'Date', 'Administered By'], rows));
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

  // Certificate info
  const certInfo = [
    buildKeyValueRow('Certificate Number', meta.certificate_number),
    buildKeyValueRow('Issued', formatDateForPdf(meta.certificate_issued_date)),
    buildKeyValueRow('Valid For', meta.certificate_valid_for),
  ].filter(Boolean).join('');
  if (certInfo) {
    html += buildSection('Certificate', certInfo);
  }

  return html;
}

/** Medical Certificate */
function generateCertificateContent(meta: RecordMetadata): string {
  let html = '';

  html += buildSourceInfo(meta);

  const details = [
    buildKeyValueRow('Certificate Type', meta.certificate_type),
    buildKeyValueRow('Sub-Type', meta.certificate_sub_type ? toTitleCase(meta.certificate_sub_type) : undefined),
    buildKeyValueRow('Certificate Number', meta.certificate_number),
    buildKeyValueRow('Issued For', meta.issued_for),
    buildKeyValueRow('Valid From', formatDateForPdf(meta.valid_from)),
    buildKeyValueRow('Issued By', meta.issued_by),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Certificate Details', details);
  }

  // Patient info
  const patientInfo = [
    buildKeyValueRow('Age', meta.patient_age_cert),
    buildKeyValueRow('Gender', meta.patient_gender),
    buildKeyValueRow('ID', meta.patient_id),
  ].filter(Boolean).join('');
  if (patientInfo) html += buildSection('Patient Details', patientInfo);

  // Sub-type specific content
  if (meta.certificate_sub_type === 'fitness') {
    if (meta.purpose) html += buildKeyValueRow('Purpose', meta.purpose);
    if (meta.examination_date) html += buildKeyValueRow('Examination Date', formatDateForPdf(meta.examination_date));
    if (meta.system_findings?.length) html += buildSection('System Findings', buildList(meta.system_findings.map(f => `${f.system}: ${f.status}`)));
    if (meta.conclusion) html += buildSection('Conclusion', buildCallout(meta.conclusion, 'green'));
  } else if (meta.certificate_sub_type === 'sick_leave') {
    if (meta.leave_diagnosis) html += buildKeyValueRow('Diagnosis', meta.leave_diagnosis);
    const leaveInfo = [
      buildKeyValueRow('From', formatDateForPdf(meta.leave_from)),
      buildKeyValueRow('To', formatDateForPdf(meta.leave_to)),
      buildKeyValueRow('Duration', meta.leave_duration),
    ].filter(Boolean).join('');
    if (leaveInfo) html += buildSection('Leave Period', leaveInfo);
  } else if (meta.certificate_sub_type === 'medical_clearance') {
    if (meta.clearance_for) html += buildKeyValueRow('Clearance For', meta.clearance_for);
    if (meta.relevant_history) html += buildSection('Relevant History', `<p>${escapeHtml(meta.relevant_history)}</p>`);
    if (meta.tests_performed?.length) {
      const rows = meta.tests_performed.map(t => [escapeHtml(t.name), escapeHtml(t.result)]);
      html += buildSection('Tests Performed', buildTableHtml(['Test', 'Result'], rows));
    }
    if (meta.clearance_status) html += buildSection('Status', buildCallout(meta.clearance_status, 'blue'));
    if (meta.clearance_conditions?.length) html += buildSection('Conditions', buildList(meta.clearance_conditions));
  }

  if (meta.certificate_content) {
    html += buildSection('Certificate Content', `<p>${escapeHtml(meta.certificate_content)}</p>`);
  }

  if (meta.examination_findings_list?.length) {
    html += buildSection('Examination Findings', buildList(meta.examination_findings_list));
  }

  // Issuing authority
  const issuer = [
    buildKeyValueRow('Issued By', meta.issued_by),
    buildKeyValueRow('Registration No', meta.registration_no),
  ].filter(Boolean).join('');
  if (issuer) html += buildSection('Issuing Authority', issuer);

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

/** Document Upload */
function generateDocumentContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Document Type', meta.document_type),
    buildKeyValueRow('Original Date', formatDateForPdf(meta.original_date)),
    buildKeyValueRow('Uploaded', formatDateForPdf(meta.upload_date)),
    buildKeyValueRow('File Name', meta.file_name),
    buildKeyValueRow('File Size', meta.file_size),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Document Information', details);
  }

  if (meta.user_notes) {
    html += buildSection('Notes', `<p>${escapeHtml(meta.user_notes)}</p>`);
  }

  if (meta.tags?.length) {
    html += buildSection('Tags', `<p>${meta.tags.map(t => escapeHtml(t)).join(', ')}</p>`);
  }

  return html;
}

/** Other Visit */
function generateOtherVisitContent(meta: RecordMetadata): string {
  let html = '';

  const details = [
    buildKeyValueRow('Visit Type', meta.visit_type),
    buildKeyValueRow('Duration', meta.duration),
  ].filter(Boolean).join('');

  if (details) {
    html += buildSection('Visit Details', details);
  }

  if (meta.notes) {
    html += buildSection('Notes', `<p>${escapeHtml(meta.notes)}</p>`);
  }

  if (meta.follow_up) {
    html += buildSection('Follow-Up', `<p>${escapeHtml(meta.follow_up)}</p>`);
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
    case 'pft_report': {
      content += buildSourceInfo(meta);
      // Patient data
      const pftPatient = [
        buildKeyValueRow('Age', meta.patient_age),
        buildKeyValueRow('Height', meta.patient_height),
        buildKeyValueRow('Weight', meta.patient_weight),
      ].filter(Boolean).join('');
      if (pftPatient) content += buildSection('Patient Data', pftPatient);
      content += generateLabReportContent(meta); // PFT uses similar table format
      if (meta.interpretation) {
        content += buildSection('Interpretation', buildCallout(meta.interpretation, 'blue'));
      }
      break;
    }
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
    case 'document':
    case 'other_report':
      content += generateDocumentContent(meta);
      break;
    case 'other_visit':
      content += generateOtherVisitContent(meta);
      break;
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
