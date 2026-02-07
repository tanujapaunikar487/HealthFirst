import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { DetailRow } from '@/Components/ui/detail-row';
import { DetailSection } from '@/Components/ui/detail-section';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Toast } from '@/Components/ui/toast';
import { Alert } from '@/Components/ui/alert';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';

import { SideNav, SideNavItem } from '@/Components/SideNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { downloadAsHtml } from '@/Lib/download';
import { ShareDialog } from '@/Components/ui/share-dialog';
import {
  ChevronRight,
  Share2,
  ChevronDown,
  Download,
  FileText,
  Stethoscope,
  BedDouble,
  Calendar,
  MoreVertical,
  Phone,
  Receipt,
  Shield,
  ClipboardList,
  Scissors,
  Clock,
  Baby,
  Microscope,
  Siren,
  Link2,
  IndianRupee,
  FolderOpen,
} from '@/Lib/icons';

/* ─── Section Config ─── */

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: ClipboardList },
  { id: 'linked', label: 'Linked', icon: Link2 },
  { id: 'financial', label: 'Financial', icon: IndianRupee },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'timeline', label: 'Timeline', icon: Clock },
] as const;

/* ─── Side Navigation ─── */

function ClaimSideNav({ hasFinancial }: { hasFinancial: boolean }) {
  const [activeSection, setActiveSection] = useState('overview');
  const isScrollingRef = useRef(false);
  const visibleSections: SideNavItem[] = hasFinancial
    ? SECTIONS.map(s => ({ id: s.id, label: s.label, icon: s.icon }))
    : SECTIONS.filter((s) => s.id !== 'financial').map(s => ({ id: s.id, label: s.label, icon: s.icon }));

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
      items={visibleSections}
      activeId={activeSection}
      onSelect={scrollTo}
      hiddenOnMobile
    />
  );
}

/* ─── Section alias ─── */

function Section({
  id,
  title,
  icon,
  action,
  noPadding,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  noPadding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DetailSection id={id} title={title} icon={icon} action={action} noPadding={noPadding}>
      {children}
    </DetailSection>
  );
}

// --- Interfaces ---

interface StayDetails {
  admission_date?: string;
  discharge_date?: string | null;
  days?: number;
  room_type?: string;
  room_number?: string;
  daily_rate?: number;
}

interface Deduction {
  label: string;
  amount: number;
}

interface Enhancement {
  id: number;
  amount: number;
  status: 'requested' | 'approved' | 'rejected';
  date?: string;
}

interface Financial {
  preauth_requested?: number;
  preauth_approved?: number;
  current_bill?: number;
  insurance_covered?: number | null;
  patient_paid?: number | null;
  not_covered?: number;
  enhancement_requested?: number;
  enhancement_approved?: number;
  original_approved?: number;
  refunded?: number;
  deductions?: Deduction[];
  enhancements?: Enhancement[];
  total_approved?: number;
  estimated_remaining?: number;
  estimated_out_of_pocket?: number;
  copay_percentage?: number;
  copay_amount?: number;
}

interface Document {
  type: string;
  date: string;
  filename: string;
}

interface TimelineEvent {
  event: string;
  date: string | null;
  status: 'completed' | 'current' | 'pending' | 'warning' | 'rejected';
  details?: Record<string, string>;
  note?: string;
}

interface ClaimData {
  id: number;
  claim_reference: string;
  treatment_name: string;
  procedure_type: string | null;
  status: string;
  rejection_reason: string | null;
  claim_amount: number;
  claim_date: string | null;
  claim_date_formatted: string | null;
  provider_name: string | null;
  policy_id: number | null;
  policy_plan_name: string | null;
  original_policy_id?: number | null;
  original_policy_plan_name?: string | null;
  original_policy_expired_date?: string | null;
  transfer_date?: string | null;
  appointment_id: number | null;
  family_member_id: number | null;
  stay_details: StayDetails | null;
  financial: Financial | null;
  documents: Document[];
  timeline: TimelineEvent[];
}

interface Patient {
  name: string;
  relation: string;
  avatar_url: string | null;
}

interface Doctor {
  name: string;
  specialization: string;
  avatar_url: string | null;
}

interface AppointmentData {
  id: number;
  date: string | null;
  date_formatted: string | null;
  time: string | null;
  type: string | null;
  status: string | null;
}

interface Props {
  claim: ClaimData;
  patient: Patient;
  doctor: Doctor | null;
  appointment: AppointmentData | null;
}

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}


function getTreatmentIcon(procedureType: string | null) {
  switch (procedureType) {
    case 'surgery':
      return Scissors;
    case 'consultation':
      return Stethoscope;
    case 'hospitalization':
      return BedDouble;
    case 'maternity':
      return Baby;
    case 'diagnostic':
      return Microscope;
    case 'emergency':
      return Siren;
    default:
      return ClipboardList;
  }
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }> = {
    current: { label: 'In Treatment', variant: 'info' },
    processing: { label: 'In Treatment', variant: 'info' },
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    partially_approved: { label: 'Partially Approved', variant: 'warning' },
    rejected: { label: 'Rejected', variant: 'danger' },
    expired: { label: 'Expired', variant: 'neutral' },
    enhancement_required: { label: 'Enhancement Required', variant: 'warning' },
    enhancement_in_progress: { label: 'Enhancement In Progress', variant: 'warning' },
    enhancement_approved: { label: 'Enhancement Approved', variant: 'success' },
    enhancement_rejected: { label: 'Enhancement Rejected', variant: 'danger' },
    dispute_under_review: { label: 'Dispute Under Review', variant: 'warning' },
    dispute_resolved: { label: 'Dispute Resolved', variant: 'success' },
    settled: { label: 'Settled', variant: 'success' },
  };
  const entry = map[status] ?? map.pending;
  return (
    <Badge variant={entry.variant}>
      {entry.label}
    </Badge>
  );
}

