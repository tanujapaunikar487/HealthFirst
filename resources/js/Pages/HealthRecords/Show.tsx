import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge, type BadgeVariant } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Alert } from '@/Components/ui/alert';
import { DetailRow } from '@/Components/ui/detail-row';
import { DetailSection } from '@/Components/ui/detail-section';
import { SideNav } from '@/Components/SideNav';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { useToast } from '@/Contexts/ToastContext';
import { cn } from '@/Lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { IconCircle } from '@/Components/ui/icon-circle';
import {
  Download,
  Share2,
  MoreHorizontal,
  Stethoscope,
  Pill,
  TestTube2,
  ScanLine,
  FileText,
  Receipt,
  ExternalLink,
  HeartPulse,
  Microscope,
  Wind,
  Syringe,
  Radio,
  ClipboardList,
  ClipboardCheck,
  Award,
  Archive,
  Ambulance,
  BrainCircuit,
  AlertTriangle,
  UserPlus,
  Check,
  X,
  Phone,
  ChevronRight,
  Calendar,
  ShieldCheck,
  FileDown,
  Link2,
  User,
  Pencil,
  Sparkles,
  Loader2,
} from '@/Lib/icons';
import { downloadAsHtml } from '@/Lib/download';
import { generateHealthRecordPdfContent, escapeHtml } from '@/Lib/pdf-content';
import { ShareDialog } from '@/Components/ui/share-dialog';

/* ─── Types ─── */

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

