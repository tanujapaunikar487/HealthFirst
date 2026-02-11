import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button, buttonVariants } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { DetailCard } from '@/Components/ui/detail-card';
import { Check, Calendar, Share2 } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { useAccessibilityPreferences } from '@/Hooks/useAccessibilityPreferences';
import { Badge } from '@/Components/ui/badge';

interface Booking {
  id: string;
  booking_id: string;
  type: 'doctor' | 'lab_test';
  status: string;
  patient_name: string;
  doctor_name?: string;
  doctor_specialization?: string;
  clinic_name?: string;
  clinic_address?: string;
  package_name?: string;
  test_names?: string[];
  collection_method?: string;
  collection_address?: string;
  date: string;
  time: string;
  mode?: string;
  fee: number;
  preparation_notes?: string;
}

interface CalendarPreference {
  preferred: 'google' | 'apple' | null;
  googleConnected: boolean;
}

interface Props {
  booking: Booking;
  calendarPreference?: CalendarPreference;
}

export default function Confirmation({ booking, calendarPreference }: Props) {
  // Apply user accessibility preferences
  useAccessibilityPreferences();

  const [calendarAdded, setCalendarAdded] = useState(false);

  const pref = calendarPreference?.preferred ?? null;
  const googleSynced = pref === 'google' && (calendarPreference?.googleConnected ?? false);

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(date);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[dateObj.getDay()];
      const day = dateObj.getDate();
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();

      return {
        full: `${dayName}, ${day} ${month} ${year}`,
        time: time
      };
    } catch {
      return {
        full: date,
        time: time
      };
    }
  };

  const handleAddToCalendar = () => {
    const link = document.createElement('a');
    link.href = `/booking/${booking.id}/calendar/download`;
    link.download = `appointment-${booking.booking_id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setCalendarAdded(true);
  };

  const handleShare = () => {
    // Share appointment details
    if (navigator.share) {
      navigator.share({
        title: 'Appointment Details',
        text: `Appointment with ${booking.doctor_name || 'Healthcare Provider'} on ${formatDateTime(booking.date, booking.time).full} at ${booking.time}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const dateTime = formatDateTime(booking.date, booking.time);
  const isDoctorBooking = booking.type === 'doctor';
  const isLabBooking = booking.type === 'lab_test';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background flex items-center justify-center p-6">
      <div className="w-full" style={{ maxWidth: '500px' }}>
        <div className="space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
            <Icon icon={Check} className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-detail-title">Booking confirmed!</h1>
          <p className="text-body text-muted-foreground">
            Booking ID: <span className="text-foreground font-medium">{booking.booking_id}</span>
          </p>
          <p className="text-body text-muted-foreground">
            Confirmation sent to your email and phone
          </p>
        </div>

        {/* Appointment Details Card */}
        <DetailCard
          rows={[
            // Doctor Booking Details
            ...(isDoctorBooking && booking.doctor_name
              ? [
                  {
                    label: 'Doctor',
                    children: (
                      <div>
                        <p className="text-label">{booking.doctor_name}</p>
                        {booking.doctor_specialization && (
                          <p className="text-body text-muted-foreground">{booking.doctor_specialization}</p>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
            ...(isDoctorBooking && booking.mode
              ? [
                  {
                    label: 'Consultation',
                    children: <Badge variant="neutral">{booking.mode}</Badge>,
                  },
                ]
              : []),
            ...(isDoctorBooking && booking.clinic_name
              ? [
                  {
                    label: 'Location',
                    children: (
                      <div>
                        <p className="text-label">{booking.clinic_name}</p>
                        {booking.clinic_address && (
                          <p className="text-body text-muted-foreground">{booking.clinic_address}</p>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
            // Lab Booking Details
            ...(isLabBooking && booking.package_name
              ? [{ label: 'Package', children: booking.package_name }]
              : []),
            ...(isLabBooking && booking.test_names && booking.test_names.length > 0
              ? [
                  {
                    label: 'Tests',
                    children: (
                      <div className="space-y-1">
                        {booking.test_names.map((test, idx) => (
                          <p key={idx} className="text-body">• {test}</p>
                        ))}
                      </div>
                    ),
                  },
                ]
              : []),
            ...(isLabBooking && booking.collection_method
              ? [
                  {
                    label: 'Collection',
                    children: (
                      <div>
                        <p className="text-label">{booking.collection_method}</p>
                        {booking.collection_address && (
                          <p className="text-body text-muted-foreground">{booking.collection_address}</p>
                        )}
                      </div>
                    ),
                  },
                ]
              : []),
            ...(isLabBooking && booking.preparation_notes
              ? [
                  {
                    label: 'Preparation',
                    children: <p className="text-body text-muted-foreground">{booking.preparation_notes}</p>,
                  },
                ]
              : []),
            // Common Details
            { label: 'Patient', children: booking.patient_name },
            { label: 'Date', children: dateTime.full },
            { label: 'Time', children: dateTime.time },
            { label: 'Amount Paid', children: `₹${booking.fee.toLocaleString()}` },
          ]}
        />

        {/* Calendar sync status */}
        {googleSynced && (
          <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Icon icon={Check} className="h-5 w-5 text-success" />
            <p className="text-body text-success-subtle-foreground">
              Synced to your Google Calendar
            </p>
          </div>
        )}

        {/* Primary Action + Secondary Icon Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/appointments?details=${booking.id}`}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'flex-1')}
          >
            View Appointment
          </Link>

          {/* Secondary icon buttons */}
          <Button
            variant="outline"
            onClick={handleAddToCalendar}
            className={cn(
              'w-11 h-11 p-0',
              calendarAdded && 'border-success text-success'
            )}
            title="Add to calendar"
          >
            <Icon icon={Calendar} size={20} />
          </Button>

          <Button
            variant="outline"
            onClick={handleShare}
            className="w-11 h-11 p-0"
            title="Share appointment"
          >
            <Icon icon={Share2} size={20} />
          </Button>
        </div>

        </div>
      </div>
    </div>
  );
}

