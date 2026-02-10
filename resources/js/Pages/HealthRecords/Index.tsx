import { useState, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { Input } from '@/Components/ui/input';
import { DatePicker } from '@/Components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { TablePagination } from '@/Components/ui/table-pagination';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { BulkActionBar } from '@/Components/ui/bulk-action-bar';
import { cn } from '@/Lib/utils';
import { useToast } from '@/Contexts/ToastContext';
import {
  Search,
  Stethoscope,
  Pill,
  TestTube2,
  ScanLine,
  UserPlus,
  FileText,
  Download,
  HeartPulse,
  Microscope,
  Wind,
  Syringe,
  Radio,
  ClipboardList,
  ClipboardCheck,
  Award,
  Ambulance,
  BrainCircuit,
  Share2,
  ChevronRight,
  X,
} from '@/Lib/icons';
import { downloadAsHtml } from '@/Lib/download';
import { generateBulkRecordsPdfContent } from '@/Lib/pdf-content';
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
  // xray_report, mri_report, ultrasound_report (and legacy imaging_report)
  modality?: string;
  body_part?: string;
  indication?: string;
  technique?: string;
  findings?: string;
  impression?: string;
  radiologist?: string;
  // mri extras
  contrast?: string;
  sequences?: string;
  // ultrasound extras
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
  records: HealthRecord[];
  familyMembers: FamilyMember[];
  preSelectedRecordId?: number | null;
  preSelectedMemberId?: number | null;
}

/* ─── Category Config ─── */

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  // Reports
  lab_report:         { label: 'Lab Report',   icon: TestTube2 },
  xray_report:        { label: 'X-Ray',        icon: ScanLine },
  mri_report:         { label: 'MRI',          icon: BrainCircuit },
  ultrasound_report:  { label: 'Ultrasound',   icon: Radio },
  ecg_report:         { label: 'ECG',          icon: HeartPulse },
  pathology_report:   { label: 'Pathology',    icon: Microscope },
  pft_report:         { label: 'PFT',          icon: Wind },
  other_report:       { label: 'Other Report', icon: ClipboardList },
  // Visits
  consultation_notes: { label: 'Consultation', icon: Stethoscope },
  procedure_notes:    { label: 'Procedure',    icon: Syringe },
  discharge_summary:  { label: 'Discharge',    icon: FileText },
  er_visit:           { label: 'ER Visit',     icon: Ambulance },
  referral:           { label: 'Referral',     icon: UserPlus },
  other_visit:        { label: 'Other Visit',  icon: ClipboardCheck },
  // Prescriptions
  prescription:       { label: 'Prescription', icon: Pill },
  // Documents
  vaccination:        { label: 'Vaccination',  icon: Syringe },
  medical_certificate:{ label: 'Certificate',  icon: Award },
};

const typeGroups: Record<string, string[]> = {
  visit_notes: ['consultation_notes', 'procedure_notes', 'er_visit', 'referral', 'other_visit', 'prescription'],
  labs:        ['lab_report', 'pathology_report', 'pft_report'],
  imaging:     ['xray_report', 'mri_report', 'ultrasound_report', 'ecg_report'],
  summaries:   ['discharge_summary', 'other_report', 'vaccination', 'medical_certificate'],
};

const RECORDS_PER_PAGE = 10;

