import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading } from '@/Components/ui/skeleton';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { cn } from '@/Lib/utils';
import { SupportFooter } from '@/Components/SupportFooter';
import { SideNav } from '@/Components/SideNav';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Stethoscope,
  TestTube2,
  CreditCard,
  IndianRupee,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  MoreVertical,
  Receipt,
  Mail,
  MessageSquare,
  ChevronRight,
  FileText,
  Share2,
  ClipboardList,
  XCircle,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { downloadAsHtml } from '@/Lib/download';
import { Textarea } from '@/Components/ui/textarea';
import { ShareDialog } from '@/Components/ui/share-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/Components/ui/dialog';

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

interface LineItem {
  label: string;
  qty: number;
  unit_price: number;
  total: number;
}

interface PaymentInfo {
  method: string;
  transaction_id: string;
  paid_at: string;
  receipt_number: string;
}

interface InsuranceDetails {
  provider_name: string;
  policy_number: string;
  claim_id: string;
  claim_status: string;
  covered_amount: number;
  copay_amount: number;
  pre_auth_status: string;
  insurance_claim_id?: number;
}

interface EmiDetails {
  total_amount: number;
  plan_months: number;
  monthly_amount: number;
  paid_installments: number;
  total_installments: number;
  next_due_date: string;
  remaining_balance: number;
}

interface DisputeDetails {
  dispute_id: string;
  raised_on: string;
  reason: string;
  status: string;
  resolution_notes: string | null;
}

interface Bill {
  id: number;
  invoice_number: string;
  appointment_id: number;
  appointment_type: 'doctor' | 'lab_test';
  appointment_title: string;
  appointment_subtitle: string;
  appointment_date: string;
  appointment_time: string;
  appointment_mode: string;
  appointment_status: string;
  department: string | null;
  patient_name: string;
  billing_status: BillingStatus;
  due_amount: number;
  original_amount: number;
  insurance_covered: number;
  emi_current: number | null;
  emi_total: number | null;
  generated_date: string;
  due_date: string | null;
  reference_number: string;
  service_type: string;
  doctor_name: string | null;
  doctor_specialization: string | null;
  service_date: string;
  line_items: LineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  insurance_deduction: number;
  total: number;
  payment_info: PaymentInfo | null;
  insurance_details: InsuranceDetails | null;
  emi_details: EmiDetails | null;
  dispute_details: DisputeDetails | null;
  activity_log: { event: string; date: string; icon: string }[];
  is_overdue: boolean;
  days_overdue: number;
  payment_method: string;
  payment_date: string;
  invoice_date: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Props {
  user: User;
  bill: Bill;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/* ─── Status Config ─── */

const STATUS_CONFIG: Record<BillingStatus, { label: string; variant: string }> = {
  due: { label: 'Due', variant: 'destructive' },
  paid: { label: 'Paid', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'secondary' },
  awaiting_approval: { label: 'Awaiting Approval', variant: 'warning' },
  claim_pending: { label: 'Claim Pending', variant: 'warning' },
  copay_due: { label: 'Co-pay Due', variant: 'destructive' },
  emi: { label: 'EMI', variant: 'default' },
  disputed: { label: 'Disputed', variant: 'destructive' },
  covered: { label: 'Covered', variant: 'success' },
  reimbursed: { label: 'Reimbursed', variant: 'success' },
};

const PAYABLE_STATUSES: BillingStatus[] = ['due', 'copay_due'];

/* ─── Sections Config ─── */

const SECTIONS = [
  { id: 'invoice', label: 'Invoice', icon: FileText },
  { id: 'charges', label: 'Charges', icon: Receipt },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'emi', label: 'EMI', icon: IndianRupee },
  { id: 'dispute', label: 'Dispute', icon: AlertTriangle },
] as const;

/* ─── SideNav Component ─── */

function BillingSideNav({ hasEmi, hasDispute, hasPayment }: { hasEmi: boolean; hasDispute: boolean; hasPayment: boolean }) {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const isScrollingRef = useRef(false);

  // Filter sections based on what's visible
  const visibleSections = SECTIONS.filter((s) => {
    if (s.id === 'emi' && !hasEmi) return false;
    if (s.id === 'dispute' && !hasDispute) return false;
    if (s.id === 'payment' && !hasPayment) return false;
    return true;
  });

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

    visibleSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

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
    <SideNav
      items={visibleSections.map(s => ({ id: s.id, label: s.label, icon: s.icon }))}
      activeId={activeSection}
      onSelect={scrollTo}
    />
  );
}

