import { useState, useMemo, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
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
  CalendarClock,
  Share2,
  XCircle,
  RotateCcw,
  CalendarPlus,
  Copy,
  Calendar,
  AlertTriangle,
  Check,
  User,
  Stethoscope,
  TestTube2,
  Search,
} from 'lucide-react';

/* ─── Types ─── */

interface Appointment {
  id: number;
  type: 'doctor' | 'lab_test';
  title: string;
  subtitle: string;
  patient_name: string;
  patient_id: number | null;
  doctor_id: number | null;
  date: string;
  date_formatted: string;
  time: string;
  status: string;
  fee: number;
  payment_status: string;
  mode: string;
  is_upcoming: boolean;
}

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
}

interface DoctorOption {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
}

interface Props {
  user: User;
  appointments: Appointment[];
  familyMembers: FamilyMember[];
  doctors: DoctorOption[];
}

interface DateOption {
  date: string;
  display: string;
  is_today: boolean;
}

interface SlotOption {
  time: string;
  display: string;
}

type SheetView =
  | { type: 'details'; appointment: Appointment }
  | { type: 'cancel'; appointment: Appointment }
  | { type: 'reschedule'; appointment: Appointment }
  | { type: 'share'; appointment: Appointment }
  | null;

/* ─── Page ─── */

