import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Star, Plus } from '@/Lib/icons';
import { Icon } from '@/Components/ui/icon';
import { cn } from '@/Lib/utils';
import { format, parseISO } from 'date-fns';
import { getAvatarColor } from '@/Lib/avatar-colors';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface PreviousDoctor {
  id: string;
  name: string;
  avatar: string | null;
  specialization: string;
  experience_years?: number;
  rating?: number;
  reviewCount?: number;
  price?: number;
  last_visit?: string; // Backend sends this
  lastVisitDate?: string; // Legacy field
  previousSymptoms?: string[];
  slots?: TimeSlot[];
  // New fields from backend enhancement
  available_on_date?: boolean;
  availability_message?: string;
  quick_times?: string[];
  consultation_modes?: string[];
  video_fee?: number;
  in_person_fee?: number;
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

function getAvatarColorByName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return getAvatarColor(Math.abs(hash));
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
    <div className="space-y-4">
      {/* Doctor cards */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 divide-y">
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
        </CardContent>
      </Card>

      {/* See other doctors button */}
      <Button
        variant="secondary"
        className="w-full"
        onClick={onSeeOtherDoctors}
        disabled={disabled}
      >
        <Icon icon={Plus} size={16} className="mr-2" />
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
  const formatLastVisit = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
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

  // Get price display - use new fields if available
  const getPrice = () => {
    const videoFee = doctor.video_fee ?? 0;
    const inPersonFee = doctor.in_person_fee ?? 0;
    const legacyPrice = doctor.price;

    if (videoFee && inPersonFee) {
      return `₹${videoFee.toLocaleString()} / ${inPersonFee.toLocaleString()}`;
    }

    const fee = videoFee || inPersonFee || legacyPrice;
    return fee ? `₹${fee.toLocaleString()}` : 'Price not available';
  };

  return (
    <div
      className={cn(
        "px-6 py-4 transition-all",
        "hover:bg-muted/50",
        isSelected
          ? disabled ? "bg-primary/10 opacity-60" : "bg-primary/10"
          : disabled ? "opacity-30" : ""
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="h-12 w-12">
            <AvatarImage src={doctor.avatar || undefined} />
            <AvatarFallback
              style={(() => {
                const color = getAvatarColorByName(doctor.name);
                return { backgroundColor: color.bg, color: color.text };
              })()}
            >
              {getInitial(doctor.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <p className="text-label leading-none">{doctor.name}</p>
            <p className="text-body text-muted-foreground">
              {doctor.specialization} {doctor.experience_years ? `· ${doctor.experience_years} years` : ''}
            </p>
            {doctor.rating && (
              <div className="flex items-center gap-1">
                <Icon icon={Star} size={14} className="fill-warning text-warning" />
                <span className="text-label">{doctor.rating}</span>
                {doctor.reviewCount && (
                  <span className="text-body text-muted-foreground">
                    ({doctor.reviewCount})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Show availability message if available */}
          {doctor.availability_message ? (
            <Badge
              variant={doctor.available_on_date ? 'success' : 'danger'}
            >
              {doctor.availability_message}
            </Badge>
          ) : (
            <Badge variant="info">
              Last: {formatLastVisit(doctor.last_visit || doctor.lastVisitDate)}
            </Badge>
          )}

          {/* Show consultation modes if available */}
          {doctor.consultation_modes && doctor.consultation_modes.length > 0 && (
            <div className="flex gap-1">
              {doctor.consultation_modes.includes('video') && (
                <Badge variant="neutral">
                  Video
                </Badge>
              )}
              {doctor.consultation_modes.includes('in_person') && (
                <Badge variant="neutral">
                  In-person
                </Badge>
              )}
            </div>
          )}

          <p className="text-label">{getPrice()}</p>
        </div>
      </div>

      {/* Previous symptoms (optional) */}
      {doctor.previousSymptoms && doctor.previousSymptoms.length > 0 && (
        <div className="bg-muted rounded-lg p-3 mb-3">
          <p className="text-body">
            <span className="font-medium">Previous:</span>{' '}
            <span className="text-muted-foreground">
              {doctor.previousSymptoms.join(', ')}
            </span>
          </p>
        </div>
      )}

      {/* Quick time slots or full time slots */}
      {doctor.available_on_date === false ? (
        <div className="text-body text-muted-foreground italic">
          No available slots on the selected date
        </div>
      ) : (
        <div className="space-y-2">
          {/* Show quick times if available (from backend enhancement) */}
          {doctor.quick_times && doctor.quick_times.length > 0 ? (
            <>
              <p className="text-body text-muted-foreground">Quick available times:</p>
              <div className="flex flex-wrap gap-2">
                {doctor.quick_times.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'accent' : 'outline'}
                    onClick={() => !disabled && onSelectTime(time)}
                    disabled={disabled}
                    className={cn(
                      "h-auto px-3 py-1.5 rounded-full text-label",
                      "disabled:opacity-60",
                      selectedTime === time && "border-foreground"
                    )}
                  >
                    {formatTime(time)}
                  </Button>
                ))}
              </div>
            </>
          ) : doctor.slots && doctor.slots.length > 0 ? (
            /* Fallback to full slots if available */
            <div className="flex flex-wrap gap-2">
              {doctor.slots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? 'accent' : 'outline'}
                  onClick={() => !disabled && slot.available && onSelectTime(slot.time)}
                  disabled={disabled || !slot.available}
                  className={cn(
                    "h-auto px-3 py-1.5 rounded-full text-label",
                    "disabled:opacity-60",
                    selectedTime === slot.time && "border-foreground"
                  )}
                >
                  {formatTime(slot.time)}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
