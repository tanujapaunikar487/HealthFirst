import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Alert } from '@/Components/ui/alert';
import { Card } from '@/Components/ui/card';
import { DetailRow } from '@/Components/ui/detail-row';
import { DetailSection } from '@/Components/ui/detail-section';
import { SideNav } from '@/Components/SideNav';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { cn } from '@/Lib/utils';
import { downloadAsHtml, downloadFile, downloadAsZip } from '@/Lib/download';
import { FollowUpSheet, BookAgainSheet, Appointment as AppointmentBase } from '@/Components/Appointments/AppointmentSheets';
import { ShareDialog } from '@/Components/ui/share-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  ChevronRight,
  Download,
  Share2,
  Stethoscope,
  TestTube2,
  Star,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  FolderOpen,
  Activity,
  Heart,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  MoreVertical,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { EmptyState } from '@/Components/ui/empty-state';
import { Pulse } from '@/Components/ui/skeleton';

/* ─── Types ─── */

interface Vital {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'elevated' | 'low';
  reference: string;
}

interface Diagnosis {
  name: string;
  icd_code: string;
  severity: string;
}

interface ClinicalSummary {
  diagnosis: Diagnosis;
  chief_complaint: string;
  history_of_present_illness: string;
  past_medical_history: string;
  family_history: string;
  allergies: string[];
  social_history: string;
  examination_findings: string;
  assessment: string;
  treatment_plan: string;
}

interface Prescription {
  drug: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  purpose: string;
  status: 'active' | 'completed';
}

interface LabTest {
  name: string;
  status: 'completed' | 'pending';
  is_normal: boolean | null;
  health_record_id: number | null;
}

interface BillingLineItem {
  label: string;
  amount: number;
}

interface Billing {
  line_items: BillingLineItem[];
  total: number;
  payment_method: string;
  payment_status: string;
  invoice_number: string;
  payment_date: string;
}

interface AppDocument {
  name: string;
  type: string;
  date: string;
  size: string;
}

interface ActivityItem {
  event: string;
  timestamp: string;
  icon: string;
}

interface FollowUp {
  recommended_date: string;
  recommended_date_formatted: string;
  notes: string;
}

interface DoctorDetail {
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  rating: number;
  bio: string;
  avatar_url: string | null;
}

interface PatientDetail {
  name: string;
  relation: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
}

interface DetailedAppointment {
  id: number;
  appointment_id: string;
  type: string;
  title: string;
  subtitle: string;
  patient_name: string;
  patient_id: number | null;
  doctor_id: number | null;
  date: string;
  date_formatted: string;
  time: string;
  status: string;
  fee: number;
  payment_status: string;
  mode: string;
  is_upcoming: boolean;
  doctor: DoctorDetail | null;
  patient: PatientDetail | null;
  department: string | null;
  duration: string;
  notes: string | null;
  symptoms: string[];
  vitals: Vital[];
  clinical_summary: ClinicalSummary;
  prescriptions: Prescription[];
  lab_tests: LabTest[];
  billing: Billing;
  documents: AppDocument[];
  activity: ActivityItem[];
  follow_up: FollowUp;
  insurance_claim_id?: number | null;
}

interface Props {
  user: { id: string; name: string; email: string; avatar_url?: string };
  appointment: DetailedAppointment;
}

/* ─── Section IDs ─── */

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: Stethoscope },
  { id: 'vitals', label: 'Vitals', icon: Heart },
  { id: 'clinical', label: 'Clinical Summary', icon: FileText },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'lab-tests', label: 'Lab Tests', icon: FlaskConical },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const;

/* ─── Main Page ─── */

