import { useState, useMemo, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading, SheetSkeleton } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
import { Badge } from '@/Components/ui/badge';
import { Button, buttonVariants } from '@/Components/ui/button';
import { IconCircle } from '@/Components/ui/icon-circle';
import { TableCard } from '@/Components/ui/table-card';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { Input } from '@/Components/ui/input';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
  SheetSectionRow,
  SheetDivider,
} from '@/Components/ui/sheet';
import { Alert } from '@/Components/ui/alert';
import { BulkActionBar } from '@/Components/ui/bulk-action-bar';
import { Card } from '@/Components/ui/card';
import { cn } from '@/Lib/utils';
import { useToast } from '@/Contexts/ToastContext';
import {
  MoreHorizontal,
  Search,
  Stethoscope,
  TestTube2,
  CreditCard,
  ChevronRight,
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

const STATUS_CONFIG: Record<BillingStatus, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }> = {
  due: { label: 'Due', variant: 'danger' },
  paid: { label: 'Paid', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'neutral' },
  awaiting_approval: { label: 'Awaiting approval', variant: 'warning' },
  claim_pending: { label: 'Claim pending', variant: 'warning' },
  copay_due: { label: 'Co-pay due', variant: 'danger' },
  emi: { label: 'EMI', variant: 'info' },
  disputed: { label: 'Disputed', variant: 'danger' },
  covered: { label: 'Covered', variant: 'success' },
  reimbursed: { label: 'Reimbursed', variant: 'success' },
};

const PAYABLE_STATUSES: BillingStatus[] = ['due', 'copay_due'];

/* ─── Skeleton ─── */

function BillingSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '960px' }}>
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
  const { formatDate, formatTime } = useFormatPreferences();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'all' | 'outstanding' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [payBills, setPayBills] = useState<Bill[]>([]);
  const [excludedPayBillIds, setExcludedPayBillIds] = useState<Set<number>>(new Set());
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');

  // Read tab from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'all' || tabParam === 'outstanding' || tabParam === 'paid') {
      setTab(tabParam);
    }
  }, []);

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
            showToast('Payment verification failed. Please try again.', 'error');
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
      showToast('Failed to initiate payment. Please try again.', 'error');
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

  const handleTabChange = (value: string) => {
    const newTab = value as 'all' | 'outstanding' | 'paid';
    setTab(newTab);
    setPage(1);
    setSelectedIds(new Set());
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.pushState({}, '', url.toString());
  };

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing.svg">
        <ErrorState onRetry={retry} label="Unable to load billing" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing.svg">
        <BillingSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      pageTitle="Billing"
      pageIcon="/assets/icons/billing.svg"
    >
      <div className="min-h-full flex flex-col" style={{ width: '100%', maxWidth: '960px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-page-title text-foreground">
              Billing
            </h1>
            {stats.outstanding_count > 0 && (
              <Button
                size="lg"
                onClick={() => {
                  const outstandingPayable = bills.filter(
                    (b) => OUTSTANDING_STATUSES.includes(b.billing_status) && PAYABLE_STATUSES.includes(b.billing_status)
                  );
                  if (outstandingPayable.length > 0) setPayBills(outstandingPayable);
                  else showToast('No payable bills found.', 'info');
                }}
              >
                <CreditCard className="h-4 w-4" />
                Pay all
              </Button>
            )}
          </div>
        </div>

        {/* Outstanding Summary */}
        {stats.outstanding_count > 0 && (
          <Alert
            variant="warning"
            title={`${stats.outstanding_count} outstanding ${stats.outstanding_count === 1 ? 'bill' : 'bills'}`}
            className="mb-6"
          >
            Total due: ₹{stats.outstanding_total.toLocaleString()}
          </Alert>
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
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Filters */}
          <div className="w-full sm:w-auto overflow-x-auto flex-none">
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="awaiting_approval">Awaiting approval</SelectItem>
                  <SelectItem value="claim_pending">Claim pending</SelectItem>
                  <SelectItem value="copay_due">Co-pay due</SelectItem>
                  <SelectItem value="emi">EMI</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                  <SelectItem value="covered">Covered</SelectItem>
                  <SelectItem value="reimbursed">Reimbursed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); setPage(1); }}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search - Full width on mobile/tablet, right-aligned on desktop */}
          <div className="relative w-full lg:w-auto lg:flex-1 lg:basis-64 lg:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Multi-select bar */}
        <BulkActionBar
          count={selectedIds.size}
          itemLabel="bill"
          onClear={clearSelection}
          actions={[
            {
              label: `Pay ₹${selectedTotal.toLocaleString()}`,
              icon: CreditCard,
              onClick: () => setPayBills(selectedBills),
            },
          ]}
          className="mb-4"
        />

        {/* Table or Empty State */}
        {filtered.length === 0 ? (
          bills.length === 0 ? (
            <EmptyState
              image="/assets/images/billing.png"
              message="No bills yet"
              description="Invoices and payment history will appear here after your appointments."
              action={
                <Link href="/settings?tab=payments" className={cn(buttonVariants({ variant: 'secondary', size: 'md' }))}>Add payment method</Link>
              }
            />
          ) : (
            <EmptyState
              image="/assets/images/billing.png"
              message="No bills match your filters"
              description="Try adjusting your filters to find what you're looking for."
            />
          )
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <TableContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-col-checkbox">
                        {payableBills.length > 0 && (
                          <input
                            type="checkbox"
                            checked={payableBills.length > 0 && payableBills.every((b) => selectedIds.has(b.id))}
                            onChange={toggleSelectAll}
                          />
                        )}
                      </TableHead>
                      <TableHead className="w-col-date">Date</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="w-col-member">Family member</TableHead>
                      <TableHead className="w-col-amount text-right">Amount</TableHead>
                      <TableHead className="w-col-status">Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((bill) => {
                      const isPayable = PAYABLE_STATUSES.includes(bill.billing_status);
                      const cfg = STATUS_CONFIG[bill.billing_status] ?? { label: bill.billing_status, variant: 'neutral' as const };
                      const statusLabel = bill.billing_status === 'emi' && bill.emi_current != null
                        ? `EMI ${bill.emi_current}/${bill.emi_total}`
                        : cfg.label;

                      return (
                        <TableRow
                          key={bill.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => router.visit(`/billing/${bill.id}`)}
                        >
                          {/* Checkbox */}
                          <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(bill.id)}
                              disabled={!isPayable}
                              onChange={() => toggleSelect(bill.id)}
                            />
                          </TableCell>

                          {/* Date */}
                          <TableCell className="align-top">
                            <p className="text-label whitespace-nowrap">{formatDate(bill.date) || '—'}</p>
                            <p className="text-body text-muted-foreground">{formatTime(bill.date) || '—'}</p>
                          </TableCell>

                          {/* Details */}
                          <TableCell className="align-top">
                            <div>
                              <p className="text-label">{bill.appointment_title}</p>
                              <p className="text-overline text-muted-foreground">{bill.invoice_number}</p>
                            </div>
                          </TableCell>

                          {/* Member */}
                          <TableCell className="align-top">
                            <p className="text-label whitespace-nowrap">{bill.patient_name}</p>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="align-top text-right">
                            {bill.due_amount > 0 && bill.due_amount !== bill.original_amount ? (
                              <div>
                                <p className="text-label">₹{bill.due_amount.toLocaleString()}</p>
                                <p className="text-body text-muted-foreground line-through">₹{bill.original_amount.toLocaleString()}</p>
                              </div>
                            ) : (
                              <p className="text-label">₹{bill.total.toLocaleString()}</p>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="align-top">
                            <Badge variant={cfg.variant}>
                              {statusLabel}
                            </Badge>
                            {bill.is_overdue && (
                              <p className="text-micro text-destructive mt-0.5">Overdue {bill.days_overdue}d</p>
                            )}
                          </TableCell>

                          {/* Visual indicator - click row for details */}
                          <TableCell className="align-top w-1">
                            <Button variant="secondary" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <TablePagination
                  from={showingFrom}
                  to={showingTo}
                  total={filtered.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  itemLabel="bills"
                />
              </TableContainer>
            </div>

            {/* Mobile & Tablet Card List */}
            <div className="lg:hidden space-y-3">
              {paged.map((bill) => {
                const isPayable = PAYABLE_STATUSES.includes(bill.billing_status);
                const cfg = STATUS_CONFIG[bill.billing_status] ?? { label: bill.billing_status, variant: 'neutral' as const };
                const statusLabel = bill.billing_status === 'emi' && bill.emi_current != null
                  ? `EMI ${bill.emi_current}/${bill.emi_total}`
                  : cfg.label;

                return (
                  <TableCard
                    key={bill.id}
                    layoutMode="grid"
                    showCheckbox
                    checked={selectedIds.has(bill.id)}
                    onCheckboxChange={() => toggleSelect(bill.id)}
                    checkboxDisabled={!isPayable}
                    selected={selectedIds.has(bill.id)}
                    title={bill.appointment_title}
                    subtitle={bill.invoice_number}
                    badge={{
                      label: statusLabel,
                      variant: cfg.variant,
                    }}
                    fields={[
                      {
                        label: 'Date',
                        value: formatDate(bill.date) || '—',
                      },
                      {
                        label: 'Patient',
                        value: bill.patient_name,
                      },
                      {
                        label: 'Amount',
                        value: bill.due_amount > 0 && bill.due_amount !== bill.original_amount
                          ? `₹${bill.due_amount.toLocaleString()}`
                          : `₹${bill.total.toLocaleString()}`,
                      },
                    ]}
                    onClick={() => router.visit(`/billing/${bill.id}`)}
                  />
                );
              })}

              <TablePagination
                from={showingFrom}
                to={showingTo}
                total={filtered.length}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
                itemLabel="bills"
              />
            </div>
          </>
        )}
      </div>

      {/* Payment Summary Sheet */}
      <Sheet
        open={payBills.length > 0}
        onOpenChange={(open) => {
          if (!open && paymentState !== 'processing') setPayBills([]);
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Payment Summary</SheetTitle>
          </SheetHeader>

          {/* Warnings */}
          {payBills.length > 0 && paymentState !== 'success' && (
            <PaymentWarnings bills={activePayBills} />
          )}

          {payBills.length > 0 && paymentState === 'success' && (
            <>
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="h-16 w-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-subheading text-foreground mb-1">Payment successful</h3>
                <p className="text-body text-muted-foreground">
                  {activePayBills.length} {activePayBills.length === 1 ? 'bill' : 'bills'} paid — ₹{activePayTotal.toLocaleString()}
                </p>
              </div>
              <SheetFooter>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handlePaymentDone}
                >
                  Done
                </Button>
              </SheetFooter>
            </>
          )}

          {payBills.length > 0 && paymentState !== 'success' && (
            <>
              {/* Scrollable bill list */}
              <SheetBody>
              <div className="space-y-3 px-5 py-5">
                {payBills.map((bill) => {
                  const isExcluded = excludedPayBillIds.has(bill.id);
                  const isLastActive = activePayBills.length === 1 && !isExcluded;
                  return (
                    <div key={bill.id} className={cn('transition-opacity', isExcluded && 'opacity-40')}>
                      <Card>
                        <div className="px-5 py-4">
                          <div className="divide-y">
                            {/* Patient */}
                            <SheetSectionRow
                              label="Patient"
                              value={
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-left">{bill.patient_name}</span>
                                  {payBills.length > 1 && (
                                    <input
                                      type="checkbox"
                                      checked={!isExcluded}
                                      disabled={isLastActive || paymentState === 'processing'}
                                      onChange={() => togglePayBillExclusion(bill.id)}
                                      className="ml-3"
                                    />
                                  )}
                                </div>
                              }
                              className="py-2"
                            />

                            {/* Service */}
                            <SheetSectionRow
                              label="Service"
                              value={
                                <div className="flex items-start gap-2.5 text-left">
                                  <IconCircle
                                    icon={bill.appointment_type === 'doctor' ? Stethoscope : TestTube2}
                                    size="sm"
                                    variant="primary"
                                  />
                                  <span>{bill.appointment_title}</span>
                                </div>
                              }
                              className="py-2"
                            />

                            {/* Invoice & Date */}
                            <SheetSectionRow
                              label="Invoice"
                              value={
                                <div className="text-left">
                                  <div>{bill.invoice_number}</div>
                                  <div className="text-body text-muted-foreground">{formatDate(bill.date)}</div>
                                </div>
                              }
                              className="py-2"
                            />

                            {/* Amount */}
                            <SheetSectionRow
                              label="Amount"
                              value={
                                <div className="text-left">
                                  <span className="text-card-title text-foreground">
                                    ₹{bill.due_amount.toLocaleString()}
                                  </span>
                                  {bill.due_amount !== bill.original_amount && (
                                    <span className="text-body text-muted-foreground ml-1">
                                      of ₹{bill.original_amount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              }
                              className="py-2"
                            />
                          </div>

                          {/* Overdue warning */}
                          {bill.is_overdue && (
                            <div className="mt-3">
                              <Alert variant="error">
                                Overdue by {bill.days_overdue} days. Please pay immediately.
                              </Alert>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
              </SheetBody>

              {/* CTA */}
              <SheetFooter>
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={activePayBills.length === 0 || paymentState === 'processing'}
                  onClick={handlePayment}
                >
                  {paymentState === 'processing' ? (
                    <>
                      <Loader2 className="h-[20px] w-[20px] animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-[20px] w-[20px]" />
                      Pay ₹{activePayTotal.toLocaleString()}
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
          {payBills.length === 0 && <SheetSkeleton />}
        </SheetContent>
      </Sheet>
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
    <>
      {disputedCount > 0 && (
        <Alert variant="warning" className="rounded-none border-0 border-b text-foreground">
          {disputedCount} {disputedCount === 1 ? 'bill is' : 'bills are'} under dispute. Payment may be held for review.
        </Alert>
      )}
      {hasMultiplePatients && (
        <Alert variant="info" className="rounded-none border-0 border-b text-foreground">
          Bills for multiple family members selected.
        </Alert>
      )}
    </>
  );
}
