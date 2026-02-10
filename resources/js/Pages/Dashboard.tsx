import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Badge, type BadgeVariant } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { VStack, HStack } from '@/Components/ui/stack';
import {
  ChevronRight, AlertCircle, RefreshCw, Stethoscope, FlaskConical,
  Receipt, MoreHorizontal, Calendar, X, FileText, Clock, CreditCard, Loader2,
  Shield, RotateCcw, CheckCircle2, Syringe, Pill,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { getAvatarColor } from '@/Lib/avatar-colors';
import { useToast } from '@/Contexts/ToastContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
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
import { HealthProfileSheet } from './Dashboard/components/HealthProfileSheet';
import { AddInsuranceSheet } from '@/Components/Insurance/AddInsuranceSheet';
import EmbeddedFamilyMemberFlow from '@/Features/booking-chat/embedded/EmbeddedFamilyMemberFlow';

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

interface PrescriptionExpiring {
  id: number;
  title: string;
  doctor_name: string;
  patient_name: string;
  patient_initials: string;
  drugs: { name: string; days_remaining: number }[];
  record_date_formatted: string;
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
  prescriptionsExpiring?: PrescriptionExpiring[];

  // Onboarding sheet data
  selfMember?: {
    id: number;
    date_of_birth: string | null;
    blood_group: string | null;
    medical_conditions: string[];
    allergies: string[];
  } | null;
  insuranceProviders?: { id: number; name: string }[];
  onboardingFamilyMembers?: { id: number; name: string; relation: string }[];
}

// --- Skeleton Components ---

function Pulse({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ''}`} style={style} />;
}

function DashboardSkeleton() {
  return (
    <VStack gap={12} className="w-full max-w-content mx-auto">
      <HStack gap={3} align="start" className="w-full">
        <VStack gap={2} className="flex-1">
          <Pulse className="h-10 w-48" />
          <Pulse className="h-5 w-56" />
        </VStack>
        <Pulse className="h-12 w-60 rounded-full" />
      </HStack>

      <VStack gap={6} className="w-full">
        <HStack justify="between" align="center" className="w-full">
          <Pulse className="h-7 w-48" />
          <Pulse className="h-5 w-20" />
        </HStack>

        <Card className="overflow-hidden w-full">
          <CardContent className="p-0">
            {[0, 1, 2].map((i) => (
              <HStack
                key={i}
                gap={4}
                align="center"
                className={`w-full p-4 ${i < 2 ? 'border-b border-border' : ''}`}
              >
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
                <VStack gap={2} className="flex-1">
                  <Pulse className="h-5 w-44" />
                  <Pulse className="h-4 w-64" />
                </VStack>
                <Pulse className="h-10 w-10 rounded-full flex-shrink-0" />
              </HStack>
            ))}
          </CardContent>
        </Card>
      </VStack>

      <Pulse className="w-full rounded-3xl h-56" />
    </VStack>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full max-w-content mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon icon={AlertCircle} className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-label text-muted-foreground">Unable to load dashboard</p>
        <p className="text-body text-muted-foreground">Please check your connection and try again.</p>
        <Button variant="secondary" className="mt-2" onClick={onRetry}>
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
  | 'new_results_ready' | 'vaccination_due' | 'prescription_expiring';

interface DashboardCardProps {
  type: CardType;
  title: string;
  subtitle: string;
  patientName: string;
  patientInitials: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  actionLabel: string;
  actionVariant?: 'accent' | 'outline' | 'secondary';
  onAction: () => void;
  menuItems: { label: string; onClick: () => void; destructive?: boolean }[];
  isLast: boolean;
  iconOverride?: typeof Receipt;
  doctorName?: string;
  doctorAvatarUrl?: string;
}

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
}

const cardConfig: Record<CardType, { icon: typeof Receipt; iconBgClass: string; iconColorClass: string }> = {
  overdue_bill: { icon: Receipt, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  health_alert: { icon: AlertCircle, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  appointment_today: { icon: Stethoscope, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  appointment_upcoming: { icon: Calendar, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  payment_due_soon: { icon: CreditCard, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  emi_due: { icon: CreditCard, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  insurance_claim_update: { icon: Shield, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  followup_due: { icon: RotateCcw, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  pre_appointment_reminder: { icon: Calendar, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  new_results_ready: { icon: CheckCircle2, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  vaccination_due: { icon: Syringe, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
  prescription_expiring: { icon: Pill, iconBgClass: 'bg-blue-200', iconColorClass: 'text-blue-800' },
};

function DashboardCard({
  type, title, subtitle, patientName, patientInitials, badge, badgeVariant,
  actionLabel, actionVariant = 'secondary', onAction, menuItems, isLast, iconOverride,
  doctorName, doctorAvatarUrl,
}: DashboardCardProps) {
  const config = cardConfig[type];
  const CardIcon = iconOverride || config.icon;

  const isDoctorAppointment = (type === 'appointment_today' || type === 'appointment_upcoming' || type === 'pre_appointment_reminder') && doctorName && !iconOverride;

  const getInitials = (name: string) => {
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.slice(0, 2).toUpperCase() || 'D';
  };

  return (
    <HStack
      gap={3}
      align="start"
      className={`p-4 ${!isLast ? 'border-b border-border' : ''}`}
    >
      {/* Avatar for doctor appointments, Icon for everything else */}
      {isDoctorAppointment ? (
        <Avatar className="h-10 w-10 flex-shrink-0">
          {doctorAvatarUrl && (
            <AvatarImage src={doctorAvatarUrl} alt={doctorName} />
          )}
          <AvatarFallback
            className="text-body font-medium"
            style={(() => {
              const color = getAvatarColorByName(doctorName!);
              return { backgroundColor: color.bg, color: color.text };
            })()}
          >
            {getInitials(doctorName!)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className={`flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full ${config.iconBgClass}`}>
          <Icon icon={CardIcon} className={`h-5 w-5 ${config.iconColorClass}`} />
        </div>
      )}

      {/* Content */}
      <VStack gap={0.5} className="flex-1 min-w-0">
        {/* Patient + badge row */}
        <div className="flex items-center gap-2">
          <span className="text-label text-muted-foreground">{patientName}</span>
          {badge && (
            <Badge variant={badgeVariant || 'danger'} size="sm">
              {badge}
            </Badge>
          )}
        </div>
        {/* Title */}
        <h3
          className="text-card-title text-foreground truncate"
        >
          {title}
        </h3>
        {/* Subtitle */}
        <p className="text-body text-muted-foreground">{subtitle}</p>
      </VStack>

      {/* Action button */}
      <Button
        variant={actionVariant}
        size="md"
        className="flex-shrink-0"
        onClick={(e) => { e.stopPropagation(); onAction(); }}
      >
        {actionLabel}
      </Button>

      {/* Overflow menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            iconOnly
            size="md"
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
    </HStack>
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
  prescriptionsExpiring = [],
  selfMember,
  insuranceProviders = [],
  onboardingFamilyMembers = [],
}: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { showToast } = useToast();
  const [payingBillId, setPayingBillId] = useState<number | null>(null);
  const [upNextExpanded, setUpNextExpanded] = useState(false);

  // Show success toast on profile completion
  useEffect(() => {
    if (profileJustCompleted) {
      showToast('Profile successfully completed!', 'success');
    }
  }, [profileJustCompleted, showToast]);
  const [laterExpanded, setLaterExpanded] = useState(false);
  const mountTime = useRef(Date.now());

  // Profile checklist sheets
  type ProfileSheetType = 'health' | 'insurance' | 'family' | null;
  const [profileSheet, setProfileSheet] = useState<ProfileSheetType>(null);

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
    showToast('Alert dismissed', 'success');
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
        showToast('Payment successful!', 'success');
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
            showToast('Payment successful!', 'success');
            router.reload();
          }
        },
        modal: { ondismiss: () => setPayingBillId(null) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      showToast('Payment failed. Please try again.', 'error');
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
    prescriptionsExpiring.length > 0 ||
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
    ...prescriptionsExpiring.map((rx, i) => ({ type: 'prescription_expiring' as const, data: rx, index: i })),
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
            badgeVariant="danger"
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
            badgeVariant="info"
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
            badgeVariant="info"
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
            badgeVariant={
              claim.claim_status === 'rejected' || claim.claim_status === 'action_required'
                ? 'danger' : 'warning'
            }
            actionLabel="View claim"
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
            badgeVariant="warning"
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
      case 'prescription_expiring': {
        const rx = card.data as PrescriptionExpiring;
        const minDays = Math.min(...rx.drugs.map(d => d.days_remaining));
        return (
          <DashboardCard
            key={`rx-${rx.id}`}
            type="prescription_expiring"
            title={`Refill needed · ${rx.drugs.map(d => d.name).join(', ')}`}
            subtitle={`Prescribed by ${rx.doctor_name} · ${rx.record_date_formatted}`}
            patientName={rx.patient_name}
            patientInitials={rx.patient_initials}
            badge={minDays <= 1 ? 'Expires today' : `${minDays} days left`}
            badgeVariant={minDays <= 1 ? 'danger' : 'warning'}
            actionLabel="Book appointment"
            onAction={() => router.visit('/booking')}
            menuItems={[
              { label: 'View prescription', onClick: () => router.visit(`/health-records?record=${rx.id}`) },
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
            badgeVariant={followup.days_overdue >= 0 ? 'danger' : 'warning'}
            actionLabel="Book follow-up"
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
            badgeVariant="success"
            actionLabel="View results"
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
            iconOverride={appt.type === 'lab_test' ? FlaskConical : undefined}
            patientName={appt.patient_name}
            patientInitials={appt.patient_initials}
            badge={appt.mode === 'video' ? 'Video' : appt.type === 'lab_test' ? 'Lab Test' : undefined}
            badgeVariant={appt.mode === 'video' ? 'info' : appt.type === 'lab_test' ? 'warning' : undefined}
            actionLabel="View"
            onAction={() => setSheetView({ type: 'details', appointment: appt })}
            menuItems={[
              { label: 'Reschedule', onClick: () => setSheetView({ type: 'reschedule', appointment: appt }) },
              { label: 'Cancel appointment', onClick: () => setSheetView({ type: 'cancel', appointment: appt }), destructive: true },
              { label: 'Add to calendar', onClick: () => { generateICSFile(appt); showToast('Calendar file downloaded', 'success'); } },
            ]}
            isLast={isLast}
            doctorName={appt.type === 'doctor' ? appt.title : undefined}
            doctorAvatarUrl={undefined}
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
            badgeVariant="info"
            actionLabel="View details"
            actionVariant="secondary"
            onAction={() => router.visit(`/appointments/${reminder.appointment_id}`)}
            menuItems={[
              { label: 'Get directions', onClick: () => {} },
              { label: 'Reschedule', onClick: () => router.visit(`/appointments/${reminder.appointment_id}`) },
              { label: 'Cancel', onClick: () => router.visit(`/appointments/${reminder.appointment_id}`), destructive: true },
            ]}
            isLast={isLast}
            doctorName={reminder.title}
            doctorAvatarUrl={undefined}
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
            iconOverride={appt.type === 'lab_test' ? FlaskConical : undefined}
            patientName={appt.patient_name}
            patientInitials={appt.patient_initials}
            badge={appt.type === 'lab_test' ? 'Lab Test' : appt.mode === 'video' ? 'Video' : undefined}
            badgeVariant={appt.type === 'lab_test' ? 'warning' : appt.mode === 'video' ? 'info' : undefined}
            actionLabel="Reschedule"
            actionVariant="secondary"
            onAction={() => setSheetView({ type: 'reschedule', appointment: appt })}
            menuItems={[
              { label: 'View details', onClick: () => setSheetView({ type: 'details', appointment: appt }) },
              { label: 'Cancel appointment', onClick: () => setSheetView({ type: 'cancel', appointment: appt }), destructive: true },
              { label: 'Add to calendar', onClick: () => { generateICSFile(appt); showToast('Calendar file downloaded', 'success'); } },
            ]}
            isLast={isLast}
            doctorName={appt.type === 'doctor' ? appt.title : undefined}
            doctorAvatarUrl={undefined}
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
            badgeVariant="warning"
            actionLabel="Book follow-up"
            actionVariant="primary"
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
            badgeVariant={isPast ? 'danger' : 'warning'}
            actionLabel="Schedule"
            actionVariant="primary"
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
            badgeVariant={care.months_since !== null && care.months_since > 12 ? 'danger' : 'warning'}
            actionLabel="Book now"
            actionVariant="primary"
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

      <VStack gap={12} className="w-full max-w-content mx-auto">
        {/* Page Header */}
        <HStack gap={3} align="start" className="w-full">
          <VStack gap={1} className="flex-1">
            <h1 className="text-page-title text-foreground truncate">
              Hi, {firstName}
            </h1>
            <p className="text-body text-muted-foreground">
              {formattedDate}
            </p>
          </VStack>

          <HStack gap={2} align="center">
            <Link href="/booking" className={buttonVariants({ size: 'lg' })}>
              <img src="/assets/icons/appointment-2.svg" alt="" className="w-5 h-5" />
              Book appointment
            </Link>
          </HStack>
        </HStack>

        {/* ─── ACTIVE DASHBOARD (all steps completed) ─── */}
        {allStepsCompleted && hasAnyActivity && (
          <>
            {/* Up next section */}
            {hasUpNextItems && (
              <VStack gap={6} className="w-full">
                <h2 className="text-section-title text-foreground">
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
                        <span className="text-label text-primary">
                          {upNextExpanded ? 'Show less' : `View all ${upNextCards.length}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </VStack>
            )}

            {/* Later this week section */}
            {hasLaterItems && (
              <VStack gap={6} className="w-full">
                <h2 className="text-section-title text-foreground">
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
                        <span className="text-label text-primary">
                          {laterExpanded ? 'Show less' : `View all ${laterCards.length}`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </VStack>
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
              <VStack gap={6} className="w-full">
                <div className="flex items-center gap-3">
                  <h2 className="text-section-title text-foreground">
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
                        iconOverride={appt.type === 'lab_test' ? FlaskConical : undefined}
                        patientName={appt.patient_name}
                        patientInitials={appt.patient_initials}
                        actionLabel="View"
                        actionVariant="outline"
                        onAction={() => router.visit('/appointments')}
                        menuItems={[]}
                        isLast={i === arr.length - 1}
                        doctorName={appt.type === 'doctor' ? appt.title : undefined}
                        doctorAvatarUrl={undefined}
                      />
                    ))}
                  </CardContent>
                </Card>
              </VStack>
            )}

            {/* Profile completion steps */}
            <VStack gap={6} className="w-full">
              <div className="flex items-center gap-3">
                <h2 className="text-section-title text-foreground">
                  Complete your profile
                </h2>
                <Badge variant="neutral">
                  {profileSteps.filter(s => s.completed).length} of {profileSteps.length} done
                </Badge>
              </div>
              <Card className="overflow-hidden w-full">
                <CardContent className="p-0">
                  {profileSteps.map((step, i) => (
                    <ProfileStepItem
                      key={step.id}
                      step={step}
                      isLast={i === profileSteps.length - 1}
                      onClick={
                        !step.completed
                          ? () => {
                              if (step.id === 1) setProfileSheet('health');
                              else if (step.id === 2) setProfileSheet('insurance');
                              else if (step.id === 3) setProfileSheet('family');
                            }
                          : undefined
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            </VStack>

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
      </VStack>

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
                showToast('Appointment cancelled. Refund initiated.', 'success');
                router.reload();
              }}
              onError={(msg) => {
                showToast(msg, 'error');
              }}
              onClose={() => setSheetView(null)}
            />
          )}
          {sheetView?.type === 'reschedule' && (
            <RescheduleSheet
              appointment={convertToFullAppointment(sheetView.appointment)}
              onSuccess={() => {
                setSheetView(null);
                showToast('Appointment rescheduled successfully.', 'success');
                router.reload();
              }}
              onError={(msg) => {
                showToast(msg, 'error');
              }}
              onClose={() => setSheetView(null)}
            />
          )}
          {!sheetView && <SheetSkeleton />}
        </SheetContent>
      </Sheet>

      {/* Health Profile Sheet */}
      <Sheet open={profileSheet === 'health'} onOpenChange={(open) => !open && setProfileSheet(null)}>
        <SheetContent>
          <HealthProfileSheet
            selfMember={selfMember ?? null}
            onSuccess={() => { setProfileSheet(null); router.reload(); }}
          />
        </SheetContent>
      </Sheet>

      {/* Add Insurance Sheet */}
      <AddInsuranceSheet
        open={profileSheet === 'insurance'}
        onOpenChange={(open) => !open && setProfileSheet(null)}
        insuranceProviders={insuranceProviders}
        familyMembers={onboardingFamilyMembers}
        fromDashboard
        onSuccess={() => { setProfileSheet(null); router.reload(); }}
      />

      {/* Add Family Member Sheet */}
      <Sheet open={profileSheet === 'family'} onOpenChange={(open) => !open && setProfileSheet(null)}>
        <SheetContent>
          <EmbeddedFamilyMemberFlow
            mode="standalone"
            onComplete={() => { setProfileSheet(null); router.reload(); }}
            onCancel={() => { setProfileSheet(null); router.reload(); }}
          />
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
  onClick?: () => void;
}

