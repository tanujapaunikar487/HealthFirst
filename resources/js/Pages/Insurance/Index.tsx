import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/Components/ui/sheet';
import { Toast } from '@/Components/ui/toast';
import { cn } from '@/Lib/utils';
import {
  ShieldCheck,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  FileText,
  Download,
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

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    current: {
      label: 'Current',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    processing: {
      label: 'Current',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    settled: {
      label: 'Settled',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    approved: {
      label: 'Settled',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    disputed: {
      label: 'Disputed',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
  };
  const entry = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={entry.className}>
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
    <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
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
      <div className="mx-auto max-w-[960px] px-6 py-8">
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
                Add Policy
              </Button>
              <Button size="lg" onClick={() => showToastMessage('Use for Admission coming soon')}>
                Use for Admission
              </Button>
            </div>
          )}
        </div>

        {!hasPolicies ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#BFDBFE' }}
            >
              <ShieldCheck className="h-8 w-8" style={{ color: '#1E40AF' }} />
            </div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">Add your insurance policy</h2>
            <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
              Add your insurance policy to use cashless benefits during admission at this hospital.
            </p>
            <Button size="lg" onClick={openAddPolicy}>Add your first policy</Button>
          </div>
        ) : (
          <>
            {/* Policies on file */}
            <div className="mb-10">
              <h2 className="mb-4 text-sm font-semibold text-gray-500">Policies on file</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {policies.map((policy) => (
                  <Card
                    key={policy.id}
                    className="cursor-pointer p-5 transition-shadow hover:shadow-md"
                    onClick={() => router.visit('/insurance/' + policy.id)}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                          style={{ backgroundColor: '#BFDBFE', color: '#1E40AF' }}
                        >
                          {getProviderInitials(policy.provider_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {policy.plan_name}
                          </p>
                          <p className="text-xs text-gray-500">{policy.policy_number}</p>
                        </div>
                      </div>
                      {policy.is_expiring_soon ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Expires in {policy.days_until_expiry}d
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{policy.provider_name}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {policy.member_count}{' '}
                          {policy.member_count === 1 ? 'member' : 'members'}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {policy.claims_count}{' '}
                          {policy.claims_count === 1 ? 'Claim' : 'Claims'}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Past Claims Section */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Past Claims</h2>

              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Select value={policyFilter} onValueChange={setPolicyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Policies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Policies</SelectItem>
                    {uniquePolicies.map((p) => (
                      <SelectItem key={p.policy_number} value={p.policy_number}>
                        {p.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Family Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Family Members</SelectItem>
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
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Appointment</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="text-sm text-gray-600">
                            {claim.claim_date_formatted ?? '--'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div
                                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{ backgroundColor: '#BFDBFE' }}
                              >
                                <Building2 className="h-4 w-4" style={{ color: '#1E40AF' }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {claim.treatment_name}
                                </p>
                                {claim.plan_name && (
                                  <p className="text-xs text-gray-500">{claim.plan_name}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                                style={{
                                  backgroundColor: getAvatarColor(claim.patient_name).bg,
                                  color: getAvatarColor(claim.patient_name).text,
                                }}
                              >
                                {getPatientInitials(claim.patient_name)}
                              </div>
                              <span className="text-sm text-gray-600">{claim.patient_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(claim.claim_amount)}
                            </p>
                            <div className="mt-0.5">{getStatusBadge(claim.status)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {isCurrentStatus(claim.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => router.visit(`/insurance/claims/${claim.id}`)}
                                >
                                  Track
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.visit(`/insurance/claims/${claim.id}`)}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Claim
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => showToastMessage('View Policy coming soon')}
                                  >
                                    <FileText className="mr-2 h-4 w-4" />
                                    View Policy
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => showToastMessage('Download coming soon')}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Documents
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Table Footer */}
                  {claims.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t border-[#E5E5E5] text-xs text-gray-500">
                      <span>
                        Showing {filteredClaims.length} of {claims.length}
                      </span>
                      <span className="flex items-center gap-1">
                        Need help with billing?{' '}
                        <button
                          className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:underline"
                          onClick={() => showToastMessage('Contact support coming soon')}
                        >
                          Contact support
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Policy Sheet */}
      <Sheet open={showAddPolicy} onOpenChange={handleSheetClose}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add Policy</SheetTitle>
            <SheetDescription>
              {addStep === 'upload' && 'Upload your policy document or enter details manually.'}
              {addStep === 'extracting' && 'Analyzing your document...'}
              {addStep === 'extract_failed' && 'We ran into a problem with your document.'}
              {addStep === 'review' && 'Review and confirm the policy details.'}
            </SheetDescription>
          </SheetHeader>

          <div>
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
                      <Input
                        type="date"
                        value={policyForm.start_date}
                        onChange={(e) => updateForm('start_date', e.target.value)}
                        className={cn(
                          formErrors.start_date && 'border-red-300 focus-visible:ring-red-400',
                          isPartialEmpty('start_date') &&
                            'ring-2 ring-amber-300 border-amber-300'
                        )}
                      />
                      {formErrors.start_date && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.start_date}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        End Date *
                      </label>
                      <Input
                        type="date"
                        value={policyForm.end_date}
                        onChange={(e) => updateForm('end_date', e.target.value)}
                        className={cn(
                          formErrors.end_date && 'border-red-300 focus-visible:ring-red-400',
                          isPartialEmpty('end_date') &&
                            'ring-2 ring-amber-300 border-amber-300'
                        )}
                      />
                      {formErrors.end_date && (
                        <p className="mt-1 text-xs text-red-500">{formErrors.end_date}</p>
                      )}
                    </div>
                  </div>
                </div>

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

                {/* Submit */}
                <Button
                  className="w-full"
                  onClick={handleSubmitPolicy}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Policy'}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Toast message={toastMessage} show={showToast} onHide={() => setShowToast(false)} />
    </AppLayout>
  );
}
