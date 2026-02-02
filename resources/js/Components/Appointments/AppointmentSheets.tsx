import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
  Video,
  FileText,
  ClipboardCheck,
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
  video_meeting_url?: string | null;
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
  | { type: 'cancel'; appointment: Appointment }
  | { type: 'reschedule'; appointment: Appointment }
  | { type: 'share'; appointment: Appointment }
  | null;

/* ─── Payment Status Tag ─── */

function PaymentStatusTag({ status }: { status: string }) {
  const colors = {
    paid: 'text-green-600',
    pending: 'text-amber-600',
    partially_refunded: 'text-amber-600',
    fully_refunded: 'text-red-600',
  };

  const labels = {
    paid: 'Paid',
    pending: 'Pending',
    partially_refunded: 'Partially Refunded',
    fully_refunded: 'Refunded',
  };

  return (
    <span className={cn('text-xs font-medium', colors[status as keyof typeof colors] || 'text-gray-600')}>
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
  const isVideoAppointment = appointment.mode.toLowerCase().includes('video');
  const isDoctorOnline = tab === 'upcoming' && isVideoAppointment; // Simulated - would come from backend

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(false);
  const [preparationOpen, setPreparationOpen] = useState(false);

  // Notes editing state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(appointment.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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
      <SheetHeader className="pb-4">
        <SheetTitle className="text-base">Upcoming Appointment</SheetTitle>
      </SheetHeader>

      {/* Status Banner - only for video appointments when doctor is online */}
      {isDoctorOnline && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
          <Icon icon={Check} className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-800">Doctor is online. You can join now</span>
        </div>
      )}

      {/* People Rows */}
      <div className="space-y-3 pb-4 border-b">
        {/* Patient Row */}
        <PeopleRow label="Patient" name={appointment.patient_name} />

        {/* Doctor Row - only for doctor appointments */}
        {isDoctor && (
          <PeopleRow label="Doctor" name={appointment.title} />
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-4 space-y-0 divide-y">
        {/* Details Section */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon icon={Calendar} className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Details</span>
            </div>
            <Icon
              icon={ChevronDown}
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
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
          </CollapsibleContent>
        </Collapsible>

        {/* Notes Section */}
        <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon icon={FileText} className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Notes</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="text-xs text-primary hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNotes(true);
                  setNotesOpen(true);
                }}
              >
                {notesValue ? 'Edit' : 'Add note'}
              </button>
              <Icon
                icon={ChevronDown}
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
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
                  <p className="text-sm text-foreground whitespace-pre-wrap">{notesValue}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes added</p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Preparation Section */}
        <Collapsible open={preparationOpen} onOpenChange={setPreparationOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Icon icon={ClipboardCheck} className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preparation</span>
            </div>
            <Icon
              icon={ChevronDown}
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                preparationOpen && "transform rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 pb-3">
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5">•</span>
                <span>Have medication list ready</span>
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
      </div>

      {/* Footer */}
      <div className="pt-4">
        {tab === 'upcoming' && (
          <div className="flex items-center gap-2">
            {/* Join Video Call Button - only for video appointments */}
            {isVideoAppointment ? (
              appointment.video_meeting_url ? (
                <Button
                  className="flex-1"
                  size="lg"
                  style={{ backgroundColor: '#0052FF' }}
                  onClick={() => {
                    if (appointment.video_meeting_url) {
                      window.open(appointment.video_meeting_url, '_blank');
                    }
                  }}
                >
                  <Icon icon={Video} className="h-4 w-4 mr-2" />
                  Join Video Call
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  size="lg"
                  variant="outline"
                  disabled
                >
                  <Icon icon={Video} className="h-4 w-4 mr-2" />
                  Video link will be shared
                </Button>
              )
            ) : (
              <Button
                className="flex-1"
                size="lg"
                variant="outline"
                onClick={() => onAction({ type: 'reschedule', appointment })}
              >
                <Icon icon={CalendarClock} className="h-4 w-4 mr-2" />
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
              <DropdownMenuContent align="end" className="w-[160px]">
                {isVideoAppointment && (
                  <>
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => onAction({ type: 'reschedule', appointment })}
                    >
                      <Icon icon={CalendarClock} className="h-4 w-4" />
                      Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onAction({ type: 'share', appointment })}
                >
                  <Icon icon={Share2} className="h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => onAction({ type: 'cancel', appointment })}
                >
                  <Icon icon={XCircle} className="h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {tab === 'past' && (
          <div className="flex items-center gap-2">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => {
                window.location.href = `/appointments/${appointment.id}/book-again`;
              }}
            >
              <Icon icon={RotateCcw} className="h-4 w-4 mr-2" />
              Book Again
            </Button>
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
          </div>
        )}

        {tab === 'cancelled' && (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              window.location.href = `/appointments/${appointment.id}/book-again`;
            }}
          >
            <Icon icon={RotateCcw} className="h-4 w-4 mr-2" />
            Book Again
          </Button>
        )}
      </div>
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
      <span className="text-sm text-muted-foreground w-[70px] flex-shrink-0">{label}</span>
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-orange-400 text-white text-xs font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between text-sm">
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
          <Icon icon={AlertTriangle} className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
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
      <div className="pt-4 space-y-2">
        <Button
          className="w-full"
          variant="destructive"
          onClick={handleCancel}
          disabled={submitting}
        >
          {submitting ? 'Cancelling...' : 'Cancel Appointment'}
        </Button>
        <Button
          className="w-full"
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

export function RescheduleSheet({
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
                <Icon icon={Stethoscope} className="h-5 w-5" style={{ color: '#1E40AF' }} />
              ) : (
                <Icon icon={TestTube2} className="h-5 w-5" style={{ color: '#1E40AF' }} />
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
      <div className="pt-4 space-y-2">
        <Button
          className="w-full"
          size="lg"
          onClick={handleReschedule}
          disabled={!selectedDate || !selectedTime || submitting}
        >
          {submitting ? 'Rescheduling...' : 'Confirm Reschedule'}
        </Button>
        <Button
          className="w-full"
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
