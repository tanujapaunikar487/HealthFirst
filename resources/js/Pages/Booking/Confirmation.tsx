import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { AddToCalendarButton } from '@/Components/AddToCalendarButton';
import { Check, Info, Plus } from '@/Lib/icons';
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

interface Props {
  booking: Booking;
}

export default function Confirmation({ booking }: Props) {
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
    if (booking.type === 'doctor') {
      items.push('Video link sent 30 min before');
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
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
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
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
          <AddToCalendarButton
            conversationId={booking.id}
            variant="primary"
          />
          <Button
            variant="outline"
            asChild
            size="lg"
            className="w-full"
          >
            <Link href="/appointments">View My Appointments</Link>
          </Button>
          <Button
            variant="ghost"
            asChild
            size="lg"
            className="w-full"
          >
            <Link href="/booking" className="flex items-center gap-2">
              <Icon icon={Plus} className="h-[20px] w-[20px]" />
              Book Another Appointment
            </Link>
          </Button>
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
