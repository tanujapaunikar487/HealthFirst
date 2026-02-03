import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { EmptyState } from '@/Components/ui/empty-state';
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  FileText,
  Trash2,
  Users,
  Check,
  ClipboardList,
  Receipt,
  Share2,
  MoreVertical,
  Download,
  Star,
  Pencil,
} from '@/Lib/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { ShareSheet } from '@/Components/ui/share-sheet';

/* ─── Section Config ─── */

const SECTIONS = [
  { id: 'details', label: 'Details', icon: ClipboardList },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'claims', label: 'Claims', icon: Receipt },
] as const;

/* ─── Side Navigation ─── */

function SideNav() {
  const [activeSection, setActiveSection] = useState('details');
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
    <div className="w-48 flex-shrink-0 hidden lg:block">
      <div className="sticky top-6 space-y-1">
        {SECTIONS.map(({ id, label, icon: SectionIcon }) => {
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
  noPadding,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  noPadding?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon icon={SectionIcon} className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold" style={{ color: '#00184D' }}>
          {title}
        </h2>
      </div>
      <Card className={noPadding ? '' : 'p-6'}>
        {children}
      </Card>
    </div>
  );
}

interface PolicyDetail {
  id: number;
  provider_name: string;
  provider_logo: string | null;
  plan_name: string;
  policy_number: string;
  plan_type: string;
  sum_insured: number;
  premium_amount: number | null;
  start_date_formatted: string;
  end_date_formatted: string;
  is_expiring_soon: boolean;
  days_until_expiry: number;
  metadata: {
    icu_limit?: string;
    copay?: string;
    tpa?: string;
    tpa_contact?: string;
  };
}

interface CoveredMember {
  id: number;
  name: string;
  relation: string;
}

interface PolicyClaim {
  id: number;
  claim_date_formatted: string | null;
  treatment_name: string;
  patient_name: string;
  claim_amount: number;
  status: string;
}

interface Props {
  policy: PolicyDetail;
  coveredMembers: CoveredMember[];
  claims: PolicyClaim[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getProviderInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getMemberInitials(name: string): string {
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

const ROOM_TYPES = [
  { value: 'general', label: 'General Ward' },
  { value: 'semi_private', label: 'Semi-Private Room' },
  { value: 'private', label: 'Private Room' },
  { value: 'icu', label: 'ICU' },
];

type PreAuthStep = 'patient' | 'details' | 'review';

interface PreAuthForm {
  family_member_id: number | null;
  treatment_name: string;
  admission_date: string;
  discharge_date: string;
  room_type: string;
  estimated_cost: string;
  doctor_name: string;
  notes: string;
}

const EMPTY_PREAUTH_FORM: PreAuthForm = {
  family_member_id: null,
  treatment_name: '',
  admission_date: '',
  discharge_date: '',
  room_type: '',
  estimated_cost: '',
  doctor_name: '',
  notes: '',
};

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline' | 'orange' | 'purple';

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    current: { label: 'In Treatment', variant: 'orange' },
    processing: { label: 'In Treatment', variant: 'orange' },
    settled: { label: 'Settled', variant: 'success' },
    approved: { label: 'Settled', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    pending: { label: 'Pending', variant: 'warning' },
  };
  const entry = map[status] ?? map.pending;
  return (
    <Badge variant={entry.variant}>
      {entry.label}
    </Badge>
  );
}

function InsuranceShowSkeleton() {
  return (
    <div className="w-full max-w-[960px]" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      <Pulse className="h-4 w-24 mb-6" />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Pulse className="h-14 w-14 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Pulse className="h-7 w-56" />
            <Pulse className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Pulse className="h-10 w-36 rounded-lg" />
          <Pulse className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      {/* Policy details card */}
      <div className="rounded-xl border border-border p-6 mb-6 space-y-4">
        <Pulse className="h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Pulse className="h-4 w-28" />
              <Pulse className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      {/* Members */}
      <div className="rounded-xl border border-border p-6 mb-6">
        <Pulse className="h-5 w-36 mb-4" />
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <Pulse key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      </div>
      {/* Claims */}
      <div className="rounded-xl border border-border p-6 space-y-4">
        <Pulse className="h-5 w-40" />
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-xl">
            <Pulse className="h-10 w-10 rounded-xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Pulse className="h-4 w-40" />
              <Pulse className="h-3 w-24" />
            </div>
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsuranceShow({ policy, coveredMembers, claims }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(policy);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showPreAuth, setShowPreAuth] = useState(false);
  const [preAuthStep, setPreAuthStep] = useState<PreAuthStep>('patient');
  const [preAuthForm, setPreAuthForm] = useState<PreAuthForm>(EMPTY_PREAUTH_FORM);
  const [preAuthSubmitting, setPreAuthSubmitting] = useState(false);

  const toast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  function openPreAuth() {
    setPreAuthForm(EMPTY_PREAUTH_FORM);
    setPreAuthStep('patient');
    setShowPreAuth(true);
  }

  function handlePreAuthPatientSelect(memberId: number) {
    setPreAuthForm(f => ({ ...f, family_member_id: memberId }));
    setPreAuthStep('details');
  }

  function handlePreAuthDetailsNext() {
    setPreAuthStep('review');
  }

  function handlePreAuthSubmit() {
    setPreAuthSubmitting(true);
    router.post('/insurance/pre-auth', {
      policy_id: policy.id,
      family_member_id: preAuthForm.family_member_id,
      treatment_name: preAuthForm.treatment_name,
      admission_date: preAuthForm.admission_date,
      discharge_date: preAuthForm.discharge_date || undefined,
      room_type: preAuthForm.room_type,
      estimated_cost: preAuthForm.estimated_cost ? parseInt(preAuthForm.estimated_cost) : undefined,
      doctor_name: preAuthForm.doctor_name || undefined,
      notes: preAuthForm.notes || undefined,
    }, {
      onSuccess: () => {
        setShowPreAuth(false);
        setPreAuthSubmitting(false);
      },
      onError: () => {
        setPreAuthSubmitting(false);
        toast('Failed to submit request. Please try again.');
      },
    });
  }

  const isDetailsValid = preAuthForm.treatment_name.trim() && preAuthForm.admission_date && preAuthForm.room_type;
  const selectedPatient = coveredMembers.find(m => m.id === preAuthForm.family_member_id);
  const selectedRoomLabel = ROOM_TYPES.find(r => r.value === preAuthForm.room_type)?.label;

  function handleDelete() {
    if (!window.confirm('Remove this policy? It can be re-added later.')) return;
    router.delete(`/insurance/${policy.id}`, {
      preserveScroll: true,
    });
  }

  if (hasError) {
    return (
      <AppLayout pageTitle="Insurance" pageIcon="insurance">
        <ErrorState onRetry={retry} label="Unable to load policy details" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Insurance" pageIcon="insurance">
        <InsuranceShowSkeleton />
      </AppLayout>
    );
  }

  const meta = policy.metadata;

  return (
    <AppLayout pageTitle="Insurance" pageIcon="insurance">
      <div className="w-full max-w-[960px]" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
        {/* Back link */}
        <button
          onClick={() => router.visit('/insurance')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Insurance
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              style={{ backgroundColor: '#BFDBFE', color: '#1E40AF' }}
            >
              {getProviderInitials(policy.provider_name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{policy.plan_name}</h1>
              <p className="text-sm text-gray-500">{policy.provider_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={openPreAuth}>
              Use for Admission
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="text-gray-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  // Download policy card as HTML
                  const html = `
                    <h1>Insurance Policy Card</h1>
                    <p class="subtitle">${policy.provider_name}</p>
                    <h2>Policy Details</h2>
                    <div class="row"><span class="row-label">Plan</span><span class="row-value">${policy.plan_name}</span></div>
                    <div class="row"><span class="row-label">Policy Number</span><span class="row-value">${policy.policy_number}</span></div>
                    <div class="row"><span class="row-label">Sum Insured</span><span class="row-value">${formatCurrency(policy.sum_insured)}</span></div>
                    <div class="row"><span class="row-label">Valid</span><span class="row-value">${policy.start_date_formatted} to ${policy.end_date_formatted}</span></div>
                    <h2>Covered Members</h2>
                    ${coveredMembers.map(m => `<div class="row"><span class="row-label">${m.relation}</span><span class="row-value">${m.name}</span></div>`).join('')}
                  `;
                  const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Policy - ${policy.policy_number}</title><style>body{font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;padding:20px}h1{margin-bottom:4px}h2{margin-top:24px;font-size:14px;color:#6b7280;border-bottom:1px solid #e5e7eb;padding-bottom:8px}.subtitle{color:#6b7280;margin-top:0}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6}.row-label{color:#6b7280}.row-value{font-weight:500}</style></head><body>${html}</body></html>`], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `policy-${policy.policy_number}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast('Policy card downloaded');
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  router.post(`/insurance/${policy.id}/set-primary`, {}, {
                    onSuccess: () => toast('Policy set as primary'),
                    onError: () => toast('Failed to set as primary'),
                  });
                }}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Primary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.visit(`/insurance/${policy.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowShareSheet(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Expiry warning */}
        {policy.is_expiring_soon && (
          <div className="mb-8 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Policy expires in {policy.days_until_expiry} days
              </p>
              <p className="text-xs text-amber-600">
                Valid until {policy.end_date_formatted}. Consider renewing soon.
              </p>
            </div>
          </div>
        )}

        {/* Main Content with Side Nav */}
        <div className="flex gap-8">
          <SideNav />
          <div className="flex-1 min-w-0 space-y-8 pb-12">

        {/* Policy Details */}
        <Section id="details" title="Policy Details" icon={ClipboardList}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Policy Number</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{policy.policy_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Valid</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {policy.start_date_formatted} &rarr; {policy.end_date_formatted}
                </p>
              </div>
              {meta.icu_limit && (
                <div>
                  <p className="text-xs font-medium text-gray-500">ICU Limit</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.icu_limit}</p>
                </div>
              )}
              {meta.copay && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Co-pay</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.copay}</p>
                </div>
              )}
              {meta.tpa && (
                <div>
                  <p className="text-xs font-medium text-gray-500">TPA</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.tpa}</p>
                </div>
              )}
              {meta.tpa_contact && (
                <div>
                  <p className="text-xs font-medium text-gray-500">TPA Contact</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{meta.tpa_contact}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500">Sum Insured</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatCurrency(policy.sum_insured)}
                </p>
              </div>
              {policy.premium_amount && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Annual Premium</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(policy.premium_amount)}
                  </p>
                </div>
              )}
            </div>
        </Section>

        {/* Covered Members */}
        <Section id="members" title="Covered Members" icon={Users}>
          {coveredMembers.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {coveredMembers.map((member) => {
                const color = getAvatarColor(member.name);
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 rounded-full border px-3 py-1.5"
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {getMemberInitials(member.name)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{member.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Users} message="No covered members" description="Add family members to this policy" />
          )}
        </Section>

        {/* Claims at This Hospital */}
        <Section id="claims" title="Claims at This Hospital" icon={Receipt} noPadding>
          {claims.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={FileText} message="No claims yet" description="Claims filed at this hospital will appear here" />
            </div>
          ) : (
            <div className="divide-y">
              {claims.map((claim) => (
                <button
                  key={claim.id}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
                  onClick={() => router.visit(`/insurance/claims/${claim.id}?from=policy`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        Claim #{claim.id}
                      </span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{claim.treatment_name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {claim.patient_name}
                      {claim.claim_date_formatted && ` \u00B7 ${claim.claim_date_formatted}`}
                    </p>
                  </div>
                  <ChevronRight className="ml-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </Section>

          </div>{/* End flex-1 */}
        </div>{/* End flex container */}

        {/* Support CTA */}
        <div className="mt-8 py-6 text-center">
          <p className="text-sm text-gray-600">
            Need help with Insurance?{' '}
            <a href="mailto:support@healthfirst.in?subject=Insurance Support" className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
              Contact support →
            </a>
          </p>
        </div>
      </div>

      {/* Pre-Auth Sheet */}
      <Sheet open={showPreAuth} onOpenChange={setShowPreAuth}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {preAuthStep === 'patient' && 'Select Patient'}
              {preAuthStep === 'details' && 'Admission Details'}
              {preAuthStep === 'review' && 'Review & Submit'}
            </SheetTitle>
            <SheetDescription>
              {preAuthStep === 'patient' && 'Who is this admission for?'}
              {preAuthStep === 'details' && 'Provide details about the planned admission.'}
              {preAuthStep === 'review' && 'Confirm the details before submitting.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {/* Step 1: Patient Selection */}
            {preAuthStep === 'patient' && (
              <div className="space-y-3">
                {coveredMembers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    message="No covered members"
                    description="Add family members to this policy before requesting pre-authorization."
                  />
                ) : (
                  coveredMembers.map(member => {
                    const color = getAvatarColor(member.name);
                    return (
                      <button
                        key={member.id}
                        className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                        onClick={() => handlePreAuthPatientSelect(member.id)}
                      >
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {getMemberInitials(member.name)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{member.relation}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Step 2: Admission Details */}
            {preAuthStep === 'details' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Treatment / Reason <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={preAuthForm.treatment_name}
                    onChange={e => setPreAuthForm(f => ({ ...f, treatment_name: e.target.value }))}
                    placeholder="e.g. Knee replacement surgery"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expected Admission Date <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={preAuthForm.admission_date}
                    onChange={e => setPreAuthForm(f => ({ ...f, admission_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expected Discharge Date
                  </label>
                  <Input
                    type="date"
                    value={preAuthForm.discharge_date}
                    onChange={e => setPreAuthForm(f => ({ ...f, discharge_date: e.target.value }))}
                    min={preAuthForm.admission_date || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Room Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={preAuthForm.room_type}
                    onValueChange={v => setPreAuthForm(f => ({ ...f, room_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Estimated Cost
                  </label>
                  <Input
                    type="number"
                    value={preAuthForm.estimated_cost}
                    onChange={e => setPreAuthForm(f => ({ ...f, estimated_cost: e.target.value }))}
                    placeholder="e.g. 200000"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Doctor / Specialist Name
                  </label>
                  <Input
                    value={preAuthForm.doctor_name}
                    onChange={e => setPreAuthForm(f => ({ ...f, doctor_name: e.target.value }))}
                    placeholder="e.g. Dr. Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Additional Notes
                  </label>
                  <Textarea
                    value={preAuthForm.notes}
                    onChange={e => setPreAuthForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any relevant medical details..."
                    maxLength={1000}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {preAuthStep === 'review' && (
              <div className="space-y-4">
                {/* Policy summary */}
                <div className="rounded-xl border px-4 py-3.5">
                  <p className="text-xs font-medium text-gray-500 mb-1">Policy</p>
                  <p className="text-sm font-semibold text-gray-900">{policy.plan_name}</p>
                  <p className="text-xs text-gray-500">{policy.provider_name} &middot; {policy.policy_number}</p>
                </div>

                {/* Patient */}
                {selectedPatient && (
                  <div className="rounded-xl border px-4 py-3.5">
                    <p className="text-xs font-medium text-gray-500 mb-1">Patient</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedPatient.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{selectedPatient.relation}</p>
                  </div>
                )}

                {/* Admission details */}
                <div className="rounded-xl border px-4 py-3.5 space-y-2.5">
                  <p className="text-xs font-medium text-gray-500">Admission Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Treatment</span>
                      <span className="text-sm font-medium text-gray-900">{preAuthForm.treatment_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Admission Date</span>
                      <span className="text-sm font-medium text-gray-900">{preAuthForm.admission_date}</span>
                    </div>
                    {preAuthForm.discharge_date && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Discharge Date</span>
                        <span className="text-sm font-medium text-gray-900">{preAuthForm.discharge_date}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Room Type</span>
                      <span className="text-sm font-medium text-gray-900">{selectedRoomLabel}</span>
                    </div>
                    {preAuthForm.estimated_cost && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Estimated Cost</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(parseInt(preAuthForm.estimated_cost))}</span>
                      </div>
                    )}
                    {preAuthForm.doctor_name && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Doctor</span>
                        <span className="text-sm font-medium text-gray-900">{preAuthForm.doctor_name}</span>
                      </div>
                    )}
                    {preAuthForm.notes && (
                      <div>
                        <span className="text-xs text-gray-500">Notes</span>
                        <p className="text-sm text-gray-700 mt-0.5">{preAuthForm.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info banner */}
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3.5 py-3 flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Your pre-authorization request will be sent to {policy.provider_name} for review. You'll be notified once it's processed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {preAuthStep === 'details' && (
            <SheetFooter>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setPreAuthStep('patient')}>
                  Back
                </Button>
                <Button className="flex-1" disabled={!isDetailsValid} onClick={handlePreAuthDetailsNext}>
                  Review
                </Button>
              </div>
            </SheetFooter>
          )}
          {preAuthStep === 'review' && (
            <SheetFooter>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" disabled={preAuthSubmitting} onClick={() => setPreAuthStep('details')}>
                  Back
                </Button>
                <Button className="flex-1" disabled={preAuthSubmitting} onClick={handlePreAuthSubmit}>
                  {preAuthSubmitting ? 'Submitting...' : 'Submit Pre-Auth Request'}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />

      <ShareSheet
        open={showShareSheet}
        onOpenChange={setShowShareSheet}
        title={`${policy.plan_name} Insurance Policy`}
        description={`${policy.provider_name} · ${policy.policy_number}`}
        url={window.location.href}
      />
    </AppLayout>
  );
}
