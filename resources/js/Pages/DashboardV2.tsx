import { Head, Link } from '@inertiajs/react';
import { useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { buttonVariants } from '@/Components/ui/button';
import { Badge, type BadgeVariant } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { VStack, HStack } from '@/Components/ui/stack';
import { Icon } from '@/Components/ui/icon';
import { IconCircle, type IconCircleVariant } from '@/Components/ui/icon-circle';
import { cn } from '@/Lib/utils';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Syringe,
  TestTube2,
  Users,
  Video,
  MapPin,
  CalendarClock,
} from '@/Lib/icons';

/**
 * Dashboard — version 2
 *
 * Same data as Dashboard.tsx, arranged around two questions:
 * "What's next?" (the next appointment, front and centre) and
 * "What needs me?" (every action item merged into one prioritised list).
 */

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
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
  mode?: string | null;
  fee?: number | null;
  is_today: boolean;
}

type AnyItem = Record<string, any>;

interface DashboardV2Props {
  user?: User;
  profileSteps?: ProfileStep[];
  upcomingAppointments?: UpcomingAppointment[];
  overdueBills?: AnyItem[];
  healthAlerts?: AnyItem[];
  preventiveCare?: AnyItem[];
  paymentsDueSoon?: AnyItem[];
  emisDue?: AnyItem[];
  insuranceClaimUpdates?: AnyItem[];
  followUpsDue?: AnyItem[];
  preAppointmentReminders?: AnyItem[];
  newResultsReady?: AnyItem[];
  vaccinationsDue?: AnyItem[];
  prescriptionsExpiring?: AnyItem[];
}

interface AttentionItem {
  key: string;
  priority: number; // lower = more urgent
  icon: React.ComponentType;
  iconVariant: IconCircleVariant;
  title: string;
  description: string;
  patient: string;
  badge: { label: string; variant: BadgeVariant };
  href: string;
}

