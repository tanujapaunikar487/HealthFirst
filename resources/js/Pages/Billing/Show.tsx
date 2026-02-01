import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import {
  ArrowLeft,
  Download,
  Printer,
  ExternalLink,
  Stethoscope,
  TestTube2,
  Calendar,
  Clock,
  User as UserIcon,
  CreditCard,
  IndianRupee,
} from 'lucide-react';

/* ─── Types ─── */

interface BillLineItem {
  label: string;
  amount: number;
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
  line_items: BillLineItem[];
  total: number;
  payment_status: string;
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

/* ─── Page ─── */

export default function Show({ user, bill }: Props) {
  const isDoctor = bill.appointment_type === 'doctor';

  const statusColor =
    bill.payment_status === 'paid'
      ? 'text-green-600'
      : bill.payment_status === 'pending'
        ? 'text-amber-600'
        : 'text-red-600';

  const statusBg =
    bill.payment_status === 'paid'
      ? 'bg-green-50'
      : bill.payment_status === 'pending'
        ? 'bg-amber-50'
        : 'bg-red-50';

  const statusLabel = bill.payment_status
    .replace('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleDownloadInvoice = () => {
    const lines = [
      `INVOICE`,
      `──────────────────────────────────`,
      `Invoice No:    ${bill.invoice_number}`,
      `Invoice Date:  ${bill.invoice_date}`,
      ``,
      `FROM`,
      `  HealthFirst Hospital`,
      `  123 Hospital Road, Pune 411001`,
      `  GSTIN: 27AABCH1234P1ZP`,
      ``,
      `TO`,
      `  ${bill.patient_name}`,
      ``,
      `APPOINTMENT`,
      `  ${bill.appointment_title}`,
      `  ${bill.appointment_date} at ${bill.appointment_time}`,
      `  Mode: ${bill.appointment_mode}`,
      ``,
      `──────────────────────────────────`,
      `CHARGES`,
      ...bill.line_items.map(
        (item) =>
          `  ${item.label.padEnd(30)} ${item.amount < 0 ? '-' : ' '}₹${Math.abs(item.amount)}`
      ),
      `──────────────────────────────────`,
      `  ${'TOTAL'.padEnd(30)}  ₹${bill.total}`,
      `──────────────────────────────────`,
      ``,
      `PAYMENT`,
      `  Method:  ${bill.payment_method}`,
      `  Status:  ${statusLabel}`,
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

  return (
    <AppLayout
      user={user}
      pageTitle="Billing"
      pageIcon="/assets/icons/billing-selected.svg"
    >
      <div style={{ width: '100%', maxWidth: '720px', padding: '40px 0' }}>
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-8" data-print-hide>
          <Link
            href="/billing"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Billing
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-full gap-1.5"
              onClick={handleDownloadInvoice}
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="border rounded-xl overflow-hidden">
          {/* Invoice Header */}
          <div className="px-6 py-5 border-b" style={{ backgroundColor: '#FAFAFA' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Invoice</p>
                <p className="text-xl font-bold font-mono" style={{ color: '#171717' }}>
                  {bill.invoice_number}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Issued {bill.invoice_date}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                  statusColor,
                  statusBg
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>

          {/* From / To */}
          <div className="px-6 py-5 border-b grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">From</p>
              <p className="text-sm font-medium">HealthFirst Hospital</p>
              <p className="text-xs text-muted-foreground mt-0.5">123 Hospital Road, Pune 411001</p>
              <p className="text-xs text-muted-foreground">GSTIN: 27AABCH1234P1ZP</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
              <p className="text-sm font-medium">{bill.patient_name}</p>
            </div>
          </div>

          {/* Appointment Reference */}
          <div className="px-6 py-5 border-b">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Appointment Reference</p>
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center',
                    isDoctor ? 'bg-blue-50' : 'bg-purple-50'
                  )}
                >
                  {isDoctor ? (
                    <Stethoscope className="h-4.5 w-4.5 text-blue-600" />
                  ) : (
                    <TestTube2 className="h-4.5 w-4.5 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{bill.appointment_title}</p>
                  {bill.appointment_subtitle && (
                    <p className="text-xs text-muted-foreground">{bill.appointment_subtitle}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{bill.appointment_date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{bill.appointment_time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>{bill.appointment_mode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-5 border-b">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Charges</p>
            <div className="space-y-3">
              {bill.line_items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className={item.amount < 0 ? 'text-green-600' : ''}>
                    {item.amount < 0 ? '-' : ''}₹{Math.abs(item.amount)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3 flex justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold" style={{ color: '#171717' }}>
                  ₹{bill.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="px-6 py-5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Payment Details</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={cn('font-medium', statusColor)}>{statusLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Method</span>
                <span>{bill.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid on</span>
                <span className="text-xs">{bill.payment_date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Appointment Link */}
        <div className="mt-6" data-print-hide>
          <Link
            href={`/appointments/${bill.appointment_id}`}
            className="flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-dashed py-3 hover:bg-muted/50 transition-colors"
            style={{ color: '#0052FF' }}
          >
            <ExternalLink className="h-4 w-4" />
            View Appointment Details
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