// --- Timeline grouping ---

interface TimelineGroup {
  month: string;
  events: { event: TimelineEvent; globalIdx: number }[];
}

function groupTimelineByMonth(timeline: TimelineEvent[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];
  let currentMonth = '';
  timeline.forEach((event, idx) => {
    const month = event.date
      ? event.date.split(' ').slice(1).join(' ')
      : 'Upcoming';
    if (month !== currentMonth) {
      groups.push({ month, events: [] });
      currentMonth = month;
    }
    groups[groups.length - 1].events.push({ event, globalIdx: idx });
  });
  return groups;
}

// --- Status Banner ---

interface BannerConfig {
  variant: 'info' | 'success' | 'warning' | 'error';
  title: string;
  subtitle?: string;
  breakdown?: string;
  action?: { label: string; toastMsg: string };
}

function getBannerConfig(claim: ClaimData, formatDate: (d: string | Date | null | undefined) => string): BannerConfig {
  const f = claim.financial;
  const s = claim.status;

  switch (s) {
    case 'pending':
      return {
        variant: 'warning',
        title: f?.preauth_requested
          ? `Pre-authorization for ${formatCurrency(f.preauth_requested)} is in progress`
          : 'Claim submitted. Under review.',
        subtitle: claim.claim_date
          ? `Submitted on ${formatDate(claim.claim_date)}. Usually approved within 4-6 hours.`
          : 'Usually approved within 4-6 hours.',
        action: { label: 'Track status', toastMsg: 'Viewing claim timeline...' },
      };

    case 'approved':
      return {
        variant: 'success',
        title: f?.preauth_approved
          ? `Pre-authorization approved for ${formatCurrency(f.preauth_approved)}`
          : 'Pre-authorization approved.',
        subtitle: claim.claim_date
          ? `Approved on ${formatDate(claim.claim_date)}. You can proceed with cashless treatment.`
          : 'You can proceed with cashless treatment.',
        action: { label: 'Download EOB', toastMsg: 'Downloading Explanation of Benefits...' },
      };

    case 'partially_approved':
      return {
        variant: 'warning',
        title: f?.not_covered
          ? `Partially approved — ${formatCurrency(f.not_covered)} not covered`
          : 'Partially approved.',
        subtitle: claim.rejection_reason ?? undefined,
        breakdown:
          f?.preauth_requested != null && f?.preauth_approved != null && f?.not_covered != null
            ? `Requested: ${formatCurrency(f.preauth_requested)} · Approved: ${formatCurrency(f.preauth_approved)} · Not covered: ${formatCurrency(f.not_covered)}`
            : f?.total_approved != null
              ? `Total approved: ${formatCurrency(f.total_approved)} · Not covered: ${formatCurrency(f.not_covered ?? 0)}`
              : undefined,
        action: { label: 'Accept', toastMsg: 'Accepting claim...' },
      };

    case 'rejected':
      return {
        variant: 'error',
        title: claim.claim_date
          ? `Pre-authorisation rejected on ${formatDate(claim.claim_date)}`
          : 'Pre-authorisation rejected.',
        subtitle: claim.rejection_reason ?? undefined,
        action: { label: 'File appeal', toastMsg: 'Opening appeal flow...' },
      };

    case 'expired':
      return {
        variant: 'error',
        title: claim.claim_date
          ? `Pre-authorization expired on ${formatDate(claim.claim_date)}`
          : 'Pre-authorization expired.',
        subtitle: 'This approval was valid for 30 days. Submit a new request to proceed.',
        action: { label: 'Request new pre-auth', toastMsg: 'Submitting pre-auth request...' },
      };

    case 'enhancement_required':
      return {
        variant: 'warning',
        title: 'Enhancement required',
        subtitle:
          f?.current_bill && f?.original_approved
            ? `Day ${claim.stay_details?.days ?? '?'} of treatment. Treatment is exceeding approved amount.`
            : 'Additional pre-auth needed to continue cashless.',
        breakdown:
          f?.original_approved != null && f?.current_bill != null && f?.enhancement_requested != null
            ? `Originally approved: ${formatCurrency(f.original_approved)} · Current bill: ${formatCurrency(f.current_bill)} · Enhancement requested: ${formatCurrency(f.enhancement_requested)}`
            : undefined,
        action: { label: 'Request enhancement', toastMsg: 'Submitting enhancement request...' },
      };

    case 'enhancement_in_progress':
      return {
        variant: 'warning',
        title: 'Enhancement request in progress',
        subtitle: f?.enhancement_requested
          ? `Requested ${formatCurrency(f.enhancement_requested)} additional coverage.`
          : 'Enhancement request submitted.',
        breakdown:
          f?.original_approved != null && f?.enhancement_requested != null
            ? `Original: ${formatCurrency(f.original_approved)} · Requested enhancement: ${formatCurrency(f.enhancement_requested)}`
            : undefined,
        action: { label: 'Track enhancement', toastMsg: 'Viewing enhancement timeline...' },
      };

    case 'enhancement_approved':
      return {
        variant: 'success',
        title: 'Enhancement approved!',
        subtitle:
          f?.enhancement_approved != null && f?.original_approved != null
            ? `${formatCurrency(f.enhancement_approved)} additional coverage approved. Total now ${formatCurrency(f.original_approved + f.enhancement_approved)}.`
            : 'Additional coverage approved.',
        action: { label: 'Download EOB', toastMsg: 'Downloading Explanation of Benefits...' },
      };

    case 'enhancement_rejected':
      return {
        variant: 'error',
        title: 'Enhancement request rejected',
        subtitle: claim.rejection_reason ?? undefined,
        action: { label: 'File appeal', toastMsg: 'Opening appeal flow...' },
      };

    case 'current':
    case 'processing':
      return {
        variant: 'info',
        title: f?.preauth_approved
          ? `${formatCurrency(f.preauth_approved)} pre-auth approved. Treatment in progress.`
          : 'Treatment in progress.',
      };

    case 'settled':
      return {
        variant: 'success',
        title: claim.claim_date
          ? `Claim settled on ${formatDate(claim.claim_date)}`
          : 'Claim settled.',
        subtitle:
          f?.insurance_covered != null && f?.patient_paid != null
            ? `Final settlement: ${formatCurrency(f.insurance_covered)} covered by insurance. You paid ${formatCurrency(f.patient_paid)}.`
            : undefined,
        action: { label: 'Raise dispute', toastMsg: 'Submitting dispute...' },
      };

    case 'dispute_under_review':
      return {
        variant: 'warning',
        title: 'Settlement disputed under review',
        subtitle: (claim.rejection_reason ?? 'Your dispute is being reviewed.') + ' Expected resolution: 5-7 days.',
        action: { label: 'Track dispute', toastMsg: 'Viewing dispute timeline...' },
      };

    case 'dispute_resolved':
      return {
        variant: 'success',
        title: claim.claim_date
          ? `Dispute resolved on ${formatDate(claim.claim_date)}`
          : 'Dispute resolved.',
        subtitle: f?.refunded
          ? `${formatCurrency(f.refunded)} has been refunded to your account.`
          : undefined,
        action: { label: 'View resolution', toastMsg: 'Viewing resolution details...' },
      };

    default:
      return {
        variant: 'warning',
        title: 'Claim submitted. Under review.',
      };
  }
}

