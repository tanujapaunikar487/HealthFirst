import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Alert } from '@/Components/ui/alert';
import { DetailRow } from '@/Components/ui/detail-row';
import { DetailSection } from '@/Components/ui/detail-section';
import { Toast } from '@/Components/ui/toast';
import { SideNav } from '@/Components/SideNav';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { cn } from '@/Lib/utils';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  ChevronLeft,
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
  ArrowRight,
  ChevronRight,
  Calendar,
  ShieldCheck,
  FileDown,
  Link2,
  User,
  Sparkles,
  Loader2,
  Pencil,
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
  // AI Summary (cached)
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
  // lab_report
  test_name?: string;
  test_category?: string;
  results?: (LabResult | PftResult)[];
  lab_name?: string;
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

/* ─── Section Config ─── */

const SECTIONS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'details', label: 'Details', icon: ClipboardList },
  { id: 'patient', label: 'Patient', icon: User },
  { id: 'provider', label: 'Provider', icon: Stethoscope },
] as const;

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-card-title text-muted-foreground uppercase tracking-wide mb-3">{children}</h3>;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    normal:     { bg: 'hsl(var(--success) / 0.1)', text: 'hsl(var(--success))', label: 'Normal' },
    borderline: { bg: 'hsl(var(--warning) / 0.1)', text: 'hsl(var(--warning))', label: 'Borderline' },
    abnormal:   { bg: 'hsl(var(--destructive) / 0.1)', text: 'hsl(var(--destructive))', label: 'Abnormal' },
    high:       { bg: 'hsl(var(--destructive) / 0.1)', text: 'hsl(var(--destructive))', label: 'High' },
    low:        { bg: 'hsl(var(--warning) / 0.1)', text: 'hsl(var(--warning))', label: 'Low' },
    elevated:   { bg: 'hsl(var(--warning) / 0.1)', text: 'hsl(var(--warning))', label: 'Elevated' },
  };
  const c = colors[status] || { bg: 'hsl(var(--secondary))', text: 'hsl(var(--muted-foreground))', label: status };
  return (
    <span className="text-micro px-2 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ─── Side Navigation ─── */

function RecordSideNav({ hasProvider }: { hasProvider: boolean }) {
  const [activeSection, setActiveSection] = useState('summary');
  const isScrollingRef = useRef(false);

  // Filter out provider section if no provider info
  const visibleSections = hasProvider
    ? SECTIONS
    : SECTIONS.filter((s) => s.id !== 'provider');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Skip observer updates during programmatic scrolling
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

    visibleSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  const scrollTo = (id: string) => {
    isScrollingRef.current = true;
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Re-enable observer after scroll animation completes
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  };

  return (
    <SideNav
      items={visibleSections.map(s => ({ id: s.id, label: s.label, icon: s.icon }))}
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
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <DetailSection id={id} title={title} icon={icon} action={action} noPadding={noPadding}>
      {children}
    </DetailSection>
  );
}

function VitalsGrid({ vitals, statuses, painScore }: { vitals: Record<string, string>; statuses?: Record<string, string>; painScore?: string }) {
  const allItems = [
    ...Object.entries(vitals).map(([key, val]) => ({ key, val })),
    ...(painScore ? [{ key: 'pain_score', val: painScore }] : []),
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {allItems.map(({ key, val }) => {
        const status = statuses?.[key];
        return (
          <div key={key} className="rounded-lg border px-4 py-3">
            <p className="text-body text-muted-foreground uppercase mb-1">{key.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-2">
              <p className="text-subheading">{val}</p>
              {status && <StatusDot status={status.toLowerCase()} />}
            </div>
          </div>
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

function LinkedRecordsList({ records, onView }: { records: LinkedRecord[]; onView: (title: string) => void }) {
  return (
    <div className="space-y-2">
      {records.map((rec, i) => {
        const config = categoryConfig[rec.icon_type];
        return (
          <Button
            key={i}
            variant="ghost"
            className="flex items-center gap-3 w-full rounded-lg border px-4 py-3 h-auto text-left hover:bg-muted/50 transition-colors"
            onClick={() => onView(rec.title)}
          >
            {config ? (
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bg }}>
                <config.icon className="h-5 w-5" style={{ color: config.color }} />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
            )}
            <span className="text-label flex-1 truncate">{rec.title}</span>
            <Button variant="neutral" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
          </Button>
        );
      })}
    </div>
  );
}

function FindingsImpression({ findings, impression, impressionColor = 'hsl(var(--primary))', impressionBg = 'bg-primary/10' }: { findings?: string; impression?: string; impressionColor?: string; impressionBg?: string }) {
  return (
    <>
      {findings && (
        <div>
          <SectionTitle>Findings</SectionTitle>
          <p className="text-body leading-relaxed text-foreground">{findings}</p>
        </div>
      )}
      {impression && (
        <div>
          <SectionTitle>Impression</SectionTitle>
          <div className={cn('rounded-lg px-4 py-3', impressionBg)}>
            <p className="text-label" style={{ color: impressionColor }}>{impression}</p>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main Page Component ─── */

export default function Show({ user, record, familyMember }: Props) {
  const { formatDate } = useFormatPreferences();
  const [toastMessage, setToastMessage] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const toast = (msg: string) => setToastMessage(msg);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string | null>(record.metadata?.ai_summary || null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string | null>(
    record.metadata?.ai_summary_generated_at || null
  );

  const generateAiSummary = useCallback(async (regenerate = false) => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);

    try {
      const response = await fetch(`/health-records/${record.id}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ regenerate }),
      });

      const data = await response.json();

      if (data.success) {
        setAiSummary(data.summary);
        setSummaryGeneratedAt(data.generated_at);
        if (!data.cached) {
          toast('AI summary generated');
        }
      } else {
        setAiSummaryError(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      setAiSummaryError('Unable to connect to the AI service. Please try again.');
    } finally {
      setAiSummaryLoading(false);
    }
  }, [record.id]);

  // Auto-generate summary on page load if no cached summary exists
  useEffect(() => {
    if (!aiSummary && !aiSummaryLoading && !aiSummaryError) {
      generateAiSummary();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const config = categoryConfig[record.category] || { label: record.category, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--secondary))' };

  const handleDownload = () => {
    const pdfContent = generateHealthRecordPdfContent(record, aiSummary || undefined);

    downloadAsHtml(
      `${record.category}-${record.id}.pdf`,
      `<h1>${escapeHtml(record.title)}</h1>
       <p class="subtitle">${escapeHtml(record.record_date_formatted)} &middot; ${escapeHtml(config.label)}</p>
       ${record.description ? `<p>${escapeHtml(record.description)}</p>` : ''}
       ${pdfContent}`
    );
    toast('Record downloaded');
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  // Platform detection for health sync
  const getHealthSyncLabel = () => {
    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    if (isIOS) return 'Add to Apple Health';
    if (isAndroid) return 'Add to Google Fit';
    return 'Add to Health App';
  };

  const handleHealthSync = () => {
    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    if (isIOS) {
      toast('Opening Apple Health...');
      // In a native app, this would use HealthKit APIs
    } else if (isAndroid) {
      toast('Opening Google Fit...');
      // In a native app, this would use Google Fit APIs
    } else {
      toast('Health sync is available on mobile devices');
    }
  };

  const handleRequestAmendment = () => {
    toast('Amendment request submitted. You will be contacted within 48 hours.');
  };

  const hasProvider = !!(record.doctor_name || record.department_name);

  return (
    <AppLayout user={user} pageTitle="Health Records" pageIcon="/assets/icons/records.svg">
      <div className="w-full max-w-[960px] min-h-full flex flex-col pb-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/health-records"
            className="inline-flex items-center gap-1 text-body text-muted-foreground hover:text-foreground mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Health Records
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <CategoryIcon category={record.category} size="lg" />
              <div>
                <div className="flex items-center gap-3 mb-1">
                  {record.status && <StatusBadge status={record.status} />}
                  <Badge variant="info">
                    {config.label}
                  </Badge>
                </div>
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
              {record.file_type && (
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" iconOnly size="md">
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
                  {['lab_report', 'vitals', 'immunization'].includes(record.category) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleHealthSync}>
                        <HeartPulse className="h-4 w-4 mr-2" />
                        {getHealthSyncLabel()}
                      </DropdownMenuItem>
                    </>
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
        </div>

        {/* Main Content with Side Nav */}
        <div className="flex gap-24">
          <RecordSideNav hasProvider={hasProvider} />
          <div className="flex-1 min-w-0 space-y-12 pb-12">
            {/* Summary Section */}
            <Section id="summary" title="Summary" icon={FileText}>
              <div className="p-6 space-y-6">
                {record.description ? (
                  <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{record.description}</p>
                ) : (
                  <p className="text-body text-muted-foreground">No description available.</p>
                )}

                {/* AI Summary */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-card-title text-muted-foreground uppercase tracking-wide">AI Summary</span>
                  </div>

                  {aiSummaryLoading ? (
                    <Alert variant="info" hideIcon>
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span>Generating AI summary...</span>
                      </div>
                    </Alert>
                  ) : aiSummaryError ? (
                    <Alert variant="error">
                      <p className="mb-3">{aiSummaryError}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => generateAiSummary()}
                      >
                        Try Again
                      </Button>
                    </Alert>
                  ) : aiSummary ? (
                    <Alert variant="info" hideIcon>
                      <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{aiSummary}</p>
                      {summaryGeneratedAt && (
                        <p className="text-body text-muted-foreground mt-3">
                          Generated {new Date(summaryGeneratedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </Alert>
                  ) : (
                    <Alert variant="info" hideIcon>
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span>Generating AI summary...</span>
                      </div>
                    </Alert>
                  )}
                </div>

                <div className="border-t -mx-6 pt-4 px-6">
                  <SectionTitle>Record Information</SectionTitle>
                  <div className="divide-y -mx-6">
                    <DetailRow label="Record ID">#{record.id}</DetailRow>
                    <DetailRow label="Date">{formatDate(record.record_date)}</DetailRow>
                    <DetailRow label="Category">
                      <Badge variant="info">
                        {config.label}
                      </Badge>
                    </DetailRow>
                    {record.status && (
                      <DetailRow label="Status">
                        <StatusBadge status={record.status} />
                      </DetailRow>
                    )}
                    {record.file_type && (
                      <DetailRow label="File Type">
                        <span className="uppercase text-label text-muted-foreground">{record.file_type}</span>
                      </DetailRow>
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* Details Section (Category-specific content) */}
            <Section id="details" title="Details" icon={ClipboardList}>
              {record.metadata ? (
                <CategoryDetail
                  category={record.category}
                  meta={record.metadata}
                  onAction={toast}
                  record={record}
                  familyMember={familyMember}
                />
              ) : (
                <p className="p-6 text-body text-muted-foreground">No additional details available.</p>
              )}
            </Section>

            {/* Patient Section */}
            <Section id="patient" title="Patient" icon={User}>
              <div className="divide-y">
                <DetailRow label="Name">{familyMember ? familyMember.name : user.name}</DetailRow>
                {familyMember && (
                  <>
                    <DetailRow label="Relation">{familyMember.relation}</DetailRow>
                    {familyMember.age && <DetailRow label="Age">{familyMember.age} years</DetailRow>}
                    {familyMember.gender && <DetailRow label="Gender"><span className="capitalize">{familyMember.gender}</span></DetailRow>}
                    {familyMember.blood_group && <DetailRow label="Blood Group">{familyMember.blood_group}</DetailRow>}
                  </>
                )}
              </div>
            </Section>

            {/* Provider Section (only if provider info exists) */}
            {hasProvider && (
              <Section id="provider" title="Provider" icon={Stethoscope}>
                <div className="divide-y">
                  {record.doctor_name && <DetailRow label="Doctor">{record.doctor_name}</DetailRow>}
                  {record.department_name && <DetailRow label="Department">{record.department_name}</DetailRow>}
                </div>
              </Section>
            )}

          </div>
        </div>

      </div>

      <Toast show={!!toastMessage} message={toastMessage} onHide={() => setToastMessage('')} />

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

/* ─── Category Detail Router ─── */

function CategoryDetail({ category, meta, onAction, record, familyMember }: { category: string; meta: RecordMetadata; onAction: (msg: string) => void; record: HealthRecord; familyMember: FamilyMember | null }) {
  switch (category) {
    case 'consultation_notes': return <ConsultationDetail meta={meta} onAction={onAction} />;
    case 'prescription': return <PrescriptionDetail meta={meta} />;
    case 'lab_report': return <LabReportDetail meta={meta} />;
    case 'xray_report': return <XrayDetail meta={meta} />;
    case 'mri_report': return <MriDetail meta={meta} />;
    case 'ultrasound_report': return <UltrasoundDetail meta={meta} />;
    case 'ecg_report': return <EcgDetail meta={meta} />;
    case 'pathology_report': return <PathologyDetail meta={meta} />;
    case 'pft_report': return <PftDetail meta={meta} />;
    case 'other_report': return <OtherReportDetail meta={meta} />;
    case 'procedure_notes': return <ProcedureDetail meta={meta} onAction={onAction} />;
    case 'er_visit': return <ErVisitDetail meta={meta} onAction={onAction} />;
    case 'referral': return <ReferralDetail meta={meta} />;
    case 'discharge_summary': return <DischargeDetail meta={meta} onAction={onAction} />;
    case 'other_visit': return <OtherVisitDetail meta={meta} />;
    case 'medication_active': return <MedicationActiveDetail meta={meta} onAction={onAction} />;
    case 'medication_past': return <MedicationPastDetail meta={meta} onAction={onAction} />;
    case 'vaccination': return <VaccinationDetail meta={meta} onAction={onAction} familyMember={familyMember} />;
    case 'medical_certificate': return <MedicalCertificateDetail meta={meta} onAction={onAction} />;
    case 'invoice': return <InvoiceDetail meta={meta} />;
    default: return null;
  }
}

/* ─── Visit Detail Components ─── */

function ConsultationDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      {(meta.visit_type_label || meta.opd_number || meta.duration || meta.location) && (
        <div>
          <SectionTitle>Visit Details</SectionTitle>
          <div className="divide-y -mx-6">
            {(meta.visit_type_label || meta.opd_number) && (
              <DetailRow label="Visit Type">
                {meta.visit_type_label}{meta.opd_number ? ` | ${meta.opd_number}` : ''}
              </DetailRow>
            )}
            {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
            {meta.location && <DetailRow label="Location">{meta.location}</DetailRow>}
          </div>
        </div>
      )}

      {meta.vitals && Object.keys(meta.vitals).length > 0 && (
        <div>
          <SectionTitle>Vitals Recorded</SectionTitle>
          <VitalsGrid vitals={meta.vitals} statuses={meta.vitals_status} />
        </div>
      )}

      <div className="space-y-4">
        <SectionTitle>Clinical Summary</SectionTitle>
        {meta.chief_complaint && (
          <div>
            <p className="text-body text-muted-foreground uppercase mb-2">Chief Complaint</p>
            <Alert variant="info" hideIcon>{meta.chief_complaint}</Alert>
          </div>
        )}
        {meta.symptoms && meta.symptoms.length > 0 && (
          <div>
            <p className="text-body text-muted-foreground uppercase mb-2">Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {meta.symptoms.map((s, i) => <Badge key={i} variant="neutral">{s}</Badge>)}
            </div>
          </div>
        )}
        {meta.history_of_present_illness && (
          <div>
            <p className="text-body text-muted-foreground uppercase mb-2">History of Present Illness</p>
            <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.history_of_present_illness}</p>
          </div>
        )}
        {(meta.clinical_examination || meta.examination_findings) && (
          <div>
            <p className="text-body text-muted-foreground uppercase mb-2">Examination</p>
            <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.clinical_examination || meta.examination_findings}</p>
          </div>
        )}
        {meta.diagnosis && (
          <div>
            <p className="text-body text-muted-foreground uppercase mb-2">Diagnosis</p>
            <Alert variant="info" hideIcon>
              <p className="text-card-title" style={{ color: 'hsl(var(--foreground))' }}>{meta.diagnosis}</p>
              {meta.icd_code && <p className="text-body text-muted-foreground mt-1">ICD: {meta.icd_code}</p>}
            </Alert>
          </div>
        )}
      </div>

      {(meta.treatment_plan_steps?.length || meta.treatment_plan) && (
        <div>
          <SectionTitle>Treatment Plan</SectionTitle>
          {meta.treatment_plan_steps && meta.treatment_plan_steps.length > 0 ? (
            <NumberedList items={meta.treatment_plan_steps} />
          ) : meta.treatment_plan ? (
            <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.treatment_plan}</p>
          ) : null}
        </div>
      )}

      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}

      {(meta.follow_up_recommendation || meta.follow_up_date || meta.follow_up) && (
        <div>
          <SectionTitle>Follow-up</SectionTitle>
          <Alert variant="info">
            {(meta.follow_up_recommendation || meta.follow_up) && (
              <p className="text-body" style={{ color: 'hsl(var(--foreground))' }}>{meta.follow_up_recommendation || meta.follow_up}</p>
            )}
            {meta.follow_up_date && (
              <p className="text-body text-muted-foreground mt-1">Recommended: {fmtDate(meta.follow_up_date)}</p>
            )}
            <Button size="sm" variant="secondary" className="w-full mt-3" onClick={() => { window.location.href = '/booking'; }}>
              <Calendar className="h-4 w-4" />
              Book Follow-up Appointment
            </Button>
          </Alert>
        </div>
      )}
    </div>
  );
}

function ProcedureDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.procedure_name && <DetailRow label="Procedure">{meta.procedure_name}</DetailRow>}
        {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
        {meta.anesthesia && <DetailRow label="Anesthesia">{meta.anesthesia}</DetailRow>}
      </div>
      {meta.technique && (
        <div>
          <SectionTitle>Technique</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.technique}</p>
        </div>
      )}
      {meta.findings && (
        <div>
          <SectionTitle>Findings</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.findings}</p>
        </div>
      )}
      {meta.complications && (
        <div className="divide-y -mx-6">
          <DetailRow label="Complications">{meta.complications}</DetailRow>
        </div>
      )}
      {meta.post_op_instructions && (
        <div>
          <SectionTitle>Post-Procedure Instructions</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.post_op_instructions}</p>
        </div>
      )}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function ErVisitDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      {(meta.er_number || meta.arrival_time || meta.triage_level || meta.mode_of_arrival) && (
        <div>
          <SectionTitle>Visit Details</SectionTitle>
          <div className="divide-y -mx-6">
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
          </div>
        </div>
      )}

      {meta.chief_complaint && (
        <div>
          <SectionTitle>Chief Complaint</SectionTitle>
          <Alert variant="error" hideIcon>{meta.chief_complaint}</Alert>
        </div>
      )}

      {meta.vitals && Object.keys(meta.vitals).length > 0 && (
        <div>
          <SectionTitle>Vitals on Arrival</SectionTitle>
          <VitalsGrid vitals={meta.vitals} statuses={meta.vitals_status} painScore={meta.pain_score} />
        </div>
      )}

      {meta.examination && (
        <div>
          <SectionTitle>Examination</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.examination}</p>
        </div>
      )}

      {meta.investigations && meta.investigations.length > 0 && (
        <div>
          <SectionTitle>Investigations Done</SectionTitle>
          <div className="space-y-2">
            {meta.investigations.map((inv, i) => (
              <div key={i} className="flex items-start gap-3 text-body">
                <span className="h-2 w-2 rounded-full bg-muted-foreground flex-shrink-0 mt-2" />
                <div className="flex-1">
                  <span className="font-medium">{inv.name}</span>
                  <span className="text-muted-foreground"> — {inv.result}</span>
                </div>
                {inv.has_link && (
                  <Button variant="link" size="sm" className="h-auto p-0 text-body text-primary hover:underline flex-shrink-0" onClick={() => onAction(`Opening ${inv.name}...`)}>
                    View
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {meta.diagnosis && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <Alert variant="warning" hideIcon>{meta.diagnosis}</Alert>
        </div>
      )}

      {(meta.treatment_items?.length || meta.treatment_given) && (
        <div>
          <SectionTitle>Treatment Given in ER</SectionTitle>
          {meta.treatment_items && meta.treatment_items.length > 0 ? (
            <NumberedList items={meta.treatment_items} />
          ) : meta.treatment_given ? (
            <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.treatment_given}</p>
          ) : null}
        </div>
      )}

      {(meta.disposition || meta.disposition_detail) && (
        <div>
          <SectionTitle>Disposition</SectionTitle>
          {meta.disposition && <p className="text-label" style={{ color: 'hsl(var(--foreground))' }}>{meta.disposition}</p>}
          {meta.disposition_detail && <p className="text-body leading-relaxed text-muted-foreground mt-1">{meta.disposition_detail}</p>}
        </div>
      )}

      {meta.follow_up && (
        <div className="divide-y -mx-6">
          <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>
        </div>
      )}

      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function ReferralDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.referred_to_doctor && <DetailRow label="Referred To">{meta.referred_to_doctor}</DetailRow>}
        {meta.referred_to_department && <DetailRow label="Department">{meta.referred_to_department}</DetailRow>}
        {meta.priority && (
          <DetailRow label="Priority">
            <Badge variant={meta.priority === 'urgent' ? 'danger' : 'neutral'} className="capitalize">
              {meta.priority}
            </Badge>
          </DetailRow>
        )}
      </div>
      {meta.reason && (
        <div>
          <SectionTitle>Reason</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.reason}</p>
        </div>
      )}
    </div>
  );
}

function DischargeDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <SectionTitle>Admission Details</SectionTitle>
        <div className="divide-y -mx-6">
          {meta.admission_date && <DetailRow label="Admission Date">{fmtDate(meta.admission_date)}</DetailRow>}
          {meta.discharge_date && <DetailRow label="Discharge Date">{fmtDate(meta.discharge_date)}</DetailRow>}
          {meta.length_of_stay && <DetailRow label="Length of Stay">{meta.length_of_stay}</DetailRow>}
          {meta.treating_doctor && <DetailRow label="Treating Doctor">{meta.treating_doctor}</DetailRow>}
          {meta.room_info && <DetailRow label="Room">{meta.room_info}</DetailRow>}
          {meta.ipd_number && <DetailRow label="IPD Number">{meta.ipd_number}</DetailRow>}
        </div>
      </div>

      {(meta.primary_diagnosis || meta.diagnosis || meta.secondary_diagnosis || meta.procedure_performed) && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <div className="space-y-3">
            {(meta.primary_diagnosis || meta.diagnosis) && (
              <Alert variant="info" hideIcon>
                <p className="text-body text-muted-foreground uppercase mb-1">Primary</p>
                <p className="text-card-title" style={{ color: 'hsl(var(--foreground))' }}>{meta.primary_diagnosis || meta.diagnosis}</p>
              </Alert>
            )}
            {meta.secondary_diagnosis && (
              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-body text-muted-foreground uppercase mb-1">Secondary</p>
                <p className="text-body" style={{ color: 'hsl(var(--foreground))' }}>{meta.secondary_diagnosis}</p>
              </div>
            )}
            {meta.procedure_performed && (
              <div className="-mx-6">
                <DetailRow label="Procedure">{meta.procedure_performed}</DetailRow>
              </div>
            )}
          </div>
        </div>
      )}

      {meta.hospital_course && (
        <div>
          <SectionTitle>Hospital Course</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.hospital_course}</p>
        </div>
      )}

      {meta.vitals_at_discharge && Object.keys(meta.vitals_at_discharge).length > 0 && (
        <div>
          <SectionTitle>Vitals at Discharge</SectionTitle>
          <VitalsGrid vitals={meta.vitals_at_discharge} />
        </div>
      )}

      {meta.procedures && meta.procedures.length > 0 && (
        <div>
          <SectionTitle>Procedures</SectionTitle>
          <ul className="space-y-2">
            {meta.procedures.map((p, i) => (
              <li key={i} className="text-body flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground flex-shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {meta.discharge_medications && meta.discharge_medications.length > 0 && (
        <div>
          <SectionTitle>Discharge Prescriptions</SectionTitle>
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
      )}

      {(meta.discharge_dos?.length || meta.discharge_donts?.length || meta.discharge_instructions) && (
        <div>
          <SectionTitle>Discharge Instructions</SectionTitle>
          {meta.discharge_dos && meta.discharge_dos.length > 0 && (
            <div className="mb-4">
              <NumberedList items={meta.discharge_dos} variant="check" />
            </div>
          )}
          {meta.discharge_donts && meta.discharge_donts.length > 0 && (
            <NumberedList items={meta.discharge_donts} variant="x" />
          )}
          {!meta.discharge_dos?.length && !meta.discharge_donts?.length && meta.discharge_instructions && (
            <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.discharge_instructions}</p>
          )}
        </div>
      )}

      {meta.warning_signs && meta.warning_signs.length > 0 && (
        <div>
          <SectionTitle>Warning Signs — Contact Immediately If</SectionTitle>
          <Alert variant="error" title="Warning Signs">
            <NumberedList items={meta.warning_signs} variant="warning" />
            {meta.emergency_contact && (
              <div className="flex items-center gap-2 pt-3 border-t border-red-200">
                <Phone className="h-4 w-4 text-destructive" />
                <span className="text-label text-destructive">{meta.emergency_contact}</span>
              </div>
            )}
          </Alert>
        </div>
      )}

      {meta.follow_up_schedule && meta.follow_up_schedule.length > 0 && (
        <div>
          <SectionTitle>Follow-up Schedule</SectionTitle>
          <div className="space-y-3">
            {meta.follow_up_schedule.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3">
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
        </div>
      )}

      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function OtherVisitDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      {meta.visit_type && (
        <div className="divide-y -mx-6">
          <DetailRow label="Visit Type">{meta.visit_type}</DetailRow>
        </div>
      )}
      {meta.notes && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.notes}</p>
        </div>
      )}
      {meta.follow_up && (
        <div className="divide-y -mx-6">
          <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>
        </div>
      )}
    </div>
  );
}

/* ─── Report Detail Components ─── */

function LabReportDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      {meta.test_name && (
        <div className="flex items-center gap-3 flex-wrap">
          {meta.test_category && <Badge variant="neutral">{meta.test_category}</Badge>}
          {meta.lab_name && <span className="text-body text-muted-foreground">{meta.lab_name}</span>}
        </div>
      )}
      {meta.results && meta.results.length > 0 && (
        <div>
          <SectionTitle>Results</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-body">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Parameter</th>
                  <th className="text-left px-4 py-3 font-medium">Value</th>
                  <th className="text-left px-4 py-3 font-medium">Reference</th>
                  <th className="text-center px-4 py-3 font-medium w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(meta.results as LabResult[]).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.parameter}</td>
                    <td className="px-4 py-3">{r.value} {r.unit}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.reference_range}</td>
                    <td className="px-4 py-3 text-center"><StatusDot status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function XrayDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
        {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
        {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
        {meta.radiologist && <DetailRow label="Radiologist">{meta.radiologist}</DetailRow>}
      </div>
      <FindingsImpression findings={meta.findings} impression={meta.impression} />
    </div>
  );
}

function MriDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
        {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
        {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
        {meta.contrast && <DetailRow label="Contrast">{meta.contrast}</DetailRow>}
        {meta.sequences && <DetailRow label="Sequences">{meta.sequences}</DetailRow>}
        {meta.radiologist && <DetailRow label="Radiologist">{meta.radiologist}</DetailRow>}
      </div>
      <FindingsImpression findings={meta.findings} impression={meta.impression} impressionColor="hsl(var(--primary))" impressionBg="bg-primary/10" />
    </div>
  );
}

function UltrasoundDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
        {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
        {meta.sonographer && <DetailRow label="Sonographer">{meta.sonographer}</DetailRow>}
      </div>
      <FindingsImpression findings={meta.findings} impression={meta.impression} impressionColor="hsl(var(--primary))" impressionBg="bg-primary/10" />
    </div>
  );
}

function EcgDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
        {meta.heart_rate && <DetailRow label="Heart Rate">{meta.heart_rate} bpm</DetailRow>}
        {meta.rhythm && <DetailRow label="Rhythm">{meta.rhythm}</DetailRow>}
        {meta.axis && <DetailRow label="Axis">{meta.axis}</DetailRow>}
      </div>
      {meta.intervals && (
        <div>
          <SectionTitle>Intervals</SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {meta.intervals.pr && (
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-body text-muted-foreground mb-1">PR</p>
                <p className="text-base font-semibold">{meta.intervals.pr}</p>
              </div>
            )}
            {meta.intervals.qrs && (
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-body text-muted-foreground mb-1">QRS</p>
                <p className="text-base font-semibold">{meta.intervals.qrs}</p>
              </div>
            )}
            {meta.intervals.qt && (
              <div className="rounded-lg border px-4 py-3 text-center">
                <p className="text-body text-muted-foreground mb-1">QT</p>
                <p className="text-base font-semibold">{meta.intervals.qt}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <FindingsImpression findings={meta.findings} impression={meta.impression} impressionColor="hsl(var(--destructive))" impressionBg="bg-destructive/10" />
    </div>
  );
}

function PathologyDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.specimen_type && <DetailRow label="Specimen">{meta.specimen_type}</DetailRow>}
        {meta.pathologist && <DetailRow label="Pathologist">{meta.pathologist}</DetailRow>}
      </div>
      {meta.gross_description && (
        <div>
          <SectionTitle>Gross Description</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.gross_description}</p>
        </div>
      )}
      {meta.microscopic_findings && (
        <div>
          <SectionTitle>Microscopic Findings</SectionTitle>
          <p className="text-body leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>{meta.microscopic_findings}</p>
        </div>
      )}
      {meta.diagnosis && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <Alert variant="warning" hideIcon>
            <p className="text-card-title" style={{ color: 'hsl(var(--foreground))' }}>{meta.diagnosis}</p>
            {meta.grade && <p className="text-body text-muted-foreground mt-1">Grade: {meta.grade}</p>}
          </Alert>
        </div>
      )}
    </div>
  );
}

function PftDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      </div>
      {meta.results && meta.results.length > 0 && (
        <div>
          <SectionTitle>Results</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-body">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Parameter</th>
                  <th className="text-right px-4 py-3 font-medium">Actual</th>
                  <th className="text-right px-4 py-3 font-medium">Predicted</th>
                  <th className="text-right px-4 py-3 font-medium">%</th>
                  <th className="text-center px-4 py-3 font-medium w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(meta.results as PftResult[]).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.parameter}</td>
                    <td className="px-4 py-3 text-right">{r.value}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{r.predicted}</td>
                    <td className="px-4 py-3 text-right">{r.percent_predicted}%</td>
                    <td className="px-4 py-3 text-center"><StatusDot status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {meta.interpretation && (
        <div>
          <SectionTitle>Interpretation</SectionTitle>
          <Alert variant="info" hideIcon>{meta.interpretation}</Alert>
        </div>
      )}
    </div>
  );
}

function OtherReportDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.report_type && <DetailRow label="Report Type">{meta.report_type}</DetailRow>}
      </div>
      <FindingsImpression findings={meta.findings} impression={meta.impression} />
    </div>
  );
}

/* ─── Medication Detail Components ─── */

function PrescriptionDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      {meta.drugs && meta.drugs.length > 0 && (
        <div>
          <SectionTitle>Prescriptions</SectionTitle>
          <div className="space-y-4">
            {meta.drugs.map((drug, i) => (
              <div key={i} className="rounded-lg border p-4">
                <p className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{drug.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <p className="text-body text-muted-foreground">Dosage: <span className="text-foreground">{drug.dosage}</span></p>
                  <p className="text-body text-muted-foreground">Frequency: <span className="text-foreground">{drug.frequency}</span></p>
                  <p className="text-body text-muted-foreground">Duration: <span className="text-foreground">{drug.duration}</span></p>
                </div>
                {drug.instructions && <p className="text-body text-muted-foreground mt-2 italic">{drug.instructions}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {meta.valid_until && (
        <p className="text-label text-muted-foreground">Valid until: <span className="text-foreground">{fmtDate(meta.valid_until)}</span></p>
      )}
    </div>
  );
}

function MedicationActiveDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="p-6 space-y-6">
      {meta.drug_name && (
        <Alert variant="success" hideIcon>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <p className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{meta.drug_name}</p>
          </div>
        </Alert>
      )}

      {(meta.dosage || meta.frequency || meta.timing || meta.medication_duration || meta.route) && (
        <div>
          <SectionTitle>Dosage Instructions</SectionTitle>
          <div className="divide-y -mx-6">
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
          </div>
        </div>
      )}

      {(meta.condition || meta.how_it_works) && (
        <div>
          <SectionTitle>Purpose</SectionTitle>
          {meta.condition && <p className="text-label mb-2" style={{ color: 'hsl(var(--foreground))' }}>{meta.condition}</p>}
          {meta.how_it_works && <p className="text-body leading-relaxed text-muted-foreground">{meta.how_it_works}</p>}
        </div>
      )}

      {(meta.prescribing_doctor || meta.start_date || meta.original_quantity != null) && (
        <div>
          <SectionTitle>Prescription Details</SectionTitle>
          <div className="divide-y -mx-6">
            {meta.prescribing_doctor && <DetailRow label="Prescribed By">{meta.prescribing_doctor}</DetailRow>}
            {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
            {meta.original_quantity != null && <DetailRow label="Qty Dispensed">{meta.original_quantity} tablets</DetailRow>}
          </div>
        </div>
      )}

      {meta.side_effects && meta.side_effects.length > 0 && (
        <div>
          <SectionTitle>Common Side Effects</SectionTitle>
          <ul className="space-y-2">
            {meta.side_effects.map((se, i) => (
              <li key={i} className="text-body flex items-start gap-3 leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                <span className="h-2 w-2 rounded-full bg-muted-foreground flex-shrink-0 mt-1.5" />
                {se}
              </li>
            ))}
          </ul>
          {meta.side_effects_warning && (
            <div className="mt-3">
              <Alert variant="warning">{meta.side_effects_warning}</Alert>
            </div>
          )}
        </div>
      )}

      {meta.adherence_this_week && meta.adherence_this_week.length > 0 && (
        <div>
          <SectionTitle>Adherence This Week</SectionTitle>
          <div className="flex items-center gap-2 mb-3">
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
            <div className="flex items-center gap-3 mb-4">
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
      )}

      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Related Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function MedicationPastDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      {meta.drug_name && (
        <div className="rounded-lg bg-muted border border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            <p className="text-base font-semibold text-muted-foreground">{meta.drug_name}</p>
          </div>
        </div>
      )}

      {(meta.dosage || meta.frequency || meta.timing || meta.medication_duration || meta.route) && (
        <div>
          <SectionTitle>Dosage Instructions</SectionTitle>
          <div className="divide-y -mx-6">
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
          </div>
        </div>
      )}

      {(meta.condition || meta.how_it_works) && (
        <div>
          <SectionTitle>Purpose</SectionTitle>
          {meta.condition && <p className="text-label mb-2" style={{ color: 'hsl(var(--foreground))' }}>{meta.condition}</p>}
          {meta.how_it_works && <p className="text-body leading-relaxed text-muted-foreground">{meta.how_it_works}</p>}
        </div>
      )}

      {(meta.prescribing_doctor || meta.start_date || meta.end_date || meta.original_quantity != null) && (
        <div>
          <SectionTitle>Prescription Details</SectionTitle>
          <div className="divide-y -mx-6">
            {meta.prescribing_doctor && <DetailRow label="Prescribed By">{meta.prescribing_doctor}</DetailRow>}
            {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
            {meta.end_date && <DetailRow label="Ended">{fmtDate(meta.end_date)}</DetailRow>}
            {meta.original_quantity != null && <DetailRow label="Qty Dispensed">{meta.original_quantity} tablets</DetailRow>}
          </div>
        </div>
      )}

      {meta.reason_stopped && (
        <div>
          <SectionTitle>Reason Stopped</SectionTitle>
          <Alert variant="warning" hideIcon>{meta.reason_stopped}</Alert>
        </div>
      )}

      {meta.side_effects && meta.side_effects.length > 0 && (
        <div>
          <SectionTitle>Common Side Effects</SectionTitle>
          <ul className="space-y-2">
            {meta.side_effects.map((se, i) => (
              <li key={i} className="text-body flex items-start gap-3 leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
                <span className="h-2 w-2 rounded-full bg-muted-foreground flex-shrink-0 mt-1.5" />
                {se}
              </li>
            ))}
          </ul>
          {meta.side_effects_warning && (
            <div className="mt-3">
              <Alert variant="warning">{meta.side_effects_warning}</Alert>
            </div>
          )}
        </div>
      )}

      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Related Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

/* ─── Document Detail Components ─── */

function VaccinationDetail({ meta, onAction, familyMember }: { meta: RecordMetadata; onAction: (msg: string) => void; familyMember: FamilyMember | null }) {
  return (
    <div className="p-6 space-y-6">
      {meta.vaccine_name && (
        <Alert variant="success" hideIcon>
          <p className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{meta.vaccine_name}</p>
        </Alert>
      )}

      {familyMember && (
        <div>
          <SectionTitle>Patient Details</SectionTitle>
          <div className="divide-y -mx-6">
            <DetailRow label="Name">{familyMember.name}</DetailRow>
            {familyMember.age && <DetailRow label="Age">{familyMember.age} years</DetailRow>}
            {familyMember.gender && <DetailRow label="Gender"><span className="capitalize">{familyMember.gender}</span></DetailRow>}
            {familyMember.blood_group && <DetailRow label="Blood Group">{familyMember.blood_group}</DetailRow>}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>Administration Details</SectionTitle>
        {meta.dose_number != null && meta.total_doses != null && (
          <div className="mb-3">
            <div className="-mx-6">
              <DetailRow label="Dose">
                {meta.dose_number} of {meta.total_doses}
              </DetailRow>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(meta.dose_number / meta.total_doses) * 100}%` }} />
            </div>
          </div>
        )}
        <div className="divide-y -mx-6">
          {meta.batch_number && <DetailRow label="Batch Number">{meta.batch_number}</DetailRow>}
          {meta.administered_by && <DetailRow label="Administered By">{meta.administered_by}</DetailRow>}
          {meta.site && <DetailRow label="Injection Site">{meta.site}</DetailRow>}
          {meta.next_due_date && <DetailRow label="Next Due">{fmtDate(meta.next_due_date)}</DetailRow>}
        </div>
        {meta.next_due_date === null && meta.dose_number === meta.total_doses && (
          <div className="mt-3">
            <Alert variant="success" hideIcon>Vaccination course complete</Alert>
          </div>
        )}
      </div>

      {meta.vaccination_history && meta.vaccination_history.length > 0 && (
        <div>
          <SectionTitle>Vaccination History</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-body">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Vaccine</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Dose</th>
                </tr>
              </thead>
              <tbody>
                {meta.vaccination_history.map((entry, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{entry.vaccine_name}</div>
                      <div className="text-muted-foreground text-body">{entry.site}</div>
                    </td>
                    <td className="px-4 py-3">{fmtDate(entry.date)}</td>
                    <td className="px-4 py-3">{entry.dose_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta.upcoming_vaccinations && meta.upcoming_vaccinations.length > 0 && (
        <div>
          <SectionTitle>Upcoming Vaccinations</SectionTitle>
          <div className="space-y-3">
            {meta.upcoming_vaccinations.map((vac, i) => (
              <div key={i} className="rounded-lg border px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label">{vac.vaccine_name}</p>
                    <p className="text-body text-muted-foreground">{vac.dose_label} · Due {fmtDate(vac.due_date)}</p>
                  </div>
                  <Button variant="secondary" size="sm" className="gap-2" onClick={() => onAction(`Scheduling ${vac.vaccine_name}...`)}>
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meta.attached_certificates && meta.attached_certificates.length > 0 && (
        <div>
          <SectionTitle>Attached Certificates</SectionTitle>
          <div className="space-y-2">
            {meta.attached_certificates.map((file, i) => (
              <div key={i} className="flex items-center gap-4 rounded-lg border px-4 py-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <FileDown className="h-5 w-5 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label truncate">{file.name}</p>
                  <p className="text-body text-muted-foreground uppercase">{file.type}{file.size ? ` · ${file.size}` : ''}</p>
                </div>
                <Button variant="ghost" iconOnly size="md" onClick={() => onAction(`Downloading ${file.name}...`)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedicalCertificateDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="p-6 space-y-6">
      {meta.certificate_type && (
        <Alert variant="info" hideIcon>
          <p className="text-base font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{meta.certificate_type}</p>
        </Alert>
      )}

      <div>
        <SectionTitle>Certificate Details</SectionTitle>
        <div className="divide-y -mx-6">
          {meta.certificate_number && <DetailRow label="Certificate No.">{meta.certificate_number}</DetailRow>}
          {meta.issued_for && <DetailRow label="Issued For">{meta.issued_for}</DetailRow>}
          {meta.issued_by && <DetailRow label="Issued By">{meta.issued_by}</DetailRow>}
          {meta.valid_from && <DetailRow label="Valid From">{fmtDate(meta.valid_from)}</DetailRow>}
          {meta.valid_until && <DetailRow label="Valid Until">{fmtDate(meta.valid_until)}</DetailRow>}
        </div>
      </div>

      {(meta.certificate_content || meta.notes) && (
        <div>
          <SectionTitle>Certificate Content</SectionTitle>
          <p className="text-body leading-relaxed mb-3" style={{ color: 'hsl(var(--foreground))' }}>{meta.certificate_content || meta.notes}</p>
          {meta.examination_findings_list && meta.examination_findings_list.length > 0 && (
            <div className="mt-3">
              <p className="text-label text-muted-foreground mb-2">Examination Findings</p>
              <NumberedList items={meta.examination_findings_list} variant="check" />
            </div>
          )}
        </div>
      )}

      {(meta.digitally_signed != null || meta.verification_url) && (
        <div>
          <SectionTitle>Verification</SectionTitle>
          <div className="rounded-lg border px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
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
            </div>
            {meta.verification_url && (
              <p className="text-body text-muted-foreground">
                Verify at:{' '}
                <Button variant="link" size="sm" className="h-auto p-0 text-primary hover:underline" onClick={() => onAction(`Verification URL: ${meta.verification_url}`)}>
                  {meta.verification_url}
                </Button>
              </p>
            )}
          </div>
        </div>
      )}

      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function InvoiceDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="p-6 space-y-6">
      <div className="divide-y -mx-6">
        {meta.invoice_number && <DetailRow label="Invoice">{meta.invoice_number}</DetailRow>}
        {meta.amount != null && (
          <DetailRow label="Amount"><span className="text-lg font-bold">₹{meta.amount.toLocaleString()}</span></DetailRow>
        )}
        {meta.payment_status && (
          <DetailRow label="Status">
            <Badge variant={meta.payment_status === 'paid' ? 'success' : meta.payment_status === 'pending' ? 'warning' : meta.payment_status === 'due' ? 'danger' : 'neutral'} className="capitalize">
              {meta.payment_status}
            </Badge>
          </DetailRow>
        )}
      </div>
      {meta.line_items && meta.line_items.length > 0 && (
        <div>
          <SectionTitle>Line Items</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-body">
              <thead><tr className="bg-muted/50"><th className="text-left px-4 py-3 font-medium">Item</th><th className="text-right px-4 py-3 font-medium w-[100px]">Amount</th></tr></thead>
              <tbody>
                {meta.line_items.map((item, i) => (
                  <tr key={i} className="border-t"><td className="px-4 py-3">{item.label}</td><td className="px-4 py-3 text-right font-medium">₹{item.amount.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
