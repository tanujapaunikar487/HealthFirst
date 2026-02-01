import { useState, useMemo, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
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
  Upload,
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  Link2,
} from 'lucide-react';

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

interface RecordMetadata {
  // consultation_notes
  diagnosis?: string;
  icd_code?: string;
  symptoms?: string[];
  examination_findings?: string;
  treatment_plan?: string;
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
  // vaccination
  vaccine_name?: string;
  dose_number?: number;
  total_doses?: number;
  batch_number?: string;
  administered_by?: string;
  site?: string;
  next_due_date?: string | null;
  // medical_certificate
  certificate_type?: string;
  issued_for?: string;
  valid_from?: string;
  issued_by?: string;
  // invoice
  invoice_number?: string;
  amount?: number;
  payment_status?: string;
  line_items?: { label: string; amount: number }[];
  // uploaded_document
  source?: string;
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
  is_user_uploaded: boolean;
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
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
}

/* ─── Category Config ─── */

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
  // Reports
  lab_report:         { label: 'Lab Report',   icon: TestTube2,      color: '#22C55E', bg: '#F0FDF4' },
  xray_report:        { label: 'X-Ray',        icon: ScanLine,       color: '#06B6D4', bg: '#ECFEFF' },
  mri_report:         { label: 'MRI',          icon: BrainCircuit,   color: '#8B5CF6', bg: '#F5F3FF' },
  ultrasound_report:  { label: 'Ultrasound',   icon: Radio,          color: '#0D9488', bg: '#F0FDFA' },
  ecg_report:         { label: 'ECG',          icon: HeartPulse,     color: '#EF4444', bg: '#FEF2F2' },
  pathology_report:   { label: 'Pathology',    icon: Microscope,     color: '#F59E0B', bg: '#FFFBEB' },
  pft_report:         { label: 'PFT',          icon: Wind,           color: '#3B82F6', bg: '#EFF6FF' },
  other_report:       { label: 'Other Report', icon: ClipboardList,  color: '#6B7280', bg: '#F3F4F6' },
  // Visits
  consultation_notes: { label: 'Consultation', icon: Stethoscope,    color: '#3B82F6', bg: '#EFF6FF' },
  procedure_notes:    { label: 'Procedure',    icon: Syringe,        color: '#EA580C', bg: '#FFF7ED' },
  discharge_summary:  { label: 'Discharge',    icon: FileText,       color: '#EF4444', bg: '#FEF2F2' },
  er_visit:           { label: 'ER Visit',     icon: Ambulance,      color: '#DC2626', bg: '#FEF2F2' },
  referral:           { label: 'Referral',     icon: UserPlus,       color: '#F59E0B', bg: '#FFFBEB' },
  other_visit:        { label: 'Other Visit',  icon: ClipboardCheck, color: '#6B7280', bg: '#F3F4F6' },
  // Medications
  prescription:       { label: 'Prescription', icon: Pill,           color: '#8B5CF6', bg: '#F5F3FF' },
  medication_active:  { label: 'Active Med',   icon: Pill,           color: '#22C55E', bg: '#F0FDF4' },
  medication_past:    { label: 'Past Med',     icon: Archive,        color: '#6B7280', bg: '#F3F4F6' },
  // Documents
  vaccination:        { label: 'Vaccination',  icon: Syringe,        color: '#22C55E', bg: '#F0FDF4' },
  medical_certificate:{ label: 'Certificate',  icon: Award,          color: '#3B82F6', bg: '#EFF6FF' },
  invoice:            { label: 'Invoice',      icon: Receipt,        color: '#6B7280', bg: '#F3F4F6' },
  uploaded_document:  { label: 'Uploaded',     icon: Upload,         color: '#6366F1', bg: '#EEF2FF' },
};

const typeGroups: Record<string, string[]> = {
  reports:      ['lab_report', 'xray_report', 'mri_report', 'ultrasound_report', 'ecg_report', 'pathology_report', 'pft_report', 'other_report'],
  visits:       ['consultation_notes', 'procedure_notes', 'discharge_summary', 'er_visit', 'referral', 'other_visit'],
  medications:  ['prescription', 'medication_active', 'medication_past'],
  documents:    ['vaccination', 'medical_certificate', 'invoice', 'uploaded_document'],
};

const RECORDS_PER_PAGE = 10;

