import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button, buttonVariants } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { DetailRow } from '@/Components/ui/detail-row';
import { Check, Calendar, Download, Share2, Plus } from '@/Lib/icons';
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

  const handleDownload = () => {
    // Download appointment receipt/details as PDF
    window.open(`/booking/${booking.id}/download`, '_blank');
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
        <Card className="overflow-hidden">
          <div className="divide-y">
            {/* Doctor Booking Details */}
            {isDoctorBooking && (
              <>
                {booking.doctor_name && (
                  <DetailRow label="Doctor">
                    <div>
                      <p className="text-label">{booking.doctor_name}</p>
                      {booking.doctor_specialization && (
                        <p className="text-body text-muted-foreground">{booking.doctor_specialization}</p>
                      )}
                    </div>
                  </DetailRow>
                )}
                {booking.mode && (
                  <DetailRow label="Consultation">
                    <Badge variant="neutral">{booking.mode}</Badge>
                  </DetailRow>
                )}
                {booking.clinic_name && (
                  <DetailRow label="Location">
                    <div>
                      <p className="text-label">{booking.clinic_name}</p>
                      {booking.clinic_address && (
                        <p className="text-body text-muted-foreground">{booking.clinic_address}</p>
                      )}
                    </div>
                  </DetailRow>
                )}
              </>
            )}

            {/* Lab Booking Details */}
            {isLabBooking && (
              <>
                {booking.package_name && (
                  <DetailRow label="Package">{booking.package_name}</DetailRow>
                )}
                {booking.test_names && booking.test_names.length > 0 && (
                  <DetailRow label="Tests">
                    <div className="space-y-1">
                      {booking.test_names.map((test, idx) => (
                        <p key={idx} className="text-body">• {test}</p>
                      ))}
                    </div>
                  </DetailRow>
                )}
                {booking.collection_method && (
                  <DetailRow label="Collection">
                    <div>
                      <p className="text-label">{booking.collection_method}</p>
                      {booking.collection_address && (
                        <p className="text-body text-muted-foreground">{booking.collection_address}</p>
                      )}
                    </div>
                  </DetailRow>
                )}
                {booking.preparation_notes && (
                  <DetailRow label="Preparation">
                    <p className="text-body text-muted-foreground">{booking.preparation_notes}</p>
                  </DetailRow>
                )}
              </>
            )}

            {/* Common Details */}
            <DetailRow label="Patient">{booking.patient_name}</DetailRow>
            <DetailRow label="Date">{dateTime.full}</DetailRow>
            <DetailRow label="Time">{dateTime.time}</DetailRow>
            <DetailRow label="Amount Paid">
              ₹{booking.fee.toLocaleString()}
            </DetailRow>
          </div>
        </Card>

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
            href={`/appointments/${booking.id}`}
            className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'flex-1')}
          >
            View Appointment
          </Link>

          {/* Secondary icon buttons */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleAddToCalendar}
            className={cn(
              'px-4',
              calendarAdded && 'border-success text-success'
            )}
            title="Add to calendar"
          >
            <Icon icon={Calendar} size={20} />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleDownload}
            className="px-4"
            title="Download appointment details"
          >
            <Icon icon={Download} size={20} />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleShare}
            className="px-4"
            title="Share appointment"
          >
            <Icon icon={Share2} size={20} />
          </Button>
        </div>

        {/* Book Another */}
        <div className="text-center">
          <Link href="/booking" className={cn(buttonVariants({ variant: 'ghost', size: 'md' }))}>
            <Icon icon={Plus} size={20} />
            Book Another Appointment
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