export default function Show({ user, appointment }: Props) {
  const [toastMessage, setToastMessage] = useState('');
  const [showFollowUpSheet, setShowFollowUpSheet] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showBookAgainSheet, setShowBookAgainSheet] = useState(false);
  const isPastAppointment = !appointment.is_upcoming && appointment.status === 'completed';

  // Guard: if appointment data is missing, show skeleton
  if (!appointment?.id) {
    return (
      <AppLayout user={user} pageTitle="Appointment Details" pageIcon="/assets/icons/appointment.svg">
        <div className="w-full max-w-[960px]">
          <SkeletonPage />
        </div>
      </AppLayout>
    );
  }

  const isDoctor = appointment.type === 'doctor';

  const handleDownloadInvoice = () => {
    const b = appointment.billing;
    const itemRows = b.line_items.map((i) =>
      `<div class="row"><span class="row-label">${i.label}</span><span class="row-value">₹${Math.abs(i.amount).toLocaleString()}</span></div>`
    ).join('');
    downloadAsHtml(`invoice-${b.invoice_number}.pdf`, `
      <h1>Invoice</h1>
      <p class="subtitle">${b.invoice_number} &middot; ${b.payment_date}</p>
      <div class="section">
        <h3>From</h3>
        <p>HealthFirst Hospital<br/>123 Hospital Road, Pune 411001<br/>GSTIN: 27AABCH1234P1ZP</p>
      </div>
      <h2>Charges</h2>
      ${itemRows}
      <div class="total-row row"><span class="row-label" style="font-weight:600">Total</span><span class="row-value" style="font-weight:700;font-size:15px">₹${b.total.toLocaleString()}</span></div>
      <h2>Payment</h2>
      <div class="row"><span class="row-label">Method</span><span class="row-value">${b.payment_method}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value">${b.payment_status}</span></div>
    `);
  };

  return (
    <AppLayout user={user} pageTitle="Appointment Details" pageIcon="/assets/icons/appointment.svg">
      <div className="w-full max-w-[960px] min-h-full flex flex-col pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-body text-muted-foreground mb-4">
          <Link href="/appointments" className="hover:text-foreground transition-colors">
            Appointments
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{appointment.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            {isDoctor && appointment.doctor ? (
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={appointment.doctor.avatar_url || undefined} alt={appointment.doctor.name} />
                <AvatarFallback className="bg-warning text-warning-foreground text-label">
                  {appointment.doctor.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-12 w-12 rounded-full bg-info-subtle flex items-center justify-center flex-shrink-0">
                <Icon icon={TestTube2} className="h-6 w-6 text-info-subtle-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="neutral">
                  {isDoctor ? 'Doctor' : 'Lab Test'}
                </Badge>
                <Badge variant="neutral">
                  {appointment.mode}
                </Badge>
                <span className="text-body text-muted-foreground font-mono">
                  #{appointment.appointment_id}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
                {appointment.title}
              </h1>
              {appointment.subtitle && (
                <p className="text-muted-foreground mt-1">{appointment.subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Past appointments: Book Again + menu with Share */}
            {isPastAppointment ? (
              <>
                <Button onClick={() => setShowBookAgainSheet(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Book Again
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" iconOnly size="lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[140px]">
                    <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Upcoming: Only show header button if NO follow-up recommendation */}
                {appointment.type === 'doctor' && !appointment.follow_up && (
                  <Button onClick={() => setShowFollowUpSheet(true)}>
                    Book Follow-up
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" iconOnly size="lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[140px]">
                    <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Follow-up Alert - moved from footer */}
        {appointment.follow_up && appointment.type === 'doctor' && (
          <div className="mb-8">
            <Alert variant="info" title="Follow-up Recommended">
              <p className="text-body text-muted-foreground">
                {appointment.follow_up.recommended_date_formatted}
              </p>
              <p className="text-body text-muted-foreground mt-2 leading-relaxed">
                {appointment.follow_up.notes}
              </p>
              <Button size="md" variant="secondary" className="mt-3" onClick={() => setShowFollowUpSheet(true)}>
                Schedule
              </Button>
            </Alert>
          </div>
        )}

        {/* Main content: Side nav + sections */}
        <div className="flex gap-24">
          <AppointmentSideNav />
          <div className="flex-1 min-w-0 space-y-12">
            <OverviewSection appointment={appointment} />
            {(appointment.vitals?.length ?? 0) > 0
              ? <VitalsSection vitals={appointment.vitals} />
              : <Section id="vitals" title="Vitals" icon={Heart}>
                  <div className="px-6 py-6 text-center">
                    <p className="text-label text-muted-foreground">No vitals recorded for this appointment</p>
                    <p className="text-body text-muted-foreground mt-0.5">Vitals will be recorded during your appointment.</p>
                  </div>
                </Section>
            }
            {appointment.clinical_summary
              ? <ClinicalSummarySection summary={appointment.clinical_summary} />
              : <Section id="clinical" title="Clinical Summary" icon={FileText}><EmptyState icon={FileText} message="No clinical summary available" description="Your doctor will add clinical notes after the consultation." /></Section>
            }
            {(appointment.prescriptions?.length ?? 0) > 0
              ? <PrescriptionsSection prescriptions={appointment.prescriptions} appointmentId={appointment.appointment_id} appointmentTitle={appointment.title} appointmentDate={appointment.date_formatted} appointmentTime={appointment.time} />
              : <Section id="prescriptions" title="Prescriptions" icon={Pill}>
                  <div className="px-6 py-6 text-center">
                    <p className="text-label text-muted-foreground">No prescriptions for this appointment</p>
                    <p className="text-body text-muted-foreground mt-0.5">Prescriptions will appear here if prescribed by your doctor.</p>
                  </div>
                </Section>
            }
            <LabTestsSection tests={appointment.lab_tests ?? []} />
            {appointment.billing && (
              <BillingSection billing={appointment.billing} appointmentId={appointment.id} insuranceClaimId={appointment.insurance_claim_id} onDownloadInvoice={handleDownloadInvoice} />
            )}
            <DocumentsSection documents={appointment.documents ?? []} />
            <ActivitySection activity={appointment.activity ?? []} />
            <FooterActions appointment={appointment} />
          </div>
        </div>

      </div>

      {/* Follow-up Sheet */}
      <Sheet open={showFollowUpSheet} onOpenChange={setShowFollowUpSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <FollowUpSheet
            appointment={{
              id: appointment.id,
              type: appointment.type as 'doctor' | 'lab_test',
              title: appointment.title,
              subtitle: appointment.subtitle,
              patient_name: appointment.patient_name,
              patient_id: appointment.patient_id,
              doctor_id: appointment.doctor_id,
              date: appointment.date,
              date_formatted: appointment.date_formatted,
              time: appointment.time,
              status: appointment.status,
              fee: appointment.fee,
              payment_status: appointment.payment_status,
              mode: appointment.mode,
              is_upcoming: appointment.is_upcoming,
            } as AppointmentBase}
            onSuccess={() => {
              setShowFollowUpSheet(false);
              setToastMessage('Follow-up appointment booked successfully!');
              router.reload();
            }}
            onError={(msg) => setToastMessage(msg)}
          />
        </SheetContent>
      </Sheet>

      {/* Book Again Sheet */}
      <Sheet open={showBookAgainSheet} onOpenChange={setShowBookAgainSheet}>
        <SheetContent side="right" className="sm:max-w-lg">
          <BookAgainSheet
            appointment={{
              id: appointment.id,
              type: appointment.type as 'doctor' | 'lab_test',
              title: appointment.title,
              subtitle: appointment.subtitle,
              patient_name: appointment.patient_name,
              patient_id: appointment.patient_id,
              doctor_id: appointment.doctor_id,
              date: appointment.date,
              date_formatted: appointment.date_formatted,
              time: appointment.time,
              status: appointment.status,
              fee: appointment.fee,
              payment_status: appointment.payment_status,
              mode: appointment.mode,
              is_upcoming: appointment.is_upcoming,
            } as AppointmentBase}
            onSuccess={() => {
              setShowBookAgainSheet(false);
              setToastMessage('Appointment booked successfully!');
              router.visit('/appointments');
            }}
            onError={(msg) => setToastMessage(msg)}
          />
        </SheetContent>
      </Sheet>

      {/* Share Sheet */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={appointment.title}
        description={`${appointment.date_formatted} at ${appointment.time}`}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} show={!!toastMessage} onHide={() => setToastMessage('')} duration={2500} />
      )}

    </AppLayout>
  );
}

/* ─── Skeleton Loading State ─── */

function SkeletonPage() {
  return (
    <div className="space-y-12">
      {/* Header skeleton */}
      <div>
        <Pulse className="h-4 w-48 mb-4" />
        <div className="flex items-center gap-2 mb-3">
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-5 w-20 rounded-full" />
        </div>
        <Pulse className="h-8 w-72 mb-2" />
        <Pulse className="h-4 w-40" />
      </div>
      {/* Section skeletons */}
      <div className="flex gap-8">
        <div className="min-w-[200px] flex-shrink-0 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Pulse key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Pulse className="h-6 w-32 mb-5" />
              <div className="grid grid-cols-2 gap-4">
                <Pulse className="h-20 rounded-lg" />
                <Pulse className="h-20 rounded-lg" />
                <Pulse className="h-20 rounded-lg" />
                <Pulse className="h-20 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Side Navigation ─── */

function AppointmentSideNav() {
  const [activeSection, setActiveSection] = useState('overview');
  const isScrollingRef = useRef(false);

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

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
      items={SECTIONS.map(s => ({ id: s.id, label: s.label, icon: s.icon }))}
      activeId={activeSection}
      onSelect={scrollTo}
    />
  );
}

/* ─── Section alias (noPadding by default for divide-y rows) ─── */

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

/* ─── 1. Overview ─── */

function OverviewSection({ appointment }: { appointment: DetailedAppointment }) {
  const isDoctor = appointment.type === 'doctor';
  const hasDoctor = isDoctor && appointment.doctor;
  const patientSub = [
    appointment.patient?.relation,
    appointment.patient?.age ? `${appointment.patient.age}y` : null,
    appointment.patient?.gender,
    appointment.patient?.blood_group,
  ].filter(Boolean).join(' · ');

  return (
    <Section id="overview" title="Overview" icon={isDoctor ? Stethoscope : TestTube2}>
      <div className="divide-y">
        <DetailRow label="Patient">
          <>
            <p className="text-label">{appointment.patient?.name ?? appointment.patient_name}</p>
            {patientSub && <p className="text-body text-muted-foreground">{patientSub}</p>}
          </>
        </DetailRow>
        {hasDoctor && (
          <DetailRow label="Doctor">
            <>
              <p className="text-label">{appointment.doctor!.name}</p>
              <p className="text-body text-muted-foreground">
                {[appointment.doctor!.specialization, appointment.doctor!.qualification].filter(Boolean).join(' · ')}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span className="text-body text-muted-foreground">
                  {appointment.doctor!.rating ?? '—'} · {appointment.doctor!.experience_years ?? '—'} yrs exp
                </span>
              </div>
            </>
          </DetailRow>
        )}
        <DetailRow label="Date & time">{`${appointment.date_formatted} · ${appointment.time} · ${appointment.duration}`}</DetailRow>
        <DetailRow label="Mode">{appointment.mode}</DetailRow>
      </div>
    </Section>
  );
}

/* ─── 2. Vitals ─── */

function VitalsSection({ vitals }: { vitals: Vital[] }) {
  return (
    <Section id="vitals" title="Vitals" icon={Heart}>
      <div className="divide-y">
        {vitals.map((v) => (
          <DetailRow key={v.label} label={v.label}>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-label">
                  {v.value}{v.unit ? ` ${v.unit}` : ''}
                </span>
                {v.status !== 'normal' && (
                  <Badge variant={v.status === 'elevated' ? 'danger' : 'warning'}>
                    {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                  </Badge>
                )}
              </div>
              {v.reference && (
                <p className="text-body text-muted-foreground mt-0.5">Normal: {v.reference}</p>
              )}
            </div>
          </DetailRow>
        ))}
      </div>
    </Section>
  );
}

/* ─── 3. Clinical Summary ─── */

function ClinicalSummarySection({ summary }: { summary: ClinicalSummary }) {
  const diagnosis = summary.diagnosis;

  return (
    <Section id="clinical" title="Clinical Summary" icon={FileText} noPadding>
      <div className="divide-y">
        {diagnosis && (
          <DetailRow label="Diagnosis">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{diagnosis.name || 'Not specified'}</span>
              {diagnosis.icd_code && (
                <Badge variant="neutral" className="font-mono">
                  ICD: {diagnosis.icd_code}
                </Badge>
              )}
              {diagnosis.severity && (
                <Badge
                  variant={
                    diagnosis.severity === 'mild' ? 'success' :
                    diagnosis.severity === 'moderate' ? 'warning' :
                    diagnosis.severity === 'severe' ? 'danger' :
                    'info'
                  }
                >
                  {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
                </Badge>
              )}
            </div>
          </DetailRow>
        )}
        {(summary.allergies?.length ?? 0) > 0 && (
          <DetailRow label="Allergies">
            <div className="flex gap-2 flex-wrap">
              {summary.allergies.map((a) => (
                <Badge key={a} variant="danger">{a}</Badge>
              ))}
            </div>
          </DetailRow>
        )}
        {summary.history_of_present_illness && <DetailRow label="Present illness">{summary.history_of_present_illness}</DetailRow>}
        {summary.past_medical_history && <DetailRow label="Past medical history">{summary.past_medical_history}</DetailRow>}
        {summary.family_history && <DetailRow label="Family history">{summary.family_history}</DetailRow>}
        {summary.social_history && <DetailRow label="Social history">{summary.social_history}</DetailRow>}
        {summary.examination_findings && <DetailRow label="Exam findings">{summary.examination_findings}</DetailRow>}
        {summary.assessment && <DetailRow label="Assessment">{summary.assessment}</DetailRow>}
        {summary.treatment_plan && <DetailRow label="Treatment plan">{summary.treatment_plan}</DetailRow>}
      </div>
      <div className="p-6 pt-4">
        <Alert variant="warning" title="If Symptoms Worsen">
          Contact your doctor immediately or visit the nearest emergency room. For urgent assistance, call the hospital helpline at <span className="font-medium text-foreground">1800-123-4567</span>.
        </Alert>
      </div>
    </Section>
  );
}

/* ─── 4. Prescriptions ─── */

function PrescriptionsSection({ prescriptions, appointmentId, appointmentTitle, appointmentDate, appointmentTime }: { prescriptions: Prescription[]; appointmentId: string; appointmentTitle: string; appointmentDate: string; appointmentTime: string }) {
  return (
    <Section
      id="prescriptions"
      title="Prescriptions"
      icon={Pill}
      action={
        <Button
          variant="secondary"
          size="md"
          className="text-body"
          onClick={() => {
            const rows = prescriptions.map((rx) =>
              `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:500">${rx.drug} ${rx.strength}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.dosage}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.frequency}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.duration}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.purpose}</td>
              </tr>`
            ).join('');
            downloadAsHtml(`prescription-${appointmentId}.pdf`, `
              <h1>Prescription</h1>
              <p class="subtitle">${appointmentTitle} &middot; ${appointmentDate} &middot; ${appointmentTime}</p>
              <h2>Prescriptions</h2>
              <table>
                <thead><tr><th>Prescription</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Purpose</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            `);
          }}
        >
          <Download className="h-3.5 w-3.5" />
          Download Rx
        </Button>
      }

    >
      <div className="divide-y">
        {prescriptions.map((rx, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-label">{rx.drug} {rx.strength}</p>
                <p className="text-body text-muted-foreground mt-0.5">
                  {[rx.dosage, rx.frequency, rx.purpose].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-body text-muted-foreground shrink-0 ml-4">{rx.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── 5. Lab Tests ─── */

function LabTestsSection({ tests }: { tests: LabTest[] }) {
  if (tests.length === 0) {
    return (
      <Section id="lab-tests" title="Lab Tests" icon={FlaskConical}>
        <div className="px-6 py-6 text-center">
          <p className="text-label text-muted-foreground">No lab tests ordered for this appointment</p>
          <p className="text-body text-muted-foreground mt-0.5">Lab tests will appear here if ordered by your doctor.</p>
        </div>
      </Section>
    );
  }

  const hasPending = tests.some((t) => t.status === 'pending');

  return (
    <Section
      id="lab-tests"
      title="Lab Tests"
      icon={FlaskConical}
      noPadding
      action={
        hasPending ? (
          <Link href="/booking/lab/patient">
            <Button variant="secondary" size="md" className="text-body">Book pending tests</Button>
          </Link>
        ) : undefined
      }
    >
      <div className="divide-y">
        {tests.map((t, i) => {
          if (t.status === 'completed') {
            const href = t.health_record_id ? `/health-records/${t.health_record_id}` : undefined;
            return (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <p className="text-label">{t.name}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={t.is_normal === false ? 'danger' : 'success'}>
                    {t.is_normal === false ? 'Abnormal' : 'Normal'}
                  </Badge>
                  {href && (
                    <Link href={href}>
                      <Button variant="secondary" iconOnly size="md">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <p className="text-label text-muted-foreground">{t.name}</p>
              <Badge variant="warning">Pending</Badge>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ─── 6. Billing ─── */

function BillingSection({ billing, appointmentId, insuranceClaimId, onDownloadInvoice }: { billing: Billing; appointmentId: number; insuranceClaimId?: number | null; onDownloadInvoice: () => void }) {
  return (
    <Section
      id="billing"
      title="Billing"
      icon={CreditCard}
      action={
        <Button
          variant="secondary"
          size="md"
          className="text-body"
          onClick={onDownloadInvoice}
        >
          <Download className="h-3.5 w-3.5" />
          Download Invoice
        </Button>
      }
    >
      <div className="divide-y">
        {/* Fee breakdown */}
        {billing.line_items.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4">
            <span className="text-body text-muted-foreground">{item.label}</span>
            <span className={`text-label ${item.amount < 0 ? 'text-success' : 'text-foreground'}`}>
              {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-card-title text-foreground">Total</span>
          <span className="text-subheading text-foreground">₹{billing.total.toLocaleString()}</span>
        </div>
        {/* Payment details */}
        <div className="px-6 py-3 bg-muted">
          <span className="text-label text-muted-foreground">Payment details</span>
        </div>
        <DetailRow label="Status">
          <Badge variant={billing.payment_status === 'paid' ? 'success' : billing.payment_status === 'pending' ? 'warning' : 'danger'}>
            {billing.payment_status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        </DetailRow>
        <DetailRow label="Method">{billing.payment_method}</DetailRow>
        <DetailRow label="Invoice"><span className="font-mono">{billing.invoice_number}</span></DetailRow>
        <DetailRow label="Paid on">{billing.payment_date}</DetailRow>
        <div className="px-6 py-3 flex items-center gap-4">
          <Link href={`/billing/${appointmentId}`} className="text-label text-primary hover:underline flex items-center gap-1">
            View Invoice
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          {insuranceClaimId && (
            <Link href={`/insurance/claims/${insuranceClaimId}`} className="text-label text-primary hover:underline flex items-center gap-1">
              View Insurance Claim
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ─── 7. Documents ─── */

function DocumentsSection({ documents }: { documents: AppDocument[] }) {
  if (documents.length === 0) {
    return (
      <Section id="documents" title="Documents" icon={FolderOpen}>
        <EmptyState icon={FolderOpen} message="No documents available for this appointment" description="Reports and documents will appear here after your visit." />
      </Section>
    );
  }

  const buildDocHtml = (doc: AppDocument) =>
    `<h1>${doc.name}</h1>
     <p class="subtitle">${doc.type.toUpperCase()} &middot; ${doc.date} &middot; ${doc.size}</p>
     <p style="margin-top:16px;font-size:12px;color:#6b7280">In production, the actual document file would be downloaded here.</p>`;

  const handleDownloadOne = (doc: AppDocument) => {
    downloadFile(`${doc.name.replace(/\s+/g, '-').toLowerCase()}.pdf`, buildDocHtml(doc));
  };

  const handleDownloadAll = () => {
    downloadAsZip(
      'appointment-documents.zip',
      documents.map((doc) => ({
        filename: `${doc.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        htmlContent: buildDocHtml(doc),
      }))
    );
  };

  return (
    <Section
      id="documents"
      title="Documents"
      icon={FolderOpen}
      action={
        <Button variant="secondary" size="md" className="text-body" onClick={handleDownloadAll}>
          <Download className="h-3.5 w-3.5" />
          Download All
        </Button>
      }
    >
      <div className="divide-y">
        {documents.map((doc, i) => (
          <Button
            key={i}
            variant="ghost"
            onClick={() => handleDownloadOne(doc)}
            className="w-full flex items-center justify-between px-6 py-4 h-auto rounded-none hover:bg-muted/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-icon-bg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-icon" />
              </div>
              <div>
                <p className="text-label">{doc.name}</p>
                <p className="text-body text-muted-foreground">
                  {doc.type.toUpperCase()} · {doc.date} · {doc.size}
                </p>
              </div>
            </div>
            <Download className="h-4 w-4 text-foreground" />
          </Button>
        ))}
      </div>
    </Section>
  );
}

/* ─── 8. Activity Log ─── */

function ActivitySection({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) {
    return (
      <Section id="activity" title="Activity Log" icon={Activity}>
        <EmptyState icon={Activity} message="No activity recorded" description="Status updates and actions will appear here." />
      </Section>
    );
  }

  // Determine dot color: cancelled/refund = gray, default = green
  const getDotColor = (icon: string) => {
    if (icon === 'x-circle' || icon === 'rotate-ccw') return 'bg-muted-foreground/40';
    return 'bg-success';
  };

  return (
    <Section id="activity" title="Activity Log" icon={Activity}>
      <div className="px-6 py-6">
        <div>
          {activity.map((item, i) => {
            const isLast = i === activity.length - 1;
            return (
              <div key={i} className={cn('flex gap-4 relative', !isLast && 'pb-7')}>
                {!isLast && (
                  <div className="absolute w-0.5 bg-success" style={{ left: '5px', top: '12px', bottom: 0 }} />
                )}
                <div className="flex-shrink-0">
                  <div className={cn('h-3 w-3 rounded-full relative z-10', getDotColor(item.icon))} />
                </div>
                <div className="-mt-0.5">
                  <p className="text-label">{item.event}</p>
                  {item.timestamp && (
                    <p className="text-body text-muted-foreground mt-0.5">{item.timestamp}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ─── 9. Footer Actions ─── */

function FooterActions({ appointment }: { appointment: DetailedAppointment }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const handleRate = (n: number) => {
    setRating(n);
    router.post(`/appointments/${appointment.id}/rate`, { rating: n }, {
      preserveState: true,
      onSuccess: () => setRatingSubmitted(true),
    });
  };

  return (
    <div className="flex items-center justify-between rounded-3xl border p-4">
      <div>
        <p className="text-label">
          {ratingSubmitted ? 'Thank you for your feedback!' : 'Rate this appointment'}
        </p>
        <p className="text-body text-muted-foreground">
          {ratingSubmitted ? `You rated ${rating} out of 5 stars` : 'Your feedback helps us improve'}
        </p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            variant="ghost"
            className="p-1 h-auto hover:scale-110 hover:bg-transparent transition-transform"
            onClick={() => !ratingSubmitted && handleRate(n)}
            onMouseEnter={() => !ratingSubmitted && setHoverRating(n)}
            onMouseLeave={() => !ratingSubmitted && setHoverRating(0)}
            disabled={ratingSubmitted}
          >
            <Star className={cn(
              'h-5 w-5 transition-colors',
              n <= (hoverRating || rating)
                ? 'text-warning fill-warning'
                : 'text-muted-foreground/30'
            )} />
          </Button>
        ))}
      </div>
    </div>
  );
}