const rupees = (value: unknown) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN')}`;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildAttentionItems(p: DashboardV2Props): AttentionItem[] {
  const items: AttentionItem[] = [];

  (p.overdueBills ?? []).forEach((b) =>
    items.push({
      key: `overdue-${b.id}`,
      priority: 0,
      icon: Receipt,
      iconVariant: 'destructive',
      title: `Pay ${rupees(b.amount)} for ${b.title}`,
      description: `${b.days_overdue} days overdue`,
      patient: b.patient_name,
      badge: { label: 'Overdue', variant: 'danger' },
      href: `/billing/${b.id}`,
    }),
  );

  (p.healthAlerts ?? []).forEach((a) =>
    items.push({
      key: `alert-${a.id}`,
      priority: 1,
      icon: FlaskConical,
      iconVariant: 'warning',
      title: `${a.metric_name} is out of range`,
      description: `${a.metric_value} (normal ${a.metric_reference}) · ${a.title}`,
      patient: a.patient_name,
      badge: { label: 'Review', variant: 'warning' },
      href: `/health-records/${a.id}`,
    }),
  );

  (p.preAppointmentReminders ?? []).forEach((r) =>
    items.push({
      key: `pre-${r.id}`,
      priority: 1,
      icon: CalendarClock,
      iconVariant: 'info',
      title: `${r.title} in ${r.hours_until} hours`,
      description: [r.subtitle, r.time].filter(Boolean).join(' · '),
      patient: r.patient_name,
      badge: { label: 'Soon', variant: 'info' },
      href: `/appointments/${r.appointment_id}`,
    }),
  );

  (p.paymentsDueSoon ?? []).forEach((b) =>
    items.push({
      key: `due-${b.id}`,
      priority: 2,
      icon: CreditCard,
      iconVariant: 'warning',
      title: `Pay ${rupees(b.amount)} for ${b.title}`,
      description: `Due in ${b.days_until_due} days`,
      patient: b.patient_name,
      badge: { label: 'Due soon', variant: 'warning' },
      href: `/billing/${b.id}`,
    }),
  );

  (p.emisDue ?? []).forEach((e) =>
    items.push({
      key: `emi-${e.id}`,
      priority: 2,
      icon: CreditCard,
      iconVariant: 'warning',
      title: `EMI ${e.current_installment} of ${e.total_installments}: ${rupees(e.emi_amount)}`,
      description: `Due ${e.due_date}`,
      patient: e.patient_name,
      badge: { label: 'EMI', variant: 'warning' },
      href: `/billing/${e.id}`,
    }),
  );

  (p.prescriptionsExpiring ?? []).forEach((r) => {
    const first = r.drugs?.[0];
    items.push({
      key: `rx-${r.id}`,
      priority: 2,
      icon: Pill,
      iconVariant: 'warning',
      title: first
        ? `${first.name} runs out in ${first.days_remaining} days`
        : r.title,
      description:
        r.drugs?.length > 1
          ? `and ${r.drugs.length - 1} more · ${r.doctor_name ?? ''}`
          : r.doctor_name ?? '',
      patient: r.patient_name,
      badge: { label: 'Refill', variant: 'warning' },
      href: `/health-records/${r.id}`,
    });
  });

  (p.followUpsDue ?? []).forEach((f) =>
    items.push({
      key: `fu-${f.id}`,
      priority: 3,
      icon: Stethoscope,
      iconVariant: 'primary',
      title: `Follow-up with ${f.doctor_name}`,
      description:
        f.days_overdue > 0
          ? `Recommended ${f.days_overdue} days ago`
          : `Recommended by ${f.recommended_date}`,
      patient: f.patient_name,
      badge: { label: 'Follow-up', variant: 'info' },
      href: `/appointments/${f.original_appointment_id}`,
    }),
  );

  (p.newResultsReady ?? []).forEach((r) =>
    items.push({
      key: `res-${r.id}`,
      priority: 3,
      icon: TestTube2,
      iconVariant: 'success',
      title: `${r.test_name} results are ready`,
      description: `Uploaded ${r.uploaded_date}`,
      patient: r.patient_name,
      badge: { label: 'New', variant: 'success' },
      href: `/health-records/${r.record_id}`,
    }),
  );

  (p.insuranceClaimUpdates ?? []).forEach((c) =>
    items.push({
      key: `claim-${c.id}`,
      priority: c.claim_status === 'action_required' ? 1 : 3,
      icon: ShieldCheck,
      iconVariant: c.claim_status === 'rejected' ? 'destructive' : 'info',
      title: `Claim for ${c.treatment}`,
      description: `${rupees(c.claim_amount)} · ${String(c.claim_status).replace('_', ' ')}`,
      patient: c.patient_name,
      badge: {
        label:
          c.claim_status === 'approved'
            ? 'Approved'
            : c.claim_status === 'rejected'
              ? 'Rejected'
              : c.claim_status === 'action_required'
                ? 'Action needed'
                : 'Pending',
        variant:
          c.claim_status === 'approved'
            ? 'success'
            : c.claim_status === 'rejected'
              ? 'danger'
              : c.claim_status === 'action_required'
                ? 'warning'
                : 'neutral',
      },
      href: `/insurance/claims/${c.claim_id}`,
    }),
  );

  (p.vaccinationsDue ?? []).forEach((v) =>
    items.push({
      key: `vac-${v.id}-${v.vaccine_name}`,
      priority: 3,
      icon: Syringe,
      iconVariant: 'primary',
      title: `${v.vaccine_name} vaccine due`,
      description: [v.age_requirement, `by ${v.due_date}`].filter(Boolean).join(' · '),
      patient: v.patient_name,
      badge: { label: 'Vaccine', variant: 'info' },
      href: `/family-members/${v.id}`,
    }),
  );

  (p.preventiveCare ?? []).forEach((c) =>
    items.push({
      key: `prev-${c.id}`,
      priority: 4,
      icon: HeartPulse,
      iconVariant: 'muted',
      title: 'Time for a routine check-up',
      description:
        c.months_since === null
          ? 'No visit on record yet'
          : `Last visit ${c.months_since} months ago`,
      patient: c.patient_name,
      badge: { label: 'Check-up', variant: 'neutral' },
      href: '/booking/doctor/patient',
    }),
  );

  return items.sort((a, b) => a.priority - b.priority);
}

