import { useState, useMemo, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/Components/ui/sheet';
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
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Toast } from '@/Components/ui/toast';
import { cn } from '@/Lib/utils';
import {
  Search,
  Stethoscope,
  Pill,
  TestTube2,
  ScanLine,
  UserPlus,
  FileText,
  Receipt,
  ExternalLink,
  Download,
  FolderOpen,
  HeartPulse,
  Microscope,
  Wind,
  Syringe,
  Radio,
  ClipboardList,
  ClipboardCheck,
  Award,
  Archive,
  Ambulance,
  BrainCircuit,
  MoreHorizontal,
  AlertTriangle,
  Share2,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
  Link2,
  Check,
  X,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Calendar,
  Activity,
  ShieldCheck,
  FileDown,
} from '@/Lib/icons';

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
  refills_remaining?: number;
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
  abnormalCount: number;
  preSelectedRecordId?: number | null;
  preSelectedMemberId?: number | null;
}

/* ─── Category Config ─── */

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  // Reports
  lab_report:         { label: 'Lab Report',   icon: TestTube2,      color: '#1E40AF', bg: '#BFDBFE' },
  xray_report:        { label: 'X-Ray',        icon: ScanLine,       color: '#1E40AF', bg: '#BFDBFE' },
  mri_report:         { label: 'MRI',          icon: BrainCircuit,   color: '#1E40AF', bg: '#BFDBFE' },
  ultrasound_report:  { label: 'Ultrasound',   icon: Radio,          color: '#1E40AF', bg: '#BFDBFE' },
  ecg_report:         { label: 'ECG',          icon: HeartPulse,     color: '#1E40AF', bg: '#BFDBFE' },
  pathology_report:   { label: 'Pathology',    icon: Microscope,     color: '#1E40AF', bg: '#BFDBFE' },
  pft_report:         { label: 'PFT',          icon: Wind,           color: '#1E40AF', bg: '#BFDBFE' },
  other_report:       { label: 'Other Report', icon: ClipboardList,  color: '#1E40AF', bg: '#BFDBFE' },
  // Visits
  consultation_notes: { label: 'Consultation', icon: Stethoscope,    color: '#1E40AF', bg: '#BFDBFE' },
  procedure_notes:    { label: 'Procedure',    icon: Syringe,        color: '#1E40AF', bg: '#BFDBFE' },
  discharge_summary:  { label: 'Discharge',    icon: FileText,       color: '#1E40AF', bg: '#BFDBFE' },
  er_visit:           { label: 'ER Visit',     icon: Ambulance,      color: '#1E40AF', bg: '#BFDBFE' },
  referral:           { label: 'Referral',     icon: UserPlus,       color: '#1E40AF', bg: '#BFDBFE' },
  other_visit:        { label: 'Other Visit',  icon: ClipboardCheck, color: '#1E40AF', bg: '#BFDBFE' },
  // Medications
  prescription:       { label: 'Prescription', icon: Pill,           color: '#1E40AF', bg: '#BFDBFE' },
  medication_active:  { label: 'Active Med',   icon: Pill,           color: '#1E40AF', bg: '#BFDBFE' },
  medication_past:    { label: 'Past Med',     icon: Archive,        color: '#1E40AF', bg: '#BFDBFE' },
  // Documents
  vaccination:        { label: 'Vaccination',  icon: Syringe,        color: '#1E40AF', bg: '#BFDBFE' },
  medical_certificate:{ label: 'Certificate',  icon: Award,          color: '#1E40AF', bg: '#BFDBFE' },
  invoice:            { label: 'Invoice',      icon: Receipt,        color: '#1E40AF', bg: '#BFDBFE' },
};

const typeGroups: Record<string, string[]> = {
  reports:      ['lab_report', 'xray_report', 'mri_report', 'ultrasound_report', 'ecg_report', 'pathology_report', 'pft_report', 'other_report'],
  visits:       ['consultation_notes', 'procedure_notes', 'discharge_summary', 'er_visit', 'referral', 'other_visit'],
  medications:  ['prescription', 'medication_active', 'medication_past'],
  documents:    ['vaccination', 'medical_certificate', 'invoice'],
};

const RECORDS_PER_PAGE = 10;

function CategoryIcon({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' }) {
  const config = categoryConfig[category] || { icon: FileText, color: '#6B7280', bg: '#F3F4F6' };
  const Icon = config.icon;
  const dim = size === 'sm' ? 'h-10 w-10' : 'h-10 w-10';
  const iconDim = size === 'sm' ? 'h-5 w-5' : 'h-[18px] w-[18px]';
  return (
    <div
      className={cn(dim, 'rounded-full flex items-center justify-center flex-shrink-0')}
      style={{ backgroundColor: config.bg }}
    >
      <Icon className={iconDim} style={{ color: config.color }} />
    </div>
  );
}

function StatusBadge({ status }: { status: RecordStatus }) {
  const variantMap: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    destructive: 'destructive',
    secondary: 'secondary',
  };
  return (
    <Badge variant={variantMap[status.variant] || 'secondary'} className="text-[10px] px-2 py-0.5">
      {status.label}
    </Badge>
  );
}

/* ─── Skeleton ─── */

function HealthRecordsSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
      <div className="flex items-start justify-between mb-6">
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
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-0">
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