/* ─── Section Component ─── */

function Section({
  id,
  title,
  icon: SectionIcon,
  children,
  noPadding,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon icon={SectionIcon} className="h-5 w-5 text-foreground" />
        <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))', fontSize: '20px', lineHeight: '28px', letterSpacing: '0' }}>
          {title}
        </h2>
      </div>
      <Card className={noPadding ? '' : 'p-5'}>{children}</Card>
    </div>
  );
}

/* ─── Helpers ─── */

function StatusBadge({ status }: { status: BillingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Badge variant={cfg.variant as any}>{cfg.label}</Badge>;
}

/* ─── Status Alert Banner (embedded in header) ─── */

function StatusAlertBanner({ bill }: { bill: Bill }) {
  const emi = bill.emi_details;

  type BannerConfig = { icon: React.ReactNode; title: string; message: string; bg: string; border: string; titleColor: string; textColor: string } | null;

  const config: BannerConfig = (() => {
    const cls = 'h-4 w-4';
    switch (bill.billing_status) {
      case 'due':
        return bill.is_overdue
          ? { icon: <AlertTriangle className={cls} />, title: 'Bill Overdue', message: `This bill is overdue by ${bill.days_overdue} days. Please pay immediately.`, bg: 'hsl(var(--destructive) / 0.1)', border: 'hsl(var(--destructive) / 0.2)', titleColor: 'text-destructive', textColor: 'text-destructive' }
          : { icon: <IndianRupee className={cls} />, title: 'Payment Due', message: `Due by ${bill.due_date}. Amount: ₹${bill.due_amount.toLocaleString()}.`, bg: 'hsl(var(--primary) / 0.1)', border: 'hsl(var(--primary) / 0.2)', titleColor: 'text-primary', textColor: 'text-primary' };
      case 'copay_due':
        return bill.is_overdue
          ? { icon: <AlertTriangle className={cls} />, title: 'Co-pay Overdue', message: `Overdue by ${bill.days_overdue} days. Contact support for assistance.`, bg: 'hsl(var(--destructive) / 0.1)', border: 'hsl(var(--destructive) / 0.2)', titleColor: 'text-destructive', textColor: 'text-destructive' }
          : { icon: <IndianRupee className={cls} />, title: 'Co-pay Due', message: `Insurance covers ₹${bill.insurance_covered.toLocaleString()}. Co-pay of ₹${bill.due_amount.toLocaleString()} due by ${bill.due_date}.`, bg: 'hsl(var(--primary) / 0.1)', border: 'hsl(var(--primary) / 0.2)', titleColor: 'text-primary', textColor: 'text-primary' };
      case 'awaiting_approval':
        return { icon: <Clock className={cls} />, title: 'Insurance Pending', message: 'Claim under review. Payment on hold until approval.', bg: 'hsl(var(--warning) / 0.1)', border: 'hsl(var(--warning) / 0.2)', titleColor: 'text-warning', textColor: 'text-warning' };
      case 'claim_pending':
        return { icon: <Clock className={cls} />, title: 'Claim Submitted', message: "Claim submitted and being processed. You'll be notified once approved.", bg: 'hsl(var(--warning) / 0.1)', border: 'hsl(var(--warning) / 0.2)', titleColor: 'text-warning', textColor: 'text-warning' };
      case 'disputed':
        return { icon: <AlertTriangle className={cls} />, title: 'Under Dispute', message: 'Bill is being reviewed. Payment disabled until resolved.', bg: 'hsl(var(--destructive) / 0.1)', border: 'hsl(var(--destructive) / 0.2)', titleColor: 'text-destructive', textColor: 'text-destructive' };
      case 'refunded':
        return { icon: <RotateCcw className={cls} />, title: 'Refund Processed', message: 'Full refund issued. No further action required.', bg: 'hsl(var(--muted))', border: 'hsl(var(--border))', titleColor: 'text-foreground', textColor: 'text-muted-foreground' };
      case 'emi':
        return { icon: <CreditCard className={cls} />, title: 'EMI Active', message: `Installment ${emi?.paid_installments}/${emi?.total_installments} — ₹${emi?.monthly_amount.toLocaleString()}/month. Next: ${emi?.next_due_date}.`, bg: 'hsl(var(--primary) / 0.1)', border: 'hsl(var(--primary) / 0.2)', titleColor: 'text-primary', textColor: 'text-primary' };
      case 'covered':
        return { icon: <ShieldCheck className={cls} />, title: 'Fully Covered', message: 'Fully covered by insurance. No payment required.', bg: 'hsl(var(--success) / 0.1)', border: 'hsl(var(--success) / 0.2)', titleColor: 'text-success', textColor: 'text-success' };
      case 'reimbursed':
        return { icon: <ShieldCheck className={cls} />, title: 'Reimbursed', message: 'Reimbursed by insurance.', bg: 'hsl(var(--success) / 0.1)', border: 'hsl(var(--success) / 0.2)', titleColor: 'text-success', textColor: 'text-success' };
      default:
        return null;
    }
  })();

  if (!config) return null;

  return (
    <div className="rounded-lg px-3.5 py-3 flex items-start gap-2.5 mb-4" style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}>
      <div className={cn('mt-0.5 flex-shrink-0', config.titleColor)}>{config.icon}</div>
      <div>
        <p className={cn('text-[14px] font-semibold', config.titleColor)}>{config.title}</p>
        <p className={cn('text-[14px] mt-0.5', config.textColor)}>{config.message}</p>
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */

function BillingShowSkeleton() {
  return (
    <div className="w-full max-w-[960px]">
      {/* Back link */}
      <Pulse className="h-4 w-16 mb-6" />
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Pulse className="h-8 w-40" />
            <Pulse className="h-6 w-16 rounded-full" />
          </div>
          <Pulse className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Pulse className="h-10 w-28 rounded-lg" />
          <Pulse className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      {/* Invoice Header Card */}
      <div className="rounded-xl border border-border p-6 mb-4 space-y-4">
        <Pulse className="h-5 w-48" />
        <Pulse className="h-3 w-64" />
        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Pulse className="h-3 w-20 mb-1.5" />
              <Pulse className="h-4 w-32" />
            </div>
          ))}
        </div>
        <div className="border-t pt-4 grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Pulse className="h-3 w-20 mb-1.5" />
              <Pulse className="h-4 w-36" />
            </div>
          ))}
        </div>
        <Pulse className="h-14 w-full rounded-lg" />
      </div>
      {/* Charges */}
      <div className="rounded-xl border border-border p-6 mb-4 space-y-4">
        <Pulse className="h-5 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Pulse className="h-4 w-48" />
            <Pulse className="h-4 w-20" />
          </div>
        ))}
        <div className="border-t pt-3">
          <div className="flex justify-between">
            <Pulse className="h-5 w-24" />
            <Pulse className="h-6 w-20" />
          </div>
        </div>
      </div>
      {/* Payment */}
      <div className="rounded-xl border border-border p-6 mb-4 space-y-3">
        <Pulse className="h-5 w-36" />
        <Pulse className="h-4 w-72" />
        <Pulse className="h-4 w-56" />
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function Show({ user, bill }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(bill);
  const [toastMessage, setToastMessage] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const isDoctor = bill.appointment_type === 'doctor';
  const isPayable = PAYABLE_STATUSES.includes(bill.billing_status);
  const isEmi = bill.billing_status === 'emi';
  const isPaid = ['paid', 'covered', 'reimbursed'].includes(bill.billing_status);
  const statusCfg = STATUS_CONFIG[bill.billing_status];

  const handleDownloadInvoice = () => {
    const itemRows = bill.line_items.map(i =>
      `<tr><td>${i.label}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">₹${i.unit_price.toLocaleString()}</td><td style="text-align:right">₹${i.total.toLocaleString()}</td></tr>`
    ).join('');
    const summaryRows = [
      `<div class="row"><span class="row-label">Subtotal</span><span class="row-value">₹${bill.subtotal.toLocaleString()}</span></div>`,
      ...(bill.discount > 0 ? [`<div class="row"><span class="row-label">Discount</span><span class="row-value" style="color:#059669">-₹${bill.discount.toLocaleString()}</span></div>`] : []),
      ...(bill.tax > 0 ? [`<div class="row"><span class="row-label">Tax</span><span class="row-value">₹${bill.tax.toLocaleString()}</span></div>`] : []),
      ...(bill.insurance_deduction > 0 ? [`<div class="row"><span class="row-label">Insurance Coverage</span><span class="row-value" style="color:#059669">-₹${bill.insurance_deduction.toLocaleString()}</span></div>`] : []),
    ].join('');

    downloadAsHtml(`invoice-${bill.invoice_number}.pdf`, `
      <h1>Invoice</h1>
      <p class="subtitle">${bill.invoice_number} &middot; ${bill.invoice_date}</p>
      <div class="section">
        <h3>From</h3>
        <p>HealthFirst Hospital<br/>123 Hospital Road, Pune 411001<br/>GSTIN: 27AABCH1234P1ZP</p>
      </div>
      <div class="section">
        <h3>To</h3>
        <p>${bill.patient_name}</p>
      </div>
      <h2>Service</h2>
      <div class="row"><span class="row-label">Description</span><span class="row-value">${bill.appointment_title}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${bill.appointment_date} at ${bill.appointment_time}</span></div>
      <div class="row"><span class="row-label">Mode</span><span class="row-value">${bill.appointment_mode}</span></div>
      ${bill.doctor_name ? `<div class="row"><span class="row-label">Doctor</span><span class="row-value">${bill.doctor_name}</span></div>` : ''}
      <h2>Charges</h2>
      <table><thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
      ${summaryRows}
      <div class="total-row row"><span class="row-label" style="font-weight:600">${isPayable ? 'Amount Due' : 'Total'}</span><span class="row-value" style="font-weight:700;font-size:15px">₹${bill.total.toLocaleString()}</span></div>
      <h2>Payment</h2>
      <div class="row"><span class="row-label">Status</span><span class="row-value">${statusCfg.label}</span></div>
      <div class="row"><span class="row-label">Method</span><span class="row-value">${bill.payment_method}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${bill.payment_date}</span></div>
      <div class="row"><span class="row-label">Reference</span><span class="row-value">${bill.reference_number}</span></div>
    `);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handlePayment = async (amount: number) => {
    if (paymentLoading) return;
    setPaymentLoading(true);

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
      const res = await fetch(`/billing/${bill.appointment_id}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error('Failed to create order');
      const orderData = await res.json();

      if (orderData.mock_mode) {
        const verifyRes = await fetch(`/billing/${bill.appointment_id}/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
          body: JSON.stringify({
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'mock_signature',
          }),
        });

        if (!verifyRes.ok) throw new Error('Payment verification failed');
        showToast('Payment successful!');
        setPaymentLoading(false);
        router.reload();
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'HealthFirst',
        description: `Payment for ${bill.invoice_number}`,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`/billing/${bill.appointment_id}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error('Verification failed');
            showToast('Payment successful!');
            setPaymentLoading(false);
            router.reload();
          } catch {
            setPaymentLoading(false);
            showToast('Payment verification failed. Please try again.');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
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
      setPaymentLoading(false);
      showToast('Failed to initiate payment. Please try again.');
    }
  };

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing.svg">
        <ErrorState onRetry={retry} label="Unable to load bill details" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing.svg">
        <BillingShowSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing.svg">
      <div className="w-full max-w-[960px] min-h-full flex flex-col pb-10">

        {/* ─── Back Link ─── */}
        <button
          onClick={() => router.visit('/billing')}
          className="mb-6 flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Billing
        </button>

        {/* ─── Page Header ─── */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{bill.invoice_number}</h1>
              <StatusBadge status={bill.billing_status} />
            </div>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {bill.patient_name} &middot; {bill.generated_date}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Primary Button by Status */}
            {isPayable && (
              <Button
                disabled={paymentLoading}
                onClick={() => handlePayment(bill.due_amount)}
              >
                <IndianRupee className="h-4 w-4" />
                {paymentLoading ? 'Processing...' : `Pay ₹${bill.due_amount.toLocaleString()}`}
              </Button>
            )}
            {isEmi && bill.emi_details && (
              <Button
                disabled={paymentLoading}
                onClick={() => handlePayment(bill.emi_details!.monthly_amount)}
              >
                <CreditCard className="h-4 w-4" />
                {paymentLoading ? 'Processing...' : `Pay EMI ₹${bill.emi_details.monthly_amount.toLocaleString()}`}
              </Button>
            )}
            {isPaid && !isEmi && (
              <Button onClick={() => {
                const itemRows = bill.line_items.map(i => `<div class="row"><span class="row-label">${i.label}</span><span class="row-value">₹${i.total.toLocaleString()}</span></div>`).join('');
                downloadAsHtml(`receipt-${bill.invoice_number}.pdf`, `
                  <h1>Payment Receipt</h1>
                  <p class="subtitle">${bill.invoice_number} &middot; ${bill.invoice_date}</p>
                  <h2>Patient</h2>
                  <p>${bill.patient_name}</p>
                  <h2>Service</h2>
                  <p>${bill.appointment_title}</p>
                  <p style="font-size:12px;color:#6b7280">${bill.appointment_date} at ${bill.appointment_time} &middot; ${bill.appointment_mode}</p>
                  <h2>Charges</h2>
                  ${itemRows}
                  <div class="row total-row"><span class="row-label">Total</span><span class="row-value">₹${bill.total.toLocaleString()}</span></div>
                  <h2>Payment</h2>
                  <div class="row"><span class="row-label">Method</span><span class="row-value">${bill.payment_method}</span></div>
                  <div class="row"><span class="row-label">Status</span><span class="row-value">Paid</span></div>
                  <div class="row"><span class="row-label">Date</span><span class="row-value">${bill.payment_date}</span></div>
                `);
              }}>
                <Receipt className="h-4 w-4" />
                Download Receipt
              </Button>
            )}
            {bill.billing_status === 'disputed' && (
              bill.dispute_details?.status === 'Under Review' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this dispute?')) {
                      router.post(`/billing/${bill.id}/dispute/cancel`, {}, {
                        onSuccess: () => showToast('Dispute cancelled'),
                        onError: () => showToast('Failed to cancel dispute'),
                      });
                    }
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Dispute
                </Button>
              ) : (
                <Button variant="outline" onClick={() => document.getElementById('dispute')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <AlertTriangle className="h-4 w-4" />
                  View Dispute
                </Button>
              )
            )}
            {(bill.billing_status === 'awaiting_approval' || bill.billing_status === 'claim_pending') && (
              <Button variant="outline" onClick={() => document.getElementById('payment')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <ClipboardList className="h-4 w-4" />
                Track Claim
              </Button>
            )}
            {bill.billing_status === 'refunded' && (
              <Button onClick={() => {
                const itemRows = bill.line_items.map(i => `<div class="row"><span class="row-label">${i.label}</span><span class="row-value">₹${i.total.toLocaleString()}</span></div>`).join('');
                downloadAsHtml(`refund-receipt-${bill.invoice_number}.pdf`, `
                  <h1>Refund Receipt</h1>
                  <p class="subtitle">${bill.invoice_number} &middot; ${bill.invoice_date}</p>
                  <h2>Patient</h2>
                  <p>${bill.patient_name}</p>
                  <h2>Service</h2>
                  <p>${bill.appointment_title}</p>
                  <p style="font-size:12px;color:#6b7280">${bill.appointment_date} at ${bill.appointment_time} &middot; ${bill.appointment_mode}</p>
                  <h2>Charges</h2>
                  ${itemRows}
                  <div class="row total-row"><span class="row-label">Total Refunded</span><span class="row-value">₹${bill.total.toLocaleString()}</span></div>
                  <h2>Refund Details</h2>
                  <div class="row"><span class="row-label">Status</span><span class="row-value">Refunded</span></div>
                  <div class="row"><span class="row-label">Method</span><span class="row-value">${bill.payment_method}</span></div>
                  <div class="row"><span class="row-label">Reference</span><span class="row-value">${bill.reference_number}</span></div>
                `);
              }}>
                <Receipt className="h-4 w-4" />
                Download Receipt
              </Button>
            )}
            {/* 3-dot Menu by Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Common: Download Invoice */}
                <DropdownMenuItem onClick={handleDownloadInvoice}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoice
                </DropdownMenuItem>

                {/* Unpaid: Payment Plan, Raise Dispute */}
                {isPayable && (
                  <>
                    <DropdownMenuItem onClick={() => showToast('Payment plan feature coming soon')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment Plan
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDisputeDialog(true)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Raise Dispute
                    </DropdownMenuItem>
                  </>
                )}

                {/* Paid: Reimbursement Letter, View Appointment */}
                {isPaid && bill.insurance_details && (
                  <DropdownMenuItem onClick={() => {
                    downloadAsHtml(`reimbursement-letter-${bill.invoice_number}.pdf`, `
                      <h1>Reimbursement Request Letter</h1>
                      <p class="subtitle">Reference: ${bill.invoice_number}</p>
                      <div class="section">
                        <p>To,<br/>The Claims Department<br/>${bill.insurance_details?.provider_name ?? 'Insurance Provider'}</p>
                      </div>
                      <div class="section">
                        <p>Subject: Request for Reimbursement of Medical Expenses</p>
                        <p>Dear Sir/Madam,</p>
                        <p>I am writing to request reimbursement for medical expenses incurred for the following treatment:</p>
                      </div>
                      <h2>Treatment Details</h2>
                      <div class="row"><span class="row-label">Patient</span><span class="row-value">${bill.patient_name}</span></div>
                      <div class="row"><span class="row-label">Treatment</span><span class="row-value">${bill.appointment_title}</span></div>
                      <div class="row"><span class="row-label">Date</span><span class="row-value">${bill.appointment_date}</span></div>
                      <div class="row"><span class="row-label">Amount</span><span class="row-value">₹${bill.total.toLocaleString()}</span></div>
                      <div class="row"><span class="row-label">Invoice</span><span class="row-value">${bill.invoice_number}</span></div>
                      <div class="section" style="margin-top:24px">
                        <p>I have enclosed the original bills and receipts for your reference. Kindly process the reimbursement at the earliest.</p>
                        <p>Thanking you,<br/>${bill.patient_name}</p>
                      </div>
                    `);
                    showToast('Reimbursement letter downloaded');
                  }}>
                    <Mail className="mr-2 h-4 w-4" />
                    Reimbursement Letter
                  </DropdownMenuItem>
                )}
                {isPaid && (
                  <DropdownMenuItem onClick={() => router.visit(`/appointments/${bill.appointment_id}`)}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Appointment
                  </DropdownMenuItem>
                )}

                {/* Disputed: Cancel Dispute */}
                {bill.billing_status === 'disputed' && bill.dispute_details?.status === 'Under Review' && (
                  <DropdownMenuItem onClick={() => {
                    if (confirm('Are you sure you want to cancel this dispute?')) {
                      router.post(`/billing/${bill.id}/dispute/cancel`, {}, {
                        onSuccess: () => showToast('Dispute cancelled'),
                        onError: () => showToast('Failed to cancel dispute'),
                      });
                    }
                  }}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Cancel Dispute
                  </DropdownMenuItem>
                )}

                {/* Common: Share */}
                <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ─── Status Alert ─── */}
        <StatusAlertBanner bill={bill} />

        {/* ─── Main Content with Side Nav ─── */}
        <div className="flex gap-24">
          <BillingSideNav
            hasEmi={!!bill.emi_details}
            hasDispute={!!bill.dispute_details}
            hasPayment={!!(bill.payment_info || bill.insurance_details)}
          />
          <div className="flex-1 min-w-0 space-y-12 pb-12">

            {/* ─── Invoice Section ─── */}
            <Section id="invoice" title="Invoice" icon={FileText}>
              {/* Hospital Identity */}
              <div className="mb-4 pb-4 border-b border-dashed">
                <p className="text-base font-bold" style={{ color: 'hsl(var(--foreground))' }}>HealthFirst Hospital</p>
                <p className="text-[14px] text-muted-foreground mt-0.5">123 Hospital Road, Pune 411001 &middot; GSTIN: 27AABCH1234P1ZP</p>
              </div>

              {/* Invoice Metadata */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4 pb-4 border-b">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Date</p>
                  <p className="mt-1 text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{bill.generated_date}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Reference</p>
                  <p className="mt-1 text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{bill.reference_number}</p>
                </div>
                {bill.due_date && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Due Date</p>
                    <p className={cn('mt-1 text-[14px] font-semibold', bill.is_overdue ? 'text-destructive' : '')} style={bill.is_overdue ? {} : { color: 'hsl(var(--foreground))' }}>
                      {bill.due_date}
                      {bill.is_overdue && (
                        <span className="ml-2 text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                          {bill.days_overdue}d overdue
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Patient & Service */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Patient</p>
                  <p className="mt-1 text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{bill.patient_name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Service</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--primary) / 0.2)' }}>
                      {isDoctor ? <Stethoscope className="h-2.5 w-2.5" style={{ color: 'hsl(var(--primary))' }} /> : <TestTube2 className="h-2.5 w-2.5" style={{ color: 'hsl(var(--primary))' }} />}
                    </div>
                    <p className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{bill.appointment_title}</p>
                  </div>
                </div>
                {bill.doctor_name && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Doctor</p>
                    <p className="mt-1 text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                      {bill.doctor_name}
                      {bill.doctor_specialization && <span className="text-muted-foreground font-normal"> &middot; {bill.doctor_specialization}</span>}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Date of Service</p>
                  <p className="mt-1 text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    {bill.service_date}
                    <span className="text-muted-foreground font-normal"> &middot; {bill.appointment_mode}</span>
                  </p>
                </div>
              </div>
            </Section>

            {/* ─── Charges Section ─── */}
            <Section id="charges" title="Charges" icon={Receipt} noPadding>
              <div className="px-6 py-4">
                {/* Table */}
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="border-b" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <th className="text-left font-medium text-muted-foreground px-5 py-2">Item</th>
                        <th className="text-center font-medium text-muted-foreground px-3 py-2 w-16">Qty</th>
                        <th className="text-right font-medium text-muted-foreground px-3 py-2 w-24">Unit Price</th>
                        <th className="text-right font-medium text-muted-foreground px-5 py-2 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.line_items.map((item, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          <td className="px-5 py-2.5">{item.label}</td>
                          <td className="text-center px-3 py-2.5 text-muted-foreground">{item.qty}</td>
                          <td className="text-right px-3 py-2.5 text-muted-foreground">₹{item.unit_price.toLocaleString()}</td>
                          <td className="text-right px-5 py-2.5">₹{item.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary rows */}
                <div className="border-t mt-2 pt-3 space-y-1.5">
                  <div className="flex justify-between text-[14px]">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{bill.subtotal.toLocaleString()}</span>
                  </div>
                  {bill.discount > 0 && (
                    <div className="flex justify-between text-[14px]">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-success">-₹{bill.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {bill.tax > 0 && (
                    <div className="flex justify-between text-[14px]">
                      <span className="text-muted-foreground">Tax</span>
                      <span>₹{bill.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {bill.insurance_deduction > 0 && (
                    <div className="flex justify-between text-[14px]">
                      <span className="text-muted-foreground">Insurance Coverage</span>
                      <span className="text-success">-₹{bill.insurance_deduction.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-[14px] font-semibold">
                      {isPayable ? 'Amount Due' : 'Amount Paid'}
                    </span>
                    <span className="text-lg font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                      ₹{bill.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Section>

            {/* ─── Payment & Insurance Section ─── */}
            {(bill.payment_info || bill.insurance_details) && (
              <Section id="payment" title="Payment Details" icon={CreditCard}>
                <div className="space-y-4">
                  {/* Payment info */}
                  {bill.payment_info && (
                    <div>
                      <p className="text-[14px]" style={{ color: 'hsl(var(--foreground))' }}>
                        Paid via <span className="font-medium">{bill.payment_info.method}</span> on {bill.payment_info.paid_at}
                      </p>
                      <p className="text-[14px] text-muted-foreground mt-1">
                        Transaction: <span className="font-mono">{bill.payment_info.transaction_id}</span>
                        <span className="mx-2">&middot;</span>
                        Receipt: <span className="font-mono">{bill.payment_info.receipt_number}</span>
                      </p>
                    </div>
                  )}

                  {/* Insurance info */}
                  {bill.insurance_details && (
                    <div className={bill.payment_info ? 'pt-4 border-t' : ''}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <p className="text-[14px] font-semibold text-primary uppercase tracking-wide">Insurance</p>
                      </div>
                      <p className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                        {bill.insurance_details.provider_name}
                        <span className="text-muted-foreground font-normal"> &middot; {bill.insurance_details.policy_number}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
                        <span>
                          <span className="text-muted-foreground">Claim:</span>{' '}
                          <span className="font-mono text-[14px]">{bill.insurance_details.claim_id}</span>
                          <span className="ml-1.5">
                            {bill.insurance_details.claim_status === 'Approved' || bill.insurance_details.claim_status === 'Reimbursed'
                              ? <span className="text-success text-[14px] font-medium">{bill.insurance_details.claim_status}</span>
                              : <span className="text-warning text-[14px] font-medium">{bill.insurance_details.claim_status}</span>
                            }
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
                        <span>
                          <span className="text-muted-foreground">Covered:</span>{' '}
                          <span className="text-success font-medium">₹{bill.insurance_details.covered_amount.toLocaleString()}</span>
                        </span>
                        {bill.insurance_details.copay_amount > 0 && (
                          <span>
                            <span className="text-muted-foreground">Co-pay:</span>{' '}
                            <span className="text-destructive font-medium">₹{bill.insurance_details.copay_amount.toLocaleString()}</span>
                          </span>
                        )}
                      </div>
                      {bill.insurance_details.insurance_claim_id && (
                        <button
                          className="mt-3 text-[14px] font-medium hover:underline flex items-center gap-1"
                          style={{ color: 'hsl(var(--primary))' }}
                          onClick={() => router.visit(`/insurance/claims/${bill.insurance_details!.insurance_claim_id}`)}
                        >
                          View Claim Details
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* ─── EMI Section ─── */}
            {bill.emi_details && (
              <Section id="emi" title="EMI Plan" icon={IndianRupee}>
                <p className="text-[14px] font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  ₹{bill.emi_details.monthly_amount.toLocaleString()}/month for {bill.emi_details.plan_months} months
                </p>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[14px] text-muted-foreground mb-1.5">
                    <span>{bill.emi_details.paid_installments} of {bill.emi_details.total_installments} paid</span>
                    <span>{Math.round((bill.emi_details.paid_installments / bill.emi_details.total_installments) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(bill.emi_details.paid_installments / bill.emi_details.total_installments) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[14px]">
                  <span>
                    <span className="text-muted-foreground">Next due:</span>{' '}
                    <span className="text-warning font-medium">{bill.emi_details.next_due_date}</span>
                  </span>
                  <span>
                    <span className="text-muted-foreground">Remaining:</span>{' '}
                    <span className="text-destructive font-medium">₹{bill.emi_details.remaining_balance.toLocaleString()}</span>
                  </span>
                </div>
              </Section>
            )}

            {/* ─── Dispute Section ─── */}
            {bill.dispute_details && (
              <div id="dispute" className="scroll-mt-24">
                <div className="flex items-center gap-2.5 mb-4">
                  <Icon icon={AlertTriangle} className="h-5 w-5 text-foreground" />
                  <h2 className="font-semibold" style={{ color: 'hsl(var(--foreground))', fontSize: '20px', lineHeight: '28px', letterSpacing: '0' }}>
                    Dispute
                  </h2>
                </div>
                <Card className="p-5" style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)', borderColor: 'hsl(var(--destructive) / 0.2)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-[14px] font-semibold text-destructive">
                      {bill.dispute_details.dispute_id} &middot; Raised {bill.dispute_details.raised_on}
                    </p>
                  </div>
                  <p className="text-[14px] text-destructive">
                    <span className="text-muted-foreground">Reason:</span> {bill.dispute_details.reason}
                  </p>
                  <p className="text-[14px] text-destructive mt-1">
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <span className="font-medium">{bill.dispute_details.status}</span>
                  </p>
                  {bill.dispute_details.resolution_notes && (
                    <p className="text-[14px] text-destructive mt-1">
                      <span className="text-muted-foreground">Resolution:</span> {bill.dispute_details.resolution_notes}
                    </p>
                  )}
                </Card>
              </div>
            )}

          </div>
        </div>

        <SupportFooter pageName="this bill" />
      </div>

      {/* Dispute Dialog */}
      <Dialog
        open={showDisputeDialog}
        onOpenChange={(open) => {
          if (!disputeLoading) {
            setShowDisputeDialog(open);
            if (!open) setDisputeReason('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Raise a dispute?</DialogTitle>
            <DialogDescription>
              Our team will review your dispute within 3–5 business days. Payment will be paused during review.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <div>
              <label className="block text-[14px] font-medium text-foreground mb-2">
                Reason for dispute
              </label>
              <Textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue with this bill..."
                maxLength={1000}
                rows={4}
                className="w-full"
              />
              <p className="mt-1 text-[14px] text-muted-foreground text-right">{disputeReason.length}/1000</p>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              className="flex-1"
              disabled={disputeLoading}
              onClick={() => {
                setShowDisputeDialog(false);
                setDisputeReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!disputeReason.trim() || disputeLoading}
              onClick={() => {
                setDisputeLoading(true);
                router.post(`/billing/${bill.id}/dispute`, { reason: disputeReason.trim() }, {
                  onSuccess: () => {
                    setShowDisputeDialog(false);
                    setDisputeReason('');
                    setDisputeLoading(false);
                    showToast('Dispute submitted. You will hear from us within 3–5 business days.');
                  },
                  onError: () => {
                    setDisputeLoading(false);
                    showToast('Failed to submit dispute. Please try again.');
                  },
                });
              }}
            >
              {disputeLoading ? 'Submitting...' : 'Submit dispute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-[14px] text-background shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Share Sheet */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={`Invoice ${bill.invoice_number}`}
        description={`${bill.appointment_title} · ₹${bill.total.toLocaleString()}`}
        url={window.location.href}
      />
    </AppLayout>
  );
}
