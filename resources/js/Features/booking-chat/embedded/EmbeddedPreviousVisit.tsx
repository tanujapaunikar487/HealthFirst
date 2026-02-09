import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Card } from '@/Components/ui/card';
import { Clock } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { format, parseISO } from 'date-fns';
import { getAvatarColor } from '@/Lib/avatar-colors';

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

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
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
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-muted-foreground mb-5">
        <Icon icon={Clock} size={16} />
        <span className="text-label">Previous Visit</span>
      </div>

      {/* Doctor info */}
      <div className="flex items-center gap-3 mb-5">
        <Avatar className="h-10 w-10">
          <AvatarImage src={visit.doctor.avatar || undefined} />
          <AvatarFallback
            className="text-label"
            style={(() => {
              const color = getAvatarColorByName(visit.doctor.name);
              return { backgroundColor: color.bg, color: color.text };
            })()}
          >
            {getInitial(visit.doctor.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-card-title text-foreground">{visit.doctor.name}</p>
          <p className="text-body text-muted-foreground">
            {visit.doctor.specialization} · {formatDate(visit.date)}
          </p>
        </div>
      </div>

      {/* Visit details group */}
      <div className="space-y-2">
        {/* Reason */}
        <p className="text-body">
          <span className="font-semibold text-foreground">Reason:</span>{' '}
          <span className="text-muted-foreground">{visit.reason}</span>
        </p>

        {/* Doctor's notes */}
        <p className="text-body">
          <span className="font-semibold text-foreground">Doctor's notes:</span>{' '}
          <span className="text-muted-foreground">{visit.doctorNotes}</span>
        </p>
      </div>
    </Card>
  );
}
