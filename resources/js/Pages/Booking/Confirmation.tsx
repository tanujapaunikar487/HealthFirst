import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button, buttonVariants } from '@/Components/ui/button';
import { cn } from '@/Lib/utils';
import { Card } from '@/Components/ui/card';
import { AddToCalendarButton } from '@/Components/AddToCalendarButton';
import { Check, Info, Plus, Download } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';

interface Booking {
  id: string;
  booking_id: string;
  type: 'doctor' | 'lab_test';
  status: string;
  patient_name: string;
  doctor_name?: string;
  package?: string;
  date: string;
  time: string;
  mode?: string;
  fee: number;
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
  const [icsDownloaded, setIcsDownloaded] = useState(false);

  const pref = calendarPreference?.preferred ?? null;
  const googleSynced = pref === 'google' && (calendarPreference?.googleConnected ?? false);
  const applePreferred = pref === 'apple';

  const formatDateTime = (date: string, time: string) => {
    try {
      const dateObj = new Date(date);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = days[dateObj.getDay()];
      const day = dateObj.getDate();
      const month = months[dateObj.getMonth()];

      return `${dayName}, ${day} ${month} • ${time}`;
    } catch {
      return `${date} • ${time}`;
    }
  };

  const getWhatsNextItems = () => {
    const items = [
      'Confirmation sent to email & phone',
      'Reminders 24 hrs and 1 hr before',
    ];
    if (googleSynced) {
      items.push('Synced to your Google Calendar');
    } else if (applePreferred) {
      items.push('Download calendar file on this page');
    } else {
      items.push('Add to your calendar on this page');
    }
    return items;
  };

  const handleDownloadIcs = () => {
    const link = document.createElement('a');
    link.href = `/booking/${booking.id}/calendar/download`;
    link.download = `appointment-${booking.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIcsDownloaded(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
            <Icon icon={Check} className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Booking confirmed!</h1>
          <p className="text-muted-foreground mt-1">Booking ID: {booking.booking_id}</p>
        </div>

        {/* Details card */}
        <Card className="overflow-hidden bg-white divide-y">
          {/* Doctor/Package row */}
          {booking.doctor_name && (
            <DetailRow label="Doctor" value={booking.doctor_name} />
          )}
          {booking.package && <DetailRow label="Package" value={booking.package} />}

          {/* Patient row */}
          <DetailRow label="Patient" value={booking.patient_name} />

          {/* Type row (doctor only) */}
          {booking.mode && (
            <DetailRow label="Type" value={booking.mode} />
          )}

          {/* Date & Time row */}
          <DetailRow label="Date & Time" value={formatDateTime(booking.date, booking.time)} />

          {/* Amount row */}
          <DetailRow label="Amount Paid" value={`₹${booking.fee.toLocaleString()}`} />
        </Card>

        {/* What's next box */}
        <div className="bg-primary/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Icon icon={Info} className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[14px] mb-2">What's next?</p>
              <ul className="space-y-1">
                {getWhatsNextItems().map((item, i) => (
                  <li key={i} className="text-[14px] text-foreground flex items-start gap-2">
                    <span>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          {googleSynced ? (
            <div className="w-full px-6 py-3 rounded-full font-medium text-base bg-success text-white flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Synced to Google Calendar</span>
            </div>
          ) : applePreferred ? (
            <Button
              variant="primary"
              onClick={handleDownloadIcs}
              disabled={icsDownloaded}
              className={cn(
                'w-full h-auto px-6 py-3 rounded-full font-medium text-base flex items-center justify-center gap-2 transition-all duration-200',
                icsDownloaded && 'bg-success text-white cursor-default hover:bg-success'
              )}
            >
              {icsDownloaded ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Downloaded</span>
                </>
              ) : (
                <>
                  <Icon icon={Download} className="w-5 h-5" />
                  <span>Add to Apple Calendar</span>
                </>
              )}
            </Button>
          ) : (
            <AddToCalendarButton
              conversationId={booking.id}
              variant="primary"
            />
          )}
          <Link href="/appointments" className={cn(buttonVariants({ variant: 'secondary', size: 'md' }), 'w-full')}>
            View My Appointments
          </Link>
          <Link href="/booking" className={cn(buttonVariants({ variant: 'ghost', size: 'md' }), 'w-full')}>
            <Icon icon={Plus} className="h-[20px] w-[20px]" />
            Book Another Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-[14px] text-muted-foreground">{label}</span>
      <div className="text-[14px] text-right font-medium">{value}</div>
    </div>
  );
}
