import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetBody,
  SheetDivider,
} from '@/Components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/Components/ui/collapsible';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { Textarea } from '@/Components/ui/textarea';
import { cn } from '@/Lib/utils';
import {
  MoreHorizontal,
  Eye,
  CalendarClock,
  Share2,
  XCircle,
  RotateCcw,
  Calendar,
  AlertTriangle,
  User,
  Stethoscope,
  TestTube2,
  Check,
  ChevronDown,
  FileText,
  ClipboardCheck,
  MapPin,
  CalendarPlus,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

/* ─── Types ─── */

export interface Appointment {
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
  notes?: string | null;
  google_calendar_event_id?: string | null;
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

export type SheetView =
  | { type: 'details'; appointment: Appointment }
  | { type: 'cancelled_details'; appointment: Appointment }
  | { type: 'cancel'; appointment: Appointment }
  | { type: 'reschedule'; appointment: Appointment }
  | { type: 'followup'; appointment: Appointment }
  | { type: 'book_again'; appointment: Appointment }
  | { type: 'share'; appointment: Appointment }
  | null;

/* ─── Payment Status Tag ─── */

function PaymentStatusTag({ status }: { status: string }) {
  const colors = {
    paid: 'text-success',
    pending: 'text-warning',
    partially_refunded: 'text-warning',
    fully_refunded: 'text-destructive',
  };

  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    partially_refunded: 'Partially Refunded',
    fully_refunded: 'Refunded',
  };

  return (
    <span className={cn('text-[14px] font-medium', colors[status as keyof typeof colors] || 'text-muted-foreground')}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

/* ─── Details Sheet ─── */

export function DetailsSheet({
  appointment,
  tab,
  onAction,
}: {
  appointment: Appointment;
  tab: 'upcoming' | 'past' | 'cancelled';
  onAction: (view: SheetView) => void;
}) {
  const isDoctor = appointment.type === 'doctor';

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [preparationOpen, setPreparationOpen] = useState(false);

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(appointment.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Check-in state
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Check if appointment is within 24-48 hours (check-in window)
  const getHoursUntilAppointment = () => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const diffMs = appointmentDate.getTime() - now.getTime();
    return diffMs / (1000 * 60 * 60);
  };

  const hoursUntil = getHoursUntilAppointment();
  const canCheckIn = tab === 'upcoming' && hoursUntil > 0 && hoursUntil <= 48;

  const handleCheckIn = () => {
    setIsCheckingIn(true);
    router.post(
      `/appointments/${appointment.id}/check-in`,
      {},
      {
        onSuccess: () => {
          setIsCheckingIn(false);
          // The parent will handle closing the sheet and showing toast
        },
        onError: () => {
          setIsCheckingIn(false);
        },
      }
    );
  };

  const handleAddToCalendar = () => {
    // Generate ICS download for calendar event
    const startDate = new Date(appointment.date);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min appointment

    const formatDateForICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${formatDateForICS(startDate)}`,
      `DTEND:${formatDateForICS(endDate)}`,
      `SUMMARY:${appointment.title}`,
      `DESCRIPTION:${appointment.mode} appointment for ${appointment.patient_name}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment-${appointment.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGetDirections = () => {
    // Open Google Maps with hospital location (placeholder coordinates)
    // In a real app, this would use the actual location from the appointment
    window.open('https://maps.google.com/maps?q=hospital', '_blank');
  };

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    router.put(
      `/appointments/${appointment.id}/notes`,
      { notes: notesValue },
      {
        onSuccess: () => {
          setIsEditingNotes(false);
          setIsSavingNotes(false);
        },
        onError: () => {
          setIsSavingNotes(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader>
        <SheetTitle className="text-base">Upcoming Appointment</SheetTitle>
      </SheetHeader>

      {/* People Rows */}
      <div className="space-y-3 pb-4">
        {/* Patient Row */}
        <PeopleRow label="Patient" name={appointment.patient_name} />

        {/* Doctor Row - only for doctor appointments */}
        {isDoctor && (
          <PeopleRow label="Doctor" name={appointment.title} />
        )}
      </div>

      {/* Edge-to-edge divider */}
      <SheetDivider />

      {/* Scrollable Content */}
      <SheetBody>
        {/* Details Section */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon icon={Calendar} className="h-4 w-4 text-neutral-900" />
              <span className="text-[14px] font-medium">Details</span>
            </div>
            <Icon
              icon={ChevronDown}
              className={cn(
                "h-4 w-4 text-neutral-900 transition-transform",
                detailsOpen && "transform rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2 pb-3">
            <KeyValueRow label="Date" value={appointment.date_formatted} />
            <KeyValueRow
              label="Time"
              value={`${appointment.time} (30 mins)`}
            />
            <KeyValueRow
              label="Type"
              value={`${appointment.subtitle || 'New'} • ${appointment.mode}`}
            />
            {appointment.google_calendar_event_id && (
              <KeyValueRow
                label="Calendar"
                value={
                  <span className="flex items-center gap-1 text-success">
                    <Icon icon={Check} className="h-3 w-3" />
                    Synced
                  </span>
                }
              />
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Notes Section */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon icon={FileText} className="h-4 w-4 text-neutral-900" />
              <span className="text-[14px] font-medium">Notes</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                className="text-[14px] text-primary hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNotes(true);
                  setNotesOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    setIsEditingNotes(true);
                    setNotesOpen(true);
                  }
                }}
              >
                {notesValue ? 'Edit' : 'Add note'}
              </span>
              <Icon
                icon={ChevronDown}
                className={cn(
                  "h-4 w-4 text-neutral-900 transition-transform",
                  notesOpen && "transform rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 pb-3">
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add your notes here..."
                  className="min-h-[120px]"
                  maxLength={5000}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesValue(appointment.notes || '');
                    }}
                    disabled={isSavingNotes}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                  >
                    {isSavingNotes ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {notesValue ? (
                  <p className="text-[14px] text-foreground whitespace-pre-wrap">{notesValue}</p>
                ) : (
                  <p className="text-[14px] text-muted-foreground">No notes added</p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Preparation Section */}
        <Collapsible open={preparationOpen} onOpenChange={setPreparationOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon icon={ClipboardCheck} className="h-4 w-4 text-neutral-900" />
              <span className="text-[14px] font-medium">Preparation</span>
            </div>
            <Icon
              icon={ChevronDown}
              className={cn(
                "h-4 w-4 text-neutral-900 transition-transform",
                preparationOpen && "transform rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 pb-3">
            <ul className="space-y-1.5 text-[14px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5">•</span>
                <span>Have prescription list ready</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5">•</span>
                <span>Previous reports if any</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5">•</span>
                <span>List of current symptoms</span>
              </li>
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </SheetBody>

      {/* Footer */}
      <SheetFooter>
        {tab === 'upcoming' && (
          <>
            {/* Primary Button: Check-in (if within 24-48h) else Reschedule */}
            {canCheckIn ? (
              <Button
                className="flex-1"
                size="lg"
                onClick={handleCheckIn}
                disabled={isCheckingIn}
              >
                <Icon icon={ClipboardCheck} className="h-[20px] w-[20px]" />
                {isCheckingIn ? 'Checking in...' : 'Check-in'}
              </Button>
            ) : (
              <Button
                className="flex-1"
                size="lg"
                onClick={() => onAction({ type: 'reschedule', appointment })}
              >
                <Icon icon={CalendarClock} className="h-[20px] w-[20px]" />
                Reschedule
              </Button>
            )}

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                  <Icon icon={MoreHorizontal} className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={handleAddToCalendar}
                >
                  <Icon icon={CalendarPlus} className="h-4 w-4" />
                  Add to Calendar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={handleGetDirections}
                >
                  <Icon icon={MapPin} className="h-4 w-4" />
                  Get Directions
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onAction({ type: 'share', appointment })}
                >
                  <Icon icon={Share2} className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onAction({ type: 'reschedule', appointment })}
                >
                  <Icon icon={CalendarClock} className="h-4 w-4" />
                  Reschedule
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onAction({ type: 'cancel', appointment })}
                >
                  <Icon icon={XCircle} className="h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {tab === 'past' && (
          <>
            {isDoctor ? (
              <Button
                className="flex-1"
                size="lg"
                onClick={() => onAction({ type: 'book_again', appointment })}
              >
                <Icon icon={RotateCcw} className="h-[20px] w-[20px]" />
                Book Again
              </Button>
            ) : (
              <Button
                className="flex-1"
                size="lg"
                onClick={() => router.visit('/booking?type=lab')}
              >
                <Icon icon={TestTube2} className="h-[20px] w-[20px]" />
                Book Lab Test
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                  <Icon icon={MoreHorizontal} className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px]">
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onAction({ type: 'share', appointment })}
                >
                  <Icon icon={Share2} className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {tab === 'cancelled' && (
          isDoctor ? (
            <Button
              className="flex-1"
              size="lg"
              onClick={() => onAction({ type: 'book_again', appointment })}
            >
              <Icon icon={RotateCcw} className="h-[20px] w-[20px]" />
              Book Again
            </Button>
          ) : (
            <Button
              className="flex-1"
              size="lg"
              onClick={() => router.visit('/booking?type=lab')}
            >
              <Icon icon={TestTube2} className="h-[20px] w-[20px]" />
              Book Lab Test
            </Button>
          )
        )}
      </SheetFooter>
    </div>
  );
}

/* ─── Cancelled Details Sheet ─── */

export function CancelledDetailsSheet({
  appointment,
  onAction,
}: {
  appointment: Appointment;
  onAction: (view: SheetView) => void;
}) {
  const isDoctor = appointment.type === 'doctor';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader>
        <SheetTitle className="text-base">Cancelled Appointment</SheetTitle>
      </SheetHeader>

      {/* Cancelled Banner */}
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
        <Icon icon={XCircle} className="h-4 w-4 text-destructive flex-shrink-0" />
        <span className="text-[14px] text-destructive">This appointment was cancelled</span>
      </div>

      {/* People Rows */}
      <div className="space-y-3 pb-4">
        <PeopleRow label="Patient" name={appointment.patient_name} />
        {isDoctor && (
          <PeopleRow label="Doctor" name={appointment.title} />
        )}
      </div>

      {/* Edge-to-edge divider */}
      <SheetDivider />

      {/* Scrollable Content */}
      <SheetBody>
        {/* Original Details Section */}
        <div className="space-y-3">
          <p className="text-[14px] font-medium text-muted-foreground uppercase tracking-wide">Original Details</p>
          <div className="space-y-2">
            <KeyValueRow label="Date" value={appointment.date_formatted} />
            <KeyValueRow label="Time" value={appointment.time} />
            <KeyValueRow label="Type" value={`${appointment.subtitle || 'Consultation'} • ${appointment.mode}`} />
            <KeyValueRow label="Fee" value={`₹${appointment.fee.toLocaleString()}`} />
          </div>
        </div>

        {/* Cancellation Info Section */}
        <div className="space-y-3">
          <p className="text-[14px] font-medium text-muted-foreground uppercase tracking-wide">Cancellation Info</p>
          <div className="space-y-2">
            <KeyValueRow
              label="Refund"
              value={
                appointment.payment_status === 'fully_refunded'
                  ? `₹${appointment.fee.toLocaleString()} (Processed)`
                  : appointment.payment_status === 'partially_refunded'
                  ? `Partial refund processed`
                  : `₹${appointment.fee.toLocaleString()} (Pending)`
              }
            />
          </div>
        </div>
      </SheetBody>

      {/* Footer */}
      <SheetFooter>
        {isDoctor ? (
          <Button
            className="flex-1"
            size="lg"
            onClick={() => onAction({ type: 'book_again', appointment })}
          >
            <Icon icon={RotateCcw} className="h-[20px] w-[20px]" />
            Book Again
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            onClick={() => router.visit('/booking?type=lab')}
          >
            <Icon icon={TestTube2} className="h-[20px] w-[20px]" />
            Book Lab Test
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
              <Icon icon={MoreHorizontal} className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[140px]">
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'share', appointment })}
            >
              <Icon icon={Share2} className="h-4 w-4" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SheetFooter>
    </div>
  );
}

/* ─── Helper Components ─── */

function PeopleRow({ label, name }: { label: string; name: string }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[14px] text-muted-foreground w-[70px] flex-shrink-0">{label}</span>
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-warning text-warning-foreground text-[14px] font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-[14px] font-medium">{name}</span>
    </div>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between text-[14px]">
      <span className="text-muted-foreground w-[70px] flex-shrink-0">{label}</span>
      <span className="text-right flex-1">{value}</span>
    </div>
  );
}


/* ─── Cancel Sheet ─── */

export function CancelSheet({
  appointment,
  onSuccess,
  onError,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose?: () => void;
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
      <SheetHeader>
        <SheetTitle>Cancel appointment</SheetTitle>
      </SheetHeader>

      <SheetBody>
        <div className="space-y-6">
        {/* Warning */}
        <div className="flex gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <Icon icon={AlertTriangle} className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-[14px]">
            <p className="font-medium text-warning">Are you sure?</p>
            <p className="text-warning mt-1">
              Cancelling your appointment with{' '}
              <span className="font-medium">{appointment.title}</span> on{' '}
              <span className="font-medium">{appointment.date_formatted}</span> will initiate a
              full refund of ₹{appointment.fee.toLocaleString()}.
            </p>
          </div>
        </div>

        {/* Reason selection */}
        <div>
          <p className="text-[14px] font-medium mb-3">Reason for cancellation (optional)</p>
          <div className="space-y-2">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(reason === r ? '' : r)}
                className={cn(
                  'w-full text-left px-4 py-2.5 rounded-lg border text-[14px] transition-colors',
                  reason === r
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-border text-muted-foreground'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        </div>
      </SheetBody>

      {/* Actions */}
      <SheetFooter>
        <Button
          className="flex-1"
          size="lg"
          variant="destructive"
          onClick={handleCancel}
          disabled={submitting}
        >
          {submitting ? 'Cancelling...' : 'Cancel appointment'}
        </Button>
      </SheetFooter>
    </div>
  );
}

/* ─── Reschedule Sheet ─── */

export function RescheduleSheet({
  appointment,
  onSuccess,
  onError,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose?: () => void;
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
      <SheetHeader>
        <SheetTitle>Reschedule appointment</SheetTitle>
      </SheetHeader>

      <SheetBody>
        <div className="space-y-6">
        {/* Booking Summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary) / 0.25)' }}>
              {appointment.type === 'doctor' ? (
                <Icon icon={Stethoscope} className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
              ) : (
                <Icon icon={TestTube2} className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
              )}
            </div>
            <div>
              <p className="font-medium text-[14px]">{appointment.title}</p>
              {appointment.subtitle && (
                <p className="text-[14px] text-muted-foreground">{appointment.subtitle}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[14px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon={User} className="h-3.5 w-3.5" />
              <span>{appointment.patient_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon={Calendar} className="h-3.5 w-3.5" />
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
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Date pills — guided flow style */}
            <div>
              <p className="text-[14px] font-medium mb-3">Select a new date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => handleDateChange(d.date)}
                    className={cn(
                      'flex flex-col items-center justify-center min-w-[100px] px-4 py-3 rounded-xl border text-[14px] transition-all flex-shrink-0',
                      selectedDate === d.date
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background hover:border-primary/50 border-border'
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
                <p className="text-[14px] font-medium mb-3">Select a time</p>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-lg border border-dashed">
                    <p className="text-[14px] text-muted-foreground">
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
                          'px-4 py-2 rounded-full border text-[14px] transition-all',
                          selectedTime === s.time
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background hover:border-primary/50 border-border'
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
      </SheetBody>

      {/* Actions */}
      <SheetFooter>
        <Button
          className="flex-1"
          size="lg"
          onClick={handleReschedule}
          disabled={!selectedDate || !selectedTime || submitting}
        >
          {submitting ? 'Rescheduling...' : 'Confirm reschedule'}
        </Button>
      </SheetFooter>
    </div>
  );
}

/* ─── Follow-Up Sheet ─── */

interface FollowUpDateOption {
  date: string;
  display: string;
  sublabel: string;
  is_today: boolean;
}

interface FollowUpSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface FollowUpMode {
  type: 'video' | 'in_person';
  label: string;
  description: string;
  price: number;
}

interface FollowUpData {
  dates: FollowUpDateOption[];
  slots: FollowUpSlot[];
  doctor: {
    id: number;
    name: string;
    specialization: string;
    avatar_url: string | null;
  };
  patient: {
    id: number | null;
    name: string;
  };
  modes: FollowUpMode[];
}

export function FollowUpSheet({
  appointment,
  onSuccess,
  onError,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose?: () => void;
}) {
  const [data, setData] = useState<FollowUpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedMode, setSelectedMode] = useState<'video' | 'in_person' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetch(`/appointments/${appointment.id}/followup-slots`)
      .then((r) => r.json())
      .then((responseData: FollowUpData) => {
        setData(responseData);
        // Auto-select first date if available
        if (responseData.dates.length > 0) {
          setSelectedDate(responseData.dates[0].date);
        }
        // Auto-select mode if only one option
        if (responseData.modes.length === 1) {
          setSelectedMode(responseData.modes[0].type);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        onError('Failed to load available slots. Please try again.');
      });
  }, [appointment.id]);

  // Refetch slots when date changes
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSlotsLoading(true);
    fetch(`/appointments/${appointment.id}/followup-slots?date=${date}`)
      .then((r) => r.json())
      .then((responseData: FollowUpData) => {
        if (data) {
          setData({ ...data, slots: responseData.slots });
        }
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlotsLoading(false);
        onError('Failed to load time slots. Please try again.');
      });
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !selectedMode) return;
    setSubmitting(true);
    router.post(
      `/appointments/${appointment.id}/followup`,
      { date: selectedDate, time: selectedTime, mode: selectedMode },
      {
        onSuccess: () => onSuccess(),
        onError: () => {
          setSubmitting(false);
          onError('Failed to book follow-up. Please try again.');
        },
      }
    );
  };

  const getSelectedPrice = () => {
    if (!data || !selectedMode) return null;
    const mode = data.modes.find((m) => m.type === selectedMode);
    return mode?.price ?? null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle>Book follow-up</SheetTitle>
      </SheetHeader>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <>
          <SheetBody>
            <div className="space-y-6">
            {/* Doctor & Patient Card */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {data.doctor.avatar_url ? (
                    <AvatarImage src={data.doctor.avatar_url} alt={data.doctor.name} />
                  ) : null}
                  <AvatarFallback className="bg-warning text-warning-foreground font-medium">
                    {getInitials(data.doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[14px]">{data.doctor.name}</p>
                  <p className="text-[14px] text-muted-foreground">{data.doctor.specialization}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
                <Icon icon={User} className="h-3.5 w-3.5" />
                <span>For: {data.patient.name}</span>
              </div>
            </div>

            {/* Date Pills */}
            <div>
              <p className="text-[14px] font-medium mb-3">Select a date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {data.dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => handleDateChange(d.date)}
                    className={cn(
                      'flex flex-col items-center justify-center min-w-[100px] px-4 py-3 rounded-xl border text-[14px] transition-all flex-shrink-0',
                      selectedDate === d.date
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background hover:border-primary/50 border-border'
                    )}
                  >
                    <span className="font-medium">{d.display}</span>
                    <span
                      className={cn(
                        'text-[10px] mt-0.5',
                        selectedDate === d.date ? 'text-background/70' : 'text-muted-foreground'
                      )}
                    >
                      {d.sublabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <p className="text-[14px] font-medium mb-3">Select a time</p>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : data.slots.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-lg border border-dashed">
                    <p className="text-[14px] text-muted-foreground">No available slots for this date</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => s.available && setSelectedTime(s.time)}
                        disabled={!s.available}
                        className={cn(
                          'px-4 py-2 rounded-full border text-[14px] transition-all',
                          selectedTime === s.time
                            ? 'bg-foreground text-background border-foreground'
                            : s.available
                            ? 'bg-background hover:border-primary/50 border-border'
                            : 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50'
                        )}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Consultation Mode */}
            {selectedDate && selectedTime && data.modes.length > 0 && (
              <div>
                <p className="text-[14px] font-medium mb-3">How would you like to consult?</p>
                <div className="space-y-2">
                  {data.modes.map((mode) => (
                    <button
                      key={mode.type}
                      type="button"
                      onClick={() => setSelectedMode(mode.type)}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                        selectedMode === mode.type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full border flex items-center justify-center',
                            selectedMode === mode.type ? 'border-primary' : 'border-border'
                          )}
                        >
                          {selectedMode === mode.type && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[14px]">{mode.label}</p>
                          <p className="text-[14px] text-muted-foreground">{mode.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-[14px]">₹{mode.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </SheetBody>

          {/* Footer */}
          <SheetFooter>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime || !selectedMode || submitting}
            >
              {submitting
                ? 'Booking...'
                : getSelectedPrice()
                ? `Book follow-up ₹${getSelectedPrice()?.toLocaleString()}`
                : 'Book follow-up'}
            </Button>
          </SheetFooter>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-muted-foreground">Failed to load data</p>
        </div>
      )}
    </div>
  );
}

/* ─── Book Again Sheet ─── */

interface BookAgainDateOption {
  date: string;
  display: string;
  sublabel: string;
  is_today: boolean;
}

interface BookAgainSlot {
  time: string;
  available: boolean;
  preferred: boolean;
}

interface BookAgainMode {
  type: 'video' | 'in_person';
  label: string;
  description: string;
  price: number;
}

interface BookAgainData {
  dates: BookAgainDateOption[];
  slots: BookAgainSlot[];
  doctor: {
    id: number;
    name: string;
    specialization: string;
    avatar_url: string | null;
  };
  patient: {
    id: number | null;
    name: string;
  };
  modes: BookAgainMode[];
  original_mode: 'video' | 'in_person' | null;
}

export function BookAgainSheet({
  appointment,
  onSuccess,
  onError,
}: {
  appointment: Appointment;
  onSuccess: () => void;
  onError: (message: string) => void;
  onClose?: () => void;
}) {
  const [data, setData] = useState<BookAgainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedMode, setSelectedMode] = useState<'video' | 'in_person' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetch(`/appointments/${appointment.id}/book-again-slots`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((responseData: BookAgainData) => {
        setData(responseData);
        // Auto-select first date if available
        if (responseData.dates.length > 0) {
          setSelectedDate(responseData.dates[0].date);
        }
        // Pre-select original mode if available, otherwise auto-select if only one option
        if (responseData.original_mode && responseData.modes.some(m => m.type === responseData.original_mode)) {
          setSelectedMode(responseData.original_mode);
        } else if (responseData.modes.length === 1) {
          setSelectedMode(responseData.modes[0].type);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        onError('Failed to load available slots. Please try again.');
      });
  }, [appointment.id]);

  // Refetch slots when date changes
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    setSlotsLoading(true);
    fetch(`/appointments/${appointment.id}/book-again-slots?date=${date}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then((responseData: BookAgainData) => {
        if (data) {
          setData({ ...data, slots: responseData.slots });
        }
        setSlotsLoading(false);
      })
      .catch(() => {
        setSlotsLoading(false);
        onError('Failed to load time slots. Please try again.');
      });
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime || !selectedMode) return;
    setSubmitting(true);
    router.post(
      `/appointments/${appointment.id}/book-again-create`,
      { date: selectedDate, time: selectedTime, mode: selectedMode },
      {
        onSuccess: () => onSuccess(),
        onError: () => {
          setSubmitting(false);
          onError('Failed to book appointment. Please try again.');
        },
      }
    );
  };

  const getSelectedPrice = () => {
    if (!data || !selectedMode) return null;
    const mode = data.modes.find((m) => m.type === selectedMode);
    return mode?.price ?? null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle>Book again</SheetTitle>
      </SheetHeader>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : data ? (
        <>
          <SheetBody>
            <div className="space-y-6">
            {/* Doctor & Patient Card */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {data.doctor.avatar_url ? (
                    <AvatarImage src={data.doctor.avatar_url} alt={data.doctor.name} />
                  ) : null}
                  <AvatarFallback className="bg-warning text-warning-foreground font-medium">
                    {getInitials(data.doctor.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[14px]">{data.doctor.name}</p>
                  <p className="text-[14px] text-muted-foreground">{data.doctor.specialization}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
                <Icon icon={User} className="h-3.5 w-3.5" />
                <span>For: {data.patient.name}</span>
              </div>
            </div>

            {/* Date Pills */}
            <div>
              <p className="text-[14px] font-medium mb-3">Select a date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {data.dates.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => handleDateChange(d.date)}
                    className={cn(
                      'flex flex-col items-center justify-center min-w-[100px] px-4 py-3 rounded-xl border text-[14px] transition-all flex-shrink-0',
                      selectedDate === d.date
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background hover:border-primary/50 border-border'
                    )}
                  >
                    <span className="font-medium">{d.display}</span>
                    <span
                      className={cn(
                        'text-[10px] mt-0.5',
                        selectedDate === d.date ? 'text-background/70' : 'text-muted-foreground'
                      )}
                    >
                      {d.sublabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <p className="text-[14px] font-medium mb-3">Select a time</p>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : data.slots.length === 0 ? (
                  <div className="text-center py-8 px-4 rounded-lg border border-dashed">
                    <p className="text-[14px] text-muted-foreground">No available slots for this date</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.slots.map((s) => (
                      <button
                        key={s.time}
                        type="button"
                        onClick={() => s.available && setSelectedTime(s.time)}
                        disabled={!s.available}
                        className={cn(
                          'px-4 py-2 rounded-full border text-[14px] transition-all',
                          selectedTime === s.time
                            ? 'bg-foreground text-background border-foreground'
                            : s.available
                            ? 'bg-background hover:border-primary/50 border-border'
                            : 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50'
                        )}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Consultation Mode */}
            {selectedDate && selectedTime && data.modes.length > 0 && (
              <div>
                <p className="text-[14px] font-medium mb-3">How would you like to consult?</p>
                <div className="space-y-2">
                  {data.modes.map((mode) => (
                    <button
                      key={mode.type}
                      type="button"
                      onClick={() => setSelectedMode(mode.type)}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                        selectedMode === mode.type
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full border flex items-center justify-center',
                            selectedMode === mode.type ? 'border-primary' : 'border-border'
                          )}
                        >
                          {selectedMode === mode.type && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[14px]">{mode.label}</p>
                          <p className="text-[14px] text-muted-foreground">{mode.description}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-[14px]">₹{mode.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </SheetBody>

          {/* Footer */}
          <SheetFooter>
            <Button
              className="flex-1"
              size="lg"
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime || !selectedMode || submitting}
            >
              {submitting
                ? 'Booking...'
                : getSelectedPrice()
                ? `Book appointment ₹${getSelectedPrice()?.toLocaleString()}`
                : 'Book appointment'}
            </Button>
          </SheetFooter>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[14px] text-muted-foreground">Failed to load data</p>
        </div>
      )}
    </div>
  );
}