function CategoryIcon({ category, size = 'md' }: { category: string; size?: 'sm' | 'md' }) {
  const config = categoryConfig[category] || { icon: FileText, color: '#6B7280', bg: '#F3F4F6' };
  const Icon = config.icon;
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconDim = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';
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

/* ─── Page ─── */

export default function Index({ user, records, familyMembers, abnormalCount }: Props) {
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  const memberMap = useMemo(() => {
    const map: Record<number, FamilyMember> = {};
    familyMembers.forEach((m) => { map[m.id] = m; });
    return map;
  }, [familyMembers]);

  const filteredRecords = useMemo(() => {
    let list = records;

    // Document type filter
    if (documentTypeFilter !== 'all') {
      if (typeGroups[documentTypeFilter]) {
        list = list.filter((r) => typeGroups[documentTypeFilter].includes(r.category));
      } else {
        list = list.filter((r) => r.category === documentTypeFilter);
      }
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

    // Date range
    if (dateFrom) list = list.filter((r) => r.record_date >= dateFrom);
    if (dateTo) list = list.filter((r) => r.record_date <= dateTo);

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
  }, [records, documentTypeFilter, statusFilter, memberFilter, dateFrom, dateTo, searchQuery, memberMap]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [documentTypeFilter, statusFilter, memberFilter, dateFrom, dateTo, searchQuery]);

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
    setDocumentTypeFilter('all');
    setStatusFilter('needs_attention');
    setMemberFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  }

  const toast = (msg: string) => setToastMessage(msg);

  return (
    <AppLayout
      user={user}
      pageTitle="Health Records"
      pageIcon="/assets/icons/records-selected.svg"
    >
      <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="font-bold"
            style={{ fontSize: '36px', lineHeight: '44px', letterSpacing: '-1px', color: '#171717' }}
          >
            Health Records
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast('Download feature coming soon')}>
              <Download className="h-4 w-4" />
              Download All
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast('Share feature coming soon')}>
              <Share2 className="h-4 w-4" />
              Share Records
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast('Upload feature coming soon')}>
              <Upload className="h-4 w-4" />
              Upload Record
            </Button>
          </div>
        </div>

        {/* Alert Banner */}
        {abnormalCount > 0 && statusFilter !== 'needs_attention' && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 mb-6">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <p className="text-sm flex-1">
              <span className="font-semibold">{abnormalCount} {abnormalCount === 1 ? 'report needs' : 'reports need'} attention</span>
              <span className="text-muted-foreground"> — Some test results are outside normal ranges</span>
            </p>
            <Button variant="outline" size="sm" className="flex-shrink-0" onClick={handleFilterToAttention}>
              View
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="reports">All Reports</SelectItem>
              <SelectItem value="visits">All Visits</SelectItem>
              <SelectItem value="medications">All Medications</SelectItem>
              <SelectItem value="documents">All Documents</SelectItem>
              {Object.entries(categoryConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px] h-9">
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
            <SelectTrigger className="w-[170px] h-9">
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

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-[140px] text-sm"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-[140px] text-sm"
            />
          </div>

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

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-2.5 mb-4">
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
          <>
            <div className="rounded-lg border">
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
                              {record.is_user_uploaded && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => toast('Delete feature coming soon')}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between mt-4">
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

            <p className="text-xs text-muted-foreground mt-4">
              Need help?{' '}
              <a href="#" className="underline hover:text-foreground">
                Contact support →
              </a>
            </p>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No records yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Book an appointment to get started.</p>
            <Button asChild>
              <Link href="/booking/doctor">Book Appointment</Link>
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
            />
          )}
        </SheetContent>
      </Sheet>

      <Toast show={!!toastMessage} message={toastMessage} onHide={() => setToastMessage('')} />
    </AppLayout>
  );
}

/* ─── Detail Side Sheet ─── */