export default function DashboardV2(props: DashboardV2Props) {
  const {
    user,
    profileSteps = [],
    upcomingAppointments = [],
  } = props;

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const attention = useMemo(() => buildAttentionItems(props), [props]);
  const [next, ...later] = upcomingAppointments;
  const stepsDone = profileSteps.filter((s) => s.completed).length;
  const setupIncomplete = profileSteps.length > 0 && stepsDone < profileSteps.length;

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <AppLayout pageTitle="Home" pageIcon="home">
      <Head title="Home" />

      <VStack gap={8} className="w-full max-w-page min-w-0">
        {/* Greeting + primary actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <VStack gap={1} className="min-w-0">
            <p className="text-body text-muted-foreground">{today}</p>
            <h1 className="text-page-title text-foreground break-words">
              {greeting()}, {firstName}
            </h1>
          </VStack>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/booking/doctor/patient"
              className={cn(buttonVariants({ size: 'md' }), 'flex-1 md:flex-none')}
            >
              <Icon icon={Stethoscope} size={18} />
              Book a doctor
            </Link>
            <Link
              href="/booking/lab/patient"
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'md' }),
                'flex-1 md:flex-none',
              )}
            >
              <Icon icon={TestTube2} size={18} />
              Book a lab test
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <VStack gap={6} className="min-w-0 lg:col-span-2">
            <NextUpCard appointment={next} />
            <AttentionList items={attention} />
          </VStack>

          {/* Side column */}
          <VStack gap={6} className="min-w-0">
            {setupIncomplete && (
              <SetupCard steps={profileSteps} done={stepsDone} />
            )}
            <LaterList appointments={later} />
            <QuickLinks />
          </VStack>
        </div>
      </VStack>
    </AppLayout>
  );
}

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <HStack justify="between" align="center" className="gap-3">
      <h2 className="text-section-title text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="text-label text-primary hover:underline whitespace-nowrap">
          {linkLabel ?? 'See all'}
        </Link>
      )}
    </HStack>
  );
}

function NextUpCard({ appointment }: { appointment?: UpcomingAppointment }) {
  if (!appointment) {
    return (
      <Card className="p-6">
        <HStack gap={4} align="center" className="flex-wrap">
          <IconCircle icon={Calendar} size="lg" variant="muted" />
          <VStack gap={1} className="flex-1 min-w-0">
            <p className="text-card-title text-foreground">Nothing booked yet</p>
            <p className="text-body text-muted-foreground">
              Your next appointment will show up here.
            </p>
          </VStack>
          <Link
            href="/booking"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            Book with AI
          </Link>
        </HStack>
      </Card>
    );
  }

  const isVideo = appointment.mode === 'video';
  const isLab = appointment.type !== 'doctor';

  return (
    <VStack gap={3}>
      <SectionTitle title="Up next" href="/appointments" linkLabel="All appointments" />
      <Card className="p-6 border-primary/30 bg-primary/5">
        <VStack gap={5}>
          <HStack gap={4} align="start">
            <IconCircle
              icon={isLab ? TestTube2 : Stethoscope}
              size="lg"
              variant="primary"
            />
            <VStack gap={1} className="flex-1 min-w-0">
              <HStack gap={2} align="center" className="flex-wrap">
                <p className="text-detail-title text-foreground break-words">
                  {appointment.title}
                </p>
                {appointment.is_today && <Badge variant="info">Today</Badge>}
              </HStack>
              <p className="text-body text-muted-foreground break-words">
                {appointment.subtitle} · for {appointment.patient_name}
              </p>
            </VStack>
          </HStack>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-body text-foreground">
            <HStack gap={2} align="center">
              <Icon icon={Calendar} size={16} className="text-muted-foreground" />
              {appointment.date_formatted}
            </HStack>
            {appointment.time && (
              <HStack gap={2} align="center">
                <Icon icon={Clock} size={16} className="text-muted-foreground" />
                {appointment.time}
              </HStack>
            )}
            <HStack gap={2} align="center">
              <Icon
                icon={isVideo ? Video : MapPin}
                size={16}
                className="text-muted-foreground"
              />
              {isVideo ? 'Video call' : isLab ? appointment.subtitle : 'In person'}
            </HStack>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/appointments/${appointment.id}`}
              className={buttonVariants({ size: 'sm' })}
            >
              View details
            </Link>
            <Link
              href={`/appointments/${appointment.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              Reschedule
            </Link>
          </div>
        </VStack>
      </Card>
    </VStack>
  );
}

function AttentionList({ items }: { items: AttentionItem[] }) {
  return (
    <VStack gap={3}>
      <HStack gap={2} align="center">
        <h2 className="text-section-title text-foreground">Needs your attention</h2>
        {items.length > 0 && <Badge variant="neutral">{items.length}</Badge>}
      </HStack>

      {items.length === 0 ? (
        <Card className="p-6">
          <HStack gap={4} align="center">
            <IconCircle icon={CheckCircle2} size="md" variant="success" />
            <VStack gap={1} className="min-w-0">
              <p className="text-card-title text-foreground">You're all caught up</p>
              <p className="text-body text-muted-foreground">
                Bills, results and reminders will appear here when they need you.
              </p>
            </VStack>
          </HStack>
        </Card>
      ) : (
        <Card className="divide-y divide-border">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              <IconCircle icon={item.icon} size="sm" variant={item.iconVariant} />
              <VStack gap={0.5} className="flex-1 min-w-0">
                <p className="text-card-title text-foreground break-words">{item.title}</p>
                <p className="text-body text-muted-foreground break-words">
                  {item.patient} · {item.description}
                </p>
              </VStack>
              <Badge variant={item.badge.variant} className="hidden sm:inline-flex">
                {item.badge.label}
              </Badge>
              <Icon icon={ChevronRight} size={18} className="text-muted-foreground flex-shrink-0" />
            </Link>
          ))}
        </Card>
      )}
    </VStack>
  );
}

