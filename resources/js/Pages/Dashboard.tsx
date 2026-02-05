import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
  ChevronRight, AlertCircle, RefreshCw, Check, Stethoscope, FlaskConical,
  Receipt, MoreHorizontal, Calendar, X, FileText, Clock, CreditCard, Loader2,
  Shield, RotateCcw, CheckCircle2, Syringe,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Toast } from '@/Components/ui/toast';
import { getAvatarColor } from '@/Lib/avatar-colors';
import { CtaBanner } from '@/Components/ui/cta-banner';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/Components/ui/dropdown-menu';
import { Sheet, SheetContent } from '@/Components/ui/sheet';
import { SheetSkeleton } from '@/Components/ui/skeleton';
import {
  DetailsSheet,
  CancelSheet,
  RescheduleSheet,
  type Appointment,
  type SheetView,
} from '@/Components/Appointments/AppointmentSheets';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Patient {
  id: number;
  first_name: string;
  last_name: string;
}

interface ProfileStep {
  id: number;
  number: number;
  title: string;
  subtitle: string;
  completed: boolean;
  href?: string;
}

interface UpcomingAppointment {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  patient_name: string;
  patient_initials: string;
  date_formatted: string;
  time: string;
  mode: string;
  fee: number;
  is_today: boolean;
}

interface OverdueBill {
  id: number;
  patient_name: string;
  patient_initials: string;
  days_overdue: number;
  amount: number;
  title: string;
}

interface HealthAlert {
  id: number;
  title: string;
  patient_name: string;
  patient_initials: string;
  metric_name: string;
  metric_value: string;
  metric_reference: string;
  record_date_formatted: string;
}

interface PreventiveCarePrompt {
  id: string;
  member_id: number;
  patient_name: string;
  patient_initials: string;
  months_since: number | null;
  relation: string;
}

interface PaymentDueSoon {
  id: number;
  patient_name: string;
  patient_initials: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  title: string;
}

interface EmiDue {
  id: number;
  patient_name: string;
  patient_initials: string;
  emi_amount: number;
  current_installment: number;
  total_installments: number;
  due_date: string;
  title: string;
}

interface InsuranceClaimUpdate {
  id: number;
  claim_id: number;
  patient_name: string;
  patient_initials: string;
  claim_status: 'pending' | 'approved' | 'rejected' | 'action_required';
  claim_amount: number;
  treatment: string;
  title: string;
}


interface FollowUpDue {
  id: number;
  original_appointment_id: number;
  patient_name: string;
  patient_initials: string;
  doctor_name: string;
  department: string;
  recommended_date: string;
  days_overdue: number;
}

interface PreAppointmentReminder {
  id: number;
  appointment_id: number;
  patient_name: string;
  patient_initials: string;
  title: string;
  subtitle: string;
  time: string;
  hours_until: number;
  preparation_notes: string | null;
}

interface NewResultsReady {
  id: number;
  record_id: number;
  patient_name: string;
  patient_initials: string;
  test_name: string;
  uploaded_date: string;
  status: string;
}

interface VaccinationDue {
  id: number;
  patient_name: string;
  patient_initials: string;
  vaccine_name: string;
  due_date: string;
  age_requirement: string;
}

interface Promotion {
  id: number;
  title: string;
  description: string;
  button_text: string;
  button_href: string;
  image_url: string | null;
  bg_gradient: string;
}

interface DashboardProps {
  user: User & { patient?: Patient };
  profileSteps: ProfileStep[];
  profileJustCompleted?: boolean;
  upcomingAppointments?: UpcomingAppointment[];
  overdueBills?: OverdueBill[];
  healthAlerts?: HealthAlert[];
  preventiveCare?: PreventiveCarePrompt[];
  promotions?: Promotion[];
  paymentsDueSoon?: PaymentDueSoon[];
  emisDue?: EmiDue[];
  insuranceClaimUpdates?: InsuranceClaimUpdate[];

  followUpsDue?: FollowUpDue[];
  preAppointmentReminders?: PreAppointmentReminder[];
  newResultsReady?: NewResultsReady[];
  vaccinationsDue?: VaccinationDue[];
}

// --- Skeleton Components ---

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} style={style} />;
}

