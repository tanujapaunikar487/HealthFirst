import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/Components/ui/checkbox';
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
  SheetDescription,
  SheetFooter,
  SheetDivider,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { cn, formatTableDate } from '@/Lib/utils';
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
  Upload,
  LoaderCircle,
  CheckCircle2,
  XCircle,
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

interface PolicyFormData {
  insurance_provider_id: string;
  policy_number: string;
  plan_name: string;
  plan_type: string;
  sum_insured: string;
  premium_amount: string;
  start_date: string;
  end_date: string;
  members: number[];
}

const defaultPolicyForm: PolicyFormData = {
  insurance_provider_id: '',
  policy_number: '',
  plan_name: '',
  plan_type: '',
  sum_insured: '',
  premium_amount: '',
  start_date: '',
  end_date: '',
  members: [],
};

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
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
  const [addStep, setAddStep] = useState<'upload' | 'extracting' | 'extract_failed' | 'review'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameFromUpload, setCameFromUpload] = useState(false);
  const [extractionType, setExtractionType] = useState<'full' | 'partial' | null>(null);
  const [policyForm, setPolicyForm] = useState<PolicyFormData>(defaultPolicyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- Add Policy Flow ---

  function resetAddPolicy() {
    setAddStep('upload');
    setUploadedFile(null);
    setUploadError('');
    setIsDragOver(false);
    setCameFromUpload(false);
    setExtractionType(null);
    setPolicyForm(defaultPolicyForm);
    setFormErrors({});
    setSubmitting(false);
  }

  function openAddPolicy() {
    resetAddPolicy();
    setShowAddPolicy(true);
  }

  function handleSheetClose(open: boolean) {
    if (!open) {
      setShowAddPolicy(false);
      resetAddPolicy();
    }
  }

  function validateFile(file: File): string | null {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are supported';
    }
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    return null;
  }

  function handleFileSelect(file: File) {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      return;
    }
    setUploadError('');
    setUploadedFile(file);
    setCameFromUpload(true);
    setAddStep('extracting');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleEnterManually() {
    setCameFromUpload(false);
    setPolicyForm(defaultPolicyForm);
    setAddStep('review');
  }

  // Simulated extraction
  useEffect(() => {
    if (addStep !== 'extracting') return;
    const timer = setTimeout(() => {
      // ~20% chance of failure
      if (Math.random() < 0.2) {
        setAddStep('extract_failed');
        return;
      }

      const today = new Date();
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      // ~30% chance of partial extraction
      const isPartial = Math.random() < 0.3;

      if (isPartial) {
        setPolicyForm({
          insurance_provider_id: insuranceProviders[0]?.id?.toString() ?? '',
          policy_number: 'POL-2026-' + Math.random().toString().slice(2, 8),
          plan_name: 'Health Protect Plan',
          plan_type: '',
          sum_insured: '',
          premium_amount: '',
          start_date: '',
          end_date: '',
          members: [],
        });
        setExtractionType('partial');
      } else {
        setPolicyForm({
          insurance_provider_id: insuranceProviders[0]?.id?.toString() ?? '',
          policy_number: 'POL-2026-' + Math.random().toString().slice(2, 8),
          plan_name: 'Health Protect Plan',
          plan_type: 'individual',
          sum_insured: '500000',
          premium_amount: '15000',
          start_date: today.toISOString().slice(0, 10),
          end_date: oneYearLater.toISOString().slice(0, 10),
          members: [],
        });
        setExtractionType('full');
      }
      setAddStep('review');
    }, 2000);
    return () => clearTimeout(timer);
  }, [addStep, insuranceProviders]);

  const updateForm = useCallback(
    (field: keyof PolicyFormData, value: string | number[]) => {
      setPolicyForm((prev) => ({ ...prev, [field]: value }));
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: '' }));
      }
    },
    [formErrors]
  );

  function toggleMember(memberId: number) {
    setPolicyForm((prev) => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter((id) => id !== memberId)
        : [...prev.members, memberId],
    }));
  }

  const isPartialEmpty = useCallback(
    (field: keyof PolicyFormData) =>
      extractionType === 'partial' && cameFromUpload && !policyForm[field],
    [extractionType, cameFromUpload, policyForm]
  );

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

  function handleSubmitPolicy() {
    const errors: Record<string, string> = {};
    if (!policyForm.insurance_provider_id) errors.insurance_provider_id = 'Provider is required';
    if (!policyForm.policy_number.trim()) errors.policy_number = 'Policy number is required';
    if (!policyForm.plan_name.trim()) errors.plan_name = 'Plan name is required';
    if (!policyForm.plan_type) errors.plan_type = 'Plan type is required';
    if (!policyForm.sum_insured || Number(policyForm.sum_insured) <= 0)
      errors.sum_insured = 'Sum insured must be greater than 0';
    if (!policyForm.start_date) errors.start_date = 'Start date is required';
    if (!policyForm.end_date) errors.end_date = 'End date is required';
    if (policyForm.start_date && policyForm.end_date && policyForm.end_date <= policyForm.start_date)
      errors.end_date = 'End date must be after start date';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    router.post(
      '/insurance',
      {
        insurance_provider_id: Number(policyForm.insurance_provider_id),
        policy_number: policyForm.policy_number.trim(),
        plan_name: policyForm.plan_name.trim(),
        plan_type: policyForm.plan_type,
        sum_insured: Number(policyForm.sum_insured),
        premium_amount: policyForm.premium_amount ? Number(policyForm.premium_amount) : null,
        start_date: policyForm.start_date,
        end_date: policyForm.end_date,
        members: policyForm.members.length > 0 ? policyForm.members : null,
      },
      {
        onSuccess: () => {
          setShowAddPolicy(false);
          resetAddPolicy();
        },
        onError: (errors) => {
          setFormErrors(errors as Record<string, string>);
          setSubmitting(false);
        },
      }
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
              color: '#171717',
            }}
          >
            Insurance
          </h1>
          {hasPolicies && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="lg" onClick={openAddPolicy}>
                <Plus className="h-4 w-4" />
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
            onButtonClick={openAddPolicy}
            imageSrc="/assets/images/insurance.png"
            imageAlt="Insurance illustration"
          />
        ) : (
          <>
            {/* Policies on file */}
            <div className="mb-10">
              <h2 className="mb-4 text-sm font-semibold text-gray-500">Policies on file</h2>
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
                          <p className="text-sm text-gray-600 whitespace-nowrap">
                            {policy.end_date_formatted ? `Valid until ${policy.end_date_formatted}` : '—'}
                          </p>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{ backgroundColor: '#BFDBFE', color: '#1E40AF' }}
                            >
                              {getProviderInitials(policy.provider_name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{policy.plan_name}</p>
                              <p className="text-xs text-muted-foreground">{policy.policy_number}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="text-sm flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {policy.member_count}
                          </span>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <p className="text-sm font-medium">₹{policy.sum_insured.toLocaleString()}</p>
                        </TableCell>
                        <TableCell className="align-top">
                          {policy.is_expiring_soon ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-700 text-[11px]"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Expires in {policy.days_until_expiry}d
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 text-[11px]">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Table Footer */}
                {policies.length > 0 && (
                  <div className="flex items-center justify-center px-4 py-4 border-t border-[#E5E5E5] text-xs text-gray-500">
                    <span>Showing {policies.length} {policies.length === 1 ? 'policy' : 'policies'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Past Claims Section */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Past claims</h2>

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
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12">
                  <p className="text-sm text-gray-500">No claims found</p>
                </div>
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
                            <p className="text-sm text-gray-600 whitespace-nowrap">
                              {claim.claim_date_formatted ?? '—'}
                            </p>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                style={{ backgroundColor: '#BFDBFE' }}
                              >
                                <Building2 className="h-5 w-5" style={{ color: '#1E40AF' }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {claim.treatment_name}
                                </p>
                                {claim.plan_name && (
                                  <p className="text-xs text-muted-foreground">{claim.plan_name}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <span className="text-sm text-gray-600">{claim.patient_name}</span>
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(claim.claim_amount)}
                            </p>
                          </TableCell>
                          <TableCell className="align-top">
                            {getStatusBadge(claim.status)}
                          </TableCell>
                          <TableCell className="align-top">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Table Footer */}
                  {claims.length > 0 && (
                    <div className="flex items-center justify-center px-4 py-4 border-t border-[#E5E5E5] text-xs text-gray-500">
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
      <Sheet open={showAddPolicy} onOpenChange={handleSheetClose}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add policy</SheetTitle>
            <SheetDescription>
              {addStep === 'upload' && 'Upload your policy document or enter details manually.'}
              {addStep === 'extracting' && 'Analyzing your document...'}
              {addStep === 'extract_failed' && 'We ran into a problem with your document.'}
              {addStep === 'review' && 'Review and confirm the policy details.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {/* Step 1: Upload */}
            {addStep === 'upload' && (
              <div className="space-y-6">
                <div
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors',
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div
                    className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: '#BFDBFE' }}
                  >
                    <Upload className="h-6 w-6" style={{ color: '#1E40AF' }} />
                  </div>
                  <p className="mb-1 text-sm font-semibold text-gray-900">Upload policy PDF</p>
                  <p className="mb-3 text-xs text-gray-500">
                    We'll extract the details automatically
                  </p>
                  <p className="text-xs text-gray-400">Drag & drop or click to browse</p>
                  <p className="mt-1 text-xs text-gray-400">PDF only - Max 10MB</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                {uploadError && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    {uploadError}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <button
                  className="w-full text-center text-sm font-medium text-blue-600 hover:underline"
                  onClick={handleEnterManually}
                >
                  Enter details manually
                </button>
              </div>
            )}

            {/* Step 2: Extracting */}
            {addStep === 'extracting' && (
              <div className="flex flex-col items-center justify-center py-12">
                <LoaderCircle className="mb-4 h-10 w-10 animate-spin text-blue-600" />
                <p className="mb-1 text-sm font-semibold text-gray-900">
                  Extracting policy details...
                </p>
                <p className="mb-6 text-xs text-gray-500">This may take a few moments</p>
                {uploadedFile && (
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                    <span className="text-xs text-gray-400">
                      ({formatFileSize(uploadedFile.size)})
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2b: Extraction Failed */}
            {addStep === 'extract_failed' && (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
                >
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-900">
                  Couldn't extract policy details
                </p>
                <p className="mb-6 max-w-xs text-center text-xs text-gray-500">
                  The document may be encrypted or in an unsupported format.
                </p>
                {uploadedFile && (
                  <div className="mb-6 flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{uploadedFile.name}</span>
                    <span className="text-xs text-gray-400">
                      ({formatFileSize(uploadedFile.size)})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAddStep('extracting')}
                  >
                    Try again
                  </Button>
                  <Button onClick={handleEnterManually}>Enter manually</Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {addStep === 'review' && (
              <div className="space-y-6">
                {cameFromUpload && extractionType === 'full' && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                    Details extracted from PDF. Review and confirm below.
                  </div>
                )}
                {cameFromUpload && extractionType === 'partial' && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    Some details couldn't be extracted. Please fill in the highlighted fields.
                  </div>
                )}
                {formErrors.policy_number?.includes('already') && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    A policy with this number already exists. Please check and update if needed.
                  </div>
                )}

                {/* Provider */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Provider
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Insurance Provider *
                      </label>
                      <Select
                        value={policyForm.insurance_provider_id}
                        onValueChange={(v) => updateForm('insurance_provider_id', v)}
                      >
                        <SelectTrigger
                          className={cn(
                            formErrors.insurance_provider_id &&
                              'border-red-300 focus-visible:ring-red-400',
                            isPartialEmpty('insurance_provider_id') &&
                              'ring-2 ring-amber-300 border-amber-300'
                          )}
                        >
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {insuranceProviders.map((p) => (
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.insurance_provider_id && (
                        <p className="mt-1 text-xs text-red-500">
                          {formErrors.insurance_provider_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <SheetDivider className="my-6" />

                {/* Policy Details */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Policy Details
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Policy Number *
                      </label>
                      <Input
                        value={policyForm.policy_number}
                        onChange={(e) => updateForm('policy_number', e.target.value)}
                        placeholder="e.g. SH-2026-123456"
                        className={cn(
                          formErrors.policy_number && 'border-red-300 focus-visible:ring-red-400'
                        )}
                      />
                      {formErrors.policy_number && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.policy_number}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Plan Name *
                      </label>
                      <Input
                        value={policyForm.plan_name}
                        onChange={(e) => updateForm('plan_name', e.target.value)}
                        placeholder="e.g. Family Floater Plan"
                        className={cn(
                          formErrors.plan_name && 'border-red-300 focus-visible:ring-red-400'
                        )}
                      />
                      {formErrors.plan_name && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.plan_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Plan Type *
                      </label>
                      <Select
                        value={policyForm.plan_type}
                        onValueChange={(v) => updateForm('plan_type', v)}
                      >
                        <SelectTrigger
                          className={cn(
                            formErrors.plan_type && 'border-red-300 focus-visible:ring-red-400',
                            isPartialEmpty('plan_type') &&
                              'ring-2 ring-amber-300 border-amber-300'
                          )}
                        >
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="family">Family</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="senior_citizen">Senior Citizen</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.plan_type && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.plan_type}</p>
                      )}
                    </div>
                  </div>
                </div>

                <SheetDivider className="my-6" />

                {/* Coverage */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Coverage
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Sum Insured (&#8377;) *
                      </label>
                      <Input
                        type="number"
                        value={policyForm.sum_insured}
                        onChange={(e) => updateForm('sum_insured', e.target.value)}
                        placeholder="500000"
                        className={cn(
                          formErrors.sum_insured && 'border-red-300 focus-visible:ring-red-400',
                          isPartialEmpty('sum_insured') &&
                            'ring-2 ring-amber-300 border-amber-300'
                        )}
                      />
                      {formErrors.sum_insured && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.sum_insured}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Premium (&#8377;)
                      </label>
                      <Input
                        type="number"
                        value={policyForm.premium_amount}
                        onChange={(e) => updateForm('premium_amount', e.target.value)}
                        placeholder="12000"
                      />
                    </div>
                  </div>
                </div>

                <SheetDivider className="my-6" />

                {/* Validity */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Validity
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Start Date *
                      </label>
                      <DatePicker
                        value={policyForm.start_date}
                        onChange={(value) => updateForm('start_date', value)}
                        error={!!formErrors.start_date}
                        className={cn(
                          isPartialEmpty('start_date') &&
                            'ring-2 ring-amber-300 border-amber-300'
                        )}
                        placeholder="Select start date"
                      />
                      {formErrors.start_date && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.start_date}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        End Date *
                      </label>
                      <DatePicker
                        value={policyForm.end_date}
                        onChange={(value) => updateForm('end_date', value)}
                        error={!!formErrors.end_date}
                        className={cn(
                          isPartialEmpty('end_date') &&
                            'ring-2 ring-amber-300 border-amber-300'
                        )}
                        placeholder="Select end date"
                      />
                      {formErrors.end_date && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.end_date}</p>
                      )}
                    </div>
                  </div>
                </div>

                <SheetDivider className="my-6" />

                {/* Covered Members */}
                {familyMembers.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Covered Members
                    </p>
                    <div className="space-y-2">
                      {familyMembers.map((m) => (
                        <label
                          key={m.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={policyForm.members.includes(m.id)}
                            onCheckedChange={() => toggleMember(m.id)}
                          />
                          <span className="text-sm text-gray-900">{m.name}</span>
                          <span className="text-xs capitalize text-gray-500">({m.relation})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {addStep === 'review' && (
            <SheetFooter>
              <Button
                className="flex-1"
                onClick={handleSubmitPolicy}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save policy'}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Pre-Auth Sheet */}
      <Sheet open={showPreAuth} onOpenChange={setShowPreAuth}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {preAuthStep === 'policy' && 'Select policy'}
              {preAuthStep === 'patient' && 'Select patient'}
              {preAuthStep === 'details' && 'Admission Details'}
              {preAuthStep === 'review' && 'Review & Submit'}
            </SheetTitle>
            <SheetDescription>
              {preAuthStep === 'policy' && 'Which policy should this admission use?'}
              {preAuthStep === 'patient' && 'Who is this admission for?'}
              {preAuthStep === 'details' && 'Provide details about the planned admission.'}
              {preAuthStep === 'review' && 'Confirm the details before submitting.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {/* Step 0: Policy Selection */}
            {preAuthStep === 'policy' && (
              <div className="space-y-3">
                {policies.map(p => (
                  <button
                    key={p.id}
                    className="flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-gray-50"
                    onClick={() => handlePreAuthPolicySelect(p.id)}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{ backgroundColor: '#BFDBFE', color: '#1E40AF' }}
                    >
                      {getProviderInitials(p.provider_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.plan_name}</p>
                      <p className="text-xs text-gray-500">{p.provider_name} &middot; {formatCurrency(p.sum_insured)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                          {getPatientInitials(member.name)}
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
                    onChange={e => setPreAuthForm((f: PreAuthForm) => ({ ...f, treatment_name: e.target.value }))}
                    placeholder="e.g. Knee replacement surgery"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expected Admission Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={preAuthForm.admission_date}
                    onChange={(value) => setPreAuthForm((f: PreAuthForm) => ({ ...f, admission_date: value }))}
                    min={new Date()}
                    placeholder="Select admission date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Room Type <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Doctor / Specialist Name
                  </label>
                  <Input
                    value={preAuthForm.doctor_name}
                    onChange={e => setPreAuthForm((f: PreAuthForm) => ({ ...f, doctor_name: e.target.value }))}
                    placeholder="e.g. Dr. Sharma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    <p className="text-xs font-medium text-gray-500 mb-1">Policy</p>
                    <p className="text-sm font-semibold text-gray-900">{preAuthPolicy.plan_name}</p>
                    <p className="text-xs text-gray-500">{preAuthPolicy.provider_name} &middot; {preAuthPolicy.policy_number}</p>
                  </div>
                )}

                {preAuthSelectedPatient && (
                  <div className="rounded-xl border px-4 py-3.5">
                    <p className="text-xs font-medium text-gray-500 mb-1">Patient</p>
                    <p className="text-sm font-semibold text-gray-900">{preAuthSelectedPatient.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{preAuthSelectedPatient.relation}</p>
                  </div>
                )}

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
                      <span className="text-sm font-medium text-gray-900">{preAuthSelectedRoomLabel}</span>
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

                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3.5 py-3 flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Your pre-authorization request will be sent to {preAuthPolicy?.provider_name} for review. You'll be notified once it's processed.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {preAuthStep === 'patient' && policies.length > 1 && (
            <SheetFooter>
              <Button variant="outline" className="w-full" onClick={() => setPreAuthStep('policy')}>
                Back
              </Button>
            </SheetFooter>
          )}
          {preAuthStep === 'details' && (
            <SheetFooter>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setPreAuthStep('patient')}>
                  Back
                </Button>
                <Button className="flex-1" disabled={!preAuthIsDetailsValid} onClick={handlePreAuthDetailsNext}>
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
                  {preAuthSubmitting ? 'Submitting...' : 'Submit pre-auth request'}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />
    </AppLayout>
  );
}
