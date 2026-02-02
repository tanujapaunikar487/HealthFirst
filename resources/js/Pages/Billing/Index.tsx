import { useState, useMemo, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
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
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
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
  MoreHorizontal,
  Eye,
  Download,
  Search,
  IndianRupee,
  Stethoscope,
  TestTube2,
  FileText,
  CreditCard,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Loader2,
  CheckCircle2,
} from '@/Lib/icons';

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ─── Types ─── */

type BillingStatus =
  | 'due'
  | 'paid'
  | 'refunded'
  | 'awaiting_approval'
  | 'claim_pending'
  | 'copay_due'
  | 'emi'
  | 'disputed'
  | 'covered'
  | 'reimbursed';

interface Bill {
  id: number;
  invoice_number: string;
  appointment_id: number;
  appointment_type: 'doctor' | 'lab_test';
  appointment_title: string;
  patient_id: number | null;
  patient_name: string;
  date: string;
  date_formatted: string;
  time: string;
  amount: number;
  total: number;
  billing_status: BillingStatus;
  due_amount: number;
  original_amount: number;
  insurance_covered: number;
  emi_current: number | null;
  emi_total: number | null;
  payment_method: string;
  payment_date: string;
  is_overdue: boolean;
  days_overdue: number;
}

interface Stats {
  outstanding_count: number;
  outstanding_total: number;
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
  bills: Bill[];
  stats: Stats;
  familyMembers: FamilyMember[];
}

/* ─── Constants ─── */

const ITEMS_PER_PAGE = 10;

const OUTSTANDING_STATUSES: BillingStatus[] = [
  'due', 'copay_due', 'awaiting_approval', 'claim_pending', 'emi',
];
const PAID_STATUSES: BillingStatus[] = ['paid', 'covered', 'reimbursed'];

