import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Stethoscope,
  TestTube2,
  Calendar,
  Clock,
  User as UserIcon,
  CreditCard,
  IndianRupee,
  FileText,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Mail,
  RotateCcw,
  MessageSquare,
  Phone,
  ChevronRight,
  Receipt,
} from 'lucide-react';

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

interface ActivityEntry {
  event: string;
  date: string;
  icon: string;
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
  activity_log: ActivityEntry[];
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

/* ─── Status Config ─── */

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

/* ─── Helpers ─── */

function StatusBadge({ status }: { status: BillingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', cfg.color, cfg.bg)}>
      {cfg.label}
    </span>
  );
}

function SectionCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border rounded-xl overflow-hidden', className)}>
      <div className="px-5 py-3.5 border-b" style={{ backgroundColor: '#FAFAFA' }}>
        <h3 className="text-sm font-semibold" style={{ color: '#171717' }}>{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium text-right', valueClassName)}>{value}</span>
    </div>
  );
}

function getActivityIcon(icon: string) {
  const cls = 'h-3.5 w-3.5';
  switch (icon) {
    case 'file': return <FileText className={cls} />;
    case 'shield': return <Shield className={cls} />;
    case 'check': return <CheckCircle2 className={cls} />;
    case 'clock': return <Clock className={cls} />;
    case 'mail': return <Mail className={cls} />;
    case 'alert': return <AlertTriangle className={cls} />;
    case 'rotate': return <RotateCcw className={cls} />;
    default: return <FileText className={cls} />;
  }
}

