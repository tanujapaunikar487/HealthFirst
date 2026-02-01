import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Toast } from '@/Components/ui/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  ChevronRight,
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
} from 'lucide-react';

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

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    current: { label: 'In Treatment', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    processing: { label: 'In Treatment', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    approved: { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200' },
    partially_approved: { label: 'Partially Approved', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
    expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600 border-gray-200' },
    enhancement_required: { label: 'Enhancement Required', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    enhancement_in_progress: { label: 'Enhancement In Progress', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    enhancement_approved: { label: 'Enhancement Approved', className: 'bg-green-100 text-green-700 border-green-200' },
    enhancement_rejected: { label: 'Enhancement Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
    dispute_under_review: { label: 'Dispute Under Review', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    dispute_resolved: { label: 'Dispute Resolved', className: 'bg-green-100 text-green-700 border-green-200' },
    settled: { label: 'Settled', className: 'bg-green-100 text-green-700 border-green-200' },
  };
  const entry = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={entry.className}>
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
        action: { label: 'Accept', toastMsg: 'Accept coming soon' },
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
        action: { label: 'Try Different Policy', toastMsg: 'Try Different Policy coming soon' },
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
        action: { label: 'Request New Pre-Auth', toastMsg: 'Request New Pre-Auth coming soon' },
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
        action: { label: 'Request Enhancement', toastMsg: 'Request Enhancement coming soon' },
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
        action: { label: 'Raise Dispute', toastMsg: 'Raise Dispute coming soon' },
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

// --- Main Component ---

export default function ClaimDetail({ claim, patient, doctor, appointment }: Props) {
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
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
        {claim.documents.length > 0 && (
          <DropdownMenuItem onClick={() => toast('Download coming soon')}>
            <Download className="mr-2 h-4 w-4" />
            Download Documents
          </DropdownMenuItem>
        )}
        {isInTreatment && (
          <>
            <DropdownMenuItem onClick={() => toast('Contact TPA coming soon')}>
              <Phone className="mr-2 h-4 w-4" />
              Contact TPA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast('View Interim Bill coming soon')}>
              <Receipt className="mr-2 h-4 w-4" />
              View Interim Bill
            </DropdownMenuItem>
          </>
        )}
        {claim.status === 'settled' && (
          <DropdownMenuItem onClick={() => toast('Download Settlement Letter coming soon')}>
            <Download className="mr-2 h-4 w-4" />
            Download Settlement Letter
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

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

      <div className="mx-auto max-w-[960px] px-6 py-8">
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
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
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
              <ThreeDotMenu />
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`mb-6 rounded-xl border px-4 py-3 ${banner.bg} ${banner.border}`}>
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
                onClick={() => toast(banner.action!.toastMsg)}
              >
                {banner.action.label}
              </Button>
            )}
          </div>
        </div>

        {/* Overview Card */}
        <Card className="mb-6 p-0">
          <div className="border-b px-5 py-3.5" style={{ backgroundColor: '#FAFAFA' }}>
            <h2 className="text-sm font-semibold text-gray-900">Overview</h2>
          </div>
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
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-1.5 py-0">
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
        </Card>

        {/* Linked Section */}
        <Card className="mb-6 divide-y p-0">
          <div className="border-b px-5 py-3.5" style={{ backgroundColor: '#FAFAFA' }}>
            <h2 className="text-sm font-semibold text-gray-900">Linked</h2>
          </div>

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
                  <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">
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

        </Card>

        {/* Financial Summary */}
        {fin && (
          <div className="mb-6">
            <button
              className="mb-3 flex w-full items-center justify-between md:cursor-default"
              onClick={() => toggleSection('financial')}
            >
              <h2 className="text-base font-bold text-gray-900">Financial Summary</h2>
              <div className="flex items-center gap-2">
                {collapsedSections.has('financial') && financialPreview && (
                  <span className="text-sm font-bold text-green-700 md:hidden">{financialPreview}</span>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform md:hidden ${
                    collapsedSections.has('financial') ? '-rotate-90' : ''
                  }`}
                />
              </div>
            </button>
            <div className={collapsedSections.has('financial') ? 'hidden md:block' : ''}>
              <Card className="divide-y p-0 overflow-hidden">
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
              </Card>
            </div>
          </div>
        )}

        {/* Documents */}
        <Card className="mb-6 p-0">
          <button
            className="flex w-full items-center justify-between border-b px-5 py-3.5 md:cursor-default"
            style={{ backgroundColor: '#FAFAFA' }}
            onClick={() => toggleSection('documents')}
          >
            <h2 className="text-sm font-semibold text-gray-900">Documents</h2>
            <div className="flex items-center gap-2">
              {claim.documents.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:inline-flex h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast('Download coming soon');
                  }}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download All
                </Button>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform md:hidden ${
                  collapsedSections.has('documents') ? '-rotate-90' : ''
                }`}
              />
            </div>
          </button>
          <div className={collapsedSections.has('documents') ? 'hidden md:block' : ''}>
            {claim.documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mb-1 text-sm font-medium text-gray-600">No documents yet</p>
                <p className="max-w-xs text-center text-xs text-gray-400">
                  Documents will appear here as your treatment progresses.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {claim.documents.map((doc, idx) => (
                  <button
                    key={idx}
                    className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-gray-50"
                    onClick={() => toast('Download coming soon')}
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
          </div>
        </Card>

        {/* Timeline */}
        <Card className="mb-6 p-0">
          <button
            className="flex w-full items-center justify-between border-b px-5 py-3.5 md:cursor-default"
            style={{ backgroundColor: '#FAFAFA' }}
            onClick={() => toggleSection('timeline')}
          >
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="flex items-center gap-2">
              {lastUpdatedDate && (
                <span className="hidden md:inline text-xs text-gray-400">
                  Last Updated: {lastUpdatedDate}
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform md:hidden ${
                  collapsedSections.has('timeline') ? '-rotate-90' : ''
                }`}
              />
            </div>
          </button>
          <div className={collapsedSections.has('timeline') ? 'hidden md:block' : ''}>
            {claim.timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <p className="mb-1 text-sm font-medium text-gray-600">No activity yet</p>
                <p className="max-w-xs text-center text-xs text-gray-400">
                  Updates will appear here as your claim progresses.
                </p>
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
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {claim.status === 'partially_approved' && (
            <>
              <Button onClick={() => toast('Accept coming soon')}>Accept</Button>
              <Button variant="outline" onClick={() => toast('Request Enhancement coming soon')}>
                Request Enhancement
              </Button>
            </>
          )}
          {claim.status === 'rejected' && (
            <Button onClick={() => toast('Try Different Policy coming soon')}>
              Try Different Policy
            </Button>
          )}
          {claim.status === 'expired' && (
            <Button onClick={() => toast('Request New Pre-Auth coming soon')}>
              Request New Pre-Auth
            </Button>
          )}
          {claim.status === 'enhancement_required' && (
            <Button onClick={() => toast('View Enhancement Details coming soon')}>
              View Enhancement Details
            </Button>
          )}
          {claim.status === 'settled' && (
            <Button variant="outline" onClick={() => toast('Raise Dispute coming soon')}>
              Raise Dispute
            </Button>
          )}
          {claim.documents.length > 0 && (
            <Button variant="outline" onClick={() => toast('Download coming soon')}>
              <Download className="mr-1.5 h-4 w-4" />
              Download Documents
            </Button>
          )}
        </div>
      </div>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />
    </AppLayout>
  );
}
