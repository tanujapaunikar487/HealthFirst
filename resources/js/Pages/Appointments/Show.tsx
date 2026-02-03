import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { cn } from '@/Lib/utils';
import { downloadAsHtml } from '@/Lib/download';
import { FollowUpSheet, Appointment as AppointmentBase } from '@/Components/Appointments/AppointmentSheets';
import {
  ChevronRight,
  Download,
  Share2,
  Stethoscope,
  TestTube2,
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  Star,
  AlertTriangle,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  FolderOpen,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,

  Phone,
  CheckCircle2,
  ExternalLink,
  Eye,
  Check,
  FileWarning,
  ShieldCheck,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { EmptyState } from '@/Components/ui/empty-state';
import { Pulse, SheetSkeleton } from '@/Components/ui/skeleton';

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
  reason: string;
  status: 'completed' | 'pending';
  result: string | null;
  date: string | null;
  is_normal: boolean | null;
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
  const [previewDoc, setPreviewDoc] = useState<AppDocument | null>(null);
  const [showFollowUpSheet, setShowFollowUpSheet] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);

  // Guard: if appointment data is missing, show skeleton
  if (!appointment?.id) {
    return (
      <AppLayout user={user} pageTitle="Appointment Details" pageIcon="/assets/icons/appointment-selected.svg">
        <div className="w-full max-w-[1100px] mx-auto px-6 py-8">
          <SkeletonPage />
        </div>
      </AppLayout>
    );
  }

  const isDoctor = appointment.type === 'doctor';

  const handleShareLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: appointment.title,
          text: `${appointment.title} — ${appointment.date_formatted} at ${appointment.time}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToastMessage('Link copied to clipboard');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setToastMessage('Could not share link');
    }
  };

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
    <AppLayout user={user} pageTitle="Appointment Details" pageIcon="/assets/icons/appointment-selected.svg">
      <div className="w-full max-w-[1100px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link href="/appointments" className="hover:text-foreground transition-colors">
            Appointments
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{appointment.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {isDoctor ? 'Doctor' : 'Lab Test'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {appointment.mode}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                #{appointment.appointment_id}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#00184D' }}>
              {appointment.title}
            </h1>
            {appointment.subtitle && (
              <p className="text-muted-foreground mt-1">{appointment.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Only show header button if NO follow-up recommendation */}
            {appointment.type === 'doctor' && !appointment.follow_up && (
              <Button onClick={() => setShowFollowUpSheet(true)}>
                Book Follow-up
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={handleShareLink}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Follow-up Alert - moved from footer */}
        {appointment.follow_up && appointment.type === 'doctor' && (
          <Card className="p-4 border-blue-200 bg-blue-50/30 mb-8">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: '#00184D' }}>Follow-up Recommended</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {appointment.follow_up.recommended_date_formatted}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {appointment.follow_up.notes}
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowFollowUpSheet(true)}>
                Schedule
              </Button>
            </div>
          </Card>
        )}

        {/* Main content: Side nav + sections */}
        <div className="flex gap-8">
          <SideNav />
          <div className="flex-1 min-w-0 space-y-8 pb-12">
            <OverviewSection appointment={appointment} />
            {(appointment.vitals?.length ?? 0) > 0
              ? <VitalsSection vitals={appointment.vitals} />
              : <Section id="vitals" title="Vitals" icon={Heart}><EmptyState icon={Heart} message="No vitals recorded for this appointment" /></Section>
            }
            {appointment.clinical_summary
              ? <ClinicalSummarySection summary={appointment.clinical_summary} />
              : <Section id="clinical" title="Clinical Summary" icon={FileText}><EmptyState icon={FileText} message="No clinical summary available" /></Section>
            }
            {(appointment.prescriptions?.length ?? 0) > 0
              ? <PrescriptionsSection prescriptions={appointment.prescriptions} appointmentId={appointment.appointment_id} appointmentTitle={appointment.title} appointmentDate={appointment.date_formatted} appointmentTime={appointment.time} />
              : <Section id="prescriptions" title="Prescriptions" icon={Pill}><EmptyState icon={Pill} message="No prescriptions for this appointment" /></Section>
            }
            <LabTestsSection tests={appointment.lab_tests ?? []} onSelect={(test) => test.status === 'completed' && setSelectedLabTest(test)} />
            {appointment.billing && (
              <BillingSection billing={appointment.billing} appointmentId={appointment.id} insuranceClaimId={appointment.insurance_claim_id} onDownloadInvoice={handleDownloadInvoice} />
            )}
            <DocumentsSection documents={appointment.documents ?? []} onPreview={setPreviewDoc} />
            <ActivitySection activity={appointment.activity ?? []} />
            <FooterActions appointment={appointment} />
          </div>
        </div>
      </div>

      {/* PDF Preview Sheet */}
      <Sheet open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <SheetContent side="right" className="sm:max-w-lg">
          {previewDoc ? <DocumentPreview doc={previewDoc} /> : <SheetSkeleton />}
        </SheetContent>
      </Sheet>

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

      {/* Lab Test Detail Sheet */}
      <Sheet open={!!selectedLabTest} onOpenChange={(o) => !o && setSelectedLabTest(null)}>
        <SheetContent side="right" className="sm:max-w-lg">
          {selectedLabTest && <LabTestDetailSheet test={selectedLabTest} />}
        </SheetContent>
      </Sheet>

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
    <div className="space-y-8">
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
        <div className="w-48 flex-shrink-0 space-y-2">
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

/* ─── Lab Test Detail Sheet ─── */

function LabTestDetailSheet({ test }: { test: LabTest }) {
  const handleDownload = () => {
    downloadAsHtml(`lab-report-${test.name.toLowerCase().replace(/\s+/g, '-')}.pdf`, `
      <h1>Lab Test Report</h1>
      <p class="subtitle">${test.name}</p>
      <div class="section">
        <h3>Test Information</h3>
        <div class="row"><span class="row-label">Test Name</span><span class="row-value">${test.name}</span></div>
        <div class="row"><span class="row-label">Reason</span><span class="row-value">${test.reason}</span></div>
        <div class="row"><span class="row-label">Date</span><span class="row-value">${test.date ?? 'N/A'}</span></div>
        <div class="row"><span class="row-label">Status</span><span class="row-value">${test.status}</span></div>
      </div>
      ${test.result ? `
        <div class="section">
          <h3>Result</h3>
          <p style="font-size:14px;margin-top:8px">${test.result}</p>
          <p style="font-size:12px;margin-top:4px;color:${test.is_normal ? '#16a34a' : '#dc2626'};font-weight:500">${test.is_normal ? 'Within normal range' : 'Abnormal - requires attention'}</p>
        </div>
      ` : ''}
    `);
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle className="text-base">Lab Test Result</SheetTitle>
        <SheetDescription>{test.name}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 -mx-6 px-6 overflow-y-auto space-y-5 mt-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              test.status === 'completed'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {test.status === 'completed' ? 'Completed' : 'Pending'}
          </Badge>
          {test.date && (
            <span className="text-xs text-muted-foreground">{test.date}</span>
          )}
        </div>

        {/* Reason */}
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Reason for Test</p>
          <p className="text-sm">{test.reason}</p>
        </div>

        {/* Result */}
        {test.result && (
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Result</p>
            <p className="text-sm font-medium">{test.result}</p>
            <div className="mt-3">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  test.is_normal
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                )}
              >
                {test.is_normal ? 'Normal' : 'Abnormal'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <SheetFooter>
        <Button className="flex-1" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </SheetFooter>
    </div>
  );
}

/* ─── Document Preview Sheet ─── */

function DocumentPreview({ doc }: { doc: AppDocument }) {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle className="text-base">{doc.name}</SheetTitle>
        <SheetDescription>
          {doc.type.toUpperCase()} · {doc.date} · {doc.size}
        </SheetDescription>
      </SheetHeader>

      {/* Mock PDF preview */}
      <div className="flex-1 rounded-lg border bg-muted/30 flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
          <FileText className="h-8 w-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm">{doc.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Preview not available for mock documents
          </p>
          <p className="text-xs text-muted-foreground">
            In production, the PDF would render here.
          </p>
        </div>
      </div>

      {/* Actions */}
      <SheetFooter>
        <Button className="flex-1">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </SheetFooter>
    </div>
  );
}

/* ─── Side Navigation ─── */

function SideNav() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-48 flex-shrink-0">
      <div className="sticky top-6 space-y-1">
        {SECTIONS.map(({ id, label, icon: SectionIcon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-all text-left rounded-full',
                isActive ? '' : 'text-[#0A0B0D] hover:bg-muted'
              )}
              style={isActive ? { backgroundColor: '#F5F8FF', color: '#0052FF' } : {}}
            >
              <Icon icon={SectionIcon} className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section Card Wrapper ─── */

function Section({
  id,
  title,
  icon: SectionIcon,
  children,
  action,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Icon icon={SectionIcon} className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
            {title}
          </h2>
        </div>
        {action}
      </div>
      <Card className="p-6">
        {children}
      </Card>
    </div>
  );
}

/* ─── 1. Overview ─── */

function OverviewSection({ appointment }: { appointment: DetailedAppointment }) {
  const isDoctor = appointment.type === 'doctor';

  return (
    <Section id="overview" title="Overview" icon={isDoctor ? Stethoscope : TestTube2}>
      <div className="grid grid-cols-2 gap-6">
        {/* Patient */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">{appointment.patient?.name ?? appointment.patient_name}</p>
              <p className="text-xs text-muted-foreground">
                {[
                  appointment.patient?.relation,
                  appointment.patient?.age ? `${appointment.patient.age}y` : null,
                  appointment.patient?.gender,
                  appointment.patient?.blood_group,
                ].filter(Boolean).join(' · ') || 'Patient'}
              </p>
            </div>
          </div>
        </div>

        {/* Doctor */}
        {isDoctor && appointment.doctor && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doctor</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BFDBFE' }}>
                <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
              </div>
              <div>
                <p className="font-medium text-sm">{appointment.doctor.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[appointment.doctor.specialization, appointment.doctor.qualification].filter(Boolean).join(' · ')}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs text-muted-foreground">
                    {appointment.doctor.rating ?? '—'} · {appointment.doctor.experience_years ?? '—'} yrs exp
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment details */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appointment</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.date_formatted}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.time} · {appointment.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.mode}</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
          <div className="space-y-2">
            <Badge
              className="text-xs"
              variant={appointment.status === 'completed' ? 'success' : appointment.status === 'confirmed' ? 'default' : appointment.status === 'cancelled' ? 'destructive' : 'secondary'}
            >
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
            {appointment.notes && (
              <p className="text-sm text-muted-foreground">{appointment.notes}</p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─── 2. Vitals ─── */

function VitalsSection({ vitals }: { vitals: Vital[] }) {
  const statusColor = (s: string) =>
    s === 'normal' ? 'text-green-600 bg-green-50' : s === 'elevated' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50';

  return (
    <Section id="vitals" title="Vitals" icon={Heart}>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {vitals.map((v) => (
          <div key={v.label} className="border rounded-lg p-3 space-y-1.5">
            <p className="text-xs text-muted-foreground">{v.label}</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold" style={{ color: '#00184D' }}>{v.value}</span>
              <span className="text-xs text-muted-foreground">{v.unit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', statusColor(v.status))}>
                {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
              </span>
              <span className="text-[10px] text-muted-foreground">{v.reference}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── 3. Clinical Summary ─── */

function ClinicalSummarySection({ summary }: { summary: ClinicalSummary }) {
  const diagnosis = summary.diagnosis;

  return (
    <Section id="clinical" title="Clinical Summary" icon={FileText}>
      {/* Diagnosis */}
      {diagnosis && (
        <div className="rounded-lg bg-muted/50 p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Primary Diagnosis</p>
              <p className="font-semibold text-sm">{diagnosis.name || 'Not specified'}</p>
            </div>
            {diagnosis.icd_code && (
              <Badge variant="outline" className="text-xs font-mono ml-auto">
                ICD: {diagnosis.icd_code}
              </Badge>
            )}
            {diagnosis.severity && (
              <Badge
                className={cn(
                  'text-xs',
                  diagnosis.severity === 'mild' && 'bg-green-50 text-green-700 border-green-200',
                  diagnosis.severity === 'moderate' && 'bg-amber-50 text-amber-700 border-amber-200',
                  diagnosis.severity === 'severe' && 'bg-red-50 text-red-700 border-red-200',
                  diagnosis.severity === 'routine' && 'bg-blue-50 text-blue-700 border-blue-200'
                )}
                variant="outline"
              >
                {diagnosis.severity.charAt(0).toUpperCase() + diagnosis.severity.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Allergies */}
      {(summary.allergies?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">Known Allergies</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {summary.allergies.map((a) => (
              <Badge key={a} variant="destructive" className="text-xs">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible subsections */}
      <div className="space-y-0 divide-y">
        <CollapsibleRow label="Chief Complaint" content={summary.chief_complaint} defaultOpen />
        <CollapsibleRow label="History of Present Illness" content={summary.history_of_present_illness} defaultOpen />
        <CollapsibleRow label="Past Medical History" content={summary.past_medical_history} />
        <CollapsibleRow label="Family History" content={summary.family_history} />
        <CollapsibleRow label="Social History" content={summary.social_history} />
        <CollapsibleRow label="Examination Findings" content={summary.examination_findings} />
        <CollapsibleRow label="Assessment" content={summary.assessment} defaultOpen />
        <CollapsibleRow label="Treatment Plan" content={summary.treatment_plan} defaultOpen />
      </div>

      {/* Symptoms worsen alert - moved from footer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 mt-5">
        <div className="flex items-start gap-3">
          <Phone className="h-4 w-4 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#00184D' }}>If Symptoms Worsen</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Contact your doctor immediately or visit the nearest emergency room. For urgent assistance, call the hospital helpline at <span className="font-medium text-foreground">1800-123-4567</span>.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function CollapsibleRow({
  label,
  content,
  defaultOpen = false,
}: {
  label: string;
  content: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Skip rendering if content is empty
  if (!content) return null;

  return (
    <div className="py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="text-sm font-medium text-foreground">{label}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div className={open ? 'block' : 'hidden'}>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{content}</p>
      </div>
    </div>
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
          variant="outline"
          size="sm"
          className="text-xs"
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
            downloadAsHtml(`prescription-${appointmentId}.html`, `
              <h1>Prescription</h1>
              <p class="subtitle">${appointmentTitle} &middot; ${appointmentDate} &middot; ${appointmentTime}</p>
              <h2>Medications</h2>
              <table>
                <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Purpose</th></tr></thead>
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
      <div className="space-y-3">
        {prescriptions.map((rx, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{rx.drug} {rx.strength}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      rx.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    )}
                  >
                    {rx.status === 'active' ? 'Active' : 'Completed'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{rx.purpose}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  downloadAsHtml(`prescription-${rx.drug.toLowerCase().replace(/\s+/g, '-')}.pdf`, `
                    <h1>Prescription</h1>
                    <p class="subtitle">${appointmentTitle} &middot; ${appointmentDate} &middot; ${appointmentTime}</p>
                    <h2>Medication</h2>
                    <table>
                      <thead><tr><th>Drug</th><th>Strength</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Purpose</th></tr></thead>
                      <tbody><tr>
                        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:500">${rx.drug}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.strength}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.dosage}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.frequency}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.duration}</td>
                        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${rx.purpose}</td>
                      </tr></tbody>
                    </table>
                  `);
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Dosage</p>
                <p className="text-xs font-medium mt-0.5">{rx.dosage}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Frequency</p>
                <p className="text-xs font-medium mt-0.5">{rx.frequency}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                <p className="text-xs font-medium mt-0.5">{rx.duration}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ─── 5. Lab Tests ─── */

function LabTestsSection({ tests, onSelect }: { tests: LabTest[]; onSelect?: (test: LabTest) => void }) {
  if (tests.length === 0) {
    return (
      <Section id="lab-tests" title="Lab Tests" icon={FlaskConical}>
        <EmptyState icon={FlaskConical} message="No lab tests ordered for this appointment" />
      </Section>
    );
  }

  return (
    <Section
      id="lab-tests"
      title="Lab Tests"
      icon={FlaskConical}
      action={
        tests.some((t) => t.status === 'pending') ? (
          <Link href="/booking/lab/patient">
            <Button variant="outline" size="sm" className="text-xs">
              Book Pending Tests
            </Button>
          </Link>
        ) : undefined
      }
    >
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground">Test</th>
              <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground">Reason</th>
              <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground">Result</th>
              <th className="px-4 py-2.5 font-medium text-xs text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tests.map((t, i) => (
              <tr
                key={i}
                className={cn(t.status === 'completed' && onSelect && 'cursor-pointer hover:bg-muted/30 transition-colors')}
                onClick={() => t.status === 'completed' && onSelect?.(t)}
              >
                <td className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-2">
                    {t.name}
                    {t.status === 'completed' && onSelect && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{t.reason}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      t.status === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    )}
                  >
                    {t.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  {t.result ? (
                    <span className={t.is_normal ? 'text-green-700' : 'text-red-600 font-medium'}>
                      {t.result}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{t.date ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ─── 6. Billing ─── */

function BillingSection({ billing, appointmentId, insuranceClaimId, onDownloadInvoice }: { billing: Billing; appointmentId: number; insuranceClaimId?: number | null; onDownloadInvoice: () => void }) {
  const statusColor =
    billing.payment_status === 'paid'
      ? 'text-green-600'
      : billing.payment_status === 'pending'
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <Section
      id="billing"
      title="Billing"
      icon={CreditCard}
      action={
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={onDownloadInvoice}
        >
          <Download className="h-3.5 w-3.5" />
          Download Invoice
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        {/* Fee breakdown */}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Fee Breakdown</p>
          <div className="space-y-2">
            {billing.line_items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={item.amount < 0 ? 'text-green-600' : ''}>
                  {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>₹{billing.total}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="border rounded-lg p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Payment Details</p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={cn('font-medium', statusColor)}>
                {billing.payment_status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span>{billing.payment_method}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono text-xs">{billing.invoice_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid on</span>
              <span className="text-xs">{billing.payment_date}</span>
            </div>
          </div>
          <Link href={`/billing/${appointmentId}`}>
            <Button variant="ghost" size="sm" className="w-full mt-4 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              View Full Bill
            </Button>
          </Link>
          {insuranceClaimId && (
            <Link href={`/insurance/claims/${insuranceClaimId}`}>
              <Button variant="ghost" size="sm" className="w-full text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                View Insurance Claim
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ─── 7. Documents ─── */

function DocumentsSection({ documents, onPreview }: { documents: AppDocument[]; onPreview: (doc: AppDocument) => void }) {
  if (documents.length === 0) {
    return (
      <Section id="documents" title="Documents" icon={FolderOpen}>
        <EmptyState icon={FolderOpen} message="No documents available for this appointment" />
      </Section>
    );
  }

  return (
    <Section
      id="documents"
      title="Documents"
      icon={FolderOpen}
      action={
        <Button variant="outline" size="sm" className="text-xs" onClick={() => {
          documents.forEach((doc) => {
            downloadAsHtml(`${doc.name.replace(/\s+/g, '-').toLowerCase()}.html`, `
              <h1>${doc.name}</h1>
              <p class="subtitle">${doc.type.toUpperCase()} &middot; ${doc.date} &middot; ${doc.size}</p>
              <p style="margin-top:16px;font-size:12px;color:#6b7280">In production, the actual document file would be downloaded here.</p>
            `);
          });
        }}>
          <Download className="h-3.5 w-3.5" />
          Download All
        </Button>
      }
    >
      <div className="space-y-2">
        {documents.map((doc, i) => (
          <button
            key={i}
            onClick={() => onPreview(doc)}
            className="w-full flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-muted/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.type.toUpperCase()} · {doc.date} · {doc.size}
                </p>
              </div>
            </div>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
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
        <EmptyState icon={Activity} message="No activity recorded" />
      </Section>
    );
  }

  return (
    <Section id="activity" title="Activity Log" icon={Activity}>
      <div className="relative">
        {activity.map((item, i) => {
          const isLast = i === activity.length - 1;
          return (
            <div key={i} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center z-10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-background" />
                </div>
                {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-medium">{item.event}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.timestamp}</p>
              </div>
            </div>
          );
        })}
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
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">
          {ratingSubmitted ? 'Thank you for your feedback!' : 'Rate this consultation'}
        </p>
        <p className="text-xs text-muted-foreground">
          {ratingSubmitted ? `You rated ${rating} out of 5 stars` : 'Your feedback helps us improve'}
        </p>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className="p-1 hover:scale-110 transition-transform"
            onClick={() => !ratingSubmitted && handleRate(n)}
            onMouseEnter={() => !ratingSubmitted && setHoverRating(n)}
            onMouseLeave={() => !ratingSubmitted && setHoverRating(0)}
            disabled={ratingSubmitted}
          >
            <Star className={cn(
              'h-5 w-5 transition-colors',
              n <= (hoverRating || rating)
                ? 'text-amber-400 fill-amber-400'
                : 'text-muted-foreground/30'
            )} />
          </button>
        ))}
      </div>
    </div>
  );
}