function RecordDetailSheet({ record, memberMap, onDownload }: { record: HealthRecord; memberMap: Record<number, FamilyMember>; onDownload: () => void }) {
  const config = categoryConfig[record.category] || { label: record.category, color: '#6B7280', bg: '#F3F4F6' };
  const member = record.family_member_id ? memberMap[record.family_member_id] : undefined;
  const meta = record.metadata;

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-6">
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
        {meta && <CategoryDetail category={record.category} meta={meta} />}
      </div>

      <div className="pt-6 mt-6 border-t space-y-2">
        {record.appointment_id && (
          <Button asChild variant="outline" className="w-full rounded-full gap-2">
            <Link href={`/appointments/${record.appointment_id}`}>
              <ExternalLink className="h-4 w-4" />
              View Appointment
            </Link>
          </Button>
        )}
        {record.category === 'invoice' && record.appointment_id && (
          <Button asChild variant="outline" className="w-full rounded-full gap-2">
            <Link href={`/billing/${record.appointment_id}`}>
              <Receipt className="h-4 w-4" />
              View Bill
            </Link>
          </Button>
        )}
        {record.file_type && (
          <Button variant="outline" className="w-full rounded-full gap-2" onClick={onDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Category Detail Router ─── */

function CategoryDetail({ category, meta }: { category: string; meta: RecordMetadata }) {
  switch (category) {
    case 'consultation_notes': return <ConsultationDetail meta={meta} />;
    case 'prescription': return <PrescriptionDetail meta={meta} />;
    case 'lab_report': return <LabReportDetail meta={meta} />;
    case 'xray_report': return <XrayDetail meta={meta} />;
    case 'mri_report': return <MriDetail meta={meta} />;
    case 'ultrasound_report': return <UltrasoundDetail meta={meta} />;
    case 'ecg_report': return <EcgDetail meta={meta} />;
    case 'pathology_report': return <PathologyDetail meta={meta} />;
    case 'pft_report': return <PftDetail meta={meta} />;
    case 'other_report': return <OtherReportDetail meta={meta} />;
    case 'procedure_notes': return <ProcedureDetail meta={meta} />;
    case 'er_visit': return <ErVisitDetail meta={meta} />;
    case 'referral': return <ReferralDetail meta={meta} />;
    case 'discharge_summary': return <DischargeDetail meta={meta} />;
    case 'other_visit': return <OtherVisitDetail meta={meta} />;
    case 'medication_active': return <MedicationActiveDetail meta={meta} />;
    case 'medication_past': return <MedicationPastDetail meta={meta} />;
    case 'vaccination': return <VaccinationDetail meta={meta} />;
    case 'medical_certificate': return <MedicalCertificateDetail meta={meta} />;
    case 'invoice': return <InvoiceDetail meta={meta} />;
    case 'uploaded_document': return <UploadedDocDetail meta={meta} />;
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

/* ─── Visit Detail Components ─── */

function ConsultationDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.diagnosis && (
        <div>
          <SectionTitle>Diagnosis</SectionTitle>
          <div className="rounded-lg bg-blue-50 px-3 py-2">
            <p className="text-sm font-medium" style={{ color: '#1E40AF' }}>{meta.diagnosis}</p>
            {meta.icd_code && <p className="text-[11px] text-blue-500 mt-0.5">ICD: {meta.icd_code}</p>}
          </div>
        </div>
      )}
      {meta.symptoms && meta.symptoms.length > 0 && (
        <div>
          <SectionTitle>Symptoms</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {meta.symptoms.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
          </div>
        </div>
      )}
      {meta.examination_findings && (
        <div>
          <SectionTitle>Examination Findings</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.examination_findings}</p>
        </div>
      )}
      {meta.treatment_plan && (
        <div>
          <SectionTitle>Treatment Plan</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.treatment_plan}</p>
        </div>
      )}
    </div>
  );
}

function ProcedureDetail({ meta }: { meta: RecordMetadata }) {
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
    </div>
  );
}

function ErVisitDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.chief_complaint && (
        <div>
          <SectionTitle>Chief Complaint</SectionTitle>
          <div className="rounded-lg bg-red-50 px-3 py-2">
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{meta.chief_complaint}</p>
          </div>
        </div>
      )}
      {meta.triage_level && <DetailRow label="Triage">{meta.triage_level}</DetailRow>}
      {meta.vitals && Object.keys(meta.vitals).length > 0 && (
        <div>
          <SectionTitle>Vitals</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(meta.vitals).map(([key, val]) => (
              <div key={key} className="rounded-lg border px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</p>
                <p className="text-sm font-medium">{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {meta.examination && (
        <div>
          <SectionTitle>Examination</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.examination}</p>
        </div>
      )}
      {meta.diagnosis && <DetailRow label="Diagnosis">{meta.diagnosis}</DetailRow>}
      {meta.treatment_given && (
        <div>
          <SectionTitle>Treatment Given</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.treatment_given}</p>
        </div>
      )}
      {meta.disposition && <DetailRow label="Disposition">{meta.disposition}</DetailRow>}
      {meta.follow_up && <DetailRow label="Follow-up">{meta.follow_up}</DetailRow>}
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

function DischargeDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {meta.admission_date && <DetailRow label="Admission Date">{fmtDate(meta.admission_date)}</DetailRow>}
        {meta.discharge_date && <DetailRow label="Discharge Date">{fmtDate(meta.discharge_date)}</DetailRow>}
        {meta.diagnosis && <DetailRow label="Diagnosis">{meta.diagnosis}</DetailRow>}
      </div>
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
      {meta.discharge_instructions && (
        <div>
          <SectionTitle>Discharge Instructions</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.discharge_instructions}</p>
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

function MedicationActiveDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-3">
      {meta.drug_name && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>{meta.drug_name}</p>
          </div>
        </div>
      )}
      {meta.dosage && <DetailRow label="Dosage">{meta.dosage}</DetailRow>}
      {meta.frequency && <DetailRow label="Frequency">{meta.frequency}</DetailRow>}
      {meta.route && <DetailRow label="Route">{meta.route}</DetailRow>}
      {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
      {meta.prescribing_doctor && <DetailRow label="Prescribed By">{meta.prescribing_doctor}</DetailRow>}
      {meta.condition && <DetailRow label="Condition">{meta.condition}</DetailRow>}
      {meta.refills_remaining != null && <DetailRow label="Refills Remaining">{meta.refills_remaining}</DetailRow>}
    </div>
  );
}

function MedicationPastDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-3">
      {meta.drug_name && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <p className="text-sm font-semibold text-muted-foreground">{meta.drug_name}</p>
          </div>
        </div>
      )}
      {meta.dosage && <DetailRow label="Dosage">{meta.dosage}</DetailRow>}
      {meta.frequency && <DetailRow label="Frequency">{meta.frequency}</DetailRow>}
      {meta.route && <DetailRow label="Route">{meta.route}</DetailRow>}
      {meta.start_date && <DetailRow label="Started">{fmtDate(meta.start_date)}</DetailRow>}
      {meta.end_date && <DetailRow label="Ended">{fmtDate(meta.end_date)}</DetailRow>}
      {meta.prescribing_doctor && <DetailRow label="Prescribed By">{meta.prescribing_doctor}</DetailRow>}
      {meta.reason_stopped && (
        <div>
          <SectionTitle>Reason Stopped</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.reason_stopped}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Document Detail Components ─── */

function VaccinationDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.vaccine_name && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
          <p className="text-sm font-semibold" style={{ color: '#166534' }}>{meta.vaccine_name}</p>
        </div>
      )}
      {meta.dose_number != null && meta.total_doses != null && (
        <div>
          <DetailRow label="Dose">
            {meta.dose_number} of {meta.total_doses}
          </DetailRow>
          <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${(meta.dose_number / meta.total_doses) * 100}%` }} />
          </div>
        </div>
      )}
      {meta.batch_number && <DetailRow label="Batch Number">{meta.batch_number}</DetailRow>}
      {meta.administered_by && <DetailRow label="Administered By">{meta.administered_by}</DetailRow>}
      {meta.site && <DetailRow label="Injection Site">{meta.site}</DetailRow>}
      {meta.next_due_date && <DetailRow label="Next Due">{fmtDate(meta.next_due_date)}</DetailRow>}
      {meta.next_due_date === null && meta.dose_number === meta.total_doses && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
          <p className="text-xs font-medium text-green-700">Vaccination course complete</p>
        </div>
      )}
    </div>
  );
}

function MedicalCertificateDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-4">
      {meta.certificate_type && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
          <p className="text-sm font-semibold" style={{ color: '#1E40AF' }}>{meta.certificate_type}</p>
        </div>
      )}
      {meta.issued_for && (
        <div>
          <SectionTitle>Issued For</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.issued_for}</p>
        </div>
      )}
      {meta.valid_from && <DetailRow label="Valid From">{fmtDate(meta.valid_from)}</DetailRow>}
      {meta.valid_until && <DetailRow label="Valid Until">{fmtDate(meta.valid_until)}</DetailRow>}
      {meta.issued_by && <DetailRow label="Issued By">{meta.issued_by}</DetailRow>}
      {meta.notes && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.notes}</p>
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

function UploadedDocDetail({ meta }: { meta: RecordMetadata }) {
  return (
    <div className="space-y-3">
      {meta.source && <DetailRow label="Source">{meta.source}</DetailRow>}
      {meta.notes && (
        <div>
          <SectionTitle>Notes</SectionTitle>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{meta.notes}</p>
        </div>
      )}
    </div>
  );
}
