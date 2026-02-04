import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Clock } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { format, parseISO } from 'date-fns';

interface PreviousVisitData {
  doctor: {
    id: string;
    name: string;
    avatar: string | null;
    specialization: string;
  };
  date: string;
  reason: string;
  doctorNotes: string;
}

interface Props {
  visit: PreviousVisitData;
}

export function EmbeddedPreviousVisit({ visit }: Props) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  // Get initials for avatar
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="border border-border rounded-xl p-4 bg-white space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-primary">
        <Clock className="h-4 w-4" />
        <span className="text-[14px] font-medium">Previous Visit</span>
      </div>

      {/* Doctor info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={visit.doctor.avatar || undefined} />
          <AvatarFallback className="bg-orange-400 text-white text-[14px] font-medium">
            {getInitial(visit.doctor.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-[14px] text-foreground">{visit.doctor.name}</p>
          <p className="text-[14px] text-muted-foreground">
            {visit.doctor.specialization} · {formatDate(visit.date)}
          </p>
        </div>
      </div>

      {/* Reason box */}
      <div className="bg-muted rounded-lg px-3 py-2.5">
        <p className="text-[14px]">
          <span className="font-semibold text-foreground">Reason:</span>{' '}
          <span className="text-muted-foreground">{visit.reason}</span>
        </p>
      </div>

      {/* Doctor's notes */}
      <p className="text-[14px]">
        <span className="font-semibold text-foreground">Doctor's notes:</span>{' '}
        <span className="text-muted-foreground">{visit.doctorNotes}</span>
      </p>
    </div>
  );
}