function getActivityColor(icon: string) {
  switch (icon) {
    case 'check': return 'text-green-600 bg-green-50';
    case 'alert': return 'text-red-600 bg-red-50';
    case 'shield': return 'text-blue-600 bg-blue-50';
    case 'rotate': return 'text-amber-600 bg-amber-50';
    case 'clock': return 'text-amber-600 bg-amber-50';
    case 'mail': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
}

/* ─── Status Alert Banner ─── */

function StatusAlertBanner({ bill }: { bill: Bill }) {
  const isEmi = bill.billing_status === 'emi';
  const emi = bill.emi_details;

  type BannerConfig = { icon: React.ReactNode; title: string; message: string; bg: string; border: string; titleColor: string; textColor: string } | null;

  const config: BannerConfig = (() => {
    const cls = 'h-5 w-5';
    switch (bill.billing_status) {
      case 'due':
        return bill.is_overdue
          ? { icon: <AlertTriangle className={cls} />, title: 'Bill Overdue', message: `This bill is overdue by ${bill.days_overdue} days. Please pay immediately or contact support to discuss options.`, bg: '#FEF2F2', border: '#FECACA', titleColor: 'text-red-800', textColor: 'text-red-700' }
          : { icon: <IndianRupee className={cls} />, title: 'Payment Due', message: `This bill is due by ${bill.due_date}. Pay the full amount of ₹${bill.due_amount.toLocaleString()} to avoid late fees.`, bg: '#EFF6FF', border: '#BFDBFE', titleColor: 'text-blue-800', textColor: 'text-blue-700' };
      case 'copay_due':
        return bill.is_overdue
          ? { icon: <AlertTriangle className={cls} />, title: 'Co-pay Overdue', message: `Your co-pay is overdue by ${bill.days_overdue} days. Contact support for assistance.`, bg: '#FEF2F2', border: '#FECACA', titleColor: 'text-red-800', textColor: 'text-red-700' }
          : { icon: <IndianRupee className={cls} />, title: 'Co-pay Due', message: `Insurance covers ₹${bill.insurance_covered.toLocaleString()}. Your co-pay of ₹${bill.due_amount.toLocaleString()} is due by ${bill.due_date}.`, bg: '#EFF6FF', border: '#BFDBFE', titleColor: 'text-blue-800', textColor: 'text-blue-700' };
      case 'awaiting_approval':
        return { icon: <Clock className={cls} />, title: 'Insurance Pending', message: 'Your insurance claim is under review. Payment is on hold until approval. No action needed.', bg: '#FFFBEB', border: '#FDE68A', titleColor: 'text-amber-800', textColor: 'text-amber-700' };
      case 'claim_pending':
        return { icon: <Clock className={cls} />, title: 'Claim Submitted', message: "Your insurance claim has been submitted and is being processed. You'll be notified once approved.", bg: '#FFFBEB', border: '#FDE68A', titleColor: 'text-amber-800', textColor: 'text-amber-700' };
      case 'disputed':
        return { icon: <AlertTriangle className={cls} />, title: 'Bill Under Dispute', message: 'This bill is being reviewed. Payment is disabled until the dispute is resolved.', bg: '#FEF2F2', border: '#FECACA', titleColor: 'text-red-800', textColor: 'text-red-700' };
      case 'refunded':
        return { icon: <RotateCcw className={cls} />, title: 'Refund Processed', message: 'A full refund has been issued. No further action is required.', bg: '#F9FAFB', border: '#E5E7EB', titleColor: 'text-gray-800', textColor: 'text-gray-600' };
      case 'emi':
        return { icon: <CreditCard className={cls} />, title: 'EMI Active', message: `Installment ${emi?.paid_installments}/${emi?.total_installments} — ₹${emi?.monthly_amount.toLocaleString()}/month. Next due: ${emi?.next_due_date}.`, bg: '#EFF6FF', border: '#BFDBFE', titleColor: 'text-blue-800', textColor: 'text-blue-700' };
      case 'covered':
        return { icon: <ShieldCheck className={cls} />, title: 'Fully Covered', message: 'This bill is fully covered by insurance. No payment required.', bg: '#F0FDF4', border: '#BBF7D0', titleColor: 'text-green-800', textColor: 'text-green-700' };
      case 'reimbursed':
        return { icon: <ShieldCheck className={cls} />, title: 'Reimbursed', message: 'This bill has been reimbursed by insurance.', bg: '#F0FDF4', border: '#BBF7D0', titleColor: 'text-green-800', textColor: 'text-green-700' };
      default:
        return null;
    }
  })();

  if (!config) return null;

  return (
    <div className="rounded-xl px-4 py-3.5 flex items-start gap-3 mb-4" style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}>
      <div className={cn('mt-0.5 flex-shrink-0', config.titleColor)}>{config.icon}</div>
      <div>
        <p className={cn('text-sm font-semibold', config.titleColor)}>{config.title}</p>
        <p className={cn('text-xs mt-0.5', config.textColor)}>{config.message}</p>
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function Show({ user, bill }: Props) {
  const [toastMessage, setToastMessage] = useState('');
  const isDoctor = bill.appointment_type === 'doctor';
  const isPayable = PAYABLE_STATUSES.includes(bill.billing_status);
  const isEmi = bill.billing_status === 'emi';
  const isPaid = ['paid', 'covered', 'reimbursed'].includes(bill.billing_status);
  const statusCfg = STATUS_CONFIG[bill.billing_status];

  const handleDownloadInvoice = () => {
    const lines = [
      'INVOICE',
      '──────────────────────────────────',
      `Invoice No:    ${bill.invoice_number}`,
      `Invoice Date:  ${bill.invoice_date}`,
      `Reference:     ${bill.reference_number}`,
      '',
      'FROM',
      '  HealthFirst Hospital',
      '  123 Hospital Road, Pune 411001',
      '  GSTIN: 27AABCH1234P1ZP',
      '',
      'TO',
      `  ${bill.patient_name}`,
      '',
      'SERVICE',
      `  ${bill.appointment_title}`,
      `  ${bill.appointment_date} at ${bill.appointment_time}`,
      `  Mode: ${bill.appointment_mode}`,
      '',
      '──────────────────────────────────',
      'CHARGES',
      `${'Item'.padEnd(25)} ${'Qty'.padStart(4)} ${'Unit'.padStart(8)} ${'Total'.padStart(8)}`,
      '──────────────────────────────────',
      ...bill.line_items.map(
        (item) => `${item.label.padEnd(25)} ${String(item.qty).padStart(4)} ${('₹' + item.unit_price).padStart(8)} ${('₹' + item.total).padStart(8)}`
      ),
      '──────────────────────────────────',
      `${'Subtotal'.padEnd(39)} ₹${bill.subtotal}`,
      ...(bill.discount > 0 ? [`${'Discount'.padEnd(39)} -₹${bill.discount}`] : []),
      ...(bill.tax > 0 ? [`${'Tax'.padEnd(39)} ₹${bill.tax}`] : []),
      ...(bill.insurance_deduction > 0 ? [`${'Insurance Coverage'.padEnd(39)} -₹${bill.insurance_deduction}`] : []),
      '──────────────────────────────────',
      `${'TOTAL'.padEnd(39)} ₹${bill.total}`,
      '──────────────────────────────────',
      '',
      'PAYMENT',
      `  Status:  ${statusCfg.label}`,
      `  Method:  ${bill.payment_method}`,
      `  Date:    ${bill.payment_date}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.invoice_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <AppLayout user={user} pageTitle="Billing" pageIcon="/assets/icons/billing-selected.svg">
      <div style={{ width: '100%', maxWidth: '720px', padding: '40px 0' }}>

        {/* ─── Breadcrumb ─── */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/billing" className="hover:text-foreground transition-colors">Billing</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{bill.invoice_number}</span>
        </div>

        {/* ─── Header ─── */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <StatusBadge status={bill.billing_status} />
            <h1 className="text-xl font-bold" style={{ color: '#171717' }}>
              {bill.invoice_number}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isPayable && (
              <Button
                size="sm"
                className="text-xs rounded-full gap-1.5"
                onClick={() => showToast('Redirecting to payment gateway...')}
              >
                <IndianRupee className="h-3.5 w-3.5" />
                Pay ₹{bill.due_amount.toLocaleString()}
              </Button>
            )}
            {isEmi && bill.emi_details && (
              <Button
                size="sm"
                className="text-xs rounded-full gap-1.5"
                onClick={() => showToast('Redirecting to payment gateway...')}
              >
                <CreditCard className="h-3.5 w-3.5" />
                Pay EMI ₹{bill.emi_details.monthly_amount.toLocaleString()}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full gap-1.5"
              onClick={handleDownloadInvoice}
            >
              <Download className="h-3.5 w-3.5" />
              Download Invoice
            </Button>
            {isPaid && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-full gap-1.5"
                onClick={() => showToast('Receipt downloaded')}
              >
                <Receipt className="h-3.5 w-3.5" />
                Receipt
              </Button>
            )}
          </div>
        </div>

        {/* ─── Status Alert Banner ─── */}
        <StatusAlertBanner bill={bill} />

        {/* ─── Sections ─── */}
        <div className="space-y-4">

          {/* Overview */}
          <SectionCard title="Overview">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <InfoRow label="Bill ID" value={bill.invoice_number} />
              <InfoRow label="Generated" value={bill.generated_date} />
              {bill.due_date && (
                <InfoRow
                  label="Due Date"
                  value={
                    <span className="flex items-center gap-2">
                      <span className={bill.is_overdue ? 'text-red-600' : ''}>{bill.due_date}</span>
                      {bill.is_overdue && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                          {bill.days_overdue}d overdue
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              <InfoRow
                label="Linked Appointment"
                value={
                  <Link href={`/appointments/${bill.appointment_id}`} className="hover:underline" style={{ color: '#0052FF' }}>
                    {bill.reference_number}
                  </Link>
                }
              />
              <InfoRow label="Patient" value={bill.patient_name} />
              <InfoRow
                label="Payment Status"
                value={<StatusBadge status={bill.billing_status} />}
              />
            </div>
          </SectionCard>

          {/* Service Details */}
          <SectionCard title="Service Details">
            <div className="space-y-1">
              <InfoRow label="Service Type" value={bill.service_type} />
              <InfoRow
                label="Description"
                value={
                  <div className="flex items-center gap-2">
                    <div className={cn('h-6 w-6 rounded-full flex items-center justify-center', isDoctor ? 'bg-blue-50' : 'bg-purple-50')}>
                      {isDoctor ? <Stethoscope className="h-3 w-3 text-blue-600" /> : <TestTube2 className="h-3 w-3 text-purple-600" />}
                    </div>
                    <span>{bill.appointment_title}</span>
                  </div>
                }
              />
              {bill.doctor_name && <InfoRow label="Doctor" value={bill.doctor_name} />}
              {bill.doctor_specialization && <InfoRow label="Specialization" value={bill.doctor_specialization} />}
              <InfoRow label="Date of Service" value={bill.service_date} />
              <InfoRow label="Reference ID" value={bill.reference_number} />
            </div>
          </SectionCard>

          {/* Itemized Charges */}
          <SectionCard title="Itemized Charges">
            {/* Table */}
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: '#FAFAFA' }}>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{bill.subtotal.toLocaleString()}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-₹{bill.discount.toLocaleString()}</span>
                </div>
              )}
              {bill.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹{bill.tax.toLocaleString()}</span>
                </div>
              )}
              {bill.insurance_deduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Insurance Coverage</span>
                  <span className="text-green-600">-₹{bill.insurance_deduction.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">
                  {isPayable ? 'Amount Due' : 'Amount Paid'}
                </span>
                <span className="text-lg font-bold" style={{ color: '#171717' }}>
                  ₹{bill.total.toLocaleString()}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Payment Information */}
          {bill.payment_info && (
            <SectionCard title="Payment Information">
              <div className="space-y-1">
                <InfoRow label="Method" value={bill.payment_info.method} />
                <InfoRow label="Transaction ID" value={<span className="font-mono text-xs">{bill.payment_info.transaction_id}</span>} />
                <InfoRow label="Date & Time" value={bill.payment_info.paid_at} />
                <InfoRow label="Receipt Number" value={bill.payment_info.receipt_number} />
              </div>
            </SectionCard>
          )}

          {/* Insurance Details */}
          {bill.insurance_details && (
            <SectionCard title="Insurance Details">
              <div className="space-y-1">
                <InfoRow label="Provider" value={bill.insurance_details.provider_name} />
                <InfoRow label="Policy Number" value={<span className="font-mono text-xs">{bill.insurance_details.policy_number}</span>} />
                <InfoRow label="Claim ID" value={<span className="font-mono text-xs">{bill.insurance_details.claim_id}</span>} />
                <InfoRow
                  label="Claim Status"
                  value={
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      bill.insurance_details.claim_status === 'Approved' || bill.insurance_details.claim_status === 'Reimbursed'
                        ? 'text-green-600 bg-green-50'
                        : bill.insurance_details.claim_status === 'Submitted' || bill.insurance_details.claim_status === 'Under Review'
                          ? 'text-amber-600 bg-amber-50'
                          : 'text-gray-600 bg-gray-100'
                    )}>
                      {bill.insurance_details.claim_status}
                    </span>
                  }
                />
                <InfoRow label="Covered Amount" value={`₹${bill.insurance_details.covered_amount.toLocaleString()}`} valueClassName="text-green-600" />
                {bill.insurance_details.copay_amount > 0 && (
                  <InfoRow label="Co-pay Amount" value={`₹${bill.insurance_details.copay_amount.toLocaleString()}`} valueClassName="text-red-600" />
                )}
                <InfoRow
                  label="Pre-auth Status"
                  value={
                    <span className={cn(
                      'inline-flex items-center gap-1 text-xs',
                      bill.insurance_details.pre_auth_status === 'Approved' ? 'text-green-600' : 'text-amber-600'
                    )}>
                      {bill.insurance_details.pre_auth_status === 'Approved'
                        ? <ShieldCheck className="h-3.5 w-3.5" />
                        : <Clock className="h-3.5 w-3.5" />
                      }
                      {bill.insurance_details.pre_auth_status}
                    </span>
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* EMI Details */}
          {bill.emi_details && (
            <SectionCard title="EMI Details">
              <div className="space-y-1">
                <InfoRow label="Total Amount" value={`₹${bill.emi_details.total_amount.toLocaleString()}`} />
                <InfoRow label="Plan" value={`${bill.emi_details.plan_months} months`} />
                <InfoRow label="Monthly Amount" value={`₹${bill.emi_details.monthly_amount.toLocaleString()}`} />
                <InfoRow
                  label="Installments Paid"
                  value={
                    <span>
                      <span className="font-semibold">{bill.emi_details.paid_installments}</span>
                      <span className="text-muted-foreground"> / {bill.emi_details.total_installments}</span>
                    </span>
                  }
                />
                <InfoRow label="Next Due Date" value={bill.emi_details.next_due_date} valueClassName="text-amber-600" />
                <InfoRow label="Remaining Balance" value={`₹${bill.emi_details.remaining_balance.toLocaleString()}`} valueClassName="text-red-600" />
              </div>

              {/* Progress bar */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Payment Progress</span>
                  <span>{Math.round((bill.emi_details.paid_installments / bill.emi_details.total_installments) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${(bill.emi_details.paid_installments / bill.emi_details.total_installments) * 100}%` }}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Dispute Information */}
          {bill.dispute_details && (
            <SectionCard title="Dispute Information">
              <div className="space-y-1">
                <InfoRow label="Dispute ID" value={<span className="font-mono text-xs">{bill.dispute_details.dispute_id}</span>} />
                <InfoRow label="Date Raised" value={bill.dispute_details.raised_on} />
                <InfoRow label="Reason" value={bill.dispute_details.reason} />
                <InfoRow
                  label="Status"
                  value={
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-amber-600 bg-amber-50">
                      {bill.dispute_details.status}
                    </span>
                  }
                />
                {bill.dispute_details.resolution_notes && (
                  <InfoRow label="Resolution Notes" value={bill.dispute_details.resolution_notes} />
                )}
              </div>
            </SectionCard>
          )}

          {/* Activity Log */}
          {bill.activity_log.length > 0 && (
            <SectionCard title="Activity Log">
              <div className="relative">
                {bill.activity_log.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 relative pb-4 last:pb-0">
                    {/* Vertical line */}
                    {i < bill.activity_log.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-px bg-gray-200" />
                    )}
                    {/* Icon */}
                    <div className={cn('h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 relative z-10', getActivityColor(entry.icon))}>
                      {getActivityIcon(entry.icon)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium" style={{ color: '#171717' }}>{entry.event}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* ─── Footer Actions ─── */}
        <div className="mt-6 space-y-2">
          {isPayable && (
            <button
              className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border py-3 transition-colors text-white"
              style={{ backgroundColor: '#0052FF', borderColor: '#0052FF' }}
              onClick={() => showToast('Redirecting to payment gateway...')}
            >
              <IndianRupee className="h-4 w-4" />
              Pay ₹{bill.due_amount.toLocaleString()}
            </button>
          )}

          {isEmi && bill.emi_details && (
            <button
              className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border py-3 transition-colors text-white"
              style={{ backgroundColor: '#0052FF', borderColor: '#0052FF' }}
              onClick={() => showToast('Redirecting to payment gateway...')}
            >
              <CreditCard className="h-4 w-4" />
              Pay EMI ₹{bill.emi_details.monthly_amount.toLocaleString()}
            </button>
          )}

          {isPaid && !bill.dispute_details && (
            <button
              className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border border-dashed py-3 hover:bg-muted/50 transition-colors text-muted-foreground"
              onClick={() => showToast('Dispute form submitted. You will hear from us within 3–5 business days.')}
            >
              <MessageSquare className="h-4 w-4" />
              Raise Dispute
            </button>
          )}

          {isPaid && (
            <button
              className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border border-dashed py-3 hover:bg-muted/50 transition-colors text-muted-foreground"
              onClick={() => showToast('Reimbursement letter sent to your email.')}
            >
              <Mail className="h-4 w-4" />
              Request Reimbursement Letter
            </button>
          )}

          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border border-dashed py-3 hover:bg-muted/50 transition-colors text-muted-foreground"
            onClick={() => showToast('Our support team will contact you shortly.')}
          >
            <Phone className="h-4 w-4" />
            Contact Support
          </button>

          <Link
            href={`/appointments/${bill.appointment_id}`}
            className="w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl border border-dashed py-3 hover:bg-muted/50 transition-colors"
            style={{ color: '#0052FF' }}
          >
            <ExternalLink className="h-4 w-4" />
            View Linked Appointment
          </Link>
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {toastMessage}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
