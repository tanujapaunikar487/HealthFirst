import { Link } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Calendar, ChevronRight } from '@/Lib/icons';

interface LinkedAppointmentProps {
  appointmentId: number;
  date?: string;
  doctorName?: string;
}

export function LinkedAppointment({ appointmentId, date, doctorName }: LinkedAppointmentProps) {
  return (
    <Link href={`/appointments/${appointmentId}`}>
      <Card className="px-6 py-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
            <Calendar className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label text-foreground">Linked appointment</p>
            <p className="text-body text-muted-foreground">
              {date && <span>{date}</span>}
              {date && doctorName && <span> · </span>}
              {doctorName && <span>{doctorName}</span>}
              {!date && !doctorName && <span>View appointment details</span>}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