function ProfileStepItem({ step, isLast, onClick }: ProfileStepItemProps) {
  const content = (
    <HStack
      gap={4}
      align="center"
      className={`transition-colors duration-300 w-full p-4 ${!isLast ? 'border-b border-border' : ''} ${step.completed ? '' : 'hover:bg-accent'}`}
      style={{ backgroundColor: step.completed ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--background))' }}
    >
      {step.completed ? (
        <div
          className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-success"
          style={{ animation: 'checkmark-pop 0.3s ease-out' }}
        >
          <Icon icon={CheckCircle2} className="h-5 w-5 text-white" />
        </div>
      ) : (
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-muted">
          <span className="text-card-title text-muted-foreground">
            {step.number}
          </span>
        </div>
      )}

      <VStack gap={0.5} className="flex-1">
        <h3 className="text-card-title text-foreground truncate">
          {step.title}
        </h3>
        <p className="text-body text-muted-foreground truncate">
          {step.subtitle}
        </p>
      </VStack>

      {!step.completed && (
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-secondary border border-border">
          <Icon icon={ChevronRight} className="h-5 w-5 text-foreground" strokeWidth={1.25} />
        </div>
      )}
    </HStack>
  );

  if (!step.completed && onClick) {
    return (
      <Button variant="ghost" className="block w-full text-left h-auto p-0 rounded-none" onClick={onClick}>
        {content}
      </Button>
    );
  }

  return content;
}