export default function Index({ user, records, familyMembers, abnormalCount, preSelectedRecordId, preSelectedMemberId }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(records);
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
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Auto-open detail sheet when deep-linked from search
  useEffect(() => {
    if (preSelectedRecordId) {
      const record = records.find((r) => r.id === preSelectedRecordId);
      if (record) setSelectedRecord(record);
    }
  }, [preSelectedRecordId]);

  // Read filter parameters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

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

    // Read category filter (can be comma-separated)
    const category = params.get('category');
    if (category) {
      // For medications: "medication_active,medication_past"
      // For single category: just the category name
      // Note: subCategoryFilter expects a single value, but we can set the first one
      const firstCategory = category.split(',')[0];

      // Validate against categoryConfig keys
      const validCategories = Object.keys(categoryConfig);
      if (validCategories.includes(firstCategory)) {
        setSubCategoryFilter(firstCategory);

        // If it's a medication category, switch to medications tab
        if (firstCategory.startsWith('medication_')) {
          setActiveTab('medications');
        }
      }
    }
  }, []);

  const memberMap = useMemo(() => {
    const map: Record<number, FamilyMember> = {};
    familyMembers.forEach((m) => { map[m.id] = m; });
    return map;
  }, [familyMembers]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { all: records.length, reports: 0, visits: 0, medications: 0, documents: 0 };
    for (const r of records) {
      for (const [group, cats] of Object.entries(typeGroups)) {
        if (cats.includes(r.category)) { counts[group]++; break; }
      }
    }
    return counts;
  }, [records]);

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

  function handleFilterToAttention() {
    setActiveTab('all');
    setSubCategoryFilter('all');
    setStatusFilter('needs_attention');
    setMemberFilter('all');
    setDatePreset('any');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  }

  const toast = (msg: string) => setToastMessage(msg);

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Health Records" pageIcon="/assets/icons/records-selected.svg">
        <ErrorState onRetry={retry} label="Unable to load health records" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Health Records" pageIcon="/assets/icons/records-selected.svg">
        <HealthRecordsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      pageTitle="Health Records"
      pageIcon="/assets/icons/records-selected.svg"
    >
      <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="font-bold"
              style={{ fontSize: '36px', lineHeight: '44px', letterSpacing: '-1px', color: '#171717' }}
            >
              Health Records
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {records.length} records across {familyMembers.length + 1} family members
            </p>
          </div>
        </div>


        {/* Tabs + Filters */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-4">
          <TabsList className="bg-muted/60">
            {[
              { value: 'all', label: 'All' },
              { value: 'reports', label: 'Reports' },
              { value: 'visits', label: 'Visits' },
              { value: 'medications', label: 'Medications' },
              { value: 'documents', label: 'Documents' },
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                {tab.label}
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[11px]">
                  {groupCounts[tab.value]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
              <SelectTrigger className="w-[170px] h-9">
                <SelectValue placeholder={activeTab === 'all' ? 'All Categories' : `All ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {activeTab === 'all' ? 'All Categories' : `All ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                </SelectItem>
                {subCategoryOptions.map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="needs_attention">Needs Attention</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="follow_up_required">Follow-up Required</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>

            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
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
                <SelectValue placeholder="Any Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Time</SelectItem>
                <SelectItem value="last_7">Last 7 Days</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="last_90">Last 3 Months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <div className="flex items-center gap-1.5">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-[130px] text-sm" />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-[130px] text-sm" />
              </div>
            )}

            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <Badge key={f.key} variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1 h-7 text-xs font-medium">
                  {f.label}
                  <button onClick={f.onRemove} className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button onClick={clearAllFilters} className="text-xs text-muted-foreground hover:text-foreground ml-1">
                Clear all
              </button>
            </div>
          )}
        </Tabs>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2.5 mt-4 mb-4">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast('Download feature coming soon')}>
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast('Share feature coming soon')}>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {/* Table */}
        {filteredRecords.length > 0 ? (
          <div className={selectedIds.size === 0 ? 'mt-4' : ''}>
            <div className="border" style={{ borderRadius: '20px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead className="w-[120px]">Patient</TableHead>
                    <TableHead className="w-[180px]">Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((record) => {
                    const config = categoryConfig[record.category] || { label: record.category, color: '#6B7280', bg: '#F3F4F6' };
                    const member = record.family_member_id ? memberMap[record.family_member_id] : undefined;
                    const isSelected = selectedIds.has(record.id);

                    return (
                      <TableRow
                        key={record.id}
                        data-state={isSelected ? 'selected' : undefined}
                        className="cursor-pointer"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(record.id)}
                            aria-label={`Select ${record.title}`}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium whitespace-nowrap">{record.record_date_formatted}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CategoryIcon category={record.category} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{record.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 h-[18px] font-medium rounded flex-shrink-0"
                                  style={{ backgroundColor: config.bg, color: config.color }}
                                >
                                  {config.label}
                                </Badge>
                                {record.doctor_name && (
                                  <span className="text-xs text-muted-foreground truncate">{record.doctor_name}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {member ? member.name : 'You'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.status && <StatusBadge status={record.status} />}
                            {record.status?.label === 'Needs Attention' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[11px] px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecord(record);
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedRecord(record)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast('Download feature coming soon')}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast('Share feature coming soon')}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast('Print feature coming soon')}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </DropdownMenuItem>
                              {record.appointment_id && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/appointments/${record.appointment_id}`} className="flex items-center">
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Link to Appointment
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              {record.insurance_claim_id && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/insurance/claims/${record.insurance_claim_id}`} className="flex items-center">
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    View Insurance Claim
                                  </Link>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between px-4 py-4 border-t border-[#E5E5E5]">
                <p className="text-sm text-muted-foreground">
                  Showing {startIdx + 1}–{Math.min(startIdx + RECORDS_PER_PAGE, filteredRecords.length)} of {filteredRecords.length} records
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Need help?{' '}
              <a href="#" className="underline hover:text-foreground">
                Contact support →
              </a>
            </p>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No records yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Book an appointment to get started.</p>
            <Button asChild size="lg">
              <Link href="/booking">Book Appointment</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={selectedRecord !== null} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          {selectedRecord && (
            <RecordDetailSheet
              record={selectedRecord}
              memberMap={memberMap}
              onDownload={() => toast('Download feature coming soon')}
              onAction={toast}
            />
          )}
        </SheetContent>
      </Sheet>

      <Toast show={!!toastMessage} message={toastMessage} onHide={() => setToastMessage('')} />
    </AppLayout>
  );
}

/* ─── Detail Side Sheet ─── */

function RecordDetailSheet({ record, memberMap, onDownload, onAction }: { record: HealthRecord; memberMap: Record<number, FamilyMember>; onDownload: () => void; onAction: (msg: string) => void }) {
  const config = categoryConfig[record.category] || { label: record.category, color: '#6B7280', bg: '#F3F4F6' };
  const member = record.family_member_id ? memberMap[record.family_member_id] : undefined;
  const meta = record.metadata;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <div className="flex items-center gap-3 mb-1">
          <CategoryIcon category={record.category} />
          <div>
            <SheetTitle className="text-base">{record.title}</SheetTitle>
            <SheetDescription>
              {record.record_date_formatted}
              {record.doctor_name ? ` · ${record.doctor_name}` : ''}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto">
        <div className="space-y-2">
          {record.department_name && <DetailRow label="Department">{record.department_name}</DetailRow>}
          {member && <DetailRow label="Patient">{member.name} ({member.relation})</DetailRow>}
          <DetailRow label="Category">
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium rounded" style={{ backgroundColor: config.bg, color: config.color }}>
              {config.label}
            </Badge>
          </DetailRow>
          {record.status && (
            <DetailRow label="Status">
              <StatusBadge status={record.status} />
            </DetailRow>
          )}
          {record.file_type && (
            <DetailRow label="File Type">
              <span className="uppercase text-xs font-medium text-muted-foreground">{record.file_type}</span>
            </DetailRow>
          )}
        </div>

        {record.description && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Summary</p>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{record.description}</p>
          </div>
        )}

        {/* Category-specific content */}
        {meta && <CategoryDetail category={record.category} meta={meta} onAction={onAction} record={record} memberMap={memberMap} />}
      </div>

      <div className="pt-4 flex gap-2">
        {record.file_type ? (
          <Button className="flex-1" onClick={onDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        ) : record.appointment_id ? (
          <Button asChild className="flex-1">
            <Link href={`/appointments/${record.appointment_id}`}>
              <ExternalLink className="h-4 w-4" />
              View Appointment
            </Link>
          </Button>
        ) : null}
        {((record.file_type && record.appointment_id) || (record.category === 'invoice' && record.appointment_id)) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              {record.file_type && record.appointment_id && (
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href={`/appointments/${record.appointment_id}`}>
                    <ExternalLink className="h-4 w-4" />
                    View Appointment
                  </Link>
                </DropdownMenuItem>
              )}
              {record.category === 'invoice' && record.appointment_id && (
                <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                  <Link href={`/billing/${record.appointment_id}`}>
                    <Receipt className="h-4 w-4" />
                    View Bill
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/* ─── Category Detail Router ─── */

function CategoryDetail({ category, meta, onAction, record, memberMap }: { category: string; meta: RecordMetadata; onAction: (msg: string) => void; record: HealthRecord; memberMap: Record<number, FamilyMember> }) {
  switch (category) {
    case 'consultation_notes': return <ConsultationDetail meta={meta} onAction={onAction} />;
    case 'prescription': return <PrescriptionDetail meta={meta} />;
    case 'lab_report': return <LabReportDetail meta={meta} />;
    case 'xray_report': return <XrayDetail meta={meta} />;
    case 'mri_report': return <MriDetail meta={meta} />;
    case 'ultrasound_report': return <UltrasoundDetail meta={meta} />;
    case 'ecg_report': return <EcgDetail meta={meta} />;
    case 'pathology_report': return <PathologyDetail meta={meta} />;
    case 'pft_report': return <PftDetail meta={meta} />;
    case 'other_report': return <OtherReportDetail meta={meta} />;
    case 'procedure_notes': return <ProcedureDetail meta={meta} onAction={onAction} />;
    case 'er_visit': return <ErVisitDetail meta={meta} onAction={onAction} />;
    case 'referral': return <ReferralDetail meta={meta} />;
    case 'discharge_summary': return <DischargeDetail meta={meta} onAction={onAction} />;
    case 'other_visit': return <OtherVisitDetail meta={meta} />;
    case 'medication_active': return <MedicationActiveDetail meta={meta} onAction={onAction} />;
    case 'medication_past': return <MedicationPastDetail meta={meta} onAction={onAction} />;
    case 'vaccination': return <VaccinationDetail meta={meta} onAction={onAction} record={record} memberMap={memberMap} />;
    case 'medical_certificate': return <MedicalCertificateDetail meta={meta} onAction={onAction} />;
    case 'invoice': return <InvoiceDetail meta={meta} />;
    default: return null;
  }
}

/* ─── Shared Components ─── */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{children}</p>;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    normal:     { bg: '#F0FDF4', text: '#22C55E', label: 'Normal' },
    borderline: { bg: '#FFFBEB', text: '#F59E0B', label: 'Borderline' },
    abnormal:   { bg: '#FEF2F2', text: '#EF4444', label: 'Abnormal' },
    high:       { bg: '#FEF2F2', text: '#EF4444', label: 'High' },
    low:        { bg: '#FFFBEB', text: '#F59E0B', label: 'Low' },
    elevated:   { bg: '#FFFBEB', text: '#F59E0B', label: 'Elevated' },
  };
  const c = colors[status] || { bg: '#F3F4F6', text: '#6B7280', label: status };
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

function FindingsImpression({ findings, impression, impressionColor = '#0E7490', impressionBg = 'bg-cyan-50' }: { findings?: string; impression?: string; impressionColor?: string; impressionBg?: string }) {
  return (
    <>
      {findings && (
        <div>
          <SectionTitle>Findings</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{findings}</p>
        </div>
      )}
      {impression && (
        <div>
          <SectionTitle>Impression</SectionTitle>
          <div className={cn('rounded-lg px-3 py-2', impressionBg)}>
            <p className="text-sm" style={{ color: impressionColor }}>{impression}</p>
          </div>
        </div>
      )}
    </>
  );
}

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

/* ─── New Shared Helpers ─── */

function VitalsGrid({ vitals, statuses, painScore }: { vitals: Record<string, string>; statuses?: Record<string, string>; painScore?: string }) {
  const allItems = [
    ...Object.entries(vitals).map(([key, val]) => ({ key, val })),
    ...(painScore ? [{ key: 'pain_score', val: painScore }] : []),
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {allItems.map(({ key, val }) => {
        const status = statuses?.[key];
        return (
          <div key={key} className="rounded-lg border px-3 py-2">
            <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{val}</p>
              {status && <StatusDot status={status.toLowerCase()} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NumberedList({ items, variant = 'default' }: { items: string[]; variant?: 'default' | 'check' | 'x' | 'warning' }) {
  const iconMap = {
    check: <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />,
    x: <X className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />,
  };
  return (
    <ol className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm flex items-start gap-2 leading-relaxed" style={{ color: '#374151' }}>
          {variant === 'default' ? (
            <span className="text-xs font-medium text-muted-foreground w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
          ) : (
            iconMap[variant]
          )}
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function LinkedRecordsList({ records, onView }: { records: LinkedRecord[]; onView: (title: string) => void }) {
  return (
    <div className="space-y-1">
      {records.map((rec, i) => {
        const config = categoryConfig[rec.icon_type];
        return (
          <button
            key={i}
            className="flex items-center gap-2.5 w-full rounded-lg border px-3 py-2 text-left hover:bg-muted/50 transition-colors"
            onClick={() => onView(rec.title)}
          >
            {config ? (
              <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bg }}>
                <config.icon className="h-3.5 w-3.5" style={{ color: config.color }} />
              </div>
            ) : (
              <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 bg-gray-100">
                <FileText className="h-3.5 w-3.5 text-gray-500" />
              </div>
            )}
            <span className="text-sm flex-1 truncate">{rec.title}</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </button>
        );
      })}
    </div>
  );
}

/* ─── Visit Detail Components ─── */

function ConsultationDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Visit Details */}
      {(meta.visit_type_label || meta.opd_number || meta.duration || meta.location) && (
        <div>
          <SectionTitle>Visit Details</SectionTitle>
          <div className="space-y-0">
            {(meta.visit_type_label || meta.opd_number) && (
              <DetailRow label="Visit Type">
                {meta.visit_type_label}{meta.opd_number ? ` | ${meta.opd_number}` : ''}
              </DetailRow>
            )}
            {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
            {meta.location && <DetailRow label="Location">{meta.location}</DetailRow>}
          </div>
        </div>
      )}

      {/* Vitals Recorded */}
      {meta.vitals && Object.keys(meta.vitals).length > 0 && (
        <div>
          <SectionTitle>Vitals Recorded</SectionTitle>
          <VitalsGrid vitals={meta.vitals} statuses={meta.vitals_status} />
        </div>
      )}

      {/* Clinical Summary */}
      <div className="space-y-4">
        <SectionTitle>Clinical Summary</SectionTitle>
        {meta.chief_complaint && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Chief Complaint</p>
            <div className="rounded-lg bg-blue-50 px-3 py-2">
              <p className="text-sm" style={{ color: '#1E40AF' }}>{meta.chief_complaint}</p>
            </div>
          </div>
        )}
        {meta.symptoms && meta.symptoms.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Symptoms</p>
            <div className="flex flex-wrap gap-1.5">
              {meta.symptoms.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
            </div>
          </div>
        )}
        {(meta.history_of_present_illness) && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">History of Present Illness</p>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.history_of_present_illness}</p>
          </div>
        )}
        {(meta.clinical_examination || meta.examination_findings) && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Examination</p>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.clinical_examination || meta.examination_findings}</p>
          </div>
        )}
        {meta.diagnosis && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Diagnosis</p>
            <div className="rounded-lg bg-blue-50 px-3 py-2">
              <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>{meta.diagnosis}</p>
              {meta.icd_code && <p className="text-[11px] text-blue-500 mt-0.5">ICD: {meta.icd_code}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Treatment Plan */}
      {(meta.treatment_plan_steps?.length || meta.treatment_plan) && (
        <div>
          <SectionTitle>Treatment Plan</SectionTitle>
          {meta.treatment_plan_steps && meta.treatment_plan_steps.length > 0 ? (
            <NumberedList items={meta.treatment_plan_steps} />
          ) : meta.treatment_plan ? (
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.treatment_plan}</p>
          ) : null}
        </div>
      )}

      {/* Linked Records */}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}

      {/* Follow-up */}
      {(meta.follow_up_recommendation || meta.follow_up_date || meta.follow_up) && (
        <div>
          <SectionTitle>Follow-up</SectionTitle>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-3 space-y-2">
            {(meta.follow_up_recommendation || meta.follow_up) && (
              <p className="text-sm" style={{ color: '#374151' }}>{meta.follow_up_recommendation || meta.follow_up}</p>
            )}
            {meta.follow_up_date && (
              <p className="text-xs text-muted-foreground">Recommended: {fmtDate(meta.follow_up_date)}</p>
            )}
            <Button size="sm" variant="outline" className="w-full" onClick={() => onAction('Follow-up booking coming soon')}>
              <Calendar className="h-3.5 w-3.5" />
              Book Follow-up Appointment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcedureDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="space-y-4">
      {meta.procedure_name && <DetailRow label="Procedure">{meta.procedure_name}</DetailRow>}
      {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      {meta.anesthesia && <DetailRow label="Anesthesia">{meta.anesthesia}</DetailRow>}
      {meta.technique && (
        <div>
          <SectionTitle>Technique</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.technique}</p>
        </div>
      )}
      {meta.findings && (
        <div>
          <SectionTitle>Findings</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.findings}</p>
        </div>
      )}
      {meta.complications && <DetailRow label="Complications">{meta.complications}</DetailRow>}
      {meta.post_op_instructions && (
        <div>
          <SectionTitle>Post-Procedure Instructions</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.post_op_instructions}</p>
        </div>
      )}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function ErVisitDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Visit Details */}
      {(meta.er_number || meta.arrival_time || meta.triage_level || meta.mode_of_arrival) && (
        <div>
          <SectionTitle>Visit Details</SectionTitle>
          <div className="space-y-0">
            {meta.er_number && <DetailRow label="ER Number">{meta.er_number}</DetailRow>}
            {meta.arrival_time && <DetailRow label="Arrival">{meta.arrival_time}</DetailRow>}
            {meta.discharge_time && <DetailRow label="Discharge">{meta.discharge_time}</DetailRow>}
            {meta.duration && <DetailRow label="Duration">{meta.duration}</DetailRow>}
            {meta.triage_level && (
              <DetailRow label="Triage Level">
                <Badge variant="secondary" className={cn(
                  'text-[10px]',
                  meta.triage_level.includes('1') || meta.triage_level.includes('2') ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                )}>
                  {meta.triage_level}
                </Badge>
              </DetailRow>
            )}
            {(meta.attending_doctor) && <DetailRow label="Attending">{meta.attending_doctor}</DetailRow>}
            {meta.mode_of_arrival && <DetailRow label="Mode of Arrival">{meta.mode_of_arrival}</DetailRow>}
          </div>
        </div>
      )}

      {/* Chief Complaint */}
      {meta.chief_complaint && (
        <div>
          <SectionTitle>Chief Complaint</SectionTitle>
          <div className="rounded-lg bg-red-50 px-3 py-2">
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{meta.chief_complaint}</p>
          </div>
        </div>
      )}

      {/* Vitals on Arrival */}
      {meta.vitals && Object.keys(meta.vitals).length > 0 && (
        <div>
          <SectionTitle>Vitals on Arrival</SectionTitle>
          <VitalsGrid vitals={meta.vitals} statuses={meta.vitals_status} painScore={meta.pain_score} />
        </div>
      )}

      {/* Examination */}
      {meta.examination && (
        <div>
          <SectionTitle>Examination</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.examination}</p>
        </div>
      )}

      {/* Investigations Done */}
      {meta.investigations && meta.investigations.length > 0 && (
        <div>
          <SectionTitle>Investigations Done</SectionTitle>
          <div className="space-y-1.5">
            {meta.investigations.map((inv, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                <div className="flex-1">
                  <span className="font-medium">{inv.name}</span>
                  <span className="text-muted-foreground"> — {inv.result}</span>
                </div>
                {inv.has_link && (
                  <button className="text-xs text-blue-600 hover:underline flex-shrink-0" onClick={() => onAction(`Opening ${inv.name}...`)}>
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosis */}
      {meta.diagnosis && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <div className="rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-sm font-medium" style={{ color: '#92400E' }}>{meta.diagnosis}</p>
          </div>
        </div>
      )}

      {/* Treatment Given */}
      {(meta.treatment_items?.length || meta.treatment_given) && (
        <div>
          <SectionTitle>Treatment Given in ER</SectionTitle>
          {meta.treatment_items && meta.treatment_items.length > 0 ? (
            <NumberedList items={meta.treatment_items} />
          ) : meta.treatment_given ? (
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.treatment_given}</p>
          ) : null}
        </div>
      )}

      {/* Disposition */}
      {(meta.disposition || meta.disposition_detail) && (
        <div>
          <SectionTitle>Disposition</SectionTitle>
          {meta.disposition && <p className="text-sm font-medium" style={{ color: '#374151' }}>{meta.disposition}</p>}
          {meta.disposition_detail && <p className="text-sm leading-relaxed text-muted-foreground mt-1">{meta.disposition_detail}</p>}
        </div>
      )}

      {/* Follow-up */}
      {meta.follow_up && <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>}

      {/* Linked Records */}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function ReferralDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-3">
      {meta.referred_to_doctor && <DetailRow label="Referred To">{meta.referred_to_doctor}</DetailRow>}
      {meta.referred_to_department && <DetailRow label="Department">{meta.referred_to_department}</DetailRow>}
      {meta.priority && (
        <DetailRow label="Priority">
          <Badge variant="secondary" className={cn('text-[10px] capitalize', meta.priority === 'urgent' && 'bg-red-50 text-red-600', meta.priority === 'routine' && 'bg-gray-100 text-gray-600')}>
            {meta.priority}
          </Badge>
        </DetailRow>
      )}
      {meta.reason && (
        <div>
          <SectionTitle>Reason</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.reason}</p>
        </div>
      )}
    </div>
  );
}

function DischargeDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Admission Details */}
      <div>
        <SectionTitle>Admission Details</SectionTitle>
        <div className="space-y-0">
          {meta.admission_date && <DetailRow label="Admission Date">{fmtDate(meta.admission_date)}</DetailRow>}
          {meta.discharge_date && <DetailRow label="Discharge Date">{fmtDate(meta.discharge_date)}</DetailRow>}
          {meta.length_of_stay && <DetailRow label="Length of Stay">{meta.length_of_stay}</DetailRow>}
          {meta.treating_doctor && <DetailRow label="Treating Doctor">{meta.treating_doctor}</DetailRow>}
          {meta.room_info && <DetailRow label="Room">{meta.room_info}</DetailRow>}
          {meta.ipd_number && <DetailRow label="IPD Number">{meta.ipd_number}</DetailRow>}
        </div>
      </div>

      {/* Diagnosis */}
      {(meta.primary_diagnosis || meta.diagnosis || meta.secondary_diagnosis || meta.procedure_performed) && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <div className="space-y-2">
            {(meta.primary_diagnosis || meta.diagnosis) && (
              <div className="rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-[10px] text-blue-500 uppercase mb-0.5">Primary</p>
                <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>{meta.primary_diagnosis || meta.diagnosis}</p>
              </div>
            )}
            {meta.secondary_diagnosis && (
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase mb-0.5">Secondary</p>
                <p className="text-sm" style={{ color: '#374151' }}>{meta.secondary_diagnosis}</p>
              </div>
            )}
            {meta.procedure_performed && (
              <DetailRow label="Procedure">{meta.procedure_performed}</DetailRow>
            )}
          </div>
        </div>
      )}

      {/* Hospital Course */}
      {meta.hospital_course && (
        <div>
          <SectionTitle>Hospital Course</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.hospital_course}</p>
        </div>
      )}

      {/* Vitals at Discharge */}
      {meta.vitals_at_discharge && Object.keys(meta.vitals_at_discharge).length > 0 && (
        <div>
          <SectionTitle>Vitals at Discharge</SectionTitle>
          <VitalsGrid vitals={meta.vitals_at_discharge} />
        </div>
      )}

      {/* Procedures */}
      {meta.procedures && meta.procedures.length > 0 && (
        <div>
          <SectionTitle>Procedures</SectionTitle>
          <ul className="space-y-1">
            {meta.procedures.map((p, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discharge Medications */}
      {meta.discharge_medications && meta.discharge_medications.length > 0 && (
        <div>
          <SectionTitle>Discharge Medications</SectionTitle>
          <ol className="space-y-1.5">
            {meta.discharge_medications.map((med, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#374151' }}>
                <span className="text-xs font-medium text-muted-foreground w-4 flex-shrink-0 mt-0.5">{i + 1}.</span>
                <span>{med.name} — {med.dosage} x {med.duration}</span>
              </li>
            ))}
          </ol>
          <button
            className="text-xs text-blue-600 hover:underline mt-2"
            onClick={() => onAction('Opening prescription...')}
          >
            View Full Prescription &rarr;
          </button>
        </div>
      )}

      {/* Discharge Instructions (dos/donts or fallback) */}
      {(meta.discharge_dos?.length || meta.discharge_donts?.length || meta.discharge_instructions) && (
        <div>
          <SectionTitle>Discharge Instructions</SectionTitle>
          {meta.discharge_dos && meta.discharge_dos.length > 0 && (
            <div className="mb-3">
              <NumberedList items={meta.discharge_dos} variant="check" />
            </div>
          )}
          {meta.discharge_donts && meta.discharge_donts.length > 0 && (
            <NumberedList items={meta.discharge_donts} variant="x" />
          )}
          {!meta.discharge_dos?.length && !meta.discharge_donts?.length && meta.discharge_instructions && (
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.discharge_instructions}</p>
          )}
        </div>
      )}

      {/* Warning Signs */}
      {meta.warning_signs && meta.warning_signs.length > 0 && (
        <div>
          <SectionTitle>Warning Signs — Contact Immediately If</SectionTitle>
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-3 space-y-2">
            <NumberedList items={meta.warning_signs} variant="warning" />
            {meta.emergency_contact && (
              <div className="flex items-center gap-2 pt-2 border-t border-red-200">
                <Phone className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-medium text-red-700">{meta.emergency_contact}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up Schedule */}
      {meta.follow_up_schedule && meta.follow_up_schedule.length > 0 && (
        <div>
          <SectionTitle>Follow-up Schedule</SectionTitle>
          <div className="space-y-2">
            {meta.follow_up_schedule.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(item.date)}</p>
                </div>
                {item.booked ? (
                  <Badge variant="success" className="text-[10px]">Booked</Badge>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onAction('Follow-up booking coming soon')}>
                    Book Now
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Records */}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function OtherVisitDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-3">
      {meta.visit_type && <DetailRow label="Visit Type">{meta.visit_type}</DetailRow>}
      {meta.notes && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.notes}</p>
        </div>
      )}
      {meta.follow_up && <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>}
    </div>
  );
}

/* ─── Report Detail Components ─── */

function LabReportDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.test_name && (
        <div className="flex items-center gap-3">
          {meta.test_category && <Badge variant="secondary" className="text-xs">{meta.test_category}</Badge>}
          {meta.lab_name && <span className="text-xs text-muted-foreground">{meta.lab_name}</span>}
        </div>
      )}
      {meta.results && meta.results.length > 0 && (
        <div>
          <SectionTitle>Results</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Parameter</th>
                  <th className="text-left px-3 py-2 font-medium">Value</th>
                  <th className="text-left px-3 py-2 font-medium">Reference</th>
                  <th className="text-center px-3 py-2 font-medium w-[60px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(meta.results as LabResult[]).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-medium">{r.parameter}</td>
                    <td className="px-3 py-2">{r.value} {r.unit}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.reference_range}</td>
                    <td className="px-3 py-2 text-center"><StatusDot status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function XrayDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
      {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
      {meta.radiologist && <DetailRow label="Radiologist">{meta.radiologist}</DetailRow>}
      <FindingsImpression findings={meta.findings} impression={meta.impression} />
    </div>
  );
}

function MriDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
      {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      {meta.technique && <DetailRow label="Technique">{meta.technique}</DetailRow>}
      {meta.contrast && <DetailRow label="Contrast">{meta.contrast}</DetailRow>}
      {meta.sequences && <DetailRow label="Sequences">{meta.sequences}</DetailRow>}
      {meta.radiologist && <DetailRow label="Radiologist">{meta.radiologist}</DetailRow>}
      <FindingsImpression findings={meta.findings} impression={meta.impression} impressionColor="#6D28D9" impressionBg="bg-purple-50" />
    </div>
  );
}

function UltrasoundDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.body_part && <DetailRow label="Body Part">{meta.body_part}</DetailRow>}
      {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      {meta.sonographer && <DetailRow label="Sonographer">{meta.sonographer}</DetailRow>}
      <FindingsImpression findings={meta.findings} impression={meta.impression} impressionColor="#0F766E" impressionBg="bg-teal-50" />
    </div>
  );
}

function EcgDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      {meta.heart_rate && <DetailRow label="Heart Rate">{meta.heart_rate} bpm</DetailRow>}
      {meta.rhythm && <DetailRow label="Rhythm">{meta.rhythm}</DetailRow>}
      {meta.axis && <DetailRow label="Axis">{meta.axis}</DetailRow>}
      {meta.intervals && (
        <div>
          <SectionTitle>Intervals</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {meta.intervals.pr && (
              <div className="rounded-lg border px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">PR</p>
                <p className="text-sm font-medium">{meta.intervals.pr}</p>
              </div>
            )}
            {meta.intervals.qrs && (
              <div className="rounded-lg border px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">QRS</p>
                <p className="text-sm font-medium">{meta.intervals.qrs}</p>
              </div>
            )}
            {meta.intervals.qt && (
              <div className="rounded-lg border px-3 py-2 text-center">
                <p className="text-[10px] text-muted-foreground">QT</p>
                <p className="text-sm font-medium">{meta.intervals.qt}</p>
              </div>
            )}
          </div>
        </div>
      )}
      <FindingsImpression findings={meta.findings} impression={meta.impression} impressionColor="#DC2626" impressionBg="bg-red-50" />
    </div>
  );
}

function PathologyDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.specimen_type && <DetailRow label="Specimen">{meta.specimen_type}</DetailRow>}
      {meta.pathologist && <DetailRow label="Pathologist">{meta.pathologist}</DetailRow>}
      {meta.gross_description && (
        <div>
          <SectionTitle>Gross Description</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.gross_description}</p>
        </div>
      )}
      {meta.microscopic_findings && (
        <div>
          <SectionTitle>Microscopic Findings</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.microscopic_findings}</p>
        </div>
      )}
      {meta.diagnosis && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <div className="rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-sm font-medium" style={{ color: '#92400E' }}>{meta.diagnosis}</p>
            {meta.grade && <p className="text-[11px] text-amber-600 mt-0.5">Grade: {meta.grade}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function PftDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.indication && <DetailRow label="Indication">{meta.indication}</DetailRow>}
      {meta.results && meta.results.length > 0 && (
        <div>
          <SectionTitle>Results</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Parameter</th>
                  <th className="text-right px-3 py-2 font-medium">Actual</th>
                  <th className="text-right px-3 py-2 font-medium">Predicted</th>
                  <th className="text-right px-3 py-2 font-medium">%</th>
                  <th className="text-center px-3 py-2 font-medium w-[60px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {(meta.results as PftResult[]).map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2 font-medium">{r.parameter}</td>
                    <td className="px-3 py-2 text-right">{r.value}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{r.predicted}</td>
                    <td className="px-3 py-2 text-right">{r.percent_predicted}%</td>
                    <td className="px-3 py-2 text-center"><StatusDot status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {meta.interpretation && (
        <div>
          <SectionTitle>Interpretation</SectionTitle>
          <div className="rounded-lg bg-blue-50 px-3 py-2">
            <p className="text-sm" style={{ color: '#1E40AF' }}>{meta.interpretation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function OtherReportDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.report_type && <DetailRow label="Report Type">{meta.report_type}</DetailRow>}
      <FindingsImpression findings={meta.findings} impression={meta.impression} />
    </div>
  );
}

/* ─── Medication Detail Components ─── */

function PrescriptionDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.drugs && meta.drugs.length > 0 && (
        <div>
          <SectionTitle>Medications</SectionTitle>
          <div className="space-y-3">
            {meta.drugs.map((drug, i) => (
              <div key={i} className="rounded-lg border p-3">
                <p className="text-sm font-semibold" style={{ color: '#00184D' }}>{drug.name}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1.5">
                  <p className="text-[11px] text-muted-foreground">Dosage: <span className="text-foreground">{drug.dosage}</span></p>
                  <p className="text-[11px] text-muted-foreground">Frequency: <span className="text-foreground">{drug.frequency}</span></p>
                  <p className="text-[11px] text-muted-foreground">Duration: <span className="text-foreground">{drug.duration}</span></p>
                </div>
                {drug.instructions && <p className="text-[11px] text-muted-foreground mt-1.5 italic">{drug.instructions}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {meta.valid_until && (
        <p className="text-xs text-muted-foreground">Valid until: <span className="font-medium text-foreground">{fmtDate(meta.valid_until)}</span></p>
      )}
    </div>
  );
}

function MedicationActiveDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div className="space-y-5">
      {/* Drug Name Header */}
      {meta.drug_name && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>{meta.drug_name}</p>
          </div>
        </div>
      )}

      {/* Dosage Instructions */}
      {(meta.dosage || meta.frequency || meta.timing || meta.medication_duration || meta.route) && (
        <div>
          <SectionTitle>Dosage Instructions</SectionTitle>
          <div className="space-y-0">
            {meta.dosage && <DetailRow label="Dose">{meta.dosage}</DetailRow>}
            {meta.frequency && <DetailRow label="Frequency">{meta.frequency}</DetailRow>}
            {meta.timing && <DetailRow label="Timing">{meta.timing}</DetailRow>}
            {meta.with_food && (
              <DetailRow label="Food">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700">Take with food</Badge>
              </DetailRow>
            )}
            {meta.medication_duration && <DetailRow label="Duration">{meta.medication_duration}</DetailRow>}
            {meta.route && <DetailRow label="Route">{meta.route}</DetailRow>}
          </div>
        </div>
      )}

      {/* Purpose */}
      {(meta.condition || meta.how_it_works) && (
        <div>
          <SectionTitle>Purpose</SectionTitle>
          {meta.condition && <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>{meta.condition}</p>}
          {meta.how_it_works && <p className="text-sm leading-relaxed text-muted-foreground">{meta.how_it_works}</p>}
        </div>
      )}

      {/* Prescription Details */}
      {(meta.prescribing_doctor || meta.start_date || meta.original_quantity != null || meta.refills_remaining != null) && (
        <div>
          <SectionTitle>Prescription Details</SectionTitle>
          <div className="space-y-0">
            {meta.prescribing_doctor && <DetailRow label="Prescribed By">{meta.prescribing_doctor}</DetailRow>}
            {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
            {meta.original_quantity != null && <DetailRow label="Qty Dispensed">{meta.original_quantity} tablets</DetailRow>}
            {meta.refills_remaining != null && <DetailRow label="Refills Remaining">{meta.refills_remaining}</DetailRow>}
          </div>
        </div>
      )}

      {/* Common Side Effects */}
      {meta.side_effects && meta.side_effects.length > 0 && (
        <div>
          <SectionTitle>Common Side Effects</SectionTitle>
          <ul className="space-y-1">
            {meta.side_effects.map((se, i) => (
              <li key={i} className="text-sm flex items-start gap-2 leading-relaxed" style={{ color: '#374151' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                {se}
              </li>
            ))}
          </ul>
          {meta.side_effects_warning && (
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{meta.side_effects_warning}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Adherence Tracking */}
      {meta.adherence_this_week && meta.adherence_this_week.length > 0 && (
        <div>
          <SectionTitle>Adherence This Week</SectionTitle>
          <div className="flex items-center gap-1.5 mb-2">
            {meta.adherence_this_week.map((status, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center',
                  status === 'taken' && 'bg-green-100',
                  status === 'missed' && 'bg-red-100',
                  status === 'upcoming' && 'bg-gray-100',
                )}>
                  {status === 'taken' && <Check className="h-4 w-4 text-green-600" />}
                  {status === 'missed' && <X className="h-4 w-4 text-red-500" />}
                  {status === 'upcoming' && <span className="h-2 w-2 rounded-full bg-gray-300" />}
                </div>
                <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          {meta.adherence_rate != null && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', meta.adherence_rate >= 80 ? 'bg-green-500' : meta.adherence_rate >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                  style={{ width: `${meta.adherence_rate}%` }}
                />
              </div>
              <span className="text-xs font-medium">{meta.adherence_rate}%</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onAction('Dose logged successfully')}>
              <Check className="h-3.5 w-3.5" />
              Log Today's Dose
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onAction('Full adherence history coming soon')}>
              <Calendar className="h-3.5 w-3.5" />
              View History
            </Button>
          </div>
        </div>
      )}

      {/* Related Records */}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Related Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function MedicationPastDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Drug Name Header */}
      {meta.drug_name && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <p className="text-sm font-semibold text-muted-foreground">{meta.drug_name}</p>
          </div>
        </div>
      )}

      {/* Dosage Instructions */}
      {(meta.dosage || meta.frequency || meta.timing || meta.medication_duration || meta.route) && (
        <div>
          <SectionTitle>Dosage Instructions</SectionTitle>
          <div className="space-y-0">
            {meta.dosage && <DetailRow label="Dose">{meta.dosage}</DetailRow>}
            {meta.frequency && <DetailRow label="Frequency">{meta.frequency}</DetailRow>}
            {meta.timing && <DetailRow label="Timing">{meta.timing}</DetailRow>}
            {meta.with_food && (
              <DetailRow label="Food">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700">Take with food</Badge>
              </DetailRow>
            )}
            {meta.medication_duration && <DetailRow label="Duration">{meta.medication_duration}</DetailRow>}
            {meta.route && <DetailRow label="Route">{meta.route}</DetailRow>}
          </div>
        </div>
      )}

      {/* Purpose */}
      {(meta.condition || meta.how_it_works) && (
        <div>
          <SectionTitle>Purpose</SectionTitle>
          {meta.condition && <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>{meta.condition}</p>}
          {meta.how_it_works && <p className="text-sm leading-relaxed text-muted-foreground">{meta.how_it_works}</p>}
        </div>
      )}

      {/* Prescription Details */}
      {(meta.prescribing_doctor || meta.start_date || meta.end_date || meta.original_quantity != null) && (
        <div>
          <SectionTitle>Prescription Details</SectionTitle>
          <div className="space-y-0">
            {meta.prescribing_doctor && <DetailRow label="Prescribed By">{meta.prescribing_doctor}</DetailRow>}
            {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
            {meta.end_date && <DetailRow label="Ended">{fmtDate(meta.end_date)}</DetailRow>}
            {meta.original_quantity != null && <DetailRow label="Qty Dispensed">{meta.original_quantity} tablets</DetailRow>}
          </div>
        </div>
      )}

      {/* Reason Stopped */}
      {meta.reason_stopped && (
        <div>
          <SectionTitle>Reason Stopped</SectionTitle>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
            <p className="text-sm" style={{ color: '#92400E' }}>{meta.reason_stopped}</p>
          </div>
        </div>
      )}

      {/* Common Side Effects */}
      {meta.side_effects && meta.side_effects.length > 0 && (
        <div>
          <SectionTitle>Common Side Effects</SectionTitle>
          <ul className="space-y-1">
            {meta.side_effects.map((se, i) => (
              <li key={i} className="text-sm flex items-start gap-2 leading-relaxed" style={{ color: '#374151' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-1.5" />
                {se}
              </li>
            ))}
          </ul>
          {meta.side_effects_warning && (
            <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{meta.side_effects_warning}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Records */}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Related Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

/* ─── Document Detail Components ─── */

function VaccinationDetail({ meta, onAction, record, memberMap }: { meta: RecordMetadata; onAction: (msg: string) => void; record: HealthRecord; memberMap: Record<number, FamilyMember> }) {
  const member = record.family_member_id ? memberMap[record.family_member_id] : undefined;
  return (
    <div className="space-y-5">
      {/* Vaccine Name Header */}
      {meta.vaccine_name && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
          <p className="text-sm font-semibold" style={{ color: '#166534' }}>{meta.vaccine_name}</p>
        </div>
      )}

      {/* Patient Details */}
      {member && (
        <div>
          <SectionTitle>Patient Details</SectionTitle>
          <div className="space-y-0">
            <DetailRow label="Name">{member.name}</DetailRow>
            {member.age && <DetailRow label="Age">{member.age} years</DetailRow>}
            {member.gender && <DetailRow label="Gender"><span className="capitalize">{member.gender}</span></DetailRow>}
            {member.blood_group && <DetailRow label="Blood Group">{member.blood_group}</DetailRow>}
          </div>
        </div>
      )}

      {/* Administration Details */}
      <div>
        <SectionTitle>Administration Details</SectionTitle>
        {meta.dose_number != null && meta.total_doses != null && (
          <div className="mb-2">
            <DetailRow label="Dose">
              {meta.dose_number} of {meta.total_doses}
            </DetailRow>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(meta.dose_number / meta.total_doses) * 100}%` }} />
            </div>
          </div>
        )}
        <div className="space-y-0">
          {meta.batch_number && <DetailRow label="Batch Number">{meta.batch_number}</DetailRow>}
          {meta.administered_by && <DetailRow label="Administered By">{meta.administered_by}</DetailRow>}
          {meta.site && <DetailRow label="Injection Site">{meta.site}</DetailRow>}
          {meta.next_due_date && <DetailRow label="Next Due">{fmtDate(meta.next_due_date)}</DetailRow>}
        </div>
        {meta.next_due_date === null && meta.dose_number === meta.total_doses && (
          <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-center">
            <p className="text-xs font-medium text-green-700">Vaccination course complete</p>
          </div>
        )}
      </div>

      {/* Vaccination History */}
      {meta.vaccination_history && meta.vaccination_history.length > 0 && (
        <div>
          <SectionTitle>Vaccination History</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Vaccine</th>
                  <th className="text-left px-3 py-2 font-medium">Date</th>
                  <th className="text-left px-3 py-2 font-medium">Dose</th>
                </tr>
              </thead>
              <tbody>
                {meta.vaccination_history.map((entry, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">
                      <div>{entry.vaccine_name}</div>
                      <div className="text-muted-foreground">{entry.site}</div>
                    </td>
                    <td className="px-3 py-2">{fmtDate(entry.date)}</td>
                    <td className="px-3 py-2">{entry.dose_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Vaccinations */}
      {meta.upcoming_vaccinations && meta.upcoming_vaccinations.length > 0 && (
        <div>
          <SectionTitle>Upcoming Vaccinations</SectionTitle>
          <div className="space-y-2">
            {meta.upcoming_vaccinations.map((vac, i) => (
              <div key={i} className="rounded-lg border px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{vac.vaccine_name}</p>
                    <p className="text-xs text-muted-foreground">{vac.dose_label} · Due {fmtDate(vac.due_date)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onAction(`Scheduling ${vac.vaccine_name}...`)}>
                    <Calendar className="h-3 w-3" />
                    Schedule
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attached Certificates */}
      {meta.attached_certificates && meta.attached_certificates.length > 0 && (
        <div>
          <SectionTitle>Attached Certificates</SectionTitle>
          <div className="space-y-1.5">
            {meta.attached_certificates.map((file, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div className="h-8 w-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileDown className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground uppercase">{file.type}{file.size ? ` · ${file.size}` : ''}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onAction(`Downloading ${file.name}...`)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedicalCertificateDetail({ meta, onAction }: { meta: RecordMetadata; onAction: (msg: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Certificate Type Header */}
      {meta.certificate_type && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
          <p className="text-sm font-semibold" style={{ color: '#1E40AF' }}>{meta.certificate_type}</p>
        </div>
      )}

      {/* Certificate Details */}
      <div>
        <SectionTitle>Certificate Details</SectionTitle>
        <div className="space-y-0">
          {meta.certificate_number && <DetailRow label="Certificate No.">{meta.certificate_number}</DetailRow>}
          {meta.issued_for && <DetailRow label="Issued For">{meta.issued_for}</DetailRow>}
          {meta.issued_by && <DetailRow label="Issued By">{meta.issued_by}</DetailRow>}
          {meta.valid_from && <DetailRow label="Valid From">{fmtDate(meta.valid_from)}</DetailRow>}
          {meta.valid_until && <DetailRow label="Valid Until">{fmtDate(meta.valid_until)}</DetailRow>}
        </div>
      </div>

      {/* Certificate Content */}
      {(meta.certificate_content || meta.notes) && (
        <div>
          <SectionTitle>Certificate Content</SectionTitle>
          <p className="text-sm leading-relaxed mb-2" style={{ color: '#374151' }}>{meta.certificate_content || meta.notes}</p>
          {meta.examination_findings_list && meta.examination_findings_list.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Examination Findings</p>
              <NumberedList items={meta.examination_findings_list} variant="check" />
            </div>
          )}
        </div>
      )}

      {/* Verification */}
      {(meta.digitally_signed != null || meta.verification_url) && (
        <div>
          <SectionTitle>Verification</SectionTitle>
          <div className="rounded-lg border px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              {meta.digitally_signed ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Digitally Signed & Verified</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-muted-foreground">Not digitally signed</span>
                </>
              )}
            </div>
            {meta.verification_url && (
              <p className="text-xs text-muted-foreground">
                Verify at:{' '}
                <button className="text-blue-600 hover:underline" onClick={() => onAction(`Verification URL: ${meta.verification_url}`)}>
                  {meta.verification_url}
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Linked Records */}
      {meta.linked_records && meta.linked_records.length > 0 && (
        <div>
          <SectionTitle>Linked Records</SectionTitle>
          <LinkedRecordsList records={meta.linked_records} onView={(title) => onAction(`Opening ${title}...`)} />
        </div>
      )}
    </div>
  );
}

function InvoiceDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {meta.invoice_number && <DetailRow label="Invoice">{meta.invoice_number}</DetailRow>}
        {meta.amount != null && (
          <DetailRow label="Amount"><span className="font-semibold">₹{meta.amount.toLocaleString()}</span></DetailRow>
        )}
        {meta.payment_status && (
          <DetailRow label="Status">
            <Badge variant="secondary" className={cn('text-[10px] capitalize', meta.payment_status === 'paid' && 'bg-green-50 text-green-600', meta.payment_status === 'pending' && 'bg-amber-50 text-amber-600', meta.payment_status === 'due' && 'bg-red-50 text-red-600')}>
              {meta.payment_status}
            </Badge>
          </DetailRow>
        )}
      </div>
      {meta.line_items && meta.line_items.length > 0 && (
        <div>
          <SectionTitle>Line Items</SectionTitle>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/50"><th className="text-left px-3 py-2 font-medium">Item</th><th className="text-right px-3 py-2 font-medium w-[80px]">Amount</th></tr></thead>
              <tbody>
                {meta.line_items.map((item, i) => (
                  <tr key={i} className="border-t"><td className="px-3 py-2">{item.label}</td><td className="px-3 py-2 text-right font-medium">₹{item.amount.toLocaleString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