interface LinkedRecord {
  id: number;
  icon_type: string;
  title: string;
  link_text: string;
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

interface AttachedFile {
  name: string;
  type: string;
  size?: string;
}

interface RecordMetadata {
  // AI summary (for lab reports and imaging reports)
  ai_summary?: string;
  ai_summary_generated_at?: string;
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
  // prescription
  drugs?: Drug[];
  valid_until?: string;
  pharmacy_notes?: string;
  // lab_report
  test_name?: string;
  test_category?: string;
  results?: (LabResult | PftResult)[];
  lab_name?: string;
  ordering_doctor?: string;
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
  // ecg_report
  heart_rate?: number;
  rhythm?: string;
  intervals?: { pr?: string; qrs?: string; qt?: string };
  axis?: string;
  // pathology_report
  specimen_type?: string;
  gross_description?: string;
  microscopic_findings?: string;
  grade?: string | null;
  pathologist?: string;
  // pft_report
  interpretation?: string;
  // other_report
  report_type?: string;
  // referral
  referred_to_doctor?: string;
  referred_to_department?: string;
  reason?: string;
  priority?: string;
  clinical_summary?: string;
  referral_status?: string;
  appointment_date?: string;
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
  // procedure_notes
  procedure_name?: string;
  anesthesia?: string;
  complications?: string;
  post_op_instructions?: string;
  // er_visit
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
  // other_visit
  visit_type?: string;
  notes?: string;
  session_number?: number;
  total_sessions?: number;
  progress?: string;
  // medication_active / medication_past
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
  // invoice
  invoice_number?: string;
  amount?: number;
  payment_status?: string;
  line_items?: { label: string; amount: number }[];
  invoice_date?: string;
  payment_method?: string;
  payment_date?: string;
}

interface RecordStatus {
  label: string;
  variant: string;
}

interface HealthRecord {
  id: number;
  appointment_id: number | null;
  family_member_id: number | null;
  category: string;
  title: string;
  description: string | null;
  doctor_name: string | null;
  department_name: string | null;
  // New overview fields
  patient_mrn?: string;
  patient_prn?: string;
  visit_type?: 'opd' | 'ipd';
  visit_number?: string;
  facility_name?: string;
  verified_status?: boolean;
  record_date: string;
  record_date_formatted: string;
  metadata: RecordMetadata | null;
  file_url: string | null;
  file_type: string | null;
  status: RecordStatus | null;
  insurance_claim_id: number | null;
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  age?: number;
  gender?: string;
  blood_group?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Props {
  user: User;
  record: HealthRecord;
  familyMember: FamilyMember | null;
}

interface CategorySection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
  iconClassName?: string;
  cardClassName?: string;
}

/* ─── Category Config ─── */

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  lab_report:         { label: 'Lab Report',   icon: TestTube2,      color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  xray_report:        { label: 'X-Ray',        icon: ScanLine,       color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  mri_report:         { label: 'MRI',          icon: BrainCircuit,   color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  ultrasound_report:  { label: 'Ultrasound',   icon: Radio,          color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  ecg_report:         { label: 'ECG',          icon: HeartPulse,     color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  pathology_report:   { label: 'Pathology',    icon: Microscope,     color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  pft_report:         { label: 'PFT',          icon: Wind,           color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  other_report:       { label: 'Other Report', icon: ClipboardList,  color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  consultation_notes: { label: 'Consultation', icon: Stethoscope,    color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  procedure_notes:    { label: 'Procedure',    icon: Syringe,        color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  discharge_summary:  { label: 'Discharge',    icon: FileText,       color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  er_visit:           { label: 'ER Visit',     icon: Ambulance,      color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  referral:           { label: 'Referral',     icon: UserPlus,       color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  other_visit:        { label: 'Other Visit',  icon: ClipboardCheck, color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  prescription:       { label: 'Prescription', icon: Pill,           color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  medication_active:  { label: 'Active Med',   icon: Pill,           color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  medication_past:    { label: 'Past Med',     icon: Archive,        color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  vaccination:        { label: 'Vaccination',  icon: Syringe,        color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  medical_certificate:{ label: 'Certificate',  icon: Award,          color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
  invoice:            { label: 'Invoice',      icon: Receipt,        color: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.2)' },
};

/* ─── Helpers ─── */

function CategoryIcon({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = categoryConfig[category] || { icon: FileText, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--secondary))' };
  const Icon = config.icon;
  const dims = { sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-14 w-14' };
  const iconDims = { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-7 w-7' };
  return (
    <div
      className={cn(dims[size], 'rounded-full flex items-center justify-center flex-shrink-0')}
      style={{ backgroundColor: config.bg }}
    >
      <Icon className={iconDims[size]} style={{ color: config.color }} />
    </div>
  );
}

function StatusBadge({ status }: { status: RecordStatus }) {
  const variantMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    destructive: 'danger',
    secondary: 'neutral',
  };
  return (
    <Badge variant={variantMap[status.variant] || 'neutral'}>
      {status.label}
    </Badge>
  );
}

function getStatusBadgeVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    normal: 'success',
    borderline: 'warning',
    abnormal: 'danger',
    high: 'danger',
    low: 'warning',
    elevated: 'warning',
  };
  return statusMap[status.toLowerCase()] || 'neutral';
}

function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    normal: 'Normal',
    borderline: 'Borderline',
    abnormal: 'Abnormal',
    high: 'High',
    low: 'Low',
    elevated: 'Elevated',
  };
  return labelMap[status.toLowerCase()] || status;
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ─── Side Navigation ─── */

function RecordSideNav({ items }: { items: { id: string; label: string; icon: React.ElementType }[] }) {
  const [activeSection, setActiveSection] = useState(items[0]?.id || 'summary');
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topmost = visible.reduce((prev, curr) =>
            prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
          );
          setActiveSection(topmost.target.id);
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    isScrollingRef.current = true;
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  };

  return (
    <SideNav
      items={items.map(s => ({ id: s.id, label: s.label, icon: s.icon }))}
      activeId={activeSection}
      onSelect={scrollTo}
      hiddenOnMobile
    />
  );
}

/* ─── Section alias (noPadding by default — rows handle own px-6 py-4) ─── */

function Section({
  id,
  title,
  icon,
  children,
  action,
  noPadding = true,
  iconClassName,
  cardClassName,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
  iconClassName?: string;
  cardClassName?: string;
}) {
  return (
    <DetailSection id={id} title={title} icon={icon} action={action} noPadding={noPadding} iconClassName={iconClassName} cardClassName={cardClassName}>
      {children}
    </DetailSection>
  );
}

function VitalsRows({ vitals, statuses, painScore }: { vitals: Record<string, string>; statuses?: Record<string, string>; painScore?: string }) {
  const allItems = [
    ...Object.entries(vitals).map(([key, val]) => ({ key, val })),
    ...(painScore ? [{ key: 'pain_score', val: painScore }] : []),
  ];
  const fmtLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div className="divide-y">
      {allItems.map(({ key, val }) => {
        const status = statuses?.[key];
        return (
          <DetailRow key={key} label={fmtLabel(key)}>
            <span className="flex items-center gap-2">
              {val}
              {status && (
                <Badge variant={getStatusBadgeVariant(status)} size="sm">
                  {getStatusLabel(status)}
                </Badge>
              )}
            </span>
          </DetailRow>
        );
      })}
    </div>
  );
}

function NumberedList({ items, variant = 'default' }: { items: string[]; variant?: 'default' | 'check' | 'x' | 'warning' }) {
  const iconMap = {
    check: <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />,
    x: <X className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />,
  };
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-body flex items-start gap-3 leading-relaxed text-foreground">
          {variant === 'default' ? (
            <span className="text-label text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
          ) : (
            iconMap[variant]
          )}
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function LinkedRecordsList({ records }: { records: LinkedRecord[] }) {
  return (
    <div className="divide-y">
      {records.map((rec, i) => {
        const config = categoryConfig[rec.icon_type];
        return (
          <Link
            key={i}
            href={`/health-records/${rec.id}`}
            className="flex items-center gap-3 w-full px-6 py-4 text-left hover:bg-muted/50 transition-colors"
          >
            {config ? (
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bg }}>
                <config.icon className="h-5 w-5" style={{ color: config.color }} />
              </div>
            ) : (
              <IconCircle icon={FileText} size="sm" variant="primary" />
            )}
            <span className="text-label flex-1 truncate">{rec.title}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}


/* ─── Main Page Component ─── */

export default function Show({ user, record, familyMember }: Props) {
  const { formatDate } = useFormatPreferences();
  const { showToast } = useToast();
  const [showShareDialog, setShowShareDialog] = useState(false);

  // AI Summary state (only for lab/imaging reports)
  const [aiSummary, setAiSummary] = useState<string | null>(
    record.metadata?.ai_summary || null
  );
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);

  const config = categoryConfig[record.category] || { label: record.category, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--secondary))' };

  const handleDownload = () => {
    const pdfContent = generateHealthRecordPdfContent(record);

    downloadAsHtml(
      `${record.category}-${record.id}.pdf`,
      `<h1>${escapeHtml(record.title)}</h1>
       <p class="subtitle">${escapeHtml(record.record_date_formatted)} &middot; ${escapeHtml(config.label)}</p>
       ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ''}
       ${pdfContent}`
    );
    showToast('Record downloaded', 'success');
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleRequestAmendment = () => {
    showToast('Amendment request submitted. You will be contacted within 48 hours.', 'success');
  };

  // Generate AI summary (only for lab/imaging reports)
  const generateAiSummary = useCallback(async (regenerate = false) => {
    if (aiSummaryLoading) return;
    if (aiSummary && !regenerate) return;

    setAiSummaryLoading(true);
    setAiSummaryError(null);

    try {
      const response = await fetch(`/health-records/${record.id}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        },
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setAiSummary(data.summary);
      setAiSummaryLoading(false);
    } catch (error) {
      setAiSummaryError('Failed to generate AI summary. Please try again.');
      setAiSummaryLoading(false);
    }
  }, [record.id, aiSummary, aiSummaryLoading]);

  // Auto-generate AI summary on mount if not present (for lab/imaging reports only)
  useEffect(() => {
    const reportCategories = ['lab_report', 'xray_report', 'mri_report', 'ultrasound_report', 'ecg_report', 'pathology_report', 'pft_report', 'other_report'];
    if (reportCategories.includes(record.category) && !aiSummary && !aiSummaryLoading) {
      generateAiSummary();
    }
  }, [record.category, aiSummary, aiSummaryLoading, generateAiSummary]);

  const categorySections = record.metadata
    ? getCategorySections(record.category, record.metadata, showToast, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary)
    : [];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: FileText },
    ...categorySections.map(s => ({ id: s.id, label: s.title, icon: s.icon })),
  ];

  return (
    <AppLayout pageTitle="Health Records" pageIcon="/assets/icons/records.svg">
      <div className="w-full max-w-page min-h-full flex flex-col pb-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-body text-muted-foreground self-start">
          <Link href="/health-records" className="hover:text-foreground transition-colors">
            Health Records
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{record.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <CategoryIcon category={record.category} size="lg" />
              <div>
                <h1 className="text-detail-title text-foreground">
                  {record.title}
                </h1>
                <p className="text-body text-muted-foreground mt-1">
                  {formatDate(record.record_date)}
                  {record.doctor_name && ` · ${record.doctor_name}`}
                  {record.department_name && ` · ${record.department_name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(record.metadata?.follow_up_recommendation || record.metadata?.follow_up_date || record.metadata?.follow_up) && (
                <Button onClick={() => window.location.href = '/booking'}>
                  <Calendar className="h-4 w-4" />
                  Book Follow-up
                </Button>
              )}
              {record.file_type && (
                <Button variant={(record.metadata?.follow_up_recommendation || record.metadata?.follow_up_date || record.metadata?.follow_up) ? 'secondary' : undefined} onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" iconOnly size="lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {record.appointment_id && (
                    <DropdownMenuItem asChild>
                      <Link href={`/appointments/${record.appointment_id}`} className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Appointment
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  {!record.file_type && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleRequestAmendment}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Request Amendment
                  </DropdownMenuItem>
                  {record.insurance_claim_id && (
                    <DropdownMenuItem asChild>
                      <Link href={`/insurance/claims/${record.insurance_claim_id}`} className="flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        View Insurance Claim
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {record.category === 'invoice' && record.appointment_id && (
                    <DropdownMenuItem asChild>
                      <Link href={`/billing/${record.appointment_id}`} className="flex items-center">
                        <Receipt className="h-4 w-4 mr-2" />
                        View Bill
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div>

        {/* Alerts */}
        <div className="mb-12 space-y-4">
          {/* Follow-up Alert */}
          {(record.metadata?.follow_up_recommendation || record.metadata?.follow_up_date || record.metadata?.follow_up) && (
            <Alert variant="info" title={(record.metadata.follow_up_recommendation || record.metadata.follow_up) || 'Follow-up Required'}>
              {(record.metadata.follow_up_recommendation || record.metadata.follow_up) && (
                <p className="text-body">{record.metadata.follow_up_recommendation || record.metadata.follow_up}</p>
              )}
              {record.metadata.follow_up_date && (
                <p className="text-body text-muted-foreground mt-1">Recommended: {formatDate(record.metadata.follow_up_date)}</p>
              )}
            </Alert>
          )}

          {/* Vaccination Complete Alert */}
          {record.category === 'vaccination' &&
            record.metadata?.next_due_date === null &&
            record.metadata?.dose_number === record.metadata?.total_doses && (
            <Alert variant="success" hideIcon>Vaccination course complete</Alert>
          )}

          {/* Side Effects Warning Alert */}
          {(record.category === 'medication_active' || record.category === 'medication_past') &&
            record.metadata?.side_effects_warning && (
            <Alert variant="warning">{record.metadata.side_effects_warning}</Alert>
          )}
        </div>

        {/* Main Content with Side Nav */}
        <div className="flex gap-24">
          <RecordSideNav items={navItems} />
          <div className="flex-1 min-w-0 space-y-12 pb-12">

            {/* AI Summary (if applicable) */}
            {categorySections.filter(s => s.id === 'ai-summary').map(section => (
              <Section key={section.id} id={section.id} title={section.title} icon={section.icon} action={section.action} noPadding={section.noPadding} iconClassName={section.iconClassName} cardClassName={section.cardClassName}>
                {section.content}
              </Section>
            ))}

            {/* Overview Section */}
            <Section id="overview" title="Overview" icon={FileText}>
              <div className="divide-y">
                {/* Patient Identifiers */}
                {record.patient_mrn && (
                  <DetailRow label="Patient ID (MRN)">{record.patient_mrn}</DetailRow>
                )}
                {record.patient_prn && (
                  <DetailRow label="Registration No">{record.patient_prn}</DetailRow>
                )}

                {/* Visit Information */}
                {record.visit_number && (
                  <DetailRow label="Visit">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" size="sm">
                        {record.visit_type === 'ipd' ? 'IPD' : 'OPD'}
                      </Badge>
                      <span className="text-label">{record.visit_number}</span>
                    </div>
                  </DetailRow>
                )}

                {/* Facility */}
                {record.facility_name && (
                  <DetailRow label="Facility">{record.facility_name}</DetailRow>
                )}

                <DetailRow label="Record ID">#{record.id}</DetailRow>
                <DetailRow label="Date">{formatDate(record.record_date)}</DetailRow>
                <DetailRow label="Category">
                  <Badge variant="neutral">{config.label}</Badge>
                </DetailRow>
                {record.status && (
                  <DetailRow label="Status">
                    <StatusBadge status={record.status} />
                  </DetailRow>
                )}
                <DetailRow label="Patient">
                  {familyMember ? `${familyMember.name} (${familyMember.relation})` : user.name}
                </DetailRow>
                {familyMember?.age && <DetailRow label="Age">{familyMember.age} years</DetailRow>}
                {record.doctor_name && (
                  <DetailRow label="Doctor">
                    <>
                      <p className="text-label">{record.doctor_name}</p>
                      {record.department_name && (
                        <p className="text-body text-muted-foreground">{record.department_name}</p>
                      )}
                    </>
                  </DetailRow>
                )}

                {/* Verification Status */}
                {record.verified_status !== undefined && (
                  <DetailRow label="Verification">
                    <Badge variant={record.verified_status ? 'success' : 'warning'}>
                      {record.verified_status ? 'Verified' : 'Pending'}
                    </Badge>
                  </DetailRow>
                )}

                {/* Category-specific highlights using DetailRow */}

                {/* Lab Reports */}
                {record.category === 'lab_report' && (
                  <>
                    {record.metadata?.test_name && (
                      <DetailRow label="Test">{record.metadata.test_name}</DetailRow>
                    )}
                    {record.metadata?.lab_name && (
                      <DetailRow label="Laboratory">{record.metadata.lab_name}</DetailRow>
                    )}
                    {record.metadata?.results && (
                      <DetailRow label="Results">
                        <div className="flex items-center gap-2">
                          <span className="text-label">{record.metadata.results.length} Tests</span>
                          {(() => {
                            const abnormalCount = record.metadata.results.filter((r: any) => r.status !== 'normal').length;
                            const criticalCount = record.metadata.results.filter((r: any) => r.status === 'critical').length;
                            return (
                              <>
                                {abnormalCount > 0 && (
                                  <Badge variant="warning" size="sm">{abnormalCount} Abnormal</Badge>
                                )}
                                {criticalCount > 0 && (
                                  <Badge variant="danger" size="sm">{criticalCount} Critical</Badge>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Imaging Reports */}
                {['xray_report', 'mri_report', 'ultrasound_report', 'ecg_report'].includes(record.category) && (
                  <>
                    {record.metadata?.body_part && (
                      <DetailRow label="Body Part">{record.metadata.body_part}</DetailRow>
                    )}
                    {record.metadata?.indication && (
                      <DetailRow label="Indication">{record.metadata.indication}</DetailRow>
                    )}
                    {record.metadata?.impression && (
                      <DetailRow label="Impression">
                        <span className="text-label">{record.metadata.impression}</span>
                      </DetailRow>
                    )}
                    {record.metadata?.radiologist && (
                      <DetailRow label="Radiologist">{record.metadata.radiologist}</DetailRow>
                    )}
                  </>
                )}

                {/* Visit Notes / Consultation */}
                {['consultation_notes', 'procedure_notes', 'er_visit'].includes(record.category) && (
                  <>
                    {record.metadata?.chief_complaint && (
                      <DetailRow label="Chief Complaint">
                        <span className="text-label">{record.metadata.chief_complaint}</span>
                      </DetailRow>
                    )}
                    {record.metadata?.diagnosis && (
                      <DetailRow label="Diagnosis">{record.metadata.diagnosis}</DetailRow>
                    )}
                    {record.metadata?.opd_number && (
                      <DetailRow label="OPD No">{record.metadata.opd_number}</DetailRow>
                    )}
                    {record.metadata?.duration && (
                      <DetailRow label="Duration">{record.metadata.duration}</DetailRow>
                    )}
                    {record.metadata?.follow_up_date && (
                      <DetailRow label="Follow-up">
                        <Badge variant="info" size="sm">{formatDate(record.metadata.follow_up_date)}</Badge>
                      </DetailRow>
                    )}
                  </>
                )}

                {/* Discharge Summary */}
                {record.category === 'discharge_summary' && (
                  <>
                    {record.metadata?.admission_date && record.metadata?.discharge_date && (
                      <DetailRow label="Admission">
                        {formatDate(record.metadata.admission_date)} → {formatDate(record.metadata.discharge_date)}
                      </DetailRow>
                    )}
                    {record.metadata?.length_of_stay && (
                      <DetailRow label="Length of Stay">
                        {record.metadata.length_of_stay}
                        {record.metadata.ipd_number && ` · IPD #${record.metadata.ipd_number}`}
                      </DetailRow>
                    )}
                    {record.metadata?.room_info && (
                      <DetailRow label="Room">{record.metadata.room_info}</DetailRow>
                    )}
                    {record.metadata?.primary_diagnosis && (
                      <DetailRow label="Primary Diagnosis">{record.metadata.primary_diagnosis}</DetailRow>
                    )}
                    {record.metadata?.treating_doctor && (
                      <DetailRow label="Treating Doctor">{record.metadata.treating_doctor}</DetailRow>
                    )}
                  </>
                )}

                {/* Prescription */}
                {record.category === 'prescription' && record.metadata?.valid_until && (
                  <DetailRow label="Valid Until">
                    <Badge variant={new Date(record.metadata.valid_until) > new Date() ? 'success' : 'neutral'}>
                      {formatDate(record.metadata.valid_until)}
                    </Badge>
                  </DetailRow>
                )}
              </div>
            </Section>

            {/* Category-specific sections (excluding AI Summary which is rendered above Overview) */}
            {categorySections.filter(s => s.id !== 'ai-summary').map(section => (
              <Section key={section.id} id={section.id} title={section.title} icon={section.icon} action={section.action} noPadding={section.noPadding} iconClassName={section.iconClassName} cardClassName={section.cardClassName}>
                {section.content}
              </Section>
            ))}

          </div>
        </div>

      </div>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={record.title}
        description={`${config.label} — ${record.record_date_formatted}${record.doctor_name ? ` — ${record.doctor_name}` : ''}`}
        url={window.location.href}
      />
    </AppLayout>
  );
}

/* ─── Category Section Router ─── */

function getCategorySections(
  category: string,
  meta: RecordMetadata,
  onAction: (msg: string) => void,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  switch (category) {
    case 'consultation_notes': return getConsultationSections(meta);
    case 'prescription': return getPrescriptionSections(meta);
    case 'lab_report': return getLabReportSections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'xray_report': return getXraySections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'mri_report': return getMriSections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'ultrasound_report': return getUltrasoundSections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'ecg_report': return getEcgSections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'pathology_report': return getPathologySections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'pft_report': return getPftSections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'other_report': return getOtherReportSections(meta, aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
    case 'procedure_notes': return getProcedureSections(meta);
    case 'er_visit': return getErVisitSections(meta, onAction);
    case 'referral': return getReferralSections(meta);
    case 'discharge_summary': return getDischargeSections(meta, onAction);
    case 'other_visit': return getOtherVisitSections(meta);
    case 'medication_active': return getMedicationActiveSections(meta, onAction);
    case 'medication_past': return getMedicationPastSections(meta);
    case 'vaccination': return getVaccinationSections(meta, onAction);
    case 'medical_certificate': return getMedicalCertificateSections(meta, onAction);
    case 'invoice': return getInvoiceSections(meta);
    default: return [];
  }
}

/* ─── Visit Detail Sections ─── */

function getConsultationSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Visit Details if there's at least one field with data
  const hasVisitDetails = meta.visit_type_label || meta.opd_number || meta.duration || meta.location ||
    (meta.vitals && Object.keys(meta.vitals).length > 0);

  if (hasVisitDetails) {
    sections.push({
      id: 'visit-details', title: 'Visit Details', icon: ClipboardList,
      content: (
        <>
          <div className="divide-y">
            {(meta.visit_type_label || meta.opd_number) && (
              <DetailRow label="Visit Type">
                {meta.visit_type_label}{meta.opd_number ? ` | ${meta.opd_number}` : ''}
              </DetailRow>
            )}
            {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
            {meta.location && <DetailRow label="Location">{meta.location}</DetailRow>}
          </div>
          {meta.vitals && Object.keys(meta.vitals).length > 0 && (
            <>
              <div className="px-6 pt-6 pb-2">
                <span className="text-overline text-muted-foreground">Vitals</span>
              </div>
              <VitalsRows vitals={meta.vitals} statuses={meta.vitals_status} />
            </>
          )}
        </>
      ),
    });
  }

  // Only add Clinical Summary if there's at least one field with data
  const hasClinicalSummary = meta.chief_complaint || (meta.symptoms && meta.symptoms.length > 0) ||
    meta.history_of_present_illness || meta.clinical_examination || meta.examination_findings ||
    meta.diagnosis || meta.treatment_plan_steps?.length || meta.treatment_plan;

  if (hasClinicalSummary) {
    sections.push({
      id: 'clinical-summary', title: 'Clinical Summary', icon: Stethoscope,
      content: (
        <div className="divide-y">
          {meta.chief_complaint && (
            <DetailRow label="Chief complaint">{meta.chief_complaint}</DetailRow>
          )}
          {meta.symptoms && meta.symptoms.length > 0 && (
            <DetailRow label="Symptoms">
              <div className="flex flex-wrap gap-2">
                {meta.symptoms.map((s, i) => <Badge key={i} variant="neutral">{s}</Badge>)}
              </div>
            </DetailRow>
          )}
          {meta.history_of_present_illness && (
            <DetailRow label="History">{meta.history_of_present_illness}</DetailRow>
          )}
          {(meta.clinical_examination || meta.examination_findings) && (
            <DetailRow label="Examination">{meta.clinical_examination || meta.examination_findings}</DetailRow>
          )}
          {meta.diagnosis && (
            <DetailRow label="Diagnosis">
              <div>
                <span className="text-card-title">{meta.diagnosis}</span>
                {meta.icd_code && <span className="text-body text-muted-foreground ml-2">ICD: {meta.icd_code}</span>}
              </div>
            </DetailRow>
          )}
          {(meta.treatment_plan_steps?.length || meta.treatment_plan) && (
            <DetailRow label="Treatment plan">
              {meta.treatment_plan_steps && meta.treatment_plan_steps.length > 0 ? (
                <NumberedList items={meta.treatment_plan_steps} />
              ) : meta.treatment_plan ? (
                <span>{meta.treatment_plan}</span>
              ) : null}
            </DetailRow>
          )}
        </div>
      ),
    });
  }


  if (meta.linked_records && meta.linked_records.length > 0) {
    sections.push({
      id: 'linked-records', title: 'Linked Records', icon: Link2,
      content: (
        <LinkedRecordsList records={meta.linked_records} />
      ),
    });
  }

  return sections;
}

function getProcedureSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Procedure Details if there's at least one field with data
  const hasProcedureDetails = meta.procedure_name || meta.indication || meta.anesthesia ||
    meta.technique || meta.findings || meta.complications;

  if (hasProcedureDetails) {
    sections.push({
      id: 'procedure-details',
      title: 'Procedure Details',
      icon: Syringe,
      content: (
        <div className="divide-y">
          {meta.procedure_name && <DetailRow label="Procedure">{meta.procedure_name}</DetailRow>}
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.anesthesia && <DetailRow label="Anesthesia">{meta.anesthesia}</DetailRow>}
          {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
          {meta.findings && <DetailRow label="Findings">{meta.findings}</DetailRow>}
          {meta.complications && <DetailRow label="Complications">{meta.complications}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.post_op_instructions) {
    sections.push({
      id: 'post-operative-care', title: 'Post-operative Care', icon: ClipboardCheck,
      content: (
        <div className="p-6">
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.post_op_instructions}</p>
        </div>
      ),
    });
  }

  if (meta.linked_records && meta.linked_records.length > 0) {
    sections.push({
      id: 'linked-records', title: 'Linked Records', icon: Link2,
      content: (
        <LinkedRecordsList records={meta.linked_records} />
      ),
    });
  }

  return sections;
}

function getErVisitSections(meta: RecordMetadata, onAction: (msg: string) => void): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Visit Details if there's at least one field with data
  const hasVisitDetails = meta.er_number || meta.arrival_time || meta.discharge_time || meta.duration ||
    meta.triage_level || meta.attending_doctor || meta.mode_of_arrival || meta.pain_score ||
    (meta.vitals && Object.keys(meta.vitals).length > 0);

  if (hasVisitDetails) {
    sections.push({
      id: 'visit-details', title: 'Visit Details', icon: Ambulance,
      content: (
        <>
          <div className="divide-y">
            {meta.er_number && <DetailRow label="ER Number">{meta.er_number}</DetailRow>}
            {meta.arrival_time && <DetailRow label="Arrival">{meta.arrival_time}</DetailRow>}
            {meta.discharge_time && <DetailRow label="Discharge">{meta.discharge_time}</DetailRow>}
            {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
            {meta.triage_level && (
              <DetailRow label="Triage Level">
                <Badge variant={meta.triage_level.includes('1') || meta.triage_level.includes('2') ? 'danger' : 'warning'}>
                  {meta.triage_level}
                </Badge>
              </DetailRow>
            )}
            {meta.attending_doctor && <DetailRow label="Attending">{meta.attending_doctor}</DetailRow>}
            {meta.mode_of_arrival && <DetailRow label="Mode of Arrival">{meta.mode_of_arrival}</DetailRow>}
            {meta.pain_score && <DetailRow label="Pain Score">{meta.pain_score}</DetailRow>}
          </div>
          {meta.vitals && Object.keys(meta.vitals).length > 0 && (
            <>
              <div className="px-6 pt-6 pb-2">
                <span className="text-overline text-muted-foreground">Vitals on Arrival</span>
              </div>
              <VitalsRows vitals={meta.vitals} statuses={meta.vitals_status} />
            </>
          )}
        </>
      ),
    });
  }

  // Only add Clinical & Treatment if there's at least one field with data
  const hasClinicalTreatment = meta.chief_complaint || meta.examination ||
    (meta.investigations && meta.investigations.length > 0) || meta.diagnosis ||
    meta.treatment_items?.length || meta.treatment_given || meta.disposition ||
    meta.disposition_detail || meta.follow_up;

  if (hasClinicalTreatment) {
    sections.push({
      id: 'clinical-treatment', title: 'Clinical & Treatment', icon: Stethoscope,
      content: (
        <div className="divide-y">
          {meta.chief_complaint && (
            <DetailRow label="Chief complaint">{meta.chief_complaint}</DetailRow>
          )}
          {meta.examination && (
            <DetailRow label="Examination">{meta.examination}</DetailRow>
          )}
          {meta.investigations && meta.investigations.length > 0 && meta.investigations.map((inv, i) => (
            <DetailRow key={i} label={inv.name}>
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{inv.result}</span>
                {inv.has_link && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-body text-primary hover:underline flex-shrink-0" onClick={() => onAction(`Opening ${inv.name}...`)}>
                    View
                  </Button>
                )}
              </span>
            </DetailRow>
          ))}
          {meta.diagnosis && (
            <DetailRow label="Diagnosis">{meta.diagnosis}</DetailRow>
          )}
          {(meta.treatment_items?.length || meta.treatment_given) && (
            <DetailRow label="Treatment given">
              {meta.treatment_items && meta.treatment_items.length > 0 ? (
                <NumberedList items={meta.treatment_items} />
              ) : meta.treatment_given ? (
                <span>{meta.treatment_given}</span>
              ) : null}
            </DetailRow>
          )}
          {(meta.disposition || meta.disposition_detail) && (
            <DetailRow label="Disposition">
              <div>
                {meta.disposition && <span className="text-label">{meta.disposition}</span>}
                {meta.disposition_detail && <p className="text-body text-muted-foreground mt-1">{meta.disposition_detail}</p>}
              </div>
            </DetailRow>
          )}
          {meta.follow_up && (
            <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>
          )}
        </div>
      ),
    });
  }

  if (meta.linked_records && meta.linked_records.length > 0) {
    sections.push({
      id: 'linked-records', title: 'Linked Records', icon: Link2,
      content: (
        <LinkedRecordsList records={meta.linked_records} />
      ),
    });
  }

  return sections;
}

function getReferralSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Referral if there's at least one field with data
  const hasReferralData = meta.referred_to_doctor || meta.referred_to_department || meta.priority ||
    meta.referral_status || meta.appointment_date || meta.reason || meta.clinical_summary;

  if (hasReferralData) {
    sections.push({
      id: 'referral',
      title: 'Referral',
      icon: UserPlus,
      content: (
        <div className="divide-y">
          {meta.referred_to_doctor && <DetailRow label="Referred To">{meta.referred_to_doctor}</DetailRow>}
          {meta.referred_to_department && <DetailRow label="Department">{meta.referred_to_department}</DetailRow>}
          {meta.priority && (
            <DetailRow label="Priority">
              <Badge variant={meta.priority === 'urgent' ? 'danger' : 'neutral'} className="capitalize">
                {meta.priority}
              </Badge>
            </DetailRow>
          )}
          {meta.referral_status && (
            <DetailRow label="Status">
              <Badge variant={meta.referral_status === 'scheduled' ? 'success' : meta.referral_status === 'accepted' ? 'info' : 'warning'} className="capitalize">
                {meta.referral_status}
              </Badge>
            </DetailRow>
          )}
          {meta.appointment_date && <DetailRow label="Appointment Date">{fmtDate(meta.appointment_date)}</DetailRow>}
          {meta.reason && <DetailRow label="Reason">{meta.reason}</DetailRow>}
          {meta.clinical_summary && <DetailRow label="Clinical Summary">{meta.clinical_summary}</DetailRow>}
        </div>
      ),
    });
  }

  return sections;
}

function getDischargeSections(meta: RecordMetadata, onAction: (msg: string) => void): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Admission Details if there's at least one field with data
  const hasAdmissionDetails = meta.admission_date || meta.discharge_date || meta.length_of_stay ||
    meta.treating_doctor || meta.room_info || meta.ipd_number;

  if (hasAdmissionDetails) {
    sections.push({
      id: 'admission',
      title: 'Admission Details',
      icon: ClipboardList,
      content: (
        <div className="divide-y">
          {meta.admission_date && <DetailRow label="Admission Date">{fmtDate(meta.admission_date)}</DetailRow>}
          {meta.discharge_date && <DetailRow label="Discharge Date">{fmtDate(meta.discharge_date)}</DetailRow>}
          {meta.length_of_stay && <DetailRow label="Length of Stay">{meta.length_of_stay}</DetailRow>}
          {meta.treating_doctor && <DetailRow label="Treating Doctor">{meta.treating_doctor}</DetailRow>}
          {meta.room_info && <DetailRow label="Room">{meta.room_info}</DetailRow>}
          {meta.ipd_number && <DetailRow label="IPD Number">{meta.ipd_number}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.primary_diagnosis || meta.diagnosis || meta.secondary_diagnosis || meta.procedure_performed || meta.procedures || meta.hospital_course) {
    sections.push({
      id: 'diagnosis',
      title: 'Diagnosis & Course',
      icon: Stethoscope,
      content: (
        <div className="divide-y">
          {(meta.primary_diagnosis || meta.diagnosis) && (
            <DetailRow label="Primary diagnosis">
              <span className="text-card-title">{meta.primary_diagnosis || meta.diagnosis}</span>
            </DetailRow>
          )}
          {meta.secondary_diagnosis && <DetailRow label="Secondary diagnosis">{meta.secondary_diagnosis}</DetailRow>}
          {(meta.procedures && meta.procedures.length > 0) ? (
            <DetailRow label="Procedures">{meta.procedures.join(', ')}</DetailRow>
          ) : meta.procedure_performed ? (
            <DetailRow label="Procedure">{meta.procedure_performed}</DetailRow>
          ) : null}
          {meta.hospital_course && <DetailRow label="Hospital course">{meta.hospital_course}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.vitals_at_discharge && Object.keys(meta.vitals_at_discharge).length > 0) {
    sections.push({
      id: 'vitals-discharge', title: 'Vitals at Discharge', icon: HeartPulse,
      content: <VitalsRows vitals={meta.vitals_at_discharge} />,
    });
  }

  if (meta.discharge_medications && meta.discharge_medications.length > 0) {
    sections.push({
      id: 'prescriptions', title: 'Discharge Prescriptions', icon: Pill,
      content: (
        <div className="p-6">
          <ol className="space-y-2">
            {meta.discharge_medications.map((med, i) => (
              <li key={i} className="text-body flex items-start gap-3" style={{ color: 'hsl(var(--foreground))' }}>
                <span className="text-label text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                <span>{med.name} — {med.dosage} x {med.duration}</span>
              </li>
            ))}
          </ol>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-body text-primary hover:underline mt-3"
            onClick={() => onAction('Opening prescription...')}
          >
            View Full Prescription →
          </Button>
        </div>
      ),
    });
  }

  if (meta.discharge_dos?.length || meta.discharge_donts?.length || meta.discharge_instructions) {
    sections.push({
      id: 'instructions', title: 'Discharge Instructions', icon: ClipboardCheck,
      content: (
        <div className="p-6 space-y-4">
          {meta.discharge_dos && meta.discharge_dos.length > 0 && (
            <NumberedList items={meta.discharge_dos} variant="check" />
          )}
          {meta.discharge_donts && meta.discharge_donts.length > 0 && (
            <NumberedList items={meta.discharge_donts} variant="x" />
          )}
          {!meta.discharge_dos?.length && !meta.discharge_donts?.length && meta.discharge_instructions && (
            <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.discharge_instructions}</p>
          )}
        </div>
      ),
    });
  }

  if (meta.warning_signs && meta.warning_signs.length > 0) {
    sections.push({
      id: 'warning-signs', title: 'Warning Signs', icon: AlertTriangle,
      noPadding: true,
      content: (
        <div className="divide-y">
          {meta.warning_signs.map((sign, i) => (
            <div key={i} className="flex items-start gap-3 px-6 py-4">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <span className="text-body text-foreground flex-1">{sign}</span>
            </div>
          ))}
          {meta.emergency_contact && (
            <div className="flex items-center gap-3 px-6 py-4 bg-destructive-subtle">
              <Phone className="w-5 h-5 text-destructive flex-shrink-0" />
              <span className="text-label text-destructive">{meta.emergency_contact}</span>
            </div>
          )}
        </div>
      ),
    });
  }

  if (meta.follow_up_schedule && meta.follow_up_schedule.length > 0) {
    sections.push({
      id: 'follow-up', title: 'Follow-up Schedule', icon: Calendar,
      content: (
        <div className="divide-y">
          {meta.follow_up_schedule.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-label">{item.description}</p>
                <p className="text-body text-muted-foreground">{fmtDate(item.date)}</p>
              </div>
              {item.booked ? (
                <Badge variant="success">Booked</Badge>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => { window.location.href = '/booking'; }}>
                  Book Now
                </Button>
              )}
            </div>
          ))}
        </div>
      ),
    });
  }

  if (meta.linked_records && meta.linked_records.length > 0) {
    sections.push({
      id: 'linked-records', title: 'Linked Records', icon: Link2,
      content: (
        <LinkedRecordsList records={meta.linked_records} />
      ),
    });
  }

  return sections;
}

function getOtherVisitSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Session if there's at least one field with data
  const hasSessionData = meta.session_number != null || meta.total_sessions != null ||
    meta.visit_type || meta.follow_up || meta.notes || meta.progress;

  if (hasSessionData) {
    sections.push({
      id: 'session', title: 'Session', icon: ClipboardCheck,
      content: (
        <>
          {meta.session_number != null && meta.total_sessions != null && (
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body text-muted-foreground">Session progress</span>
                <span className="text-label">{meta.session_number} of {meta.total_sessions}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(meta.session_number / meta.total_sessions) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="divide-y">
            {meta.visit_type && <DetailRow label="Visit Type">{meta.visit_type}</DetailRow>}
            {meta.follow_up && <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>}
            {meta.notes && <DetailRow label="Notes">{meta.notes}</DetailRow>}
            {meta.progress && <DetailRow label="Progress">{meta.progress}</DetailRow>}
          </div>
        </>
      ),
    });
  }

  return sections;
}

/* ─── Report Detail Sections ─── */

// Helper function for AI Summary section
function getAiSummarySection(
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection | null {
  if (!aiSummary && !aiSummaryLoading && !aiSummaryError) return null;

  return {
    id: 'ai-summary',
    title: 'AI Summary',
    icon: Sparkles,
    iconClassName: 'h-5 w-5 fill-current text-ai-purple',
    noPadding: true,
    cardClassName: 'border-0 p-0',
    content: (
      <div className="rounded-xl p-6 space-y-4" style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #FAF5FF 100%)' }}>
        {aiSummaryLoading && (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-body text-muted-foreground">Generating AI summary...</span>
          </div>
        )}
        {aiSummaryError && (
          <div className="space-y-3">
            <p className="text-body text-destructive">{aiSummaryError}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => generateAiSummary?.(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 fill-current text-ai-purple" />
              Retry
            </Button>
          </div>
        )}
        {aiSummary && !aiSummaryLoading && (
          <>
            <p className="text-body leading-relaxed text-foreground">
              {aiSummary}
            </p>
            <p className="text-caption text-muted-foreground">
              This is an AI-generated summary for informational purposes. Always consult your doctor for medical advice.
            </p>
          </>
        )}
      </div>
    ),
  };
}

function getLabReportSections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  sections.push({
    id: 'results', title: 'Results', icon: TestTube2,
    content: (
      <>
        {meta.ordering_doctor && (
          <div className="divide-y">
            <DetailRow label="Ordered By">{meta.ordering_doctor}</DetailRow>
          </div>
        )}
        {meta.results && meta.results.length > 0 && (
          <table className="w-full text-body">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Parameter</th>
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Value</th>
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Reference</th>
                <th className="text-center px-4 py-3 text-label text-muted-foreground w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {(meta.results as LabResult[]).map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 text-label">{r.parameter}</td>
                  <td className="px-4 py-3">{r.value} {r.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.reference_range}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                      {getStatusLabel(r.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    ),
  });

  if (meta.interpretation) {
    sections.push({
      id: 'interpretation',
      title: 'Interpretation',
      icon: Stethoscope,
      content: (
        <div className="divide-y">
          <DetailRow label="Interpretation">{meta.interpretation}</DetailRow>
        </div>
      ),
    });
  }

  return sections;
}

function getXraySections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  // Only add Study Details if there's at least one field with data
  const hasStudyDetails = meta.body_part || meta.indication || meta.technique || meta.radiologist;

  if (hasStudyDetails) {
    sections.push({
      id: 'study-details',
      title: 'Study Details',
      icon: ScanLine,
      content: (
        <div className="divide-y">
          {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
          {meta.radiologist && <DetailRow label="Radiologist">{meta.radiologist}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.findings || meta.impression) {
    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="divide-y">
          {meta.findings && <DetailRow label="Observations">{meta.findings}</DetailRow>}
          {meta.impression && <DetailRow label="Impression">{meta.impression}</DetailRow>}
        </div>
      ),
    });
  }

  return sections;
}

function getMriSections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  // Only add Study Details if there's at least one field with data
  const hasStudyDetails = meta.body_part || meta.indication || meta.technique ||
    meta.contrast || meta.sequences || meta.radiologist;

  if (hasStudyDetails) {
    sections.push({
      id: 'study-details',
      title: 'Study Details',
      icon: BrainCircuit,
      content: (
        <div className="divide-y">
          {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
          {meta.contrast && <DetailRow label="Contrast">{meta.contrast}</DetailRow>}
          {meta.sequences && <DetailRow label="Sequences">{meta.sequences}</DetailRow>}
          {meta.radiologist && <DetailRow label="Radiologist">{meta.radiologist}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.findings || meta.impression) {
    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="divide-y">
          {meta.findings && <DetailRow label="Observations">{meta.findings}</DetailRow>}
          {meta.impression && <DetailRow label="Impression">{meta.impression}</DetailRow>}
        </div>
      ),
    });
  }

  return sections;
}

function getUltrasoundSections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  // Only add Study Details if there's at least one field with data
  const hasStudyDetails = meta.body_part || meta.indication || meta.sonographer;

  if (hasStudyDetails) {
    sections.push({
      id: 'study-details',
      title: 'Study Details',
      icon: Radio,
      content: (
        <div className="divide-y">
          {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.sonographer && <DetailRow label="Sonographer">{meta.sonographer}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.findings || meta.impression) {
    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="divide-y">
          {meta.findings && <DetailRow label="Observations">{meta.findings}</DetailRow>}
          {meta.impression && <DetailRow label="Impression">{meta.impression}</DetailRow>}
        </div>
      ),
    });
  }

  return sections;
}

function getEcgSections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  // Only add Measurements if there's at least one field with data
  const hasMeasurements = meta.indication || meta.heart_rate || meta.rhythm || meta.axis ||
    meta.intervals?.pr || meta.intervals?.qrs || meta.intervals?.qt;

  if (hasMeasurements) {
    sections.push({
      id: 'measurements',
      title: 'Measurements',
      icon: HeartPulse,
      content: (
        <div className="divide-y">
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.heart_rate && <DetailRow label="Heart Rate">{`${meta.heart_rate} bpm`}</DetailRow>}
          {meta.rhythm && <DetailRow label="Rhythm">{meta.rhythm}</DetailRow>}
          {meta.axis && <DetailRow label="Axis">{meta.axis}</DetailRow>}
          {meta.intervals?.pr && <DetailRow label="PR Interval">{meta.intervals.pr}</DetailRow>}
          {meta.intervals?.qrs && <DetailRow label="QRS Interval">{meta.intervals.qrs}</DetailRow>}
          {meta.intervals?.qt && <DetailRow label="QT Interval">{meta.intervals.qt}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.findings || meta.impression) {
    const isAbnormal = meta.impression?.toLowerCase().includes('abnormal') ||
                       meta.impression?.toLowerCase().includes('ischemia') ||
                       meta.impression?.toLowerCase().includes('arrhythmia');

    sections.push({
      id: 'findings',
      title: 'Findings',
      icon: FileText,
      content: (
        <div className="divide-y">
          {meta.findings && <DetailRow label="Observations">{meta.findings}</DetailRow>}
          {meta.impression && (
            <DetailRow label="Impression">
              <span className={isAbnormal ? 'text-destructive' : ''}>{meta.impression}</span>
            </DetailRow>
          )}
        </div>
      ),
    });
  }

  return sections;
}

function getPathologySections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  // Only add Specimen & Analysis if there's at least one field with data
  const hasSpecimenAnalysis = meta.specimen_type || meta.pathologist ||
    meta.gross_description || meta.microscopic_findings;

  if (hasSpecimenAnalysis) {
    sections.push({
      id: 'specimen-analysis',
      title: 'Specimen & Analysis',
      icon: Microscope,
      content: (
        <div className="divide-y">
          {meta.specimen_type && <DetailRow label="Specimen">{meta.specimen_type}</DetailRow>}
          {meta.pathologist && <DetailRow label="Pathologist">{meta.pathologist}</DetailRow>}
          {meta.gross_description && <DetailRow label="Gross Description">{meta.gross_description}</DetailRow>}
          {meta.microscopic_findings && <DetailRow label="Microscopic Findings">{meta.microscopic_findings}</DetailRow>}
        </div>
      ),
    });
  }

  if (meta.diagnosis) {
    sections.push({
      id: 'diagnosis',
      title: 'Diagnosis',
      icon: ClipboardCheck,
      content: (
        <div className="divide-y">
          <DetailRow label="Diagnosis">
            <>
              {meta.diagnosis}
              {meta.grade && <span className="text-muted-foreground ml-2">— Grade: {meta.grade}</span>}
            </>
          </DetailRow>
        </div>
      ),
    });
  }

  return sections;
}

function getPftSections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  sections.push({
    id: 'results', title: 'Results', icon: Wind,
    content: (
      <>
        {meta.indication && (
          <div className="divide-y">
            <DetailRow label="Indication">{meta.indication}</DetailRow>
          </div>
        )}
        {meta.results && meta.results.length > 0 && (
          <table className="w-full text-body">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Parameter</th>
                <th className="text-right px-4 py-3 text-label text-muted-foreground">Actual</th>
                <th className="text-right px-4 py-3 text-label text-muted-foreground">Predicted</th>
                <th className="text-right px-4 py-3 text-label text-muted-foreground">%</th>
                <th className="text-center px-4 py-3 text-label text-muted-foreground w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {(meta.results as PftResult[]).map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 text-label">{r.parameter}</td>
                  <td className="px-4 py-3 text-right">{r.value}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.predicted}</td>
                  <td className="px-4 py-3 text-right">{r.percent_predicted}%</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={getStatusBadgeVariant(r.status)} size="sm">
                      {getStatusLabel(r.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    ),
  });

  if (meta.interpretation) {
    sections.push({
      id: 'interpretation',
      title: 'Interpretation',
      icon: Stethoscope,
      content: (
        <div className="divide-y">
          <DetailRow label="Interpretation">{meta.interpretation}</DetailRow>
        </div>
      ),
    });
  }

  return sections;
}

function getOtherReportSections(
  meta: RecordMetadata,
  aiSummary?: string | null,
  aiSummaryLoading?: boolean,
  aiSummaryError?: string | null,
  generateAiSummary?: (regenerate?: boolean) => void
): CategorySection[] {
  const sections: CategorySection[] = [];

  // AI Summary section
  const aiSummarySection = getAiSummarySection(aiSummary, aiSummaryLoading, aiSummaryError, generateAiSummary);
  if (aiSummarySection) {
    sections.push(aiSummarySection);
  }

  // Only add Report if there's at least one field with data
  const hasReportData = meta.report_type || meta.indication || meta.findings || meta.impression;

  if (hasReportData) {
    sections.push({
      id: 'report',
      title: 'Report',
      icon: ClipboardList,
      content: (
        <div className="divide-y">
          {meta.report_type && <DetailRow label="Report Type">{meta.report_type}</DetailRow>}
          {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
          {meta.findings && <DetailRow label="Observations">{meta.findings}</DetailRow>}
          {meta.impression && <DetailRow label="Impression">{meta.impression}</DetailRow>}
        </div>
      ),
    });
  }

  return sections;
}

/* ─── Medication Detail Sections ─── */

function getPrescriptionSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  sections.push({
    id: 'prescription', title: 'Prescription', icon: Pill,
    content: (
      <div className="divide-y">
        {meta.diagnosis && (
          <DetailRow label="Diagnosis">
            <div>
              <span className="text-card-title">{meta.diagnosis}</span>
              {meta.icd_code && <span className="text-body text-muted-foreground ml-2">ICD: {meta.icd_code}</span>}
            </div>
          </DetailRow>
        )}
        {meta.drugs && meta.drugs.length > 0 && meta.drugs.map((drug, i) => (
          <div key={i}>
            <div className="px-6 pt-4 pb-2">
              <h3 className="text-card-title">{drug.name}</h3>
            </div>
            <div className="divide-y">
              {drug.dosage && <DetailRow label="Dosage">{drug.dosage}</DetailRow>}
              {drug.frequency && <DetailRow label="Frequency">{drug.frequency}</DetailRow>}
              {drug.duration && <DetailRow label="Duration">{drug.duration}</DetailRow>}
              {drug.instructions && <DetailRow label="Instructions">{drug.instructions}</DetailRow>}
            </div>
          </div>
        ))}
        {meta.valid_until && <DetailRow label="Valid until">{fmtDate(meta.valid_until)}</DetailRow>}
        {meta.pharmacy_notes && <DetailRow label="Pharmacy Notes">{meta.pharmacy_notes}</DetailRow>}
      </div>
    ),
  });

  return sections;
}

function getMedicationActiveSections(meta: RecordMetadata, onAction: (msg: string) => void): CategorySection[] {
  const sections: CategorySection[] = [];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  sections.push({
    id: 'medication',
    title: 'Medication',
    icon: Pill,
    action: <Badge variant="success">Active</Badge>,
    content: (
      <div className="divide-y">
        {meta.dosage && <DetailRow label="Dose">{meta.dosage}</DetailRow>}
        {meta.frequency && <DetailRow label="Frequency">{meta.frequency}</DetailRow>}
        {meta.timing && <DetailRow label="Timing">{meta.timing}</DetailRow>}
        {meta.with_food && (
          <DetailRow label="Food">
            <Badge variant="success">Take with food</Badge>
          </DetailRow>
        )}
        {meta.medication_duration && <DetailRow label="Duration">{meta.medication_duration}</DetailRow>}
        {meta.route && <DetailRow label="Route">{meta.route}</DetailRow>}
        {meta.condition && <DetailRow label="Condition">{meta.condition}</DetailRow>}
        {meta.side_effects && meta.side_effects.length > 0 && (
          <DetailRow label="Side effects">{meta.side_effects.join(', ')}</DetailRow>
        )}
      </div>
    ),
  });

  if (meta.adherence_this_week && meta.adherence_this_week.length > 0) {
    sections.push({
      id: 'adherence', title: 'Adherence', icon: Calendar,
      content: (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            {meta.adherence_this_week.map((status, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  status === 'taken' && 'bg-success/10',
                  status === 'missed' && 'bg-destructive/10',
                  status === 'upcoming' && 'bg-muted',
                )}>
                  {status === 'taken' && <Check className="h-5 w-5 text-success" />}
                  {status === 'missed' && <X className="h-5 w-5 text-destructive" />}
                  {status === 'upcoming' && <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />}
                </div>
                <span className="text-body text-muted-foreground">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          {meta.adherence_rate != null && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', meta.adherence_rate >= 80 ? 'bg-success' : meta.adherence_rate >= 60 ? 'bg-warning' : 'bg-destructive')}
                  style={{ width: `${meta.adherence_rate}%` }}
                />
              </div>
              <span className="text-label">{meta.adherence_rate}%</span>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => onAction('Dose logged successfully')}>
              <Check className="h-4 w-4" />
              Log Today's Dose
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => onAction('Adherence history logged')}>
              <Calendar className="h-4 w-4" />
              View History
            </Button>
          </div>
        </div>
      ),
    });
  }

  if (meta.linked_records && meta.linked_records.length > 0) {
    sections.push({
      id: 'related-records', title: 'Related Records', icon: Link2,
      content: (
        <LinkedRecordsList records={meta.linked_records} />
      ),
    });
  }

  return sections;
}

function getMedicationPastSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  sections.push({
    id: 'medication',
    title: 'Medication',
    icon: Pill,
    action: <Badge variant="neutral">Inactive</Badge>,
    content: (
      <div className="divide-y">
        {meta.dosage && <DetailRow label="Dose">{meta.dosage}</DetailRow>}
        {meta.frequency && <DetailRow label="Frequency">{meta.frequency}</DetailRow>}
        {meta.timing && <DetailRow label="Timing">{meta.timing}</DetailRow>}
        {meta.with_food && (
          <DetailRow label="Food">
            <Badge variant="success">Take with food</Badge>
          </DetailRow>
        )}
        {meta.medication_duration && <DetailRow label="Duration">{meta.medication_duration}</DetailRow>}
        {meta.route && <DetailRow label="Route">{meta.route}</DetailRow>}
        {meta.condition && <DetailRow label="Condition">{meta.condition}</DetailRow>}
        {meta.prescribing_doctor && <DetailRow label="Prescribed by">{meta.prescribing_doctor}</DetailRow>}
        {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
        {meta.end_date && <DetailRow label="Ended">{fmtDate(meta.end_date)}</DetailRow>}
        {meta.reason_stopped && <DetailRow label="Reason stopped">{meta.reason_stopped}</DetailRow>}
      </div>
    ),
  });

  return sections;
}

/* ─── Document Detail Sections ─── */

function getVaccinationSections(meta: RecordMetadata, onAction: (msg: string) => void): CategorySection[] {
  const sections: CategorySection[] = [];

  sections.push({
    id: 'administration', title: 'Administration', icon: Syringe,
    content: (
      <>
        {meta.dose_number != null && meta.total_doses != null && (
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-body text-muted-foreground">Dose progress</span>
              <span className="text-label">{meta.dose_number} of {meta.total_doses}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(meta.dose_number / meta.total_doses) * 100}%` }} />
            </div>
          </div>
        )}
        <div className="divide-y">
          {meta.batch_number && <DetailRow label="Batch Number">{meta.batch_number}</DetailRow>}
          {meta.administered_by && <DetailRow label="Administered By">{meta.administered_by}</DetailRow>}
          {meta.site && <DetailRow label="Injection Site">{meta.site}</DetailRow>}
          {meta.next_due_date && <DetailRow label="Next Due">{fmtDate(meta.next_due_date)}</DetailRow>}
        </div>
      </>
    ),
  });

  sections.push({
    id: 'history-schedule', title: 'History & Schedule', icon: Archive,
    content: (
      <>
        {meta.vaccination_history && meta.vaccination_history.length > 0 && (
          <table className="w-full text-body">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Vaccine</th>
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-label text-muted-foreground">Dose</th>
              </tr>
            </thead>
            <tbody>
              {meta.vaccination_history.map((entry, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3">
                    <div className="text-label">{entry.vaccine_name}</div>
                    <div className="text-muted-foreground text-body">{entry.site}</div>
                  </td>
                  <td className="px-4 py-3">{fmtDate(entry.date)}</td>
                  <td className="px-4 py-3">{entry.dose_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta.upcoming_vaccinations && meta.upcoming_vaccinations.length > 0 && (
          <div className="divide-y border-t">
            {meta.upcoming_vaccinations.map((vac, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-label">{vac.vaccine_name}</p>
                  <p className="text-body text-muted-foreground">{vac.dose_label} · Due {fmtDate(vac.due_date)}</p>
                </div>
                <Button variant="secondary" size="sm" className="gap-2" onClick={() => onAction(`Scheduling ${vac.vaccine_name}...`)}>
                  <Calendar className="h-4 w-4" />
                  Schedule
                </Button>
              </div>
            ))}
          </div>
        )}
      </>
    ),
  });

  if (meta.attached_certificates && meta.attached_certificates.length > 0) {
    sections.push({
      id: 'documents', title: 'Documents', icon: FileText,
      action: (
        <Button variant="secondary" size="md" onClick={() => onAction('Downloading all documents...')}>
          <Download className="h-4 w-4" />
          Download All
        </Button>
      ),
      noPadding: true,
      content: (
        <div className="divide-y">
          {meta.attached_certificates.map((file, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <FileDown className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-label truncate">{file.name}</p>
                <p className="text-body text-muted-foreground uppercase">{file.type}{file.size ? ` · ${file.size}` : ''}</p>
              </div>
              <Button variant="secondary" iconOnly size="md" onClick={() => onAction(`Downloading ${file.name}...`)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ),
    });
  }

  return sections;
}

function getMedicalCertificateSections(meta: RecordMetadata, onAction: (msg: string) => void): CategorySection[] {
  const sections: CategorySection[] = [];

  // Only add Certificate Details if there's at least one field with data
  const hasCertificateDetails = meta.certificate_type || meta.certificate_number || meta.issued_for ||
    meta.issued_by || meta.valid_from || meta.valid_until || meta.certificate_content || meta.notes;

  if (hasCertificateDetails) {
    sections.push({
      id: 'certificate-details',
      title: 'Certificate Details',
      icon: Award,
      content: (
        <div className="divide-y">
          {meta.certificate_type && <DetailRow label="Type">{meta.certificate_type}</DetailRow>}
          {meta.certificate_number && <DetailRow label="Certificate No.">{meta.certificate_number}</DetailRow>}
          {meta.issued_for && <DetailRow label="Issued For">{meta.issued_for}</DetailRow>}
          {meta.issued_by && <DetailRow label="Issued By">{meta.issued_by}</DetailRow>}
          {meta.valid_from && meta.valid_until && (
            <DetailRow label="Validity">{`${fmtDate(meta.valid_from)} – ${fmtDate(meta.valid_until)}`}</DetailRow>
          )}
          {(meta.certificate_content || meta.notes) && (
            <DetailRow label="Content">{meta.certificate_content || meta.notes}</DetailRow>
          )}
        </div>
      ),
    });
  }

  sections.push({
    id: 'verification', title: 'Verification', icon: ShieldCheck,
    content: (
      <div className="divide-y">
        <DetailRow label="Status">
          <span className="flex items-center gap-2">
            {meta.digitally_signed ? (
              <>
                <ShieldCheck className="h-5 w-5 text-success" />
                <span className="text-label text-success">Digitally Signed & Verified</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-foreground" />
                <span className="text-label text-muted-foreground">Not digitally signed</span>
              </>
            )}
          </span>
        </DetailRow>
        {meta.verification_url && (
          <DetailRow label="Verify at">
            <Button variant="link" size="sm" className="h-auto p-0 text-primary hover:underline" onClick={() => onAction(`Verification URL: ${meta.verification_url}`)}>
              {meta.verification_url}
            </Button>
          </DetailRow>
        )}
      </div>
    ),
  });

  if (meta.linked_records && meta.linked_records.length > 0) {
    sections.push({
      id: 'linked-records', title: 'Linked Records', icon: Link2,
      content: (
        <LinkedRecordsList records={meta.linked_records} />
      ),
    });
  }

  return sections;
}

function getInvoiceSections(meta: RecordMetadata): CategorySection[] {
  const sections: CategorySection[] = [];

  sections.push({
    id: 'billing', title: 'Billing', icon: Receipt,
    content: (
      <>
        <div className="divide-y">
          {meta.invoice_number && <DetailRow label="Invoice">{meta.invoice_number}</DetailRow>}
          {meta.invoice_date && <DetailRow label="Invoice Date">{fmtDate(meta.invoice_date)}</DetailRow>}
          {meta.payment_status && (
            <DetailRow label="Status">
              <Badge variant={meta.payment_status === 'paid' ? 'success' : meta.payment_status === 'pending' ? 'warning' : meta.payment_status === 'due' ? 'danger' : 'neutral'} className="capitalize">
                {meta.payment_status}
              </Badge>
            </DetailRow>
          )}
          {meta.payment_method && <DetailRow label="Payment Method">{meta.payment_method}</DetailRow>}
          {meta.payment_date && <DetailRow label="Payment Date">{fmtDate(meta.payment_date)}</DetailRow>}
        </div>
        {meta.line_items && meta.line_items.length > 0 && (
          <div className="divide-y border-t">
            {meta.line_items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <span className="text-body text-muted-foreground">{item.label}</span>
                <span className="text-label text-foreground">₹{item.amount.toLocaleString()}</span>
              </div>
            ))}
            {meta.amount != null && (
              <div className="flex items-center justify-between px-6 py-4">
                <span className="text-card-title text-foreground">Total</span>
                <span className="text-subheading text-foreground">₹{meta.amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </>
    ),
  });

  return sections;
}