function SetupCard({ steps, done }: { steps: ProfileStep[]; done: number }) {
  return (
    <Card className="p-6">
      <VStack gap={4}>
        <VStack gap={1}>
          <p className="text-card-title text-foreground">Finish setting up</p>
          <p className="text-body text-muted-foreground">
            {done} of {steps.length} done
          </p>
        </VStack>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </div>
        <VStack gap={1}>
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href ?? '#'}
              className="flex items-center gap-3 rounded-2xl py-2 hover:bg-muted/50 transition-colors"
            >
              {step.completed ? (
                <Icon icon={CheckCircle2} size={20} className="text-success flex-shrink-0" />
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-border flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-body flex-1 min-w-0',
                  step.completed ? 'text-muted-foreground line-through' : 'text-foreground',
                )}
              >
                {step.title}
              </span>
            </Link>
          ))}
        </VStack>
      </VStack>
    </Card>
  );
}

function LaterList({ appointments }: { appointments: UpcomingAppointment[] }) {
  if (appointments.length === 0) return null;

  return (
    <VStack gap={3}>
      <SectionTitle title="Later" href="/appointments" />
      <Card className="divide-y divide-border">
        {appointments.slice(0, 4).map((a) => (
          <Link
            key={a.id}
            href={`/appointments/${a.id}`}
            className="flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <VStack align="center" className="w-12 flex-shrink-0">
              <span className="text-caption text-muted-foreground">
                {a.date_formatted.split(',')[0]}
              </span>
              <span className="text-card-title text-foreground">
                {a.date_formatted.split(' ')[1]}
              </span>
            </VStack>
            <VStack gap={0.5} className="flex-1 min-w-0">
              <p className="text-label text-foreground truncate">{a.title}</p>
              <p className="text-caption text-muted-foreground truncate">
                {a.time} · {a.patient_name}
              </p>
            </VStack>
          </Link>
        ))}
      </Card>
    </VStack>
  );
}

function QuickLinks() {
  const links = [
    { href: '/health-records', label: 'Records', icon: FileText },
    { href: '/insurance', label: 'Insurance', icon: ShieldCheck },
    { href: '/billing', label: 'Billing', icon: Receipt },
    { href: '/family-members', label: 'Family', icon: Users },
  ];

  return (
    <VStack gap={3}>
      <SectionTitle title="Shortcuts" />
      <div className="grid grid-cols-2 gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex flex-col items-start gap-3 rounded-3xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
          >
            <IconCircle icon={l.icon} size="sm" variant="primary" />
            <span className="text-label text-foreground">{l.label}</span>
          </Link>
        ))}
      </div>
    </VStack>
  );
}
