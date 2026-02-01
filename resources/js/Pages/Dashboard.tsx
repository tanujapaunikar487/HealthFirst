import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
  ChevronRight, AlertCircle, RefreshCw, Check, Stethoscope, FlaskConical,
  Receipt, MoreHorizontal, Calendar, X, FileText, Clock, CreditCard, Loader2,
} from 'lucide-react';
import { Toast } from '@/Components/ui/toast';
import { CtaBanner } from '@/Components/ui/cta-banner';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from '@/Components/ui/dropdown-menu';

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
}

// --- Skeleton Components ---

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} style={style} />;
}

function DashboardSkeleton() {
  return (
    <div style={{ width: '738px', minHeight: '720px', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '48px' }}>
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

        <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
          <CardContent className="p-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '738px',
                  height: '96px',
                  padding: '20px',
                  borderBottom: i === 2 ? 'none' : '1px solid #E5E5E5',
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
    <div style={{ width: '738px', minHeight: '720px', padding: '40px 0' }}>
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <AlertCircle className="h-7 w-7 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">Unable to load dashboard</p>
        <p className="text-xs text-gray-400">Please check your connection and try again.</p>
        <Button variant="outline" className="mt-2 gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// --- Dashboard Card Component ---

type CardType = 'overdue_bill' | 'health_alert' | 'appointment_today' | 'appointment_upcoming';

interface DashboardCardProps {
  type: CardType;
  title: string;
  subtitle: string;
  patientName: string;
  patientInitials: string;
  badge?: string;
  badgeColor?: string;
  actionLabel: string;
  actionVariant?: 'default' | 'outline';
  onAction: () => void;
  menuItems: { label: string; onClick: () => void; destructive?: boolean }[];
  isLast: boolean;
  iconOverride?: typeof Receipt;
}

const cardConfig: Record<CardType, { icon: typeof Receipt; iconColor: string; iconBg: string }> = {
  overdue_bill: { icon: Receipt, iconColor: '#DC2626', iconBg: '#FEE2E2' },
  health_alert: { icon: AlertCircle, iconColor: '#D97706', iconBg: '#FEF3C7' },
  appointment_today: { icon: Stethoscope, iconColor: '#1E40AF', iconBg: '#BFDBFE' },
  appointment_upcoming: { icon: Calendar, iconColor: '#1E40AF', iconBg: '#BFDBFE' },
};

function DashboardCard({
  type, title, subtitle, patientName, patientInitials, badge, badgeColor,
  actionLabel, actionVariant = 'default', onAction, menuItems, isLast, iconOverride,
}: DashboardCardProps) {
  const config = cardConfig[type];
  const Icon = iconOverride || config.icon;

  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: isLast ? 'none' : '1px solid #E5E5E5',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: config.iconBg }}
      >
        <Icon className="h-5 w-5" style={{ color: config.iconColor }} />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1, minWidth: 0 }}>
        {/* Patient + badge row */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center flex-shrink-0 text-xs font-semibold"
            style={{
              width: '24px', height: '24px', borderRadius: '9999px',
              backgroundColor: '#EEF0F3', color: '#525252', fontSize: '10px',
            }}
          >
            {patientInitials}
          </div>
          <span className="text-xs font-medium" style={{ color: '#737373' }}>{patientName}</span>
          {badge && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: badgeColor ? `${badgeColor}15` : '#FEE2E2', color: badgeColor || '#DC2626', fontSize: '11px' }}
            >
              {badge}
            </span>
          )}
        </div>
        {/* Title */}
        <h3
          className="font-semibold"
          style={{ fontSize: '16px', fontWeight: 600, lineHeight: '24px', color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {title}
        </h3>
        {/* Subtitle */}
        <p className="text-xs font-medium" style={{ color: '#737373' }}>{subtitle}</p>
      </div>

      {/* Action button */}
      <Button
        size="sm"
        variant={actionVariant}
        className="flex-shrink-0 rounded-full text-xs h-8 px-4"
        onClick={(e) => { e.stopPropagation(); onAction(); }}
      >
        {actionLabel}
      </Button>

      {/* Overflow menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center flex-shrink-0 rounded-full hover:bg-gray-100 transition-colors"
            style={{ width: '32px', height: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" style={{ color: '#737373' }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {menuItems.map((item, i) => (
            <DropdownMenuItem
              key={i}
              onClick={item.onClick}
              className={item.destructive ? 'text-red-600 focus:text-red-600' : ''}
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
}: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showToast, setShowToast] = useState(profileJustCompleted);
  const [toastMessage, setToastMessage] = useState('Profile successfully completed!');
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
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

  // Razorpay payment for overdue bills
  const handleBillPayment = async (bill: OverdueBill) => {
    setPayingBillId(bill.id);
    try {
      const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
      const res = await fetch(`/billing/${bill.id}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
        body: JSON.stringify({ amount: bill.amount }),
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
  const firstName = user.patient?.first_name || user.name.split(' ')[0];
  const allStepsCompleted = profileSteps.every(step => step.completed);

  // Split appointments into today vs later
  const todayAppointments = upcomingAppointments.filter(a => a.is_today);
  const laterAppointments = upcomingAppointments.filter(a => !a.is_today);

  // Build "Up next" items: overdue bills + health alerts + today's appointments
  const hasUpNextItems = overdueBills.length > 0 || healthAlerts.length > 0 || todayAppointments.length > 0;
  const hasLaterItems = laterAppointments.length > 0 || preventiveCare.length > 0;
  const hasAnyActivity = hasUpNextItems || hasLaterItems;

  return (
    <AppLayout user={user}>
      <Head title="Dashboard" />

      <div style={{ width: '738px', minHeight: '720px', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '68px', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '485px', height: '68px', gap: '4px', flexGrow: 1 }}>
            <h1 className="font-bold" style={{ fontSize: '36px', lineHeight: '44px', letterSpacing: '-1px', color: '#171717', margin: 0, width: '384px', height: '44px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Hi, {firstName}
            </h1>
            <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0px', color: '#737373', margin: 0, width: '100%', height: '20px', display: 'flex', alignItems: 'center' }}>
              {formattedDate}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <Button
              asChild
              className="h-12 font-semibold text-white rounded-full"
              style={{ width: '241px', height: '48px', backgroundColor: '#0052FF', fontSize: '16px', fontWeight: 600, lineHeight: '24px', paddingLeft: '32px', paddingRight: '32px', gap: '8px' }}
            >
              <Link href="/booking">
                <span className="flex items-center gap-2 text-white">
                  <img src="/assets/icons/appointment-2.svg" alt="Appointment" className="h-6 w-6" />
                  Book Appointment
                </span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ─── ACTIVE DASHBOARD (all steps completed) ─── */}
        {allStepsCompleted && hasAnyActivity && (
          <>
            {/* Up next section */}
            {hasUpNextItems && (
              <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#171717' }}>
                      Up next
                    </h2>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#EEF0F3', color: '#525252' }}
                    >
                      {overdueBills.length + healthAlerts.length + todayAppointments.length}
                    </span>
                  </div>
                  <Link
                    href={overdueBills.length > 0 ? '/billing' : healthAlerts.length > 0 ? '/health-records' : '/appointments'}
                    className="text-sm font-medium"
                    style={{ color: '#0052FF' }}
                  >
                    View all
                  </Link>
                </div>

                <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                  <CardContent className="p-0">
                    {/* Overdue bills (highest priority) */}
                    {overdueBills.map((bill, i) => (
                      <DashboardCard
                        key={`bill-${bill.id}`}
                        type="overdue_bill"
                        title={bill.title}
                        subtitle={`₹${bill.amount.toLocaleString('en-IN')} overdue`}
                        patientName={bill.patient_name}
                        patientInitials={bill.patient_initials}
                        badge={`${bill.days_overdue}d overdue`}
                        badgeColor="#DC2626"
                        actionLabel={payingBillId === bill.id ? 'Paying...' : 'Pay'}
                        onAction={() => handleBillPayment(bill)}
                        menuItems={[
                          { label: 'View bill', onClick: () => router.visit(`/billing/${bill.id}`) },
                          { label: 'Payment history', onClick: () => router.visit(`/billing`) },
                          { label: 'Dispute', onClick: () => router.visit(`/billing/${bill.id}`) },
                        ]}
                        isLast={i === overdueBills.length - 1 && healthAlerts.length === 0 && todayAppointments.length === 0}
                      />
                    ))}

                    {/* Health alerts (high priority) */}
                    {healthAlerts.map((alert, i) => (
                      <DashboardCard
                        key={`alert-${alert.id}`}
                        type="health_alert"
                        title={alert.title}
                        subtitle={`${alert.metric_name}: ${alert.metric_value} (ref: ${alert.metric_reference})`}
                        patientName={alert.patient_name}
                        patientInitials={alert.patient_initials}
                        badge="Needs attention"
                        badgeColor="#D97706"
                        actionLabel="Book"
                        onAction={() => router.visit('/booking')}
                        menuItems={[
                          { label: 'View full report', onClick: () => router.visit(`/health-records`) },
                          { label: 'Dismiss alert', onClick: () => {} },
                        ]}
                        isLast={i === healthAlerts.length - 1 && todayAppointments.length === 0}
                      />
                    ))}

                    {/* Today's appointments */}
                    {todayAppointments.map((appt, i) => (
                      <DashboardCard
                        key={`today-${appt.id}`}
                        type="appointment_today"
                        title={appt.title}
                        subtitle={`Today · ${appt.time ? formatTime(appt.time) : ''} · ${appt.subtitle}`}
                        iconOverride={appt.type === 'lab_test' ? FlaskConical : Stethoscope}
                        patientName={appt.patient_name}
                        patientInitials={appt.patient_initials}
                        badge={appt.type === 'lab_test' ? 'Lab Test' : appt.mode === 'video' ? 'Video' : undefined}
                        badgeColor={appt.type === 'lab_test' ? '#D97706' : appt.mode === 'video' ? '#1E40AF' : undefined}
                        actionLabel="Reschedule"
                        actionVariant="outline"
                        onAction={() => router.visit('/appointments')}
                        menuItems={[
                          { label: 'View details', onClick: () => router.visit(`/appointments/${appt.id}`) },
                          { label: 'Cancel appointment', onClick: () => router.visit('/appointments'), destructive: true },
                          { label: 'Add to calendar', onClick: () => {} },
                        ]}
                        isLast={i === todayAppointments.length - 1}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Later this week section */}
            {hasLaterItems && (
              <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#171717' }}>
                    Later this week
                  </h2>
                  <Link href="/appointments" className="text-sm font-medium" style={{ color: '#0052FF' }}>
                    View all
                  </Link>
                </div>

                <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                  <CardContent className="p-0">
                    {laterAppointments.map((appt, i) => (
                      <DashboardCard
                        key={`later-${appt.id}`}
                        type="appointment_upcoming"
                        title={appt.title}
                        subtitle={`${appt.date_formatted} · ${appt.time ? formatTime(appt.time) : ''} · ${appt.subtitle}`}
                        iconOverride={appt.type === 'lab_test' ? FlaskConical : Calendar}
                        patientName={appt.patient_name}
                        patientInitials={appt.patient_initials}
                        badge={appt.type === 'lab_test' ? 'Lab Test' : appt.mode === 'video' ? 'Video' : undefined}
                        badgeColor={appt.type === 'lab_test' ? '#D97706' : appt.mode === 'video' ? '#1E40AF' : undefined}
                        actionLabel="Reschedule"
                        actionVariant="outline"
                        onAction={() => router.visit('/appointments')}
                        menuItems={[
                          { label: 'View details', onClick: () => router.visit(`/appointments/${appt.id}`) },
                          { label: 'Cancel appointment', onClick: () => router.visit('/appointments'), destructive: true },
                          { label: 'Add to calendar', onClick: () => {} },
                        ]}
                        isLast={i === laterAppointments.length - 1 && preventiveCare.length === 0}
                      />
                    ))}

                    {/* Preventive care prompts */}
                    {preventiveCare.map((care, i) => (
                      <DashboardCard
                        key={`care-${care.id}`}
                        type="appointment_upcoming"
                        title="Annual checkup due"
                        subtitle={care.months_since !== null ? `Last checkup ${care.months_since} months ago` : 'No recent checkup'}
                        iconOverride={Clock}
                        patientName={care.patient_name}
                        patientInitials={care.patient_initials}
                        actionLabel="Book"
                        onAction={() => router.visit('/booking')}
                        menuItems={[
                          { label: 'View records', onClick: () => router.visit('/health-records') },
                          { label: 'Dismiss', onClick: () => {} },
                        ]}
                        isLast={i === preventiveCare.length - 1}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* ─── CTA BANNER FALLBACK (completed profile, no activity) ─── */}
        {allStepsCompleted && !hasAnyActivity && (
          <CtaBanner
            heading="Book your first appointment"
            description="Find doctors, book appointments, and manage your family's health — all in one place."
            buttonText="Book Appointment"
            buttonHref="/booking"
            imageSrc="/assets/images/booking.png"
            imageAlt="Booking illustration"
          />
        )}

        {/* ─── INCOMPLETE PROFILE ─── */}
        {!allStepsCompleted && (
          <>
            {/* Up next appointments (shown when profile incomplete) */}
            {upcomingAppointments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
                <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#171717' }}>
                  Up next
                </h2>
                <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                  <CardContent className="p-0">
                    {upcomingAppointments.map((appt, index) => (
                      <Link key={appt.id} href="/appointments" className="block">
                        <div
                          className="transition-colors hover:bg-[#F7F8F9]"
                          style={{
                            width: '738px',
                            height: '96px',
                            backgroundColor: '#FFFFFF',
                            padding: '20px',
                            borderBottom: index === upcomingAppointments.length - 1 ? 'none' : '1px solid #E5E5E5',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#BFDBFE' }}
                          >
                            {appt.type === 'doctor' ? (
                              <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
                            ) : (
                              <FlaskConical className="h-5 w-5" style={{ color: '#1E40AF' }} />
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                            <h3 className="font-semibold" style={{ fontSize: '18px', fontWeight: 600, lineHeight: '28px', color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {appt.title}
                            </h3>
                            <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', color: '#737373' }}>
                              {appt.date_formatted} · {appt.patient_name}
                            </p>
                          </div>
                          <div
                            className="flex items-center justify-center flex-shrink-0"
                            style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#EEF0F3', border: '1px solid #DEE1E7' }}
                          >
                            <ChevronRight className="h-5 w-5" style={{ color: '#00184D', strokeWidth: 1.25 }} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Complete your profile */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '738px', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '738px', height: '28px' }}>
                <h2 className="font-semibold" style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#171717' }}>
                  Complete your profile
                </h2>
                <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', color: '#737373' }}>
                  {profileSteps.filter(step => step.completed).length} of {profileSteps.length} done
                </p>
              </div>

              <Card style={{ width: '738px', borderRadius: '24px', border: '1px solid #E5E5E5', overflow: 'hidden' }}>
                <CardContent className="p-0">
                  {profileSteps.map((step, index) => (
                    <ProfileStepItem
                      key={step.id}
                      step={step}
                      isLast={index === profileSteps.length - 1}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>

          </>
        )}

        {/* ─── PROMOTIONAL BANNER (dynamic, dismissible) ─── */}
        {activePromotion && (
          <div style={{ width: '738px', height: '216px', borderRadius: '24px', background: activePromotion.bg_gradient, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px', position: 'relative', overflow: 'hidden' }}>
            {/* Dismiss button */}
            <button
              onClick={() => handleDismissPromotion(activePromotion.id)}
              className="flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              style={{ position: 'absolute', top: '16px', right: '16px', width: '32px', height: '32px', zIndex: 20, background: 'rgba(255,255,255,0.15)' }}
            >
              <X className="h-4 w-4" style={{ color: '#FFFFFF' }} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px', flexGrow: 1, zIndex: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '450px' }}>
                <h2 className="font-semibold" style={{ fontSize: '24px', fontWeight: 600, lineHeight: '32px', letterSpacing: '-0.5px', color: '#FFFFFF', margin: 0 }}>
                  {activePromotion.title}
                </h2>
                <p className="font-medium" style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px', letterSpacing: '0px', color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                  {activePromotion.description}
                </p>
              </div>
              <Button
                asChild
                className="font-semibold rounded-full"
                style={{ width: 'fit-content', height: '48px', backgroundColor: '#FFFFFF', color: '#00184D', fontSize: '16px', fontWeight: 600, lineHeight: '24px', paddingLeft: '24px', paddingRight: '24px', border: 'none', whiteSpace: 'nowrap' }}
              >
                <Link href={activePromotion.button_href}>{activePromotion.button_text}</Link>
              </Button>
            </div>
            {activePromotion.image_url && (
              <div style={{ width: '220px', height: '216px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <img
                  src={activePromotion.image_url}
                  alt={activePromotion.title}
                  style={{ width: '700px', height: '700px', position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', objectFit: 'contain' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Toast
        show={showToast}
        message={toastMessage}
        duration={4000}
        onHide={() => setShowToast(false)}
      />
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

// --- Profile Step Item ---

interface ProfileStepItemProps {
  step: ProfileStep;
  isLast: boolean;
}

function ProfileStepItem({ step, isLast }: ProfileStepItemProps) {
  const content = (
    <div
      className={`transition-colors duration-300 ${step.completed ? '' : 'hover:bg-[#F7F8F9]'}`}
      style={{
        width: '738px',
        height: '96px',
        backgroundColor: step.completed ? '#F0FDF4' : '#FFFFFF',
        padding: '20px',
        borderBottom: isLast ? 'none' : '1px solid #E5E5E5',
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
            backgroundColor: '#DCFCE7', animation: 'checkmark-pop 0.3s ease-out',
          }}
        >
          <Check className="h-5 w-5" style={{ color: '#16A34A' }} />
        </div>
      ) : (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#EEF0F3' }}
        >
          <span className="font-semibold" style={{ fontSize: '14px', fontWeight: 600, lineHeight: '22px', color: '#737373' }}>
            {step.number}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, height: '56px' }}>
        <h3 className="font-semibold" style={{ fontSize: '18px', fontWeight: 600, lineHeight: '28px', color: '#171717', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.title}
        </h3>
        <p className="font-medium" style={{ fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#737373', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {step.subtitle}
        </p>
      </div>

      {!step.completed && (
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#EEF0F3', border: '1px solid #DEE1E7' }}
        >
          <ChevronRight className="h-5 w-5" style={{ color: '#00184D', strokeWidth: 1.25 }} />
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
