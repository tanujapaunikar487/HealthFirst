import { useState, useMemo, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading, SheetSkeleton } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
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
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import {
  DetailsSheet,
  CancelledDetailsSheet,
  CancelSheet,
  RescheduleSheet,
  BookAgainSheet,
  type Appointment,
  type SheetView,
} from '@/Components/Appointments/AppointmentSheets';
import { ShareSheet } from '@/Components/ui/share-sheet';

/* ─── Types ─── */

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

/* ─── Skeleton ─── */

function AppointmentsSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: '960px', padding: '40px 0' }}>
      <div className="flex items-center justify-between mb-8">
        <Pulse className="h-9 w-48" />
        <Pulse className="h-10 w-40 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mb-6">
        {[0, 1, 2].map((i) => (
          <Pulse key={i} className="h-9 w-28 rounded-full" />
        ))}
        <div className="ml-auto">
          <Pulse className="h-10 w-56 rounded-lg" />
        </div>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-3 bg-muted/50 border-b border-border">
          <Pulse className="h-3 w-28" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-16" />
          <Pulse className="h-3 w-12" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-5 border-b border-border last:border-0">
            <div className="flex items-center gap-3 w-64">
              <Pulse className="h-10 w-10 rounded-xl flex-shrink-0" />
              <div className="space-y-2">
                <Pulse className="h-4 w-36" />
                <Pulse className="h-3 w-24" />
              </div>
            </div>
            <Pulse className="h-4 w-16" />
            <Pulse className="h-4 w-28" />
            <Pulse className="h-6 w-20 rounded-full" />
            <Pulse className="h-4 w-16" />
            <Pulse className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ─── */