function CategoryIcon({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' }) {
  const config = categoryConfig[category] || { icon: FileText };
  const Icon = config.icon;
  const iconDim = size === 'sm' ? 'h-5 w-5' : 'h-[18px] w-[18px]';
  return (
    <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
      <Icon className={cn(iconDim, 'text-blue-800')} />
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

/* ─── Skeleton ─── */

function HealthRecordsSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '960px' }}>
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <Pulse className="h-9 w-48" />
          <Pulse className="h-4 w-64" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <Pulse key={i} className="h-10 w-36 rounded-lg" />
        ))}
        <div className="ml-auto">
          <Pulse className="h-10 w-56 rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border">
          <Pulse className="h-4 w-4 rounded" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-40" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-12" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0">
            <Pulse className="h-4 w-4 rounded flex-shrink-0" />
            <Pulse className="h-4 w-20" />
            <div className="flex items-center gap-3 w-64">
              <Pulse className="h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="space-y-2">
                <Pulse className="h-4 w-40" />
                <Pulse className="h-3 w-24" />
              </div>
            </div>
            <Pulse className="h-4 w-16" />
            <Pulse className="h-6 w-20 rounded-full" />
            <Pulse className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function Index({ user, records, familyMembers, preSelectedRecordId, preSelectedMemberId }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(records);
  const { formatDate } = useFormatPreferences();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState<string>(preSelectedMemberId ? String(preSelectedMemberId) : 'all');
  const [datePreset, setDatePreset] = useState('any');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [shareRecord, setShareRecord] = useState<HealthRecord | null>(null);
  const [bulkShareOpen, setBulkShareOpen] = useState(false);

  // Navigate to detail page when deep-linked from search
  useEffect(() => {
    if (preSelectedRecordId) {
      router.visit(`/health-records/${preSelectedRecordId}`);
    }
  }, [preSelectedRecordId]);

  // Read filter parameters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Read tab filter
    const tabParam = params.get('tab');
    if (tabParam) {
      const validTabs = ['all', 'visit_notes', 'labs', 'imaging', 'summaries'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    // Read member filter
    const memberId = params.get('member');
    if (memberId) {
      // Verify member exists (including 'self')
      const memberExists = memberId === 'self' ||
                          familyMembers.some(m => String(m.id) === memberId);
      if (memberExists) {
        setMemberFilter(memberId);
      }
    }

    // Read status filter
    const status = params.get('status');
    if (status) {
      // Validate against known status values
      const validStatuses = ['all', 'normal', 'needs_attention', 'active', 'completed',
                            'pending', 'follow_up_required', 'valid', 'expired', 'discontinued'];
      if (validStatuses.includes(status)) {
        setStatusFilter(status);
      }
    }

    // Read category filter
    const category = params.get('category');
    if (category) {
      // Validate against categoryConfig keys
      const validCategories = Object.keys(categoryConfig);
      if (validCategories.includes(category)) {
        setSubCategoryFilter(category);

        // If it's prescription category, switch to visit_notes tab
        if (category === 'prescription') {
          setActiveTab('visit_notes');
        }
      }
    }
  }, []);

  const memberMap = useMemo(() => {
    const map: Record<number, FamilyMember> = {};
    familyMembers.forEach((m) => { map[m.id] = m; });
    return map;
  }, [familyMembers]);


  const effectiveDateRange = useMemo(() => {
    if (datePreset === 'any') return { computedFrom: '', computedTo: '' };
    if (datePreset === 'custom') return { computedFrom: dateFrom, computedTo: dateTo };
    const today = new Date();
    const to = today.toISOString().slice(0, 10);
    const d = new Date(today);
    if (datePreset === 'last_7') d.setDate(d.getDate() - 7);
    else if (datePreset === 'last_30') d.setDate(d.getDate() - 30);
    else if (datePreset === 'last_90') d.setDate(d.getDate() - 90);
    return { computedFrom: d.toISOString().slice(0, 10), computedTo: to };
  }, [datePreset, dateFrom, dateTo]);

  const subCategoryOptions = useMemo(() => {
    if (activeTab === 'all') return Object.entries(categoryConfig);
    const cats = typeGroups[activeTab] || [];
    return cats.map((key) => [key, categoryConfig[key]] as [string, typeof categoryConfig[string]]).filter(([, v]) => v);
  }, [activeTab]);

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; onRemove: () => void }[] = [];
    if (subCategoryFilter !== 'all') {
      const cfg = categoryConfig[subCategoryFilter];
      filters.push({ key: 'subcategory', label: cfg?.label || subCategoryFilter, onRemove: () => setSubCategoryFilter('all') });
    }
    if (statusFilter !== 'all') {
      filters.push({ key: 'status', label: statusFilter.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), onRemove: () => setStatusFilter('all') });
    }
    if (memberFilter !== 'all') {
      const name = memberFilter === 'self' ? 'Yourself' : familyMembers.find((m) => String(m.id) === memberFilter)?.name || memberFilter;
      filters.push({ key: 'member', label: name, onRemove: () => setMemberFilter('all') });
    }
    if (datePreset !== 'any') {
      const labels: Record<string, string> = { last_7: 'Last 7 days', last_30: 'Last 30 days', last_90: 'Last 3 months', custom: 'Custom dates' };
      filters.push({ key: 'date', label: labels[datePreset] || datePreset, onRemove: () => { setDatePreset('any'); setDateFrom(''); setDateTo(''); } });
    }
    if (searchQuery.trim()) {
      filters.push({ key: 'search', label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') });
    }
    return filters;
  }, [subCategoryFilter, statusFilter, memberFilter, datePreset, searchQuery, familyMembers]);

  function clearAllFilters() {
    setSubCategoryFilter('all');
    setStatusFilter('all');
    setMemberFilter('all');
    setDatePreset('any');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  }

  const filteredRecords = useMemo(() => {
    let list = records;

    // Tab filter (group level)
    if (activeTab !== 'all') {
      list = list.filter((r) => typeGroups[activeTab]?.includes(r.category));
    }

    // Sub-category filter (individual category)
    if (subCategoryFilter !== 'all') {
      list = list.filter((r) => r.category === subCategoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((r) => {
        if (!r.status) return false;
        const normalized = r.status.label.toLowerCase().replace(/[\s-]/g, '_');
        return normalized === statusFilter;
      });
    }

    // Member filter
    if (memberFilter === 'self') {
      list = list.filter((r) => r.family_member_id === null);
    } else if (memberFilter !== 'all') {
      list = list.filter((r) => String(r.family_member_id) === memberFilter);
    }

    // Date range (from preset or custom)
    const { computedFrom, computedTo } = effectiveDateRange;
    if (computedFrom) list = list.filter((r) => r.record_date >= computedFrom);
    if (computedTo) list = list.filter((r) => r.record_date <= computedTo);

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.doctor_name && r.doctor_name.toLowerCase().includes(q)) ||
          (r.department_name && r.department_name.toLowerCase().includes(q)) ||
          (r.family_member_id && memberMap[r.family_member_id]?.name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [records, activeTab, subCategoryFilter, statusFilter, memberFilter, effectiveDateRange, searchQuery, memberMap]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, subCategoryFilter, statusFilter, memberFilter, datePreset, dateFrom, dateTo, searchQuery]);

  // Reset sub-category when tab changes
  useEffect(() => {
    setSubCategoryFilter('all');
  }, [activeTab]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const startIdx = (currentPage - 1) * RECORDS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIdx, startIdx + RECORDS_PER_PAGE);

  const allSelected = paginatedRecords.length > 0 && paginatedRecords.every((r) => selectedIds.has(r.id));

  function toggleSelectAll() {
    if (allSelected) {
      const newSet = new Set(selectedIds);
      paginatedRecords.forEach((r) => newSet.delete(r.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      paginatedRecords.forEach((r) => newSet.add(r.id));
      setSelectedIds(newSet);
    }
  }

  function toggleSelect(id: number) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Health Records" pageIcon="/assets/icons/records.svg">
        <ErrorState onRetry={retry} label="Unable to load health records" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Health Records" pageIcon="/assets/icons/records.svg">
        <HealthRecordsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      pageTitle="Health Records"
      pageIcon="/assets/icons/records.svg"
    >
      <div className="min-h-full flex flex-col" style={{ width: '100%', maxWidth: '960px' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-page-title text-foreground">
              Health Records
            </h1>
          </div>
        </div>


        {/* Tabs + Filters */}
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v);
          // Update URL without full page reload
          const url = new URL(window.location.href);
          url.searchParams.set('tab', v);
          window.history.pushState({}, '', url.toString());
        }} className="space-y-4">
          <TabsList>
            {[
              { value: 'all', label: 'All' },
              { value: 'visit_notes', label: 'Visit Notes' },
              { value: 'labs', label: 'Labs' },
              { value: 'imaging', label: 'Imaging' },
              { value: 'summaries', label: 'Summaries' },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
              <SelectTrigger className="w-[170px] h-9">
                <SelectValue placeholder={activeTab === 'all' ? 'All categories' : `All ${activeTab}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {activeTab === 'all' ? 'All categories' : `All ${activeTab}`}
                </SelectItem>
                {subCategoryOptions.map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="needs_attention">Needs attention</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="follow_up_required">Follow-up required</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>

            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                <SelectItem value="self">Yourself</SelectItem>
                {familyMembers.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.name} ({m.relation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={datePreset} onValueChange={(v) => { setDatePreset(v); if (v !== 'custom') { setDateFrom(''); setDateTo(''); } }}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any time</SelectItem>
                <SelectItem value="last_7">Last 7 days</SelectItem>
                <SelectItem value="last_30">Last 30 days</SelectItem>
                <SelectItem value="last_90">Last 3 months</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <DatePicker value={dateFrom} onChange={setDateFrom} className="h-9 w-[140px] text-body" placeholder="From" />
                <span className="text-body text-muted-foreground">to</span>
                <DatePicker value={dateTo} onChange={setDateTo} className="h-9 w-[140px] text-body" placeholder="To" />
              </div>
            )}

            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
              <Input
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[200px]"
              />
            </div>
          </div>

          {/* Active Filter Pills */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((f) => (
                <Badge key={f.key} variant="neutral" className="gap-1 pr-1">
                  {f.label}
                  <Button variant="ghost" className="rounded-full hover:bg-muted-foreground/20 p-0.5 h-auto" onClick={f.onRemove}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button variant="link" size="sm" className="h-auto p-0 text-body text-muted-foreground hover:text-foreground ml-1" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          )}
        </Tabs>

        {/* Bulk Actions Bar */}
        <BulkActionBar
          count={selectedIds.size}
          itemLabel="record"
          onClear={() => setSelectedIds(new Set())}
          actions={[
            {
              label: 'Download',
              icon: Download,
              onClick: () => {
                const selected = records.filter(r => selectedIds.has(r.id));
                const categoryLabels = Object.fromEntries(
                  Object.entries(categoryConfig).map(([k, v]) => [k, v.label])
                );
                const pdfContent = generateBulkRecordsPdfContent(selected, categoryLabels);
                downloadAsHtml(`health-records-${selected.length}.pdf`, `<h1>Health Records</h1>${pdfContent}`);
                showToast('Records downloaded', 'success');
              },
            },
            {
              label: 'Share',
              icon: Share2,
              onClick: () => setBulkShareOpen(true),
            },
          ]}
          className="mb-4"
        />

        {/* Table */}
        {filteredRecords.length > 0 ? (
          <div className="mt-4">
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-col-checkbox">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-col-date">Date</TableHead>
                    <TableHead className="max-w-col-details">Details</TableHead>
                    <TableHead className="w-col-member">Family member</TableHead>
                    <TableHead className="w-col-status">Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => {
                    const config = categoryConfig[record.category] || { label: record.category, color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--secondary))' };
                    const member = record.family_member_id ? memberMap[record.family_member_id] : undefined;
                    const isSelected = selectedIds.has(record.id);

                    return (
                      <TableRow
                        key={record.id}
                        data-state={isSelected ? 'selected' : undefined}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.visit(`/health-records/${record.id}`)}
                      >
                        <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(record.id)}
                            aria-label={`Select ${record.title}`}
                          />
                        </TableCell>
                        <TableCell className="align-top">
                          <p className="text-label whitespace-nowrap">{formatDate(record.record_date) || '—'}</p>
                        </TableCell>
                        <TableCell className="max-w-col-details align-top">
                          <div className="flex items-center gap-2.5">
                            <CategoryIcon category={record.category} size="sm" />
                            <div className="min-w-0">
                              <p className="text-label truncate">{record.title}</p>
                              <p className="text-body text-muted-foreground truncate">
                                {config.label}{record.doctor_name && ` • ${record.doctor_name}`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="text-label whitespace-nowrap">
                            {member ? member.name : 'You'}
                          </span>
                        </TableCell>
                        <TableCell className="align-top">
                          {record.status ? <StatusBadge status={record.status} /> : <span className="text-body text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="align-top w-1">
                          <Button variant="secondary" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <TablePagination
                from={startIdx + 1}
                to={Math.min(startIdx + RECORDS_PER_PAGE, filteredRecords.length)}
                total={filteredRecords.length}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemLabel="records"
              />
            </TableContainer>

          </div>
        ) : (
          <div className="mt-6">
            {records.length === 0 ? (
              <EmptyState
                image="/assets/images/health-records.png"
                message="No health records yet"
                description="Lab reports, prescriptions, and visit summaries will appear here after your appointments."
              />
            ) : (
              <EmptyState
                image="/assets/images/health-records.png"
                message="No records match your filters"
                description="Try adjusting your filters to find what you're looking for."
              />
            )}
          </div>
        )}

      </div>

      {/* Individual Record Share Sheet */}
      {shareRecord && (
        <ShareDialog
          open={!!shareRecord}
          onOpenChange={(open) => !open && setShareRecord(null)}
          title={shareRecord.title}
          description={`${categoryConfig[shareRecord.category]?.label || shareRecord.category} — ${shareRecord.record_date_formatted}${shareRecord.doctor_name ? ` — ${shareRecord.doctor_name}` : ''}`}
          url={`${window.location.origin}/health-records/${shareRecord.id}`}
        />
      )}

      {/* Bulk Share Sheet */}
      <ShareDialog
        open={bulkShareOpen}
        onOpenChange={setBulkShareOpen}
        title={`${selectedIds.size} Health Records`}
        description={records.filter(r => selectedIds.has(r.id)).slice(0, 3).map(r => r.title).join(', ') + (selectedIds.size > 3 ? '...' : '')}
        url={window.location.href}
      />
    </AppLayout>
  );
}

