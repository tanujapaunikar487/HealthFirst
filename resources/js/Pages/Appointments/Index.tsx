import { useState, useMemo, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Pulse, ErrorState, useSkeletonLoading, SheetSkeleton } from '@/Components/ui/skeleton';
import { EmptyState } from '@/Components/ui/empty-state';
import { CtaBanner } from '@/Components/ui/cta-banner';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import { useFormatPreferences } from '@/Hooks/useFormatPreferences';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import {
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { TablePagination } from '@/Components/ui/table-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/Components/ui/sheet';
import {
  CalendarPlus,
  Copy,
  Calendar,
  AlertTriangle,
  Check,
  User,
  TestTube2,
  FileText,
  Search,
  ChevronRight,
} from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/Components/ui/avatar';
import { getAvatarColor } from '@/Lib/avatar-colors';
import { useToast } from '@/Contexts/ToastContext';
import {
  DetailsSheet,
  CancelledDetailsSheet,
  CancelSheet,
  RescheduleSheet,
  BookAgainSheet,
  type Appointment,
  type SheetView,
} from '@/Components/Appointments/AppointmentSheets';
import { ShareDialog } from '@/Components/ui/share-dialog';

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
    <div className="w-full">
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
  const { formatDate, formatTime } = useFormatPreferences();
  const { showToast } = useToast();
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetView, setSheetView] = useState<SheetView>(null);
  const [shareAppointment, setShareAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');

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

  // Read tab and member filter from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Tab parameter
    const tabParam = params.get('tab');
    if (tabParam === 'past' || tabParam === 'cancelled' || tabParam === 'upcoming') {
      setActiveTab(tabParam);
    }

    // Member filter
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
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }
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
    showToast(message, 'success');
  };

  const handleSheetError = (message: string) => {
    showToast(message, 'error');
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
      <AppLayout user={user} pageTitle="Appointments" pageIcon="/assets/icons/appointment.svg">
        <ErrorState onRetry={retry} label="Unable to load appointments" />
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout user={user} pageTitle="Appointments" pageIcon="/assets/icons/appointment.svg">
        <AppointmentsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      user={user}
      pageTitle="Appointments"
      pageIcon="/assets/icons/appointment.svg"
    >
      <div className="min-h-full flex flex-col w-full">
        {/* Header - Stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1
            className="font-bold text-foreground"
            style={{
              fontSize: '36px',
              lineHeight: '44px',
              letterSpacing: '-1px',
            }}
          >
            Appointments
          </h1>
          {appointments.length > 0 && (
            <Link href="/booking" className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' }) + ' font-semibold'}>
              <Icon icon={CalendarPlus} className="h-5 w-5" />
              Book appointment
            </Link>
          )}
        </div>

        {appointments.length === 0 ? (
          <CtaBanner
            heading="Book your first appointment"
            description="Find doctors, book appointments, and manage your family's health — all in one place."
            buttonText="Book appointment"
            buttonHref="/booking"
            imageSrc="/assets/images/booking.png"
            imageAlt="Book appointment illustration"
          />
        ) : (
        /* Tabs */
        <Tabs value={activeTab} onValueChange={(v) => {
          const newTab = v as typeof activeTab;
          setActiveTab(newTab);
          // Update URL without full page reload
          const url = new URL(window.location.href);
          url.searchParams.set('tab', newTab);
          window.history.pushState({}, '', url.toString());
        }} className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past">
              Past
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled
            </TabsTrigger>
          </TabsList>

          {/* Filters + Search - Stack on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="doctor">Doctor visit</SelectItem>
                  <SelectItem value="lab_test">Lab test</SelectItem>
                </SelectContent>
              </Select>
              {doctors.length > 0 && (
                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                  <SelectTrigger className="w-44 h-9">
                    <SelectValue placeholder="All doctors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All doctors</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={memberFilter} onValueChange={setMemberFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {familyMembers.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.relation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Icon icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground" />
              <Input
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-56"
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
        )}

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
        <ShareDialog
          open={!!shareAppointment}
          onOpenChange={(open) => !open && setShareAppointment(null)}
          title={shareAppointment.title}
          description={`${formatDate(shareAppointment.date)} at ${formatTime(shareAppointment.date)}`}
          url={`${typeof window !== 'undefined' ? window.location.origin : ''}/appointments/${shareAppointment.id}`}
        />
      )}

    </AppLayout>
  );
}

/* ─── Table ─── */

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
}

function AppointmentsTable({
  appointments,
  tab,
  onAction,
}: {
  appointments: Appointment[];
  tab: 'upcoming' | 'past' | 'cancelled';
  onAction: (view: SheetView) => void;
}) {
  const { formatDate, formatTime } = useFormatPreferences();

  if (appointments.length === 0) {
    const message = tab === 'upcoming' ? 'No upcoming appointments'
      : tab === 'past' ? 'No past appointments'
      : 'No cancelled appointments';
    const description = tab === 'upcoming' ? 'Book an appointment to get started.'
      : tab === 'past' ? 'Your completed appointments will appear here.'
      : 'Cancelled appointments will appear here.';
    return (
      <EmptyState
        image="/assets/images/booking.png"
        message={message}
        description={description}
        action={tab === 'upcoming' ? (
          <Link href="/booking" className={buttonVariants({ variant: 'secondary', size: 'sm' })}>
            Book an appointment
          </Link>
        ) : undefined}
      />
    );
  }

  return (
    <>
      {/* Mobile Card View - visible on mobile only */}
      <div className="md:hidden space-y-3">
        {appointments.map((appt) => {
          const handleCardClick = () => {
            if (tab === 'upcoming') {
              onAction({ type: 'details', appointment: appt });
            } else if (tab === 'past') {
              router.visit(`/appointments/${appt.id}`);
            } else if (tab === 'cancelled') {
              onAction({ type: 'cancelled_details', appointment: appt });
            }
          };

          return (
            <Card key={appt.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleCardClick}>
              <CardContent className="p-0">
                <div className="px-6 py-4 space-y-4">
                  {/* Header: Avatar/Icon + Title + Status */}
                  <div className="flex items-start gap-3">
                    {appt.type === 'doctor' ? (
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={appt.doctor_avatar_url || undefined} alt={appt.title} />
                        <AvatarFallback
                          className="text-label"
                          style={(() => {
                            const color = getAvatarColorByName(appt.title);
                            return { backgroundColor: color.bg, color: color.text };
                          })()}
                        >
                          {appt.title.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-200">
                        <Icon icon={TestTube2} className="h-5 w-5 text-blue-800" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-label truncate">{appt.title}</p>
                      <p className="text-body text-muted-foreground truncate">
                        {appt.mode}
                        {appt.subtitle ? ` • ${appt.subtitle}` : ''}
                      </p>
                    </div>
                    <PaymentStatusTag status={appt.payment_status} />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Date & Time</p>
                      <p className="text-label">{formatDate(appt.date)}</p>
                      <p className="text-body text-muted-foreground">{formatTime(appt.date)}</p>
                    </div>
                    <div>
                      <p className="text-caption text-muted-foreground mb-1">Amount</p>
                      <p className="text-label">₹{appt.fee.toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-caption text-muted-foreground mb-1">Family Member</p>
                      <p className="text-label">{appt.patient_name}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  {tab === 'past' && appt.type === 'lab_test' && appt.health_record_id && (
                    <Link
                      href={`/health-records/${appt.health_record_id}`}
                      className={buttonVariants({ variant: 'outline', size: 'md', className: 'w-full' })}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon icon={FileText} size={20} />
                      View Results
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop Table View - hidden on mobile */}
      <TableContainer className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-col-date">Date</TableHead>
              <TableHead className="max-w-col-details">Details</TableHead>
              <TableHead className="w-col-member">Family member</TableHead>
              <TableHead className="w-col-amount text-right">Amount</TableHead>
              <TableHead className="w-col-status">Status</TableHead>
              <TableHead className="w-col-actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appt) => {
            // All rows are clickable - each tab has its own details pattern
            const handleRowClick = () => {
              if (tab === 'upcoming') {
                onAction({ type: 'details', appointment: appt });
              } else if (tab === 'past') {
                router.visit(`/appointments/${appt.id}`);
              } else if (tab === 'cancelled') {
                onAction({ type: 'cancelled_details', appointment: appt });
              }
            };
            return (
            <TableRow
              key={appt.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={handleRowClick}
            >
              <TableCell className="align-top">
                <p className="text-label whitespace-nowrap">{formatDate(appt.date) || '—'}</p>
                <p className="text-body text-muted-foreground">{formatTime(appt.date) || '—'}</p>
              </TableCell>
              <TableCell className="max-w-col-details align-top">
                <div className="flex items-center gap-2.5">
                  {appt.type === 'doctor' ? (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={appt.doctor_avatar_url || undefined} alt={appt.title} />
                      <AvatarFallback
                        className="text-label"
                        style={(() => {
                          const color = getAvatarColorByName(appt.title);
                          return { backgroundColor: color.bg, color: color.text };
                        })()}
                      >
                        {appt.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-200">
                      <Icon icon={TestTube2} className="h-5 w-5 text-blue-800" />
                    </div>
                  )}
                  <div>
                    <p className="text-label">{appt.title}</p>
                    <p className="text-body text-muted-foreground">
                      {appt.mode}
                      {appt.subtitle ? ` • ${appt.subtitle}` : ''}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="align-top">
                <p className="text-label whitespace-nowrap">{appt.patient_name}</p>
              </TableCell>
              <TableCell className="align-top text-right">
                <p className="text-label">₹{appt.fee.toLocaleString()}</p>
              </TableCell>
              <TableCell className="align-top">
                <PaymentStatusTag status={appt.payment_status} />
              </TableCell>
              <TableCell className="align-top w-1">
                {tab === 'past' && appt.type === 'lab_test' && appt.health_record_id ? (
                  <Link
                    href={`/health-records/${appt.health_record_id}`}
                    className={buttonVariants({ variant: 'secondary', size: 'md' })}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="h-5 w-5" />
                  </Link>
                ) : (
                  <Button variant="secondary" iconOnly size="md"><ChevronRight className="h-5 w-5" /></Button>
                )}
              </TableCell>
            </TableRow>
            );
          })}
          </TableBody>
        </Table>

        <TablePagination
          from={1}
          to={appointments.length}
          total={appointments.length}
          itemLabel={appointments.length === 1 ? 'appointment' : 'appointments'}
        />
      </TableContainer>

      {/* Mobile Pagination - Only show count on mobile */}
      <div className="md:hidden mt-4 text-center">
        <p className="text-body text-muted-foreground">
          Showing {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
        </p>
      </div>
    </>
  );
}

/* ─── Payment Status Tag ─── */

function PaymentStatusTag({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' }> = {
    paid: { label: 'Paid', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    partially_refunded: { label: 'Partially refunded', variant: 'warning' },
    fully_refunded: { label: 'Refunded', variant: 'danger' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'neutral' as const };

  return <Badge variant={variant}>{label}</Badge>;
}


