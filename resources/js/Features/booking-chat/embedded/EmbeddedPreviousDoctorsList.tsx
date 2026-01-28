import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Star, Plus } from 'lucide-react';
import { cn } from '@/Lib/utils';
import { format, parseISO } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface PreviousDoctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years: number;
  rating: number;
  reviewCount: number;
  price: number;
  lastVisitDate: string;
  previousSymptoms: string[];
  slots: TimeSlot[];
}

interface Props {
  primaryDoctor: PreviousDoctor;
  otherDoctors: PreviousDoctor[];
  selectedDoctorId: string | null;
  selectedTime: string | null;
  onSelect: (doctorId: string, time: string) => void;
  onSeeOtherDoctors: () => void;
  disabled: boolean;
}

export function EmbeddedPreviousDoctorsList({
  primaryDoctor,
  otherDoctors,
  selectedDoctorId,
  selectedTime,
  onSelect,
  onSeeOtherDoctors,
  disabled,
}: Props) {
  const allDoctors = [primaryDoctor, ...otherDoctors];

  return (
    <div className="space-y-3">
      {/* Doctor cards */}
      <div className="border rounded-xl overflow-hidden divide-y bg-white">
        {allDoctors.map((doctor) => (
          <PreviousDoctorCard
            key={doctor.id}
            doctor={doctor}
            isSelected={selectedDoctorId === doctor.id}
            selectedTime={selectedDoctorId === doctor.id ? selectedTime : null}
            onSelectTime={(time) => onSelect(doctor.id, time)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* See other doctors button */}
      <Button
        variant="outline"
        className="w-full rounded-xl text-sm h-11"
        onClick={onSeeOtherDoctors}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-2" />
        See other doctors instead
      </Button>
    </div>
  );
}

function PreviousDoctorCard({
  doctor,
  isSelected,
  selectedTime,
  onSelectTime,
  disabled,
}: {
  doctor: PreviousDoctor;
  isSelected: boolean;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  disabled: boolean;
}) {
  const formatLastVisit = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'd MMM');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className={cn(
      "p-4 transition-all",
      isSelected && "bg-primary/5 border-l-2 border-l-primary"
    )}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.avatar || undefined} />
            <AvatarFallback className="bg-orange-400 text-white font-medium text-base">
              {getInitial(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm text-foreground">{doctor.name}</p>
            <p className="text-xs text-muted-foreground">
              {doctor.specialization} · {doctor.experience_years} years
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-foreground">{doctor.rating}</span>
              <span className="text-xs text-muted-foreground">
                ({doctor.reviewCount})
              </span>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <Badge variant="outline" className="text-xs text-primary border-primary mb-2 font-normal">
            Last visit: {formatLastVisit(doctor.lastVisitDate)}
          </Badge>
          <p className="font-semibold text-sm text-foreground">₹{doctor.price.toLocaleString()}</p>
        </div>
      </div>

      {/* Previous symptoms */}
      <div className="bg-muted rounded-lg px-3 py-2 mb-3">
        <p className="text-sm">
          <span className="font-semibold text-foreground">Previous:</span>{' '}
          <span className="text-muted-foreground">
            {doctor.previousSymptoms.join(', ')}
          </span>
        </p>
      </div>

      {/* Time slots */}
      <div className="flex flex-wrap gap-2">
        {doctor.slots.map((slot) => (
          <button
            key={slot.time}
            onClick={() => !disabled && slot.available && onSelectTime(slot.time)}
            disabled={disabled || !slot.available}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-normal border transition-all",
              "hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50",
              selectedTime === slot.time && "bg-foreground text-background border-foreground font-medium"
            )}
          >
            {formatTime(slot.time)}
          </button>
        ))}
      </div>
    </div>
  );
}