// --- Timeline Event Renderer ---

function TimelineEventRow({
  event,
  isLast,
  isExpanded,
  onToggle,
}: {
  event: TimelineEvent;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasDetails = event.details && Object.keys(event.details).length > 0;

  let dotClass = '';
  let dotExtra = '';
  switch (event.status) {
    case 'completed':
      dotClass = 'bg-success';
      break;
    case 'current':
      dotClass = 'bg-primary';
      dotExtra = 'ring-4 ring-primary/20';
      break;
    case 'warning':
      dotClass = 'bg-warning';
      break;
    case 'rejected':
      dotClass = 'bg-destructive';
      break;
    default:
      dotClass = 'bg-border';
      break;
  }

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-1.5 top-3.5 h-full w-px bg-border" />
      )}
      <div
        className={`relative z-10 mt-1 h-3 w-3 flex-shrink-0 rounded-full ${dotClass} ${dotExtra}`}
      />
      <div className="flex-1 min-w-0">
        <div
          className={`flex items-center gap-1.5 ${hasDetails ? 'cursor-pointer' : ''}`}
          onClick={hasDetails ? onToggle : undefined}
        >
          <p
            className={`text-label ${
              event.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {event.event}
          </p>
          {hasDetails && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-foreground transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
        {event.date && (
          <p className="text-body text-muted-foreground">{event.date}</p>
        )}
        {event.note && (
          <p className="mt-0.5 text-body italic text-muted-foreground">{event.note}</p>
        )}
        {hasDetails && isExpanded && (
          <div className="mt-2 rounded-lg border bg-muted px-3 py-2">
            {Object.entries(event.details!).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-1 text-body">
                <span className="text-muted-foreground">{key}</span>
                <span className="text-label text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Skeleton ---

function ClaimDetailSkeleton() {
  return (
    <div className="w-full max-w-page">
      <Pulse className="h-4 w-24 mb-6" />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Pulse className="h-7 w-48" />
          <Pulse className="h-4 w-32" />
        </div>
        <Pulse className="h-6 w-24 rounded-full" />
      </div>
      {/* Timeline */}
      <div className="rounded-xl border border-border p-6 mb-6 space-y-4">
        <Pulse className="h-5 w-24" />
        <div className="flex items-center gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Pulse className="h-8 w-8 rounded-full" />
              <Pulse className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
      {/* Detail cards */}
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-border p-6 mb-6 space-y-4">
          <Pulse className="h-5 w-36" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between">
                <Pulse className="h-4 w-28" />
                <Pulse className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Component ---

export default function ClaimDetail({ claim, patient, doctor, appointment }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(claim);
  const { formatDate } = useFormatPreferences();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState<number[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [fromPolicy, setFromPolicy] = useState(false);

  // Read navigation context from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('from') === 'policy') {
      setFromPolicy(true);
    }
  }, []);

  const toast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const toggleTimelineDetails = (idx: number) => {
    setExpandedTimeline((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const banner = getBannerConfig(claim, formatDate);
  const stay = claim.stay_details;
  const fin = claim.financial;
  const isOutpatient = !stay || !stay.days;
  const isOngoing = stay && !stay.discharge_date;
  const isInTreatment = claim.status === 'current' || claim.status === 'processing';

  // Timeline helpers
  const lastUpdatedEvent = [...claim.timeline]
    .reverse()
    .find((e) => e.status !== 'pending' && e.date);
  const lastUpdatedDate = lastUpdatedEvent?.date ?? null;
  const useMonthGroups = claim.timeline.length > 8;
  const timelineGroups = useMonthGroups ? groupTimelineByMonth(claim.timeline) : null;

  // Financial preview for mobile collapsed state
  const financialPreview = fin
    ? fin.total_approved
      ? formatCurrency(fin.total_approved)
      : fin.insurance_covered != null
        ? formatCurrency(fin.insurance_covered)
        : fin.preauth_approved != null
          ? formatCurrency(fin.preauth_approved)
          : null
    : null;

  // Has enhancements array (new format)
  const hasEnhancements = fin?.enhancements && fin.enhancements.length > 0;

  // Three-dot menu component (reused in sticky header + main header)
  const ThreeDotMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" iconOnly size="md" className="text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Download claim summary */}
        <DropdownMenuItem onClick={() => {
          const f = claim.financial;
          downloadAsHtml(`claim-${claim.claim_reference}.pdf`, `
            <h1>Insurance Claim</h1>
            <p class="subtitle">${claim.claim_reference}</p>
            <h2>Claim Details</h2>
            <div class="row"><span class="row-label">Treatment</span><span class="row-value">${claim.treatment_name}</span></div>
            <div class="row"><span class="row-label">Provider</span><span class="row-value">${claim.provider_name ?? 'N/A'}</span></div>
            <div class="row"><span class="row-label">Status</span><span class="row-value">${claim.status.replace(/_/g, ' ')}</span></div>
            <div class="row"><span class="row-label">Claim Amount</span><span class="row-value">₹${claim.claim_amount.toLocaleString()}</span></div>
            ${f?.insurance_covered ? `<div class="row"><span class="row-label">Insurance Covered</span><span class="row-value">₹${f.insurance_covered.toLocaleString()}</span></div>` : ''}
            ${f?.patient_paid ? `<div class="row"><span class="row-label">Patient Paid</span><span class="row-value">₹${f.patient_paid.toLocaleString()}</span></div>` : ''}
            <p style="margin-top:24px;font-size:12px;color:#6b7280">Generated on ${new Date().toLocaleDateString()}</p>
          `);
        }}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>

        {/* Appeal (if rejected) */}
        {claim.status === 'rejected' && (
          <DropdownMenuItem onClick={() => {
            if (confirm('Would you like to file an appeal for this rejected claim?')) {
              router.post(`/insurance/claims/${claim.id}/appeal`, {}, {
                onSuccess: () => toast('Appeal request submitted'),
                onError: () => toast('Failed to submit appeal'),
              });
            }
          }}>
            <FileText className="mr-2 h-4 w-4" />
            Appeal
          </DropdownMenuItem>
        )}

        {/* Share */}
        <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (hasError) {
    return (
      <AppLayout pageTitle="Insurance" pageIcon="insurance">
        <ErrorState onRetry={retry} label="Unable to load claim details" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Insurance" pageIcon="insurance">
        <ClaimDetailSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Insurance" pageIcon="insurance">
      {/* Mobile sticky header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-6 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-label text-muted-foreground">{claim.claim_reference}</span>
            {getStatusBadge(claim.status)}
          </div>
          <ThreeDotMenu />
        </div>
      </div>

      <div className="w-full max-w-page min-h-full flex flex-col pb-10">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-1.5 text-body text-muted-foreground">
          <Button
            variant="link"
            size="sm"
            onClick={() => router.visit('/insurance')}
            className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
          >
            Insurance
          </Button>
          <ChevronRight className="h-3.5 w-3.5" />
          {fromPolicy && claim.policy_id && claim.policy_plan_name ? (
            <>
              <Button
                variant="link"
                size="sm"
                onClick={() => router.visit(`/insurance/${claim.policy_id}`)}
                className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground"
              >
                {claim.policy_plan_name}
              </Button>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          ) : null}
          <span className="text-muted-foreground">{claim.claim_reference}</span>
        </div>

        {/* Header with three-dot menu */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                {(() => {
                  const TreatmentIcon = getTreatmentIcon(claim.procedure_type);
                  return (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-icon-bg">
                      <TreatmentIcon className="h-5 w-5 text-icon" />
                    </div>
                  );
                })()}
                <h1 className="text-detail-title text-foreground">{claim.treatment_name}</h1>
                {claim.procedure_type && (
                  <Badge variant="neutral">
                    {claim.procedure_type}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-body text-muted-foreground">
                {claim.provider_name && <span>{claim.provider_name}</span>}
                {claim.claim_date && (
                  <>
                    <span>&middot;</span>
                    <span>{formatDate(claim.claim_date)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(claim.status)}
              {/* Status-based primary button */}
              {claim.status === 'rejected' || claim.status === 'enhancement_rejected' ? (
                <Button size="lg" onClick={() => {
                  if (confirm('Would you like to file an appeal for this claim?')) {
                    router.post(`/insurance/claims/${claim.id}/appeal`, {}, {
                      onSuccess: () => toast('Appeal request submitted'),
                      onError: () => toast('Failed to submit appeal'),
                    });
                  }
                }}>
                  <FileText className="h-4 w-4" />
                  File appeal
                </Button>
              ) : claim.status === 'approved' || claim.status === 'enhancement_approved' ? (
                <Button size="lg" onClick={() => {
                  const f = claim.financial;
                  downloadAsHtml(`eob-${claim.claim_reference}.pdf`, `
                    <h1>Explanation of Benefits</h1>
                    <p class="subtitle">${claim.claim_reference}</p>
                    <h2>Claim Details</h2>
                    <div class="row"><span class="row-label">Treatment</span><span class="row-value">${claim.treatment_name}</span></div>
                    <div class="row"><span class="row-label">Provider</span><span class="row-value">${claim.provider_name ?? 'N/A'}</span></div>
                    <div class="row"><span class="row-label">Patient</span><span class="row-value">${patient.name}</span></div>
                    <div class="row"><span class="row-label">Claim Date</span><span class="row-value">${formatDate(claim.claim_date) || 'N/A'}</span></div>
                    <h2>Financial Summary</h2>
                    ${f?.preauth_approved ? `<div class="row"><span class="row-label">Approved Amount</span><span class="row-value">₹${f.preauth_approved.toLocaleString()}</span></div>` : ''}
                    ${f?.total_approved ? `<div class="row"><span class="row-label">Total Approved</span><span class="row-value">₹${f.total_approved.toLocaleString()}</span></div>` : ''}
                    ${f?.not_covered ? `<div class="row"><span class="row-label">Not Covered</span><span class="row-value">₹${f.not_covered.toLocaleString()}</span></div>` : ''}
                    <p style="margin-top:24px;font-size:12px;color:#6b7280">Generated on ${new Date().toLocaleDateString()}</p>
                  `);
                  toast('EOB downloaded');
                }}>
                  <Download className="h-4 w-4" />
                  Download EOB
                </Button>
              ) : claim.status === 'settled' ? (
                <Button size="lg" onClick={() => {
                  const f = claim.financial;
                  downloadAsHtml(`settlement-${claim.claim_reference}.pdf`, `
                    <h1>Settlement Letter</h1>
                    <p class="subtitle">${claim.claim_reference}</p>
                    <h2>Claim Details</h2>
                    <div class="row"><span class="row-label">Treatment</span><span class="row-value">${claim.treatment_name}</span></div>
                    <div class="row"><span class="row-label">Provider</span><span class="row-value">${claim.provider_name ?? 'N/A'}</span></div>
                    <div class="row"><span class="row-label">Patient</span><span class="row-value">${patient.name}</span></div>
                    <div class="row"><span class="row-label">Settlement Date</span><span class="row-value">${formatDate(claim.claim_date) || 'N/A'}</span></div>
                    <h2>Settlement Summary</h2>
                    ${f?.insurance_covered ? `<div class="row"><span class="row-label">Insurance Covered</span><span class="row-value">₹${f.insurance_covered.toLocaleString()}</span></div>` : ''}
                    ${f?.patient_paid ? `<div class="row"><span class="row-label">Patient Paid</span><span class="row-value">₹${f.patient_paid.toLocaleString()}</span></div>` : ''}
                    <p style="margin-top:24px;font-size:12px;color:#6b7280">Generated on ${new Date().toLocaleDateString()}</p>
                  `);
                  toast('Settlement letter downloaded');
                }}>
                  <Download className="h-4 w-4" />
                  Download Settlement
                </Button>
              ) : claim.status === 'dispute_resolved' ? (
                <Button size="lg" onClick={() => document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <FileText className="h-4 w-4" />
                  View resolution
                </Button>
              ) : (claim.status === 'pending' || claim.status === 'enhancement_in_progress' || claim.status === 'dispute_under_review') ? (
                <Button size="lg" onClick={() => document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <Clock className="h-4 w-4" />
                  Track status
                </Button>
              ) : null}
              <ThreeDotMenu />
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <Alert
          variant={banner.variant}
          title={banner.title}
          className="mb-8"
          action={banner.action ? (
            <Button
              size="sm"
              variant="secondary"
              className="flex-shrink-0 h-8 text-body"
              onClick={() => {
                const label = banner.action!.label;
                if (label === 'Accept') {
                  if (confirm('Accept the partially approved amount?')) {
                    router.post(`/insurance/claims/${claim.id}/accept`, {}, {
                      onSuccess: () => toast('Claim accepted successfully'),
                      onError: () => toast('Failed to accept claim'),
                    });
                  }
                } else if (label === 'Try different policy') {
                  router.visit('/insurance');
                } else if (label === 'Request new pre-auth') {
                  router.post(`/insurance/claims/${claim.id}/new-preauth`, {}, {
                    onSuccess: () => toast('New pre-authorization request submitted'),
                    onError: () => toast('Failed to submit request'),
                  });
                } else if (label === 'Request enhancement') {
                  router.post(`/insurance/claims/${claim.id}/enhancement`, {}, {
                    onSuccess: () => toast('Enhancement request submitted'),
                    onError: () => toast('Failed to submit enhancement request'),
                  });
                } else if (label === 'Raise dispute') {
                  if (confirm('Are you sure you want to raise a dispute for this settled claim?')) {
                    router.post(`/insurance/claims/${claim.id}/dispute`, {}, {
                      onSuccess: () => toast('Dispute submitted successfully'),
                      onError: () => toast('Failed to submit dispute'),
                    });
                  }
                } else if (label === 'File appeal') {
                  if (confirm('Would you like to file an appeal for this claim?')) {
                    router.post(`/insurance/claims/${claim.id}/appeal`, {}, {
                      onSuccess: () => toast('Appeal request submitted'),
                      onError: () => toast('Failed to submit appeal'),
                    });
                  }
                } else if (label === 'Download EOB') {
                  const f = claim.financial;
                  downloadAsHtml(`eob-${claim.claim_reference}.pdf`, `
                    <h1>Explanation of Benefits</h1>
                    <p class="subtitle">${claim.claim_reference}</p>
                    <h2>Claim Details</h2>
                    <div class="row"><span class="row-label">Treatment</span><span class="row-value">${claim.treatment_name}</span></div>
                    <div class="row"><span class="row-label">Provider</span><span class="row-value">${claim.provider_name ?? 'N/A'}</span></div>
                    <div class="row"><span class="row-label">Patient</span><span class="row-value">${patient.name}</span></div>
                    <div class="row"><span class="row-label">Claim Date</span><span class="row-value">${formatDate(claim.claim_date) || 'N/A'}</span></div>
                    <h2>Financial Summary</h2>
                    ${f?.preauth_approved ? `<div class="row"><span class="row-label">Approved Amount</span><span class="row-value">₹${f.preauth_approved.toLocaleString()}</span></div>` : ''}
                    ${f?.total_approved ? `<div class="row"><span class="row-label">Total Approved</span><span class="row-value">₹${f.total_approved.toLocaleString()}</span></div>` : ''}
                    ${f?.not_covered ? `<div class="row"><span class="row-label">Not Covered</span><span class="row-value">₹${f.not_covered.toLocaleString()}</span></div>` : ''}
                    <p style="margin-top:24px;font-size:12px;color:#6b7280">Generated on ${new Date().toLocaleDateString()}</p>
                  `);
                  toast('EOB downloaded');
                } else if (label === 'Track status' || label === 'Track enhancement' || label === 'Track dispute' || label === 'View resolution') {
                  document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  toast(banner.action!.toastMsg);
                } else {
                  toast(banner.action!.toastMsg);
                }
              }}
            >
              {banner.action.label}
            </Button>
          ) : undefined}
        >
          {(banner.subtitle || banner.breakdown) && (
            <div className="space-y-1">
              {banner.subtitle && <p>{banner.subtitle}</p>}
              {banner.breakdown && <p className="text-label opacity-70">{banner.breakdown}</p>}
            </div>
          )}
        </Alert>

        {/* Main Content with Side Nav */}
        <div className="flex gap-24">
          <ClaimSideNav hasFinancial={!!fin} />
          <div className="flex-1 min-w-0 space-y-12 pb-12">

        {/* Overview Section */}
        <Section id="overview" title="Overview" icon={ClipboardList} noPadding>
          <div className="divide-y">
            {/* Patient */}
            <DetailRow label="Patient">
              <Button
                variant="ghost"
                className="flex items-center gap-1.5 h-auto p-0 hover:opacity-80 hover:bg-transparent transition-opacity"
                onClick={() => {
                  if (claim.family_member_id) {
                    router.visit(`/family-members/${claim.family_member_id}`);
                  }
                }}
                disabled={!claim.family_member_id}
              >
                <span className="text-label text-foreground">{patient.name}</span>
                {patient.relation !== 'self' && (
                  <span className="text-body capitalize text-muted-foreground">({patient.relation})</span>
                )}
              </Button>
            </DetailRow>

            {/* Doctor */}
            <DetailRow label="Doctor">
              {doctor ? (
                <div className="flex items-center gap-1.5 text-body">
                  <span className="text-label text-foreground">{doctor.name}</span>
                  <span className="text-muted-foreground">&middot;</span>
                  <span className="text-muted-foreground">{doctor.specialization}</span>
                </div>
              ) : (
                <span className="text-body text-muted-foreground">N/A</span>
              )}
            </DetailRow>

            {/* Stay */}
            <DetailRow label="Stay">
              {isOutpatient ? (
                <span className="text-label text-foreground">Outpatient</span>
              ) : (
                <div className="flex items-center gap-1.5 text-body flex-wrap">
                  <span className="text-label text-foreground">{stay!.days} Days</span>
                  {isOngoing && (
                    <Badge variant="info">
                      Ongoing
                    </Badge>
                  )}
                  {stay!.admission_date && (
                    <>
                      <span className="text-muted-foreground">&middot;</span>
                      <span className="text-muted-foreground">
                        {stay!.admission_date}
                        {stay!.discharge_date ? ` — ${stay!.discharge_date}` : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </DetailRow>

            {/* Room */}
            {!isOutpatient && (
              <DetailRow label="Room">
                <div className="flex items-center gap-1.5 text-body">
                  <span className="text-label text-foreground">{stay!.room_type ?? 'General'}</span>
                  {stay!.room_number && (
                    <>
                      <span className="text-muted-foreground">&middot;</span>
                      <span className="text-muted-foreground">#{stay!.room_number}</span>
                    </>
                  )}
                  {stay!.daily_rate && (
                    <>
                      <span className="text-muted-foreground">&middot;</span>
                      <span className="text-muted-foreground">{formatCurrency(stay!.daily_rate)}/day</span>
                    </>
                  )}
                </div>
              </DetailRow>
            )}
          </div>
        </Section>

        {/* Linked Section */}
        <Section id="linked" title="Linked" icon={Link2} noPadding>
          <div className="divide-y">

          {/* Original Policy (if transferred) */}
          {claim.original_policy_id && claim.original_policy_plan_name && (
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-icon-bg">
                <Shield className="h-5 w-5 text-icon" />
              </div>
              <div className="flex-1">
                <p className="text-label text-muted-foreground">Insurance Plan (Original)</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-card-title text-muted-foreground line-through">
                    {claim.original_policy_plan_name}
                  </p>
                  <Badge variant="neutral">
                    Expired
                  </Badge>
                </div>
                {claim.original_policy_expired_date && (
                  <p className="text-body text-muted-foreground">Expired {formatDate(claim.original_policy_expired_date)}</p>
                )}
              </div>
            </div>
          )}

          {/* Current Insurance Plan */}
          {claim.policy_id && claim.policy_plan_name && (
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-6 py-4 h-auto rounded-none text-left transition-colors hover:bg-accent"
              onClick={() => router.visit(`/insurance/${claim.policy_id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-icon-bg">
                  <Shield className="h-5 w-5 text-icon" />
                </div>
                <div>
                  <p className="text-label text-muted-foreground">
                    Insurance Plan{claim.original_policy_id ? ' (Current)' : ''}
                  </p>
                  <p className="mt-0.5 text-card-title text-foreground">
                    {claim.policy_plan_name}
                  </p>
                  {claim.transfer_date && (
                    <p className="text-body text-muted-foreground">Transferred on {claim.transfer_date}</p>
                  )}
                  {!claim.transfer_date && claim.provider_name && (
                    <p className="text-body text-muted-foreground">{claim.provider_name}</p>
                  )}
                </div>
              </div>
              <Button variant="secondary" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
            </Button>
          )}

          {/* Related Appointment */}
          {claim.appointment_id && (
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between px-6 py-4 h-auto rounded-none text-left transition-colors hover:bg-accent"
              onClick={() => router.visit(`/appointments/${claim.appointment_id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-icon-bg">
                  <Calendar className="h-5 w-5 text-icon" />
                </div>
                <div>
                  <p className="text-label text-muted-foreground">Related Appointment</p>
                  <p className="mt-0.5 text-card-title text-foreground">
                    {claim.treatment_name}
                  </p>
                  {(doctor || appointment?.date) && (
                    <p className="text-body text-muted-foreground">
                      {doctor?.name}
                      {doctor && appointment?.date && ' \u00B7 '}
                      {appointment?.date && formatDate(appointment.date)}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="secondary" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
            </Button>
          )}
          </div>
        </Section>

        {/* Financial Summary */}
        {fin && (
          <Section id="financial" title="Financial Summary" icon={IndianRupee} noPadding>
            <div className="divide-y">
                {fin.preauth_requested != null && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-body text-muted-foreground">
                      {hasEnhancements ? 'Original pre-auth' : 'Pre-auth requested'}
                    </span>
                    <span className="text-label text-foreground">
                      {formatCurrency(fin.preauth_requested)}
                    </span>
                  </div>
                )}
                {fin.preauth_approved != null && !hasEnhancements && (
                  <div className="flex items-center justify-between bg-success/10 px-6 py-4">
                    <span className="text-label text-success">Pre-auth approved</span>
                    <span className="text-label text-success">
                      {formatCurrency(fin.preauth_approved)}
                    </span>
                  </div>
                )}

                {/* Multiple Enhancements */}
                {hasEnhancements && fin.enhancements!.map((enh, idx) => (
                  <div
                    key={enh.id}
                    className={`flex items-center justify-between px-6 py-4 ${
                      enh.status === 'approved' ? 'bg-success/10' : enh.status === 'rejected' ? 'bg-destructive/10' : ''
                    }`}
                  >
                    <span className={`${
                      enh.status === 'approved' ? 'text-label text-success'
                        : enh.status === 'rejected' ? 'text-label text-destructive'
                          : 'text-body text-muted-foreground'
                    }`}>
                      Enhancement {idx + 1} ({enh.status})
                    </span>
                    <span className={`text-label ${
                      enh.status === 'approved' ? 'text-success'
                        : enh.status === 'rejected' ? 'text-destructive'
                          : 'text-warning'
                    }`}>
                      {formatCurrency(enh.amount)}
                    </span>
                  </div>
                ))}
                {hasEnhancements && fin.total_approved != null && (
                  <div className="flex items-center justify-between bg-success/10 px-6 py-4">
                    <span className="text-label text-success">Total approved</span>
                    <span className="text-label text-success">
                      {formatCurrency(fin.total_approved)}
                    </span>
                  </div>
                )}

                {fin.not_covered != null && fin.not_covered > 0 && (
                  <div className="flex items-center justify-between bg-destructive/10 px-6 py-4">
                    <span className="text-label text-destructive">Not covered</span>
                    <span className="text-label text-destructive">
                      {formatCurrency(fin.not_covered)}
                    </span>
                  </div>
                )}

                {/* Single enhancement (legacy) */}
                {!hasEnhancements && fin.enhancement_requested != null && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-body text-muted-foreground">Enhancement requested</span>
                    <span className="text-label text-warning">
                      {formatCurrency(fin.enhancement_requested)}
                    </span>
                  </div>
                )}
                {!hasEnhancements && fin.enhancement_approved != null && (
                  <div className="flex items-center justify-between bg-success/10 px-6 py-4">
                    <span className="text-label text-success">Enhancement approved</span>
                    <span className="text-label text-success">
                      {formatCurrency(fin.enhancement_approved)}
                    </span>
                  </div>
                )}

                {fin.current_bill != null && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-body text-muted-foreground">Current bill</span>
                    <span className="text-label text-foreground">
                      {formatCurrency(fin.current_bill)}
                    </span>
                  </div>
                )}

                {fin.insurance_covered != null && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-body text-muted-foreground">Insurance covered</span>
                    <span className="text-label text-foreground">
                      {formatCurrency(fin.insurance_covered)}
                    </span>
                  </div>
                )}

                {/* Deductions */}
                {fin.deductions && fin.deductions.length > 0 && (
                  <>
                    <div className="flex items-center justify-between bg-destructive/10 px-6 py-4">
                      <span className="text-label text-destructive">Deductions</span>
                      <span className="text-label text-destructive">
                        -{formatCurrency(fin.deductions.reduce((sum, d) => sum + d.amount, 0))}
                      </span>
                    </div>
                    {fin.deductions.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between px-6 py-2.5 pl-10">
                        <span className="text-body text-muted-foreground">{d.label}</span>
                        <span className="text-label text-destructive">{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Co-pay */}
                {fin.copay_percentage != null && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <span className="text-body text-muted-foreground">Co-pay ({fin.copay_percentage}%)</span>
                    <span className="text-label text-foreground">
                      {fin.copay_amount != null ? formatCurrency(fin.copay_amount) : '-'}
                    </span>
                  </div>
                )}

                {/* You Paid — bold dark row */}
                {fin.patient_paid != null && (
                  <div className="flex items-center justify-between bg-foreground px-6 py-4">
                    <span className="text-card-title text-white">You paid</span>
                    <span className="text-subheading text-white">
                      {formatCurrency(fin.patient_paid)}
                    </span>
                  </div>
                )}

                {/* Estimated remaining (in-treatment) */}
                {isInTreatment && fin.estimated_remaining != null && (
                  <>
                    <div className="flex items-center justify-between px-6 py-4">
                      <span className="text-body text-muted-foreground">Estimated remaining</span>
                      <span className="text-label text-muted-foreground">
                        {formatCurrency(fin.estimated_remaining)}
                      </span>
                    </div>
                    {fin.estimated_out_of_pocket != null && (
                      <div className="flex items-center justify-between px-6 py-4">
                        <span className="text-body text-muted-foreground">Estimated out-of-pocket</span>
                        <span className="text-label text-muted-foreground">
                          {formatCurrency(fin.estimated_out_of_pocket)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {fin.refunded != null && fin.refunded > 0 && (
                  <div className="flex items-center justify-between bg-success/10 px-6 py-4">
                    <span className="text-label text-success">Refunded</span>
                    <span className="text-label text-success">
                      {formatCurrency(fin.refunded)}
                    </span>
                  </div>
                )}
            </div>
          </Section>
        )}

        {/* Documents Section */}
        <Section
          id="documents"
          title="Documents"
          icon={FolderOpen}
          noPadding
          action={
            claim.documents.length > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                className="text-body"
                onClick={() => {
                  const docList = claim.documents.map(d => `<div class="row"><span class="row-label">${d.type}</span><span class="row-value">${d.date}</span></div>`).join('');
                  downloadAsHtml(`claim-documents-${claim.claim_reference}.pdf`, `
                    <h1>Claim Documents</h1>
                    <p class="subtitle">${claim.claim_reference} &middot; ${claim.treatment_name}</p>
                    <h2>Documents</h2>
                    ${docList}
                    <p style="margin-top:16px;font-size:12px;color:#6b7280">In production, actual document files would be downloaded here.</p>
                  `);
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Download All
              </Button>
            ) : undefined
          }
        >
          {claim.documents.length === 0 ? (
            <div className="px-6 py-6 text-center">
              <p className="text-label text-foreground">No documents uploaded</p>
              <p className="mt-1 text-body text-muted-foreground">Upload supporting documents for this claim</p>
            </div>
          ) : (
            <div className="divide-y">
              {claim.documents.map((doc, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="flex w-full items-center justify-between px-6 py-4 h-auto rounded-none text-left transition-colors hover:bg-accent"
                  onClick={() => {
                    downloadAsHtml(`${doc.type.replace(/\s+/g, '-').toLowerCase()}-${claim.claim_reference}.pdf`, `
                      <h1>${doc.type}</h1>
                      <p class="subtitle">${claim.claim_reference} &middot; ${doc.date}</p>
                      <p>Document: ${doc.filename ?? doc.type}</p>
                      <p style="margin-top:16px;font-size:12px;color:#6b7280">In production, the actual document file would be downloaded here.</p>
                    `);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-label text-foreground">{doc.type}</p>
                      <p className="text-body text-muted-foreground">{doc.date}</p>
                    </div>
                  </div>
                  <Download className="h-4 w-4 flex-shrink-0 text-foreground" />
                </Button>
              ))}
            </div>
          )}
        </Section>

        {/* Timeline Section */}
        <Section
          id="timeline"
          title="Timeline"
          icon={Clock}
          noPadding
          action={
            lastUpdatedDate ? (
              <span className="text-body text-muted-foreground">Last Updated: {lastUpdatedDate}</span>
            ) : undefined
          }
        >
          {claim.timeline.length === 0 ? (
            <div className="px-6 py-6 text-center">
              <p className="text-label text-foreground">No timeline events</p>
              <p className="mt-1 text-body text-muted-foreground">Timeline updates will appear here as your claim progresses</p>
            </div>
            ) : (
              <div className="px-6 py-4">
                {/* Last updated on mobile */}
                {lastUpdatedDate && (
                  <p className="mb-3 text-body text-muted-foreground md:hidden">
                    Last Updated: {lastUpdatedDate}
                  </p>
                )}

                {useMonthGroups && timelineGroups ? (
                  // Grouped by month
                  <div className="space-y-5">
                    {timelineGroups.map((group) => (
                      <div key={group.month}>
                        <h3 className="mb-3 text-overline text-muted-foreground">
                          {group.month}
                        </h3>
                        <div className="relative ml-3">
                          {group.events.map(({ event, globalIdx }, localIdx) => (
                            <TimelineEventRow
                              key={globalIdx}
                              event={event}
                              isLast={localIdx === group.events.length - 1}
                              isExpanded={expandedTimeline.includes(globalIdx)}
                              onToggle={() => toggleTimelineDetails(globalIdx)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Flat list
                  <div className="relative ml-3">
                    {claim.timeline
                      .slice(0, showAllTimeline ? undefined : 10)
                      .map((event, idx) => (
                        <TimelineEventRow
                          key={idx}
                          event={event}
                          isLast={
                            showAllTimeline
                              ? idx === claim.timeline.length - 1
                              : idx === Math.min(9, claim.timeline.length - 1)
                          }
                          isExpanded={expandedTimeline.includes(idx)}
                          onToggle={() => toggleTimelineDetails(idx)}
                        />
                      ))}
                  </div>
                )}

                {/* Show all button (when truncated) */}
                {!useMonthGroups && !showAllTimeline && claim.timeline.length > 10 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-4 w-full h-auto p-0 text-center text-label text-primary hover:text-primary"
                    onClick={() => setShowAllTimeline(true)}
                  >
                    Show all {claim.timeline.length} events
                  </Button>
                )}
              </div>
            )}
        </Section>

          </div>{/* End of flex-1 content area */}
        </div>{/* End of flex container */}

      </div>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={`${claim.treatment_name} - ${claim.claim_reference}`}
        description={`${claim.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · ${formatCurrency(claim.claim_amount)}${claim.claim_date ? ` · ${formatDate(claim.claim_date)}` : ''}`}
        url={window.location.href}
      />
    </AppLayout>
  );
}
