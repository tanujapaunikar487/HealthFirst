/* ─── Health Record Types ─── */

export interface LabResult {
  parameter: string;
  value: string;
  unit: string;
  reference_range: string;
  status: string;
}

export interface PftResult {
  parameter: string;
  value: string;
  predicted: string;
  percent_predicted: string;
  status: string;
}

export interface Drug {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  generic_name?: string;
}

export interface LinkedRecord {
  icon_type: string;
  title: string;
  link_text: string;
}

export interface DischargeMedication {
  name: string;
  dosage: string;
  duration: string;
}

export interface FollowUpItem {
  description: string;
  date: string;
  booked: boolean;
}

export interface Investigation {
  name: string;
  result: string;
  has_link: boolean;
}

export interface VaccinationEntry {
  vaccine_name: string;
  date: string;
  dose_label: string;
  administered_by: string;
  batch_number: string;
  site: string;
}

export interface UpcomingVaccine {
  vaccine_name: string;
  due_date: string;
  dose_label: string;
}

export interface AttachedFile {
  name: string;
  type: string;
  size?: string;
}

export interface StructuredFinding {
  region: string;
  description: string;
}

export interface SurgicalTeamMember {
  role: string;
  name: string;
  credentials?: string;
}

export interface TestPerformed {
  name: string;
  result: string;
}

export interface Source {
  name: string;
  location?: string;
}

export interface RecordMetadata {
  // AI Summary (cached)
  ai_summary?: string;
  ai_summary_generated_at?: string;

  // Common: Source / Facility
  source?: Source;

  // consultation_notes
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
  linked_records?: LinkedRecord[];
  follow_up_date?: string;
  follow_up_recommendation?: string;
  vitals_status?: Record<string, string>;
  doctor_specialty?: string;
  clinic_name?: string;
  chief_complaint?: string;

  // prescription / medication
  drugs?: Drug[];
  valid_until?: string;
  refills_remaining?: number;
  refill_due_date?: string;
  prescription_diagnosis?: string;
  general_instructions?: string[];
  prescriber_specialty?: string;

  // lab_report
  test_name?: string;
  test_category?: string;
  results?: (LabResult | PftResult)[];
  lab_name?: string;
  report_id?: string;
  sample_type?: string;
  collected_date?: string;
  reported_date?: string;
  verified_by?: string;
  fasting?: boolean;

  // xray_report, mri_report, ultrasound_report
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
  views?: string;
  structured_findings?: StructuredFinding[];
  images?: { url: string; label: string }[];
  radiologist_credentials?: string;

  // ecg_report / cardiac
  heart_rate?: number;
  rhythm?: string;
  intervals?: { pr?: string; qrs?: string; qt?: string };
  axis?: string;
  patient_status?: {
    age?: string;
    gender?: string;
    bp_at_test?: string;
    known_case?: string;
  };
  cardiologist?: string;
  cardiologist_credentials?: string;
  ecg_results?: LabResult[];

  // pathology_report
  specimen_type?: string;
  gross_description?: string;
  microscopic_findings?: string;
  grade?: string | null;
  pathologist?: string;
  method?: string;
  collected_date_pathology?: string;
  lmp?: string;
  adequacy?: string;
  result_text?: string;
  result_interpretation?: string;
  recommendation?: string;
  pathologist_credentials?: string;

  // pft_report
  interpretation?: string;
  patient_age?: string;
  patient_height?: string;
  patient_weight?: string;

  // other_report
  report_type?: string;

  // referral
  referred_to_doctor?: string;
  referred_to_department?: string;
  reason?: string;
  priority?: string;

  // discharge_summary
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
  condition_at_discharge?: string;

  // procedure_notes
  procedure_name?: string;
  anesthesia?: string;
  complications?: string;
  post_op_instructions?: string;
  facility?: Source;
  surgical_team?: SurgicalTeamMember[];
  blood_loss?: string;

  // er_visit
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
  structured_examination?: string[];

  // other_visit
  visit_type?: string;
  notes?: string;

  // medication_active / medication_past
  drug_name?: string;
  medication?: string;
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
  adherence_this_week?: ('taken' | 'missed' | 'upcoming')[];
  adherence_rate?: number;

  // vaccination
  vaccine_name?: string;
  dose_number?: number;
  total_doses?: number;
  batch_number?: string;
  administered_by?: string;
  site?: string;
  next_due_date?: string | null;
  vaccination_history?: VaccinationEntry[];
  upcoming_vaccinations?: UpcomingVaccine[];
  attached_certificates?: AttachedFile[];
  manufacturer?: string;
  target_disease?: string;
  patient_dob?: string;
  id_type?: string;
  id_number?: string;
  certificate_issued_date?: string;
  certificate_valid_for?: string;
  qr_code_data?: string;
  qualification?: string;
  registration_no?: string;

  // medical_certificate
  certificate_type?: string;
  issued_for?: string;
  valid_from?: string;
  issued_by?: string;
  certificate_number?: string;
  certificate_content?: string;
  examination_findings_list?: string[];
  digitally_signed?: boolean;
  verification_url?: string;
  certificate_sub_type?: string;
  patient_age_cert?: string;
  patient_gender?: string;
  patient_id?: string;
  purpose?: string;
  examination_date?: string;
  system_findings?: { system: string; status: string }[];
  conclusion?: string;
  leave_diagnosis?: string;
  leave_from?: string;
  leave_to?: string;
  leave_duration?: string;
  clearance_for?: string;
  relevant_history?: string;
  tests_performed?: TestPerformed[];
  clearance_status?: string;
  clearance_conditions?: string[];

  // invoice (legacy)
  invoice_number?: string;
  amount?: number;
  payment_status?: string;
  line_items?: { label: string; amount: number }[];

  // document (new)
  document_type?: string;
  original_date?: string;
  upload_date?: string;
  file_name?: string;
  file_size?: string;
  user_notes?: string;
  tags?: string[];
}

export interface RecordStatus {
  label: string;
  variant: string;
}

export interface HealthRecord {
  id: number;
  appointment_id: number | null;
  family_member_id: number | null;
  category: string;
  title: string;
  description: string | null;
  doctor_name: string | null;
  department_name: string | null;
  record_date: string;
  record_date_formatted: string;
  metadata: RecordMetadata | null;
  file_url: string | null;
  file_type: string | null;
  status: RecordStatus | null;
  insurance_claim_id: number | null;
}

export interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  age?: number;
  gender?: string;
  blood_group?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface Props {
  user: User;
  record: HealthRecord;
  familyMember: FamilyMember | null;
}

export interface CategorySection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
  action?: React.ReactNode;
}