export default function Index({ user, appointments, familyMembers, doctors }: Props) {
  const { isLoading, hasError, retry } = useSkeletonLoading(appointments);
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetView, setSheetView] = useState<SheetView>(null);
  const [shareAppointment, setShareAppointment] = useState<Appointment | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Handle query params to auto-open sheets (for deep-linking from dashboard)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rescheduleId = params.get('reschedule');
    const cancelId = params.get('cancel');
    const detailsId = params.get('details');

    if (rescheduleId) {
      const appointment = appointments.find(a => a.id === Number(rescheduleId));
      if (appointment) {
        setSheetView({ type: 'reschedule', appointment });
        // Clean URL after opening sheet
        window.history.replaceState({}, '', '/appointments');
      }
    } else if (cancelId) {
      const appointment = appointments.find(a => a.id === Number(cancelId));
      if (appointment) {
        setSheetView({ type: 'cancel', appointment });
        window.history.replaceState({}, '', '/appointments');
      }
    } else if (detailsId) {
      const appointment = appointments.find(a => a.id === Number(detailsId));
      if (appointment) {
        setSheetView({ type: 'details', appointment });
        window.history.replaceState({}, '', '/appointments');
      }
    }
  }, [appointments]);

  // Read member filter from URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memberId = params.get('member');

    if (memberId) {
      // Verify the member ID exists in familyMembers
      const memberExists = familyMembers.some(m => String(m.id) === memberId);
      if (memberExists) {
        setMemberFilter(memberId);
      }
    }
  }, []);

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

  const handleShare = (appointment: Appointment) => {
    setShareAppointment(appointment);
  };

  const handleAction = (view: SheetView) => {
    if (view?.type === 'share') {
      handleShare(view.appointment);
      return;
    }
    setSheetView(view);
  };

  if (hasError) {
    return (
      <AppLayout user={user} pageTitle="Appointments" pageIcon="/assets/icons/appointment-selected.svg">
        <ErrorState onRetry={retry} label="Unable to load appointments" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Appointments" pageIcon="/assets/icons/appointment-selected.svg">
        <AppointmentsSkeleton />
      </AppLayout>
    );
  }

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
            size="lg"
            className="font-semibold"
          >
            <Link href="/booking" className="flex items-center gap-2">
              <Icon icon={CalendarPlus} className="h-5 w-5" />
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
              <Icon icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              onAction={handleAction}
            />
          </TabsContent>
          <TabsContent value="past">
            <AppointmentsTable
              appointments={applyFilters(categorized.past)}
              tab="past"
              onAction={handleAction}
            />
          </TabsContent>
          <TabsContent value="cancelled">
            <AppointmentsTable
              appointments={applyFilters(categorized.cancelled)}
              tab="cancelled"
              onAction={handleAction}
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
              onAction={handleAction}
            />
          )}
          {sheetView?.type === 'cancelled_details' && (
            <CancelledDetailsSheet
              appointment={sheetView.appointment}
              onAction={handleAction}
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
          {sheetView?.type === 'book_again' && (
            <BookAgainSheet
              appointment={sheetView.appointment}
              onSuccess={() => handleSheetSuccess('Appointment booked successfully.')}
              onError={(msg) => handleSheetError(msg)}
              onClose={() => setSheetView(null)}
            />
          )}
          {!sheetView && <SheetSkeleton />}
        </SheetContent>
      </Sheet>

      {/* Share Sheet */}
      {shareAppointment && (
        <ShareSheet
          open={!!shareAppointment}
          onOpenChange={(open) => !open && setShareAppointment(null)}
          title={shareAppointment.title}
          description={`${shareAppointment.date_formatted} at ${shareAppointment.time}`}
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/appointments/${shareAppointment.id}`}
        />
      )}

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
    const message = tab === 'upcoming' ? 'No upcoming appointments'
      : tab === 'past' ? 'No past appointments'
      : 'No cancelled appointments';
    return (
      <EmptyState
        icon={Calendar}
        message={message}
        action={tab === 'upcoming' ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/booking">Book an appointment</Link>
          </Button>
        ) : undefined}
      />
    );
  }

  return (
    <div className="border" style={{ borderRadius: '20px' }}>
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
            // Upcoming: no row click (use dropdown for sheet)
            // Past: click navigates to full page
            // Cancelled: click opens side sheet
            const handleRowClick = () => {
              if (tab === 'past') {
                router.visit(`/appointments/${appt.id}`);
              } else if (tab === 'cancelled') {
                onAction({ type: 'cancelled_details', appointment: appt });
              }
            };
            const clickable = tab !== 'upcoming';
            return (
            <TableRow
              key={appt.id}
              className={clickable ? 'cursor-pointer' : ''}
              onClick={clickable ? handleRowClick : undefined}
            >
              <TableCell className="align-top">
                <p className="text-sm font-medium">{appt.date_formatted}</p>
                <p className="text-xs text-muted-foreground">{appt.time}</p>
              </TableCell>
              <TableCell className="align-top">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#BFDBFE' }}
                  >
                    {appt.type === 'doctor' ? (
                      <Icon icon={Stethoscope} className="h-5 w-5" style={{ color: '#1E40AF' }} />
                    ) : (
                      <Icon icon={TestTube2} className="h-5 w-5" style={{ color: '#1E40AF' }} />
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

      {/* Table Footer */}
      {appointments.length > 0 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-[#E5E5E5]">
          <p className="text-sm text-muted-foreground">
            Showing {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
          </p>
        </div>
      )}
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
          <Icon icon={MoreHorizontal} className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {/* Upcoming: View Details opens side sheet, then actions */}
        {tab === 'upcoming' && (
          <>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'details', appointment })}
            >
              <Icon icon={Eye} className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'reschedule', appointment })}
            >
              <Icon icon={CalendarClock} className="h-4 w-4" />
              Reschedule
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
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onAction({ type: 'cancel', appointment })}
            >
              <Icon icon={XCircle} className="h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          </>
        )}

        {/* Past: View Details navigates to full page */}
        {tab === 'past' && (
          <>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => router.visit(`/appointments/${appointment.id}`)}
            >
              <Icon icon={Eye} className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'share', appointment })}
            >
              <Icon icon={Share2} className="h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'book_again', appointment })}
            >
              <Icon icon={RotateCcw} className="h-4 w-4" />
              Book Again
            </DropdownMenuItem>
          </>
        )}

        {tab === 'cancelled' && (
          <>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'cancelled_details', appointment })}
            >
              <Icon icon={Eye} className="h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => onAction({ type: 'book_again', appointment })}
            >
              <Icon icon={RotateCcw} className="h-4 w-4" />
              Book Again
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

