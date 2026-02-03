import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Toast } from '@/Components/ui/toast';
import { EmptyState } from '@/Components/ui/empty-state';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { downloadAsHtml } from '@/Lib/download';
import { ShareSheet } from '@/Components/ui/share-sheet';
import {
  ChevronRight,
  Share2,
  ChevronDown,
  Download,
  FileText,
  User,
  Stethoscope,
  BedDouble,
  DoorOpen,
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

function SideNav({ hasFinancial }: { hasFinancial: boolean }) {
  const [activeSection, setActiveSection] = useState('overview');
  const isScrollingRef = useRef(false);
  const visibleSections = hasFinancial
    ? SECTIONS
    : SECTIONS.filter((s) => s.id !== 'financial');

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
    <div className="w-48 flex-shrink-0 hidden lg:block">
      <div className="sticky top-6 space-y-1">
        {visibleSections.map(({ id, label, icon: SectionIcon }) => {
          const isActive = activeSection === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-all text-left rounded-full cursor-pointer',
                isActive
                  ? 'bg-[#F5F8FF] text-[#0052FF]'
                  : 'text-[#0A0B0D] hover:bg-muted'
              )}
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

/* ─── Section Wrapper ─── */

function Section({
  id,
  title,
  icon: SectionIcon,
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
      <Card className={noPadding ? '' : 'p-6'}>
        {children}
      </Card>
    </div>
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const avatarColors = [
  { bg: '#DBEAFE', text: '#1E40AF' },
  { bg: '#FCE7F3', text: '#9D174D' },
  { bg: '#D1FAE5', text: '#065F46' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#EDE9FE', text: '#5B21B6' },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
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

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'orange' | 'purple';

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    current: { label: 'In Treatment', variant: 'default' },
    processing: { label: 'In Treatment', variant: 'default' },
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    partially_approved: { label: 'Partially Approved', variant: 'warning' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    expired: { label: 'Expired', variant: 'secondary' },
    enhancement_required: { label: 'Enhancement Required', variant: 'warning' },
    enhancement_in_progress: { label: 'Enhancement In Progress', variant: 'warning' },
    enhancement_approved: { label: 'Enhancement Approved', variant: 'success' },
    enhancement_rejected: { label: 'Enhancement Rejected', variant: 'destructive' },
    dispute_under_review: { label: 'Dispute Under Review', variant: 'orange' },
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
  dotColor: string;
  bg: string;
  border: string;
  textColor: string;
  title: string;
  subtitle?: string;
  breakdown?: string;
  action?: { label: string; toastMsg: string };
}

function getBannerConfig(claim: ClaimData): BannerConfig {
  const f = claim.financial;
  const s = claim.status;

  switch (s) {
    case 'pending':
      return {
        dotColor: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        textColor: 'text-yellow-800',
        title: f?.preauth_requested
          ? `Pre-authorization for ${formatCurrency(f.preauth_requested)} is in progress`
          : 'Claim submitted. Under review.',
        subtitle: claim.claim_date_formatted
          ? `Submitted on ${claim.claim_date_formatted}. Usually approved within 4-6 hours.`
          : 'Usually approved within 4-6 hours.',
      };

    case 'approved':
      return {
        dotColor: 'bg-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        textColor: 'text-green-800',
        title: f?.preauth_approved
          ? `Pre-authorization approved for ${formatCurrency(f.preauth_approved)}`
          : 'Pre-authorization approved.',
        subtitle: claim.claim_date_formatted
          ? `Approved on ${claim.claim_date_formatted}. You can proceed with cashless treatment.`
          : 'You can proceed with cashless treatment.',
      };

    case 'partially_approved':
      return {
        dotColor: 'bg-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-800',
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
        dotColor: 'bg-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        textColor: 'text-red-800',
        title: claim.claim_date_formatted
          ? `Pre-authorisation rejected on ${claim.claim_date_formatted}`
          : 'Pre-authorisation rejected.',
        subtitle: claim.rejection_reason ?? undefined,
        action: { label: 'Try Different Policy', toastMsg: 'Redirecting to policies...' },
      };

    case 'expired':
      return {
        dotColor: 'bg-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        textColor: 'text-red-800',
        title: claim.claim_date_formatted
          ? `Pre-authorization expired on ${claim.claim_date_formatted}`
          : 'Pre-authorization expired.',
        subtitle: 'This approval was valid for 30 days. Submit a new request to proceed.',
        action: { label: 'Request New Pre-Auth', toastMsg: 'Submitting pre-auth request...' },
      };

    case 'enhancement_required':
      return {
        dotColor: 'bg-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-800',
        title: 'Enhancement required',
        subtitle:
          f?.current_bill && f?.original_approved
            ? `Day ${claim.stay_details?.days ?? '?'} of treatment. Treatment is exceeding approved amount.`
            : 'Additional pre-auth needed to continue cashless.',
        breakdown:
          f?.original_approved != null && f?.current_bill != null && f?.enhancement_requested != null
            ? `Originally approved: ${formatCurrency(f.original_approved)} · Current bill: ${formatCurrency(f.current_bill)} · Enhancement requested: ${formatCurrency(f.enhancement_requested)}`
            : undefined,
        action: { label: 'Request Enhancement', toastMsg: 'Submitting enhancement request...' },
      };

    case 'enhancement_in_progress':
      return {
        dotColor: 'bg-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-800',
        title: 'Enhancement request in progress',
        subtitle: f?.enhancement_requested
          ? `Requested ${formatCurrency(f.enhancement_requested)} additional coverage.`
          : 'Enhancement request submitted.',
        breakdown:
          f?.original_approved != null && f?.enhancement_requested != null
            ? `Original: ${formatCurrency(f.original_approved)} · Requested enhancement: ${formatCurrency(f.enhancement_requested)}`
            : undefined,
      };

    case 'enhancement_approved':
      return {
        dotColor: 'bg-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        textColor: 'text-green-800',
        title: 'Enhancement approved!',
        subtitle:
          f?.enhancement_approved != null && f?.original_approved != null
            ? `${formatCurrency(f.enhancement_approved)} additional coverage approved. Total now ${formatCurrency(f.original_approved + f.enhancement_approved)}.`
            : 'Additional coverage approved.',
      };

    case 'enhancement_rejected':
      return {
        dotColor: 'bg-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        textColor: 'text-red-800',
        title: 'Enhancement request rejected',
        subtitle: claim.rejection_reason ?? undefined,
      };

    case 'current':
    case 'processing':
      return {
        dotColor: 'bg-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        textColor: 'text-blue-800',
        title: f?.preauth_approved
          ? `${formatCurrency(f.preauth_approved)} pre-auth approved. Treatment in progress.`
          : 'Treatment in progress.',
      };

    case 'settled':
      return {
        dotColor: 'bg-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        textColor: 'text-green-800',
        title: claim.claim_date_formatted
          ? `Claim settled on ${claim.claim_date_formatted}`
          : 'Claim settled.',
        subtitle:
          f?.insurance_covered != null && f?.patient_paid != null
            ? `Final settlement: ${formatCurrency(f.insurance_covered)} covered by insurance. You paid ${formatCurrency(f.patient_paid)}.`
            : undefined,
        action: { label: 'Raise Dispute', toastMsg: 'Submitting dispute...' },
      };

    case 'dispute_under_review':
      return {
        dotColor: 'bg-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textColor: 'text-amber-800',
        title: 'Settlement disputed under review',
        subtitle: (claim.rejection_reason ?? 'Your dispute is being reviewed.') + ' Expected resolution: 5-7 days.',
      };

    case 'dispute_resolved':
      return {
        dotColor: 'bg-green-500',
        bg: 'bg-green-50',
        border: 'border-green-200',
        textColor: 'text-green-800',
        title: claim.claim_date_formatted
          ? `Dispute resolved on ${claim.claim_date_formatted}`
          : 'Dispute resolved.',
        subtitle: f?.refunded
          ? `${formatCurrency(f.refunded)} has been refunded to your account.`
          : undefined,
      };

    default:
      return {
        dotColor: 'bg-yellow-500',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        textColor: 'text-yellow-800',
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
      dotClass = 'bg-green-500';
      break;
    case 'current':
      dotClass = 'bg-blue-500';
      dotExtra = 'ring-4 ring-blue-100';
      break;
    case 'warning':
      dotClass = 'bg-yellow-500';
      break;
    case 'rejected':
      dotClass = 'bg-red-500';
      break;
    default:
      dotClass = 'bg-gray-300';
      break;
  }

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast && (
        <div className="absolute left-[5px] top-[14px] h-full w-px bg-gray-200" />
      )}
      <div
        className={`relative z-10 mt-[5px] h-[11px] w-[11px] flex-shrink-0 rounded-full ${dotClass} ${dotExtra}`}
      />
      <div className="flex-1 min-w-0">
        <div
          className={`flex items-center gap-1.5 ${hasDetails ? 'cursor-pointer' : ''}`}
          onClick={hasDetails ? onToggle : undefined}
        >
          <p
            className={`text-sm font-medium ${
              event.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
            }`}
          >
            {event.event}
          </p>
          {hasDetails && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
        {event.date && (
          <p className="text-xs text-gray-500">{event.date}</p>
        )}
        {event.note && (
          <p className="mt-0.5 text-xs italic text-gray-500">{event.note}</p>
        )}
        {hasDetails && isExpanded && (
          <div className="mt-2 rounded-lg border bg-gray-50 px-3 py-2">
            {Object.entries(event.details!).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-1 text-xs">
                <span className="text-gray-500">{key}</span>
                <span className="font-medium text-gray-700">{value}</span>
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
    <div className="w-full max-w-[960px]" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
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
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState<number[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showAllTimeline, setShowAllTimeline] = useState(false);

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

  const banner = getBannerConfig(claim);
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Download claim summary */}
        <DropdownMenuItem onClick={() => {
          const f = claim.financial;
          downloadAsHtml(`claim-${claim.claim_reference}.html`, `
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
        <DropdownMenuItem onClick={() => setShowShareSheet(true)}>
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
      <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-6 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{claim.claim_reference}</span>
            {getStatusBadge(claim.status)}
          </div>
          <ThreeDotMenu />
        </div>
      </div>

      <div className="w-full max-w-[960px]" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
          <button
            onClick={() => router.visit('/insurance')}
            className="font-medium hover:text-gray-900"
          >
            Insurance
          </button>
          <ChevronRight className="h-3.5 w-3.5" />
          {claim.policy_id && claim.policy_plan_name ? (
            <>
              <button
                onClick={() => router.visit(`/insurance/${claim.policy_id}`)}
                className="font-medium hover:text-gray-900"
              >
                {claim.policy_plan_name}
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          ) : null}
          <span className="text-gray-400">{claim.claim_reference}</span>
        </div>

        {/* Header with three-dot menu */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                {(() => {
                  const TreatmentIcon = getTreatmentIcon(claim.procedure_type);
                  return (
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: '#BFDBFE' }}
                    >
                      <TreatmentIcon className="h-5 w-5" style={{ color: '#1E40AF' }} />
                    </div>
                  );
                })()}
                <h1 className="text-2xl font-bold text-gray-900">{claim.treatment_name}</h1>
                {claim.procedure_type && (
                  <Badge variant="secondary">
                    {claim.procedure_type}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                {claim.provider_name && <span>{claim.provider_name}</span>}
                {claim.claim_date_formatted && (
                  <>
                    <span>&middot;</span>
                    <span>{claim.claim_date_formatted}</span>
                  </>
                )}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(claim.status)}
              <Button onClick={() => document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <Clock className="h-4 w-4" />
                Check Status
              </Button>
              <ThreeDotMenu />
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-8 rounded-xl border px-4 py-3 ${banner.bg} ${banner.border}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${banner.dotColor}`}
              />
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${banner.textColor}`}>{banner.title}</p>
                {banner.subtitle && (
                  <p className={`mt-0.5 text-sm ${banner.textColor} opacity-80`}>
                    {banner.subtitle}
                  </p>
                )}
                {banner.breakdown && (
                  <p className={`mt-1.5 text-xs font-medium ${banner.textColor} opacity-70`}>
                    {banner.breakdown}
                  </p>
                )}
              </div>
            </div>
            {banner.action && (
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 h-8 text-xs"
                onClick={() => {
                  const label = banner.action!.label;
                  if (label === 'Accept') {
                    if (confirm('Accept the partially approved amount?')) {
                      router.post(`/insurance/claims/${claim.id}/accept`, {}, {
                        onSuccess: () => toast('Claim accepted successfully'),
                        onError: () => toast('Failed to accept claim'),
                      });
                    }
                  } else if (label === 'Try Different Policy') {
                    router.visit('/insurance');
                  } else if (label === 'Request New Pre-Auth') {
                    router.post(`/insurance/claims/${claim.id}/new-preauth`, {}, {
                      onSuccess: () => toast('New pre-authorization request submitted'),
                      onError: () => toast('Failed to submit request'),
                    });
                  } else if (label === 'Request Enhancement') {
                    router.post(`/insurance/claims/${claim.id}/enhancement`, {}, {
                      onSuccess: () => toast('Enhancement request submitted'),
                      onError: () => toast('Failed to submit enhancement request'),
                    });
                  } else if (label === 'Raise Dispute') {
                    if (confirm('Are you sure you want to raise a dispute for this settled claim?')) {
                      router.post(`/insurance/claims/${claim.id}/dispute`, {}, {
                        onSuccess: () => toast('Dispute submitted successfully'),
                        onError: () => toast('Failed to submit dispute'),
                      });
                    }
                  } else {
                    toast(banner.action!.toastMsg);
                  }
                }}
              >
                {banner.action.label}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content with Side Nav */}
        <div className="flex gap-8">
          <SideNav hasFinancial={!!fin} />
          <div className="flex-1 min-w-0 space-y-8 pb-12">

        {/* Overview Section */}
        <Section id="overview" title="Overview" icon={ClipboardList} noPadding>
          <div className="divide-y">
            {/* Patient */}
            <div className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex w-24 flex-shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500">
                <User className="h-3.5 w-3.5" />
                Patient
              </div>
              <button
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (claim.family_member_id) {
                    router.visit(`/family-members/${claim.family_member_id}`);
                  }
                }}
                disabled={!claim.family_member_id}
              >
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                  style={{
                    backgroundColor: getAvatarColor(patient.name).bg,
                    color: getAvatarColor(patient.name).text,
                  }}
                >
                  {getInitials(patient.name)}
                </div>
                <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                {patient.relation !== 'self' && (
                  <span className="text-xs capitalize text-gray-500">({patient.relation})</span>
                )}
              </button>
            </div>

            {/* Doctor */}
            <div className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex w-24 flex-shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500">
                <Stethoscope className="h-3.5 w-3.5" />
                Doctor
              </div>
              {doctor ? (
                <div className="flex items-center gap-2.5 text-sm">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      backgroundColor: getAvatarColor(doctor.name).bg,
                      color: getAvatarColor(doctor.name).text,
                    }}
                  >
                    {getInitials(doctor.name)}
                  </div>
                  <span className="font-medium text-gray-900">{doctor.name}</span>
                  <span className="text-gray-400">&middot;</span>
                  <span className="text-gray-500">{doctor.specialization}</span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">N/A</span>
              )}
            </div>

            {/* Stay */}
            <div className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex w-24 flex-shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500">
                <BedDouble className="h-3.5 w-3.5" />
                Stay
              </div>
              {isOutpatient ? (
                <span className="text-sm font-medium text-gray-900">Outpatient</span>
              ) : (
                <div className="flex items-center gap-1.5 text-sm flex-wrap">
                  <span className="font-medium text-gray-900">{stay!.days} Days</span>
                  {isOngoing && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      Ongoing
                    </Badge>
                  )}
                  {stay!.admission_date && (
                    <>
                      <span className="text-gray-400">&middot;</span>
                      <span className="text-gray-500">
                        {stay!.admission_date}
                        {stay!.discharge_date ? ` — ${stay!.discharge_date}` : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Room */}
            {!isOutpatient && (
              <div className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex w-24 flex-shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500">
                  <DoorOpen className="h-3.5 w-3.5" />
                  Room
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium text-gray-900">{stay!.room_type ?? 'General'}</span>
                  {stay!.room_number && (
                    <>
                      <span className="text-gray-400">&middot;</span>
                      <span className="text-gray-500">#{stay!.room_number}</span>
                    </>
                  )}
                  {stay!.daily_rate && (
                    <>
                      <span className="text-gray-400">&middot;</span>
                      <span className="text-gray-500">{formatCurrency(stay!.daily_rate)}/day</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Linked Section */}
        <Section id="linked" title="Linked" icon={Link2} noPadding>
          <div className="divide-y">

          {/* Original Policy (if transferred) */}
          {claim.original_policy_id && claim.original_policy_plan_name && (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Insurance Plan (Original)</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-400 line-through">
                    {claim.original_policy_plan_name}
                  </p>
                  <Badge variant="secondary" className="text-[10px]">
                    Expired
                  </Badge>
                </div>
                {claim.original_policy_expired_date && (
                  <p className="text-xs text-gray-400">Expired {claim.original_policy_expired_date}</p>
                )}
              </div>
            </div>
          )}

          {/* Current Insurance Plan */}
          {claim.policy_id && claim.policy_plan_name && (
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
              onClick={() => router.visit(`/insurance/${claim.policy_id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Insurance Plan{claim.original_policy_id ? ' (Current)' : ''}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {claim.policy_plan_name}
                  </p>
                  {claim.transfer_date && (
                    <p className="text-xs text-gray-500">Transferred on {claim.transfer_date}</p>
                  )}
                  {!claim.transfer_date && claim.provider_name && (
                    <p className="text-xs text-gray-500">{claim.provider_name}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
          )}

          {/* Related Appointment */}
          {claim.appointment_id && (
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
              onClick={() => router.visit(`/appointments/${claim.appointment_id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-50">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Related Appointment</p>
                  <p className="mt-0.5 text-sm font-semibold text-gray-900">
                    {claim.treatment_name}
                  </p>
                  {(doctor || appointment?.date_formatted) && (
                    <p className="text-xs text-gray-500">
                      {doctor?.name}
                      {doctor && appointment?.date_formatted && ' \u00B7 '}
                      {appointment?.date_formatted}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
          )}
          </div>
        </Section>

        {/* Financial Summary */}
        {fin && (
          <Section id="financial" title="Financial Summary" icon={IndianRupee} noPadding>
            <div className="divide-y">
                {fin.preauth_requested != null && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-600">
                      {hasEnhancements ? 'Original pre-auth' : 'Pre-auth requested'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(fin.preauth_requested)}
                    </span>
                  </div>
                )}
                {fin.preauth_approved != null && !hasEnhancements && (
                  <div className="flex items-center justify-between bg-green-50 px-5 py-3.5">
                    <span className="text-sm font-medium text-green-700">Pre-auth approved</span>
                    <span className="text-sm font-bold text-green-700">
                      {formatCurrency(fin.preauth_approved)}
                    </span>
                  </div>
                )}

                {/* Multiple Enhancements */}
                {hasEnhancements && fin.enhancements!.map((enh, idx) => (
                  <div
                    key={enh.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${
                      enh.status === 'approved' ? 'bg-green-50' : enh.status === 'rejected' ? 'bg-red-50' : ''
                    }`}
                  >
                    <span className={`text-sm ${
                      enh.status === 'approved' ? 'font-medium text-green-700'
                        : enh.status === 'rejected' ? 'font-medium text-red-600'
                          : 'text-gray-600'
                    }`}>
                      Enhancement {idx + 1} ({enh.status})
                    </span>
                    <span className={`text-sm font-bold ${
                      enh.status === 'approved' ? 'text-green-700'
                        : enh.status === 'rejected' ? 'text-red-600'
                          : 'text-amber-700'
                    }`}>
                      {formatCurrency(enh.amount)}
                    </span>
                  </div>
                ))}
                {hasEnhancements && fin.total_approved != null && (
                  <div className="flex items-center justify-between bg-green-50 px-5 py-3.5">
                    <span className="text-sm font-medium text-green-700">Total approved</span>
                    <span className="text-sm font-bold text-green-700">
                      {formatCurrency(fin.total_approved)}
                    </span>
                  </div>
                )}

                {fin.not_covered != null && fin.not_covered > 0 && (
                  <div className="flex items-center justify-between bg-red-50 px-5 py-3.5">
                    <span className="text-sm font-medium text-red-600">Not covered</span>
                    <span className="text-sm font-bold text-red-600">
                      {formatCurrency(fin.not_covered)}
                    </span>
                  </div>
                )}

                {/* Single enhancement (legacy) */}
                {!hasEnhancements && fin.enhancement_requested != null && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-600">Enhancement requested</span>
                    <span className="text-sm font-semibold text-amber-700">
                      {formatCurrency(fin.enhancement_requested)}
                    </span>
                  </div>
                )}
                {!hasEnhancements && fin.enhancement_approved != null && (
                  <div className="flex items-center justify-between bg-green-50 px-5 py-3.5">
                    <span className="text-sm font-medium text-green-700">Enhancement approved</span>
                    <span className="text-sm font-bold text-green-700">
                      {formatCurrency(fin.enhancement_approved)}
                    </span>
                  </div>
                )}

                {fin.current_bill != null && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-600">Current bill</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(fin.current_bill)}
                    </span>
                  </div>
                )}

                {fin.insurance_covered != null && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-600">Insurance covered</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(fin.insurance_covered)}
                    </span>
                  </div>
                )}

                {/* Deductions */}
                {fin.deductions && fin.deductions.length > 0 && (
                  <>
                    <div className="flex items-center justify-between bg-red-50 px-5 py-3.5">
                      <span className="text-sm font-medium text-red-600">Deductions</span>
                      <span className="text-sm font-bold text-red-600">
                        -{formatCurrency(fin.deductions.reduce((sum, d) => sum + d.amount, 0))}
                      </span>
                    </div>
                    {fin.deductions.map((d, idx) => (
                      <div key={idx} className="flex items-center justify-between px-5 py-2.5 pl-9">
                        <span className="text-xs text-gray-500">{d.label}</span>
                        <span className="text-xs font-medium text-red-500">{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Co-pay */}
                {fin.copay_percentage != null && (
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-gray-600">Co-pay ({fin.copay_percentage}%)</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {fin.copay_amount != null ? formatCurrency(fin.copay_amount) : '-'}
                    </span>
                  </div>
                )}

                {/* You Paid — bold dark row */}
                {fin.patient_paid != null && (
                  <div className="flex items-center justify-between bg-gray-900 px-5 py-4">
                    <span className="text-sm font-semibold text-white">You paid</span>
                    <span className="text-base font-bold text-white">
                      {formatCurrency(fin.patient_paid)}
                    </span>
                  </div>
                )}

                {/* Estimated remaining (in-treatment) */}
                {isInTreatment && fin.estimated_remaining != null && (
                  <>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-sm text-gray-500">Estimated remaining</span>
                      <span className="text-sm font-medium text-gray-600">
                        {formatCurrency(fin.estimated_remaining)}
                      </span>
                    </div>
                    {fin.estimated_out_of_pocket != null && (
                      <div className="flex items-center justify-between px-5 py-3.5">
                        <span className="text-sm text-gray-500">Estimated out-of-pocket</span>
                        <span className="text-sm font-medium text-gray-600">
                          {formatCurrency(fin.estimated_out_of_pocket)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {fin.refunded != null && fin.refunded > 0 && (
                  <div className="flex items-center justify-between bg-green-50 px-5 py-3.5">
                    <span className="text-sm font-medium text-green-700">Refunded</span>
                    <span className="text-sm font-bold text-green-700">
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
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  const docList = claim.documents.map(d => `<div class="row"><span class="row-label">${d.type}</span><span class="row-value">${d.date}</span></div>`).join('');
                  downloadAsHtml(`claim-documents-${claim.claim_reference}.html`, `
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
            <div className="p-6">
              <EmptyState icon={FileText} message="No documents uploaded" description="Upload supporting documents for this claim" />
            </div>
          ) : (
            <div className="divide-y">
              {claim.documents.map((doc, idx) => (
                <button
                  key={idx}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() => {
                    downloadAsHtml(`${doc.type.replace(/\s+/g, '-').toLowerCase()}-${claim.claim_reference}.html`, `
                      <h1>${doc.type}</h1>
                      <p class="subtitle">${claim.claim_reference} &middot; ${doc.date}</p>
                      <p>Document: ${doc.filename ?? doc.type}</p>
                      <p style="margin-top:16px;font-size:12px;color:#6b7280">In production, the actual document file would be downloaded here.</p>
                    `);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <FileText className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.type}</p>
                      <p className="text-xs text-gray-500">{doc.date}</p>
                    </div>
                  </div>
                  <Download className="h-4 w-4 flex-shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Timeline Section */}
        <Section
          id="timeline"
          title="Timeline"
          icon={Clock}
          action={
            lastUpdatedDate ? (
              <span className="text-xs text-gray-400">Last Updated: {lastUpdatedDate}</span>
            ) : undefined
          }
        >
          {claim.timeline.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Clock} message="No timeline events" />
            </div>
            ) : (
              <div className="px-5 py-4">
                {/* Last updated on mobile */}
                {lastUpdatedDate && (
                  <p className="mb-3 text-xs text-gray-400 md:hidden">
                    Last Updated: {lastUpdatedDate}
                  </p>
                )}

                {useMonthGroups && timelineGroups ? (
                  // Grouped by month
                  <div className="space-y-5">
                    {timelineGroups.map((group) => (
                      <div key={group.month}>
                        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
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
                  <button
                    className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                    onClick={() => setShowAllTimeline(true)}
                  >
                    Show all {claim.timeline.length} events
                  </button>
                )}
              </div>
            )}
        </Section>

          </div>{/* End of flex-1 content area */}
        </div>{/* End of flex container */}
      </div>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />

      <ShareSheet
        open={showShareSheet}
        onOpenChange={setShowShareSheet}
        title={`${claim.treatment_name} - ${claim.claim_reference}`}
        description={`${claim.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} · ${formatCurrency(claim.claim_amount)}${claim.claim_date_formatted ? ` · ${claim.claim_date_formatted}` : ''}`}
        url={window.location.href}
      />
    </AppLayout>
  );
}
