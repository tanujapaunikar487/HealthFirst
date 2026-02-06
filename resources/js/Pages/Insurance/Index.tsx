import { useState, useMemo, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
import { CtaBanner } from '@/Components/ui/cta-banner';
import { SupportFooter } from '@/Components/SupportFooter';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { DatePicker } from '@/Components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetBody,
} from '@/Components/ui/sheet';
import { AddInsuranceSheet } from '@/Components/Insurance/AddInsuranceSheet';
import { Toast } from '@/Components/ui/toast';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { cn } from '@/Lib/utils';
import { getAvatarColor } from '@/Lib/avatar-colors';
import {
  ShieldCheck,
  Plus,
  Search,
  AlertTriangle,
  Users,
  ClipboardList,
  ChevronRight,
  ArrowRight,
  Building2,
  Check,
} from '@/Lib/icons';

interface Policy {
  id: number;
  provider_name: string;
  provider_logo: string | null;
  plan_name: string;
  policy_number: string;
  plan_type: string;
  sum_insured: number;
  end_date: string;
  end_date_formatted: string;
  is_expiring_soon: boolean;
  days_until_expiry: number;
  members: number[];
  member_count: number;
  claims_count: number;
}

interface Claim {
  id: number;
  claim_date: string | null;
  claim_date_formatted: string | null;
  treatment_name: string;
  patient_name: string;
  policy_number: string;
  provider_name: string | null;
  plan_name: string | null;
  claim_amount: number;
  status: string;
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
}

interface InsuranceProvider {
  id: number;
  name: string;
}

interface Props {
  policies: Policy[];
  claims: Claim[];
  familyMembers: FamilyMember[];
  insuranceProviders: InsuranceProvider[];
}


const ROOM_TYPES = [
  { value: 'general', label: 'General Ward' },
  { value: 'semi_private', label: 'Semi-Private Room' },
  { value: 'private', label: 'Private Room' },
  { value: 'icu', label: 'ICU' },
];

type PreAuthStep = 'policy' | 'patient' | 'details' | 'review';

interface PreAuthForm {
  policy_id: number | null;
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
  policy_id: null,
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
    current: { label: 'Current', variant: 'orange' },
    processing: { label: 'Current', variant: 'orange' },
    settled: { label: 'Settled', variant: 'success' },
    approved: { label: 'Settled', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'destructive' },
    disputed: { label: 'Disputed', variant: 'orange' },
    pending: { label: 'Pending', variant: 'warning' },
  };
  const entry = map[status] ?? map.pending;
  return (
    <Badge variant={entry.variant}>
      {entry.label}
    </Badge>
  );
}

function isCurrentStatus(status: string): boolean {
  return status === 'current' || status === 'processing';
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

function getPatientInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
}


function InsuranceSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '960px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Pulse className="h-9 w-36" />
        <Pulse className="h-10 w-32 rounded-full" />
      </div>
      {/* Policy cards */}
      <div className="mb-8 space-y-3">
        <Pulse className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-border p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Pulse className="h-5 w-40" />
                  <Pulse className="h-3 w-28" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Pulse className="h-4 w-24" />
                <Pulse className="h-4 w-24" />
                <Pulse className="h-5 w-20 rounded-full ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Claims table */}
      <div className="space-y-4">
        <Pulse className="h-6 w-28" />
        <div className="flex items-center gap-3 mb-4">
          <Pulse className="h-10 w-36 rounded-lg" />
          <Pulse className="h-10 w-36 rounded-lg" />
          <div className="ml-auto">
            <Pulse className="h-10 w-48 rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border">
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-36" />
            <Pulse className="h-3 w-20" />
            <Pulse className="h-3 w-24" />
            <Pulse className="h-3 w-16" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
              <Pulse className="h-4 w-20" />
              <div className="flex items-center gap-3 w-48">
                <Pulse className="h-9 w-9 rounded-xl flex-shrink-0" />
                <div className="space-y-2">
                  <Pulse className="h-4 w-32" />
                  <Pulse className="h-3 w-20" />
                </div>
              </div>
              <Pulse className="h-4 w-16" />
              <Pulse className="h-4 w-20" />
              <Pulse className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InsuranceIndex({
  policies,
  claims,
  familyMembers,
  insuranceProviders,
}: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(policies);
  const { props } = usePage<{ toast?: string }>();
  const { formatDate } = useFormatPreferences();

  // List filters
  const [policyFilter, setPolicyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Add Policy Sheet
  const [showAddPolicy, setShowAddPolicy] = useState(false);

  // Pre-Auth Sheet
  const [showPreAuth, setShowPreAuth] = useState(false);
  const [preAuthStep, setPreAuthStep] = useState<PreAuthStep>('policy');
  const [preAuthForm, setPreAuthForm] = useState<PreAuthForm>(EMPTY_PREAUTH_FORM);
  const [preAuthSubmitting, setPreAuthSubmitting] = useState(false);

  useEffect(() => {
    if (props.toast) {
      setToastMessage(props.toast);
      setShowToast(true);
    }
  }, [props.toast]);

  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
  };

  const uniquePolicies = useMemo(() => {
    const seen = new Set<string>();
    return policies.filter((p) => {
      if (seen.has(p.policy_number)) return false;
      seen.add(p.policy_number);
      return true;
    });
  }, [policies]);

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      if (policyFilter !== 'all' && c.policy_number !== policyFilter) return false;
      if (statusFilter !== 'all') {
        const normalizedStatus =
          c.status === 'processing' ? 'current' : c.status === 'approved' ? 'settled' : c.status;
        if (normalizedStatus !== statusFilter) return false;
      }
      if (memberFilter !== 'all' && c.patient_name !== memberFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const searchable = [c.treatment_name, c.patient_name, c.provider_name ?? '']
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [claims, policyFilter, statusFilter, memberFilter, search]);

  const hasPolicies = policies.length > 0;

  // --- Pre-Auth Flow ---

  function openPreAuth() {
    setPreAuthForm(EMPTY_PREAUTH_FORM);
    // If only 1 policy, skip policy selection
    if (policies.length === 1) {
      setPreAuthForm((f: PreAuthForm) => ({ ...f, policy_id: policies[0].id }));
      setPreAuthStep('patient');
    } else {
      setPreAuthStep('policy');
    }
    setShowPreAuth(true);
  }

  function handlePreAuthPolicySelect(policyId: number) {
    setPreAuthForm((f: PreAuthForm) => ({ ...f, policy_id: policyId }));
    setPreAuthStep('patient');
  }

  function handlePreAuthPatientSelect(memberId: number) {
    setPreAuthForm((f: PreAuthForm) => ({ ...f, family_member_id: memberId }));
    setPreAuthStep('details');
  }

  function handlePreAuthDetailsNext() {
    setPreAuthStep('review');
  }

  function handlePreAuthSubmit() {
    setPreAuthSubmitting(true);
    router.post('/insurance/pre-auth', {
      policy_id: preAuthForm.policy_id,
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
        showToastMessage('Failed to submit request. Please try again.');
      },
    });
  }

  const preAuthPolicy = policies.find(p => p.id === preAuthForm.policy_id);
  const preAuthCoveredMembers = preAuthPolicy
    ? familyMembers.filter(m => preAuthPolicy.members.includes(m.id))
    : [];
  const preAuthSelectedPatient = familyMembers.find(m => m.id === preAuthForm.family_member_id);
  const preAuthIsDetailsValid = preAuthForm.treatment_name.trim() && preAuthForm.admission_date && preAuthForm.room_type;
  const preAuthSelectedRoomLabel = ROOM_TYPES.find(r => r.value === preAuthForm.room_type)?.label;

  if (hasError) {
    return (
      <AppLayout pageTitle="Insurance" pageIcon="insurance">
        <ErrorState onRetry={retry} label="Unable to load insurance" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Insurance" pageIcon="insurance">
        <InsuranceSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Insurance" pageIcon="insurance">
      <div className="w-full max-w-[960px] min-h-full flex flex-col">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1
            className="font-bold"
            style={{
              fontSize: '36px',
              lineHeight: '44px',
              letterSpacing: '-1px',
              color: 'hsl(var(--foreground))',
            }}
          >
            Insurance
          </h1>
          {hasPolicies && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" onClick={() => setShowAddPolicy(true)}>
                <Plus className="h-[20px] w-[20px]" />
                Add policy
              </Button>
              <Button size="lg" onClick={openPreAuth}>
                Use for admission
              </Button>
            </div>
          )}
        </div>

        {!hasPolicies ? (
          <CtaBanner
            heading="Add your insurance policy"
            description="Add your insurance policy to use cashless benefits during admission at this hospital."
            buttonText="Add insurance"
            onButtonClick={() => setShowAddPolicy(true)}
            imageSrc="/assets/images/insurance.png"
            imageAlt="Insurance illustration"
          />
        ) : (
          <>
            {/* Policies on file */}
            <div className="mb-10">
              <h2 className="mb-4 text-[14px] font-semibold text-muted-foreground">Policies on file</h2>
              <div className="border" style={{ borderRadius: '20px' }}>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[140px]">Date</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="w-[100px]">Family members</TableHead>
                      <TableHead className="w-[140px] text-right">Amount</TableHead>
                      <TableHead className="w-[140px]">Status</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {policies.map((policy) => (
                      <TableRow
                        key={policy.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.visit('/insurance/' + policy.id)}
                      >
                        <TableCell className="align-top">
                          <p className="text-[14px] text-muted-foreground whitespace-nowrap">
                            {policy.end_date ? `Valid until ${formatDate(policy.end_date)}` : '—'}
                          </p>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-bold"
                              style={{ backgroundColor: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}
                            >
                              {getProviderInitials(policy.provider_name)}
                            </div>
                            <div>
                              <p className="text-[14px] font-medium text-foreground">{policy.plan_name}</p>
                              <p className="text-[14px] text-muted-foreground">{policy.policy_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="text-[14px] flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-foreground" />
                            {policy.member_count}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <p className="text-[14px] font-medium">₹{policy.sum_insured.toLocaleString()}</p>
                        </TableCell>
                        <TableCell className="align-top">
                          {policy.is_expiring_soon ? (
                            <Badge
                              variant="outline"
                              className="border-warning/20 bg-warning/10 text-warning text-[11px]"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Expires in {policy.days_until_expiry}d
                            </Badge>
                          ) : (
                            <Badge className="bg-success/10 text-success text-[11px]">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Button size="icon" icon={ChevronRight} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Table Footer */}
                {policies.length > 0 && (
                  <div className="flex items-center justify-center px-6 py-4 border-t border-border text-[14px] text-muted-foreground">
                    <span>Showing {policies.length} {policies.length === 1 ? 'policy' : 'policies'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Past Claims Section */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-foreground">Past claims</h2>

              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select value={policyFilter} onValueChange={setPolicyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All policies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All policies</SelectItem>
                    {uniquePolicies.map((p) => (
                      <SelectItem key={p.policy_number} value={p.policy_number}>
                        {p.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All family members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All family members</SelectItem>
                    {familyMembers.map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
                  <Input
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Claims Table */}
              {filteredClaims.length === 0 ? (
                <EmptyState
                  image="/assets/images/insurance.png"
                  message="No claims found"
                  description="Claims filed against your policies will appear here."
                />
              ) : (
                <div className="border" style={{ borderRadius: '20px' }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[150px]">Family member</TableHead>
                        <TableHead className="w-[120px] text-right">Amount</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => (
                        <TableRow
                          key={claim.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.visit(`/insurance/claims/${claim.id}`)}
                        >
                          <TableCell className="align-top">
                            <p className="text-[14px] text-muted-foreground whitespace-nowrap">
                              {formatDate(claim.claim_date) || '—'}
                            </p>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}
                              >
                                <Building2 className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                              </div>
                              <div>
                                <p className="text-[14px] font-medium text-foreground">
                                  {claim.treatment_name}
                                </p>
                                {claim.plan_name && (
                                  <p className="text-[14px] text-muted-foreground">{claim.plan_name}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <span className="text-[14px] text-muted-foreground">{claim.patient_name}</span>
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <p className="text-[14px] font-medium text-foreground">
                              {formatCurrency(claim.claim_amount)}
                            </p>
                          </TableCell>
                          <TableCell className="align-top">
                            {getStatusBadge(claim.status)}
                          </TableCell>
                          <TableCell className="align-top">
                            <Button size="icon" icon={ChevronRight} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Table Footer */}
                  {claims.length > 0 && (
                    <div className="flex items-center justify-center px-6 py-4 border-t border-border text-[14px] text-muted-foreground">
                      <span>
                        Showing {filteredClaims.length} of {claims.length}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <SupportFooter pageName="Insurance" />
      </div>

      {/* Add Policy Sheet */}
      <AddInsuranceSheet
        open={showAddPolicy}
        onOpenChange={setShowAddPolicy}
        insuranceProviders={insuranceProviders}
        familyMembers={familyMembers}
      />

      {/* Pre-Auth Sheet */}
      <Sheet open={showPreAuth} onOpenChange={setShowPreAuth}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader onBack={
            preAuthStep === 'patient' && policies.length > 1 ? () => setPreAuthStep('policy') :
            preAuthStep === 'details' ? () => setPreAuthStep('patient') :
            preAuthStep === 'review' ? () => setPreAuthStep('details') :
            undefined
          }>
            <SheetTitle>
              {preAuthStep === 'policy' && 'Select policy'}
              {preAuthStep === 'patient' && 'Select patient'}
              {preAuthStep === 'details' && 'Admission details'}
              {preAuthStep === 'review' && 'Review & submit'}
            </SheetTitle>
          </SheetHeader>

          <SheetBody>
            {/* Step 0: Policy Selection */}
            {preAuthStep === 'policy' && (
              <div className="space-y-3">
                {policies.map(p => (
                  <button
                    key={p.id}
                    className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-accent"
                    onClick={() => handlePreAuthPolicySelect(p.id)}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-[14px] font-bold"
                      style={{ backgroundColor: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}
                    >
                      {getProviderInitials(p.provider_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{p.plan_name}</p>
                      <p className="text-[14px] text-muted-foreground">{p.provider_name} &middot; {formatCurrency(p.sum_insured)}</p>
                    </div>
                    <span
                      className="flex items-center justify-center flex-shrink-0 rounded-full"
                      style={{
                        width: '40px', height: '40px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--secondary))',
                        color: 'hsl(var(--foreground))',
                      }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1: Patient Selection */}
            {preAuthStep === 'patient' && (
              <div className="space-y-3">
                {preAuthCoveredMembers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    message="No covered members"
                    description="Add family members to this policy before requesting pre-authorization."
                  />
                ) : (
                  preAuthCoveredMembers.map(member => {
                    const color = getAvatarColorByName(member.name);
                    return (
                      <button
                        key={member.id}
                        className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-accent"
                        onClick={() => handlePreAuthPatientSelect(member.id)}
                      >
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[14px] font-semibold"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {getPatientInitials(member.name)}
                        </div>
                        <div className="flex-1">
                          <p className="text-[14px] font-semibold text-foreground">{member.name}</p>
                          <p className="text-[14px] text-muted-foreground capitalize">{member.relation}</p>
                        </div>
                        <span
                          className="flex items-center justify-center flex-shrink-0 rounded-full"
                          style={{
                            width: '40px', height: '40px',
                            border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--secondary))',
                            color: 'hsl(var(--foreground))',
                          }}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </span>
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
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Treatment / Reason <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={preAuthForm.treatment_name}
                    onChange={e => setPreAuthForm((f: PreAuthForm) => ({ ...f, treatment_name: e.target.value }))}
                    placeholder="e.g. Knee replacement surgery"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Expected Admission Date <span className="text-destructive">*</span>
                  </label>
                  <DatePicker
                    value={preAuthForm.admission_date}
                    onChange={(value) => setPreAuthForm((f: PreAuthForm) => ({ ...f, admission_date: value }))}
                    min={new Date()}
                    placeholder="Select admission date"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Expected Discharge Date
                  </label>
                  <DatePicker
                    value={preAuthForm.discharge_date}
                    onChange={(value) => setPreAuthForm((f: PreAuthForm) => ({ ...f, discharge_date: value }))}
                    min={preAuthForm.admission_date ? new Date(preAuthForm.admission_date) : new Date()}
                    placeholder="Select discharge date"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Room Type <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={preAuthForm.room_type}
                    onValueChange={v => setPreAuthForm((f: PreAuthForm) => ({ ...f, room_type: v }))}
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
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Estimated Cost
                  </label>
                  <Input
                    type="number"
                    value={preAuthForm.estimated_cost}
                    onChange={e => setPreAuthForm((f: PreAuthForm) => ({ ...f, estimated_cost: e.target.value }))}
                    placeholder="e.g. 200000"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Doctor / Specialist Name
                  </label>
                  <Input
                    value={preAuthForm.doctor_name}
                    onChange={e => setPreAuthForm((f: PreAuthForm) => ({ ...f, doctor_name: e.target.value }))}
                    placeholder="e.g. Dr. Sharma"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-medium text-foreground mb-1.5">
                    Additional Notes
                  </label>
                  <Textarea
                    value={preAuthForm.notes}
                    onChange={e => setPreAuthForm((f: PreAuthForm) => ({ ...f, notes: e.target.value }))}
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
                {preAuthPolicy && (
                  <div className="rounded-xl border px-4 py-3.5">
                    <p className="text-[14px] font-medium text-muted-foreground mb-1">Policy</p>
                    <p className="text-[14px] font-semibold text-foreground">{preAuthPolicy.plan_name}</p>
                    <p className="text-[14px] text-muted-foreground">{preAuthPolicy.provider_name} &middot; {preAuthPolicy.policy_number}</p>
                  </div>
                )}

                {preAuthSelectedPatient && (
                  <div className="rounded-xl border px-4 py-3.5">
                    <p className="text-[14px] font-medium text-muted-foreground mb-1">Patient</p>
                    <p className="text-[14px] font-semibold text-foreground">{preAuthSelectedPatient.name}</p>
                    <p className="text-[14px] text-muted-foreground capitalize">{preAuthSelectedPatient.relation}</p>
                  </div>
                )}

                <div className="rounded-xl border px-4 py-3.5 space-y-2.5">
                  <p className="text-[14px] font-medium text-muted-foreground">Admission Details</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[14px] text-muted-foreground">Treatment</span>
                      <span className="text-[14px] font-medium text-foreground">{preAuthForm.treatment_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[14px] text-muted-foreground">Admission Date</span>
                      <span className="text-[14px] font-medium text-foreground">{preAuthForm.admission_date}</span>
                    </div>
                    {preAuthForm.discharge_date && (
                      <div className="flex justify-between">
                        <span className="text-[14px] text-muted-foreground">Discharge Date</span>
                        <span className="text-[14px] font-medium text-foreground">{preAuthForm.discharge_date}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[14px] text-muted-foreground">Room Type</span>
                      <span className="text-[14px] font-medium text-foreground">{preAuthSelectedRoomLabel}</span>
                    </div>
                    {preAuthForm.estimated_cost && (
                      <div className="flex justify-between">
                        <span className="text-[14px] text-muted-foreground">Estimated Cost</span>
                        <span className="text-[14px] font-medium text-foreground">{formatCurrency(parseInt(preAuthForm.estimated_cost))}</span>
                      </div>
                    )}
                    {preAuthForm.doctor_name && (
                      <div className="flex justify-between">
                        <span className="text-[14px] text-muted-foreground">Doctor</span>
                        <span className="text-[14px] font-medium text-foreground">{preAuthForm.doctor_name}</span>
                      </div>
                    )}
                    {preAuthForm.notes && (
                      <div>
                        <span className="text-[14px] text-muted-foreground">Notes</span>
                        <p className="text-[14px] text-foreground mt-0.5">{preAuthForm.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-primary/10 border border-primary/20 px-3.5 py-3 flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-[14px] text-primary">
                    Your pre-authorization request will be sent to {preAuthPolicy?.provider_name} for review. You'll be notified once it's processed.
                  </p>
                </div>
              </div>
            )}
          </SheetBody>

          {/* Footer */}
          {preAuthStep === 'details' && (
            <SheetFooter>
              <Button className="flex-1" size="lg" disabled={!preAuthIsDetailsValid} onClick={handlePreAuthDetailsNext}>
                Review
              </Button>
            </SheetFooter>
          )}
          {preAuthStep === 'review' && (
            <SheetFooter>
              <Button className="flex-1" size="lg" disabled={preAuthSubmitting} onClick={handlePreAuthSubmit}>
                {preAuthSubmitting ? 'Submitting...' : 'Submit pre-auth request'}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />
    </AppLayout>
  );
}