const STATUS_CONFIG: Record<BillingStatus, { label: string; color: string; bg: string }> = {
  due: { label: 'Due', color: 'text-red-600', bg: 'bg-red-50' },
  paid: { label: 'Paid', color: 'text-green-600', bg: 'bg-green-50' },
  refunded: { label: 'Refunded', color: 'text-gray-600', bg: 'bg-gray-100' },
  awaiting_approval: { label: 'Awaiting Approval', color: 'text-amber-600', bg: 'bg-amber-50' },
  claim_pending: { label: 'Claim Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
  copay_due: { label: 'Co-pay Due', color: 'text-red-600', bg: 'bg-red-50' },
  emi: { label: 'EMI', color: 'text-blue-600', bg: 'bg-blue-50' },
  disputed: { label: 'Disputed', color: 'text-red-600', bg: 'bg-red-50' },
  covered: { label: 'Covered', color: 'text-green-600', bg: 'bg-green-50' },
  reimbursed: { label: 'Reimbursed', color: 'text-green-600', bg: 'bg-green-50' },
};

const PAYABLE_STATUSES: BillingStatus[] = ['due', 'copay_due'];

/* ─── Skeleton ─── */

function BillingSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
      <div className="mb-8">
        <Pulse className="h-9 w-32" />
      </div>
      {/* Outstanding summary card */}
      <div className="rounded-xl border border-border p-5 mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-4 w-40" />
          <Pulse className="h-7 w-28" />
        </div>
        <Pulse className="h-10 w-24 rounded-full" />
      </div>
      {/* Tabs + filters */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <Pulse key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <Pulse className="h-10 w-36 rounded-lg" />
        <Pulse className="h-10 w-36 rounded-lg" />
        <div className="ml-auto">
          <Pulse className="h-10 w-56 rounded-lg" />
        </div>
      </div>
      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border">
          <Pulse className="h-4 w-4 rounded" />
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-40" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-12" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-5 border-b border-border last:border-0">
            <Pulse className="h-4 w-4 rounded flex-shrink-0" />
            <Pulse className="h-4 w-24" />
            <div className="flex items-center gap-3 w-56">
              <Pulse className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="space-y-2">
                <Pulse className="h-4 w-36" />
                <Pulse className="h-3 w-20" />
              </div>
            </div>
            <Pulse className="h-4 w-16" />
            <Pulse className="h-4 w-20" />
            <Pulse className="h-6 w-20 rounded-full" />
            <Pulse className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function Index({ user, bills, stats, familyMembers }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(bills);
  const [tab, setTab] = useState<'all' | 'outstanding' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [toastMessage, setToastMessage] = useState('');
  const [payBills, setPayBills] = useState<Bill[]>([]);
  const [excludedPayBillIds, setExcludedPayBillIds] = useState<Set<number>>(new Set());
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');

  // Reset sheet state when payBills changes
  useEffect(() => {
    if (payBills.length > 0) {
      setExcludedPayBillIds(new Set());
      setPaymentState('idle');
    }
  }, [payBills]);

  // Active bills in sheet (not excluded)
  const activePayBills = payBills.filter((b) => !excludedPayBillIds.has(b.id));
  const activePayTotal = activePayBills.reduce((sum, b) => sum + b.due_amount, 0);

  const togglePayBillExclusion = (id: number) => {
    setExcludedPayBillIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePayment = async () => {
    if (activePayBills.length === 0) return;
    setPaymentState('processing');

    // Process bills sequentially — create order for the first bill
    // (In production, you'd batch these into a single order)
    const firstBill = activePayBills[0];
    const totalAmount = activePayTotal;

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
      const res = await fetch(`/billing/${firstBill.appointment_id}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ amount: totalAmount }),
      });

      if (!res.ok) throw new Error('Failed to create order');
      const orderData = await res.json();

      if (orderData.mock_mode) {
        // Mock mode — simulate payment verification
        const verifyRes = await fetch(`/billing/${firstBill.appointment_id}/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
          body: JSON.stringify({
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'mock_signature',
          }),
        });

        if (!verifyRes.ok) throw new Error('Payment verification failed');
        setPaymentState('success');
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'HealthFirst',
        description: `Payment for ${activePayBills.length} bill(s)`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`/billing/${firstBill.appointment_id}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error('Verification failed');
            setPaymentState('success');
          } catch {
            setPaymentState('idle');
            showToast('Payment verification failed. Please try again.');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentState('idle');
          },
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#0052FF' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      setPaymentState('idle');
      showToast('Failed to initiate payment. Please try again.');
    }
  };

  const handlePaymentDone = () => {
    setPayBills([]);
    clearSelection();
    router.reload();
  };

  // Filter bills
  const filtered = useMemo(() => {
    let result = bills;

    // Tab filter
    if (tab === 'outstanding') {
      result = result.filter((b) => OUTSTANDING_STATUSES.includes(b.billing_status));
    } else if (tab === 'paid') {
      result = result.filter((b) => PAID_STATUSES.includes(b.billing_status));
    }

    // Status dropdown
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.billing_status === statusFilter);
    }

    // Family member dropdown
    if (memberFilter !== 'all') {
      const memberId = parseInt(memberFilter);
      result = result.filter((b) => b.patient_id === memberId);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.invoice_number.toLowerCase().includes(q) ||
          b.appointment_title.toLowerCase().includes(q) ||
          b.patient_name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [bills, tab, statusFilter, memberFilter, searchQuery]);

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  // Selection helpers
  const payableBills = paged.filter((b) => PAYABLE_STATUSES.includes(b.billing_status));
  const selectedBills = bills.filter((b) => selectedIds.has(b.id));
  const selectedTotal = selectedBills.reduce((sum, b) => sum + b.due_amount, 0);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (payableBills.every((b) => selectedIds.has(b.id))) {
      // Deselect all payable on this page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        payableBills.forEach((b) => next.delete(b.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        payableBills.forEach((b) => next.add(b.id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const showToast = (msg: string) => setToastMessage(msg);

  const handleDownloadInvoice = (bill: Bill) => {
    const lines = [
      `INVOICE: ${bill.invoice_number}`,
      `Date: ${bill.date_formatted}`,
      `─────────────────────────────`,
      `Appointment: ${bill.appointment_title}`,
      `Patient: ${bill.patient_name}`,
      `─────────────────────────────`,
      `Amount: ₹${bill.original_amount}`,
      `Due: ₹${bill.due_amount}`,
      `Total: ₹${bill.total}`,
      `─────────────────────────────`,
      `Payment: ${bill.payment_method}`,
      `Status: ${STATUS_CONFIG[bill.billing_status]?.label ?? bill.billing_status}`,
      `Paid on: ${bill.payment_date}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTabChange = (value: string) => {
    setTab(value as 'all' | 'outstanding' | 'paid');
    setPage(1);
    setSelectedIds(new Set());
  };

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing-selected.svg">
        <ErrorState onRetry={retry} label="Unable to load billing" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing-selected.svg">
        <BillingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      pageTitle="Billing"
      pageIcon="/assets/icons/billing-selected.svg"
    >
      <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
        {/* Header */}
        <div className="mb-8">
          <h1
            className="font-bold"
            style={{
              fontSize: '36px',
              lineHeight: '44px',
              letterSpacing: '-1px',
              color: '#171717',
            }}
          >
            Billing
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View invoices and payment history for all your appointments.
          </p>
        </div>

        {/* Outstanding Summary */}
        {stats.outstanding_count > 0 && (
          <div className="flex items-center justify-between border rounded-lg px-5 py-4 mb-6" style={{ backgroundColor: '#FFFBEB' }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#171717' }}>
                  {stats.outstanding_count} outstanding {stats.outstanding_count === 1 ? 'bill' : 'bills'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total due: ₹{stats.outstanding_total.toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const outstandingPayable = bills.filter(
                  (b) => OUTSTANDING_STATUSES.includes(b.billing_status) && PAYABLE_STATUSES.includes(b.billing_status)
                );
                if (outstandingPayable.length > 0) setPayBills(outstandingPayable);
                else showToast('No payable bills found.');
              }}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pay All
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={handleTabChange} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="due">Due</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="awaiting_approval">Awaiting Approval</SelectItem>
              <SelectItem value="claim_pending">Claim Pending</SelectItem>
              <SelectItem value="copay_due">Co-pay Due</SelectItem>
              <SelectItem value="emi">EMI</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="covered">Covered</SelectItem>
              <SelectItem value="reimbursed">Reimbursed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {familyMembers.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 h-9 w-[220px]"
            />
          </div>
        </div>

        {/* Multi-select bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between border rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: '#EFF6FF' }}>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">
                {selectedIds.size} {selectedIds.size === 1 ? 'bill' : 'bills'} selected
              </p>
              <button
                onClick={clearSelection}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => setPayBills(selectedBills)}
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pay ₹{selectedTotal.toLocaleString()}
            </Button>
          </div>
        )}

        {/* Table or Empty State */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-base font-medium mb-1" style={{ color: '#171717' }}>
              No records yet
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {bills.length === 0
                ? 'Book an appointment to get started.'
                : 'No bills match your filters.'}
            </p>
            {bills.length === 0 && (
              <Link href="/booking">
                <Button size="lg">
                  Book Appointment
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="border" style={{ borderRadius: '20px' }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40px]">
                      {payableBills.length > 0 && (
                        <input
                          type="checkbox"
                          checked={payableBills.length > 0 && payableBills.every((b) => selectedIds.has(b.id))}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                        />
                      )}
                    </TableHead>
                    <TableHead className="w-[110px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[120px]">Patient</TableHead>
                    <TableHead className="w-[130px]">Amount</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((bill) => {
                    const isPayable = PAYABLE_STATUSES.includes(bill.billing_status);
                    const cfg = STATUS_CONFIG[bill.billing_status] ?? { label: bill.billing_status, color: 'text-gray-600', bg: 'bg-gray-100' };
                    const statusLabel = bill.billing_status === 'emi' && bill.emi_current != null
                      ? `EMI ${bill.emi_current}/${bill.emi_total}`
                      : cfg.label;

                    return (
                      <TableRow
                        key={bill.id}
                        className="cursor-pointer"
                        onClick={() => {
                          if (isPayable) {
                            setPayBills([bill]);
                          } else {
                            router.visit(`/billing/${bill.id}`);
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(bill.id)}
                            disabled={!isPayable}
                            onChange={() => toggleSelect(bill.id)}
                            className={cn(
                              'h-4 w-4 rounded border-gray-300 accent-blue-600',
                              !isPayable && 'opacity-30 cursor-not-allowed'
                            )}
                          />
                        </TableCell>

                        {/* Date & Time */}
                        <TableCell className="align-top">
                          <p className="text-sm">{bill.date_formatted}</p>
                          <p className="text-xs text-muted-foreground">{bill.time}</p>
                        </TableCell>

                        {/* Description */}
                        <TableCell className="align-top">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: '#BFDBFE' }}
                            >
                              {bill.appointment_type === 'doctor' ? (
                                <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
                              ) : (
                                <TestTube2 className="h-5 w-5" style={{ color: '#1E40AF' }} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{bill.appointment_title}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">{bill.invoice_number}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Patient */}
                        <TableCell className="align-top">
                          <p className="text-sm">{bill.patient_name}</p>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="align-top">
                          {bill.due_amount > 0 && bill.due_amount !== bill.original_amount ? (
                            <div>
                              <p className="text-sm font-medium">₹{bill.due_amount.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground line-through">₹{bill.original_amount.toLocaleString()}</p>
                            </div>
                          ) : (
                            <p className="text-sm font-medium">₹{bill.total.toLocaleString()}</p>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="align-top">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
                              cfg.color,
                              cfg.bg
                            )}
                          >
                            {statusLabel}
                          </span>
                          {bill.is_overdue && (
                            <p className="text-[10px] text-red-500 mt-0.5">Overdue {bill.days_overdue}d</p>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[220px]">
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => router.visit(`/billing/${bill.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleDownloadInvoice(bill)}
                              >
                                <Download className="h-4 w-4" />
                                Download Invoice
                              </DropdownMenuItem>

                              {/* Pay Now — only for due / copay_due */}
                              {PAYABLE_STATUSES.includes(bill.billing_status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => setPayBills([bill])}
                                  >
                                    <CreditCard className="h-4 w-4" />
                                    Pay Now
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Raise Dispute — only for paid / disputed */}
                              {['paid', 'disputed'].includes(bill.billing_status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => showToast('Dispute request submitted.')}
                                  >
                                    <AlertCircle className="h-4 w-4" />
                                    Raise Dispute
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Request Reimbursement Letter — only for paid */}
                              {bill.billing_status === 'paid' && (
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer"
                                  onClick={() => showToast('Reimbursement letter sent to your email.')}
                                >
                                  <FileText className="h-4 w-4" />
                                  Request Reimbursement Letter
                                </DropdownMenuItem>
                              )}

                              {/* View Insurance Claim — claim_pending / awaiting_approval / covered */}
                              {['claim_pending', 'awaiting_approval', 'covered'].includes(bill.billing_status) && bill.insurance_claim_id && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => router.visit(`/insurance/claims/${bill.insurance_claim_id}`)}
                                  >
                                    <ShieldCheck className="h-4 w-4" />
                                    View Insurance Claim
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* View EMI Schedule — emi */}
                              {bill.billing_status === 'emi' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => router.visit(`/billing/${bill.id}`)}
                                  >
                                    <Calendar className="h-4 w-4" />
                                    View EMI Schedule
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

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-[#E5E5E5]">
                  <p className="text-xs text-muted-foreground">
                    Showing {showingFrom}–{showingTo} of {filtered.length} bills
                  </p>
                  {filtered.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === currentPage ? 'default' : 'outline'}
                        size="icon"
                        className={cn('h-8 w-8 text-xs', p === currentPage && 'pointer-events-none')}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Need help with billing?{' '}
            <a href="#" className="font-medium hover:underline" style={{ color: '#0052FF' }}>
              Contact support &rarr;
            </a>
          </p>
        </div>
      </div>

      {/* Payment Summary Sheet */}
      <Sheet
        open={payBills.length > 0}
        onOpenChange={(open) => {
          if (!open && paymentState !== 'processing') setPayBills([]);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader className="pb-4">
            <SheetTitle>Payment Summary</SheetTitle>
            <SheetDescription>
              {paymentState === 'success'
                ? 'Payment complete'
                : excludedPayBillIds.size > 0
                  ? `${activePayBills.length} of ${payBills.length} bills selected`
                  : `${payBills.length} ${payBills.length === 1 ? 'bill' : 'bills'} selected`
              }
            </SheetDescription>
          </SheetHeader>

          {payBills.length > 0 && paymentState === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#171717' }}>Payment Successful</h3>
              <p className="text-sm text-muted-foreground">
                {activePayBills.length} {activePayBills.length === 1 ? 'bill' : 'bills'} paid — ₹{activePayTotal.toLocaleString()}
              </p>
              <Button
                className="w-full mt-8"
                size="lg"
                onClick={handlePaymentDone}
              >
                Done
              </Button>
            </div>
          )}

          {payBills.length > 0 && paymentState !== 'success' && (
            <>
              {/* Scrollable bill list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {payBills.map((bill) => {
                  const isExcluded = excludedPayBillIds.has(bill.id);
                  const isLastActive = activePayBills.length === 1 && !isExcluded;
                  return (
                    <div
                      key={bill.id}
                      className={cn('border rounded-lg p-4 space-y-3 transition-opacity', isExcluded && 'opacity-40')}
                    >
                      {/* Patient + Checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold" style={{ color: '#171717' }}>
                            {bill.patient_name.charAt(0)}
                          </div>
                          <p className="text-sm font-medium" style={{ color: '#171717' }}>{bill.patient_name}</p>
                        </div>
                        {payBills.length > 1 && (
                          <input
                            type="checkbox"
                            checked={!isExcluded}
                            disabled={isLastActive || paymentState === 'processing'}
                            onChange={() => togglePayBillExclusion(bill.id)}
                            className={cn(
                              'h-4 w-4 rounded border-gray-300 accent-blue-600',
                              (isLastActive || paymentState === 'processing') && 'opacity-40 cursor-not-allowed'
                            )}
                          />
                        )}
                      </div>

                      {/* Service */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#BFDBFE' }}
                        >
                          {bill.appointment_type === 'doctor' ? (
                            <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
                          ) : (
                            <TestTube2 className="h-5 w-5" style={{ color: '#1E40AF' }} />
                          )}
                        </div>
                        <p className="text-sm">{bill.appointment_title}</p>
                      </div>

                      {/* Reference + Date + Amount */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{bill.invoice_number}</span>
                        <span>{bill.date_formatted}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold" style={{ color: '#171717' }}>
                            ₹{bill.due_amount.toLocaleString()}
                          </span>
                          {bill.due_amount !== bill.original_amount && (
                            <span className="text-xs text-muted-foreground ml-1">
                              of ₹{bill.original_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overdue warning */}
                      {bill.is_overdue && (
                        <div className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#FEF2F2' }}>
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-600">
                            Overdue by {bill.days_overdue} days. Please pay immediately or contact support.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Warnings */}
              <PaymentWarnings bills={activePayBills} />

              {/* Total + CTA */}
              <div className="pt-4">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-sm font-medium">
                    Total ({activePayBills.length} {activePayBills.length === 1 ? 'bill' : 'bills'})
                  </span>
                  <span className="text-xl font-bold" style={{ color: '#171717' }}>
                    ₹{activePayTotal.toLocaleString()}
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={activePayBills.length === 0 || paymentState === 'processing'}
                  onClick={handlePayment}
                >
                  {paymentState === 'processing' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay ₹{activePayTotal.toLocaleString()}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Toast */}
      <Toast
        show={!!toastMessage}
        message={toastMessage}
        onHide={() => setToastMessage('')}
      />
    </AppLayout>
  );
}

/* ─── Payment Warnings ─── */

function PaymentWarnings({ bills }: { bills: Bill[] }) {
  const disputedCount = bills.filter((b) => b.billing_status === 'disputed').length;
  const uniquePatients = new Set(bills.map((b) => b.patient_id).filter(Boolean));
  const hasMultiplePatients = uniquePatients.size > 1;

  if (!disputedCount && !hasMultiplePatients) return null;

  return (
    <div className="space-y-2 mt-3">
      {disputedCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#FFFBEB' }}>
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            {disputedCount} {disputedCount === 1 ? 'bill is' : 'bills are'} under dispute. Payment may be held for review.
          </p>
        </div>
      )}
      {hasMultiplePatients && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ backgroundColor: '#EFF6FF' }}>
          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Bills for multiple family members selected.
          </p>
        </div>
      )}
    </div>
  );
}