function DashboardSkeleton() {
  return (
    <div className="w-full max-w-[800px] mx-auto" style={{ minHeight: '720px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '68px', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <Pulse className="h-10 w-48" />
          <Pulse className="h-5 w-56" />
        </div>
        <Pulse className="h-12 w-60 rounded-full" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '738px' }}>
          <Pulse className="h-7 w-48" />
          <Pulse className="h-5 w-20" />
        </div>

        <Card className="overflow-hidden" style={{ width: '738px' }}>
          <CardContent className="p-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '738px',
                  padding: '16px',
                  borderBottom: i === 2 ? 'none' : '1px solid hsl(var(--border))',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                  <Pulse className="h-5 w-44" />
                  <Pulse className="h-4 w-64" />
                </div>
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Pulse className="w-full rounded-3xl" style={{ height: '216px' }} />
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full max-w-[800px] mx-auto" style={{ minHeight: '720px' }}>
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon icon={AlertCircle} className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-[14px] font-medium text-muted-foreground">Unable to load dashboard</p>
        <p className="text-[14px] text-muted-foreground">Please check your connection and try again.</p>
        <Button variant="outline" className="mt-2" onClick={onRetry}>
          <Icon icon={RefreshCw} className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// --- Dashboard Card Component ---

type CardType =
  | 'overdue_bill' | 'health_alert' | 'appointment_today' | 'appointment_upcoming'
  | 'payment_due_soon' | 'emi_due' | 'insurance_claim_update'
  | 'followup_due' | 'pre_appointment_reminder'
  | 'new_results_ready' | 'vaccination_due';

interface DashboardCardProps {
  type: CardType;
  title: string;
  subtitle: string;
  patientName: string;
  patientInitials: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  actionLabel: string;
  actionVariant?: 'accent' | 'outline' | 'secondary';
  onAction: () => void;
  menuItems: { label: string; onClick: () => void; destructive?: boolean }[];
  isLast: boolean;
  iconOverride?: typeof Receipt;
}

const cardConfig: Record<CardType, { icon: typeof Receipt; iconColor: string; iconBg: string }> = {
  overdue_bill: { icon: Receipt, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  health_alert: { icon: AlertCircle, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  appointment_today: { icon: Stethoscope, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  appointment_upcoming: { icon: Calendar, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  payment_due_soon: { icon: CreditCard, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  emi_due: { icon: CreditCard, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  insurance_claim_update: { icon: Shield, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },

  followup_due: { icon: RotateCcw, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  pre_appointment_reminder: { icon: Calendar, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  new_results_ready: { icon: CheckCircle2, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
  vaccination_due: { icon: Syringe, iconColor: 'hsl(var(--primary))', iconBg: 'hsl(var(--primary) / 0.2)' },
};

function DashboardCard({
  type, title, subtitle, patientName, patientInitials, badge, badgeColor, badgeBg,
  actionLabel, actionVariant = 'accent', onAction, menuItems, isLast, iconOverride,
}: DashboardCardProps) {
  const config = cardConfig[type];
  const CardIcon = iconOverride || config.icon;

  return (
    <div
      style={{
        padding: '16px',
        borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: '14px',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: config.iconBg }}
      >
        <Icon icon={CardIcon} className="h-5 w-5" style={{ color: config.iconColor }} />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, minWidth: 0 }}>
        {/* Patient + badge row */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center flex-shrink-0 text-[14px] font-semibold"
            style={{
              width: '24px', height: '24px', borderRadius: '9999px',
              backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', fontSize: '10px',
            }}
          >
            {patientInitials}
          </div>
          <span className="text-[14px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{patientName}</span>
          {badge && (
            <span
              className="text-[14px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: badgeBg || 'hsl(var(--destructive) / 0.1)', color: badgeColor || 'hsl(var(--destructive))', fontSize: '11px' }}
            >
              {badge}
            </span>
          )}
        </div>
        {/* Title */}
        <h3
          className="text-[14px] font-semibold leading-5 text-foreground truncate"
        >
          {title}
        </h3>
        {/* Subtitle */}
        <p className="text-[14px] font-normal leading-5 text-muted-foreground">{subtitle}</p>
      </div>

      {/* Action button */}
      <Button
        variant={actionVariant}
        className="flex-shrink-0"
        onClick={(e) => { e.stopPropagation(); onAction(); }}
      >
        {actionLabel}
      </Button>

      {/* Overflow menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center flex-shrink-0 rounded-full hover:bg-accent transition-colors"
            style={{ width: '32px', height: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Icon icon={MoreHorizontal} className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {menuItems.map((item, i) => (
            <DropdownMenuItem
              key={i}
              onClick={item.onClick}
              className={item.destructive ? 'text-destructive focus:text-destructive' : ''}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// --- Main Dashboard ---

export default function Dashboard({
  user,
  profileSteps,
  profileJustCompleted = false,
  upcomingAppointments = [],
  overdueBills = [],
  healthAlerts = [],
  preventiveCare = [],
  promotions = [],
  paymentsDueSoon = [],
  emisDue = [],
  insuranceClaimUpdates = [],

  followUpsDue = [],
  preAppointmentReminders = [],
  newResultsReady = [],
  vaccinationsDue = [],
}: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showToast, setShowToast] = useState(profileJustCompleted);
  const [toastMessage, setToastMessage] = useState('Profile successfully completed!');
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [upNextExpanded, setUpNextExpanded] = useState(false);
  const [laterExpanded, setLaterExpanded] = useState(false);
  const mountTime = useRef(Date.now());

  // Promotion banner dismissal with 30-day reshow (per promotion ID)
  const [dismissedPromoIds, setDismissedPromoIds] = useState<Set<number>>(() => {
    const ids = new Set<number>();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    for (const promo of promotions) {
      const dismissed = localStorage.getItem(`promotion_${promo.id}_dismissed`);
      if (dismissed) {
        const dismissedAt = parseInt(dismissed, 10);
        if (Date.now() - dismissedAt > thirtyDays) {
          localStorage.removeItem(`promotion_${promo.id}_dismissed`);
        } else {
          ids.add(promo.id);
        }
      }
    }
    return ids;
  });

  const handleDismissPromotion = (id: number) => {
    localStorage.setItem(`promotion_${id}_dismissed`, String(Date.now()));
    setDismissedPromoIds((prev) => new Set([...prev, id]));
  };

  const activePromotion = promotions.find((p) => !dismissedPromoIds.has(p.id)) ?? null;

  // Health alert dismissal with 30-day reshow (per alert ID)
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<number>>(() => {
    const ids = new Set<number>();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const stored = localStorage.getItem('dismissed_health_alerts');
    if (stored) {
      try {
        const dismissed = JSON.parse(stored);
        for (const [id, timestamp] of Object.entries(dismissed)) {
          if (Date.now() - (timestamp as number) > thirtyDays) {
            delete dismissed[id];
          } else {
            ids.add(Number(id));
          }
        }
        // Clean up expired entries
        localStorage.setItem('dismissed_health_alerts', JSON.stringify(dismissed));
      } catch {
        localStorage.removeItem('dismissed_health_alerts');
      }
    }
    return ids;
  });

  const handleDismissAlert = (id: number) => {
    const stored = localStorage.getItem('dismissed_health_alerts');
    const dismissed = stored ? JSON.parse(stored) : {};
    dismissed[id] = Date.now();
    localStorage.setItem('dismissed_health_alerts', JSON.stringify(dismissed));
    setDismissedAlertIds((prev) => new Set([...prev, id]));
    setToastMessage('Alert dismissed');
    setShowToast(true);
  };

  // Filter out dismissed health alerts
  const visibleHealthAlerts = healthAlerts.filter((alert) => !dismissedAlertIds.has(alert.id));

  // Sheet state management for appointment actions
  const [sheetView, setSheetView] = useState<SheetView>(null);

  // Convert dashboard appointment to full appointment interface
  function convertToFullAppointment(dashboardAppt: UpcomingAppointment): Appointment {
    return {
      id: dashboardAppt.id,
      type: dashboardAppt.type === 'doctor' ? 'doctor' : 'lab_test',
      title: dashboardAppt.title,
      subtitle: dashboardAppt.subtitle,
      patient_name: dashboardAppt.patient_name,
      patient_id: null,
      doctor_id: null,
      date: dashboardAppt.date_formatted,
      date_formatted: dashboardAppt.date_formatted,
      time: dashboardAppt.time,
      status: 'confirmed',
      fee: dashboardAppt.fee,
      payment_status: 'paid',
      mode: dashboardAppt.mode,
      is_upcoming: !dashboardAppt.is_today,
    };
  }

  // Razorpay payment for billing cards (overdue bills, payments due, EMIs)
  const handleBillPayment = async (bill: OverdueBill | PaymentDueSoon | EmiDue) => {
    setPayingBillId(bill.id);

    // Get the amount based on card type
    const amount = 'emi_amount' in bill ? bill.emi_amount : bill.amount;

    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
      const res = await fetch(`/billing/${bill.id}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ amount }),
      });

      if (!res.ok) throw new Error('Failed to create order');
      const orderData = await res.json();

      if (orderData.mock_mode) {
        const verifyRes = await fetch(`/billing/${bill.id}/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
          body: JSON.stringify({
            razorpay_payment_id: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
            razorpay_order_id: orderData.order_id,
            razorpay_signature: 'mock_signature',
          }),
        });
        if (!verifyRes.ok) throw new Error('Payment verification failed');
        setToastMessage('Payment successful!');
        setShowToast(true);
        router.reload();
        return;
      }

      // Real Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100,
        currency: 'INR',
        name: 'Healthcare Platform',
        description: bill.title,
        order_id: orderData.order_id,
        handler: async (response: any) => {
          const verifyRes = await fetch(`/billing/${bill.id}/payment/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            setToastMessage('Payment successful!');
            setShowToast(true);
            router.reload();
          }
        },
        modal: { ondismiss: () => setPayingBillId(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setToastMessage('Payment failed. Please try again.');
      setShowToast(true);
    } finally {
      setPayingBillId(null);
    }
  };

  useEffect(() => {
    const MIN_SKELETON_MS = 300;
    const elapsed = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

    const revealTimer = setTimeout(() => {
      setIsLoading(false);
    }, remaining);

    const errorTimer = setTimeout(() => {
      setIsLoading((current) => {
        if (current) setHasError(true);
        return current;
      });
    }, 10000);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(errorTimer);
    };
  }, []);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    mountTime.current = Date.now();
    router.reload();
  };

  if (hasError) {
    return (
      <AppLayout user={user}>
        <Head title="Dashboard" />
        <ErrorState onRetry={handleRetry} />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user}>
        <Head title="Dashboard" />
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  const today = new Date();
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);
  const firstName = user.name?.split(' ')[0] ?? '';
  const allStepsCompleted = profileSteps.every(step => step.completed);

  // Split appointments into today vs later
  const todayAppointments = upcomingAppointments.filter(a => a.is_today);
  const laterAppointments = upcomingAppointments.filter(a => !a.is_today);

  // Filter follow-ups into overdue vs future
  const overdueFollowUps = followUpsDue.filter(f => f.days_overdue >= 0);
  const futureFollowUps = followUpsDue.filter(f => f.days_overdue < 0 && f.days_overdue > -7);

  // Build "Up next" items: overdue bills + payment reminders + EMI + insurance claims (non-approved) + health alerts + prescriptions + overdue follow-ups + new results + today's appointments
  const hasUpNextItems =
    overdueBills.length > 0 ||
    paymentsDueSoon.length > 0 ||
    emisDue.length > 0 ||
    insuranceClaimUpdates.filter(c => c.claim_status !== 'approved').length > 0 ||
    visibleHealthAlerts.length > 0 ||

    overdueFollowUps.length > 0 ||
    newResultsReady.length > 0 ||
    todayAppointments.length > 0;

  // Build "Later this week" items: pre-appointment reminders + later appointments + future follow-ups + vaccinations + preventive care
  const hasLaterItems =
    preAppointmentReminders.length > 0 ||
    laterAppointments.length > 0 ||
    futureFollowUps.length > 0 ||
    vaccinationsDue.length > 0 ||
    preventiveCare.length > 0;

  const hasAnyActivity = hasUpNextItems || hasLaterItems;

  // Build flat arrays for each section to handle "View all" expansion
  const upNextCards = [
    ...overdueBills.map((bill, i) => ({ type: 'overdue_bill' as const, data: bill, index: i })),
    ...paymentsDueSoon.map((payment, i) => ({ type: 'payment_due_soon' as const, data: payment, index: i })),
    ...emisDue.map((emi, i) => ({ type: 'emi_due' as const, data: emi, index: i })),
    ...insuranceClaimUpdates.filter(c => c.claim_status !== 'approved').map((claim, i) => ({ type: 'insurance_claim_update' as const, data: claim, index: i })),
    ...visibleHealthAlerts.map((alert, i) => ({ type: 'health_alert' as const, data: alert, index: i })),

    ...overdueFollowUps.map((followup, i) => ({ type: 'followup_due' as const, data: followup, index: i })),
    ...newResultsReady.map((result, i) => ({ type: 'new_results_ready' as const, data: result, index: i })),
    ...todayAppointments.map((appt, i) => ({ type: 'appointment_today' as const, data: appt, index: i })),
  ];

  const laterCards = [
    ...preAppointmentReminders.map((reminder, i) => ({ type: 'pre_appointment_reminder' as const, data: reminder, index: i })),
    ...laterAppointments.map((appt, i) => ({ type: 'appointment_upcoming' as const, data: appt, index: i })),
    ...futureFollowUps.map((followup, i) => ({ type: 'followup_due_future' as const, data: followup, index: i })),
    ...vaccinationsDue.map((vaccination, i) => ({ type: 'vaccination_due' as const, data: vaccination, index: i })),
    ...preventiveCare.map((care, i) => ({ type: 'preventive_care' as const, data: care, index: i })),
  ];

  const visibleUpNextCards = upNextExpanded ? upNextCards : upNextCards.slice(0, 3);
  const visibleLaterCards = laterExpanded ? laterCards : laterCards.slice(0, 3);

  // Render function for up next cards
  const renderUpNextCard = (card: typeof upNextCards[0], cardIndex: number, totalVisible: number) => {
    const isLast = cardIndex === totalVisible - 1;

    switch (card.type) {
      case 'overdue_bill': {
        const bill = card.data as OverdueBill;
        return (
          <DashboardCard
            key={`bill-${bill.id}`}
            type="overdue_bill"
            title={bill.title}
            subtitle={`₹${bill.amount.toLocaleString('en-IN')} overdue`}
            patientName={bill.patient_name}
            patientInitials={bill.patient_initials}
            badge={`${bill.days_overdue}d overdue`}
            badgeColor="hsl(var(--destructive))"
            badgeBg="hsl(var(--destructive) / 0.1)"
            actionLabel={payingBillId === bill.id ? 'Paying...' : 'Pay'}
            onAction={() => handleBillPayment(bill)}
            menuItems={[
              { label: 'View bill', onClick: () => router.visit(`/billing/${bill.id}`) },
              { label: 'Payment history', onClick: () => router.visit(`/billing`) },
              { label: 'Dispute', onClick: () => router.visit(`/billing/${bill.id}`) },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'payment_due_soon': {
        const payment = card.data as PaymentDueSoon;
        return (
          <DashboardCard
            key={`payment-due-${payment.id}`}
            type="payment_due_soon"
            title={payment.title}
            subtitle={`Payment due in ${payment.days_until_due} days · ₹${payment.amount.toLocaleString('en-IN')}`}
            patientName={payment.patient_name}
            patientInitials={payment.patient_initials}
            badge={`Due in ${payment.days_until_due}d`}
            badgeColor="hsl(var(--primary))"
            badgeBg="hsl(var(--primary) / 0.1)"
            actionLabel={payingBillId === payment.id ? 'Paying...' : 'Pay'}
            onAction={() => handleBillPayment(payment)}
            menuItems={[
              { label: 'View bill', onClick: () => router.visit(`/billing/${payment.id}`) },
              { label: 'Payment history', onClick: () => router.visit('/billing') },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'emi_due': {
        const emi = card.data as EmiDue;
        return (
          <DashboardCard
            key={`emi-${emi.id}`}
            type="emi_due"
            title={emi.title}
            subtitle={`EMI ${emi.current_installment}/${emi.total_installments} · ₹${emi.emi_amount.toLocaleString('en-IN')}`}
            patientName={emi.patient_name}
            patientInitials={emi.patient_initials}
            badge={`EMI ${emi.current_installment}/${emi.total_installments}`}
            badgeColor="hsl(var(--primary))"
            badgeBg="hsl(var(--primary) / 0.1)"
            actionLabel={payingBillId === emi.id ? 'Paying...' : 'Pay EMI'}
            onAction={() => handleBillPayment(emi)}
            menuItems={[
              { label: 'View schedule', onClick: () => router.visit(`/billing/${emi.id}`) },
              { label: 'Pay full balance', onClick: () => handleBillPayment(emi) },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'insurance_claim_update': {
        const claim = card.data as InsuranceClaimUpdate;
        return (
          <DashboardCard
            key={`claim-${claim.id}`}
            type="insurance_claim_update"
            title={claim.title}
            subtitle={`${claim.treatment} · ₹${claim.claim_amount.toLocaleString('en-IN')}`}
            patientName={claim.patient_name}
            patientInitials={claim.patient_initials}
            badge={
              claim.claim_status === 'rejected' ? 'Rejected' :
              claim.claim_status === 'action_required' ? 'Action Required' :
              'Pending'
            }
            badgeColor={
              claim.claim_status === 'rejected' ? 'hsl(var(--destructive))' :
              claim.claim_status === 'action_required' ? 'hsl(var(--destructive))' :
              'hsl(var(--warning))'
            }
            badgeBg={
              claim.claim_status === 'rejected' ? 'hsl(var(--destructive) / 0.1)' :
              claim.claim_status === 'action_required' ? 'hsl(var(--destructive) / 0.1)' :
              'hsl(var(--warning) / 0.1)'
            }
            actionLabel="View claim"
            actionVariant="accent"
            onAction={() => router.visit(`/insurance/claims/${claim.claim_id}`)}
            menuItems={[
              { label: 'View details', onClick: () => router.visit(`/insurance/claims/${claim.claim_id}`) },
              { label: 'Contact support', onClick: () => {} },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'health_alert': {
        const alert = card.data as HealthAlert;
        return (
          <DashboardCard
            key={`alert-${alert.id}`}
            type="health_alert"
            title={alert.title}
            subtitle={`${alert.metric_name}: ${alert.metric_value} (ref: ${alert.metric_reference})`}
            patientName={alert.patient_name}
            patientInitials={alert.patient_initials}
            badge="Needs attention"
            badgeColor="hsl(var(--warning))"
            badgeBg="hsl(var(--warning) / 0.1)"
            actionLabel="Book"
            onAction={() => router.visit('/booking')}
            menuItems={[
              { label: 'View full report', onClick: () => router.visit(`/health-records?record=${alert.id}`) },
              { label: 'Dismiss alert', onClick: () => handleDismissAlert(alert.id) },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'followup_due': {
        const followup = card.data as FollowUpDue;
        return (
          <DashboardCard
            key={`followup-${followup.id}`}
            type="followup_due"
            title={`Follow-up with Dr. ${followup.doctor_name}`}
            subtitle={`${followup.department} · Recommended ${followup.days_overdue} days ago`}
            patientName={followup.patient_name}
            patientInitials={followup.patient_initials}
            badge={followup.days_overdue >= 0 ? 'Overdue' : 'Due soon'}
            badgeColor={followup.days_overdue >= 0 ? 'hsl(var(--destructive))' : 'hsl(var(--warning))'}
            badgeBg={followup.days_overdue >= 0 ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--warning) / 0.1)'}
            actionLabel="Book follow-up"
            actionVariant="accent"
            onAction={() => router.visit('/booking')}
            menuItems={[
              { label: 'View previous visit', onClick: () => router.visit(`/appointments/${followup.original_appointment_id}`) },
              { label: 'Dismiss', onClick: () => {} },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'new_results_ready': {
        const result = card.data as NewResultsReady;
        return (
          <DashboardCard
            key={`result-${result.id}`}
            type="new_results_ready"
            title={result.test_name}
            subtitle={`Results uploaded ${result.uploaded_date} · ${result.status}`}
            patientName={result.patient_name}
            patientInitials={result.patient_initials}
            badge="New"
            badgeColor="hsl(var(--success))"
            badgeBg="hsl(var(--success) / 0.1)"
            actionLabel="View results"
            actionVariant="accent"
            onAction={() => router.visit(`/health-records?record=${result.record_id}`)}
            menuItems={[
              { label: 'Share with doctor', onClick: () => {} },
              { label: 'Download', onClick: () => {} },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'appointment_today': {
        const appt = card.data as UpcomingAppointment;
        return (
          <DashboardCard
            key={`today-${appt.id}`}
            type="appointment_today"
            title={appt.title}
            subtitle={`Today · ${appt.time ? formatTime(appt.time) : ''} · ${appt.subtitle}`}
            iconOverride={appt.type === 'lab_test' ? FlaskConical : Stethoscope}
            patientName={appt.patient_name}
            patientInitials={appt.patient_initials}
            badge={appt.mode === 'video' ? 'Video' : appt.type === 'lab_test' ? 'Lab Test' : undefined}
            badgeColor={appt.mode === 'video' ? 'hsl(var(--primary))' : appt.type === 'lab_test' ? 'hsl(var(--warning))' : undefined}
            badgeBg={appt.mode === 'video' ? 'hsl(var(--primary) / 0.1)' : appt.type === 'lab_test' ? 'hsl(var(--warning) / 0.1)' : undefined}
            actionLabel="View"
            actionVariant="accent"
            onAction={() => setSheetView({ type: 'details', appointment: appt })}
            menuItems={[
              { label: 'Reschedule', onClick: () => setSheetView({ type: 'reschedule', appointment: appt }) },
              { label: 'Cancel appointment', onClick: () => setSheetView({ type: 'cancel', appointment: appt }), destructive: true },
              { label: 'Add to calendar', onClick: () => { generateICSFile(appt); setToastMessage('Calendar file downloaded'); setShowToast(true); } },
            ]}
            isLast={isLast}
          />
        );
      }
      default:
        return null;
    }
  };

  // Render function for later this week cards
  const renderLaterCard = (card: typeof laterCards[0], cardIndex: number, totalVisible: number) => {
    const isLast = cardIndex === totalVisible - 1;

    switch (card.type) {
      case 'pre_appointment_reminder': {
        const reminder = card.data as PreAppointmentReminder;
        return (
          <DashboardCard
            key={`pre-appt-${reminder.id}`}
            type="pre_appointment_reminder"
            title={reminder.title}
            subtitle={`${reminder.hours_until < 24 ? 'Tomorrow' : `In ${reminder.hours_until}h`} · ${formatTime(reminder.time)} · ${reminder.subtitle}`}
            patientName={reminder.patient_name}
            patientInitials={reminder.patient_initials}
            badge={reminder.hours_until < 24 ? 'Tomorrow' : `In ${reminder.hours_until}h`}
            badgeColor="hsl(var(--primary))"
            badgeBg="hsl(var(--primary) / 0.1)"
            actionLabel="View details"
            actionVariant="secondary"
            onAction={() => router.visit(`/appointments/${reminder.appointment_id}`)}
            menuItems={[
              { label: 'Get directions', onClick: () => {} },
              { label: 'Reschedule', onClick: () => router.visit(`/appointments/${reminder.appointment_id}`) },
              { label: 'Cancel', onClick: () => router.visit(`/appointments/${reminder.appointment_id}`), destructive: true },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'appointment_upcoming': {
        const appt = card.data as UpcomingAppointment;
        return (
          <DashboardCard
            key={`later-${appt.id}`}
            type="appointment_upcoming"
            title={appt.title}
            subtitle={`${appt.date_formatted} · ${appt.time ? formatTime(appt.time) : ''} · ${appt.subtitle}`}
            iconOverride={appt.type === 'lab_test' ? FlaskConical : Calendar}
            patientName={appt.patient_name}
            patientInitials={appt.patient_initials}
            badge={appt.type === 'lab_test' ? 'Lab Test' : appt.mode === 'video' ? 'Video' : undefined}
            badgeColor={appt.type === 'lab_test' ? 'hsl(var(--warning))' : appt.mode === 'video' ? 'hsl(var(--primary))' : undefined}
            badgeBg={appt.type === 'lab_test' ? 'hsl(var(--warning) / 0.1)' : appt.mode === 'video' ? 'hsl(var(--primary) / 0.1)' : undefined}
            actionLabel="Reschedule"
            actionVariant="secondary"
            onAction={() => setSheetView({ type: 'reschedule', appointment: appt })}
            menuItems={[
              { label: 'View details', onClick: () => setSheetView({ type: 'details', appointment: appt }) },
              { label: 'Cancel appointment', onClick: () => setSheetView({ type: 'cancel', appointment: appt }), destructive: true },
              { label: 'Add to calendar', onClick: () => { generateICSFile(appt); setToastMessage('Calendar file downloaded'); setShowToast(true); } },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'followup_due_future': {
        const followup = card.data as FollowUpDue;
        return (
          <DashboardCard
            key={`future-followup-${followup.id}`}
            type="followup_due"
            title={`Follow-up with Dr. ${followup.doctor_name}`}
            subtitle={`${followup.department} · Recommended for ${followup.recommended_date}`}
            patientName={followup.patient_name}
            patientInitials={followup.patient_initials}
            badge="Due soon"
            badgeColor="hsl(var(--warning))"
            badgeBg="hsl(var(--warning) / 0.1)"
            actionLabel="Book follow-up"
            actionVariant="secondary"
            onAction={() => router.visit('/booking')}
            menuItems={[
              { label: 'View previous visit', onClick: () => router.visit(`/appointments/${followup.original_appointment_id}`) },
              { label: 'Dismiss', onClick: () => {} },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'vaccination_due': {
        const vaccination = card.data as VaccinationDue;
        const dueDate = new Date(vaccination.due_date);
        const isPast = dueDate < new Date();
        const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return (
          <DashboardCard
            key={`vaccination-${vaccination.id}`}
            type="vaccination_due"
            title={vaccination.vaccine_name}
            subtitle={`${vaccination.age_requirement} · Due on ${vaccination.due_date}`}
            patientName={vaccination.patient_name}
            patientInitials={vaccination.patient_initials}
            badge={isPast ? 'Overdue' : `Due ${daysUntil}d`}
            badgeColor={isPast ? 'hsl(var(--destructive))' : 'hsl(var(--warning))'}
            badgeBg={isPast ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--warning) / 0.1)'}
            actionLabel="Schedule"
            actionVariant="secondary"
            onAction={() => router.visit('/booking')}
            menuItems={[
              { label: 'View vaccination history', onClick: () => router.visit(`/health-records?member_id=${vaccination.id}`) },
              { label: 'Dismiss', onClick: () => {} },
            ]}
            isLast={isLast}
          />
        );
      }
      case 'preventive_care': {
        const care = card.data as PreventiveCarePrompt;
        return (
          <DashboardCard
            key={`care-${care.id}`}
            type="appointment_upcoming"
            title="Annual checkup due"
            subtitle={care.months_since !== null ? `Last checkup ${care.months_since} months ago` : 'No recent checkup'}
            iconOverride={Clock}
            patientName={care.patient_name}
            patientInitials={care.patient_initials}
            badge={care.months_since !== null && care.months_since > 12 ? 'Overdue' : 'Due soon'}
            badgeColor={care.months_since !== null && care.months_since > 12 ? 'hsl(var(--destructive))' : 'hsl(var(--warning))'}
            badgeBg={care.months_since !== null && care.months_since > 12 ? 'hsl(var(--destructive) / 0.1)' : 'hsl(var(--warning) / 0.1)'}
            actionLabel="Book now"
            actionVariant="secondary"
            onAction={() => router.visit('/booking')}
            menuItems={[
              { label: 'View records', onClick: () => router.visit(`/health-records?member_id=${care.member_id}`) },
              { label: 'Dismiss', onClick: () => {} },
            ]}
            isLast={isLast}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <AppLayout user={user}>
      <Head title="Dashboard" />

      <div className="w-full max-w-[800px] mx-auto" style={{ minHeight: '720px', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '68px', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '485px', height: '68px', gap: '4px', flexGrow: 1 }}>
            <h1 className="font-bold" style={{ fontSize: '36px', lineHeight: '44px', letterSpacing: '-1px', color: 'hsl(var(--foreground))', margin: 0, width: '384px', height: '44px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Hi, {firstName}
            </h1>
            <p className="font-normal" style={{ fontSize: '14px', fontWeight: 400, lineHeight: '20px', letterSpacing: '0px', color: 'hsl(var(--muted-foreground))', margin: 0, width: '100%', height: '20px', display: 'flex', alignItems: 'center' }}>
              {formattedDate}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <Button asChild size="lg" className="font-semibold">
              <Link href="/booking">
                <img src="/assets/icons/appointment-2.svg" alt="" style={{ width: '20px', height: '20px' }} />
                Book appointment
              </Link>
            </Button>
          </div>
        </div>

        {/* ─── ACTIVE DASHBOARD (all steps completed) ─── */}
        {allStepsCompleted && hasAnyActivity && (
          <>
            {/* Up next section */}
            {hasUpNextItems && (
              <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: 'hsl(var(--foreground))' }}>
                  Up next
                </h2>
                <Card className="overflow-hidden w-full">
                  <CardContent className="p-0">
                    {visibleUpNextCards.map((card, i) => renderUpNextCard(card, i, visibleUpNextCards.length))}

                    {/* View all button inside card */}
                    {upNextCards.length > 3 && (
                      <div
                        className="px-6 py-4 border-t border-border flex justify-center cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setUpNextExpanded(!upNextExpanded)}
                      >
                        <span className="text-[14px] font-medium text-primary">
                          {upNextExpanded ? 'Show less' : `View all ${upNextCards.length}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Later this week section */}
            {hasLaterItems && (
              <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: 'hsl(var(--foreground))' }}>
                  Later this week
                </h2>
                <Card className="overflow-hidden w-full">
                  <CardContent className="p-0">
                    {visibleLaterCards.map((card, i) => renderLaterCard(card, i, visibleLaterCards.length))}

                    {/* View all button inside card */}
                    {laterCards.length > 3 && (
                      <div
                        className="px-6 py-4 border-t border-border flex justify-center cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setLaterExpanded(!laterExpanded)}
                      >
                        <span className="text-[14px] font-medium text-primary">
                          {laterExpanded ? 'Show less' : `View all ${laterCards.length}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ─── CTA BANNER FALLBACK (completed profile, no activity) ─── */}
        {allStepsCompleted && !hasAnyActivity && (
          <CtaBanner
            heading="Your health dashboard is ready"
            description="Book your first appointment to start tracking your health journey"
            buttonText="Book appointment"
            buttonHref="/booking"
            imageSrc="/assets/images/booking.png"
            imageAlt="Book appointment illustration"
          />
        )}

        {/* ─── DASHBOARD (partial onboarding) ─── */}
        {!allStepsCompleted && (
          <>
            {/* Up next - Upcoming appointments (if any) */}
            {upcomingAppointments.length > 0 && (
              <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: 'hsl(var(--foreground))' }}>
                    Up next
                  </h2>
                </div>
                <Card className="overflow-hidden w-full">
                  <CardContent className="p-0">
                    {upcomingAppointments.slice(0, 3).map((appt, i, arr) => (
                      <DashboardCard
                        key={`onboarding-appt-${appt.id}`}
                        type="appointment_upcoming"
                        title={appt.title}
                        subtitle={`${appt.date_formatted} · ${appt.patient_name}`}
                        iconOverride={appt.type === 'lab_test' ? FlaskConical : Stethoscope}
                        patientName={appt.patient_name}
                        patientInitials={appt.patient_initials}
                        actionLabel="View"
                        actionVariant="outline"
                        onAction={() => router.visit('/appointments')}
                        menuItems={[]}
                        isLast={i === arr.length - 1}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Profile completion steps */}
            <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="flex items-center gap-3">
                <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: 'hsl(var(--foreground))' }}>
                  Complete your profile
                </h2>
                <span className="text-[14px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                  {profileSteps.filter(s => s.completed).length} of {profileSteps.length} done
                </span>
              </div>
              <Card className="overflow-hidden w-full">
                <CardContent className="p-0">
                  {profileSteps.map((step, i) => (
                    <ProfileStepItem key={step.id} step={step} isLast={i === profileSteps.length - 1} />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Promotional vaccination banner */}
            {activePromotion && (
              <CtaBanner
                heading={activePromotion.title}
                description={activePromotion.description}
                buttonText={activePromotion.button_text}
                buttonHref={activePromotion.button_href}
                imageSrc={activePromotion.image_url}
                imageAlt={activePromotion.title}
                gradient={activePromotion.bg_gradient}
                onDismiss={() => handleDismissPromotion(activePromotion.id)}
              />
            )}
          </>
        )}
      </div>

      <Toast
        show={showToast}
        message={toastMessage}
        duration={4000}
        onHide={() => setShowToast(false)}
      />

      {/* Appointment Action Sheets */}
      <Sheet open={sheetView !== null} onOpenChange={(open) => !open && setSheetView(null)}>
        <SheetContent className="overflow-y-auto">
          {sheetView?.type === 'details' && (
            <DetailsSheet
              appointment={convertToFullAppointment(sheetView.appointment)}
              tab="upcoming"
              onAction={(view) => {
                if (view?.type === 'reschedule') {
                  setSheetView({ type: 'reschedule', appointment: sheetView.appointment });
                } else if (view?.type === 'cancel') {
                  setSheetView({ type: 'cancel', appointment: sheetView.appointment });
                } else {
                  setSheetView(null);
                }
              }}
            />
          )}
          {sheetView?.type === 'cancel' && (
            <CancelSheet
              appointment={convertToFullAppointment(sheetView.appointment)}
              onSuccess={() => {
                setSheetView(null);
                setToastMessage('Appointment cancelled. Refund initiated.');
                setShowToast(true);
                router.reload();
              }}
              onError={(msg) => {
                setToastMessage(msg);
                setShowToast(true);
              }}
              onClose={() => setSheetView(null)}
            />
          )}
          {sheetView?.type === 'reschedule' && (
            <RescheduleSheet
              appointment={convertToFullAppointment(sheetView.appointment)}
              onSuccess={() => {
                setSheetView(null);
                setToastMessage('Appointment rescheduled successfully.');
                setShowToast(true);
                router.reload();
              }}
              onError={(msg) => {
                setToastMessage(msg);
                setShowToast(true);
              }}
              onClose={() => setSheetView(null)}
            />
          )}
          {!sheetView && <SheetSkeleton />}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

// --- Helpers ---

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function generateICSFile(appt: UpcomingAppointment): void {
  // Format date and time for ICS (YYYYMMDDTHHMMSS)
  const formatICSDateTime = (dateStr: string, timeStr: string): string => {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = '00';

    return `${year}${month}${day}T${hour}${minute}${second}`;
  };

  // Calculate end time (1 hour after start)
  const calculateEndTime = (dateStr: string, timeStr: string): string => {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':');
    date.setHours(parseInt(hours, 10) + 1, parseInt(minutes, 10), 0, 0);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = '00';

    return `${year}${month}${day}T${hour}${minute}${second}`;
  };

  const dtStart = formatICSDateTime(appt.date_formatted, appt.time);
  const dtEnd = calculateEndTime(appt.date_formatted, appt.time);
  const location = appt.mode === 'Video' ? 'Video Appointment' : appt.subtitle;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Healthcare Platform//EN',
    'BEGIN:VEVENT',
    `UID:${appt.id}@healthcare-platform.com`,
    `DTSTAMP:${formatICSDateTime(new Date().toISOString().split('T')[0], new Date().toTimeString().split(' ')[0])}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${appt.title}`,
    `DESCRIPTION:${appt.subtitle}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  // Create blob and trigger download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `appointment-${appt.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- Profile Step Item ---

interface ProfileStepItemProps {
  step: ProfileStep;
  isLast: boolean;
}

function ProfileStepItem({ step, isLast }: ProfileStepItemProps) {
  const content = (
    <div
      className={`transition-colors duration-300 w-full ${step.completed ? '' : 'hover:bg-accent'}`}
      style={{
        backgroundColor: step.completed ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--background))',
        padding: '16px',
        borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      {step.completed ? (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '40px', height: '40px', borderRadius: '9999px',
            backgroundColor: 'hsl(var(--success) / 0.15)', animation: 'checkmark-pop 0.3s ease-out',
          }}
        >
          <Icon icon={Check} className="h-5 w-5" style={{ color: 'hsl(var(--success))' }} />
        </div>
      ) : (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: 'hsl(var(--muted))' }}
        >
          <span className="font-semibold" style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px', color: 'hsl(var(--muted-foreground))' }}>
            {step.number}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1 }}>
        <h3 className="text-[14px] font-semibold leading-5 text-foreground truncate">
          {step.title}
        </h3>
        <p className="text-[14px] font-normal leading-5 text-muted-foreground truncate">
          {step.subtitle}
        </p>
      </div>

      {!step.completed && (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: 'hsl(var(--secondary))', border: '1px solid hsl(var(--border))' }}
        >
          <Icon icon={ChevronRight} className="h-5 w-5" style={{ color: 'hsl(var(--foreground))' }} strokeWidth={1.25} />
        </div>
      )}
    </div>
  );

  if (step.href && !step.completed) {
    return (
      <Link href={step.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