export default function Index({ user, appointments, familyMembers, doctors }: Props) {
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetView, setSheetView] = useState<SheetView>(null);
  const [toastMessage, setToastMessage] = useState('');

  const categorized = useMemo(() => {
    const upcoming = appointments.filter((a) => a.is_upcoming);
    const past = appointments.filter((a) => !a.is_upcoming && a.status !== 'cancelled');
    const cancelled = appointments.filter((a) => a.status === 'cancelled');
    return { upcoming, past, cancelled };
  }, [appointments]);

  const applyFilters = (list: Appointment[]) => {
    let filtered = list;
    if (doctorFilter !== 'all') {
      filtered = filtered.filter((a) => String(a.doctor_id) === doctorFilter);
    }
    if (memberFilter !== 'all') {
      filtered = filtered.filter((a) => String(a.patient_id) === memberFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.patient_name.toLowerCase().includes(q) ||
          a.subtitle.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const getTab = (appt: Appointment): 'upcoming' | 'past' | 'cancelled' => {
    if (appt.status === 'cancelled') return 'cancelled';
    if (appt.is_upcoming) return 'upcoming';
    return 'past';
  };

  const handleSheetSuccess = (message: string) => {
    setSheetView(null);
    setToastMessage(message);
  };

  const handleSheetError = (message: string) => {
    setToastMessage(message);
  };

  return (
    <AppLayout
      user={user}
      pageTitle="Appointments"
      pageIcon="/assets/icons/appointment-selected.svg"
    >
      <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="font-bold"
            style={{
              fontSize: '36px',
              lineHeight: '44px',
              letterSpacing: '-1px',
              color: '#171717',
            }}
          >
            Appointments
          </h1>
          <Button
            asChild
            className="h-12 font-semibold text-white rounded-full"
            style={{ backgroundColor: '#0052FF' }}
          >
            <Link href="/booking" className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Book Appointment
            </Link>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="upcoming" className="gap-1.5">
              Upcoming
              {categorized.upcoming.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[11px]">
                  {categorized.upcoming.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-1.5">
              Past
              {categorized.past.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[11px]">
                  {categorized.past.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="gap-1.5">
              Cancelled
              {categorized.cancelled.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[11px]">
                  {categorized.cancelled.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters + Search */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {doctors.length > 0 && (
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="All Doctors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Doctors</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.relation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-[220px]"
              />
            </div>
          </div>

          <TabsContent value="upcoming">
            <AppointmentsTable
              appointments={applyFilters(categorized.upcoming)}
              tab="upcoming"
              onAction={setSheetView}
            />
          </TabsContent>
          <TabsContent value="past">
            <AppointmentsTable
              appointments={applyFilters(categorized.past)}
              tab="past"
              onAction={setSheetView}
            />
          </TabsContent>
          <TabsContent value="cancelled">
            <AppointmentsTable
              appointments={applyFilters(categorized.cancelled)}
              tab="cancelled"
              onAction={setSheetView}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Side Sheets */}
      <Sheet open={sheetView !== null} onOpenChange={(open) => !open && setSheetView(null)}>
        <SheetContent className="overflow-y-auto">
          {sheetView?.type === 'details' && (
            <DetailsSheet
              appointment={sheetView.appointment}
              tab={getTab(sheetView.appointment)}
              onAction={setSheetView}
            />
          )}
          {sheetView?.type === 'cancel' && (
            <CancelSheet
              appointment={sheetView.appointment}
              onSuccess={() => handleSheetSuccess('Appointment cancelled. Refund initiated.')}
              onError={(msg) => handleSheetError(msg)}
              onClose={() => setSheetView(null)}
            />
          )}
          {sheetView?.type === 'reschedule' && (
            <RescheduleSheet
              appointment={sheetView.appointment}
              onSuccess={() => handleSheetSuccess('Appointment rescheduled successfully.')}
              onError={(msg) => handleSheetError(msg)}
              onClose={() => setSheetView(null)}
            />
          )}
          {sheetView?.type === 'share' && (
            <ShareSheet appointment={sheetView.appointment} />
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

/* ─── Table ─── */

function AppointmentsTable({
  appointments,
  tab,
  onAction,
}: {
  appointments: Appointment[];
  tab: 'upcoming' | 'past' | 'cancelled';
  onAction: (view: SheetView) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm mb-4">
          {tab === 'upcoming' && 'No upcoming appointments'}
          {tab === 'past' && 'No past appointments'}
          {tab === 'cancelled' && 'No cancelled appointments'}
        </p>
        {tab === 'upcoming' && (
          <Button asChild variant="outline" size="sm">
            <Link href="/booking">Book an appointment</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead>Appointment</TableHead>
            <TableHead className="w-[120px]">Patient</TableHead>
            <TableHead className="w-[140px]">Amount</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((appt) => {
            const clickable = tab !== 'upcoming';
            return (
            <TableRow
              key={appt.id}
              className={clickable ? 'cursor-pointer' : ''}
              onClick={clickable ? () => router.visit(`/appointments/${appt.id}`) : undefined}
            >
              <TableCell className="align-top">
                <p className="text-sm font-medium">{appt.date_formatted}</p>
                <p className="text-xs text-muted-foreground">{appt.time}</p>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#BFDBFE' }}
                  >
                    {appt.type === 'doctor' ? (
                      <Stethoscope className="h-3.5 w-3.5" style={{ color: '#1E40AF' }} />
                    ) : (
                      <TestTube2 className="h-3.5 w-3.5" style={{ color: '#1E40AF' }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{appt.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {appt.mode}
                      {appt.subtitle ? ` • ${appt.subtitle}` : ''}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <p className="text-sm">{appt.patient_name}</p>
              </TableCell>
              <TableCell className="align-top">
                <p className="text-sm font-medium">₹{appt.fee.toLocaleString()}</p>
                <PaymentStatusTag status={appt.payment_status} />
              </TableCell>
              <TableCell className="align-top" onClick={(e) => e.stopPropagation()}>
                <ActionsMenu appointment={appt} tab={tab} onAction={onAction} />
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Payment Status Tag ─── */

function PaymentStatusTag({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    paid: { label: 'Paid', color: 'text-green-600' },
    pending: { label: 'Pending', color: 'text-amber-600' },
    partially_refunded: { label: 'Partially Refunded', color: 'text-amber-600' },
    fully_refunded: { label: 'Refunded', color: 'text-red-600' },
  };

  const { label, color } = config[status] || { label: status, color: 'text-muted-foreground' };

  return <span className={cn('text-[11px] font-medium', color)}>{label}</span>;
}

/* ─── Actions Dropdown ─── */

function ActionsMenu({
  appointment,
  tab,
  onAction,
}: {
  appointment: Appointment;
  tab: 'upcoming' | 'past' | 'cancelled';
  onAction: (view: SheetView) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => {
            if (tab === 'upcoming') {
              onAction({ type: 'details', appointment });
            } else {
              router.visit(`/appointments/${appointment.id}`);
            }
          }}
        >
          <Eye className="h-4 w-4" />
          View Details
        </DropdownMenuItem>

        {tab === 'upcoming' && (
          <>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'reschedule', appointment })}
            >
              <CalendarClock className="h-4 w-4" />
              Reschedule
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'share', appointment })}
            >
              <Share2 className="h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onAction({ type: 'cancel', appointment })}
            >
              <XCircle className="h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          </>
        )}

        {tab === 'past' && (
          <>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'share', appointment })}
            >
              <Share2 className="h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => {
                window.location.href = `/appointments/${appointment.id}/book-again`;
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Book Again
            </DropdownMenuItem>
          </>
        )}

        {tab === 'cancelled' && (
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => {
              window.location.href = `/appointments/${appointment.id}/book-again`;
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Book Again
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Details Sheet ─── */

function DetailsSheet({
  appointment,
  tab,
  onAction,
}: {
  appointment: Appointment;
  tab: 'upcoming' | 'past' | 'cancelled';
  onAction: (view: SheetView) => void;
}) {
  const isDoctor = appointment.type === 'doctor';

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#BFDBFE' }}
          >
            {isDoctor ? (
              <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
            ) : (
              <TestTube2 className="h-5 w-5" style={{ color: '#1E40AF' }} />
            )}
          </div>
          <div>
            <SheetTitle className="text-base">{appointment.title}</SheetTitle>
            <SheetDescription>
              {appointment.mode}
              {appointment.subtitle ? ` • ${appointment.subtitle}` : ''}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-4">
        <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date & Time">
          {appointment.date_formatted} at {appointment.time}
        </DetailRow>
        <DetailRow icon={<User className="h-4 w-4" />} label="Patient">
          {appointment.patient_name}
        </DetailRow>
        <DetailRow label="Amount">
          <div>
            <span className="font-semibold">₹{appointment.fee.toLocaleString()}</span>
            <span className="ml-2">
              <PaymentStatusTag status={appointment.payment_status} />
            </span>
          </div>
        </DetailRow>
        <DetailRow label="Status">
          <span
            className={cn(
              'text-sm font-medium',
              appointment.status === 'confirmed' && 'text-green-600',
              appointment.status === 'completed' && 'text-muted-foreground',
              appointment.status === 'cancelled' && 'text-red-600'
            )}
          >
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </span>
        </DetailRow>
        <DetailRow label="Booking ID">
          <span className="font-mono text-xs">
            {(appointment.type === 'doctor' ? 'DOC' : 'LAB').toUpperCase()}-{appointment.id}
          </span>
        </DetailRow>

        <Link
          href={`/appointments/${appointment.id}`}
          className="flex items-center justify-center gap-2 text-sm font-medium rounded-lg border border-dashed py-2.5 mt-2 hover:bg-muted/50 transition-colors"
          style={{ color: '#0052FF' }}
        >
          <Eye className="h-4 w-4" />
          View Full Details
        </Link>
      </div>

      {/* Footer: 1 primary action + 3-dot for secondary */}
      {tab === 'upcoming' && (
        <div className="pt-6 mt-6 border-t">
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 rounded-full text-white"
              style={{ backgroundColor: '#0052FF' }}
              onClick={() => onAction({ type: 'reschedule', appointment })}
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onAction({ type: 'share', appointment })}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onAction({ type: 'cancel', appointment })}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {tab === 'past' && (
        <div className="pt-6 mt-6 border-t">
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 rounded-full text-white"
              style={{ backgroundColor: '#0052FF' }}
              onClick={() => {
                window.location.href = `/appointments/${appointment.id}/book-again`;
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Book Again
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px]">
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onAction({ type: 'share', appointment })}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {tab === 'cancelled' && (
        <div className="pt-6 mt-6 border-t">
          <Button
            className="w-full rounded-full text-white"
            style={{ backgroundColor: '#0052FF' }}
            onClick={() => {
              window.location.href = `/appointments/${appointment.id}/book-again`;
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Book Again
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm text-right">{children}</div>
    </div>
  );
}

/* ─── Cancel Sheet ─── */

function CancelSheet({
  appointment,
  onSuccess,
  onError,
  onClose,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    'Change of plans',
    'Found another doctor',
    'Feeling better',
    'Schedule conflict',
    'Other',
  ];

  const handleCancel = () => {
    setSubmitting(true);
    router.post(
      `/appointments/${appointment.id}/cancel`,
      { cancellation_reason: reason || null },
      {
        onSuccess: () => onSuccess(),
        onError: () => {
          setSubmitting(false);
          onError('Failed to cancel appointment. Please try again.');
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-6">
        <SheetTitle>Cancel Appointment</SheetTitle>
        <SheetDescription>This action cannot be undone.</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6">
        {/* Warning */}
        <div className="flex gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">Are you sure?</p>
            <p className="text-amber-700 mt-1">
              Cancelling your appointment with{' '}
              <span className="font-medium">{appointment.title}</span> on{' '}
              <span className="font-medium">{appointment.date_formatted}</span> will initiate a
              full refund of ₹{appointment.fee.toLocaleString()}.
            </p>
          </div>
        </div>

        {/* Reason selection */}
        <div>
          <p className="text-sm font-medium mb-3">Reason for cancellation (optional)</p>
          <div className="space-y-2">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(reason === r ? '' : r)}
                className={cn(
                  'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors',
                  reason === r
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-6 mt-6 border-t space-y-2">
        <Button
          className="w-full rounded-full"
          variant="destructive"
          onClick={handleCancel}
          disabled={submitting}
        >
          {submitting ? 'Cancelling...' : 'Cancel Appointment'}
        </Button>
        <Button
          className="w-full rounded-full"
          variant="ghost"
          onClick={onClose}
          disabled={submitting}
        >
          Keep Appointment
        </Button>
      </div>
    </div>
  );
}

/* ─── Reschedule Sheet ─── */

function RescheduleSheet({
  appointment,
  onSuccess,
  onError,
  onClose,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}) {
  const [dates, setDates] = useState<DateOption[]>([]);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetch(`/appointments/${appointment.id}/available-slots?date=${appointment.date}`)
      .then((r) => r.json())
      .then((data) => {
        setDates(data.dates || []);
        setSlots(data.slots || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        onError('Failed to load available slots. Please try again.');
      });
  }, [appointment.id]);

  // Refetch slots on date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSlotsLoading(true);
    fetch(`/appointments/${appointment.id}/available-slots?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlotsLoading(false);
        onError('Failed to load time slots. Please try again.');
      });
  };

  const handleReschedule = () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    router.post(
      `/appointments/${appointment.id}/reschedule`,
      { date: selectedDate, time: selectedTime },
      {
        onSuccess: () => onSuccess(),
        onError: () => {
          setSubmitting(false);
          onError('Failed to reschedule appointment. Please try again.');
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-6">
        <SheetTitle>Reschedule Appointment</SheetTitle>
        <SheetDescription>
          Currently: {appointment.date_formatted} at {appointment.time}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Booking Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#BFDBFE' }}>
              {appointment.type === 'doctor' ? (
                <Stethoscope className="h-5 w-5" style={{ color: '#1E40AF' }} />
              ) : (
                <TestTube2 className="h-5 w-5" style={{ color: '#1E40AF' }} />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{appointment.title}</p>
              {appointment.subtitle && (
                <p className="text-xs text-muted-foreground">{appointment.subtitle}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span>{appointment.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{appointment.date_formatted}</span>
            </div>
            <div className="text-muted-foreground">
              Mode: {appointment.mode}
            </div>
            <div className="text-muted-foreground">
              Fee: ₹{appointment.fee}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Date pills — guided flow style */}
            <div>
              <p className="text-sm font-medium mb-3">Select a new date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => handleDateChange(d.date)}
                    className={cn(
                      'flex flex-col items-center justify-center min-w-[100px] px-4 py-3 rounded-xl border text-sm transition-all flex-shrink-0',
                      selectedDate === d.date
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background hover:border-primary/50 border-gray-200'
                    )}
                  >
                    <span className="font-medium">{d.display}</span>
                    {d.is_today && (
                      <span
                        className={cn(
                          'text-[10px] mt-0.5',
                          selectedDate === d.date ? 'text-background/70' : 'text-muted-foreground'
                        )}
                      >
                        Today
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots — guided flow style */}
            {selectedDate && (
              <div>
                <p className="text-sm font-medium mb-3">Select a time</p>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No available slots for this date
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => setSelectedTime(s.time)}
                        className={cn(
                          'px-4 py-2 rounded-full border text-sm transition-all',
                          selectedTime === s.time
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background hover:border-primary/50 border-gray-200'
                        )}
                      >
                        {s.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="pt-6 mt-6 border-t space-y-2">
        <Button
          className="w-full rounded-full text-white"
          style={{ backgroundColor: '#0052FF' }}
          onClick={handleReschedule}
          disabled={!selectedDate || !selectedTime || submitting}
        >
          {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
        </Button>
        <Button
          className="w-full rounded-full"
          variant="ghost"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─── Share Sheet ─── */

function ShareSheet({ appointment }: { appointment: Appointment }) {
  const [copied, setCopied] = useState(false);

  const shareText = [
    `${appointment.type === 'doctor' ? 'Doctor' : 'Lab'} Appointment`,
    `${appointment.title}`,
    `Date: ${appointment.date_formatted} at ${appointment.time}`,
    `Patient: ${appointment.patient_name}`,
    `Mode: ${appointment.mode}`,
  ].join('\n');

  const appointmentUrl = `${window.location.origin}/appointments`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${appointmentUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = `${shareText}\n\n${appointmentUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(`${shareText}\n\n${appointmentUrl}`);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="pb-6">
        <SheetTitle>Share Appointment</SheetTitle>
        <SheetDescription>Share your appointment details</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3">
        <div className="p-4 rounded-lg bg-muted/50 text-sm whitespace-pre-line mb-6">
          {shareText}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Copy className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {copied ? 'Copied to clipboard!' : 'Copy to Clipboard'}
          </span>
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="text-sm font-medium">Share via WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
